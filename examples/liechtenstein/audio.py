# Synthesized stems for "The Emu War": music.wav (march + drone + button) and sfx.wav. Levels are set later by mix.py.
import numpy as np, wave, sys
SR = 48000
DUR = float(sys.argv[1]) if len(sys.argv) > 1 else 35.24
N = int(DUR * SR) + SR // 10
rng = np.random.default_rng(7)
F = lambda f: f / 30.0  # frame -> seconds

def env(n, a, d, s=0.0, r=0.0):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4)) * (s + (1 - s) * np.exp(-np.maximum(0, t - a) / max(d, 1e-4)))
    if r: e *= np.clip((t[-1] - t) / r, 0, 1)
    return e

def lp(x, fc):
    a = np.exp(-2 * np.pi * fc / SR); y = np.empty_like(x); z = 0.0
    for i in range(len(x)): z = (1 - a) * x[i] + a * z; y[i] = z
    return y

def lpv(x, fc):  # vectorised one-pole via scipy-free recursion in chunks (fast enough with numpy cumulative trick)
    a = np.exp(-2 * np.pi * fc / SR)
    # exact IIR using lfilter-like loop is slow in python; use FFT-domain approximation
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    H = 1 / np.sqrt(1 + (f / fc) ** 2)
    return np.fft.irfft(X * H, len(x))

def hpv(x, fc):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    H = (f / fc) / np.sqrt(1 + (f / fc) ** 2)
    return np.fft.irfft(X * H, len(x))

def bpv(x, fc, q=2.0):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR) + 1e-6
    H = 1 / np.sqrt(1 + q * q * (f / fc - fc / f) ** 2)
    return np.fft.irfft(X * H, len(x))

def put(buf, x, t, g=1.0):
    i = int(t * SR)
    if i >= len(buf): return
    x = x[: len(buf) - i]
    buf[i:i + len(x)] += g * x

def tone(freq, dur, kind='saw', vib=0.0):
    n = int(dur * SR); t = np.arange(n) / SR
    ph = 2 * np.pi * np.cumsum(freq * (1 + vib * np.sin(2 * np.pi * 5.5 * t))) / SR
    if kind == 'sin': return np.sin(ph)
    if kind == 'tri': return 2 / np.pi * np.arcsin(np.sin(ph))
    if kind == 'sq': return np.sign(np.sin(ph)) * 0.6
    return 2 * ((ph / (2 * np.pi)) % 1) - 1

noise = lambda d: rng.standard_normal(int(d * SR))
mtof = lambda m: 440 * 2 ** ((m - 69) / 12)

