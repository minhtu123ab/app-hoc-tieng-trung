import {
  Injectable,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { GeneratedWord, HskLevel } from '@linguaflow/shared';

@Injectable()
export class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private modelName: string;

  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
    this.modelName =
      this.config.get<string>('GEMINI_MODEL') ?? 'gemini-2.5-flash-lite';
  }

  private ensureClient() {
    if (!this.genAI) {
      throw new BadRequestException(
        'GEMINI_API_KEY chưa được cấu hình. Thêm key vào apps/api/.env',
      );
    }
    return this.genAI;
  }

  private getModel(generationConfig?: Record<string, unknown>) {
    const genAI = this.ensureClient();
    return genAI.getGenerativeModel({
      model: this.modelName,
      ...(generationConfig ? { generationConfig } : {}),
    });
  }

  private handleGeminiError(error: unknown): never {
    const err = error as { status?: number; message?: string };
    if (err.status === 429) {
      throw new HttpException(
        'Đã vượt quota Gemini API (free tier). Hãy đợi vài phút, đổi model trong GEMINI_MODEL, hoặc bật billing tại Google AI Studio.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    if (err.status === 403) {
      throw new HttpException(
        'API key Gemini không hợp lệ hoặc chưa được kích hoạt.',
        HttpStatus.FORBIDDEN,
      );
    }
    throw new HttpException(
      err.message ?? 'Lỗi khi gọi Gemini API',
      HttpStatus.BAD_GATEWAY,
    );
  }

  async generateVocabulary(
    topic: string,
    hskLevel: HskLevel,
    count: number,
  ): Promise<GeneratedWord[]> {
    const model = this.getModel({
      responseMimeType: 'application/json',
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          words: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                hanzi: { type: SchemaType.STRING },
                pinyin: { type: SchemaType.STRING },
                meaningVi: { type: SchemaType.STRING },
                partOfSpeech: { type: SchemaType.STRING },
                exampleHanzi: { type: SchemaType.STRING },
                examplePinyin: { type: SchemaType.STRING },
                exampleVi: { type: SchemaType.STRING },
              },
              required: ['hanzi', 'pinyin', 'meaningVi'],
            },
          },
        },
        required: ['words'],
      },
    });

    const prompt = `Bạn là chuyên gia dạy tiếng Trung cho người Việt.
Sinh ${count} từ/cụm từ tiếng Trung phù hợp trình độ ${hskLevel}, chủ đề "${topic}".
Mỗi từ cần: hanzi, pinyin (dấu thanh đầy đủ), nghĩa tiếng Việt, loại từ, câu ví dụ (Hán, pinyin, Việt).
Chỉ dùng từ vựng phù hợp ${hskLevel}. Không trùng lặp.`;

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const parsed = JSON.parse(text) as { words: GeneratedWord[] };
      return parsed.words.slice(0, count);
    } catch (error) {
      this.handleGeminiError(error);
    }
  }

  async explainQuestion(question: string, context?: string): Promise<string> {
    const model = this.getModel();
    const prompt = `Bạn là gia sư tiếng Trung, trò chuyện 1-1 với học viên Việt Nam bằng tiếng Việt.

QUY TẮC BẮT BUỘC:
- Giọng thân thiện, súc tích, dễ đọc trên điện thoại. KHÔNG viết như bài luận, tài liệu README hay giáo trình dài.
- KHÔNG dùng tiêu đề markdown (##, ###), KHÔNG dùng đường kẻ ---, KHÔNG lồng danh sách nhiều cấp.
- Chia 2–4 đoạn văn ngắn; mỗi ý chính 2–3 câu, kèm 1–2 ví dụ là đủ.
- Chỉ dùng **in đậm** cho từ/cụm tiếng Trung quan trọng (ví dụ: **会 (huì)**).
- Mỗi ví dụ tiếng Trung trên một dòng: 汉字 (pinyin) — nghĩa tiếng Việt.
- Kết thúc bằng một câu khích lệ ngắn (không emoji).

${context ? `Ngữ cảnh: ${context}\n` : ''}Câu hỏi của học viên: ${question}`;

    try {
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      this.handleGeminiError(error);
    }
  }

  async chatAsRole(
    message: string,
    role: string,
    history: Array<{ role: string; content: string }>,
  ): Promise<string> {
    const model = this.getModel();

    const roleDescriptions: Record<string, string> = {
      teacher: 'giáo viên tiếng Trung kiên nhẫn',
      friend: 'bạn bè thân thiết nói tiếng Trung',
      customer: 'khách hàng trong cửa hàng',
      shopkeeper: 'người bán hàng thân thiện',
    };

    const systemPrompt = `Bạn đóng vai ${roleDescriptions[role] ?? roleDescriptions.teacher}.
Giao tiếp bằng tiếng Trung đơn giản, kèm pinyin và dịch tiếng Việt trong ngoặc khi cần.
Khuyến khích người học trả lời bằng tiếng Trung.
Trả lời ngắn gọn (2–6 câu), không dùng tiêu đề markdown hay danh sách dài.`;

    const historyText = history
      .slice(-6)
      .map((m) => `${m.role === 'USER' ? 'Học viên' : 'AI'}: ${m.content}`)
      .join('\n');

    const prompt = `${systemPrompt}\n\nLịch sử:\n${historyText}\n\nHọc viên: ${message}\n\nTrả lời:`;

    try {
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      this.handleGeminiError(error);
    }
  }

  async generateFillBlank(sentence: string, blankWord: string): Promise<string> {
    const model = this.getModel();
    const prompt = `Tạo câu điền từ tiếng Trung từ câu "${sentence}", thay từ "${blankWord}" bằng ___.
Trả về JSON: {"sentenceWithBlank": "...", "answer": "${blankWord}"}`;

    try {
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' },
      });
      return result.response.text();
    } catch (error) {
      this.handleGeminiError(error);
    }
  }
}
