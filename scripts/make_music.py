#!/usr/bin/env python3
"""Compose an episode's music from its script.json (v4): a modern, catchy 120 bpm track cut to the
edit, with the SPECIMIND sound logo, that loops seamlessly.

    python3 scripts/make_music.py episodes/E001-hunyuan3d/script.json     # -> <episode>/music.wav
    python3 scripts/make_music.py <script.json> --out x.wav --groove 3 --key 5

v4 (2026-10-09). What changed and why (prompts/voice.md v3, "Music"):
- v3 sounded like a novelty record: square-wave leads, a tape-stop + scratch + "sad wah" gag on the
  flaw, organ stabs. Viewers found it unpleasant and funny. v4 is modern electronic pop production:
  band-limited supersaws, plucks and FM bells, a punchy kick with sidechain pump, a real reverb and a
  ping-pong delay, humanised timing and velocity.
- Brand recognition: THE TAG. The same four-note phrase (scale degrees 1-5-3-6, the old A-E-C#-F#
  motif) on the same glassy synth opens every video on frame 0 and comes back when the verdict stamp
  lands. You know it's SPECIMIND in a second.
- No two tracks alike: six styles (below), a key and a chord progression per episode, and a topline
  built from the tag's intervals over that episode's chords, with its own rhythm.
- It follows the story: room to read under the explaining beats, the topline arrives with the result,
  a calm filtered breakdown under the catch (thoughtful, never a joke), a build into the score with the
  impact on the number, the full chorus on the verdict.

Styles (script.json "groove": 1-6; never the previous upload's):
    1 future house · 2 melodic house · 3 synthwave pop · 4 future garage · 5 electro pop · 6 chill house

Everything is synthesised with numpy/scipy: no samples, nothing to license, nothing for Content ID to
match. Deterministic: the same script makes the same file. The tail is folded onto the start, so a
looping Short or Reel has no seam. Level: -19 LUFS integrated, true peak <= -9 dBTP; scripts/loudness.sh
lifts the final mix to -14.
"""
import argparse
import json
import os
import sys

import numpy as np
from scipy.signal import butter, sosfilt, sosfilt_zi

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from make_sfx import (SR, _allpass, _comb, bandpass, calibrate, highpass, integrated_loudness,  # noqa: E402
                      lowpass, soft_clip, true_peak_db, wav_bytes)

BPM = 120
BEAT = 60.0 / BPM          # 0.5 s = 15 frames at 30 fps
S16 = BEAT / 4
BAR = 4 * BEAT
MUSIC_LUFS = -19.0
MUSIC_PEAK = -9.0
SCORE_LOCK = 1.5           # seconds into the score beat when the number lands (ScoreCard.tsx: 45 frames)
TAIL = 3.0                 # rendered past the end and folded onto the start (loop)

STYLES = {
    1: dict(name="future house", kick=[0, 4, 8, 12], clap=[4, 12], hat="offbeat", swing=0.0, sc=0.62,
            bass="bounce", chords="stab", lead="supersaw", arp=None, kick_hz=52),
    2: dict(name="melodic house", kick=[0, 4, 8, 12], clap=[4, 12], hat="sixteenths", swing=0.04, sc=0.5,
            bass="rolling", chords="pad", lead="bell", arp="up", kick_hz=50),
    3: dict(name="synthwave pop", kick=[0, 8], clap=[4, 12], hat="eighths", swing=0.0, sc=0.35,
            bass="octaves", chords="pad", lead="saw", arp="updown", kick_hz=56, gated=True),
    4: dict(name="future garage", kick=[0, 7, 10], clap=[4, 12], hat="shuffle", swing=0.2, sc=0.45,
            bass="sub", chords="keys", lead="bell", arp=None, kick_hz=54),
    5: dict(name="electro pop", kick=[0, 4, 8, 12], clap=[4, 12], hat="eighths", swing=0.0, sc=0.55,
            bass="pluck", chords="stab", lead="saw", arp="broken", kick_hz=53),
    6: dict(name="chill house", kick=[0, 4, 8, 12], clap=[4, 12], hat="shaker", swing=0.08, sc=0.4,
            bass="sub", chords="keys", lead="bell", arp="up", kick_hz=49),
}

# Keys: semitones above A (the tag's home). Lead lines stay in a bright, phone-friendly register.
KEYS = [0, 1, 3, 5, -2, -4, 2, -5]          # A, Bb, C, D, G, F, B, E
# Diatonic progressions (scale degrees of a major key; 6 = the relative minor): catchy pop shapes.
PROGRESSIONS = [
    [6, 4, 1, 5],      # vi IV I V
    [1, 5, 6, 4],      # I V vi IV
    [4, 1, 5, 6],      # IV I V vi
    [6, 5, 4, 5],      # vi V IV V
    [1, 3, 6, 4],      # I iii vi IV
    [2, 5, 1, 6],      # ii V I vi
]
MAJOR = [0, 2, 4, 5, 7, 9, 11]
TAG = [(0, 1, 3), (3, 5, 3), (6, 3, 2), (8, 6, 8)]   # (16th step, scale degree, length in 16ths)

