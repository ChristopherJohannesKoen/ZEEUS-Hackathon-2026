import 'reflect-metadata';
import { createHash, randomUUID } from 'node:crypto';
import cookieParser from 'cookie-parser';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import {
  serializeReportAsCsv,
  type CreateEvaluationPayload,
  type SaveStage1Payload,
  type SaveStage2Payload
} from '@packages/shared';
import { getOpportunityCatalog, getRiskCatalog, getStageOneTopicCatalog } from '@packages/scoring';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { EvaluationJobsService } from '../src/modules/evaluations/evaluation-jobs.service';
import { EvaluationStorageService } from '../src/modules/evaluations/evaluation-storage.service';

const databaseUrl =
  process.env.DATABASE_URL ??
  'postgresql://postgres:postgres@127.0.0.1:5432/zeeus_assessment?schema=public';
const sessionCookieName = process.env.SESSION_COOKIE_NAME ?? 'zeeus_assessment_session';
const internalServiceToken = 'integration-internal-token';

type SessionAuth = {
  cookie: string;
  csrfToken: string;
};

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl
    }
  }
});

function buildEvaluationPayload(name = 'EcoGrid Pilot'): CreateEvaluationPayload {
  return {
    name,
    country: 'South Africa',
    naceDivision: 'A1',
    offeringType: 'product',
    launched: true,
    currentStage: 'validation',
    innovationApproach: 'disruptive'
  };
}

function buildStage1Payload(): SaveStage1Payload {
  return {
    financial: {
      roiLevel: 'above_industry_average',
      sensitivityLevel: 'low_volatility',
      uspLevel: 'strong_or_unique_usp',
      marketGrowthLevel: 'growing'
    },
    topics: getStageOneTopicCatalog().map((topic, index) => ({
      topicCode: topic.topicCode,
      applicable: index === 0,
      magnitude: index === 0 ? 'high' : 'na',
      scale: index === 0 ? 'high' : 'na',
      irreversibility: index === 0 ? 'high' : 'na',
      likelihood: index === 0 ? 'very_likely' : 'na',
      evidenceBasis: index === 0 ? 'measured' : 'assumed',
      evidenceNote: index === 0 ? 'Verified through pilot telemetry.' : null
    }))
  };
}

function buildStage2Payload(): SaveStage2Payload {
  return {
    risks: getRiskCatalog().map((risk, index) => ({
      riskCode: risk.riskCode,
      applicable: index === 0,
      probability: index === 0 ? 'very_likely' : 'na',
      impact: index === 0 ? 'high' : 'na',
      evidenceBasis: index === 0 ? 'estimated' : 'assumed',
      evidenceNote: index === 0 ? 'Exposure tied to supplier concentration.' : null
    })),
    opportunities: getOpportunityCatalog().map((opportunity, index) => ({
      opportunityCode: opportunity.opportunityCode,
      applicable: index === 0,
      likelihood: index === 0 ? 'very_likely' : 'na',
      impact: index === 0 ? 'high' : 'na',
      evidenceBasis: index === 0 ? 'estimated' : 'assumed',
      evidenceNote: index === 0 ? 'Demand from sustainability procurement criteria.' : null
    }))
  };
}

async function clearDatabase() {
  await prisma.reviewComment.deleteMany();
  await prisma.reviewAssignment.deleteMany();
  await prisma.programSubmission.deleteMany();
  await prisma.programMember.deleteMany();
  await prisma.program.deleteMany();
  await prisma.organizationInvitation.deleteMany();
  await prisma.organizationMember.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.evidenceAsset.deleteMany();
  await prisma.scenarioRun.deleteMany();
  await prisma.sdgTarget.deleteMany();
  await prisma.caseStudy.deleteMany();
  await prisma.faqEntry.deleteMany();
  await prisma.knowledgeArticle.deleteMany();
  await prisma.evaluationNarrative.deleteMany();
  await prisma.evaluationRecommendationAction.deleteMany();
  await prisma.evaluationArtifact.deleteMany();
  await prisma.evaluationRevision.deleteMany();
  await prisma.stage2OpportunityAnswer.deleteMany();
  await prisma.stage2RiskAnswer.deleteMany();
  await prisma.stage1TopicAnswer.deleteMany();
  await prisma.stage1FinancialAnswer.deleteMany();
  await prisma.evaluation.deleteMany();
  await prisma.bootstrapState.deleteMany();
  await prisma.idempotencyRequest.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.session.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();
}

