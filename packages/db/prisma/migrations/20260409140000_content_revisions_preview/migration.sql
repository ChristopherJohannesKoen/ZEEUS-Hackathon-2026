-- CreateTable
CREATE TABLE "ContentRevision" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "locale" TEXT,
    "changeSummary" TEXT,
    "snapshot" JSONB NOT NULL,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SitePagePreviewToken" (
    "id" TEXT NOT NULL,
    "sitePageId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SitePagePreviewToken_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Evaluation" ALTER COLUMN "scoringVersion" SET DEFAULT '2026.04.ready-software.2';

-- CreateIndex
CREATE INDEX "ContentRevision_entityType_entityId_createdAt_idx" ON "ContentRevision"("entityType", "entityId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SitePagePreviewToken_tokenHash_key" ON "SitePagePreviewToken"("tokenHash");

-- CreateIndex
CREATE INDEX "SitePagePreviewToken_sitePageId_expiresAt_idx" ON "SitePagePreviewToken"("sitePageId", "expiresAt");

-- AddForeignKey
ALTER TABLE "SitePagePreviewToken" ADD CONSTRAINT "SitePagePreviewToken_sitePageId_fkey" FOREIGN KEY ("sitePageId") REFERENCES "SitePage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