ROLE = {
    "intro": "explain", "conditions": "explain", "notes": "explain", "price-math": "explain",
    "timeline": "explain", "tally": "explain", "details": "explain", "triptych": "explain",
    "counter": "explain", "sketch": "explain", "stamp-open": "explain", "split": "explain",
    "drawer-open": "explain",
    "observation": "result", "output": "result", "triptych-fill": "result", "tray": "result",
    "roll-call": "result", "successors": "result",
    "flaw": "catch", "extinct": "catch",
    "score": "build", "countdown": "build",
    "verdict": "chorus", "reveal": "chorus", "cta": "chorus",
}


def rng(name):
    return np.random.default_rng(sum((i + 1) * ord(c) for i, c in enumerate(name)) % (2 ** 32))


def taxis(sec):
    return np.arange(max(1, int(round(sec * SR)))) / SR


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


# ---- oscillators ------------------------------------------------------------------------------

def _blep(ph, dt):
    out = np.zeros_like(ph)
    a = ph < dt
    x = ph[a] / dt[a]
    out[a] = x + x - x * x - 1
    b = ph > 1 - dt
    x = (ph[b] - 1) / dt[b]
    out[b] = x * x + x + x + 1
    return out


def saw(freq, n, phase0=0.0):
    """Band-limited (polyBLEP) sawtooth; freq is a scalar or a per-sample array."""
    f = np.broadcast_to(np.asarray(freq, float), (n,))
    dt = np.clip(f / SR, 1e-6, 0.45)
    ph = (phase0 + np.cumsum(dt)) % 1.0
    return 2 * ph - 1 - _blep(ph, dt)


def square(freq, n, phase0=0.0, duty=0.5):
    return 0.5 * (saw(freq, n, phase0) - saw(freq, n, (phase0 + duty) % 1.0))


def sine(freq, n, phase0=0.0):
    f = np.broadcast_to(np.asarray(freq, float), (n,))
    return np.sin(2 * np.pi * (phase0 + np.cumsum(f) / SR))


def env_adsr(n, a, d, s, r, gate):
    """Attack, decay, sustain level, release (seconds); gate = held length in seconds."""
    t = np.arange(n) / SR
    e = np.where(t < a, t / max(a, 1e-4), s + (1 - s) * np.exp(-(t - a) / max(d, 1e-4)))
    rel = t > gate
    e[rel] = e[rel] * np.exp(-(t[rel] - gate) / max(r, 1e-4))
    return e


def supersaw(f, n, g, voices=7, detune=0.16, width=1.0):
    """Stereo supersaw: detuned band-limited saws spread across the field."""
    out = np.zeros((n, 2))
    spread = np.linspace(-1, 1, voices)
    for k, sp in enumerate(spread):
        cents = sp * detune * 100 * (0.6 + 0.4 * abs(sp))
        v = saw(f * 2 ** (cents / 1200), n, g.random())
        pan = 0.5 + 0.5 * sp * width
        amp = 1.0 if k == voices // 2 else 0.75
        out[:, 0] += v * amp * np.sqrt(1 - pan)
        out[:, 1] += v * amp * np.sqrt(pan)
    return out / voices * 1.6


def fm_bell(f, n, ratio=3.5, index=2.4, decay=0.6):
    t = np.arange(n) / SR
    idx = index * np.exp(-t / (decay * 0.35))
    return np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * ratio * t))


def epiano(f, n):
    """FM electric piano: soft tine + bell overtone."""
    t = np.arange(n) / SR
    tine = np.sin(2 * np.pi * f * t + 1.2 * np.exp(-t * 6) * np.sin(2 * np.pi * f * t))
    bell = 0.25 * np.sin(2 * np.pi * f * 14 * t) * np.exp(-t * 18)
    return tine + bell


def lp_env(x, bright_hz, dark_hz, tau, n=None):
    """Filter envelope by crossfade: bright at the attack, closing to dark with time constant tau."""
    t = np.arange(x.shape[0]) / SR
    e = np.exp(-t / tau)
    if x.ndim == 2:
        e = e[:, None]
    return lowpass(x, bright_hz) * e + lowpass(x, dark_hz) * (1 - e)


def mono_to_st(x, pan=0.0):
    return np.stack([x * np.sqrt(0.5 * (1 - pan)), x * np.sqrt(0.5 * (1 + pan))], axis=1)


# ---- drums ------------------------------------------------------------------------------------

def kick(f0=52):
    t = taxis(0.42)
    f = f0 + 110 * np.exp(-t * 38) + 30 * np.exp(-t * 9)
    body = sine(f, t.size) * np.exp(-t * 7.5)
    click = highpass(np.random.default_rng(1).standard_normal(t.size), 3000) * np.exp(-t * 600) * 0.25
    return soft_clip(1.1 * body + click, 1.8)


