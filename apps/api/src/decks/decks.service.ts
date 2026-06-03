import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiService } from '../gemini/gemini.service';
import {
  DeckDto,
  WordDto,
  HskLevel,
} from '@linguaflow/shared';
import {
  AddDeckWordsDto,
  CreateDeckDto,
  DeckWordInputDto,
  GenerateVocabDto,
  ImportDeckDto,
  UpdateDeckDto,
} from '../common/dtos';

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

  private async enrollWords(userId: string, wordIds: string[]) {
    for (const wordId of wordIds) {
      await this.prisma.userWordProgress.upsert({
        where: { userId_wordId: { userId, wordId } },
        create: { userId, wordId, status: 'NEW', dueDate: new Date() },
        update: {},
      });
    }
  }

  private wordCreateData(
    words: DeckWordInputDto[],
    defaultHsk: HskLevel,
  ) {
    return words.map((w) => ({
      hanzi: w.hanzi.trim(),
      pinyin: w.pinyin.trim(),
      meaningVi: w.meaningVi.trim(),
      partOfSpeech: w.partOfSpeech?.trim() || null,
      exampleHanzi: w.exampleHanzi?.trim() || null,
      examplePinyin: w.examplePinyin?.trim() || null,
      exampleVi: w.exampleVi?.trim() || null,
      hskLevel: w.hskLevel ?? defaultHsk,
    }));
  }

  async create(userId: string, dto: CreateDeckDto): Promise<DeckDto> {
    const wordRows =
      dto.words?.filter((w) => w.hanzi?.trim() && w.pinyin?.trim() && w.meaningVi?.trim()) ??
      [];

    const deck = await this.prisma.deck.create({
      data: {
        userId,
        title: dto.title,
        topic: dto.topic,
        hskLevel: dto.hskLevel,
        source: 'MANUAL',
        ...(wordRows.length
          ? { words: { create: this.wordCreateData(wordRows, dto.hskLevel) } }
          : {}),
      },
      include: {
        words: true,
        _count: { select: { words: true } },
      },
    });

    if (deck.words.length) {
      await this.enrollWords(
        userId,
        deck.words.map((w) => w.id),
      );
    }

    return this.toDeckDto(deck);
  }

  async addWords(
    userId: string,
    deckId: string,
    dto: AddDeckWordsDto,
  ): Promise<DeckDto & { words: WordDto[] }> {
    const deck = await this.prisma.deck.findFirst({ where: { id: deckId, userId } });
    if (!deck) throw new NotFoundException('Deck không tồn tại');

    const wordRows = dto.words.filter(
      (w) => w.hanzi?.trim() && w.pinyin?.trim() && w.meaningVi?.trim(),
    );
    if (!wordRows.length) {
      return this.findOne(userId, deckId);
    }

    const created = await this.prisma.$transaction(
      wordRows.map((w) =>
        this.prisma.word.create({
          data: {
            deckId,
            ...this.wordCreateData([w], deck.hskLevel as HskLevel)[0],
          },
        }),
      ),
    );

    await this.enrollWords(
      userId,
      created.map((w) => w.id),
    );

    return this.findOne(userId, deckId);
  }

  async update(userId: string, id: string, dto: UpdateDeckDto): Promise<DeckDto> {
    const deck = await this.prisma.deck.findFirst({ where: { id, userId } });
    if (!deck) throw new NotFoundException('Deck không tồn tại');
    const updated = await this.prisma.deck.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.topic !== undefined ? { topic: dto.topic } : {}),
        ...(dto.hskLevel !== undefined ? { hskLevel: dto.hskLevel } : {}),
      },
      include: { _count: { select: { words: true } } },
    });
    return this.toDeckDto(updated);
  }

  async exportDeck(userId: string, id: string) {
    const deck = await this.findOne(userId, id);
    return {
      title: deck.title,
      topic: deck.topic,
      hskLevel: deck.hskLevel,
      source: deck.source,
      words: deck.words,
    };
  }

  async importDeck(userId: string, payload: ImportDeckDto) {
    const wordRows = payload.words.filter(
      (w) => w.hanzi?.trim() && w.pinyin?.trim() && w.meaningVi?.trim(),
    );
    if (!wordRows.length) {
      throw new BadRequestException('File JSON phải có ít nhất một từ hợp lệ');
    }

    const deck = await this.prisma.deck.create({
      data: {
        userId,
        title: payload.title,
        topic: payload.topic,
        hskLevel: payload.hskLevel,
        source: 'MANUAL',
        words: {
          create: this.wordCreateData(wordRows, payload.hskLevel),
        },
      },
      include: { words: true, _count: { select: { words: true } } },
    });

    await this.enrollWords(
      userId,
      deck.words.map((w) => w.id),
    );

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

    await this.enrollWords(
      userId,
      deck.words.map((w) => w.id),
    );

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
