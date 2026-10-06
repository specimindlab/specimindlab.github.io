#!/usr/bin/env python3
"""Synthesise every SPECIMIND sound into video/public/sfx (48 kHz, 16-bit PCM WAV).

    python3 scripts/make_sfx.py            # write all files and print the level table
    python3 scripts/make_sfx.py --check    # rebuild in memory, fail if a committed file differs

Everything here is generated from numpy/scipy maths with fixed seeds: no samples, no recordings,
no third-party audio. We own every file outright, and the output is byte-identical on every run.

Levels are calibrated in the file, so the compositions play every sound at volume 1:
  * beds:     -24 LUFS integrated (BS.1770-4 with gating)
  * effects:  about +8 dB above the bed, measured as "event loudness": ungated BS.1770 K-weighted
              loudness over the sound's own length (minimum 100 ms, roughly the ear's integration
              time for short sounds). pin-tick and ui-click sit lower because the brief calls them
              "very quiet" and "soft"; they fire often and must never poke out.
  * motif:    end card only, a little under the effects so it reads as a signature, not an alarm.
Peaks are capped so the final -14 LUFS normalisation (scripts/loudness.sh) can stay a single
linear gain instead of falling back to loudnorm's dynamic mode.

Phone-first: most viewers hear this through a 15 mm phone speaker that reproduces almost nothing
below ~200 Hz. So the stamp thud carries harmonics above its 60-90 Hz fundamental (the ear
rebuilds the missing fundamental), and the beds keep their weight in the 200 Hz-2 kHz band.

The motif (A3 E4 C#4 F#4: an unresolved A6 arpeggio that ends on a question) is the brand's
pitch DNA. Every bed is in a key/mode that contains all four pitch classes (A, C#, E, F#), so the
logo sits consonantly on top of whichever bed an episode uses, while the beds still differ in
tonal centre, mode, tempo and texture.
"""
import argparse
import io
import os
import re
import subprocess
import sys
import wave

try:
    import numpy as np
    from scipy import signal
except ImportError:  # numpy and scipy are the only dependencies; install the pinned versions
    _req = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "requirements.txt")
    _pins = [line.strip() for line in open(_req) if re.match(r"(numpy|scipy)==", line.strip())]
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", *(_pins or ["numpy", "scipy"])])
    import numpy as np
    from scipy import signal

SR = 48000
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "video", "public", "sfx")

BED_LUFS = -24.0
FX_LUFS = BED_LUFS + 8.0
# Headroom budget. The final pass (scripts/loudness.sh) lifts an episode mix (bed -24 LUFS plus
# effects; the nine series fixtures measure -21.8 to -23.1 LUFS) by +7.5 to +9 dB to -14 LUFS, with
# a 4x-oversampled limiter at -2 dBTP in front of its linear loudnorm. The bed must never touch that limiter (a pumping pad is
# audible), so it peaks below -11.5 dBTP. Short effects may lean on it by up to ~3 dB, which takes
# the very tip off a transient and nothing else, so they peak below -8.5 dBTP.
BED_PEAK = -11.5
FX_PEAK = -8.5
# Event-loudness target (LUFS), true-peak ceiling (dBTP), tanh saturation cap (1 = clean) and an
# optional low-pass after the saturation (Hz). Transients have 11-20 dB peak-to-loudness ratios,
# so a little saturation buys back loudness: the noises do not mind it, and the stamp gains
# 150 Hz-3 kHz harmonics a phone speaker can actually play. The motif and the clicks stay nearly
# clean. A sound that cannot reach its target under its ceiling lands a little under it;
# make_sfx.py prints what each file actually got.
TARGETS = {
    "pin-tick": (FX_LUFS - 6.0, FX_PEAK, 2.0, None),
    "paper": (FX_LUFS, FX_PEAK, 3.0, None),
    "pen": (FX_LUFS - 1.0, FX_PEAK, 3.0, None),
    "stamp": (FX_LUFS + 1.0, FX_PEAK, 5.0, 3000),
    "drawer": (FX_LUFS, FX_PEAK, 3.0, 2500),
    "ui-click": (FX_LUFS - 7.0, FX_PEAK, 2.0, None),
    "motif": (FX_LUFS - 1.0, FX_PEAK, 1.4, None),
}


