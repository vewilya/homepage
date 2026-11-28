/**
 * What the music is doing right now, for the sky to move with.
 *
 * The audio composable hands over one AnalyserNode that sits after the
 * track gains, so the reading follows what is actually heard, fades
 * included, and tells this module which file's profile applies: every
 * file is measured on its own (scripts/audio-library.py), where its floor
 * and its peak lie in decibels, because the tracks are nothing alike.
 *
 * `sampleAudio` gives one reading a frame:
 * - level, 0..1, the presence: from two halves, where the loudness sits
 *   between the file's floor and peak, and where it sits against its own
 *   last ten seconds, so a track with little range (the light ones move
 *   over 15 dB where Darklings moves over 33) still breathes with every
 *   swell;
 * - low and high, 0..1, the bass and the treble against their own recent
 *   peaks;
 * - lowHit and highHit, the hits: a fast follower of each band against a
 *   slow one, and a sudden rise above the band's usual wobble is an onset,
 *   a kick or a bass note below, a hi-hat or a click above. Each is an
 *   envelope that jumps to the hit's strength and falls away in a fraction
 *   of a second;
 * - beats and clicks, how many of each there have been, so an effect can
 *   step on every one.
 * No Vue in here, so the effects run on their own.
 */
export type TrackProfile = {
  floorDb: number; // RMS below which the grain is dark (the file's quiet 10%)
  peakDb: number; // RMS at which the grain is full (the file's loud 10%)
};
export type AudioReading = {
  level: number;
  low: number;
  high: number;
  lowHit: number;
  highHit: number;
  beats: number;
  clicks: number;
};
const DEFAULT_PROFILE: TrackProfile = { floorDb: -48, peakDb: -16 };
const SILENCE_DB = -70;

let profile = DEFAULT_PROFILE;
let gainDb = 0; // the track gain's dB offset: the profiles were measured on the files
let analyser: AnalyserNode | undefined;
let raw = new Uint8Array(0); // the waveform
let freq = new Uint8Array(0); // the spectrum
let lowBins: [number, number] = [0, 3]; // up to ~250 Hz
let highBins: [number, number] = [53, 150]; // ~5 to 14 kHz

let fullDb = SILENCE_DB;
let recentDb = SILENCE_DB; // ~10s average, the swell's reference
const SWELL_DB = 5; // this far above the recent average is a full swell

/** One band's followers and its hit detector. */
type Band = {
  fast: number; // ~60 ms follower
  slow: number; // ~0.8 s follower, the band's baseline
  dev: number; // how much the band usually wobbles around its baseline
  peak: number; // its recent peak, for the normalised level
  hit: number; // the hit envelope
  last: number; // when the last hit was, in seconds
  count: number;
};
const band = (): Band => ({ fast: 0, slow: 0, dev: 0, peak: 0.01, hit: 0, last: -1, count: 0 });
const low = band();
const high = band();

const reading: AudioReading = {
  level: 0,
  low: 0,
  high: 0,
  lowHit: 0,
  highHit: 0,
  beats: 0,
  clicks: 0,
};

export const attachAnalyser = (node: AnalyserNode) => {
  analyser = node;
  raw = new Uint8Array(node.fftSize);
  freq = new Uint8Array(node.frequencyBinCount);
  const hz = node.context.sampleRate / node.fftSize; // one bin's width
  lowBins = [0, Math.max(2, Math.round(250 / hz))];
  highBins = [Math.round(5000 / hz), Math.min(node.frequencyBinCount, Math.round(14000 / hz))];
};

export const setProfile = (next: TrackProfile, gain: number) => {
  profile = next;
  gainDb = gain > 0 ? 20 * Math.log10(gain) : -60;
};

const toDb = (rms: number) => (rms > 0 ? Math.max(SILENCE_DB, 20 * Math.log10(rms)) : SILENCE_DB);

const energy = (from: number, to: number) => {
  let sum = 0;
  for (let i = from; i < to; i++) sum += freq[i]!;
  return sum / ((to - from) * 255);
};

/**
 * Runs one band's detector on this frame's energy. Returns the band's level
 * against its recent peak; the hit envelope is left on the band.
 */
const detect = (b: Band, e: number, dt: number, now: number, hold: number, release: number) => {
  b.fast += (e - b.fast) * Math.min(1, dt / 0.06);
  b.slow += (e - b.slow) * Math.min(1, dt / 0.8);
  const rise = b.fast - b.slow;
  b.dev += (Math.abs(rise) - b.dev) * Math.min(1, dt / 2);
  b.peak = Math.max(e, b.peak * Math.exp(-dt / 6), 0.01);
  // an onset: the rise clears the band's usual wobble by a margin, and the
  // last hit is long enough ago
  const threshold = 0.03 + 1.6 * b.dev;
  if (rise > threshold && now - b.last > hold) {
    const strength = Math.min(1, 0.5 + (0.5 * (rise - threshold)) / threshold);
    b.hit = Math.max(b.hit, strength);
    b.last = now;
    b.count++;
  }
  b.hit *= Math.exp(-dt / release);
  if (b.hit < 0.01) b.hit = 0;
  return Math.min(1, e / b.peak);
};

/** This frame's reading; `dt` and `now` in seconds. The same object every call. */
export const sampleAudio = (dt: number, now: number): AudioReading => {
  if (!analyser) return reading;
  analyser.getByteTimeDomainData(raw);
  let sum = 0;
  for (let i = 0; i < raw.length; i++) {
    const d = (raw[i]! - 128) / 128;
    sum += d * d;
  }
  fullDb += (toDb(Math.sqrt(sum / raw.length)) - fullDb) * 0.5;
  recentDb += (fullDb - recentDb) * 0.004; // ~10s at 25 readings a second

  const floor = profile.floorDb + gainDb;
  const peak = profile.peakDb + gainDb;
  const range = Math.max(0, Math.min(1, (fullDb - floor) / (peak - floor)));
  const swell = Math.max(0, Math.min(1, 0.5 + (fullDb - recentDb) / (2 * SWELL_DB)));
  const silent = fullDb <= SILENCE_DB + 1;
  const v = silent ? 0 : 0.5 * range + 0.5 * swell;
  reading.level += (v - reading.level) * (v > reading.level ? 0.4 : 0.08);

  if (silent) {
    reading.low = reading.high = reading.lowHit = reading.highHit = 0;
    low.hit = high.hit = 0;
    return reading;
  }
  analyser.getByteFrequencyData(freq);
  reading.low = detect(low, energy(lowBins[0], lowBins[1]), dt, now, 0.2, 0.35);
  reading.high = detect(high, energy(highBins[0], highBins[1]), dt, now, 0.07, 0.15);
  reading.lowHit = low.hit;
  reading.highHit = high.hit;
  reading.beats = low.count;
  reading.clicks = high.count;
  return reading;
};
