const STORAGE_KEY = 'lf_practice_limit';
const DEFAULT_LIMIT = 10;
const MIN_LIMIT = 1;
const MAX_LIMIT = 500;

export const PRACTICE_LIMIT_PRESETS = [10, 20, 30, 50, 100] as const;

export function clampPracticeLimit(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_LIMIT;
  return Math.min(Math.max(Math.round(value), MIN_LIMIT), MAX_LIMIT);
}

export function getStoredPracticeLimit(): number {
  if (typeof window === 'undefined') return DEFAULT_LIMIT;
  const raw = localStorage.getItem(STORAGE_KEY);
  return clampPracticeLimit(raw ? parseInt(raw, 10) : DEFAULT_LIMIT);
}

export function setStoredPracticeLimit(value: number): number {
  const limit = clampPracticeLimit(value);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, String(limit));
  }
  return limit;
}

export function parsePracticeLimitParam(value: string | null): number {
  if (!value) return getStoredPracticeLimit();
  return clampPracticeLimit(parseInt(value, 10));
}
