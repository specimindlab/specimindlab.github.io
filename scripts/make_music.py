#!/usr/bin/env python3
"""Compose an episode's music from its script.json: a groovy 120 bpm track cut to the edit.

    python3 scripts/make_music.py episodes/E002-hunyuan3d/script.json      # -> <episode>/music.wav
    python3 scripts/make_music.py <script.json> --out x.wav --groove 3

Why per episode: the music follows the story. Every beat in script.json is a multiple of 0.5 s
(one beat at 120 bpm), so every cut lands on the grid, and the arrangement reads the beat types:

    first beat (hook)     impact on frame 0 and the full groove at once (no intro: ~1 s decides a swipe)
    observation, output   groove; a reverse-cymbal swell into each new result
    flaw                  the music dies (tape stop + scratch) and limps on a sad half-time bass slide
    price-math, notes...  reading breakdown: lighter drums, filtered chords, so captions are easy to read
    score                 snare roll + riser, crash exactly when the score lands (1.5 s in)
    verdict / cta         the drop: full groove and the SPECIMIND hook (A E C# F#) on the lead

Six grooves (script.json "groove": 1-6), all 120 bpm in A major / F# minor so the SPECIMIND motif
(A3 E4 C#4 F#4) is the melody's DNA:
    1 nu-disco · 2 electro-funk · 3 French-house filter · 4 UK-garage 2-step · 5 synth-pop · 6 boom-bap funk
Consecutive uploads use different grooves (Playbook V).

Everything is synthesised with numpy/scipy (helpers from make_sfx.py): no samples, nothing to
license, nothing for Content ID to match. Deterministic: the same script makes the same file.
Level: -20 LUFS integrated, true peak <= -9 dBTP; scripts/loudness.sh lifts the final mix to -14.
"""
import argparse
import json
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from make_sfx import (SR, bandpass, calibrate, db, fade, highpass, integrated_loudness, lowpass,  # noqa: E402
                      midi, schroeder, soft_clip, true_peak_db, wav_bytes)

BPM = 120
BEAT = 60.0 / BPM          # 0.5 s = 15 frames at 30 fps
S16 = BEAT / 4             # one 16th
BAR = 4 * BEAT
FPS = 30
MUSIC_LUFS = -20.0
MUSIC_PEAK = -9.0
SCORE_LOCK = 1.5           # seconds into the score beat when the number lands (ScoreCard.tsx: 45 frames)

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

# The hook: two bars built from the SPECIMIND motif (A E C# F#), ending on F# (the question).
# (16th step within the 2-bar phrase, MIDI note, length in 16ths)
HOOK = [(0, 69, 2), (3, 76, 1), (4, 73, 2), (7, 78, 3), (12, 76, 2), (14, 73, 2),
        (16, 69, 1), (18, 73, 1), (19, 76, 2), (22, 78, 2), (26, 76, 1), (27, 78, 5)]