function extractSessionCookie(response: request.Response) {
  const rawSetCookie = response.headers['set-cookie'];
  const values = Array.isArray(rawSetCookie) ? rawSetCookie : [rawSetCookie].filter(Boolean);
  const cookie = values.find((value) => value.startsWith(`${sessionCookieName}=`));

  if (!cookie) {
    throw new Error(`Missing ${sessionCookieName} cookie.`);
  }

  return cookie.split(';', 1)[0]!;
}

async function signUp(app: INestApplication, email: string): Promise<SessionAuth> {
  const password = 'ChangeMe123!';
  const signupResponse = await request(app.getHttpServer())
    .post('/auth/signup')
    .set('idempotency-key', randomUUID())
    .send({
      name: email.split('@')[0],
      email,
      password
    });

  expect(signupResponse.status).toBe(201);
  const cookie = extractSessionCookie(signupResponse);
  const csrfResponse = await request(app.getHttpServer()).get('/auth/csrf').set('Cookie', cookie);

  expect(csrfResponse.status).toBe(200);
  return {
    cookie,
    csrfToken: csrfResponse.body.csrfToken as string
  };
}

async function createEvaluation(
  app: INestApplication,
  auth: SessionAuth,
  payload: CreateEvaluationPayload,
  idempotencyKey = randomUUID()
) {
  return request(app.getHttpServer())
    .post('/evaluations')
    .set('Cookie', auth.cookie)
    .set('x-csrf-token', auth.csrfToken)
    .set('idempotency-key', idempotencyKey)
    .send(payload);
}

async function saveStage1(app: INestApplication, auth: SessionAuth, evaluationId: string) {
  return request(app.getHttpServer())
    .put(`/evaluations/${evaluationId}/stage-1`)
    .set('Cookie', auth.cookie)
    .set('x-csrf-token', auth.csrfToken)
    .set('idempotency-key', randomUUID())
    .send(buildStage1Payload());
}

async function saveStage2(app: INestApplication, auth: SessionAuth, evaluationId: string) {
  return request(app.getHttpServer())
    .put(`/evaluations/${evaluationId}/stage-2`)
    .set('Cookie', auth.cookie)
    .set('x-csrf-token', auth.csrfToken)
    .set('idempotency-key', randomUUID())
    .send(buildStage2Payload());
}

async function completeEvaluation(app: INestApplication, auth: SessionAuth, evaluationId: string) {
  return request(app.getHttpServer())
    .post(`/evaluations/${evaluationId}/complete`)
    .set('Cookie', auth.cookie)
    .set('x-csrf-token', auth.csrfToken)
    .set('idempotency-key', randomUUID())
    .send({});
}

