import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { chromium, type Browser } from 'playwright';
import {
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

function escapeCsvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function buildCsvReport(report: ReportResponse) {
  const rows: string[][] = [];
  const pushSection = (section: string, field: string, value: unknown) => {
    rows.push([section, field, value == null ? '' : String(value)]);
  };

  pushSection('evaluation', 'id', report.evaluation.id);
  pushSection('evaluation', 'name', report.evaluation.name);
  pushSection('evaluation', 'country', report.evaluation.country);
  pushSection('evaluation', 'naceDivision', report.evaluation.naceDivision);
  pushSection('evaluation', 'offeringType', report.evaluation.offeringType);
  pushSection('evaluation', 'launched', report.evaluation.launched);
  pushSection('evaluation', 'currentStage', report.evaluation.currentStage);
  pushSection('evaluation', 'innovationApproach', report.evaluation.innovationApproach);
  pushSection('dashboard', 'financialTotal', report.dashboard.financialTotal);
  pushSection('dashboard', 'riskOverall', report.dashboard.riskOverall);
  pushSection('dashboard', 'opportunityOverall', report.dashboard.opportunityOverall);
  pushSection('dashboard', 'confidenceBand', report.dashboard.confidenceBand);

  if (report.evaluation.stage1Financial) {
    const financial = report.evaluation.stage1Financial;
    pushSection('stage1_financial', 'roiLevel', financial.roiLevel);
    pushSection('stage1_financial', 'sensitivityLevel', financial.sensitivityLevel);
    pushSection('stage1_financial', 'uspLevel', financial.uspLevel);
    pushSection('stage1_financial', 'marketGrowthLevel', financial.marketGrowthLevel);
    pushSection('stage1_financial', 'totalScore', financial.totalScore);

    for (const item of financial.items) {
      pushSection('stage1_financial', `${item.id}.level`, item.level);
      pushSection('stage1_financial', `${item.id}.score`, item.score);
    }
  }

  for (const topic of report.evaluation.stage1Topics) {
    pushSection('stage1_topic', `${topic.topicCode}.applicable`, topic.applicable);
    pushSection('stage1_topic', `${topic.topicCode}.magnitude`, topic.magnitude);
    pushSection('stage1_topic', `${topic.topicCode}.scale`, topic.scale);
    pushSection('stage1_topic', `${topic.topicCode}.irreversibility`, topic.irreversibility);
    pushSection('stage1_topic', `${topic.topicCode}.likelihood`, topic.likelihood);
    pushSection('stage1_topic', `${topic.topicCode}.impactScore`, topic.impactScore);
    pushSection('stage1_topic', `${topic.topicCode}.priorityBand`, topic.priorityBand);
    pushSection('stage1_topic', `${topic.topicCode}.evidenceBasis`, topic.evidenceBasis);
    pushSection('stage1_topic', `${topic.topicCode}.evidenceNote`, topic.evidenceNote ?? null);
  }

  for (const risk of report.evaluation.stage2Risks) {
    pushSection('stage2_risk', `${risk.riskCode}.applicable`, risk.applicable);
    pushSection('stage2_risk', `${risk.riskCode}.probability`, risk.probability);
    pushSection('stage2_risk', `${risk.riskCode}.impact`, risk.impact);
    pushSection('stage2_risk', `${risk.riskCode}.ratingScore`, risk.ratingScore);
    pushSection('stage2_risk', `${risk.riskCode}.ratingLabel`, risk.ratingLabel);
    pushSection('stage2_risk', `${risk.riskCode}.evidenceBasis`, risk.evidenceBasis);
    pushSection('stage2_risk', `${risk.riskCode}.evidenceNote`, risk.evidenceNote ?? null);
  }

  for (const opportunity of report.evaluation.stage2Opportunities) {
    pushSection(
      'stage2_opportunity',
      `${opportunity.opportunityCode}.applicable`,
      opportunity.applicable
    );
    pushSection(
      'stage2_opportunity',
      `${opportunity.opportunityCode}.likelihood`,
      opportunity.likelihood
    );
    pushSection('stage2_opportunity', `${opportunity.opportunityCode}.impact`, opportunity.impact);
    pushSection(
      'stage2_opportunity',
      `${opportunity.opportunityCode}.ratingScore`,
      opportunity.ratingScore
    );
    pushSection(
      'stage2_opportunity',
      `${opportunity.opportunityCode}.ratingLabel`,
      opportunity.ratingLabel
    );
    pushSection(
      'stage2_opportunity',
      `${opportunity.opportunityCode}.evidenceBasis`,
      opportunity.evidenceBasis
    );
    pushSection(
      'stage2_opportunity',
      `${opportunity.opportunityCode}.evidenceNote`,
      opportunity.evidenceNote ?? null
    );
  }

  for (const recommendation of report.dashboard.recommendations) {
    pushSection('recommendation', `${recommendation.id}.title`, recommendation.title);
    pushSection('recommendation', `${recommendation.id}.source`, recommendation.source);
    pushSection('recommendation', `${recommendation.id}.severity`, recommendation.severityBand);
    pushSection('recommendation', `${recommendation.id}.text`, recommendation.text);
    pushSection(
      'recommendation',
      `${recommendation.id}.actionStatus`,
      recommendation.action?.status ?? null
    );
  }

  return [['section', 'field', 'value'], ...rows]
    .map((row) => row.map((value) => escapeCsvCell(value)).join(','))
    .join('\n');
}

function buildNarrativeContent(kind: EvaluationNarrativeKind, report: ReportResponse) {
  const topTopic = report.dashboard.materialAlerts[0];
  const topRisk = report.dashboard.topRisks[0];
  const topOpportunity = report.dashboard.topOpportunities[0];

  if (kind === 'executive_summary') {
    return [
      `${report.evaluation.name} currently scores ${report.dashboard.financialTotal}/12 on the deterministic financial screen, with overall risk at ${report.dashboard.riskOverall.toFixed(1)} and opportunity at ${report.dashboard.opportunityOverall.toFixed(1)}.`,
      topTopic
        ? `${topTopic.title} is the strongest inside-out materiality signal at ${topTopic.score}, which makes it the clearest near-term sustainability priority.`
        : 'No material topics are above the reporting threshold yet, so the next priority is collecting stronger evidence before the next review.',
      topOpportunity
        ? `${topOpportunity.title} is the clearest upside signal, while ${topRisk?.title ?? 'outside-in risks'} should be monitored as the main constraint on execution.`
        : `${topRisk?.title ?? 'Outside-in risk'} remains the strongest external consideration for the current profile.`
    ].join('\n\n');
  }

  if (kind === 'material_topics') {
    return [
      `The current materiality profile is driven by ${topTopic?.title ?? 'the saved topic scores'} and the evidence basis attached to each Stage I answer.`,
      'Topics marked relevant indicate credible sustainability relevance, while high-priority topics indicate the startup is already above the stronger action threshold.',
      report.dashboard.sensitivityHints[0]
        ? `The most important near-threshold hint is: ${report.dashboard.sensitivityHints[0].message}`
        : 'No near-threshold shifts were detected from the saved assumptions.'
    ].join('\n\n');
  }

  if (kind === 'risks_opportunities') {
    return [
      topRisk
        ? `${topRisk.title} is the most material external risk signal and should anchor the short-term mitigation discussion.`
        : 'No external risks are currently rated above neutral.',
      topOpportunity
        ? `${topOpportunity.title} is the strongest opportunity signal and should inform roadmap and partnership decisions.`
        : 'No external opportunities are currently rated above neutral.',
      'These explanations are generated from the immutable revision snapshot and do not alter any deterministic scores.'
    ].join('\n\n');
  }

  return [
    'Evidence quality is the main determinant of confidence in this assessment.',
    `The current confidence band is ${report.dashboard.confidenceBand}, based on the measured, estimated, and assumed evidence basis saved across Stage I and Stage II.`,
    'Focus next on collecting defensible evidence for the highest-priority topic, the strongest risk, and the strongest opportunity before the next revision.'
  ].join('\n\n');
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
        ? Buffer.from(buildCsvReport(job.report), 'utf8')
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
    await internalApiRequest(`/narratives/${entityId}/ready`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'template-v1',
        promptVersion: '2026.04.ready-software.2',
        content: buildNarrativeContent(job.kind, job.report)
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