# Beat type -> section. Unknown types fall back to "groove".
SECTION = {
    "counter": "hook", "output": "hook", "stamp-open": "hook", "sketch": "hook", "split": "hook",
    "extinct": "flaw", "drawer": "groove",
    "observation": "groove", "triptych": "groove", "triptych-fill": "groove", "tray": "groove",
    "details": "groove", "timeline": "read", "successors": "groove", "roll-call": "groove",
    "conditions": "read", "notes": "read", "price-math": "read", "tally": "read",
    "flaw": "flaw", "countdown": "roll", "score": "score",
    "verdict": "drop", "reveal": "drop", "cta": "drop", "drawer-open": "hook",
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


def snare(g):
    t = t_axis(0.18)
    tone = np.sin(2 * np.pi * 185 * t) * np.exp(-t * 30)
    noise = bandpass(g.standard_normal(t.size), 1200, 9000) * np.exp(-t * 22)
    return 0.6 * tone + noise


def hat(g, open_=False):
    t = t_axis(0.3 if open_ else 0.06)
    metal = sum(np.sign(np.sin(2 * np.pi * f * t)) for f in (205.3, 304.4, 369.6, 522.7, 800.0, 540.0))
    x = highpass(0.4 * metal + g.standard_normal(t.size), 7000, order=4)
    return x * np.exp(-t * (11 if open_ else 70)) * 0.6


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
        else:                                     # sine-ish / bell
            a = 1.0 if k == 1 else 0.0
        if a:
            out += a * np.sin(2 * np.pi * f * k * t)
    return out


def bass_note(note, dur, style):
    f = midi(note)
    t = t_axis(dur + 0.03)
    saw = additive(f, t, "saw", top=6000)
    sub = np.sin(2 * np.pi * f * t)
    raw = 0.55 * saw + (0.9 if style == "sub" else 0.6) * sub
    e = np.exp(-t / 0.07)
    x = lowpass(raw, 2600) * e + lowpass(raw, 420) * (1 - e)   # filter envelope (the "pluck")
    amp = np.minimum(1, t / 0.003) * (0.65 + 0.35 * np.exp(-t / 0.12))
    amp *= np.clip((dur + 0.03 - t) / 0.02, 0, 1)
    return soft_clip(x * amp, 1.8)


def stab(notes, dur, kind, g):
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
    lo, hi = (300, 2400) if kind in ("filter", "garage") else (260, 4200)
    out = bandpass(out, lo, hi)
    decay = 0.5 if kind == "organ" else 0.16
    env = np.minimum(1, t / 0.003) * np.exp(-t / decay) * np.clip((dur + 0.05 - t) / 0.03, 0, 1)
    return out * env[:, None] / max(1, len(notes))


def lead_note(note, dur, kind):
    f = midi(note)
    t = t_axis(dur + 0.08)
    vib = 1 + (2 ** (14 / 1200) - 1) * np.sin(2 * np.pi * 5.5 * t) * np.clip((t - 0.12) / 0.1, 0, 1)
    ft = f * vib
    ph = np.cumsum(ft) / SR
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
    """Two quick record-scratch 'wicks': a pitch-swept buzz through a moving band-pass."""
    out = []
    for up, dur in ((True, 0.09), (False, 0.13)):
        t = t_axis(dur)
        f = (300 + 1400 * (t / dur)) if up else (1700 - 1500 * (t / dur))
        buzz = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.6 + g.standard_normal(t.size) * 0.5
        out.append(bandpass(buzz, 500, 3500) * np.sin(np.pi * t / dur))
    return np.concatenate(out)


def tape_stop(x, seconds):
    """Slow the last `seconds` of a stereo buffer to a halt (the music 'dies')."""
    n = int(seconds * SR)
    if n <= 0 or n >= x.shape[0]:
        return x
    seg = x[-n:].copy()
    speed = np.linspace(1, 0, n) ** 1.3
    pos = np.cumsum(speed)
    pos = pos / pos[-1] * (n * 0.55)          # covers ~55 % of the original material while stopping
    idx = np.clip(pos, 0, n - 1)
    out = np.stack([np.interp(idx, np.arange(n), seg[:, c]) for c in range(2)], axis=1)
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
    """[(start_s, dur_s, section, beat)] from the beats; enforces the 0.5 s grid."""
    out, t = [], 0.0
    for i, b in enumerate(script["beats"]):
        d = float(b["seconds"])
        if abs(d / BEAT - round(d / BEAT)) > 1e-6:
            raise SystemExit(f"beat {i + 1} ({b['type']}) is {d} s; beats must be multiples of {BEAT} s (cuts on the 120 bpm grid)")
        sec = SECTION.get(b["type"], "groove")
        if i == 0:
            sec = "hook"
        if i == len(script["beats"]) - 1:
            sec = "drop"
        out.append((t, d, sec, b))
        t += d
    return out, t


def compose(script, groove):
    G = GROOVES[groove]
    prog = PROGRESSIONS[G["chords"]]
    secs, total = sections(script)
    n = int(round(total * SR))
    seed = f"{script.get('id', 'E000')}-{groove}"
    g = rng(seed)
    drums, bass, chords, lead, fx = (Bus(n + SR) for _ in range(5))
    K, C, SN, HC, HO, CR = kick(g), clap(g), snare(g), hat(g), hat(g, True), crash(g)
    sidechain = np.ones(n + SR)

    def swing(step):
        return (step * S16) + (G["swing"] * S16 if step % 2 else 0.0)

    def sec_at(t):
        for s, d, sec, b in secs:
            if s <= t < s + d:
                return s, d, sec
        return secs[-1][0], secs[-1][1], secs[-1][2]

    steps = int(round(total / S16))
    for k in range(steps):
        t16 = k * S16
        bar, step = divmod(k, 16)
        s0, d0, sec = sec_at(t16 + 1e-6)
        at = bar * BAR + swing(step)
        root, voicing = prog[bar % 4]
        nxt_root = prog[(bar + 1) % 4][0]
        if sec == "flaw":
            continue                                    # rendered separately below
        energy = {"hook": 3, "groove": 2, "read": 1, "score": 1, "roll": 1, "drop": 3}[sec]
        # drums
        if sec in ("score", "roll"):
            if step in (0,) and k * S16 >= s0 + SCORE_LOCK - 1e-6:
                drums.add(at, K, 1.0)
        else:
            kicks = G["kick"] if energy >= 2 else [0, 8]
            if step in kicks:
                drums.add(at, K, 1.0)
                s = int(round(at * SR))
                env = 1 - 0.55 * np.exp(-np.arange(int(0.22 * SR)) / (0.06 * SR))
                sidechain[s:s + env.size] = np.minimum(sidechain[s:s + env.size], env[: max(0, min(env.size, sidechain.size - s))])
            if step in G["clap"]:
                drums.add(at, C, 0.55 if energy >= 2 else 0.35, pan=0.05)
            if energy >= 2 or step % 2 == 0:
                acc = 1.0 if step % 4 == 2 else (0.7 if step % 2 == 0 else 0.45)
                drums.add(at, HO if step in G["openhat"] and energy >= 2 else HC, 0.16 * acc, pan=0.25)
        # bass
        if sec not in ("score", "roll") or k * S16 >= s0 + SCORE_LOCK - 1e-6:
            pattern = {
                "octave": [(0, 0, 2), (2, 12, 1), (4, 0, 1), (6, 12, 1), (8, 0, 2), (10, 12, 1), (12, 0, 1), (14, 12, 1)],
                "funk": [(0, 0, 2), (3, 12, 1), (6, 0, 1), (8, 0, 1), (10, 7, 1), (11, 12, 1), (14, 10, 1), (15, None, 1)],
                "sub": [(0, 0, 3), (6, 0, 1), (10, 7, 2), (14, 12, 1)],
                "eighths": [(i, 0 if i % 4 else 12, 1) for i in range(0, 16, 2)],
            }[G["bass"]]
            for st, iv, ln in pattern:
                if st == step and (energy >= 2 or st in (0, 8)):
                    note = (nxt_root - 1) if iv is None else root + iv
                    bass.add(at, bass_note(note, ln * S16 * 0.92, G["bass"]), 0.5 if energy >= 2 else 0.35)
        # chords
        if step in G["stabs"]:
            kind = G["chords"]
            chords.add(at, stab(voicing, S16 * (3 if kind == "organ" else 1.6), kind, g), 0.42 if energy >= 2 else 0.3)
        # hook melody on the lead (hook and drop sections only)
        if sec in ("hook", "drop"):
            phrase_step = int(round((t16 - s0) / S16)) % 32
            for st, note, ln in HOOK:
                if st == phrase_step:
                    lead.add(at, lead_note(note, ln * S16, G["lead"]), 0.34)

    # Section events: swells, rolls, impacts, the flaw gag.
    for i, (s, d, sec, b) in enumerate(secs):
        if i == 0:
            fx.add(0.0, impact(g), 0.45)
            fx.add(0.0, CR, 0.35)
        elif sec in ("groove", "drop", "read"):
            fx.add(max(0.0, s - BEAT), reverse_cymbal(g), 0.35 if sec != "read" else 0.2)
            if sec == "drop":
                fx.add(s, impact(g), 0.4)
                fx.add(s, CR, 0.55)
        if sec in ("score", "roll"):
            lock = s + (SCORE_LOCK if sec == "score" else d - BEAT)
            rolls = int((lock - s) / (S16 / 2))
            for r in range(rolls):
                tt = s + r * (S16 / 2) * (1.0 if r < rolls / 2 else 0.75 + 0.25 * (1 - r / rolls))
                if tt < lock:
                    drums.add(tt, SN, 0.18 + 0.4 * (tt - s) / max(0.1, lock - s), pan=-0.1)
            fx.add(s, riser(lock - s, g), 0.35)
            fx.add(lock, CR, 0.6)
            fx.add(lock, impact(g), 0.4)
        if sec == "flaw":
            # The joke: the groove dies under the reveal, a scratch, then a deflated half-time limp.
            fx.add(s, scratch(g), 0.55)
            for j, semis in enumerate((0, -1, -2, -3)):
                at = s + 0.25 + j * BEAT
                if at < s + d - 0.05:
                    bass.add(at, bass_note(42 + semis, BEAT * 0.9, "sub"), 0.5)
                    if j % 2 == 0:
                        drums.add(at, K, 0.8)
                    else:
                        drums.add(at, C, 0.35)

    mix = (drums.x + 0.0)
    duck = sidechain[:, None]
    mix += bass.x * duck + chords.x * duck * 0.9 + lead.x * (0.6 + 0.4 * duck)
    # lead echo: dotted-eighth ping-pong
    d8 = int(0.375 * SR)
    echo = np.zeros_like(lead.x)
    echo[d8:, 0] += lead.x[:-d8, 1] * 0.32
    echo[2 * d8:, 1] += lead.x[:-2 * d8, 0] * 0.2
    mix += echo * duck
    # a little room on everything but the kick
    room = np.stack([schroeder(chords.x[:, 0] + 0.5 * lead.x[:, 0], rt60=0.9, spread=0),
                     schroeder(chords.x[:, 1] + 0.5 * lead.x[:, 1], rt60=0.9, spread=19)], axis=1)
    mix += 0.18 * room + fx.x
    # tape stop into each flaw
    for s, d, sec, b in secs:
        if sec == "flaw" and s > 0.5:
            cut = int(round(s * SR))
            mix[:cut] = tape_stop(mix[:cut], 0.42)
    mix = highpass(mix[:n], 32)
    mix = fade(mix, 0.0, 6 / FPS)
    return mix, total, secs


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
          + " ".join(f"{sec}@{s:.1f}" for s, d, sec, b in secs))


if __name__ == "__main__":
    main()
