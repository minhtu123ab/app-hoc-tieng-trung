import { WordStatus } from '@linguaflow/shared';

const LABELS: Record<WordStatus, string> = {
  [WordStatus.NEW]: 'Mới',
  [WordStatus.LEARNING]: 'Đang học',
  [WordStatus.FORGETTING]: 'Đang quên',
  [WordStatus.MASTERED]: 'Thành thạo',
};

export function wordStatusLabel(status: WordStatus | string): string {
  return LABELS[status as WordStatus] ?? status;
}