# ---- helpers -----------------------------------------------------------------------------------

def t_axis(seconds):
    return np.arange(int(round(seconds * SR))) / SR


def rng(name):
    """A fixed generator per sound, so editing one sound never changes another."""
    return np.random.default_rng(sum((i + 1) * ord(c) for i, c in enumerate(name)))


def db(x):
    return 10.0 ** (x / 20.0)


def fade(x, fade_in=0.0, fade_out=0.0):
    """Raised-cosine fades (seconds) on the time axis (works for mono and stereo)."""
    x = x.copy()
    n = x.shape[0]
    for secs, head in ((fade_in, True), (fade_out, False)):
        k = min(n, int(round(secs * SR)))
        if k <= 1:
            continue
        ramp = 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, k))
        if x.ndim == 2:
            ramp = ramp[:, None]
        if head:
            x[:k] *= ramp
        else:
            x[-k:] *= ramp[::-1]
    return x


def bandpass(x, lo, hi, order=2):
    sos = signal.butter(order, [lo, hi], btype="band", fs=SR, output="sos")
    return signal.sosfilt(sos, x, axis=0)


def lowpass(x, fc, order=2):
    return signal.sosfilt(signal.butter(order, fc, btype="low", fs=SR, output="sos"), x, axis=0)


def highpass(x, fc, order=2):
    return signal.sosfilt(signal.butter(order, fc, btype="high", fs=SR, output="sos"), x, axis=0)


def resonator(x, f0, q):
    """Two-pole resonant band-pass (a struck-metal or wooden mode)."""
    b, a = signal.iirpeak(f0, q, fs=SR)
    return signal.lfilter(b, a, x, axis=0)


def pink(n, g):
    """Pink (1/f) noise by spectral shaping, unit RMS."""
    spec = np.fft.rfft(g.standard_normal(n))
    f = np.fft.rfftfreq(n, 1 / SR)
    f[0] = f[1]
    x = np.fft.irfft(spec / np.sqrt(f), n)
    return x / np.sqrt(np.mean(x ** 2))


def brown(n, g):
    x = np.cumsum(g.standard_normal(n))
    x = highpass(x, 20.0)
    return x / np.sqrt(np.mean(x ** 2))


def soft_clip(x, drive):
    """tanh saturation, level-matched at small signals."""
    return np.tanh(drive * x) / drive


def triangle(phase):
    """Band-limited-enough triangle from a phase in cycles (the voices stay below ~2 kHz)."""
    return 2.0 * np.abs(2.0 * (phase - np.floor(phase + 0.5))) - 1.0


# ---- BS.1770-4 loudness ----------------------------------------------------------------------

# K-weighting at 48 kHz (ITU-R BS.1770-4, table 1 and 2).
_K1 = ([1.53512485958697, -2.69169618940638, 1.19839281085285], [1.0, -1.69065929318241, 0.73248077421585])
_K2 = ([1.0, -2.0, 1.0], [1.0, -1.99004745483398, 0.99007225036621])


def _kweight(x):
    x = x if x.ndim == 2 else x[:, None]
    y = signal.lfilter(*_K1, x, axis=0)
    return signal.lfilter(*_K2, y, axis=0)


def event_loudness(x, min_window=0.1):
    """Ungated loudness of the whole clip (padded to at least `min_window` seconds)."""
    y = _kweight(x)
    n = max(y.shape[0], int(min_window * SR))
    power = np.sum(np.sum(y ** 2, axis=0) / n)
    return -0.691 + 10 * np.log10(power + 1e-20)


