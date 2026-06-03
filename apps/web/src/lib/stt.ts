type SpeechRecognitionCtor = new () => {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

export function startChineseSpeechRecognition(
  onResult: (text: string) => void,
  onError?: (msg: string) => void,
) {
  if (typeof window === 'undefined') return () => {};

  const win = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  const SR = win.SpeechRecognition || win.webkitSpeechRecognition;

  if (!SR) {
    onError?.('Trình duyệt không hỗ trợ nhận giọng nói');
    return () => {};
  }

  const recognition = new SR();
  recognition.lang = 'zh-CN';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => {
    const text = event.results[0]?.[0]?.transcript ?? '';
    onResult(text);
  };

  recognition.onerror = () => {
    onError?.('Không nhận diện được giọng nói');
  };

  recognition.start();
  return () => recognition.stop();
}
