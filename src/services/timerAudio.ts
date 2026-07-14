// Sonidos del cronómetro generados con WebAudio (sin archivos de audio).
// El AudioContext debe desbloquearse con un gesto del usuario (unlockAudio),
// porque los navegadores móviles lo crean suspendido.

type Tone = { frequency: number; durationMs: number; delayMs: number; volume?: number };

let audioContext: AudioContext | null = null;
let soundEnabled = true;
let vibrationEnabled = true;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext ?? (window as any).webkitAudioContext;
  if (!Ctor) return null;
  if (!audioContext) audioContext = new Ctor();
  return audioContext;
}

/** Debe llamarse dentro de un gesto del usuario (tap en "Empezar") */
export async function unlockAudio(): Promise<void> {
  const ctx = getContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch {
      // Si el navegador lo rechaza seguimos sin sonido, no rompemos la clase.
    }
  }
}

export function configureAudio(options: { sound?: boolean; vibration?: boolean }): void {
  if (options.sound !== undefined) soundEnabled = options.sound;
  if (options.vibration !== undefined) vibrationEnabled = options.vibration;
}

// Reproduce una secuencia de tonos con envolvente suave para evitar clics
function playTones(tones: Tone[]): void {
  if (!soundEnabled) return;
  const ctx = getContext();
  if (!ctx || ctx.state !== 'running') return;

  for (const tone of tones) {
    const startAt = ctx.currentTime + tone.delayMs / 1000;
    const endAt = startAt + tone.durationMs / 1000;
    const peak = tone.volume ?? 0.35;

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(tone.frequency, startAt);

    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(peak, startAt + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, endAt);

    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(startAt);
    oscillator.stop(endAt + 0.02);
  }
}

function vibrate(pattern: number | number[]): void {
  if (!vibrationEnabled) return;
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}

/** Pip corto y agudo: cada uno de los últimos 3 segundos del ejercicio */
export function playCountdownPip(): void {
  playTones([{ frequency: 880, durationMs: 110, delayMs: 0 }]);
  vibrate(60);
}

/** Pip de aviso (más grave y doble): faltan N segundos para terminar */
export function playWarningPip(): void {
  playTones([
    { frequency: 523, durationMs: 130, delayMs: 0 },
    { frequency: 523, durationMs: 130, delayMs: 180 },
  ]);
  vibrate([60, 80, 60]);
}

/** Fin del ejercicio, arranca el descanso: tono descendente */
export function playRestStart(): void {
  playTones([
    { frequency: 660, durationMs: 140, delayMs: 0 },
    { frequency: 440, durationMs: 220, delayMs: 150 },
  ]);
  vibrate([100, 60, 140]);
}

/** Arranca el trabajo (fin de la cuenta regresiva o del descanso): tono largo y agudo */
export function playWorkStart(): void {
  playTones([{ frequency: 1174, durationMs: 420, delayMs: 0, volume: 0.45 }]);
  vibrate(220);
}

/** Comienzo de la clase */
export function playClassStart(): void {
  playTones([
    { frequency: 587, durationMs: 160, delayMs: 0 },
    { frequency: 880, durationMs: 160, delayMs: 190 },
    { frequency: 1174, durationMs: 460, delayMs: 380, volume: 0.45 },
  ]);
  vibrate([200, 80, 200]);
}

/** Fin de la clase */
export function playClassEnd(): void {
  playTones([
    { frequency: 880, durationMs: 200, delayMs: 0 },
    { frequency: 660, durationMs: 200, delayMs: 230 },
    { frequency: 440, durationMs: 700, delayMs: 460, volume: 0.45 },
  ]);
  vibrate([300, 100, 300, 100, 500]);
}

/** Cambio de sección */
export function playSectionChange(): void {
  playTones([
    { frequency: 440, durationMs: 180, delayMs: 0 },
    { frequency: 587, durationMs: 180, delayMs: 200 },
    { frequency: 440, durationMs: 180, delayMs: 400 },
  ]);
  vibrate([150, 100, 150]);
}
