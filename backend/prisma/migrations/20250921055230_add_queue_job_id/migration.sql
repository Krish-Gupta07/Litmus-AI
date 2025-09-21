-- CreateEnum
CREATE TYPE "public"."Category" AS ENUM ('POLITICS_GOVERNANCE', 'CONFLICT_SECURITY', 'BUSINESS_ECONOMY', 'TECHNOLOGY', 'SCIENCE', 'HEALTH_WELLNESS', 'ENVIRONMENT_CLIMATE', 'SPORTS', 'ARTS_CULTURE', 'SOCIETY_HUMAN_INTEREST', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."JobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AnalysisJob" (
    "id" TEXT NOT NULL,
    "queueJobId" TEXT,
    "status" "public"."JobStatus" NOT NULL DEFAULT 'PENDING',
    "input" TEXT NOT NULL,
    "scrapedText" TEXT,
    "category" "public"."Category",
    "result" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "AnalysisJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "AnalysisJob_userId_idx" ON "public"."AnalysisJob"("userId");

-- CreateIndex
CREATE INDEX "AnalysisJob_category_idx" ON "public"."AnalysisJob"("category");

-- AddForeignKey
ALTER TABLE "public"."AnalysisJob" ADD CONSTRAINT "AnalysisJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
