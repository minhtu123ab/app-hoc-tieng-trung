import { getTtsAutoPlay, getTtsRate, getTtsVoiceUri } from './tts-settings';

let voicesLoaded = false;
let speakGeneration = 0;
let voicesListenerAttached = false;

function pickZhVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  const savedUri = getTtsVoiceUri();
  return (
    (savedUri && voices.find((v) => v.voiceURI === savedUri)) ||
    voices.find((v) => v.lang.startsWith('zh'))
  );
}

/** Chỉ giữ ký tự Hán — tránh TTS đọc loạn khi lỡ truyền tiếng Việt. */
function toChineseSpeechText(text: string): string {
  const trimmed = text.trim();
  const segments = trimmed.match(/[\u4e00-\u9fff]+/g);
  if (segments?.length) return segments.join('');
  return trimmed;
}

export function speakChinese(text: string) {
  const speechText = toChineseSpeechText(text);
  if (typeof window === 'undefined' || !window.speechSynthesis || !speechText) {
    return;
  }

  const gen = ++speakGeneration;
  window.speechSynthesis.cancel();

  const run = () => {
    if (gen !== speakGeneration) return;

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.lang = 'zh-CN';
    utterance.rate = getTtsRate();

    const voice = pickZhVoice();
    if (voice) utterance.voice = voice;

    window.speechSynthesis.speak(utterance);
  };

  window.setTimeout(run, 100);
}

export function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve([]);
      return;
    }

    const pick = () => {
      const voices = window.speechSynthesis.getVoices();
      voicesLoaded = voices.length > 0;
      resolve(voices);
    };

    const voices = window.speechSynthesis.getVoices();
    if (voices.length) {
      voicesLoaded = true;
      resolve(voices);
      return;
    }

    if (!voicesListenerAttached) {
      voicesListenerAttached = true;
      window.speechSynthesis.addEventListener('voiceschanged', pick, { once: true });
    }
    window.setTimeout(pick, 300);
  });
}

export function initTts() {
  if (typeof window === 'undefined' || voicesLoaded) return;
  void loadVoices();
}

export function maybeAutoPlayListen(
  text: string,
  mode: string,
) {
  if (mode === 'LISTEN_TYPE' && getTtsAutoPlay()) {
    speakChinese(text);
  }
}