def clap(g):
    t = taxis(0.32)
    n = g.standard_normal(t.size)
    e = np.zeros(t.size)
    for k, at in enumerate((0.0, 0.009, 0.018, 0.027)):
        s = int(at * SR)
        e[s:] += np.exp(-(t[: t.size - s]) * (300 if k < 3 else 22)) * (0.7 if k < 3 else 1.0)
    return bandpass(n * e, 900, 5200) * 1.3


def snare(g, gated=False):
    t = taxis(0.4 if gated else 0.22)
    tone = sine(190 * (1 + 0.3 * np.exp(-t * 40)), t.size) * np.exp(-t * 28)
    nz = bandpass(g.standard_normal(t.size), 1500, 9000) * (np.exp(-t * 18) if not gated else (t < 0.28) * np.exp(-t * 3))
    return 0.55 * tone + nz * 0.9


def hat(g, open_=False):
    t = taxis(0.28 if open_ else 0.05)
    metal = sum(np.sign(np.sin(2 * np.pi * fr * t)) for fr in (317, 465, 567, 813, 1069, 1445))
    x = highpass(0.35 * metal + g.standard_normal(t.size), 7500, order=4)
    return x * np.exp(-t * (13 if open_ else 85)) * 0.5


def shaker(g):
    t = taxis(0.06)
    return bandpass(g.standard_normal(t.size), 5000, 12000) * np.sin(np.pi * t / 0.06) ** 2 * 0.45


def crash(g):
    t = taxis(2.2)
    x = highpass(g.standard_normal(t.size), 4000) + 0.4 * bandpass(g.standard_normal(t.size), 3000, 7000)
    return x * np.exp(-t * 2.0) * 0.4


def riser(dur, g):
    t = taxis(dur)
    p = t / dur
    nz = g.standard_normal(t.size)
    out = np.zeros(t.size)
    seg = int(0.05 * SR)
    for s in range(0, t.size, seg):
        fc = 600 + 9000 * (s / t.size) ** 2
        out[s:s + seg] = bandpass(nz[s:s + seg], fc * 0.7, min(fc * 1.4, 20000))
    tone = saw(200 + 1200 * p ** 2, t.size) * 0.08
    return (out + lowpass(tone, 3000)) * p ** 1.8


def downlifter(g, dur=1.2):
    t = taxis(dur)
    p = t / dur
    nz = highpass(g.standard_normal(t.size), 800)
    return nz * (1 - p) ** 2 * 0.5 + sine(900 * (1 - 0.8 * p), t.size) * (1 - p) ** 3 * 0.15


def impact(g):
    t = taxis(1.4)
    boom = sine(32 + 60 * np.exp(-t * 14), t.size) * np.exp(-t * 3.2)
    burst = lowpass(g.standard_normal(t.size), 3000) * np.exp(-t * 20) * 0.4
    return soft_clip(boom + burst, 1.6)


# ---- tonal instruments -----------------------------------------------------------------------

def bass_note(m, dur, kind):
    n = int((dur + 0.06) * SR)
    f = hz(m)
    t = np.arange(n) / SR
    sub = sine(f, n)
    if kind == "sub":
        x = sub + 0.35 * np.tanh(4 * sub) + 0.18 * sine(2 * f, n)     # 2nd harmonic: audible on phones
        e = env_adsr(n, 0.004, 0.25, 0.85, 0.05, dur)
        return x * e
    s = saw(f, n) * 0.6 + square(f * 0.5, n) * 0.0
    if kind in ("bounce", "pluck"):
        x = lp_env(s, 3200, 380, 0.06) + 0.9 * sub
        e = env_adsr(n, 0.003, 0.12, 0.55, 0.04, dur)
    elif kind == "octaves":
        x = lp_env(s, 1800, 500, 0.12) + 0.7 * sub
        e = env_adsr(n, 0.003, 0.2, 0.7, 0.04, dur)
    else:  # rolling
        x = lp_env(s, 1400, 420, 0.08) + 0.8 * sub
        e = env_adsr(n, 0.004, 0.15, 0.6, 0.04, dur)
    del t
    return soft_clip(x * e, 1.4)


def chord_stab(notes, dur, g, bright=1.0):
    n = int((dur + 0.25) * SR)
    out = np.zeros((n, 2))
    for m in notes:
        out += supersaw(hz(m), n, g, voices=5, detune=0.14)
    out = lp_env(out, 2500 + 4500 * bright, 900, 0.09)
    e = env_adsr(n, 0.003, 0.18, 0.25, 0.12, dur)
    return out * e[:, None] / max(1, len(notes)) * 1.4


def chord_pad(notes, dur, g, cutoff=3500):
    n = int((dur + 0.6) * SR)
    out = np.zeros((n, 2))
    for m in notes:
        out += supersaw(hz(m), n, g, voices=7, detune=0.2)
    out = lowpass(out, cutoff)
    e = env_adsr(n, 0.08, 0.6, 0.8, 0.45, dur)
    return out * e[:, None] / max(1, len(notes)) * 1.1


