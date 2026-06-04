-- AlterEnum
ALTER TYPE "PracticeMode" ADD VALUE 'WORD_BANK';
ALTER TYPE "PracticeMode" ADD VALUE 'MATCH_PAIRS';

-- CreateTable
CREATE TABLE "SentenceDeck" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "hskLevel" "HskLevel" NOT NULL,
    "source" "DeckSource" NOT NULL DEFAULT 'MANUAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SentenceDeck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sentence" (
    "id" TEXT NOT NULL,
    "sentenceDeckId" TEXT NOT NULL,
    "hanzi" TEXT NOT NULL,
    "pinyin" TEXT NOT NULL,
    "meaningVi" TEXT NOT NULL,
    "tokens" TEXT[],
    "hskLevel" "HskLevel" NOT NULL,

    CONSTRAINT "Sentence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSentenceProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sentenceId" TEXT NOT NULL,
    "status" "WordStatus" NOT NULL DEFAULT 'NEW',
    "easeFactor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "intervalDays" INTEGER NOT NULL DEFAULT 0,
    "repetitions" INTEGER NOT NULL DEFAULT 0,
    "dueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReviewedAt" TIMESTAMP(3),

    CONSTRAINT "UserSentenceProgress_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "ReviewLog" ALTER COLUMN "userWordProgressId" DROP NOT NULL;
ALTER TABLE "ReviewLog" ADD COLUMN "userSentenceProgressId" TEXT;

-- CreateIndex
CREATE INDEX "SentenceDeck_userId_idx" ON "SentenceDeck"("userId");

-- CreateIndex
CREATE INDEX "Sentence_sentenceDeckId_idx" ON "Sentence"("sentenceDeckId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSentenceProgress_userId_sentenceId_key" ON "UserSentenceProgress"("userId", "sentenceId");

-- CreateIndex
CREATE INDEX "UserSentenceProgress_userId_dueDate_idx" ON "UserSentenceProgress"("userId", "dueDate");

-- CreateIndex
CREATE INDEX "ReviewLog_userSentenceProgressId_idx" ON "ReviewLog"("userSentenceProgressId");

-- AddForeignKey
ALTER TABLE "SentenceDeck" ADD CONSTRAINT "SentenceDeck_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sentence" ADD CONSTRAINT "Sentence_sentenceDeckId_fkey" FOREIGN KEY ("sentenceDeckId") REFERENCES "SentenceDeck"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSentenceProgress" ADD CONSTRAINT "UserSentenceProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSentenceProgress" ADD CONSTRAINT "UserSentenceProgress_sentenceId_fkey" FOREIGN KEY ("sentenceId") REFERENCES "Sentence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewLog" ADD CONSTRAINT "ReviewLog_userSentenceProgressId_fkey" FOREIGN KEY ("userSentenceProgressId") REFERENCES "UserSentenceProgress"("id") ON DELETE CASCADE ON UPDATE CASCADE;
