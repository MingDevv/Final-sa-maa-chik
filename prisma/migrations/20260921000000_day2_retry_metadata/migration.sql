-- Day 2: metadata บนชุดข้อสอบ + RetrySession (ฝึกซ้ำเฉพาะข้อ)
ALTER TABLE "question_sets" ADD COLUMN "metadata" JSONB;

CREATE TABLE "retry_sessions" (
    "id" TEXT NOT NULL,
    "sourceAttemptId" TEXT NOT NULL,
    "questionIds" JSONB NOT NULL,
    "ownerUserId" TEXT,
    "ownerGuestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "retry_sessions_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "attempts" ADD COLUMN "retrySessionId" TEXT;

ALTER TABLE "attempts" ADD CONSTRAINT "attempts_retrySessionId_fkey" FOREIGN KEY ("retrySessionId") REFERENCES "retry_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
