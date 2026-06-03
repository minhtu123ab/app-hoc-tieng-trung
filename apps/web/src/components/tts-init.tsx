'use client';

import { useEffect } from 'react';
import { initTts } from '@/lib/tts';

export function TtsInit() {
  useEffect(() => {
    initTts();
  }, []);
  return null;
}
