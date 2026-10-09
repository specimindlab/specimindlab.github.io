#!/usr/bin/env python3
"""Compose an episode's music from its script.json: an arranged 120 bpm song, cut to the edit,
that loops seamlessly.

    python3 scripts/make_music.py episodes/E002-hunyuan3d/script.json      # -> <episode>/music.wav
    python3 scripts/make_music.py <script.json> --out x.wav --groove 3

v3 (2026-10-09): v2 repeated one bar under every section. Now the track is ARRANGED like a pop
song around the story, so every few seconds something new arrives and the ear wants the payoff:

    hook (first beat)   CHORUS: full groove + the SPECIMIND hook (call phrase), impact on frame 0
    observation #n      VERSE n: a different counter-melody per verse (arp up / broken / pedal),
                        synth "chops" answering the beat, a STINGER that climbs a step higher with
                        every new result (escalation), bass pattern A/B alternating per bar
    flaw                BREAKDOWN gag: tape stop + scratch, a sad descending "wah" bass, half-time
    price-math, notes   BUILD: chords pulse in 8ths with the filter opening, snare build, riser
    score               ROLL: snare roll into the crash where the number locks + a winner's fanfare
    verdict / cta       FINAL CHORUS: the hook's answer phrase, harmonised in thirds, then a pickup
                        fill that lands back on bar 1, so the loop restarts on the beat

Every boundary gets a fill (snare flam, tom run, clap stutter or reverse crash, rotated), drums vary
per bar (ghost notes, open hats, kick pushes), and the last bar's reverb tail is folded back onto
the first bar: played on loop (Reels and Shorts loop), there is no seam, no fade, no gap.

Six grooves (script.json "groove": 1-6), all 120 bpm in A major / F# minor so the SPECIMIND motif
(A E C# F#) is the melody's DNA:
    1 nu-disco · 2 electro-funk · 3 French-house filter · 4 UK-garage 2-step · 5 synth-pop · 6 boom-bap funk
Consecutive uploads use different grooves (Playbook V).

Everything is synthesised with numpy/scipy (helpers from make_sfx.py): no samples, nothing to
license, nothing for Content ID to match. Deterministic: the same script makes the same file.
Level: -19 LUFS integrated, true peak <= -9 dBTP; scripts/loudness.sh lifts the final mix to -14.
"""
import argparse
import json
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from make_sfx import (SR, bandpass, calibrate, highpass, integrated_loudness, lowpass,  # noqa: E402
                      midi, schroeder, soft_clip, true_peak_db, wav_bytes)

BPM = 120
BEAT = 60.0 / BPM          # 0.5 s = 15 frames at 30 fps
S16 = BEAT / 4             # one 16th
BAR = 4 * BEAT
FPS = 30
MUSIC_LUFS = -19.0
MUSIC_PEAK = -9.0
SCORE_LOCK = 1.5           # seconds into the score beat when the number lands (ScoreCard.tsx: 45 frames)
TAIL = 2.5                 # seconds of tail rendered past the end and folded onto the start (loop)

GROOVES = {
    1: dict(name="nu-disco", kick=[0, 4, 8, 12], clap=[4, 12], stabs=[2, 6, 10, 14], swing=0.0,
            openhat=[2, 6, 10, 14], lead="pulse", chords="disco", bass="octave"),
    2: dict(name="electro-funk", kick=[0, 7, 10], clap=[4, 12], stabs=[0, 3, 6, 11], swing=0.10,
            openhat=[14], lead="square", chords="funk", bass="funk"),
    3: dict(name="French-house filter", kick=[0, 4, 8, 12], clap=[4, 12], stabs=[2, 5, 8, 11, 14], swing=0.05,
            openhat=[2, 6, 10, 14], lead="saw", chords="filter", bass="octave"),
    4: dict(name="UK-garage 2-step", kick=[0, 10], clap=[4, 12], stabs=[3, 6, 11], swing=0.18,
            openhat=[6, 14], lead="bell", chords="garage", bass="sub"),
    5: dict(name="synth-pop", kick=[0, 4, 8, 12], clap=[4, 12], stabs=[0, 4, 8, 12], swing=0.0,
            openhat=[14], lead="pulse", chords="pop", bass="eighths"),
    6: dict(name="boom-bap funk", kick=[0, 6, 10], clap=[4, 12], stabs=[2, 9, 14], swing=0.20,
            openhat=[14], lead="whistle", chords="organ", bass="funk"),
}

