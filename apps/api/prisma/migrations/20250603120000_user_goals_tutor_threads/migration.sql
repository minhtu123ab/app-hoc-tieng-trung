-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "dailyGoal" INTEGER NOT NULL DEFAULT 20;

-- AlterTable
ALTER TABLE "TutorMessage" ADD COLUMN IF NOT EXISTS "threadId" TEXT NOT NULL DEFAULT 'main';

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TutorMessage_userId_threadId_idx" ON "TutorMessage"("userId", "threadId");

-- CreateTable
CREATE TABLE IF NOT EXISTS "WordFavorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "isHard" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WordFavorite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "WordFavorite_userId_wordId_key" ON "WordFavorite"("userId", "wordId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "WordFavorite_userId_idx" ON "WordFavorite"("userId");
