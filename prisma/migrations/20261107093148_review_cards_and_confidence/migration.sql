-- CreateEnum
CREATE TYPE "confidence" AS ENUM ('SURE', 'GUESS');

-- AlterTable
ALTER TABLE "attempt_answers" ADD COLUMN     "confidence" "confidence";

-- CreateTable
CREATE TABLE "review_cards" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "guestSessionId" TEXT,
    "questionId" TEXT NOT NULL,
    "box" INTEGER NOT NULL DEFAULT 1,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "confidentWrong" BOOLEAN NOT NULL DEFAULT false,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "lapses" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "review_cards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "review_cards_guestSessionId_dueAt_idx" ON "review_cards"("guestSessionId", "dueAt");

-- CreateIndex
CREATE UNIQUE INDEX "review_cards_guestSessionId_questionId_key" ON "review_cards"("guestSessionId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "review_cards_userId_questionId_key" ON "review_cards"("userId", "questionId");

-- AddForeignKey
ALTER TABLE "review_cards" ADD CONSTRAINT "review_cards_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
