-- CreateEnum
CREATE TYPE "SubmissionJobStatus" AS ENUM ('pending', 'processing', 'done', 'failed', 'dead');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('sent', 'failed', 'manual_pending');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubmissionSchedule" (
    "id" TEXT NOT NULL,
    "producerId" TEXT NOT NULL,
    "denominationId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "nextRunAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubmissionSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubmissionJob" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT,
    "producerId" TEXT NOT NULL,
    "denominationId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "status" "SubmissionJobStatus" NOT NULL DEFAULT 'pending',
    "runAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "payload" JSONB NOT NULL,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubmissionJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "jobId" TEXT,
    "producerId" TEXT NOT NULL,
    "denominationId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "status" "SubmissionStatus" NOT NULL,
    "recipient" TEXT,
    "sentAt" TIMESTAMP(3),
    "externalRef" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "SubmissionSchedule_producerId_denominationId_ruleId_key" ON "SubmissionSchedule"("producerId", "denominationId", "ruleId");

-- CreateIndex
CREATE UNIQUE INDEX "Submission_jobId_key" ON "Submission"("jobId");

-- AddForeignKey
ALTER TABLE "SubmissionSchedule" ADD CONSTRAINT "SubmissionSchedule_producerId_fkey" FOREIGN KEY ("producerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionJob" ADD CONSTRAINT "SubmissionJob_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "SubmissionSchedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionJob" ADD CONSTRAINT "SubmissionJob_producerId_fkey" FOREIGN KEY ("producerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "SubmissionJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_producerId_fkey" FOREIGN KEY ("producerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
