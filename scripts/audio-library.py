#!/usr/bin/env python3
"""Builds the ambient music library from the masters in audio/ (gitignored).

For every file it encodes an AAC copy into public/audio/<slug>.m4a (skipped
when the copy is newer than the master), normalised to TARGET_LUFS with one
plain gain (no compression, the dynamics stay; a light track's first play
and loop share one gain so their join stays seamless; the gain is capped so
the true peak stays under PEAK_DBTP), and measures the profile the sky
reacts by on the encoded file: RMS per tenth of a second, its quiet and
loud tenths in dB. The result is written to
app/utils/audioLibrary.ts as data: tracks per mode, their files, titles and
profiles.

  python3 scripts/audio-library.py          # encode what is missing, write the library
  python3 scripts/audio-library.py --force  # re-encode everything

Needs ffmpeg and ffprobe on the PATH.
"""
import json, os, re, subprocess, sys, tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "audio")
OUT = os.path.join(ROOT, "public", "audio")
TS = os.path.join(ROOT, "app", "utils", "audioLibrary.ts")
FORCE = "--force" in sys.argv
TARGET_LUFS = -18.0  # integrated loudness every file is brought to
PEAK_DBTP = -1.0  # the true peak no file may exceed after the gain

# The masters, by hand: which mode, which track, which role.
# dark: a track is a set of versions of the same piece, each played once
# light: a track is a first play followed by a seamless loop
DARK = {
    "Darklings": {"album": "Ghosts in the Machines", "versions": {"pitch-black": "UB_BLACKOUT_PITCH BLACK-01.wav"}},
    "Mechanics": {
        "album": "Ghosts in the Machines",
        "versions": {
            "mechanics-full": "MECHANICS/Mechanics (Full Version).wav",
            "mechanics-ambient": "MECHANICS/Mechanics (Ambient Version No Perc) (Shorter).wav",
            "mechanics-minimal": "MECHANICS/Mechanics (Minimal Version) (Shorter).wav",
        },
    },
}
LIGHT = {
    "City Sundown": ("city-sundown", "19_SfmS_CITY SUNDOWN  (LOOP - 1st play).wav", "20_SfmS_CITY SUNDOWN (LOOP).wav"),
    "States of Complacency": ("states-of-complacency", "21_SfmS_STATES OF COMPLACANCY (LOOP - 1st play).wav", "22_SfmS_STATES OF COMPLACANCY (LOOP).wav"),
    "States of Urgency": ("states-of-urgency", "23_SfmS_STATES OF URGENCY  (LOOP - 1st play).wav", "24_SfmS_STATES OF URGENCY (LOOP).wav"),
}
LIGHT_ALBUM = "Soundscapes for Modern Superheroes"


def loudness(master):
    """Integrated loudness (LUFS) and true peak (dBTP) of a master, EBU R128."""
    out = subprocess.run(
        ["ffmpeg", "-v", "info", "-i", os.path.join(SRC, master), "-af", "ebur128=peak=true", "-f", "null", "-"],
        capture_output=True, text=True,
    ).stderr
    i = re.findall(r"I:\s+(-?[\d.]+) LUFS", out)
    peak = re.findall(r"Peak:\s+(-?[\d.]+) dBFS", out)
    return float(i[-1]), float(peak[-1])


def gain_for(masters):
    """One gain in dB that brings these masters (together) to the target, peak permitting."""
    gains = []
    for m in masters:
        lufs, peak = loudness(m)
        gains.append(min(TARGET_LUFS - lufs, PEAK_DBTP - peak))
    return round(min(gains), 2)  # the quietest-headroom file sets the shared gain


def encode(master, slug, gain_db):
    src = os.path.join(SRC, master)
    dst = os.path.join(OUT, slug + ".m4a")
    if not FORCE and os.path.exists(dst) and os.path.getmtime(dst) >= os.path.getmtime(src):
        return dst
    print(f"encode {slug} ({gain_db:+.1f} dB)", file=sys.stderr)
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-i", src, "-map", "0:a:0", "-dn",
         "-af", f"volume={gain_db}dB", "-c:a", "aac", "-b:a", "192k", dst],
        check=True,
    )
    return dst


def rms_series(path):
    """RMS in dB per tenth of a second."""
    flt = "aresample=22050,asetnsamples=2205"
    with tempfile.NamedTemporaryFile(suffix=".txt", delete=False) as tmp:
        name = tmp.name
    subprocess.run(
        ["ffmpeg", "-v", "error", "-i", path, "-af",
         f"{flt},astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.RMS_level:file={name}",
         "-f", "null", "-"],
        check=True,
    )
    vals = []
    for line in open(name):
        m = re.search(r"RMS_level=(-?[\d.]+|-inf)", line)
        if m:
            vals.append(-100.0 if m.group(1) == "-inf" else float(m.group(1)))
    os.unlink(name)
    return vals


def profile(path):
    full = rms_series(path)
    q = lambda a, p: sorted(a)[int(len(a) * p)]
    return {"floorDb": round(q(full, 0.10), 1), "peakDb": round(q(full, 0.90), 1)}


def duration(path):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path]))


os.makedirs(OUT, exist_ok=True)
dark = []
for title, t in DARK.items():
    versions = []
    for slug, master in t["versions"].items():
        g = gain_for([master])
        dst = encode(master, slug, g)
        versions.append({"src": f"/audio/{slug}.m4a", "seconds": round(duration(dst)), "gainDb": g, "profile": profile(dst)})
    dark.append({"title": title, "album": t["album"], "versions": versions})
light = []
for title, (slug, first, loop) in LIGHT.items():
    g = gain_for([first, loop])  # one gain for both, so the join stays seamless
    a = encode(first, slug + "-intro", g)
    b = encode(loop, slug + "-loop", g)
    light.append({
        "title": title,
        "album": LIGHT_ALBUM,
        "intro": {"src": f"/audio/{slug}-intro.m4a", "seconds": round(duration(a)), "gainDb": g, "profile": profile(a)},
        "loop": {"src": f"/audio/{slug}-loop.m4a", "seconds": round(duration(b)), "gainDb": g, "profile": profile(b)},
    })

body = json.dumps({"dark": dark, "light": light}, indent=2)
open(TS, "w").write(
    "// Generated by scripts/audio-library.py from the masters in audio/. Do not edit.\n"
    "// Every file's profile: its quiet and loud tenths in dB, measured per tenth of a second.\n"
    'import type { TrackProfile } from "./sky/spectrum";\n\n'
    "export type AudioFile = { src: string; seconds: number; gainDb: number; profile: TrackProfile };\n"
    "export type DarkTrack = { title: string; album: string; versions: AudioFile[] };\n"
    "export type LightTrack = { title: string; album: string; intro: AudioFile; loop: AudioFile };\n\n"
    f"export const LIBRARY: {{ dark: DarkTrack[]; light: LightTrack[] }} = {body};\n"
)
print("wrote", os.path.relpath(TS, ROOT), file=sys.stderr)
