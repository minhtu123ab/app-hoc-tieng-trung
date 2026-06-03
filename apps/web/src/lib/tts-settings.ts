const RATE_KEY = 'lf_tts_rate';
const VOICE_KEY = 'lf_tts_voice';
const AUTO_PLAY_KEY = 'lf_tts_autoplay';

export function getTtsRate(): number {
  if (typeof window === 'undefined') return 0.85;
  const v = parseFloat(localStorage.getItem(RATE_KEY) ?? '0.85');
  return Number.isFinite(v) ? Math.min(2, Math.max(0.5, v)) : 0.85;
}

export function setTtsRate(rate: number) {
  localStorage.setItem(RATE_KEY, String(rate));
}

export function getTtsVoiceUri(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(VOICE_KEY);
}

export function setTtsVoiceUri(uri: string) {
  localStorage.setItem(VOICE_KEY, uri);
}

export function getTtsAutoPlay(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(AUTO_PLAY_KEY) === '1';
}

export function setTtsAutoPlay(on: boolean) {
  localStorage.setItem(AUTO_PLAY_KEY, on ? '1' : '0');
}