def integrated_loudness(x):
    """Gated integrated loudness (400 ms blocks, 75 % overlap, -70 LUFS / -10 LU gates)."""
    y = _kweight(x)
    block, hop = int(0.4 * SR), int(0.1 * SR)
    starts = range(0, y.shape[0] - block + 1, hop)
    z = np.array([np.sum(np.mean(y[s:s + block] ** 2, axis=0)) for s in starts])
    lk = -0.691 + 10 * np.log10(z + 1e-20)
    z = z[lk > -70]
    rel = -0.691 + 10 * np.log10(np.mean(z)) - 10
    z = z[-0.691 + 10 * np.log10(z) > rel]
    return -0.691 + 10 * np.log10(np.mean(z))


def peak_db(x):
    return 20 * np.log10(np.max(np.abs(x)) + 1e-20)


def true_peak_db(x):
    """4x oversampled peak, as BS.1770 true peak."""
    x = x if x.ndim == 2 else x[:, None]
    return 20 * np.log10(np.max(np.abs(signal.resample_poly(x, 4, 1, axis=0))) + 1e-20)


def calibrate(x, lufs, ceiling, integrated=False, max_drive=1.0, post_lp=None):
    """Gain to the loudness target. If the true peak would then pass the ceiling, round the peaks
    off with the gentlest tanh saturation that fits (bisection on the drive, never a hard clip,
    at most `max_drive`); whatever is still over comes off the gain, so the ceiling always wins
    and the sound lands a little under its target instead. `post_lp` (Hz) low-passes after the
    saturation, keeping the new harmonics in the band where they help instead of fizzing."""
    measure = integrated_loudness if integrated else event_loudness

    def shaped(drive):
        y = x / np.max(np.abs(x))
        if drive > 1.0:
            y = np.tanh(drive * y) / np.tanh(drive)
            if post_lp:
                y = lowpass(y, post_lp)
        return y * db(lufs - measure(y))

    y = shaped(1.0)
    if true_peak_db(y) > ceiling and max_drive > 1.0:
        top = shaped(max_drive)
        if true_peak_db(top) > ceiling:
            y = top
        else:
            lo, hi = 1.0, max_drive
            for _ in range(18):
                mid = 0.5 * (lo + hi)
                lo, hi = (lo, mid) if true_peak_db(shaped(mid)) <= ceiling else (mid, hi)
            y = shaped(hi)
    return y * db(min(0.0, ceiling - true_peak_db(y)))


# ---- reverb ------------------------------------------------------------------------------------

def _comb(x, d, g, damp):
    """y[n] = x[n] + g * s[n], s = one-pole low-pass of y[n-d]. Runs in blocks of d samples: each
    block only needs the previous one, so this is fast even for 45 s inputs."""
    y = np.zeros(x.size + d)
    zi = np.zeros(1)
    for s in range(0, x.size, d):
        e = min(x.size, s + d)
        prev = y[s:s + (e - s)]                      # y[n-d] for n in [s, e) (y is offset by d)
        lp, zi = signal.lfilter([1 - damp], [1, -damp], prev, zi=zi)
        y[s + d:e + d] = x[s:e] + g * lp
    return y[d:]


def _allpass(x, d, g):
    """y[n] = -g x[n] + x[n-d] + g y[n-d], block-wise."""
    xp = np.concatenate([np.zeros(d), x])
    y = np.zeros(x.size + d)
    for s in range(0, x.size, d):
        e = min(x.size, s + d)
        y[s + d:e + d] = -g * xp[s + d:e + d] + xp[s:e] + g * y[s:e]
    return y[d:]


