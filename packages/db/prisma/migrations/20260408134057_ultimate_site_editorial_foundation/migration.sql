-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('draft', 'published', 'archived');

-- CreateEnum
CREATE TYPE "EvidenceReviewState" AS ENUM ('draft', 'review_requested', 'validated', 'needs_update');

-- DropIndex
DROP INDEX "FaqEntry_category_sortOrder_idx";

-- DropIndex
DROP INDEX "KnowledgeArticle_category_sortOrder_idx";

-- DropIndex
DROP INDEX "SdgTarget_goalNumber_sortOrder_idx";

-- AlterTable
ALTER TABLE "CaseStudy" ADD COLUMN     "heroImageUrl" TEXT,
ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN     "status" "ContentStatus" NOT NULL DEFAULT 'published';

-- AlterTable
ALTER TABLE "EvidenceAsset" ADD COLUMN     "linkedOpportunityCode" "OpportunityCode",
ADD COLUMN     "linkedRiskCode" "RiskCode",
ADD COLUMN     "reviewState" "EvidenceReviewState" NOT NULL DEFAULT 'draft';

-- AlterTable
ALTER TABLE "FaqEntry" ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN     "status" "ContentStatus" NOT NULL DEFAULT 'published';

-- AlterTable
ALTER TABLE "KnowledgeArticle" ADD COLUMN     "heroImageUrl" TEXT,
ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN     "status" "ContentStatus" NOT NULL DEFAULT 'published';

-- AlterTable
ALTER TABLE "ScenarioRun" ADD COLUMN     "baseRevisionNumber" INTEGER,
ADD COLUMN     "metricDeltas" JSONB,
ADD COLUMN     "projectedConfidenceBand" "ConfidenceBand" NOT NULL DEFAULT 'low',
ADD COLUMN     "takeaways" JSONB,
ADD COLUMN     "topicDeltas" JSONB;

-- AlterTable
ALTER TABLE "SdgTarget" ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN     "status" "ContentStatus" NOT NULL DEFAULT 'published';

-- CreateTable
CREATE TABLE "ResourceAsset" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "fileLabel" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "locale" TEXT NOT NULL DEFAULT 'en',
    "externalUrl" TEXT,
    "storageKey" TEXT,
    "fileName" TEXT,
    "mimeType" TEXT,
    "byteSize" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResourceAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerInterestLead" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "programId" TEXT,
    "name" TEXT NOT NULL,
    "organizationName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "websiteUrl" TEXT,
    "message" TEXT NOT NULL,
    "sourcePage" TEXT NOT NULL DEFAULT 'partners',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnerInterestLead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ResourceAsset_slug_key" ON "ResourceAsset"("slug");

-- CreateIndex
CREATE INDEX "ResourceAsset_status_locale_category_sortOrder_idx" ON "ResourceAsset"("status", "locale", "category", "sortOrder");

-- CreateIndex
CREATE INDEX "PartnerInterestLead_createdAt_idx" ON "PartnerInterestLead"("createdAt");

-- CreateIndex
CREATE INDEX "PartnerInterestLead_organizationId_createdAt_idx" ON "PartnerInterestLead"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "PartnerInterestLead_programId_createdAt_idx" ON "PartnerInterestLead"("programId", "createdAt");

-- CreateIndex
CREATE INDEX "CaseStudy_status_locale_sortOrder_idx" ON "CaseStudy"("status", "locale", "sortOrder");

-- CreateIndex
CREATE INDEX "FaqEntry_category_status_locale_sortOrder_idx" ON "FaqEntry"("category", "status", "locale", "sortOrder");

-- CreateIndex
CREATE INDEX "KnowledgeArticle_category_status_locale_sortOrder_idx" ON "KnowledgeArticle"("category", "status", "locale", "sortOrder");

-- CreateIndex
CREATE INDEX "SdgTarget_goalNumber_status_locale_sortOrder_idx" ON "SdgTarget"("goalNumber", "status", "locale", "sortOrder");

-- AddForeignKey
ALTER TABLE "PartnerInterestLead" ADD CONSTRAINT "PartnerInterestLead_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerInterestLead" ADD CONSTRAINT "PartnerInterestLead_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE SET NULL ON UPDATE CASCADE;
