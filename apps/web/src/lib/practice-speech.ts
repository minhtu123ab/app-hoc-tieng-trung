import { PracticeMode, type PracticeQuestion } from '@linguaflow/shared';

/** Văn bản cần đọc cho nút Nghe / TTS — luôn là tiếng Trung (Hán), không phải đáp án tiếng Việt. */
export function getPracticeSpeechText(
  mode: PracticeMode,
  q: Pick<PracticeQuestion, 'prompt' | 'answer' | 'hint'>,
): string {
  switch (mode) {
    case PracticeMode.LISTEN_TYPE:
      return q.answer;
    case PracticeMode.HAN_TO_VIET:
      return q.prompt;
    case PracticeMode.VIET_TO_HAN:
      return q.answer;
    case PracticeMode.FILL_BLANK:
      if (q.prompt.includes('___') && q.answer) {
        return q.prompt.replace('___', q.answer);
      }
      return q.answer || q.prompt;
    case PracticeMode.SENTENCE_ORDER:
      return q.answer;
    case PracticeMode.AI_CONVERSATION:
      return q.hint || q.answer;
    default:
      return q.prompt;
  }
}