# Four-bar progressions in A major / F# minor (bass root MIDI, stab voicing MIDI). Voicings keep the
# motif's pitch classes (A, C#, E, F#) on top, so the hook always sits consonantly.
PROGRESSIONS = {
    "disco":  [(42, [57, 61, 64, 68]), (38, [57, 61, 64, 66]), (45, [56, 61, 64, 69]), (40, [56, 59, 61, 64])],
    "funk":   [(42, [57, 61, 64]), (42, [57, 61, 64]), (38, [57, 62, 66]), (40, [56, 59, 64])],
    "filter": [(45, [61, 64, 68, 73]), (42, [61, 64, 69, 73]), (38, [62, 66, 69, 73]), (40, [59, 64, 68, 71])],
    "garage": [(42, [57, 61, 64, 68]), (47, [57, 62, 64, 66]), (38, [57, 61, 64, 66]), (40, [56, 59, 64, 66])],
    "pop":    [(45, [57, 61, 64]), (40, [56, 59, 64]), (42, [57, 61, 66]), (38, [57, 62, 66])],
    "organ":  [(42, [57, 61, 64]), (47, [59, 62, 66]), (38, [57, 62, 66]), (40, [56, 59, 64])],
}
# The verse uses a different progression from the chorus, so the chorus feels like arriving home.
VERSE_PROG = [(38, [57, 62, 66, 69]), (40, [56, 59, 64, 68]), (42, [57, 61, 64, 69]), (37, [56, 61, 64, 68])]
BUILD_PROG = [(38, [57, 62, 66]), (40, [56, 59, 64]), (42, [57, 61, 66]), (40, [56, 59, 64, 71])]

# The hook: call (bars 1-2) and answer (bars 3-4), built from the SPECIMIND motif (A E C# F#).
# (16th step within the 4-bar phrase, MIDI note, length in 16ths)
HOOK_CALL = [(0, 69, 2), (3, 76, 1), (4, 73, 2), (7, 78, 3), (12, 76, 2), (14, 73, 2),
             (16, 69, 1), (18, 73, 1), (19, 76, 2), (22, 78, 2), (26, 76, 1), (27, 78, 5)]
HOOK_ANSWER = [(32, 81, 2), (35, 78, 1), (36, 76, 2), (39, 73, 3), (44, 76, 2), (46, 78, 2),
               (48, 76, 1), (50, 73, 1), (51, 71, 2), (54, 73, 2), (58, 69, 6)]
# Counter-melodies for the verses: a different shape every verse (arp offsets over the chord).
ARPS = [
    [0, 1, 2, 3, 2, 1, 0, 1],            # up and down
    [0, 2, 1, 3, 0, 3, 1, 2],            # broken
    [3, 3, 2, 3, 1, 3, 0, 3],            # pedal on the top note
    [0, 1, 2, 3, 3, 2, 1, 0],            # rise and fall
]

ROLE = {
    "counter": "hook", "output": "hook", "stamp-open": "hook", "sketch": "hook", "split": "hook",
    "drawer-open": "hook", "extinct": "flaw",
    "observation": "verse", "triptych": "verse", "triptych-fill": "verse", "tray": "verse",
    "details": "verse", "successors": "verse", "roll-call": "verse", "drawer": "verse",
    "conditions": "build", "notes": "build", "price-math": "build", "tally": "build", "timeline": "build",
    "flaw": "flaw", "countdown": "roll", "score": "roll",
    "verdict": "drop", "reveal": "drop", "cta": "drop",
}


