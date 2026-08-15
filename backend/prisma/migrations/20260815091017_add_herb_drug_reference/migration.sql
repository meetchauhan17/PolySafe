-- CreateTable
CREATE TABLE "herb_drug_reference" (
    "id" SERIAL NOT NULL,
    "herbName" TEXT NOT NULL,
    "drugName" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "herb_drug_reference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "herb_drug_reference_herbName_idx" ON "herb_drug_reference"("herbName");

-- CreateIndex
CREATE INDEX "herb_drug_reference_drugName_idx" ON "herb_drug_reference"("drugName");
