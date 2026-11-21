// Synthesised sound effects for Twin Tales, built with the Web Audio API.
// No audio files are shipped: every effect is a short envelope over one or two
// oscillators, created lazily on the first user gesture so browsers allow it.
let context = null;
let muted = false;

function audioContext() {
  if (context) return context;
  try {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    context = new Ctor();
  } catch {
    return null;
  }
  return context;
}

/** Call from the first pointer or key gesture so later sounds are allowed to play. */
export function unlockAudio() {
  const ctx = audioContext();
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function isMuted() {
  return muted;
}

function tone({ frequency, endFrequency = null, duration = 0.15, type = 'sine', volume = 0.16, delay = 0 }) {
  if (muted) return;
  const ctx = audioContext();
  if (!ctx) return;
  try {
    const start = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, start);
    if (endFrequency !== null) osc.frequency.exponentialRampToValueAtTime(endFrequency, start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.05);
  } catch {
    // Headless or blocked audio must never break the game.
  }
}

/** A bright two-note chime when a difference is found. */
export function playFind() {
  tone({ frequency: 660, duration: 0.12, type: 'sine', volume: 0.2 });
  tone({ frequency: 990, duration: 0.22, type: 'sine', volume: 0.18, delay: 0.09 });
}

/** A low dull thud for a wrong click. */
export function playMiss() {
  tone({ frequency: 160, endFrequency: 90, duration: 0.22, type: 'triangle', volume: 0.18 });
}

/** A soft shimmer when a hint is spent. */
export function playHint() {
  tone({ frequency: 880, endFrequency: 1320, duration: 0.3, type: 'sine', volume: 0.12 });
}

/** A rising three-note arpeggio for clearing a scene. */
export function playSceneClear() {
  tone({ frequency: 523, duration: 0.16, volume: 0.18 });
  tone({ frequency: 659, duration: 0.16, volume: 0.18, delay: 0.13 });
  tone({ frequency: 784, duration: 0.34, volume: 0.18, delay: 0.26 });
}

/** A longer fanfare for finishing the whole game. */
export function playGameWin() {
  const notes = [523, 659, 784, 1047, 784, 1047];
  notes.forEach((frequency, index) => {
    tone({ frequency, duration: 0.2, volume: 0.16, delay: index * 0.14 });
  });
}

/** A quiet tick for menu movement and the last ten seconds of the clock. */
export function playTick() {
  tone({ frequency: 1200, duration: 0.05, type: 'square', volume: 0.05 });
}

/** A single click for buttons and menu choices. */
export function playClick() {
  tone({ frequency: 440, duration: 0.07, type: 'triangle', volume: 0.12 });
}