def rng(name):
    return np.random.default_rng(sum((i + 1) * ord(c) for i, c in enumerate(name)) % (2 ** 32))


def t_axis(sec):
    return np.arange(max(1, int(round(sec * SR)))) / SR


# ---- instruments (mono unless noted) ----------------------------------------------------------

def kick(g):
    t = t_axis(0.34)
    f = 46 + 120 * np.exp(-t * 30)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 8.5)
    click = highpass(g.standard_normal(t.size), 2500) * np.exp(-t * 400) * 0.35
    return soft_clip(body + click, 2.2)          # harmonics: phone speakers rebuild the thump


def clap(g):
    t = t_axis(0.26)
    n = g.standard_normal(t.size)
    env = np.zeros(t.size)
    for k, at in enumerate((0.0, 0.010, 0.021)):
        s = int(at * SR)
        env[s:] += np.exp(-(t[: t.size - s]) * (380 if k < 2 else 26)) * (0.8 if k < 2 else 1.0)
    return bandpass(n * env, 850, 4200) * 1.4


def snare(g, tone_hz=185):
    t = t_axis(0.18)
    tone = np.sin(2 * np.pi * tone_hz * t) * np.exp(-t * 30)
    noise = bandpass(g.standard_normal(t.size), 1200, 9000) * np.exp(-t * 22)
    return 0.6 * tone + noise


def tom(g, f0):
    t = t_axis(0.3)
    f = f0 * (1 + 0.6 * np.exp(-t * 25))
    return soft_clip(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9) + 0.15 * bandpass(g.standard_normal(t.size), 800, 4000) * np.exp(-t * 40), 1.6)


def hat(g, open_=False):
    t = t_axis(0.3 if open_ else 0.06)
    metal = sum(np.sign(np.sin(2 * np.pi * f * t)) for f in (205.3, 304.4, 369.6, 522.7, 800.0, 540.0))
    x = highpass(0.4 * metal + g.standard_normal(t.size), 7000, order=4)
    return x * np.exp(-t * (11 if open_ else 70)) * 0.6


def shaker(g):
    t = t_axis(0.05)
    return bandpass(g.standard_normal(t.size), 4000, 11000) * np.sin(np.pi * t / 0.05) ** 2 * 0.5


def crash(g):
    t = t_axis(1.8)
    x = highpass(g.standard_normal(t.size), 3500) + 0.5 * bandpass(g.standard_normal(t.size), 2500, 6000)
    return x * np.exp(-t * 2.4) * 0.5


def additive(f, t, kind, duty=0.3, top=11000):
    """Band-limited oscillator by additive synthesis (no aliasing on phone-band leads)."""
    out = np.zeros(t.size)
    for k in range(1, int(top / f) + 1):
        if kind == "saw":
            a = 1.0 / k
        elif kind == "square":
            a = (1.0 / k) if k % 2 else 0.0
        elif kind == "pulse":
            a = np.sin(np.pi * k * duty) / k
        else:
            a = 1.0 if k == 1 else 0.0
        if a:
            out += a * np.sin(2 * np.pi * f * k * t)
    return out


def bass_note(note, dur, style, slide=0.0):
    f = midi(note)
    t = t_axis(dur + 0.03)
    if slide:
        ft = f * 2 ** (slide * np.clip(t / max(dur, 1e-3), 0, 1) / 12)
        ph = np.cumsum(ft) / SR
        saw = sum(np.sin(2 * np.pi * k * ph) / k for k in range(1, 14))
        sub = np.sin(2 * np.pi * ph)
    else:
        saw = additive(f, t, "saw", top=6000)
        sub = np.sin(2 * np.pi * f * t)
    raw = 0.55 * saw + (0.9 if style == "sub" else 0.6) * sub
    e = np.exp(-t / (0.2 if slide else 0.07))
    x = lowpass(raw, 2600) * e + lowpass(raw, 420) * (1 - e)   # filter envelope (the "pluck"/"wah")
    amp = np.minimum(1, t / 0.003) * (0.65 + 0.35 * np.exp(-t / 0.12))
    amp *= np.clip((dur + 0.03 - t) / 0.02, 0, 1)
    return soft_clip(x * amp, 1.8)