describe('Evaluations API (DB-backed)', () => {
  let app: INestApplication;
  let storageService: EvaluationStorageService;
  const jobsService = {
    isEnabled: vi.fn(() => true),
    enqueueArtifact: vi.fn(async () => true),
    enqueueNarrative: vi.fn(async () => true),
    onModuleDestroy: vi.fn(async () => undefined)
  };

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.APP_ENV = 'test';
    process.env.APP_URL = process.env.APP_URL ?? 'http://127.0.0.1:3100';
    process.env.API_ORIGIN = process.env.API_ORIGIN ?? 'http://127.0.0.1:4100';
    process.env.ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS ?? 'http://127.0.0.1:3100';
    process.env.ALLOW_MISSING_ORIGIN_FOR_DEV = 'false';
    process.env.DATABASE_URL = databaseUrl;
    process.env.INTERNAL_SERVICE_TOKEN = internalServiceToken;
    process.env.REDIS_URL = '';
    process.env.ENABLE_INTERNAL_SURFACES = 'false';
    process.env.SESSION_COOKIE_ENCRYPTION_KEY =
      process.env.SESSION_COOKIE_ENCRYPTION_KEY ??
      '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    process.env.SSO_STATE_ENCRYPTION_KEY =
      process.env.SSO_STATE_ENCRYPTION_KEY ??
      'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789';
    process.env.SEED_OWNER_EMAIL = process.env.SEED_OWNER_EMAIL ?? 'owner@example.com';
    process.env.SEED_OWNER_PASSWORD = process.env.SEED_OWNER_PASSWORD ?? 'ChangeMe123!';

    const { E2EAppModule } = await import('../src/modules/e2e-app.module');

    const moduleRef = await Test.createTestingModule({
      imports: [E2EAppModule]
    })
      .overrideProvider(EvaluationJobsService)
      .useValue(jobsService)
      .compile();

    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    await app.init();
    storageService = app.get(EvaluationStorageService);
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    await clearDatabase();
  });

  afterEach(async () => {
    await request(app.getHttpServer()).delete('/__e2e/failpoints');
  });

  afterAll(async () => {
    await app?.close();
    await prisma.$disconnect();
  });

  it('replays idempotent evaluation creation and enforces ownership boundaries', async () => {
    const owner = await signUp(app, `owner-${Date.now()}@example.com`);
    const otherUser = await signUp(app, `member-${Date.now()}@example.com`);
    const payload = buildEvaluationPayload();
    const idempotencyKey = randomUUID();

    const firstResponse = await createEvaluation(app, owner, payload, idempotencyKey);
    const secondResponse = await createEvaluation(app, owner, payload, idempotencyKey);

    expect(firstResponse.status).toBe(201);
    expect(secondResponse.status).toBe(201);
    expect(secondResponse.body.id).toBe(firstResponse.body.id);

    const forbiddenResponse = await request(app.getHttpServer())
      .get(`/evaluations/${firstResponse.body.id}`)
      .set('Cookie', otherUser.cookie);

    expect(forbiddenResponse.status).toBe(404);
  });

  it('keeps completed revisions immutable when reopening and updating recommendation actions', async () => {
    const owner = await signUp(app, `reopen-${Date.now()}@example.com`);
    const created = await createEvaluation(app, owner, buildEvaluationPayload('Immutable Pilot'));

    expect(created.status).toBe(201);
    const evaluationId = created.body.id as string;

    const stage1Saved = await saveStage1(app, owner, evaluationId);
    const stage2Saved = await saveStage2(app, owner, evaluationId);
    expect(stage1Saved.status).toBe(200);
    expect(stage2Saved.status).toBe(200);
    const completed = await completeEvaluation(app, owner, evaluationId);

    expect(completed.status).toBe(200);
    expect(completed.body.status).toBe('completed');
    const completedRevisionNumber = completed.body.currentRevisionNumber as number;

    const completedRevision = await request(app.getHttpServer())
      .get(`/evaluations/${evaluationId}/revisions/${completedRevisionNumber}`)
      .set('Cookie', owner.cookie);

    expect(completedRevision.status).toBe(200);
    const recommendationId = completedRevision.body.report.dashboard.recommendations[0]?.id as
      | string
      | undefined;
    expect(recommendationId).toBeTruthy();
    expect(completedRevision.body.report.dashboard.recommendations[0]?.action).toBeNull();

    const reopened = await request(app.getHttpServer())
      .post(`/evaluations/${evaluationId}/reopen`)
      .set('Cookie', owner.cookie)
      .set('x-csrf-token', owner.csrfToken)
      .set('idempotency-key', randomUUID())
      .send({});

    expect(reopened.status).toBe(200);
    expect(reopened.body.status).toBe('draft');
    expect(reopened.body.currentRevisionNumber).toBeGreaterThan(completedRevisionNumber);

    const updatedAction = await request(app.getHttpServer())
      .put(
        `/evaluations/${evaluationId}/revisions/${reopened.body.currentRevisionNumber}/recommendations/${recommendationId}`
      )
      .set('Cookie', owner.cookie)
      .set('x-csrf-token', owner.csrfToken)
      .send({
        status: 'in_progress',
        ownerNote: 'Review this with the operating team.'
      });

    expect(updatedAction.status).toBe(200);
    expect(
      updatedAction.body.recommendations.find(
        (item: { id: string }) => item.id === recommendationId
      )?.action?.status
    ).toBe('in_progress');

    const completedRevisionAfterReopen = await request(app.getHttpServer())
      .get(`/evaluations/${evaluationId}/revisions/${completedRevisionNumber}`)
      .set('Cookie', owner.cookie);

    expect(completedRevisionAfterReopen.status).toBe(200);
    expect(
      completedRevisionAfterReopen.body.report.dashboard.recommendations.find(
        (item: { id: string }) => item.id === recommendationId
      )?.action
    ).toBeNull();
  });

  it('persists artifact and narrative lifecycle state against the active revision', async () => {
    const owner = await signUp(app, `artifact-${Date.now()}@example.com`);
    const created = await createEvaluation(app, owner, buildEvaluationPayload('Artifact Pilot'));
    const evaluationId = created.body.id as string;

    const stage1Saved = await saveStage1(app, owner, evaluationId);
    const stage2Saved = await saveStage2(app, owner, evaluationId);
    expect(stage1Saved.status).toBe(200);
    expect(stage2Saved.status).toBe(200);
    expect((await completeEvaluation(app, owner, evaluationId)).status).toBe(200);

    const artifactResponse = await request(app.getHttpServer())
      .post(`/evaluations/${evaluationId}/artifacts`)
      .set('Cookie', owner.cookie)
      .set('x-csrf-token', owner.csrfToken)
      .set('idempotency-key', randomUUID())
      .send({ kind: 'csv' });

    expect(artifactResponse.status).toBe(201);
    expect(artifactResponse.body.status).toBe('pending');
    expect(jobsService.enqueueArtifact).toHaveBeenCalled();

    const artifactJob = await request(app.getHttpServer())
      .get(`/internal/evaluations/artifacts/${artifactResponse.body.id}/job-data`)
      .set('x-internal-service-token', internalServiceToken);

    expect(artifactJob.status).toBe(200);
    const artifactContent = Buffer.from(serializeReportAsCsv(artifactJob.body.report), 'utf8');
    const checksumSha256 = createHash('sha256').update(artifactContent).digest('hex');
    const storageKey = storageService.buildStorageKey(checksumSha256, artifactJob.body.filename);
    await storageService.writeObject(storageKey, artifactContent, artifactJob.body.mimeType);

    expect(
      (
        await request(app.getHttpServer())
          .post(`/internal/evaluations/artifacts/${artifactResponse.body.id}/processing`)
          .set('x-internal-service-token', internalServiceToken)
      ).status
    ).toBe(201);
    expect(
      (
        await request(app.getHttpServer())
          .post(`/internal/evaluations/artifacts/${artifactResponse.body.id}/ready`)
          .set('x-internal-service-token', internalServiceToken)
          .send({
            storageKey,
            checksumSha256,
            byteSize: artifactContent.byteLength
          })
      ).status
    ).toBe(201);

    const readyArtifact = await request(app.getHttpServer())
      .get(`/evaluations/${evaluationId}/artifacts/${artifactResponse.body.id}`)
      .set('Cookie', owner.cookie);

    expect(readyArtifact.status).toBe(200);
    expect(readyArtifact.body.status).toBe('ready');
    expect(readyArtifact.body.revisionNumber).toBeGreaterThan(0);

    const downloadedArtifact = await request(app.getHttpServer())
      .get(`/evaluations/${evaluationId}/artifacts/${artifactResponse.body.id}/download`)
      .set('Cookie', owner.cookie);

    expect(downloadedArtifact.status).toBe(200);
    expect(downloadedArtifact.text).toContain('"section","field","value"');

    const narrativeResponse = await request(app.getHttpServer())
      .post(`/evaluations/${evaluationId}/narratives`)
      .set('Cookie', owner.cookie)
      .set('x-csrf-token', owner.csrfToken)
      .set('idempotency-key', randomUUID())
      .send({ kind: 'executive_summary' });

    expect(narrativeResponse.status).toBe(201);
    expect(narrativeResponse.body.status).toBe('pending');
    expect(jobsService.enqueueNarrative).toHaveBeenCalled();

    expect(
      (
        await request(app.getHttpServer())
          .post(`/internal/evaluations/narratives/${narrativeResponse.body.id}/processing`)
          .set('x-internal-service-token', internalServiceToken)
      ).status
    ).toBe(201);
    expect(
      (
        await request(app.getHttpServer())
          .post(`/internal/evaluations/narratives/${narrativeResponse.body.id}/ready`)
          .set('x-internal-service-token', internalServiceToken)
          .send({
            provider: 'openai',
            model: 'gpt-5.4-mini',
            promptVersion: 'integration-test',
            inputTokens: 120,
            outputTokens: 80,
            estimatedCostUsd: 0.0042,
            content:
              'The deterministic assessment indicates strong early sustainability positioning.'
          })
      ).status
    ).toBe(201);

    const narratives = await request(app.getHttpServer())
      .get(`/evaluations/${evaluationId}/narratives`)
      .set('Cookie', owner.cookie);

    expect(narratives.status).toBe(200);
    expect(narratives.body.items[0].provider).toBe('openai');
    expect(narratives.body.items[0].status).toBe('ready');

    const benchmarks = await request(app.getHttpServer())
      .get(`/evaluations/${evaluationId}/benchmarks`)
      .set('Cookie', owner.cookie);

    expect(benchmarks.status).toBe(200);
    expect(benchmarks.body.revisionNumber).toBeGreaterThan(0);
    expect(Array.isArray(benchmarks.body.metrics)).toBe(true);
  });

  it('supports binary evidence uploads, report evidence appendices, and writable program review flows', async () => {
    const ownerEmail = `program-owner-${Date.now()}@example.com`;
    const reviewerEmail = `program-reviewer-${Date.now()}@example.com`;
    const owner = await signUp(app, ownerEmail);
    await signUp(app, reviewerEmail);
    const reviewerUser = await prisma.user.findUniqueOrThrow({
      where: {
        email: reviewerEmail
      }
    });

    const organization = await prisma.organization.create({
      data: {
        slug: `org-${Date.now()}`,
        name: 'Circular Launchpad',
        description: 'Program host organization'
      }
    });

    const ownerUser = await prisma.user.findFirstOrThrow({
      where: {
        email: ownerEmail
      }
    });

    await prisma.organizationMember.createMany({
      data: [
        {
          organizationId: organization.id,
          userId: ownerUser.id,
          role: 'owner'
        },
        {
          organizationId: organization.id,
          userId: reviewerUser.id,
          role: 'reviewer'
        }
      ]
    });

    const program = await prisma.program.create({
      data: {
        organizationId: organization.id,
        slug: `launchpad-${Date.now()}`,
        name: 'Climate Launchpad',
        summary: 'Partner review flow',
        description: 'Program workflow for partner review.',
        cohortLabel: '2026 Cohort',
        status: 'active',
        isPublic: true,
        primaryLabel: 'ZEEUS',
        partnerLabel: 'Climate Launchpad',
        coBrandingLabel: 'KIC x EU'
      }
    });

    await prisma.programMember.createMany({
      data: [
        {
          programId: program.id,
          userId: ownerUser.id,
          role: 'manager'
        },
        {
          programId: program.id,
          userId: reviewerUser.id,
          role: 'reviewer'
        }
      ]
    });

    await prisma.knowledgeArticle.create({
      data: {
        slug: 'methodology',
        title: 'Methodology',
        summary: 'Method guidance for reviewers.',
        body: 'Methodology body',
        category: 'methodology',
        sortOrder: 1
      }
    });

    const created = await createEvaluation(app, owner, buildEvaluationPayload('Program Pilot'));
    expect(created.status).toBe(201);
    const evaluationId = created.body.id as string;

    await prisma.evaluation.update({
      where: {
        id: evaluationId
      },
      data: {
        organizationId: organization.id
      }
    });

    const stage1Saved = await saveStage1(app, owner, evaluationId);
    const stage2Saved = await saveStage2(app, owner, evaluationId);
    expect(stage1Saved.status).toBe(200);
    expect(stage2Saved.status).toBe(200);

    const evidenceUpload = await request(app.getHttpServer())
      .post(`/evaluations/${evaluationId}/evidence/upload`)
      .set('Cookie', owner.cookie)
      .set('x-csrf-token', owner.csrfToken)
      .set('idempotency-key', randomUUID())
      .field('title', 'Lifecycle inventory')
      .field('description', 'Measured pilot evidence for lifecycle claims.')
      .field('ownerName', 'Operations lead')
      .field('sourceDate', '2026-04-08')
      .field('evidenceBasis', 'measured')
      .field('confidenceWeight', '0.9')
      .field('linkedTopicCode', 'E1')
      .attach('file', Buffer.from('verified evidence payload'), 'lifecycle.txt');

    expect(evidenceUpload.status).toBe(201);
    expect(evidenceUpload.body.hasBinary).toBe(true);
    expect(evidenceUpload.body.fileName).toBe('lifecycle.txt');

    const createdSubmission = await request(app.getHttpServer())
      .post(`/programs/${program.id}/submissions`)
      .set('Cookie', owner.cookie)
      .set('x-csrf-token', owner.csrfToken)
      .set('idempotency-key', randomUUID())
      .send({
        evaluationId,
        revisionNumber: stage2Saved.body.currentRevisionNumber as number
      });

    expect(createdSubmission.status).toBe(201);
    const submissionId = createdSubmission.body.submissions[0].id as string;

    const assignment = await request(app.getHttpServer())
      .post(`/programs/${program.id}/submissions/${submissionId}/assignments`)
      .set('Cookie', owner.cookie)
      .set('x-csrf-token', owner.csrfToken)
      .set('idempotency-key', randomUUID())
      .send({
        reviewerUserId: reviewerUser.id,
        dueAt: '2026-04-30'
      });

    expect(assignment.status).toBe(201);
    expect(assignment.body.reviewAssignments[0].reviewerUserId).toBe(reviewerUser.id);

    const statusUpdate = await request(app.getHttpServer())
      .put(`/programs/${program.id}/submissions/${submissionId}`)
      .set('Cookie', owner.cookie)
      .set('x-csrf-token', owner.csrfToken)
      .send({
        status: 'in_review'
      });

    expect(statusUpdate.status).toBe(200);

    const comment = await request(app.getHttpServer())
      .post(`/programs/${program.id}/submissions/${submissionId}/comments`)
      .set('Cookie', owner.cookie)
      .set('x-csrf-token', owner.csrfToken)
      .set('idempotency-key', randomUUID())
      .send({
        body: 'Please attach the pilot methodology note to support the measured claim.'
      });

    expect(comment.status).toBe(201);
    expect(comment.body.reviewComments[0].body).toContain('pilot methodology note');

    const report = await request(app.getHttpServer())
      .get(`/evaluations/${evaluationId}/report`)
      .set('Cookie', owner.cookie);

    expect(report.status).toBe(200);
    expect(report.body.evidenceSummary.totalCount).toBe(1);
    expect(report.body.programBranding.partnerLabel).toBe('Climate Launchpad');
    expect(report.body.submissionReviewState.programId).toBe(program.id);

    const narrativeResponse = await request(app.getHttpServer())
      .post(`/evaluations/${evaluationId}/narratives`)
      .set('Cookie', owner.cookie)
      .set('x-csrf-token', owner.csrfToken)
      .set('idempotency-key', randomUUID())
      .send({ kind: 'evidence_guidance' });

    expect(narrativeResponse.status).toBe(201);

    const narrativeJob = await request(app.getHttpServer())
      .get(`/internal/evaluations/narratives/${narrativeResponse.body.id}/job-data`)
      .set('x-internal-service-token', internalServiceToken);

    expect(narrativeJob.status).toBe(200);
    expect(narrativeJob.body.report.evidenceSummary.totalCount).toBe(1);
    expect(narrativeJob.body.guidanceArticles.length).toBeGreaterThan(0);

    expect(
      (
        await request(app.getHttpServer())
          .post(`/internal/evaluations/narratives/${narrativeResponse.body.id}/ready`)
          .set('x-internal-service-token', internalServiceToken)
          .send({
            provider: 'openai',
            model: 'gpt-5.4-mini',
            promptVersion: 'integration-test',
            inputTokens: 50,
            outputTokens: 40,
            estimatedCostUsd: 0.002,
            content: 'Collect measured operating evidence and link it to the saved material topic.',
            sourceReferences: [
              {
                type: 'guidance_article',
                id: 'methodology',
                label: 'Methodology',
                href: '/methodology',
                description: 'Method guidance for reviewers.'
              },
              {
                type: 'evidence_item',
                id: evidenceUpload.body.id,
                label: 'Lifecycle inventory',
                href: `/app/evaluate/${evaluationId}/evidence`,
                description: 'lifecycle.txt'
              }
            ]
          })
      ).status
    ).toBe(201);

    const narratives = await request(app.getHttpServer())
      .get(`/evaluations/${evaluationId}/narratives`)
      .set('Cookie', owner.cookie);

    expect(narratives.status).toBe(200);
    expect(narratives.body.items[0].sourceReferences).toHaveLength(2);
  });
});
