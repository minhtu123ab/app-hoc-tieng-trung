import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiService } from '../gemini/gemini.service';
import { TutorAskDto, TutorChatDto } from '../common/dtos';

@Injectable()
export class TutorService {
  constructor(
    private prisma: PrismaService,
    private gemini: GeminiService,
  ) {}

  async ask(userId: string, dto: TutorAskDto) {
    await this.prisma.tutorMessage.create({
      data: { userId, role: 'USER', content: dto.question },
    });

    const answer = await this.gemini.explainQuestion(dto.question, dto.context);

    await this.prisma.tutorMessage.create({
      data: { userId, role: 'ASSISTANT', content: answer },
    });

    return { answer };
  }

  async chat(userId: string, dto: TutorChatDto) {
    await this.prisma.tutorMessage.create({
      data: { userId, role: 'USER', content: dto.message },
    });

    const history = await this.prisma.tutorMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });

    const reply = await this.gemini.chatAsRole(
      dto.message,
      dto.role ?? 'teacher',
      history.map((m) => ({ role: m.role, content: m.content })),
    );

    await this.prisma.tutorMessage.create({
      data: { userId, role: 'ASSISTANT', content: reply },
    });

    return { reply };
  }

  async getHistory(userId: string) {
    const messages = await this.prisma.tutorMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });
    return messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    }));
  }
}
