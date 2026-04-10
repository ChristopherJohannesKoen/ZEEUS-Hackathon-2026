import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { chromium, type Browser } from 'playwright';
import {
  serializeReportAsCsv,
  ReportResponseSchema,
  type EvaluationNarrativeKind,
  type ReportResponse
} from '@packages/shared';
import { z } from 'zod';

const queueName = 'zeeus-evaluation-jobs';
const apiOrigin = (process.env.API_ORIGIN ?? 'http://localhost:4000').replace(/\/$/, '');
const webInternalOrigin = (process.env.WEB_INTERNAL_ORIGIN ?? 'http://localhost:3000').replace(
  /\/$/,
  ''
);
const internalServiceToken = process.env.INTERNAL_SERVICE_TOKEN ?? '';
const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
const artifactsRoot = path.resolve(process.env.ARTIFACTS_DIR ?? '.artifacts-worker');
const aiProvider = (process.env.AI_PROVIDER ?? 'openai').trim().toLowerCase();
const openAiApiKey = process.env.OPENAI_API_KEY?.trim() ?? '';
const openAiBaseUrl = (process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1').replace(
  /\/$/,
  ''
);
const openAiModel = process.env.OPENAI_MODEL?.trim() || 'gpt-5.4-mini';
const narrativePromptVersion = '2026.04.ready-software.3';
const builtinNarrativePromptVersion = `${narrativePromptVersion}+builtin.1`;

const artifactJobSchema = z.object({
  id: z.string(),
  evaluationId: z.string(),
  evaluationName: z.string(),
  revisionId: z.string(),
  revisionNumber: z.number().int().min(1),
  kind: z.enum(['csv', 'pdf', 'ai_explanation']),
  filename: z.string(),
  mimeType: z.string(),
  report: ReportResponseSchema
});

const narrativeJobSchema = z.object({
  id: z.string(),
  evaluationId: z.string(),
  revisionId: z.string(),
  revisionNumber: z.number().int().min(1),
  kind: z.enum([
    'executive_summary',
    'material_topics',
    'risks_opportunities',
    'evidence_guidance'
  ]),
  report: ReportResponseSchema,
  guidanceArticles: z.array(
    z.object({
      id: z.string(),
      slug: z.string(),
      title: z.string(),
      summary: z.string(),
      category: z.string()
    })
  )
});

const openAiResponseSchema = z.object({
  output_text: z.string().optional(),
  usage: z
    .object({
      input_tokens: z.number().int().nonnegative().optional(),
      output_tokens: z.number().int().nonnegative().optional()
    })
    .optional()
});

class ArtifactStorage {
  private readonly bucket = process.env.S3_BUCKET?.trim();
  private readonly useS3 = Boolean(this.bucket && process.env.S3_ACCESS_KEY_ID);
  private readonly s3Client = this.useS3
    ? new S3Client({
        region: process.env.S3_REGION || 'us-east-1',
        endpoint: process.env.S3_ENDPOINT || undefined,
        forcePathStyle: String(process.env.S3_FORCE_PATH_STYLE ?? 'false') === 'true',
        credentials:
          process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY
            ? {
                accessKeyId: process.env.S3_ACCESS_KEY_ID,
                secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
              }
            : undefined
      })
    : null;

  buildStorageKey(checksumSha256: string, filename: string) {
    const extension = path.extname(filename);
    return path.posix.join(
      'artifacts',
      checksumSha256.slice(0, 2),
      `${checksumSha256}${extension}`
    );
  }

  async writeObject(storageKey: string, content: Buffer, mimeType: string) {
    if (!this.useS3 || !this.s3Client || !this.bucket) {
      const targetPath = path.join(artifactsRoot, storageKey.replaceAll('/', path.sep));
      await mkdir(path.dirname(targetPath), { recursive: true });
      await writeFile(targetPath, content);
      return;
    }

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: storageKey,
        Body: content,
        ContentType: mimeType
      })
    );
  }
}

const storage = new ArtifactStorage();
let browserPromise: Promise<Browser> | undefined;

function getInternalHeaders() {
  if (!internalServiceToken) {
    throw new Error('INTERNAL_SERVICE_TOKEN must be configured for the worker.');
  }

  return {
    'x-internal-service-token': internalServiceToken
  };
}

