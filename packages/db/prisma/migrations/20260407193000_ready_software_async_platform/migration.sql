-- CreateEnum
CREATE TYPE "EvaluationNarrativeKind" AS ENUM (
  'executive_summary',
  'material_topics',
  'risks_opportunities',
  'evidence_guidance'
);

-- CreateEnum
CREATE TYPE "EvaluationNarrativeStatus" AS ENUM ('pending', 'processing', 'ready', 'failed');

-- AlterEnum
ALTER TYPE "EvaluationArtifactStatus" ADD VALUE IF NOT EXISTS 'processing';

-- AlterTable
ALTER TABLE "EvaluationRecommendationAction" ADD COLUMN "revisionId" TEXT;

-- Backfill revision-scoped recommendation actions from the current revision when present.
UPDATE "EvaluationRecommendationAction" AS action
SET "revisionId" = COALESCE(
  evaluation."currentRevisionId",
  latest_revision."id"
)
FROM "Evaluation" AS evaluation
LEFT JOIN LATERAL (
  SELECT revision."id"
  FROM "EvaluationRevision" AS revision
  WHERE revision."evaluationId" = evaluation."id"
  ORDER BY revision."revisionNumber" DESC
  LIMIT 1
) AS latest_revision ON TRUE
WHERE action."evaluationId" = evaluation."id";

ALTER TABLE "EvaluationRecommendationAction"
ALTER COLUMN "revisionId" SET NOT NULL;

-- DropIndex
DROP INDEX "EvaluationRecommendationAction_evaluationId_recommendationId_ke";

-- CreateTable
CREATE TABLE "EvaluationNarrative" (
  "id" TEXT NOT NULL,
  "evaluationId" TEXT NOT NULL,
  "revisionId" TEXT,
  "kind" "EvaluationNarrativeKind" NOT NULL,
  "status" "EvaluationNarrativeStatus" NOT NULL DEFAULT 'pending',
  "model" TEXT,
  "promptVersion" TEXT,
  "content" TEXT,
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "readyAt" TIMESTAMP(3),
  "failedAt" TIMESTAMP(3),
  "errorMessage" TEXT,
  "createdByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "EvaluationNarrative_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EvaluationNarrative_evaluationId_createdAt_idx"
ON "EvaluationNarrative"("evaluationId", "createdAt");

-- CreateIndex
CREATE INDEX "EvaluationNarrative_revisionId_idx"
ON "EvaluationNarrative"("revisionId");

-- CreateIndex
CREATE INDEX "EvaluationNarrative_status_kind_createdAt_idx"
ON "EvaluationNarrative"("status", "kind", "createdAt");

-- CreateIndex
CREATE INDEX "EvaluationRecommendationAction_revisionId_status_idx"
ON "EvaluationRecommendationAction"("revisionId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "EvaluationRecommendationAction_revisionId_recommendationId_key"
ON "EvaluationRecommendationAction"("revisionId", "recommendationId");

-- AddForeignKey
ALTER TABLE "EvaluationRecommendationAction"
ADD CONSTRAINT "EvaluationRecommendationAction_revisionId_fkey"
FOREIGN KEY ("revisionId") REFERENCES "EvaluationRevision"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationNarrative"
ADD CONSTRAINT "EvaluationNarrative_evaluationId_fkey"
FOREIGN KEY ("evaluationId") REFERENCES "Evaluation"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationNarrative"
ADD CONSTRAINT "EvaluationNarrative_revisionId_fkey"
FOREIGN KEY ("revisionId") REFERENCES "EvaluationRevision"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
