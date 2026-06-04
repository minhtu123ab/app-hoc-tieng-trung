import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiService } from '../gemini/gemini.service';
import {
  HskLevel,
  SentenceDeckDto,
  SentenceDto,
} from '@linguaflow/shared';
import { GenerateSentencesDto } from '../common/dtos';

@Injectable()
export class SentencesService {
  constructor(
    private prisma: PrismaService,
    private gemini: GeminiService,
  ) {}

  private toDeckDto(deck: {
    id: string;
    userId: string;
    title: string;
    topic: string;
    hskLevel: string;
    source: string;
    createdAt: Date;
    _count?: { sentences: number };
  }): SentenceDeckDto {
    return {
      id: deck.id,
      userId: deck.userId,
      title: deck.title,
      topic: deck.topic,
      hskLevel: deck.hskLevel as HskLevel,
      source: deck.source as SentenceDeckDto['source'],
      wordCount: deck._count?.sentences,
      createdAt: deck.createdAt.toISOString(),
    };
  }

  private toSentenceDto(sentence: {
    id: string;
    sentenceDeckId: string;
    hanzi: string;
    pinyin: string;
    meaningVi: string;
    tokens: string[];
    hskLevel: string;
  }): SentenceDto {
    return {
      id: sentence.id,
      sentenceDeckId: sentence.sentenceDeckId,
      hanzi: sentence.hanzi,
      pinyin: sentence.pinyin,
      meaningVi: sentence.meaningVi,
      tokens: sentence.tokens,
      hskLevel: sentence.hskLevel as HskLevel,
    };
  }

  async findAll(userId: string): Promise<SentenceDeckDto[]> {
    const decks = await this.prisma.sentenceDeck.findMany({
      where: { userId },
      include: { _count: { select: { sentences: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return decks.map((d) => this.toDeckDto(d));
  }

  async findOne(
    userId: string,
    id: string,
  ): Promise<SentenceDeckDto & { sentences: SentenceDto[] }> {
    const deck = await this.prisma.sentenceDeck.findFirst({
      where: { id, userId },
      include: { sentences: true, _count: { select: { sentences: true } } },
    });
    if (!deck) throw new NotFoundException('Bộ câu không tồn tại');
    return {
      ...this.toDeckDto(deck),
      sentences: deck.sentences.map((s) => this.toSentenceDto(s)),
    };
  }

  async delete(userId: string, id: string): Promise<void> {
    const deck = await this.prisma.sentenceDeck.findFirst({ where: { id, userId } });
    if (!deck) throw new NotFoundException('Bộ câu không tồn tại');
    await this.prisma.sentenceDeck.delete({ where: { id } });
  }

  private async enrollSentences(userId: string, sentenceIds: string[]) {
    for (const sentenceId of sentenceIds) {
      await this.prisma.userSentenceProgress.upsert({
        where: { userId_sentenceId: { userId, sentenceId } },
        create: { userId, sentenceId, status: 'NEW', dueDate: new Date() },
        update: {},
      });
    }
  }

  async generateSentences(userId: string, dto: GenerateSentencesDto) {
    const sentences = await this.gemini.generateSentences(
      dto.topic,
      dto.hskLevel,
      dto.count,
    );

    const deck = await this.prisma.sentenceDeck.create({
      data: {
        userId,
        title: `${dto.topic} - ${dto.hskLevel}`,
        topic: dto.topic,
        hskLevel: dto.hskLevel,
        source: 'AI',
        sentences: {
          create: sentences.map((s) => ({
            hanzi: s.hanzi.trim(),
            pinyin: s.pinyin.trim(),
            meaningVi: s.meaningVi.trim(),
            tokens: s.tokens,
            hskLevel: dto.hskLevel,
          })),
        },
      },
      include: { sentences: true, _count: { select: { sentences: true } } },
    });

    await this.enrollSentences(
      userId,
      deck.sentences.map((s) => s.id),
    );

    return {
      ...this.toDeckDto(deck),
      sentences: deck.sentences.map((s) => this.toSentenceDto(s)),
    };
  }

  async enrollDeck(userId: string, deckId: string) {
    const deck = await this.prisma.sentenceDeck.findFirst({
      where: { id: deckId, userId },
      include: { sentences: true },
    });
    if (!deck) throw new NotFoundException('Bộ câu không tồn tại');

    await this.enrollSentences(
      userId,
      deck.sentences.map((s) => s.id),
    );

    return { enrolled: deck.sentences.length };
  }
}
