import { getTtsAutoPlay, getTtsRate, getTtsVoiceUri } from './tts-settings';

let voicesLoaded = false;

export function speakChinese(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-CN';
  utterance.rate = getTtsRate();

  const voices = window.speechSynthesis.getVoices();
  const savedUri = getTtsVoiceUri();
  const zhVoice =
    (savedUri && voices.find((v) => v.voiceURI === savedUri)) ||
    voices.find((v) => v.lang.startsWith('zh'));
  if (zhVoice) utterance.voice = zhVoice;

  window.speechSynthesis.speak(utterance);
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
    window.speechSynthesis.onvoiceschanged = () => {
      pick();
    };
    setTimeout(pick, 250);
  });
}

export function initTts() {
  if (typeof window === 'undefined' || voicesLoaded) return;
  void loadVoices();
}

export function maybeAutoPlayListen(text: string, mode: string) {
  if (mode === 'LISTEN_TYPE' && getTtsAutoPlay()) {
    speakChinese(text);
  }
}