async function internalApiRequest(pathname: string, init?: RequestInit) {
  const response = await fetch(`${apiOrigin}/api/internal/evaluations${pathname}`, {
    ...init,
    headers: {
      ...getInternalHeaders(),
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Internal API ${pathname} failed (${response.status}): ${body}`);
  }

  return response;
}

async function getBrowser() {
  browserPromise ??= chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });

  return browserPromise;
}

function buildNarrativeInstructions(kind: EvaluationNarrativeKind, report: ReportResponse) {
  const topTopic = report.dashboard.materialAlerts[0];
  const topRisk = report.dashboard.topRisks[0];
  const topOpportunity = report.dashboard.topOpportunities[0];

  if (kind === 'executive_summary') {
    return [
      'Write an executive summary for the startup assessment.',
      'Use 3 short paragraphs.',
      'Explain the financial, risk, and opportunity totals in plain language.',
      topTopic
        ? `Call out ${topTopic.title} as the strongest inside-out materiality signal.`
        : 'State clearly that no material topics crossed the threshold yet.',
      topOpportunity
        ? `Mention ${topOpportunity.title} as the strongest opportunity signal.`
        : 'State clearly that no opportunity is above neutral yet.',
      topRisk
        ? `Mention ${topRisk.title} as the strongest external risk signal.`
        : 'State clearly that no risk is above neutral yet.',
      'Stay factual and advisory. Do not invent data or change any deterministic conclusion.'
    ].join('\n');
  }

  if (kind === 'material_topics') {
    return [
      'Explain the Stage I materiality profile.',
      `Use ${topTopic?.title ?? 'the saved topic scores'} as the anchor example.`,
      'Clarify the difference between relevant and high-priority topics.',
      report.dashboard.sensitivityHints[0]
        ? `Include this near-threshold sensitivity hint: ${report.dashboard.sensitivityHints[0].message}`
        : 'State that no near-threshold shifts were detected from the saved assumptions.',
      'Suggest what evidence would most improve confidence next.'
    ].join('\n');
  }

  if (kind === 'risks_opportunities') {
    return [
      'Explain the most material outside-in risks and opportunities.',
      topRisk
        ? `Anchor the risk explanation on ${topRisk.title}.`
        : 'State that no external risk is above neutral.',
      topOpportunity
        ? `Anchor the opportunity explanation on ${topOpportunity.title}.`
        : 'State that no external opportunity is above neutral.',
      'Use concise language and finish with next-step guidance.'
    ].join('\n');
  }

  return [
    'Explain what evidence should be collected next.',
    `The current confidence band is ${report.dashboard.confidenceBand}.`,
    'Differentiate measured, estimated, and assumed evidence.',
    'Recommend the next evidence package for the highest-priority topic, strongest risk, and strongest opportunity.',
    'Keep it practical and non-technical.'
  ].join('\n');
}

function articleHrefFromSlug(slug: string) {
  if (slug === 'how-it-works') {
    return '/how-it-works';
  }

  if (slug === 'methodology') {
    return '/methodology';
  }

  if (slug === 'sdg-esrs-explainer') {
    return '/sdg-esrs';
  }

  if (slug === 'partner-programs') {
    return '/partners';
  }

  if (slug === 'contact-support') {
    return '/contact';
  }

  return null;
}

function buildNarrativePrompt(
  kind: EvaluationNarrativeKind,
  report: ReportResponse,
  guidanceArticles: Array<{ title: string; summary: string; category: string }>
) {
  return [
    'You are writing a sustainability startup assessment narrative for ZEEUS.',
    'The deterministic report data below is authoritative. You must not alter, reinterpret, or override any scores, thresholds, SDG mappings, or recommendations.',
    'Use the provided report data, guidance content, and evidence summary only.',
    'Do not mention AI, probabilities, or hidden calculations.',
    'Keep the tone concise, professional, and startup-friendly.',
    'Where useful, echo the language of the evidence basis and cite the most relevant guidance source by title in the prose.',
    '',
    'Task instructions:',
    buildNarrativeInstructions(kind, report),
    '',
    'Guidance context:',
    JSON.stringify(guidanceArticles),
    '',
    'Deterministic report payload:',
    JSON.stringify(report)
  ].join('\n');
}

function buildNarrativeSourceReferences(
  kind: EvaluationNarrativeKind,
  report: ReportResponse,
  guidanceArticles: Array<{ id: string; slug: string; title: string; summary: string }>
) {
  const references = [
    {
      type: 'report_section' as const,
      id: kind,
      label:
        kind === 'executive_summary'
          ? 'Report: Executive summary metrics'
          : kind === 'material_topics'
            ? 'Report: Stage I materiality'
            : kind === 'risks_opportunities'
              ? 'Report: Stage II risks and opportunities'
              : 'Report: Evidence appendix',
      href: null,
      description: `Revision ${report.evaluation.currentRevisionNumber} snapshot`
    },
    ...guidanceArticles.slice(0, 2).map((article) => ({
      type: 'guidance_article' as const,
      id: article.id,
      label: article.title,
      href: articleHrefFromSlug(article.slug),
      description: article.summary
    })),
    ...report.evidenceSummary.items.slice(0, 3).map((item) => ({
      type: 'evidence_item' as const,
      id: item.id,
      label: item.title,
      href: `/app/evaluate/${report.evaluation.id}/evidence`,
      description: item.fileName ?? item.sourceUrl ?? item.evidenceBasis
    }))
  ];

  return references;
}

function buildBuiltinNarrative(
  kind: EvaluationNarrativeKind,
  report: ReportResponse,
  guidanceArticles: Array<{
    id: string;
    slug: string;
    title: string;
    summary: string;
    category: string;
  }>
) {
  const topTopic = report.dashboard.materialAlerts[0];
  const topRisk = report.dashboard.topRisks[0];
  const topOpportunity = report.dashboard.topOpportunities[0];
  const guidanceTitles = guidanceArticles.slice(0, 2).map((article) => article.title);
  const guidanceLabel =
    guidanceTitles.length > 0 ? ` Useful background: ${guidanceTitles.join(' and ')}.` : '';
  const evidenceCounts = report.evidenceSummary.items.reduce(
    (counts, item) => {
      counts[item.evidenceBasis] += 1;
      return counts;
    },
    { measured: 0, estimated: 0, assumed: 0 }
  );

  let content: string;

  switch (kind) {
    case 'executive_summary':
      content = [
        `${report.evaluation.name} currently shows a financial total of ${report.dashboard.financialTotal}/12, an overall risk score of ${report.dashboard.riskOverall}, an overall opportunity score of ${report.dashboard.opportunityOverall}, and a ${report.dashboard.confidenceBand} confidence band. This gives the team an early view of where resilience is forming, where exposure is building, and where sustainability may strengthen future positioning.`,
        topTopic
          ? `${topTopic.title} is the strongest inside-out materiality signal at this stage, with a ${topTopic.priorityBand.replace('_', ' ')} band and a score of ${topTopic.score}.`
          : 'No Stage I topic has crossed the materiality threshold yet, so the current result should be treated as exploratory and assumption-led.',
        topRisk || topOpportunity
          ? `${topRisk ? `${topRisk.title} is the strongest outside-in risk signal` : 'No outside-in risk is above neutral yet'}, while ${topOpportunity ? `${topOpportunity.title} is the strongest opportunity signal` : 'no outside-in opportunity is above neutral yet'}. The best next move is to improve evidence around the top topic, top risk, and top opportunity before treating any result as stable.${guidanceLabel}`
          : `The current profile remains exploratory, so the best next step is to improve evidence quality before treating any result as stable.${guidanceLabel}`
      ].join('\n\n');
      break;
    case 'material_topics':
      content = [
        `${report.evaluation.name} currently has ${report.impactSummary.relevantTopics.length} relevant material topics and ${report.impactSummary.highPriorityTopics.length} high-priority topics. The practical goal now is to narrow attention to the few issues that genuinely deserve founder time.`,
        topTopic
          ? `${topTopic.title} is the leading Stage I topic. Its current band is ${topTopic.priorityBand.replace('_', ' ')}, which means it should guide evidence collection, design trade-offs, and how the venture explains sustainability relevance to partners or funders.`
          : 'No topic has crossed the materiality threshold yet, which usually means either the venture is still very early or the underlying assumptions need sharpening.',
        report.dashboard.sensitivityHints[0]
          ? `${report.dashboard.sensitivityHints[0].message} The next evidence package should focus on the inputs most likely to move that topic between bands.${guidanceLabel}`
          : `The next evidence package should focus on turning the highest-scoring assumptions into measured or better-supported estimates.${guidanceLabel}`
      ].join('\n\n');
      break;
    case 'risks_opportunities':
      content = [
        `${report.evaluation.name} currently combines an overall risk score of ${report.dashboard.riskOverall} with an overall opportunity score of ${report.dashboard.opportunityOverall}. This outside-in view helps the team see how sustainability-related conditions could affect execution, resilience, and market fit.`,
        topRisk
          ? `${topRisk.title} is the strongest current risk signal. It should be treated as a planning input: clarify exposure, identify assumptions that could fail, and decide what evidence would reduce uncertainty fastest.`
          : 'No outside-in risk is currently above neutral, which means the saved answers do not yet point to a concentrated external sustainability threat.',
        topOpportunity
          ? `${topOpportunity.title} is the strongest opportunity signal. It may represent a differentiation path if the team can back it with operational evidence, customer relevance, and a realistic delivery plan.${guidanceLabel}`
          : `No outside-in opportunity is above neutral yet, so the current result should be treated as an early baseline rather than a final positioning story.${guidanceLabel}`
      ].join('\n\n');
      break;
    case 'evidence_guidance':
    default:
      content = [
        `${report.evaluation.name} currently has ${report.evidenceSummary.totalCount} linked evidence items, with ${evidenceCounts.measured} measured, ${evidenceCounts.estimated} estimated, and ${evidenceCounts.assumed} assumed entries. Evidence quality determines whether the current outputs are only directional or ready to support stronger decisions.`,
        report.evidenceSummary.items[0]
          ? `Start by reviewing the strongest current evidence item, ${report.evidenceSummary.items[0].title}, then confirm that the highest-priority topic, strongest risk, and strongest opportunity each have a clear owner, source date, and traceable basis.`
          : 'No evidence items are linked yet, so the first step is to add at least one concrete source for the highest-priority topic, strongest risk, and strongest opportunity.',
        `Prioritize measured inputs where they are available, use estimates transparently where they are not, and label assumptions clearly so they can be revisited in the next revision.${guidanceLabel}`
      ].join('\n\n');
      break;
  }

  return {
    provider: 'builtin',
    model: 'deterministic-template-v1',
    promptVersion: builtinNarrativePromptVersion,
    inputTokens: null,
    outputTokens: null,
    estimatedCostUsd: null,
    content,
    sourceReferences: buildNarrativeSourceReferences(kind, report, guidanceArticles)
  };
}

async function generateOpenAiNarrative(
  kind: EvaluationNarrativeKind,
  report: ReportResponse,
  guidanceArticles: Array<{
    id: string;
    slug: string;
    title: string;
    summary: string;
    category: string;
  }>
) {
  if (!openAiApiKey) {
    throw new Error('OPENAI_API_KEY is required for AI narrative generation.');
  }

  const response = await fetch(`${openAiBaseUrl}/responses`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openAiApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: openAiModel,
      input: buildNarrativePrompt(kind, report, guidanceArticles)
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI narrative request failed with status ${response.status}.`);
  }

  const parsed = openAiResponseSchema.parse(await response.json());
  const content = parsed.output_text?.trim();

  if (!content) {
    throw new Error('OpenAI narrative response did not include output text.');
  }

  return {
    provider: 'openai',
    model: openAiModel,
    promptVersion: narrativePromptVersion,
    inputTokens: parsed.usage?.input_tokens ?? null,
    outputTokens: parsed.usage?.output_tokens ?? null,
    estimatedCostUsd: null,
    content,
    sourceReferences: buildNarrativeSourceReferences(kind, report, guidanceArticles)
  };
}

async function generateNarrative(
  kind: EvaluationNarrativeKind,
  report: ReportResponse,
  guidanceArticles: Array<{
    id: string;
    slug: string;
    title: string;
    summary: string;
    category: string;
  }>
) {
  if (aiProvider !== 'openai') {
    throw new Error(`Unsupported AI provider: ${aiProvider}`);
  }

  if (!openAiApiKey) {
    return buildBuiltinNarrative(kind, report, guidanceArticles);
  }

  return generateOpenAiNarrative(kind, report, guidanceArticles);
}

async function renderPdf(evaluationId: string, revisionNumber: number) {
  const browser = await getBrowser();
  const context = await browser.newContext({
    extraHTTPHeaders: getInternalHeaders()
  });
  const page = await context.newPage();

  try {
    const url = new URL(`${webInternalOrigin}/internal/render/report/${evaluationId}`);
    url.searchParams.set('revisionNumber', String(revisionNumber));
    await page.goto(url.toString(), {
      waitUntil: 'networkidle',
      timeout: 120_000
    });

    return await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '12mm',
        left: '10mm'
      }
    });
  } finally {
    await page.close();
    await context.close();
  }
}

