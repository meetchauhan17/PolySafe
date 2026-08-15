-- CreateTable
CREATE TABLE "burden_score" (
    "id" SERIAL NOT NULL,
    "drugName" TEXT NOT NULL,
    "score" INTEGER NOT NULL,

    CONSTRAINT "burden_score_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "burden_score_drugName_key" ON "burden_score"("drugName");

-- CreateIndex
CREATE INDEX "burden_score_drugName_idx" ON "burden_score"("drugName");
