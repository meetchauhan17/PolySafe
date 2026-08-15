-- CreateTable
CREATE TABLE "drug_interaction_reference" (
    "id" SERIAL NOT NULL,
    "drugAName" TEXT NOT NULL,
    "drugBName" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "ddinterId" TEXT,

    CONSTRAINT "drug_interaction_reference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "drug_interaction_reference_drugAName_drugBName_idx" ON "drug_interaction_reference"("drugAName", "drugBName");

-- CreateIndex
CREATE INDEX "drug_interaction_reference_drugBName_drugAName_idx" ON "drug_interaction_reference"("drugBName", "drugAName");
