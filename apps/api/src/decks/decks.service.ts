import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiService } from '../gemini/gemini.service';
import {
  DeckDto,
  WordDto,
  HskLevel,
} from '@linguaflow/shared';
import { GenerateVocabDto } from '../common/dtos';

@Injectable()
export class DecksService {
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
    _count?: { words: number };
  }): DeckDto {
    return {
      id: deck.id,
      userId: deck.userId,
      title: deck.title,
      topic: deck.topic,
      hskLevel: deck.hskLevel as HskLevel,
      source: deck.source as DeckDto['source'],
      wordCount: deck._count?.words,
      createdAt: deck.createdAt.toISOString(),
    };
  }

  private toWordDto(word: {
    id: string;
    deckId: string;
    hanzi: string;
    pinyin: string;
    meaningVi: string;
    partOfSpeech: string | null;
    exampleHanzi: string | null;
    examplePinyin: string | null;
    exampleVi: string | null;
    hskLevel: string;
  }): WordDto {
    return {
      id: word.id,
      deckId: word.deckId,
      hanzi: word.hanzi,
      pinyin: word.pinyin,
      meaningVi: word.meaningVi,
      partOfSpeech: word.partOfSpeech,
      exampleHanzi: word.exampleHanzi,
      examplePinyin: word.examplePinyin,
      exampleVi: word.exampleVi,
      hskLevel: word.hskLevel as HskLevel,
    };
  }

  async findAll(userId: string): Promise<DeckDto[]> {
    const decks = await this.prisma.deck.findMany({
      where: { userId },
      include: { _count: { select: { words: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return decks.map((d) => this.toDeckDto(d));
  }

  async findOne(userId: string, id: string): Promise<DeckDto & { words: WordDto[] }> {
    const deck = await this.prisma.deck.findFirst({
      where: { id, userId },
      include: { words: true, _count: { select: { words: true } } },
    });
    if (!deck) throw new NotFoundException('Deck không tồn tại');
    return {
      ...this.toDeckDto(deck),
      words: deck.words.map((w) => this.toWordDto(w)),
    };
  }

  async delete(userId: string, id: string): Promise<void> {
    const deck = await this.prisma.deck.findFirst({ where: { id, userId } });
    if (!deck) throw new NotFoundException('Deck không tồn tại');
    await this.prisma.deck.delete({ where: { id } });
  }

  async generateVocab(userId: string, dto: GenerateVocabDto) {
    const words = await this.gemini.generateVocabulary(
      dto.topic,
      dto.hskLevel,
      dto.count,
    );

    const deck = await this.prisma.deck.create({
      data: {
        userId,
        title: `${dto.topic} - ${dto.hskLevel}`,
        topic: dto.topic,
        hskLevel: dto.hskLevel,
        source: 'AI',
        words: {
          create: words.map((w) => ({
            hanzi: w.hanzi,
            pinyin: w.pinyin,
            meaningVi: w.meaningVi,
            partOfSpeech: w.partOfSpeech ?? null,
            exampleHanzi: w.exampleHanzi ?? null,
            examplePinyin: w.examplePinyin ?? null,
            exampleVi: w.exampleVi ?? null,
            hskLevel: dto.hskLevel,
          })),
        },
      },
      include: { words: true, _count: { select: { words: true } } },
    });

    for (const word of deck.words) {
      await this.prisma.userWordProgress.upsert({
        where: { userId_wordId: { userId, wordId: word.id } },
        create: {
          userId,
          wordId: word.id,
          status: 'NEW',
          dueDate: new Date(),
        },
        update: {},
      });
    }

    return {
      ...this.toDeckDto(deck),
      words: deck.words.map((w) => this.toWordDto(w)),
    };
  }

  async enrollDeck(userId: string, deckId: string) {
    const deck = await this.prisma.deck.findFirst({
      where: { id: deckId, userId },
      include: { words: true },
    });
    if (!deck) throw new NotFoundException('Deck không tồn tại');

    for (const word of deck.words) {
      await this.prisma.userWordProgress.upsert({
        where: { userId_wordId: { userId, wordId: word.id } },
        create: {
          userId,
          wordId: word.id,
          status: 'NEW',
          dueDate: new Date(),
        },
        update: {},
      });
    }

    return { enrolled: deck.words.length };
  }
}