def stab(notes, dur, kind, g, bright=1.0):
    t = t_axis(dur + 0.05)
    out = np.zeros((t.size, 2))
    for n in notes:
        f = midi(n)
        for ch, cents in ((0, -9), (1, 9)):
            for det in (cents, -cents / 2):
                if kind == "organ":
                    w = additive(f * 2 ** (det / 1200), t, "square", top=4000) * 0.7
                else:
                    w = additive(f * 2 ** (det / 1200), t, "saw", top=7000)
                out[:, ch] += w
    hi = 1200 + 3000 * bright
    out = bandpass(out, 260, hi)
    decay = 0.5 if kind == "organ" else 0.16
    env = np.minimum(1, t / 0.003) * np.exp(-t / decay) * np.clip((dur + 0.05 - t) / 0.03, 0, 1)
    return out * env[:, None] / max(1, len(notes))


def pluck(note, dur):
    """A bright, short plucked synth for the verse counter-melodies."""
    f = midi(note)
    t = t_axis(dur + 0.15)
    x = additive(f, t, "pulse", duty=0.22, top=9000)
    e = np.exp(-t / 0.05)
    x = lowpass(x, 5000) * e + lowpass(x, 1200) * (1 - e)
    return x * np.minimum(1, t / 0.002) * np.exp(-t / 0.14)


def chop(note, dur, vowel=0):
    """A formant 'vocal chop' (ooh / aah / eh): the answer in the call-and-response."""
    f = midi(note)
    t = t_axis(dur + 0.05)
    src = additive(f, t, "saw", top=6000)
    formants = [((350, 800), (2300, 2800)), ((700, 1200), (1100, 1600)), ((450, 650), (1800, 2400))][vowel % 3]
    x = sum(bandpass(src, lo, hi) for lo, hi in formants)
    return x * np.minimum(1, t / 0.008) * np.exp(-t / 0.12) * 1.5


def lead_note(note, dur, kind):
    f = midi(note)
    t = t_axis(dur + 0.08)
    vib = 1 + (2 ** (14 / 1200) - 1) * np.sin(2 * np.pi * 5.5 * t) * np.clip((t - 0.12) / 0.1, 0, 1)
    ph = np.cumsum(f * vib) / SR
    if kind == "bell":
        x = np.sin(2 * np.pi * ph) + 0.4 * np.sin(2 * np.pi * 2.76 * ph) * np.exp(-t * 9)
    elif kind == "whistle":
        x = np.sin(2 * np.pi * ph) + 0.08 * np.sin(4 * np.pi * ph)
    else:
        x = np.zeros(t.size)
        duty = 0.3 if kind == "pulse" else 0.5
        for k in range(1, int(9000 / f) + 1):
            a = (np.sin(np.pi * k * duty) / k) if kind in ("pulse", "square") else 1.0 / k
            if kind == "square" and k % 2 == 0:
                a = 0
            x += a * np.sin(2 * np.pi * k * ph)
    amp = np.minimum(1, t / 0.004) * (0.55 + 0.45 * np.exp(-t / 0.18)) * np.clip((dur + 0.08 - t) / 0.06, 0, 1)
    return x * amp


def riser(dur, g):
    t = t_axis(dur)
    n = g.standard_normal(t.size)
    p = t / dur
    x = sum(bandpass(n, lo, lo * 1.8) * np.clip(1 - np.abs(p - c) * 3, 0, 1)
            for lo, c in ((800, 0.15), (1600, 0.45), (3200, 0.75), (6000, 1.0)))
    sweep = np.sin(2 * np.pi * np.cumsum(300 + 900 * p ** 2) / SR) * 0.25
    return (x + sweep) * p ** 2


