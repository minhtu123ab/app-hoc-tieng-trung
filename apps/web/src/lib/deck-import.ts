import type { HskLevel } from '@linguaflow/shared';

export interface DeckWordDraft {
  hanzi: string;
  pinyin: string;
  meaningVi: string;
  partOfSpeech: string;
  exampleHanzi: string;
  examplePinyin: string;
  exampleVi: string;
}

export interface DeckImportPayload {
  title: string;
  topic: string;
  hskLevel: HskLevel;
  words: Array<{
    hanzi: string;
    pinyin: string;
    meaningVi: string;
    partOfSpeech?: string | null;
    exampleHanzi?: string | null;
    examplePinyin?: string | null;
    exampleVi?: string | null;
    hskLevel?: HskLevel;
  }>;
}

export const DECK_JSON_EXAMPLE: DeckImportPayload = {
  title: 'Chào hỏi cơ bản',
  topic: 'Giao tiếp',
  hskLevel: 'HSK1' as HskLevel,
  words: [
    {
      hanzi: '你好',
      pinyin: 'nǐ hǎo',
      meaningVi: 'Xin chào',
      partOfSpeech: 'n.',
      exampleHanzi: '你好吗？',
      examplePinyin: 'nǐ hǎo ma?',
      exampleVi: 'Bạn khỏe không?',
    },
    {
      hanzi: '谢谢',
      pinyin: 'xièxie',
      meaningVi: 'Cảm ơn',
      exampleHanzi: '谢谢你。',
      examplePinyin: 'xièxie nǐ.',
      exampleVi: 'Cảm ơn bạn.',
    },
  ],
};

export const DECK_JSON_EXAMPLE_STRING = JSON.stringify(DECK_JSON_EXAMPLE, null, 2);

export function emptyWordDraft(): DeckWordDraft {
  return {
    hanzi: '',
    pinyin: '',
    meaningVi: '',
    partOfSpeech: '',
    exampleHanzi: '',
    examplePinyin: '',
    exampleVi: '',
  };
}

export function draftToApiWord(d: DeckWordDraft) {
  return {
    hanzi: d.hanzi.trim(),
    pinyin: d.pinyin.trim(),
    meaningVi: d.meaningVi.trim(),
    ...(d.partOfSpeech.trim() ? { partOfSpeech: d.partOfSpeech.trim() } : {}),
    ...(d.exampleHanzi.trim() ? { exampleHanzi: d.exampleHanzi.trim() } : {}),
    ...(d.examplePinyin.trim() ? { examplePinyin: d.examplePinyin.trim() } : {}),
    ...(d.exampleVi.trim() ? { exampleVi: d.exampleVi.trim() } : {}),
  };
}

export function validDrafts(drafts: DeckWordDraft[]) {
  return drafts
    .map(draftToApiWord)
    .filter((w) => w.hanzi && w.pinyin && w.meaningVi);
}

function normalizeWord(raw: Record<string, unknown>) {
  const hanzi = String(raw.hanzi ?? '').trim();
  const pinyin = String(raw.pinyin ?? '').trim();
  const meaningVi = String(raw.meaningVi ?? '').trim();
  if (!hanzi || !pinyin || !meaningVi) return null;
  return {
    hanzi,
    pinyin,
    meaningVi,
    ...(raw.partOfSpeech != null && String(raw.partOfSpeech).trim()
      ? { partOfSpeech: String(raw.partOfSpeech).trim() }
      : {}),
    ...(raw.exampleHanzi != null && String(raw.exampleHanzi).trim()
      ? { exampleHanzi: String(raw.exampleHanzi).trim() }
      : {}),
    ...(raw.examplePinyin != null && String(raw.examplePinyin).trim()
      ? { examplePinyin: String(raw.examplePinyin).trim() }
      : {}),
    ...(raw.exampleVi != null && String(raw.exampleVi).trim()
      ? { exampleVi: String(raw.exampleVi).trim() }
      : {}),
    ...(typeof raw.hskLevel === 'string' ? { hskLevel: raw.hskLevel as HskLevel } : {}),
  };
}

/** Chuẩn hóa JSON export/import — bỏ id, deckId, source. */
export function parseDeckImportJson(text: string): DeckImportPayload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('File không phải JSON hợp lệ');
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('JSON phải là một object');
  }
  const obj = parsed as Record<string, unknown>;
  const title = String(obj.title ?? '').trim();
  const topic = String(obj.topic ?? '').trim();
  const hskLevel = String(obj.hskLevel ?? 'HSK1').trim() as HskLevel;
  if (!title || !topic) {
    throw new Error('JSON cần có "title" và "topic"');
  }
  if (!Array.isArray(obj.words)) {
    throw new Error('JSON cần mảng "words" chứa các từ');
  }
  const words = obj.words
    .map((w) => (w && typeof w === 'object' ? normalizeWord(w as Record<string, unknown>) : null))
    .filter((w): w is NonNullable<typeof w> => w !== null);
  if (!words.length) {
    throw new Error('Mảng "words" cần ít nhất một từ có hanzi, pinyin, meaningVi');
  }
  return { title, topic, hskLevel, words };
}

/** Chỉ lấy mảng words từ file (thêm vào bộ đã có). */
export function parseWordsOnlyJson(text: string) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('File không phải JSON hợp lệ');
  }
  if (Array.isArray(parsed)) {
    const words = parsed
      .map((w) =>
        w && typeof w === 'object' ? normalizeWord(w as Record<string, unknown>) : null,
      )
      .filter((w): w is NonNullable<typeof w> => w !== null);
    if (!words.length) throw new Error('Mảng từ cần hanzi, pinyin, meaningVi');
    return words;
  }
  if (parsed && typeof parsed === 'object' && Array.isArray((parsed as { words?: unknown }).words)) {
    return parseDeckImportJson(text).words;
  }
  throw new Error('Dùng mảng từ hoặc object có trường "words"');
}