def keys_chord(notes, dur):
    n = int((dur + 0.4) * SR)
    x = sum(epiano(hz(m), n) for m in notes) / max(1, len(notes))
    e = env_adsr(n, 0.004, 0.5, 0.35, 0.25, dur)
    return mono_to_st(x * e * 1.3)


def glass(m, dur):
    """THE SPECIMIND tag voice: an FM bell an octave over a soft saw pluck. Same patch every video."""
    n = int((dur + 0.9) * SR)
    f = hz(m)
    b = fm_bell(f, n, ratio=3.0, index=2.0, decay=0.7) * env_adsr(n, 0.002, 0.45, 0.0, 0.3, dur)
    p = lp_env(saw(f, n) + 0.5 * saw(f * 2.003, n), 6000, 1200, 0.07) * env_adsr(n, 0.002, 0.25, 0.2, 0.2, dur)
    sub8 = sine(f / 2, n) * env_adsr(n, 0.004, 0.3, 0.0, 0.2, dur) * 0.25
    return 0.55 * b + 0.45 * p + sub8


def lead_note(m, dur, kind, g):
    n = int((dur + 0.3) * SR)
    f = hz(m)
    t = np.arange(n) / SR
    vib = 1 + 0.004 * np.sin(2 * np.pi * 5.2 * t) * np.clip((t - 0.15) / 0.2, 0, 1)
    if kind == "supersaw":
        x = supersaw(f * vib, n, g, voices=7, detune=0.12, width=0.6)
        x = lowpass(x, 7000)
        e = env_adsr(n, 0.004, 0.2, 0.7, 0.1, dur)
        return x * e[:, None] * 0.9
    if kind == "bell":
        x = glass(m, dur)[:n] * 0.9
        return mono_to_st(x)
    x = lp_env(saw(f * vib, n) + 0.6 * saw(f * vib * 1.004, n), 5500, 2400, 0.15)
    e = env_adsr(n, 0.005, 0.2, 0.75, 0.1, dur)
    return mono_to_st(x * e * 0.8)


def arp_note(m, dur):
    n = int((dur + 0.2) * SR)
    x = lp_env(square(hz(m), n, duty=0.3), 5200, 900, 0.045)
    return x * env_adsr(n, 0.002, 0.09, 0.0, 0.08, dur)


# ---- harmony + melody -------------------------------------------------------------------------