async function completeArtifact(
  artifactId: string,
  content: Buffer,
  filename: string,
  mimeType: string
) {
  const checksumSha256 = createHash('sha256').update(content).digest('hex');
  const storageKey = storage.buildStorageKey(checksumSha256, filename);
  await storage.writeObject(storageKey, content, mimeType);

  await internalApiRequest(`/artifacts/${artifactId}/ready`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      storageKey,
      checksumSha256,
      byteSize: content.byteLength
    })
  });
}

async function processArtifact(entityId: string) {
  const response = await internalApiRequest(`/artifacts/${entityId}/job-data`);
  const job = artifactJobSchema.parse(await response.json());
  await internalApiRequest(`/artifacts/${entityId}/processing`, { method: 'POST' });

  try {
    const content =
      job.kind === 'csv'
        ? Buffer.from(serializeReportAsCsv(job.report), 'utf8')
        : await renderPdf(job.evaluationId, job.revisionNumber);

    await completeArtifact(job.id, content, job.filename, job.mimeType);
  } catch (error) {
    await internalApiRequest(`/artifacts/${entityId}/failed`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        errorMessage:
          error instanceof Error ? error.message : 'Artifact processing failed in worker.'
      })
    });
    throw error;
  }
}

async function processNarrative(entityId: string) {
  const response = await internalApiRequest(`/narratives/${entityId}/job-data`);
  const job = narrativeJobSchema.parse(await response.json());
  await internalApiRequest(`/narratives/${entityId}/processing`, { method: 'POST' });

  try {
    const narrative = await generateNarrative(job.kind, job.report, job.guidanceArticles);
    await internalApiRequest(`/narratives/${entityId}/ready`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        provider: narrative.provider,
        model: narrative.model,
        promptVersion: narrative.promptVersion,
        inputTokens: narrative.inputTokens,
        outputTokens: narrative.outputTokens,
        estimatedCostUsd: narrative.estimatedCostUsd,
        content: narrative.content,
        sourceReferences: narrative.sourceReferences
      })
    });
  } catch (error) {
    await internalApiRequest(`/narratives/${entityId}/failed`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        errorMessage:
          error instanceof Error ? error.message : 'Narrative processing failed in worker.'
      })
    });
    throw error;
  }
}

