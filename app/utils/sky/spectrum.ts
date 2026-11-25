/**
 * How present the music is right now, for the sky to breathe with.
 *
 * The audio composable hands over one AnalyserNode that sits after the
 * track gains, so the reading follows what is actually heard, fades
 * included, and tells this module which file's profile applies: every
 * file is measured on its own (scripts/audio-library.py), where its floor
 * and its peak lie in decibels, because the tracks are nothing alike.
 * `sampleLevel` gives the presence, 0..1, from two halves: where the
 * loudness sits between the file's floor and peak, and where it sits
 * against its own last ten seconds, so a track with little range (the
 * light ones move over 15 dB where Darklings moves over 33) still breathes
 * with every swell. No Vue in here, so the effects run on their own.
 */
export type TrackProfile = {
  floorDb: number; // RMS below which the grain is dark (the file's quiet 10%)
  peakDb: number; // RMS at which the grain is full (the file's loud 10%)
};
const DEFAULT_PROFILE: TrackProfile = { floorDb: -48, peakDb: -16 };
const SILENCE_DB = -70;

let profile = DEFAULT_PROFILE;
let gainDb = 0; // the track gain's dB offset: the profiles were measured on the files
let analyser: AnalyserNode | undefined;
let raw = new Uint8Array(0);

let fullDb = SILENCE_DB;
let recentDb = SILENCE_DB; // ~10s average, the swell's reference
let level = 0;
const SWELL_DB = 5; // this far above the recent average is a full swell

export const attachAnalyser = (node: AnalyserNode) => {
  analyser = node;
  raw = new Uint8Array(node.fftSize);
};

export const setProfile = (next: TrackProfile, gain: number) => {
  profile = next;
  gainDb = gain > 0 ? 20 * Math.log10(gain) : -60;
};

const toDb = (rms: number) => (rms > 0 ? Math.max(SILENCE_DB, 20 * Math.log10(rms)) : SILENCE_DB);

const read = () => {
  if (!analyser) return;
  analyser.getByteTimeDomainData(raw);
  let sum = 0;
  for (let i = 0; i < raw.length; i++) {
    const d = (raw[i]! - 128) / 128;
    sum += d * d;
  }
  fullDb += (toDb(Math.sqrt(sum / raw.length)) - fullDb) * 0.5;
  recentDb += (fullDb - recentDb) * 0.004; // ~10s at 25 readings a second
};

/** The presence, 0..1: silence or the track's floor 0, its peak 1. */
export const sampleLevel = (): number => {
  read();
  const floor = profile.floorDb + gainDb;
  const peak = profile.peakDb + gainDb;
  const range = Math.max(0, Math.min(1, (fullDb - floor) / (peak - floor)));
  const swell = Math.max(0, Math.min(1, 0.5 + (fullDb - recentDb) / (2 * SWELL_DB)));
  const v = fullDb <= SILENCE_DB + 1 ? 0 : 0.5 * range + 0.5 * swell;
  level += (v - level) * (v > level ? 0.4 : 0.08);
  return level;
};
