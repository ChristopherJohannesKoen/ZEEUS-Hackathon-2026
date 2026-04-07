-- CreateEnum
CREATE TYPE "RecommendationActionStatus" AS ENUM ('not_started', 'in_progress', 'completed', 'dismissed');

-- DropTable
DROP TABLE "Project";

-- DropEnum
DROP TYPE "ProjectStatus";

-- AlterTable
ALTER TABLE "EvaluationArtifact"
  ALTER COLUMN "status" SET DEFAULT 'pending',
  ADD COLUMN "storageKey" TEXT,
  ADD COLUMN "checksumSha256" TEXT,
  ADD COLUMN "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "readyAt" TIMESTAMP(3),
  ADD COLUMN "failedAt" TIMESTAMP(3),
  ADD COLUMN "errorMessage" TEXT;

-- Backfill existing artifact request timestamps from createdAt
UPDATE "EvaluationArtifact"
SET "requestedAt" = "createdAt"
WHERE "requestedAt" IS NULL;

-- CreateTable
CREATE TABLE "EvaluationRecommendationAction" (
  "id" TEXT NOT NULL,
  "evaluationId" TEXT NOT NULL,
  "recommendationId" TEXT NOT NULL,
  "status" "RecommendationActionStatus" NOT NULL DEFAULT 'not_started',
  "ownerNote" TEXT,
  "updatedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "EvaluationRecommendationAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EvaluationArtifact_status_kind_createdAt_idx"
  ON "EvaluationArtifact"("status", "kind", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "EvaluationRecommendationAction_evaluationId_recommendationId_key"
  ON "EvaluationRecommendationAction"("evaluationId", "recommendationId");

-- CreateIndex
CREATE INDEX "EvaluationRecommendationAction_evaluationId_status_idx"
  ON "EvaluationRecommendationAction"("evaluationId", "status");

-- AddForeignKey
ALTER TABLE "EvaluationRecommendationAction"
  ADD CONSTRAINT "EvaluationRecommendationAction_evaluationId_fkey"
  FOREIGN KEY ("evaluationId") REFERENCES "Evaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
