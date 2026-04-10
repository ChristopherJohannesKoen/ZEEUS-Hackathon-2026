ALTER TABLE "Evaluation"
ALTER COLUMN "country" DROP NOT NULL;

ALTER TABLE "Evaluation"
ADD COLUMN "businessCategoryMain" TEXT,
ADD COLUMN "businessCategorySubcategory" TEXT,
ADD COLUMN "extendedNaceCode" TEXT,
ADD COLUMN "extendedNaceLabel" TEXT;
