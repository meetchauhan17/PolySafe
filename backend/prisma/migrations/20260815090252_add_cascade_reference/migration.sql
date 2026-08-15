-- CreateTable
CREATE TABLE "cascade_reference" (
    "id" SERIAL NOT NULL,
    "symptomKeyword" TEXT NOT NULL,
    "causingDrugCategory" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "cascade_reference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cascade_reference_symptomKeyword_idx" ON "cascade_reference"("symptomKeyword");
