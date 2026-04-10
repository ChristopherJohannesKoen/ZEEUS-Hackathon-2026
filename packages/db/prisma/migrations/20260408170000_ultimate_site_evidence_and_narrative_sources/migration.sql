-- AlterTable
ALTER TABLE "EvaluationNarrative"
ADD COLUMN "sourceReferences" JSONB;

-- AlterTable
ALTER TABLE "EvidenceAsset"
ADD COLUMN "fileName" TEXT,
ADD COLUMN "mimeType" TEXT,
ADD COLUMN "byteSize" INTEGER;
