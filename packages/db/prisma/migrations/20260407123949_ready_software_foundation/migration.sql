-- CreateEnum
CREATE TYPE "EvaluationArtifactKind" AS ENUM ('csv', 'pdf', 'ai_explanation');

-- CreateEnum
CREATE TYPE "EvaluationArtifactStatus" AS ENUM ('pending', 'ready', 'failed');

-- AlterEnum
ALTER TYPE "EvaluationStatus" ADD VALUE 'archived';

-- DropIndex
DROP INDEX "Project_name_trgm_idx";

-- AlterTable
ALTER TABLE "Evaluation" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "catalogVersion" TEXT NOT NULL DEFAULT 'workbook-catalog',
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "currentRevisionId" TEXT,
ADD COLUMN     "currentRevisionNumber" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastScoredAt" TIMESTAMP(3),
ADD COLUMN     "scoringVersion" TEXT NOT NULL DEFAULT '2026.04.ready-software.1';

-- AlterTable
ALTER TABLE "GroupRoleMapping" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "IdentityProviderConfig" ALTER COLUMN "scopes" DROP DEFAULT,
ALTER COLUMN "verifiedDomains" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ProvisioningCursor" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Stage1TopicAnswer" ADD COLUMN     "evidenceNote" TEXT;

-- AlterTable
ALTER TABLE "Stage2OpportunityAnswer" ADD COLUMN     "evidenceNote" TEXT;

-- AlterTable
ALTER TABLE "Stage2RiskAnswer" ADD COLUMN     "evidenceNote" TEXT;

-- AlterTable
ALTER TABLE "UserGroup" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "UserGroupMembership" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "UserIdentity" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "EvaluationRevision" (
    "id" TEXT NOT NULL,
    "evaluationId" TEXT NOT NULL,
    "revisionNumber" INTEGER NOT NULL,
    "status" "EvaluationStatus" NOT NULL,
    "currentStep" "EvaluationStep" NOT NULL,
    "scoringVersion" TEXT NOT NULL,
    "catalogVersion" TEXT NOT NULL,
    "detailSnapshot" JSONB NOT NULL,
    "impactSummarySnapshot" JSONB NOT NULL,
    "dashboardSnapshot" JSONB NOT NULL,
    "reportSnapshot" JSONB NOT NULL,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvaluationRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluationArtifact" (
    "id" TEXT NOT NULL,
    "evaluationId" TEXT NOT NULL,
    "revisionId" TEXT,
    "kind" "EvaluationArtifactKind" NOT NULL,
    "status" "EvaluationArtifactStatus" NOT NULL DEFAULT 'ready',
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvaluationArtifact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EvaluationRevision_evaluationId_createdAt_idx" ON "EvaluationRevision"("evaluationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "EvaluationRevision_evaluationId_revisionNumber_key" ON "EvaluationRevision"("evaluationId", "revisionNumber");

-- CreateIndex
CREATE INDEX "EvaluationArtifact_evaluationId_createdAt_idx" ON "EvaluationArtifact"("evaluationId", "createdAt");

-- CreateIndex
CREATE INDEX "EvaluationArtifact_revisionId_idx" ON "EvaluationArtifact"("revisionId");

-- CreateIndex
CREATE INDEX "Evaluation_currentRevisionId_idx" ON "Evaluation"("currentRevisionId");

-- AddForeignKey
ALTER TABLE "EvaluationRevision" ADD CONSTRAINT "EvaluationRevision_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationArtifact" ADD CONSTRAINT "EvaluationArtifact_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationArtifact" ADD CONSTRAINT "EvaluationArtifact_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "EvaluationRevision"("id") ON DELETE SET NULL ON UPDATE CASCADE;
