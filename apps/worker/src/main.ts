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
  report: ReportResponseSchema
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

function buildNarrativePrompt(kind: EvaluationNarrativeKind, report: ReportResponse) {
  return [
    'You are writing a sustainability startup assessment narrative for ZEEUS.',
    'The deterministic report data below is authoritative. You must not alter, reinterpret, or override any scores, thresholds, SDG mappings, or recommendations.',
    'Use only the provided report data.',
    'Do not mention AI, probabilities, or hidden calculations.',
    'Keep the tone concise, professional, and startup-friendly.',
    '',
    'Task instructions:',
    buildNarrativeInstructions(kind, report),
    '',
    'Deterministic report payload:',
    JSON.stringify(report)
  ].join('\n');
}

async function generateOpenAiNarrative(kind: EvaluationNarrativeKind, report: ReportResponse) {
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
      input: buildNarrativePrompt(kind, report)
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
    content
  };
}

async function generateNarrative(kind: EvaluationNarrativeKind, report: ReportResponse) {
  if (aiProvider !== 'openai') {
    throw new Error(`Unsupported AI provider: ${aiProvider}`);
  }

  return generateOpenAiNarrative(kind, report);
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
    const narrative = await generateNarrative(job.kind, job.report);
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
        content: narrative.content
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
