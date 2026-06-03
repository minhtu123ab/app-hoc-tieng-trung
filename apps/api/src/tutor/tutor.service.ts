import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiService } from '../gemini/gemini.service';
import { TutorAskDto, TutorChatDto } from '../common/dtos';
import { randomUUID } from 'crypto';

@Injectable()
export class TutorService {
  constructor(
    private prisma: PrismaService,
    private gemini: GeminiService,
  ) {}

  async ask(userId: string, dto: TutorAskDto, threadId = 'main') {
    const answer = await this.prisma.$transaction(async (tx) => {
      await tx.tutorMessage.create({
        data: { userId, threadId, role: 'USER', content: dto.question },
      });

      const answer = await this.gemini.explainQuestion(
        dto.question,
        dto.context,
      );

      await tx.tutorMessage.create({
        data: { userId, threadId, role: 'ASSISTANT', content: answer },
      });

      return answer;
    });

    return { answer };
  }

  async chat(userId: string, dto: TutorChatDto, threadId = 'main') {
    const reply = await this.prisma.$transaction(async (tx) => {
      await tx.tutorMessage.create({
        data: { userId, threadId, role: 'USER', content: dto.message },
      });

      const history = await tx.tutorMessage.findMany({
        where: { userId, threadId },
        orderBy: { createdAt: 'asc' },
        take: 20,
      });

      const reply = await this.gemini.chatAsRole(
        dto.message,
        dto.role ?? 'teacher',
        history.map((m) => ({ role: m.role, content: m.content })),
      );

      await tx.tutorMessage.create({
        data: { userId, threadId, role: 'ASSISTANT', content: reply },
      });

      return reply;
    });

    return { reply };
  }

  async getHistory(userId: string, threadId = 'main') {
    const messages = await this.prisma.tutorMessage.findMany({
      where: { userId, threadId },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });
    return messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      threadId: m.threadId,
      createdAt: m.createdAt.toISOString(),
    }));
  }

  async listThreads(userId: string) {
    const messages = await this.prisma.tutorMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    const map = new Map<
      string,
      { threadId: string; preview: string; updatedAt: string }
    >();
    for (const m of messages) {
      if (!map.has(m.threadId)) {
        map.set(m.threadId, {
          threadId: m.threadId,
          preview: m.content.slice(0, 80),
          updatedAt: m.createdAt.toISOString(),
        });
      }
    }
    return Array.from(map.values());
  }

  async createThread(userId: string) {
    const threadId = randomUUID();
    return { threadId };
  }

  async clearHistory(userId: string, threadId?: string) {
    await this.prisma.tutorMessage.deleteMany({
      where: threadId ? { userId, threadId } : { userId },
    });
    return { ok: true };
  }
}
