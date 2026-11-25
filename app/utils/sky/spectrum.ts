/**
 * How loud the music is right now, for the sky to breathe with.
 *
 * The audio composable hands over one AnalyserNode that sits after the
 * track gains, so the reading follows what is actually heard, fades
 * included. `sampleLevel` takes the RMS of the waveform with a quick attack
 * and a slow release and returns it as 0..1. Without an analyser, or while
 * nothing plays, it decays to zero and the sky is just ambient.
 * No Vue in here, so the effects can be run on their own.
 */
let analyser: AnalyserNode | undefined;
let raw = new Uint8Array(0);
let freq = new Uint8Array(0);
let level = 0;
let highs = 0; // the top of the spectrum, smoothed quickly
let highsSlow = 0; // and slowly, as the baseline an onset rises above
let highsBefore = 0; // last reading, so only a rise counts

export const attachAnalyser = (node: AnalyserNode) => {
  analyser = node;
  raw = new Uint8Array(node.fftSize);
  freq = new Uint8Array(node.frequencyBinCount);
};

/**
 * A transient in the high frequencies: how far the treble just jumped
 * above its recent average, 0..1. Hi-hats, clicks, the attack of a bright
 * note. Zero while nothing plays.
 */
export const sampleHighOnset = (): number => {
  let v = 0;
  if (analyser) {
    analyser.getByteFrequencyData(freq);
    const nyquist = analyser.context.sampleRate / 2;
    const i0 = Math.floor((4000 / nyquist) * freq.length);
    const i1 = Math.min(freq.length, Math.ceil((14000 / nyquist) * freq.length));
    let sum = 0;
    for (let i = i0; i < i1; i++) sum += freq[i]!;
    v = Math.pow(sum / Math.max(1, i1 - i0) / 255, 1.5);
  }
  highsBefore = highs;
  highs += (v - highs) * 0.7;
  highsSlow += (highs - highsSlow) * 0.03;
  // an onset is a rise: the treble climbing right now, and clearly above
  // its own recent baseline, as a ratio so a quiet track's transients count
  if (highsSlow < 0.004 || highs <= highsBefore * 1.05) return 0;
  return Math.max(0, Math.min(1, (highs / highsSlow - 1.4) / 1.2));
};

/** The smoothed loudness, 0..1. */
export const sampleLevel = (): number => {
  let v = 0;
  if (analyser) {
    analyser.getByteTimeDomainData(raw);
    let sum = 0;
    for (let i = 0; i < raw.length; i++) {
      const d = (raw[i]! - 128) / 128;
      sum += d * d;
    }
    // RMS on a perceptual curve: ambient music sits around -20 dB, which
    // should already read as a good presence, not as near-silence
    v = Math.min(1, Math.sqrt(Math.sqrt(sum / raw.length) * 4));
  }
  level += (v - level) * (v > level ? 0.4 : 0.08); // attack fast, release slow
  return level;
};
