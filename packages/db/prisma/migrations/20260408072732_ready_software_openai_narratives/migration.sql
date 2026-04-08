-- AlterTable
ALTER TABLE "EvaluationNarrative" ADD COLUMN     "estimatedCostUsd" DOUBLE PRECISION,
ADD COLUMN     "inputTokens" INTEGER,
ADD COLUMN     "outputTokens" INTEGER,
ADD COLUMN     "provider" TEXT;