def reverse_cymbal(g, dur=BEAT):
    c = crash(g)[: int(dur * SR)]
    return c[::-1] * np.linspace(0, 1, c.size) ** 1.5


def impact(g):
    t = t_axis(1.0)
    boom = np.sin(2 * np.pi * np.cumsum(38 + 70 * np.exp(-t * 12)) / SR) * np.exp(-t * 4)
    burst = lowpass(g.standard_normal(t.size), 2500) * np.exp(-t * 18) * 0.5
    return soft_clip(boom + burst, 2.0)


def scratch(g):
    out = []
    for up, dur in ((True, 0.09), (False, 0.13)):
        t = t_axis(dur)
        f = (300 + 1400 * (t / dur)) if up else (1700 - 1500 * (t / dur))
        buzz = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.6 + g.standard_normal(t.size) * 0.5
        out.append(bandpass(buzz, 500, 3500) * np.sin(np.pi * t / dur))
    return np.concatenate(out)


def tape_stop(x, seconds):
    n = int(seconds * SR)
    if n <= 0 or n >= x.shape[0]:
        return x
    seg = x[-n:].copy()
    speed = np.linspace(1, 0, n) ** 1.3
    pos = np.cumsum(speed)
    pos = pos / pos[-1] * (n * 0.55)
    out = np.stack([np.interp(np.clip(pos, 0, n - 1), np.arange(n), seg[:, c]) for c in range(2)], axis=1)
    x = x.copy()
    x[-n:] = out * np.linspace(1, 0.2, n)[:, None]
    return x


# ---- arrangement --------------------------------------------------------------------------------

class Bus:
    def __init__(self, n):
        self.x = np.zeros((n, 2))

    def add(self, at, sig, gain=1.0, pan=0.0):
        s = int(round(at * SR))
        if s >= self.x.shape[0] or s < 0:
            return
        sig = sig if sig.ndim == 2 else np.stack([sig * np.sqrt(0.5 * (1 - pan)), sig * np.sqrt(0.5 * (1 + pan))], axis=1)
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
        role = ROLE.get(b["type"], "verse")
        if b["type"] == "notes" and ("flaw" in b or "flaw_row" in b):
            role = "flaw"  # the notes card carries the circled flaw: the music dies with it
        if i == 0:
            role = "hook"
        elif i == len(beats) - 1:
            role = "drop"
        n = seen.get(role, 0)
        seen[role] = n + 1
        out.append((t, d, role, n))
        t += d
    return out, t


