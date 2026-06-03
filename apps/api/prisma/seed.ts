import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const HSK1_WORDS = [
  {
    hanzi: '苹果',
    pinyin: 'píngguǒ',
    meaningVi: 'Quả táo',
    partOfSpeech: 'noun',
    exampleHanzi: '我喜欢吃苹果',
    examplePinyin: 'wǒ xǐhuan chī píngguǒ',
    exampleVi: 'Tôi thích ăn táo',
  },
  {
    hanzi: '学生',
    pinyin: 'xuésheng',
    meaningVi: 'Học sinh',
    partOfSpeech: 'noun',
    exampleHanzi: '我是学生',
    examplePinyin: 'wǒ shì xuésheng',
    exampleVi: 'Tôi là học sinh',
  },
  {
    hanzi: '中文',
    pinyin: 'Zhōngwén',
    meaningVi: 'Tiếng Trung',
    partOfSpeech: 'noun',
    exampleHanzi: '我在学中文',
    examplePinyin: 'wǒ zài xué Zhōngwén',
    exampleVi: 'Tôi đang học tiếng Trung',
  },
  {
    hanzi: '高兴',
    pinyin: 'gāoxìng',
    meaningVi: 'Vui, hạnh phúc',
    partOfSpeech: 'adjective',
    exampleHanzi: '今天我很高兴',
    examplePinyin: 'jīntiān wǒ hěn gāoxìng',
    exampleVi: 'Hôm nay tôi rất vui',
  },
  {
    hanzi: '学习',
    pinyin: 'xuéxí',
    meaningVi: 'Học tập',
    partOfSpeech: 'verb',
    exampleHanzi: '我喜欢学习',
    examplePinyin: 'wǒ xǐhuan xuéxí',
    exampleVi: 'Tôi thích học tập',
  },
];

async function main() {
  const existing = await prisma.user.findUnique({
    where: { email: 'demo@linguaflow.ai' },
  });

  if (existing) {
    console.log('Seed data already exists, skipping.');
    return;
  }

  const bcrypt = await import('bcrypt');
  const passwordHash = await bcrypt.hash('demo123456', 10);

  const user = await prisma.user.create({
    data: {
      email: 'demo@linguaflow.ai',
      passwordHash,
      name: 'Demo User',
      hskLevel: 'HSK1',
    },
  });

  const deck = await prisma.deck.create({
    data: {
      userId: user.id,
      title: 'HSK1 Cơ bản',
      topic: 'Đời sống',
      hskLevel: 'HSK1',
      source: 'MANUAL',
      words: {
        create: HSK1_WORDS.map((w) => ({
          ...w,
          hskLevel: 'HSK1' as const,
        })),
      },
    },
    include: { words: true },
  });

  for (const word of deck.words) {
    await prisma.userWordProgress.create({
      data: {
        userId: user.id,
        wordId: word.id,
        status: 'NEW',
        dueDate: new Date(),
      },
    });
  }

  console.log('Seed completed: demo@linguaflow.ai / demo123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
