// Optional sound hooks — simple synthesized tones, mutable from the UI.
let ctx: AudioContext | null = null;
let muted = false;
export function setMuted(m: boolean) {
  muted = m;
}

function tone(freq: number, dur: number, type: OscillatorType = "sine", delay = 0, vol = 0.15) {
  if (muted || typeof window === "undefined") return;
  try {
    ctx ??= new AudioContext();
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + dur);
  } catch {
    /* ignore */
  }
}

export const sfx = {
  correct: () => {
    tone(660, 0.15, "triangle");
    tone(990, 0.3, "triangle", 0.12);
  },
  wrong: () => tone(140, 0.45, "sawtooth", 0, 0.12),
  strikeOut: () => {
    tone(160, 0.3, "sawtooth");
    tone(110, 0.6, "sawtooth", 0.25);
  },
  select: () => tone(520, 0.12, "square", 0, 0.06),
  reveal: () => tone(440, 0.25, "triangle"),
  win: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.4, "triangle", i * 0.15)),
};