def compose(script, groove):
    G = GROOVES[groove]
    chorus = PROGRESSIONS[G["chords"]]
    secs, total = sections(script)
    n_total = int(round(total * SR))
    n = n_total + int(TAIL * SR)
    g = rng(f"{script.get('id', 'E000')}-{groove}")
    drums, bass, chords, lead, fx = (Bus(n) for _ in range(5))
    K, C, HC, HO, CR = kick(g), clap(g), hat(g), hat(g, True), crash(g)
    SNs = [snare(g, f) for f in (185, 210, 240)]
    TOMS = [tom(g, f) for f in (180, 140, 105)]
    SHK = shaker(g)
    sidechain = np.ones(n)

    def duck(at, depth=0.55):
        s = int(round(at * SR))
        env = 1 - depth * np.exp(-np.arange(int(0.22 * SR)) / (0.06 * SR))
        e = min(n, s + env.size)
        sidechain[s:e] = np.minimum(sidechain[s:e], env[: e - s])

    def at_step(k):
        bar, step = divmod(k, 16)
        return bar * BAR + step * S16 + (G["swing"] * S16 if step % 2 else 0.0)

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
        local = int(round((t16 - s0) / S16))            # 16ths since the section started
        lbar = local // 16
        next_start = s0 + d0
        steps_to_next = int(round((next_start - t16) / S16))
        prog = chorus if role in ("hook", "drop") else VERSE_PROG if role == "verse" else BUILD_PROG
        root, voicing = prog[bar % 4]
        nxt_root = prog[(bar + 1) % 4][0]
        var = g.random()                                  # per-step variation dice (seeded)
        in_fill = steps_to_next <= 4 and idx < len(secs) - 1 and secs[idx + 1][2] not in ("flaw",)
        last_fill = steps_to_next <= 4 and idx == len(secs) - 1   # pickup back into bar 1 (loop)

        if role == "flaw":
            continue                                       # rendered as an event below

        # ---- drums ----
        if role == "roll":
            if t16 >= s0 + SCORE_LOCK - 1e-6:
                if step in (0, 8):
                    drums.add(at, K, 1.0)
                    duck(at)
                if step in (4, 12):
                    drums.add(at, C, 0.55)
                drums.add(at, HC, 0.14 if step % 2 == 0 else 0.08, pan=0.25)
        elif in_fill or last_fill:
            fill = (idx + (1 if last_fill else 0)) % 4
            j = 4 - steps_to_next                          # 0..3 inside the fill
            if fill == 0:                                  # snare flam run
                drums.add(at, SNs[j % 3], 0.25 + 0.12 * j, pan=-0.1)
                drums.add(at + S16 / 2, SNs[(j + 1) % 3], 0.18 + 0.1 * j, pan=0.1)
            elif fill == 1:                                # tom run, high to low
                drums.add(at, TOMS[min(2, j)], 0.55, pan=-0.3 + 0.3 * min(2, j))
            elif fill == 2:                                # clap stutter
                drums.add(at, C, 0.3 + 0.1 * j)
                drums.add(at + S16 / 2, C, 0.22 + 0.08 * j)
            else:                                          # kick-clap push
                drums.add(at, K if j % 2 == 0 else C, 0.8 if j % 2 == 0 else 0.5)
            if j == 0:
                pass
        else:
            energy = {"hook": 3, "verse": 2, "build": 1, "drop": 3}[role]
            kicks = G["kick"] if energy >= 2 else [0, 8]
            if role == "build":
                kicks = [0, 4, 8, 12] if lbar % 2 else [0, 8]            # the build tightens
            if step in kicks or (energy >= 2 and step == 14 and var < 0.18):   # occasional push
                drums.add(at, K, 1.0)
                duck(at)
            if step in G["clap"]:
                drums.add(at, C, 0.55 if energy >= 2 else 0.4, pan=0.05)
            elif energy >= 2 and step in (7, 15) and var < 0.22:          # ghost claps
                drums.add(at, C, 0.14, pan=-0.1)
            if role == "verse" and step % 2 == 1:
                drums.add(at, SHK, 0.35 if step % 4 == 3 else 0.22, pan=-0.35)
            if energy >= 2 or step % 2 == 0:
                acc = 1.0 if step % 4 == 2 else (0.7 if step % 2 == 0 else 0.45)
                open_ = step in G["openhat"] and energy >= 2 and (role != "verse" or lbar % 2 == 1)
                drums.add(at, HO if open_ else HC, 0.16 * acc, pan=0.25)
            if role == "build":
                rate = 4 if lbar == 0 else 2                               # snare build accelerates
                if step % rate == 0 and t16 > s0 + BEAT:
                    drums.add(at, SNs[0], 0.12 + 0.25 * (t16 - s0) / d0, pan=-0.1)

        # ---- bass ----
        if role == "roll" and t16 < s0 + SCORE_LOCK - 1e-6:
            pass
        elif role == "build":
            if step % 2 == 0:
                bass.add(at, bass_note(root + (12 if step % 4 == 2 else 0), S16 * 1.6, "sub"), 0.4)
        else:
            if role == "verse":
                pattern = ([(0, 0, 2), (3, 12, 1), (6, 7, 1), (8, 0, 1), (10, 12, 1), (11, 10, 1), (14, 7, 1), (15, None, 1)]
                           if lbar % 2 == 0 else
                           [(0, 0, 3), (4, 12, 1), (6, 0, 1), (9, 7, 2), (12, 12, 1), (14, 10, 1), (15, None, 1)])
            else:
                pattern = {
                    "octave": [(0, 0, 2), (2, 12, 1), (4, 0, 1), (6, 12, 1), (8, 0, 2), (10, 12, 1), (12, 0, 1), (14, 12, 1)],
                    "funk": [(0, 0, 2), (3, 12, 1), (6, 0, 1), (8, 0, 1), (10, 7, 1), (11, 12, 1), (14, 10, 1), (15, None, 1)],
                    "sub": [(0, 0, 3), (6, 0, 1), (10, 7, 2), (14, 12, 1)],
                    "eighths": [(i, 0 if i % 4 else 12, 1) for i in range(0, 16, 2)],
                }[G["bass"]]
            for st, iv, ln in pattern:
                if st == step and not (in_fill and st >= 12):
                    note = (nxt_root - 1) if iv is None else root + iv
                    bass.add(at, bass_note(note, ln * S16 * 0.92, G["bass"]), 0.5)

        # ---- chords ----
        if role == "build":
            if step % 2 == 0:                                              # 8th pulses, filter opening
                bright = 0.15 + 0.85 * (t16 - s0) / d0
                chords.add(at, stab(voicing, S16 * 1.4, "filter", g, bright), 0.36)
        elif role == "verse":
            if step in (2, 7, 10) or (lbar % 2 and step == 15):
                chords.add(at, stab(voicing, S16 * 1.4, G["chords"], g, 0.6), 0.3)
        elif role in ("hook", "drop") or (role == "roll" and t16 >= s0 + SCORE_LOCK):
            if step in G["stabs"]:
                kind = G["chords"]
                chords.add(at, stab(voicing, S16 * (3 if kind == "organ" else 1.6), kind, g), 0.42)

        # ---- melody ----
        if role in ("hook", "drop"):
            phrase = HOOK_CALL if role == "hook" else HOOK_ANSWER
            off = 0 if role == "hook" else 32
            ph_step = (local % 32) + off
            for st, note, ln in phrase:
                if st == ph_step:
                    lead.add(at, lead_note(note, ln * S16, G["lead"]), 0.34)
                    if role == "drop":                                     # harmony a third below
                        lead.add(at, lead_note(note - (3 if note in (69, 76, 81) else 4), ln * S16, G["lead"]), 0.18, pan=0.35)
        elif role == "verse":
            arp = ARPS[nth % len(ARPS)]
            if step % 2 == 0:
                tone = voicing[arp[(step // 2) % len(arp)] % len(voicing)] + 12
                lead.add(at, pluck(tone, S16 * 1.5), 0.2, pan=0.3 * (1 if (step // 2) % 2 else -1))
            if step == 14 and lbar % 2 == 0:                               # the chop answers
                chords.add(at, chop(voicing[-1], S16 * 2, nth + lbar), 0.32, pan=-0.2)

    # ---- section events ----
    for i, (s, d, role, nth) in enumerate(secs):
        if i == 0:
            fx.add(0.0, impact(g), 0.4)
            fx.add(0.0, CR, 0.3)
        elif role in ("verse", "drop", "build"):
            fx.add(max(0.0, s - BEAT), reverse_cymbal(g), 0.3)
        if role == "verse":
            # STINGER: three rising notes from the motif, a whole step higher every new result.
            up = 2 * nth
            for j, nn in enumerate((69, 73, 76)):
                lead.add(s + j * S16, lead_note(nn + up, S16 * 1.2, "bell"), 0.28)
            fx.add(s, CR, 0.18)
        if role == "drop":
            fx.add(s, impact(g), 0.4)
            fx.add(s, CR, 0.5)
        if role == "build":
            fx.add(s, riser(d, g), 0.3)
        if role == "roll":
            lock = s + (SCORE_LOCK if d > SCORE_LOCK else d - BEAT)
            rolls = int((lock - s) / (S16 / 2))
            for r in range(rolls):
                tt = s + r * (S16 / 2)
                drums.add(tt, SNs[r % 3], 0.16 + 0.42 * (tt - s) / max(0.1, lock - s), pan=-0.1)
            fx.add(s, riser(lock - s, g), 0.3)
            fx.add(lock, CR, 0.6)
            fx.add(lock, impact(g), 0.4)
            # winner's fanfare: the motif as a quick major arpeggio on the lock
            for j, nn in enumerate((69, 73, 76, 81)):
                lead.add(lock + j * S16 * 0.75, lead_note(nn, S16 * (3 if j == 3 else 1), G["lead"]), 0.3)
        if role == "flaw":
            fx.add(s, scratch(g), 0.55)
            # The joke: a sad, sliding "wah" bass, half-time drums, a deflated chop.
            for j, (semis, slide) in enumerate(((0, -1), (-1, -1), (-2, -1), (-3, -5))):
                at = s + 0.25 + j * BEAT
                if at < s + d - 0.05:
                    bass.add(at, bass_note(42 + semis, BEAT * 0.95, "sub", slide=slide), 0.55)
                    drums.add(at, K if j % 2 == 0 else C, 0.8 if j % 2 == 0 else 0.35)
            if d >= 2.0:
                chords.add(s + d - BEAT * 1.5, chop(64, BEAT, 1), 0.25)

    # ---- mix ----
    duck_ = sidechain[:, None]
    mix = drums.x + bass.x * duck_ + chords.x * duck_ * 0.9 + lead.x * (0.6 + 0.4 * duck_)
    d8 = int(0.375 * SR)
    echo = np.zeros_like(lead.x)
    echo[d8:, 0] += lead.x[:-d8, 1] * 0.3
    echo[2 * d8:, 1] += lead.x[:-2 * d8, 0] * 0.18
    mix += echo * duck_
    room = np.stack([schroeder(chords.x[:, 0] + 0.5 * lead.x[:, 0], rt60=0.9, spread=0),
                     schroeder(chords.x[:, 1] + 0.5 * lead.x[:, 1], rt60=0.9, spread=19)], axis=1)
    mix += 0.18 * room + fx.x
    for s, d, role, nth in secs:
        if role == "flaw" and s > 0.5:
            cut = int(round(s * SR))
            mix[:cut] = tape_stop(mix[:cut], 0.42)
    mix = highpass(mix, 32)
    # Seamless loop: fold everything that rings past the end back onto the start.
    loop = mix[:n_total].copy()
    tail = mix[n_total:]
    loop[: tail.shape[0]] += tail[: min(tail.shape[0], n_total)]
    return loop, total, secs


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("script")
    ap.add_argument("--out")
    ap.add_argument("--groove", type=int)
    a = ap.parse_args()
    script = json.load(open(a.script))
    groove = a.groove or int(script.get("groove") or (int(script.get("id", "E1")[1:]) % 6) + 1)
    if groove not in GROOVES:
        raise SystemExit(f"groove must be 1-6, got {groove}")
    mix, total, secs = compose(script, groove)
    mix = calibrate(mix, MUSIC_LUFS, MUSIC_PEAK, integrated=True, max_drive=2.4)
    out = a.out or os.path.join(os.path.dirname(os.path.abspath(a.script)), "music.wav")
    with open(out, "wb") as f:
        f.write(wav_bytes(mix))
    print(f"{out}: groove {groove} ({GROOVES[groove]['name']}), {total:.1f} s, "
          f"{integrated_loudness(mix):.1f} LUFS, {true_peak_db(mix):.1f} dBTP; sections: "
          + " ".join(f"{role}{nth + 1}@{s:.1f}" for s, d, role, nth in secs))


if __name__ == "__main__":
    main()