async function main() {
  if (!internalServiceToken) {
    throw new Error('INTERNAL_SERVICE_TOKEN is required.');
  }

  const connection = new IORedis(redisUrl, {
    maxRetriesPerRequest: null
  });

  const worker = new Worker(
    queueName,
    async (job) => {
      const entityId = z
        .object({
          entityId: z.string().min(1)
        })
        .parse(job.data).entityId;

      if (job.name === 'artifact.process') {
        await processArtifact(entityId);
        return;
      }

      if (job.name === 'narrative.process') {
        await processNarrative(entityId);
        return;
      }

      throw new Error(`Unsupported job type: ${job.name}`);
    },
    {
      connection,
      concurrency: 2
    }
  );

  worker.on('completed', (job) => {
    console.log(`[worker] completed ${job.name} (${job.id})`);
  });

  worker.on('failed', (job, error) => {
    console.error(`[worker] failed ${job?.name ?? 'unknown'} (${job?.id ?? 'unknown'})`, error);
  });

  const shutdown = async () => {
    await worker.close();
    await connection.quit();
    if (browserPromise) {
      const browser = await browserPromise;
      await browser.close();
    }
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  console.log(`[worker] listening on ${queueName}`);
}

main().catch((error) => {
  console.error('[worker] fatal startup error', error);
  process.exit(1);
});
