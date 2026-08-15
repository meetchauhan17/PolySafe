-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PATIENT', 'CAREGIVER', 'DOCTOR', 'PHARMACIST');

-- CreateEnum
CREATE TYPE "MedicineType" AS ENUM ('PRESCRIPTION', 'OTC', 'HERBAL');

-- CreateEnum
CREATE TYPE "ConnectionRole" AS ENUM ('CAREGIVER', 'DOCTOR');

-- CreateEnum
CREATE TYPE "ConnectionStatus" AS ENUM ('PENDING', 'APPROVED', 'REVOKED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "passwordHash" TEXT,
    "role" "Role" NOT NULL DEFAULT 'PATIENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "conditions" TEXT[],
    "allergies" TEXT[],

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Medicine" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "standardizedCode" TEXT,
    "type" "MedicineType" NOT NULL DEFAULT 'PRESCRIPTION',
    "addedBy" TEXT NOT NULL,
    "dateAdded" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dosage" TEXT,

    CONSTRAINT "Medicine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Symptom" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dateLogged" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "possibleCauseMedicineId" TEXT,

    CONSTRAINT "Symptom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Connection" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "connectedUserId" TEXT NOT NULL,
    "role" "ConnectionRole" NOT NULL,
    "status" "ConnectionStatus" NOT NULL DEFAULT 'PENDING',
    "shareCode" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Connection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InteractionFlag" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "medicineAId" TEXT NOT NULL,
    "medicineBId" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "clinicalExplanation" TEXT NOT NULL,
    "plainExplanation" TEXT NOT NULL,
    "dateFlagged" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InteractionFlag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_userId_key" ON "Patient"("userId");

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Medicine" ADD CONSTRAINT "Medicine_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Medicine" ADD CONSTRAINT "Medicine_addedBy_fkey" FOREIGN KEY ("addedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Symptom" ADD CONSTRAINT "Symptom_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Symptom" ADD CONSTRAINT "Symptom_possibleCauseMedicineId_fkey" FOREIGN KEY ("possibleCauseMedicineId") REFERENCES "Medicine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Connection" ADD CONSTRAINT "Connection_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Connection" ADD CONSTRAINT "Connection_connectedUserId_fkey" FOREIGN KEY ("connectedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InteractionFlag" ADD CONSTRAINT "InteractionFlag_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InteractionFlag" ADD CONSTRAINT "InteractionFlag_medicineAId_fkey" FOREIGN KEY ("medicineAId") REFERENCES "Medicine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InteractionFlag" ADD CONSTRAINT "InteractionFlag_medicineBId_fkey" FOREIGN KEY ("medicineBId") REFERENCES "Medicine"("id") ON DELETE CASCADE ON UPDATE CASCADE;