def degree_note(key, deg, octave=4):
    """MIDI note of a major-scale degree (1-7, may exceed 7) in the key (semitones above A)."""
    d = deg - 1
    return 57 + key + 12 * (octave - 3) + MAJOR[d % 7] + 12 * (d // 7)


def chord_tones(key, deg):
    """Triad + 7th of a diatonic chord, as MIDI around the 4th octave."""
    root = degree_note(key, deg, 3)
    tones = [degree_note(key, deg + k, 3) for k in (0, 2, 4, 6)]
    return root, tones


def voicing(key, deg, top=72):
    """Close voicing (3rd, 5th, 7th/9th, root) sitting under `top`, for chords that sit well together."""
    _, tones = chord_tones(key, deg)
    pcs = [tones[1], tones[2], tones[3], tones[0] + 12]
    out = []
    for p in pcs:
        while p > top:
            p -= 12
        while p < top - 14:
            p += 12
        out.append(p)
    return sorted(out)


RHYTHMS = [   # catchy 2-bar topline rhythms: (16th step, length in 16ths)
    [(0, 3), (3, 3), (6, 2), (8, 4), (14, 2), (16, 3), (19, 3), (22, 2), (24, 6)],
    [(0, 2), (2, 2), (4, 3), (7, 3), (10, 6), (16, 2), (18, 2), (20, 3), (23, 3), (26, 6)],
    [(2, 2), (4, 2), (6, 4), (10, 2), (12, 4), (18, 2), (20, 2), (22, 4), (26, 6)],
    [(0, 4), (4, 2), (6, 2), (8, 6), (16, 4), (20, 2), (22, 2), (24, 2), (26, 6)],
    [(0, 3), (3, 1), (4, 4), (10, 2), (12, 4), (16, 3), (19, 1), (20, 4), (26, 6)],
    [(1, 2), (3, 3), (6, 3), (9, 7), (17, 2), (19, 3), (22, 3), (25, 7)],
]


def tonic_of(key):
    """The tonic in the lead register (MIDI 64-75): the tag and toplines live around it."""
    t = 69 + key
    while t < 64:
        t += 12
    while t > 75:
        t -= 12
    return t


def triad_pcs(key, deg):
    t = tonic_of(key)
    return [(t + MAJOR[(deg - 1 + j) % 7]) % 12 for j in (0, 2, 4)]


def topline(key, prog, rhythm_id, g):
    """A 4-bar hook (2-bar call + 2-bar answer): the tag's shape (1-5-3-6) over this episode's chords.
    Strong beats and long notes land on chord tones; leaps stay under a sixth; the answer ends home."""
    rhythm = RHYTHMS[rhythm_id % len(RHYTHMS)]
    tonic = tonic_of(key)
    lo, hi = tonic - 3, tonic + 14
    contour = [1, 5, 3, 6, 5, 3, 2, 1, 3, 5, 6, 8, 6, 5, 3, 2]

    def pc_of(d):
        return (tonic + MAJOR[(d - 1) % 7]) % 12

    def place(pc, near):
        c = [m for m in range(lo, hi + 1) if m % 12 == pc]
        return min(c, key=lambda m: abs(m - near))

    notes, prev = [], tonic
    for half in (0, 1):
        for i, (st, ln) in enumerate(rhythm):
            k = half * 32 + st
            deg = prog[(k // 16) % 4]
            triad = triad_pcs(key, deg)
            want = place(pc_of(contour[(i + 5 * half) % len(contour)]), prev)
            strong = st % 4 == 0 or ln >= 4
            last = half == 1 and i == len(rhythm) - 1
            if last:
                pcs = [p for p in triad if p == tonic % 12] or triad
                m = min((place(p, prev) for p in pcs), key=lambda o: abs(o - prev))
            elif strong and want % 12 not in triad:
                m = min((place(p, prev) for p in triad), key=lambda o: abs(o - want) + 0.4 * abs(o - prev))
            else:
                m = want
                if ln >= 3 and any((m - p) % 12 == 1 for p in triad):     # no long minor-ninth rubs
                    m = min((place(p, prev) for p in triad), key=lambda o: abs(o - m))
            if abs(m - prev) > 9:
                alt = m - 12 if m > prev else m + 12
                if lo <= alt <= hi:
                    m = alt
            notes.append((k, m, ln))
            prev = m
    return notes


# ---- arrangement ------------------------------------------------------------------------------

class Bus:
    def __init__(self, n):
        self.x = np.zeros((n, 2))

    def add(self, at, sig, gain=1.0, pan=0.0):
        s = int(round(at * SR))
        if s >= self.x.shape[0] or s < 0:
            return
        sig = sig if sig.ndim == 2 else mono_to_st(sig, pan)
        e = min(self.x.shape[0], s + sig.shape[0])
        self.x[s:e] += gain * sig[: e - s]


def sections(script):
    """[(start_s, dur_s, role, nth_of_role)] from the beats; enforces the 0.5 s grid."""
    out, t, seen = [], 0.0, {}
    beats = script["beats"]
    for i, b in enumerate(beats):
        d = float(b["seconds"])
        if abs(d / BEAT - round(d / BEAT)) > 1e-6:
            raise SystemExit(f"beat {i + 1} ({b['type']}) is {d} s; beats must be multiples of {BEAT} s (cuts on the 120 bpm grid)")
        role = ROLE.get(b["type"], "explain")
        if b["type"] == "notes" and ("flaw" in b or "flaw_row" in b):
            role = "catch"
        if i == 0:
            role = "hook"
        elif i == len(beats) - 1:
            role = "chorus"
        n = seen.get(role, 0)
        seen[role] = n + 1
        out.append((t, d, role, n))
        t += d
    return out, t


def sweep_lowpass(x, cut_at):
    """Time-varying lowpass in 20 ms blocks; cut_at(t) gives the cutoff in Hz (>= 18 kHz: bypass)."""
    out = x.copy()
    blk = int(0.02 * SR)
    zi = None
    for s in range(0, x.shape[0], blk):
        fc = cut_at(s / SR)
        if fc >= 18000:
            zi = None
            continue
        sos = butter(2, fc / (SR / 2), btype="low", output="sos")
        seg = x[s:s + blk]
        if zi is None:
            zi = np.stack([sosfilt_zi(sos)[:, :, None] * seg[0][None, None, :]] * 1)[0]
        y, zi = sosfilt(sos, seg, axis=0, zi=zi)
        out[s:s + blk] = y
    return out


def reverb(x, rt60=1.6, pre=0.02, damp=0.3):
    """Stereo reverb: 8 damped feedback combs into 2 allpasses per side (block-wise, fast),
    left and right decorrelated by offsetting the delays."""
    out = np.zeros_like(x)
    pd = int(pre * SR)
    for ch, off in ((0, 0), (1, 37)):
        src = np.concatenate([np.zeros(pd), x[:, ch]])[: x.shape[0]]
        acc = np.zeros(x.shape[0])
        for ms in (25.3, 26.9, 28.9, 30.7, 32.2, 33.8, 35.3, 36.7):
            d = int(ms * SR / 1000) + off
            acc += _comb(src, d, 10 ** (-3 * d / (rt60 * SR)), damp)
        acc /= 8
        for ms, ga in ((5.0, 0.6), (1.7, 0.6)):
            acc = _allpass(acc, int(ms * SR / 1000) + off // 3, ga)
        out[:, ch] = acc
    return out


def compose(script, style_id, key):
    S = STYLES[style_id]
    secs, total = sections(script)
    n_total = int(round(total * SR))
    n = n_total + int(TAIL * SR)
    g = rng(f"{script.get('id', 'E000')}-{style_id}-{key}")
    prog = PROGRESSIONS[int(g.integers(len(PROGRESSIONS)))]
    if S["chords"] == "keys" and prog == PROGRESSIONS[3]:
        prog = PROGRESSIONS[5]
    hook = topline(key, prog, int(g.integers(len(RHYTHMS))), g)
    drums, bass, chords, lead, arp, fx, tag = (Bus(n) for _ in range(7))
    K = kick(S["kick_hz"])
    CL, SN = clap(g), snare(g, S.get("gated", False))
    HC, HO, SH, CR = hat(g), hat(g, True), shaker(g), crash(g)
    sidechain = np.ones(n)

    def duck(at, depth):
        s = max(0, int(round(at * SR)))
        env = 1 - depth * np.exp(-np.arange(int(0.3 * SR)) / (0.075 * SR))
        e = min(n, s + env.size)
        sidechain[s:e] = np.minimum(sidechain[s:e], env[: e - s])

    def at_step(k):
        step = k % 16
        jitter = g.normal(0, 0.0025) if step % 4 else 0.0     # downbeats stay tight; the rest breathes
        return max(0.0, k * S16 + (S["swing"] * S16 if step % 2 else 0.0) + jitter)

    def section_of(t):
        for idx, (s, d, role, nth) in enumerate(secs):
            if s - 1e-9 <= t < s + d - 1e-9:
                return idx, s, d, role, nth
        s, d, role, nth = secs[-1]
        return len(secs) - 1, s, d, role, nth

    steps = int(round(total / S16))
    for k in range(steps):
        t16 = k * S16
        bar, step = divmod(k, 16)
        at = at_step(k)
        idx, s0, d0, role, nth = section_of(t16 + 1e-6)
        local = int(round((t16 - s0) / S16))
        steps_to_next = int(round((s0 + d0 - t16) / S16))
        deg = prog[bar % 4]
        root, tones = chord_tones(key, deg)
        root -= 24
        while root < 33:          # bass fundamentals between A1 (55 Hz) and G#2 (104 Hz)
            root += 12
        while root > 44:
            root -= 12
        vel = 0.9 + 0.1 * g.random()
        energy = {"hook": 3, "explain": 2, "result": 3, "catch": 0, "build": 1, "chorus": 4}[role]

        # ---- drums ----
        if role == "build":
            lock = s0 + min(SCORE_LOCK, d0 - BEAT)
            if t16 >= lock - 1e-6:
                energy = 4
        if energy >= 2 or (role == "build" and energy == 4):
            if step in S["kick"]:
                drums.add(at, K, (0.78 if energy >= 3 else 0.66) * vel)
                duck(at, S["sc"])
            if step in S["clap"]:
                drums.add(at, SN if S.get("gated") else CL, (0.62 if energy >= 3 else 0.45) * vel)
                if energy >= 4 and not S.get("gated"):
                    drums.add(at + 0.004, SN, 0.18 * vel)
            hp = S["hat"]
            if hp == "offbeat" and step % 4 == 2:
                drums.add(at, HO, 0.3 * vel, pan=0.2)
            if hp in ("sixteenths", "offbeat") and energy >= 3:
                drums.add(at, HC, (0.17 if step % 2 else 0.11) * vel, pan=0.25)
            if hp == "eighths" and step % 2 == 0:
                drums.add(at, HO if (step % 4 == 2 and energy >= 4) else HC, 0.2 * vel, pan=0.2)
            if hp == "shuffle":
                if step % 2 == 0 or (step % 4 == 3 and g.random() < 0.6):
                    drums.add(at, HC, (0.15 if step % 4 == 2 else 0.09) * vel, pan=0.25)
                if step in (6, 14) and energy >= 3:
                    drums.add(at, HO, 0.15, pan=0.2)
            if hp in ("shuffle", "shaker") and step % 2 == 0 and energy >= 3:
                drums.add(at, HC, 0.1 * vel, pan=0.3)                      # air on top of the keys styles
            if hp == "shaker" or energy >= 3:
                drums.add(at, SH, (0.24 if step % 2 else 0.14) * vel, pan=-0.3)
            if steps_to_next <= 2 and idx < len(secs) - 1 and step % 1 == 0 and energy >= 2:
                drums.add(at, SN, 0.12 + 0.08 * (2 - steps_to_next), pan=-0.1)   # light fill into the cut
        elif role == "build":
            lock = s0 + min(SCORE_LOCK, d0 - BEAT)
            if step % 4 == 0:
                drums.add(at, K, 0.55)
            rate = 2 if (lock - t16) > 0.75 else 1                               # roll tightens
            if local % rate == 0:
                drums.add(at, SN, 0.08 + 0.3 * np.clip((t16 - s0) / max(0.1, lock - s0), 0, 1), pan=-0.1)
        elif role == "catch":
            if step % 4 == 2:
                drums.add(at, HC, 0.06, pan=0.3)

        # ---- bass ----
        bk = S["bass"]
        bar_left = min(BAR - step * S16, s0 + d0 - t16)
        if role == "catch":
            if step == 0 or local == 0:
                bass.add(at, bass_note(root, bar_left * 0.95, "sub"), 0.2)
        elif role == "build" and energy < 4:
            if step % 4 == 0:
                bass.add(at, bass_note(root, S16 * 3, "sub"), 0.24)
        else:
            pat = {
                "bounce": [(2, 0, 2), (6, 12, 2), (10, 0, 2), (14, 12, 2)],
                "rolling": [(i, 0 if i % 4 else 12, 1) for i in range(0, 16, 1) if i % 4 != 0],
                "octaves": [(i, 0 if (i // 2) % 2 == 0 else 12, 2) for i in range(0, 16, 2)],
                "sub": [(0, 0, 5), (6, 0, 2), (10, 7, 3), (14, 12, 2)],
                "pluck": [(0, 0, 2), (3, 0, 1), (6, 12, 2), (8, 0, 2), (11, 0, 1), (14, 7, 2)],
            }[bk]
            for st, iv, ln in pat:
                if st == step:
                    bass.add(at, bass_note(root + iv, ln * S16 * 0.9, bk), (0.3 if energy >= 3 else 0.26) * (0.85 if bk in ("bounce", "rolling") else 1.0) * vel)

        # ---- chords ----
        v = voicing(key, deg, 72)
        ck = S["chords"]
        if role == "catch":
            if step == 0 or local == 0:
                chords.add(at, chord_pad(v, bar_left, g, cutoff=2200), 0.5)
        elif ck == "pad":
            if step == 0 or local == 0:
                chords.add(at, chord_pad(v, bar_left, g, cutoff=2600 if energy < 3 else 5200), 0.55 if energy >= 3 else 0.42)
        elif ck == "stab":
            hits = (2, 6, 10, 14) if energy >= 3 else (2, 10)
            if step in hits:
                chords.add(at, chord_stab(v, S16 * 1.5, g, 1.0 if energy >= 4 else 0.55), (0.55 if energy >= 3 else 0.42) * vel)
            if energy >= 4 and (step == 0 or local == 0):
                chords.add(at, chord_pad(v, bar_left, g, cutoff=3200), 0.24)
        else:  # keys
            hits = (0, 3, 6, 10, 12) if energy >= 3 else (0, 6, 10)
            if step in hits:
                chords.add(at, keys_chord(v, S16 * (2 if step != 12 else 3)), (0.62 if energy >= 3 else 0.5) * vel)
            if energy >= 4 and (step == 0 or local == 0):
                chords.add(at, chord_pad(v, bar_left, g, cutoff=2800), 0.22)

        # ---- arp ----
        if S["arp"] and role in ("explain", "result", "chorus", "hook") and step % 2 == 0:
            seq = {"up": [0, 1, 2, 3], "updown": [0, 1, 2, 3, 2, 1], "broken": [0, 2, 1, 3]}[S["arp"]]
            nt = v[seq[(step // 2) % len(seq)] % len(v)] + 12
            arp.add(at, arp_note(nt, S16 * 1.6), (0.2 if energy < 3 else 0.27) * vel, pan=0.35 if (step // 2) % 2 else -0.35)

        # ---- topline: arrives with the result, carries the chorus ----
        if role in ("result", "chorus"):
            ph = (local % 64)
            for st, m, ln in hook:
                if st == ph:
                    kind = S["lead"] if role == "chorus" else ("bell" if S["lead"] != "bell" else "bell")
                    lead.add(at, lead_note(m, ln * S16 * 0.95, kind, g), (0.55 if role == "chorus" else 0.42) * vel)
                    if role == "chorus" and S["lead"] != "bell":
                        lead.add(at, lead_note(m + 12, ln * S16 * 0.9, "bell", g), 0.16)

    # ---- the tag (sound logo), story events ----
    tonic = tonic_of(key)

    def play_tag(at, gain):
        for st, dg, ln in TAG:     # 1-5-3-6 laid out as the original A4 E5 C#5 F#5
            m = tonic + {1: 0, 5: 7, 3: 4, 6: 9}[dg]
            tag.add(at + st * S16, glass(m, ln * S16 * 0.95), gain)

    play_tag(0.0, 0.62)
    fx.add(0.0, impact(g), 0.28)
    for i, (s, d, role, nth) in enumerate(secs):
        if i == 0:
            continue
        if role in ("result", "chorus"):
            fx.add(s, CR, 0.22 if role == "result" else 0.4)
        if role == "catch":
            fx.add(s, downlifter(g, min(1.2, d)), 0.3)
            # a calm two-note phrase on the tag voice: thoughtful, not a joke
            for j, dg in enumerate((6, 5)):
                if s + 0.5 + j * 1.0 < s + d - 0.2:
                    tag.add(s + 0.5 + j * 1.0, glass(tonic + {6: 9, 5: 7}[dg], 0.9), 0.32)
        if role == "build":
            lock = s + min(SCORE_LOCK, d - BEAT)
            fx.add(s, riser(max(0.3, lock - s), g), 0.32)
            fx.add(lock, impact(g), 0.4)
            fx.add(lock, CR, 0.45)
        if role == "chorus" and i == len(secs) - 1:
            fx.add(s, impact(g), 0.3)
            play_tag(s, 0.55)       # the stamp lands: the tag answers

    # ---- mix ----
    sc = sidechain[:, None]
    lead_x = lead.x * (0.7 + 0.3 * sc)
    d375 = int(0.375 * SR)
    echo = np.zeros_like(lead_x)
    echo[d375:, 0] += (lead_x[:-d375, 1] + tag.x[:-d375, 1]) * 0.28
    echo[2 * d375:, 1] += (lead_x[:-2 * d375, 0] + tag.x[:-2 * d375, 0]) * 0.18
    echo = highpass(lowpass(echo, 5000), 400)
    music = bass.x * sc + chords.x * sc + arp.x * sc + lead_x + tag.x + echo * sc
    # the catch: everything melodic goes dark (a filter, not a gag)
    catch_spans = [(s, s + d) for s, d, role, _ in secs if role == "catch"]
    build_spans = [(s, s + min(SCORE_LOCK, d - BEAT)) for s, d, role, _ in secs if role == "build"]

    def cut_at(t):
        for a, b in catch_spans:
            if a <= t < b:
                return 1700.0 + 500 * (t - a)
        for a, b in build_spans:
            if a <= t < b:
                p = (t - a) / max(0.1, b - a)
                return 800 + 17000 * p ** 2
        return 20000.0

    music = sweep_lowpass(music, cut_at)
    send = highpass(chords.x * 0.6 + lead_x * 0.5 + tag.x * 0.8 + arp.x * 0.5 + drums.x * 0.08, 300)
    wet = reverb(send, rt60=1.8 if style_id in (2, 3, 6) else 1.3)
    mix = drums.x + music + 0.32 * wet + fx.x
    mix = highpass(mix, 28)
    mix = mix + 0.22 * bandpass(mix, 1800, 6000)            # presence: phones are a mid-range world
    # energy contour: explaining beats sit back so the text reads; the chorus opens up
    gain = np.ones(mix.shape[0])
    for s0, d0, role, _ in secs:
        a, b = int(s0 * SR), int((s0 + d0) * SR)
        gain[a:b] = {"explain": 0.8, "catch": 0.75, "result": 0.92, "build": 0.95, "hook": 1.0, "chorus": 1.08}[role]
    k = int(0.05 * SR)
    gain = np.convolve(gain, np.ones(k) / k, mode="same")
    mix = mix * gain[:, None]
    # glue: gentle bus saturation
    mix = soft_clip(mix * 0.9, 1.15)
    loop = mix[:n_total].copy()
    tail = mix[n_total:]
    loop[: tail.shape[0]] += tail[: min(tail.shape[0], n_total)]
    return loop, total, secs, prog


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("script")
    ap.add_argument("--out")
    ap.add_argument("--groove", type=int)
    ap.add_argument("--key", type=int, help="index into KEYS (default: from the episode id)")
    a = ap.parse_args()
    script = json.load(open(a.script))
    style = a.groove or int(script.get("groove") or (int(script.get("id", "E1")[1:]) % 6) + 1)
    if style not in STYLES:
        raise SystemExit(f"groove must be 1-6, got {style}")
    eid = script.get("id", "E000")
    kidx = a.key if a.key is not None else (script.get("key") if isinstance(script.get("key"), int) else sum(map(ord, eid)) % len(KEYS))
    key = KEYS[kidx % len(KEYS)]
    mix, total, secs, prog = compose(script, style, key)
    mix = calibrate(mix, MUSIC_LUFS, MUSIC_PEAK, integrated=True, max_drive=2.0)
    out = a.out or os.path.join(os.path.dirname(os.path.abspath(a.script)), "music.wav")
    with open(out, "wb") as f:
        f.write(wav_bytes(mix))
    names = ["A", "Bb", "B", "C", "C#", "D", "Eb", "E", "F", "F#", "G", "G#"]
    print(f"{out}: {STYLES[style]['name']} in {names[key % 12]} major (progression {'-'.join(map(str, prog))}), {total:.1f} s, "
          f"{integrated_loudness(mix):.1f} LUFS, {true_peak_db(mix):.1f} dBTP; sections: "
          + " ".join(f"{role}{nth + 1}@{s:.1f}" for s, d, role, nth in secs))


if __name__ == "__main__":
    main()
