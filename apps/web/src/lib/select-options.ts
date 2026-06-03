import { HskLevel } from '@linguaflow/shared';
import type { SelectOption } from '@/components/ui/select';

export const HSK_LEVEL_OPTIONS: SelectOption[] = Object.values(HskLevel).map(
  (level) => ({ value: level, label: level }),
);

export const HSK_FILTER_OPTIONS: SelectOption[] = [
  { value: '', label: 'Mọi HSK' },
  ...HSK_LEVEL_OPTIONS,
];

export const DECK_SOURCE_FILTER_OPTIONS: SelectOption[] = [
  { value: '', label: 'Mọi nguồn' },
  { value: 'AI', label: 'AI' },
  { value: 'MANUAL', label: 'Thủ công' },
];

export const TUTOR_ROLE_OPTIONS: SelectOption[] = [
  { value: 'teacher', label: 'Giáo viên' },
  { value: 'friend', label: 'Bạn bè' },
  { value: 'customer', label: 'Khách hàng' },
  { value: 'shopkeeper', label: 'Người bán hàng' },
];
