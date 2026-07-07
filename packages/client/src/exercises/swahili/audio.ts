/*
 * Wiedergabe der vorab erzeugten Kiswahili-Clips (siehe scripts/generate-swahili-audio.mjs).
 * Die Dateien liegen in public/audio/sw/ und werden vom Browser gecacht — offline-first.
 */

const cache = new Map<string, HTMLAudioElement>();
let current: HTMLAudioElement | null = null;

export interface ClipHandlers {
  onStart?: () => void;
  onEnd?: () => void;
}

export function playClip(clipId: string, handlers: ClipHandlers = {}): void {
  if (current) {
    current.pause();
    current.onplaying = null;
    current.onended = null;
  }
  let el = cache.get(clipId);
  if (!el) {
    el = new Audio(`/audio/sw/${clipId}.wav`);
    cache.set(clipId, el);
  }
  el.currentTime = 0;
  el.onplaying = handlers.onStart ?? null;
  el.onended = handlers.onEnd ?? null;
  current = el;
  void el.play().catch(() => handlers.onEnd?.());
}