# ---------------- music: little alpine oompah march ----------------
music = np.zeros(N)
BPM = 116; beat = 60 / BPM
STOP = F(828)
brass = lambda m, d: lpv(tone(mtof(m), d, 'saw', vib=0.004) * 0.6 + tone(mtof(m) * 1.003, d, 'sq') * 0.3, 1400) * env(int(d * SR), 0.015, 0.25, 0.5, 0.04)
tuba = lambda m: lpv(tone(mtof(m), 0.28, 'saw'), 500) * env(int(0.28 * SR), 0.01, 0.15)
snare = lambda: hpv(noise(0.12), 2500) * env(int(0.12 * SR), 0.001, 0.05)
bass = [43, 50, 43, 50, 48, 55, 50, 57]
mel = [67, 71, 74, 71, 72, 69, 66, 69, 67, 71, 74, 79, 78, 76, 74, None]
t = 0.0; i = 0
while t < STOP:
    f = t * 30
    cold = 322 <= f < 418
    if i % 2 == 0: put(music, tuba(bass[(i // 2) % 8] - 12), t, 0.9)
    elif not cold:
        for n in [67, 71, 74] if (i // 4) % 2 == 0 else [66, 69, 72]: put(music, lpv(tone(mtof(n), 0.16, 'sq'), 1200) * env(int(0.16 * SR), 0.005, 0.06), t, 0.12)
    if not cold: put(music, snare(), t + beat * 0.5, 0.35 if i % 4 == 3 else 0.15)
    mm = mel[i % 16]
    if mm is not None and not cold and i >= 4 and not (418 <= f < 440):
        put(music, brass(mm, beat * 0.9), t, 0.3)
    t += beat; i += 1
music[int(STOP * SR):] = 0
fade = int(0.12 * SR); music[int(STOP * SR) - fade:int(STOP * SR)] *= np.linspace(1, 0, fade)
# held cold drone under the waiting
dr = lpv(tone(mtof(31), F(96), 'saw') * 0.5 + tone(mtof(38), F(96), 'saw') * 0.3, 260) * env(int(F(96) * SR), 0.3, 99, 1, 0.3)
put(music, dr, F(322), 0.5)
# button on "For good"
bt = sum(tone(mtof(m), 1.3, 'saw') for m in [43, 50, 55, 59, 62]) / 5 * env(int(1.3 * SR), 0.005, 0.45)
put(music, lpv(bt, 2600), F(860), 1.0)
put(music, hpv(noise(0.8), 5000) * env(int(0.8 * SR), 0.001, 0.3), F(860), 0.25)

# ---------------- sfx ----------------
sfx = np.zeros(N)
def horn():
    d = 0.5; x = (tone(330, d, 'sq') + tone(415, d, 'sq')) * env(int(d * SR), 0.01, 0.3, 0.7, 0.05); return lpv(x, 1800)
def fall():
    n = int(0.6 * SR); return np.sin(2 * np.pi * np.cumsum(np.linspace(1800, 500, n)) / SR) * env(n, 0.01, 0.5, 0.6, 0.05) * 0.4
def chatter(d):
    x = bpv(noise(d), 700, 1.2) * (0.6 + 0.4 * np.abs(np.sin(np.linspace(0, d * 9, int(d * SR)))) ** 2); return x
def sparkle():
    out = np.zeros(int(0.8 * SR))
    for k, f0 in enumerate([2093, 2637, 3136, 4186]):
        x = ting(f0, 0.4); out[int(k * 0.07 * SR):int(k * 0.07 * SR) + len(x)] += x
    return out
def whoosh(d=0.5, f0=400, f1=2500):
    n = int(d * SR); x = noise(d); tt = np.linspace(0, 1, n)
    y = np.zeros(n)
    for k, (a, b) in enumerate(zip(range(0, n, n // 8), list(range(n // 8, n, n // 8)) + [n])):
        fc = f0 + (f1 - f0) * (k / 7)
        y[a:b] = bpv(x, fc, 1.5)[a:b]
    return y * np.sin(np.pi * tt) ** 1.5
def thunk(f=70, d=0.35):
    n = int(d * SR); return (np.sin(2 * np.pi * np.cumsum(np.linspace(f * 1.8, f, n)) / SR) + 0.3 * lpv(noise(d), 400)) * env(n, 0.002, d / 4)
def ting(f=2400, d=0.8):
    n = int(d * SR); return (tone(f, d, 'sin') + 0.5 * tone(f * 2.76, d, 'sin') + 0.25 * tone(f * 5.4, d, 'sin')) * env(n, 0.001, d / 3.5) * 0.5
def knock(f=900): n = int(0.08 * SR); return bpv(noise(0.08), f, 3) * env(n, 0.001, 0.02) * 2
def rustle(d=0.6): n = int(d * SR); return bpv(noise(d), 3500, 0.6) * (0.5 + 0.5 * np.abs(np.sin(np.linspace(0, 25, n)))) * np.sin(np.pi * np.linspace(0, 1, n)) * 0.5
def pop(): n = int(0.12 * SR); return np.sin(2 * np.pi * np.cumsum(np.linspace(300, 900, n)) / SR) * env(n, 0.002, 0.04)
def step(): n = int(0.06 * SR); return lpv(noise(0.06), 900) * env(n, 0.001, 0.015) * 1.5
def engine(d, rpm=1.0, start=1.0):
    n = int(d * SR); tt = np.arange(n) / SR
    f = 32 * rpm * (1 + 0.15 * np.sin(2 * np.pi * 0.7 * tt))
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sign(np.sin(ph)) * 0.5 + 0.4 * np.sin(2 * ph) + 0.3 * lpv(noise(d), 300)
    return lpv(x, 500) * 0.6
def boom(): n = int(0.5 * SR); return np.sin(2 * np.pi * np.cumsum(np.linspace(90, 50, n)) / SR) * env(n, 0.01, 0.15) * (1 + 0.5 * np.sin(2 * np.pi * 18 * np.arange(n) / SR))
def burst(k=5):
    out = np.zeros(int(0.6 * SR))
    for i in range(k):
        n = int(0.07 * SR); x = lpv(noise(0.07), 1200) * env(n, 0.001, 0.02) * 1.5
        out[int(i * 0.09 * SR):int(i * 0.09 * SR) + n] += x
    return out
def sadtrom(notes, t0, d=0.42):
    for i, m in enumerate(notes):
        dd = d * (2.2 if i == len(notes) - 1 else 1)
        x = tone(mtof(m), dd, 'saw', vib=0.012 if i == len(notes) - 1 else 0.003)
        x = lpv(x, 900) * env(int(dd * SR), 0.03, 0.4, 0.6, 0.1)
        put(sfx, x, t0 + i * d, 0.35)

def flutter(d):
    x = bpv(noise(d), 2500, 0.8) * (0.4 + 0.6 * np.abs(np.sin(np.linspace(0, d * 40, int(d * SR))))); return x
def ding(f0=1760): return ting(f0, 0.9) * 0.9
def ripp(d=0.4): n = int(d * SR); return hpv(noise(d), 1200) * (0.5 + 0.5 * np.abs(np.sin(np.linspace(0, 60, n)))) * env(n, 0.005, d / 2)
def ambience(a, b, kind):
    d = F(b - a); x = lpv(noise(d), 500) * 0.5 + (chatter(d) * 0.4 if kind == 'street' else 0)
    x *= np.minimum(1, np.minimum(np.arange(len(x)) / (0.2 * SR), (len(x) - np.arange(len(x))) / (0.2 * SR)))
    put(sfx, x, F(a), 0.15)
for a, b, k in [(0, 252, 'street'), (492, 885, 'street')]: ambience(a, b, k)
def wind(d):
    n = int(d * SR); x = bpv(noise(d), 600, 0.8) * (0.6 + 0.4 * np.sin(np.linspace(0, d * 2.2, n)) ** 2)
    x *= np.minimum(1, np.minimum(np.arange(n) / (0.4 * SR), (n - np.arange(n)) / (0.4 * SR))); return x
def boing():
    n = int(0.45 * SR); tt = np.arange(n) / SR; return np.sin(2 * np.pi * np.cumsum(300 + 120 * np.sin(2 * np.pi * 9 * tt) * np.exp(-tt * 4)) / SR) * env(n, 0.005, 0.25)
def stamp():
    x = thunk(70, 0.45); k = knock(250); x[:len(k)] += 0.8 * k; return x
for k in range(int(F(252) / 0.26)): put(sfx, step(), k * 0.26, 0.35)
for k in range(int(F(98) / 0.26)): put(sfx, step(), F(492) + k * 0.26, 0.35)
put(sfx, wind(F(166)), F(252), 0.9)
put(sfx, boing(), F(288), 0.5)
for k in range(6): put(sfx, step(), F(418) + k * 0.18, 0.5)
put(sfx, whoosh(0.4, 500, 2500), F(444), 0.5); put(sfx, ding(1760), F(448), 0.35)
put(sfx, chatter(1.2), F(456), 0.6); put(sfx, sparkle(), F(460), 0.35)
put(sfx, ripp(0.4), F(598), 0.5); put(sfx, ding(2093), F(606), 0.5); put(sfx, ting(2600, 0.5), F(608), 0.3)
put(sfx, boing(), F(664), 0.5); put(sfx, chatter(0.8), F(668), 0.4)
put(sfx, whoosh(0.4, 400, 2600), F(788), 0.5); put(sfx, pop(), F(792), 0.7); put(sfx, pop(), F(795), 0.5); put(sfx, pop(), F(798), 0.5)
put(sfx, chatter(1.0), F(806), 0.4)
put(sfx, whoosh(0.3, 1200, 400), F(836), 0.4); put(sfx, stamp(), F(842), 1.0); put(sfx, ting(1800, 0.5), F(844), 0.35)
put(sfx, sparkle(), F(860), 0.45)

def save(name, x):
    x = x[: int(DUR * SR)]
    pk = np.max(np.abs(x)) or 1
    x = x / pk * 0.9
    with wave.open(name, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x * 32767).astype(np.int16).tobytes())
save('music.wav', music); save('sfx.wav', sfx)
print('stems written', DUR)
