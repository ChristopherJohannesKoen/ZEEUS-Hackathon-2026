-- CreateEnum
CREATE TYPE "PartnerLeadStatus" AS ENUM ('new', 'reviewing', 'contacted', 'qualified', 'archived');

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "altText" TEXT NOT NULL,
    "caption" TEXT,
    "attribution" TEXT,
    "rights" TEXT,
    "mimeType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "focalPointX" DOUBLE PRECISION,
    "focalPointY" DOUBLE PRECISION,
    "storageKey" TEXT,
    "publicUrl" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SitePage" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "pageType" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "heroEyebrow" TEXT,
    "heroTitle" TEXT,
    "heroBody" TEXT,
    "heroPrimaryCtaLabel" TEXT,
    "heroPrimaryCtaHref" TEXT,
    "heroSecondaryCtaLabel" TEXT,
    "heroSecondaryCtaHref" TEXT,
    "heroMediaAssetId" TEXT,
    "navigationLabel" TEXT,
    "navigationGroup" TEXT,
    "showInPrimaryNav" BOOLEAN NOT NULL DEFAULT false,
    "showInFooter" BOOLEAN NOT NULL DEFAULT false,
    "canonicalUrl" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "sections" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SitePage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "title" TEXT,
    "description" TEXT,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "PartnerInterestLead"
ADD COLUMN "status" "PartnerLeadStatus" NOT NULL DEFAULT 'new',
ADD COLUMN "assigneeName" TEXT,
ADD COLUMN "assigneeEmail" TEXT,
ADD COLUMN "notes" TEXT,
ADD COLUMN "resolvedAt" TIMESTAMP(3),
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_slug_key" ON "MediaAsset"("slug");

-- CreateIndex
CREATE INDEX "MediaAsset_status_locale_createdAt_idx" ON "MediaAsset"("status", "locale", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SitePage_slug_locale_key" ON "SitePage"("slug", "locale");

-- CreateIndex
CREATE INDEX "SitePage_status_locale_pageType_sortOrder_idx" ON "SitePage"("status", "locale", "pageType", "sortOrder");

-- CreateIndex
CREATE INDEX "SitePage_showInPrimaryNav_locale_sortOrder_idx" ON "SitePage"("showInPrimaryNav", "locale", "sortOrder");

-- CreateIndex
CREATE INDEX "SitePage_showInFooter_locale_sortOrder_idx" ON "SitePage"("showInFooter", "locale", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "SiteSetting_key_locale_key" ON "SiteSetting"("key", "locale");

-- CreateIndex
CREATE INDEX "SiteSetting_locale_key_idx" ON "SiteSetting"("locale", "key");

-- CreateIndex
CREATE INDEX "PartnerInterestLead_status_createdAt_idx" ON "PartnerInterestLead"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "SitePage" ADD CONSTRAINT "SitePage_heroMediaAssetId_fkey" FOREIGN KEY ("heroMediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