def schroeder(x, rt60=1.0, damp=0.35, spread=0, predelay=0.012):
    """Schroeder reverb: 4 parallel damped feedback combs into 2 series all-passes (numpy/scipy).

    Each comb is y[n] = x[n] + g * lp(y[n-D]) with a one-pole low-pass `lp` in the loop (darker
    tail, like soft room surfaces). g follows the RT60: g = 10^(-3 D / (rt60 * SR)).
    `spread` offsets the delays (samples) so left and right decorrelate into a stereo room.
    """
    out = np.zeros_like(x)
    for ms in (29.7, 37.1, 41.1, 43.7):
        d = int(ms * SR / 1000) + spread
        out += _comb(x, d, 10 ** (-3 * d / (rt60 * SR)), damp)
    out /= 4
    for ms, g in ((5.0, 0.7), (1.7, 0.7)):
        out = _allpass(out, int(ms * SR / 1000) + spread // 3, g)
    pd = int(predelay * SR)
    return np.concatenate([np.zeros(pd), out[:-pd]]) if pd else out


# ---- effects -----------------------------------------------------------------------------------

def pin_tick():
    """A steel entomology pin pressed into cork: bright 25 ms click + faint 2.6 kHz ring."""
    g = rng("pin-tick")
    t = t_axis(0.10)
    burst = g.standard_normal(t.size) * np.exp(-t / 0.0025) * (t < 0.025)
    click = resonator(burst, 3200, 9) + 0.35 * resonator(burst, 7400, 14)   # pin-steel overtone
    gate = np.cos(0.5 * np.pi * np.clip(t / 0.09, 0, 1))                     # closes smoothly at 90 ms
    ring = np.sin(2 * np.pi * 2600 * t) * np.exp(-t / 0.024) * gate          # 90 ms decaying sine
    ring += 0.25 * np.sin(2 * np.pi * 2600 * 2.71 * t) * np.exp(-t / 0.008)
    x = click / np.max(np.abs(click)) + db(-16) * ring
    x = highpass(x, 900)
    return fade(x, 0.0003, 0.012)


def paper():
    """A herbarium sheet slid across another: pink noise, 300 ms, friction-modulated band."""
    g = rng("paper")
    t = t_axis(0.30)
    n = pink(t.size, g)
    # Friction: the sheet catches and releases; a slow random 12-30 Hz flutter on the level.
    flutter = signal.sosfiltfilt(signal.butter(2, 30, fs=SR, output="sos"), g.standard_normal(t.size))
    flutter = 1.0 + 0.35 * flutter / np.max(np.abs(flutter))
    # The contact band drifts up as the sheet speeds up, then settles.
    lo = bandpass(n, 700, 2600) * (1 - t / 0.3)
    hi = bandpass(n, 2200, 7500) * (0.4 + t / 0.3)
    x = (lo + 0.8 * hi) * flutter
    env = np.sin(np.pi * np.clip(t / 0.30, 0, 1)) ** 1.6     # soft swell in, soft settle out
    x = lowpass(x * env, 9000)
    return fade(x, 0.01, 0.03)


def pen():
    """A fine liner drawing a circle on archival label: granular, high-passed, micro-jittered."""
    g = rng("pen")
    dur = 0.40
    n = int(dur * SR)
    x = np.zeros(n)
    tpos = 0.0
    while tpos < dur - 0.006:
        glen = int(g.uniform(0.0015, 0.005) * SR)
        start = int(tpos * SR)
        grain = g.standard_normal(glen) * np.hanning(glen)
        amp = min(2.0, g.lognormal(0.0, 0.3))                # micro-amplitude jitter
        x[start:start + glen] += amp * grain[: max(0, min(glen, n - start))]
        tpos += g.uniform(0.0008, 0.0022)                     # ~650 grains/s, irregular
    x = highpass(x, 2500, order=4)
    x += 0.5 * resonator(x, 3400, 3)                         # the paper's papery body
    t = t_axis(dur)
    # Stroke pressure: nib lands, sweeps round the circle (two slight pushes), lifts off.
    pressure = np.clip(t / 0.04, 0, 1) * (0.8 + 0.2 * np.sin(2 * np.pi * 2.5 * t)) * np.clip((dur - t) / 0.08, 0, 1)
    x = lowpass(x * pressure, 11000)
    return fade(x, 0.002, 0.02)


def stamp():
    """A rubber verdict stamp landing on paper over felt: 90 -> 60 Hz drop + short transient."""
    g = rng("stamp")
    t = t_axis(0.18)
    f = 60 + 30 * np.exp(-t / 0.025)                          # pitch drop 90 -> 60 Hz
    phase = 2 * np.pi * np.cumsum(f) / SR
    hold = np.where(t < 0.03, 1.0, np.exp(-(t - 0.03) / 0.045))   # press, hold, release
    body = np.sin(phase) * hold * np.clip(t / 0.002, 0, 1)
    # Harmonics so the thud survives a phone speaker (the ear rebuilds the fundamental).
    body = 0.8 * soft_clip(body, 2.5) + 0.3 * np.sin(2 * phase) * np.exp(-t / 0.03)
    snap = lowpass(g.standard_normal(t.size) * np.exp(-t / 0.004), 2200)
    pap = bandpass(g.standard_normal(t.size), 280, 900) * np.exp(-t / 0.012)   # paper "pap"
    x = body + 0.5 * snap / np.max(np.abs(snap)) + 0.35 * pap / np.max(np.abs(pap))
    x = lowpass(x, 3000)                                     # muffled: rubber, not metal
    return fade(x, 0.0005, 0.03)


def drawer():
    """A felt-lined wooden specimen drawer sliding shut (0-0.78 s) and settling (0.8 s knock)."""
    g = rng("drawer")
    dur = 0.90
    t = t_axis(dur)
    # Mostly pink, a little brown for weight, and nothing under 90 Hz: a sub-bass random walk would
    # spend the headroom on rumble no phone plays and make the level lurch.
    n = highpass(brown(t.size, g) * 0.3 + pink(t.size, g) * 0.7, 90)
    # Velocity profile: pushed, glides, eases, and still moving when it meets the stop at 0.80 s.
    vel = np.sin(0.5 * np.pi * np.clip(t / 0.15, 0, 1)) * (1 - 0.55 * np.clip((t - 0.35) / 0.45, 0, 1) ** 1.5)
    vel *= np.clip((0.805 - t) / 0.005, 0, 1)
    # Sweep: the friction band follows speed (faster = brighter). A crossfade between a dark and
    # a brighter filtering of the same noise is a smooth time-varying filter, with no seams.
    dark, bright = lowpass(n, 180), lowpass(n, 700)
    out = dark * (1 - vel) + bright * vel
    # Phone presence: the runners' wood-on-wood rasp (300 Hz-1.6 kHz) rides on top with speed.
    out += 0.45 * bandpass(pink(t.size, g), 300, 1600) * vel ** 1.5
    out = lowpass(out, 2000)
    # Wooden carcass: a few box modes rung by the slide.
    wood = sum(resonator(out, f, q) * k for f, q, k in ((190, 8, 0.6), (330, 10, 0.4), (520, 12, 0.25)))
    slide = (out + 0.6 * wood) * vel
    # Knock at 0.80 s: damped by felt, so low modes only and very short.
    tk = np.clip(t - 0.80, 0, None)
    on = (t >= 0.80).astype(float)
    soft = np.clip(tk / 0.0015, 0, 1) * on                      # felt: no hard edge on contact
    knock = soft * sum(k * np.sin(2 * np.pi * f * tk) * np.exp(-tk / d)
                       for f, k, d in ((140, 1.0, 0.035), (262, 0.55, 0.022), (415, 0.3, 0.015), (820, 0.18, 0.008)))
    thump = soft * lowpass(g.standard_normal(t.size), 900) * np.exp(-tk / 0.006)
    knock = soft_clip(knock + 0.4 * thump / np.max(np.abs(thump)), 1.8)
    x = slide / np.max(np.abs(slide)) * 0.75 + knock / np.max(np.abs(knock)) * 0.45
    return fade(x, 0.02, 0.04)


def ui_click():
    """A soft 20 ms click: damped 1.4 kHz body + a breath of noise."""
    g = rng("ui-click")
    t = t_axis(0.02)
    body = np.sin(2 * np.pi * 1400 * t) * np.exp(-t / 0.003)
    tick = lowpass(g.standard_normal(t.size), 5000) * np.exp(-t / 0.0008)
    x = body + 0.25 * tick / np.max(np.abs(tick))
    return fade(highpass(x, 400), 0.0004, 0.006)


# ---- motif -------------------------------------------------------------------------------------

NOTE = {"A3": 220.0, "C#4": 277.18, "E4": 329.63, "F#4": 369.99}


def box_voice(f, dur, vel):
    """Soft music-box voice: sine + quiet triangle, a fast-decaying inharmonic 'tine' partial."""
    t = t_axis(dur)
    attack = np.clip(t / 0.004, 0, 1)
    sine = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.55)
    tri = triangle(f * t + 0.25) * np.exp(-t / 0.25)
    tine = np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t / 0.035)  # the comb-tooth ping
    x = vel * attack * (sine + 0.22 * tri + 0.10 * tine)
    return fade(lowpass(x, 4500), 0.0, min(0.25, dur / 3))     # never cut a ringing tine


