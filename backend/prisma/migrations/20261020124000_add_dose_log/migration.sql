-- CreateEnum
CREATE TYPE "DoseStatus" AS ENUM ('TAKEN', 'SKIPPED', 'MISSED');

-- CreateTable
CREATE TABLE IF NOT EXISTS "dose_log" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "medicineId" TEXT NOT NULL,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "takenAt" TIMESTAMP(3),
    "status" "DoseStatus" NOT NULL DEFAULT 'TAKEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dose_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "dose_log_patientId_scheduledFor_idx" ON "dose_log"("patientId", "scheduledFor");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "dose_log_patientId_status_idx" ON "dose_log"("patientId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "dose_log_medicineId_idx" ON "dose_log"("medicineId");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'dose_log_patientId_fkey'
    ) THEN
        ALTER TABLE "dose_log" ADD CONSTRAINT "dose_log_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'dose_log_medicineId_fkey'
    ) THEN
        ALTER TABLE "dose_log" ADD CONSTRAINT "dose_log_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
