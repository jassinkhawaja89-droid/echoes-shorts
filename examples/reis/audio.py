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

# ---------------- music: sneaky Paris caper ----------------
music = np.zeros(N)
BPM = 112; beat = 60 / BPM
STOP = F(947)
pluck = lambda m, d=0.3: lpv(tone(mtof(m), d, 'tri'), 900) * env(int(d * SR), 0.003, 0.12)
brush = lambda: hpv(noise(0.12), 4000) * env(int(0.12 * SR), 0.002, 0.04) * 0.35
# D minor walking bass + accordion-ish melody
bass = [33, 36, 40, 36, 38, 41, 40, 36, 33, 36, 40, 43, 40, 39, 38, 35]
mel = [69, None, 72, 71, 69, None, 64, None, 65, 67, 69, None, 71, 72, 71, 68]
t = 0.0; i = 0
while t < STOP:
    m = bass[i % 16]
    put(music, pluck(m - 12 + 12, 0.32), t, 0.7)
    if i % 2 == 1: put(music, brush(), t, 1.0)
    put(music, brush(), t + beat * 0.66, 0.5)
    mm = mel[i % 16]
    if mm is not None and (i // 16) % 2 == 0 or (mm is not None and i > 64):
        x = (tone(mtof(mm), beat * 0.9, 'sq', vib=0.006) * 0.5 + tone(mtof(mm) * 1.005, beat * 0.9, 'saw', vib=0.006) * 0.4)
        put(music, lpv(x, 2200) * env(len(x), 0.02, 0.4, 0.5, 0.05), t, 0.16)
    if (i // 16) % 2 == 1 and i % 4 == 0:  # chord stabs on the second half
        ch = sum(tone(mtof(n), beat * 0.4, 'saw') for n in [57, 60, 64]) / 3
        put(music, lpv(ch, 1600) * env(len(ch), 0.005, 0.1), t + beat / 2, 0.2)
    t += beat; i += 1
music[int(STOP * SR):] = 0
fade = int(0.15 * SR); music[int(STOP * SR) - fade:int(STOP * SR)] *= np.linspace(1, 0, fade)
dr = lpv(tone(mtof(26), DUR - STOP, 'saw') * 0.5 + tone(mtof(33), DUR - STOP, 'saw') * 0.3, 200) * env(int((DUR - STOP) * SR), 0.3, 99, 1, 0.3)
put(music, dr, STOP, 0.6)
# tiptoe plucks while he walks back in
for k in range(8): put(music, pluck([45, 48, 52, 48, 45, 48, 52, 57][k], 0.2), F(995) + k * beat * 0.5, 0.45)
# button on "again"
bt = sum(tone(mtof(m), 1.4, 'saw') for m in [45, 52, 57, 60, 64]) / 5 * env(int(1.4 * SR), 0.005, 0.5)
put(music, lpv(bt, 2800), F(1043), 1.0)
put(music, hpv(noise(1.0), 5000) * env(int(1.0 * SR), 0.001, 0.4), F(1043), 0.25)

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
for a, b, k in [(0, 236, 'street'), (437, 565, 'street'), (690, 815, 'street'), (935, 1057, 'street'), (236, 437, 'room'), (565, 690, 'room'), (815, 935, 'room')]: ambience(a, b, k)
put(sfx, flutter(2.0), F(60), 0.25); put(sfx, flutter(3.0), F(100), 0.35)
put(sfx, sparkle(), F(204), 0.6); put(sfx, ding(1760), F(207), 0.5)
put(sfx, whoosh(0.4, 500, 2500), F(230), 0.6)
for k in range(9): put(sfx, bpv(noise(0.18), 3800, 3) * env(int(0.18 * SR), 0.01, 0.12), F(246) + k * 0.2, 0.35)
put(sfx, thunk(200, 0.3), F(300), 0.4); put(sfx, ting(700, 0.6), F(300), 0.4)
for a in (355, 369, 383): put(sfx, thunk(110, 0.25), F(a), 0.9); put(sfx, knock(500), F(a), 0.5)
put(sfx, whoosh(0.6, 400, 3000), F(410), 0.6); put(sfx, whoosh(0.4, 500, 2500), F(431), 0.6)
put(sfx, whoosh(1.2, 300, 1800), F(450), 0.5); put(sfx, pop(), F(495), 0.5)
put(sfx, thunk(90, 0.3), F(541), 0.9); put(sfx, ding(2093), F(543), 0.45)
put(sfx, thunk(70, 0.4), F(577), 0.9); put(sfx, knock(400), F(577), 0.6)
for k in range(12): put(sfx, thunk(140, 0.18), F(580) + k * 0.26, 0.45); put(sfx, knock(900), F(580) + k * 0.26 + 0.13, 0.25)
put(sfx, flutter(3.5), F(582), 0.45)
for a in [624, 630, 636, 642, 648, 654, 660, 666, 672, 678]: put(sfx, thunk(85, 0.3), F(a + 6), 0.75); put(sfx, knock(300), F(a + 6), 0.4)
put(sfx, whoosh(0.4, 500, 2500), F(683), 0.6)
eg = engine(1.0, 1.2); put(sfx, eg * np.linspace(0.4, 1, len(eg)), F(690), 0.7); put(sfx, horn(), F(712), 0.5)
sq = tone(1800, 0.3, 'saw', vib=0.03) * env(int(0.3 * SR), 0.02, 0.12); put(sfx, bpv(sq, 1800, 4), F(714), 0.2)
put(sfx, pop(), F(720), 0.4)
for k in range(12): put(sfx, step(), F(727) + k * 0.33, 0.4)
put(sfx, whoosh(0.4, 1200, 400), F(768), 0.4); put(sfx, thunk(100, 0.35), F(776), 0.9); put(sfx, ting(1200, 0.7), F(776), 0.5)
for k in range(8): put(sfx, knock(2500), F(820) + k * 0.5, 0.15)
put(sfx, whoosh(0.3, 600, 2400), F(898), 0.45)
bo = np.sin(2 * np.pi * np.cumsum(220 + 120 * np.sin(np.linspace(0, 30, int(0.5 * SR)))) / SR) * env(int(0.5 * SR), 0.005, 0.3); put(sfx, bo, F(906), 0.5)
put(sfx, ting(2600, 0.3), F(907), 0.35)
put(sfx, sparkle(), F(962), 0.6); put(sfx, ding(1760), F(966), 0.5)
put(sfx, ripp(0.5), F(1036), 0.8); put(sfx, flutter(1.2), F(1040), 0.4)

def save(name, x):
    x = x[: int(DUR * SR)]
    pk = np.max(np.abs(x)) or 1
    x = x / pk * 0.9
    with wave.open(name, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x * 32767).astype(np.int16).tobytes())
save('music.wav', music); save('sfx.wav', sfx)
print('stems written', DUR)