def motif():
    """SPECIMIND: A3 E4 C#4 F#4. An A6 arpeggio that never resolves to A, so it ends on a question
    (curious), with the major sixth (F#) on top for a light Dorian/pentatonic colour."""
    dur = 1.6
    notes = (("A3", 0.00, 0.85), ("E4", 0.19, 0.70), ("C#4", 0.31, 0.72), ("F#4", 0.50, 1.00))
    dry = np.zeros(int(dur * SR))
    for name, at, vel in notes:
        v = box_voice(NOTE[name], dur - at, vel)
        s = int(at * SR)
        e = min(dry.size, s + v.size)
        dry[s:e] += v[: e - s]
    wet_l = schroeder(dry, rt60=1.1, damp=0.4, spread=0)
    wet_r = schroeder(dry, rt60=1.1, damp=0.4, spread=23)
    wet = np.stack([wet_l, wet_r], axis=1)
    wet /= np.max(np.abs(wet))
    dry /= np.max(np.abs(dry))
    x = 0.8 * dry[:, None] + 0.32 * wet
    return fade(x, 0.001, 0.25)


# ---- beds --------------------------------------------------------------------------------------

def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


# Each bed: tonal centre / mode (all contain A, C#, E and F#), tempo, chords (MIDI notes),
# beats per chord, filter-LFO period, texture. Six different centres, so consecutive episodes
# never share a key, and the motif fits all of them. Voicings keep semitones an octave apart (no
# beating clusters in the 250-400 Hz band where a phone speaker is loudest).
BEDS = {
    1: dict(name="D Ionian, 64 bpm", bpm=64, beats=8, lfo=15.0, bright=0.55, texture="none",
            chords=[[50, 57, 64, 66, 69], [47, 54, 62, 66, 69], [43, 54, 59, 62, 66], [45, 54, 61, 64, 69]]),
    2: dict(name="F# Aeolian, 52 bpm", bpm=52, beats=6, lfo=19.0, bright=0.4, texture="plucks",
            chords=[[42, 57, 61, 64, 68], [50, 57, 61, 66, 69], [45, 56, 61, 64, 71], [52, 56, 59, 61, 66]]),
    3: dict(name="B Dorian, 72 bpm", bpm=72, beats=8, lfo=11.0, bright=0.7, texture="glass",
            chords=[[47, 57, 62, 66, 73], [52, 56, 62, 66, 73], [47, 54, 57, 62, 73], [45, 57, 61, 64, 66]]),
    4: dict(name="E Mixolydian, 58 bpm", bpm=58, beats=8, lfo=17.0, bright=0.5, texture="air",
            chords=[[40, 56, 59, 64, 68], [40, 54, 57, 62, 66], [40, 57, 61, 64, 69], [40, 56, 59, 62, 66]]),
    5: dict(name="A Lydian, 66 bpm", bpm=66, beats=8, lfo=13.0, bright=0.65, texture="arp",
            chords=[[45, 52, 56, 61, 75], [47, 54, 59, 63, 66], [49, 56, 61, 64, 68], [45, 59, 61, 64, 68]]),
    6: dict(name="G Lydian, 48 bpm", bpm=48, beats=6, lfo=23.0, bright=0.35, texture="deep",
            chords=[[43, 54, 59, 62, 73], [45, 52, 57, 61, 64], [40, 54, 59, 62, 66], [43, 50, 57, 61, 66]]),
}
BED_SECONDS = 45.0
HARMONICS = 10


def pad_note(f, t, env, g, cutoff, bright, width):
    """One additive pad voice: HARMONICS partials, each detuned slightly per channel, each with its
    own slow shimmer, weighted by a time-varying low-pass |H(f_k, fc(t))| (the filter LFO)."""
    out = np.zeros((t.size, 2))
    for k in range(1, HARMONICS + 1):
        fk = f * k
        if fk > 9000:
            break
        base = (1.0 / k ** (1.6 - 0.5 * bright))
        # Second-order low-pass magnitude at this partial for the moving cutoff.
        r = fk / cutoff
        h = 1.0 / np.sqrt((1 - r ** 2) ** 2 + (r / 0.8) ** 2)
        shimmer = 1.0 + 0.25 * np.sin(2 * np.pi * g.uniform(0.05, 0.22) * t + g.uniform(0, 2 * np.pi))
        for ch, sign in ((0, -1), (1, 1)):
            det = 1 + sign * width * g.uniform(0.6, 1.0) * 1e-3   # ~1-2 cents per side
            ph = g.uniform(0, 2 * np.pi)
            out[:, ch] += base * h * shimmer * np.sin(2 * np.pi * fk * det * t + ph)
    return out * env[:, None]


def bed(i):
    spec = BEDS[i]
    g = rng(f"bed-{i}")
    t = t_axis(BED_SECONDS)
    beat = 60.0 / spec["bpm"]
    chord_len = spec["beats"] * beat
    # Filter LFO: cutoff breathes between ~500 Hz and ~2.2 kHz (times brightness), plus a slower
    # drift so no two cycles match.
    lfo = 0.5 + 0.5 * np.sin(2 * np.pi * t / spec["lfo"] - np.pi / 2)
    drift = 0.5 + 0.5 * np.sin(2 * np.pi * t / (spec["lfo"] * 2.7) + 1.0)
    cutoff = 450 + (900 + 1300 * spec["bright"]) * (0.7 * lfo + 0.3 * drift)

    x = np.zeros((t.size, 2))
    n_chords = int(np.ceil(BED_SECONDS / chord_len)) + 1
    xfade = 0.45 * chord_len
    for c in range(n_chords):
        chord = spec["chords"][c % len(spec["chords"])]
        start = c * chord_len - xfade / 2
        # Long overlapping raised-cosine envelopes: chords dissolve into each other.
        u = (t - start) / (chord_len + xfade)
        env = np.where((u > 0) & (u < 1), np.sin(np.pi * np.clip(u, 0, 1)) ** 2, 0.0)
        live = np.flatnonzero(env)
        if live.size == 0:
            continue
        sl = slice(live[0], live[-1] + 1)               # synthesise only where the chord sounds
        for j, m in enumerate(chord):
            level = 0.75 if j == 0 else 1.0 / (1 + 0.15 * j)
            if spec["texture"] == "deep" and j == 0:
                level = 1.0
            x[sl] += level * pad_note(midi(m), t[sl], env[sl], g, cutoff[sl], spec["bright"], width=1.5)

    tex = spec["texture"]
    if tex in ("plucks", "arp"):
        # Sparse soft plucks from the current chord, on the beat grid (seeded, so repeatable).
        step = beat if tex == "arp" else 2 * beat
        k = 0
        while k * step < BED_SECONDS - 2:
            if tex == "arp" or g.random() < 0.6:
                c = int((k * step) // chord_len)
                chord = spec["chords"][c % len(spec["chords"])]
                m = chord[1 + (k % (len(chord) - 1))] + 12 * (tex == "arp" and k % 4 == 3)
                v = box_voice(midi(m), 1.6, g.uniform(0.5, 0.8))
                s = int(k * step * SR)
                e = min(t.size, s + v.size)
                pan = g.uniform(-0.6, 0.6)
                x[s:e, 0] += 0.5 * (1 - pan) * v[: e - s] * 0.9
                x[s:e, 1] += 0.5 * (1 + pan) * v[: e - s] * 0.9
            k += 1
    elif tex == "glass":
        # A high, slow two-note shimmer (C#6/E6) under tremolo at the beat rate.
        for m, ph in ((85, 0.0), (88, 1.3)):
            trem = 0.5 + 0.5 * np.sin(2 * np.pi * t / (2 * beat) + ph)
            w = np.sin(2 * np.pi * midi(m) * t) * trem * 0.07
            x[:, 0] += w * (1.0 if m == 85 else 0.6)
            x[:, 1] += w * (0.6 if m == 85 else 1.0)
    elif tex == "air":
        # Breath of filtered pink noise that swells with the filter LFO.
        air = np.stack([bandpass(pink(t.size, g), 600, 3500), bandpass(pink(t.size, g), 600, 3500)], axis=1)
        x += 0.12 * air * (0.3 + 0.7 * lfo)[:, None]
    elif tex == "deep":
        # A slow octave-and-fifth drone on G, moving only at half the chord rate.
        d = np.sin(2 * np.pi * midi(43) * t) + 0.5 * np.sin(2 * np.pi * midi(50) * t + 0.4)
        x += 0.35 * (d * (0.6 + 0.4 * drift))[:, None]

    # Room: the same Schroeder reverb as the motif, longer, mixed low.
    room = np.stack([schroeder(x[:, 0], rt60=2.2, damp=0.5, spread=0),
                     schroeder(x[:, 1], rt60=2.2, damp=0.5, spread=23)], axis=1)
    x = 0.8 * x / np.max(np.abs(x)) + 0.3 * room / np.max(np.abs(room))
    x = highpass(x, 70)                         # nothing a phone can't play, and no DC/rumble
    return fade(x, 1.2, 3.0)


# ---- output ------------------------------------------------------------------------------------

def wav_bytes(x):
    x = x if x.ndim == 2 else x[:, None]
    pcm = np.clip(np.round(x * 32767.0), -32768, 32767).astype("<i2")
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(pcm.shape[1])
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    return buf.getvalue()


def build():
    sounds = {
        "pin-tick": pin_tick, "paper": paper, "pen": pen, "stamp": stamp,
        "drawer": drawer, "ui-click": ui_click, "motif": motif,
    }
    out = {}
    for name, fn in sounds.items():
        lufs, ceiling, drive, post = TARGETS[name]
        out[name] = calibrate(fn(), lufs, ceiling, max_drive=drive, post_lp=post)
    for i in BEDS:
        out[f"bed-{i}"] = calibrate(bed(i), BED_LUFS, BED_PEAK, integrated=True, max_drive=1.3)
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--check", action="store_true", help="fail if committed files differ from a fresh build")
    args = ap.parse_args()
    sounds = build()
    os.makedirs(OUT, exist_ok=True)
    print(f"{'file':<14}{'secs':>6}{'ch':>4}{'LUFS':>8}{'peak':>8}{'dBTP':>8}  measure")
    stale = []
    for name, x in sounds.items():
        is_bed = name.startswith("bed-")
        lufs = integrated_loudness(x) if is_bed else event_loudness(x)
        ch = 1 if x.ndim == 1 else x.shape[1]
        label = BEDS[int(name[4:])]["name"] if is_bed else ""
        print(f"{name + '.wav':<14}{x.shape[0] / SR:>6.2f}{ch:>4}{lufs:>8.1f}{peak_db(x):>8.1f}{true_peak_db(x):>8.1f}"
              f"  {'integrated' if is_bed else 'event'} {label}")
        data = wav_bytes(x)
        path = os.path.join(OUT, f"{name}.wav")
        if args.check:
            if not os.path.exists(path) or open(path, "rb").read() != data:
                stale.append(path)
        else:
            with open(path, "wb") as f:
                f.write(data)
    if args.check and stale:
        print("stale or missing (run python3 scripts/make_sfx.py):", *stale, sep="\n  ")
        sys.exit(1)
    print(("checked" if args.check else "wrote") + f" {len(sounds)} files in {os.path.relpath(OUT, ROOT)}")


if __name__ == "__main__":
    main()
