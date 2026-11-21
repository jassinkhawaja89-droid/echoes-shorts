# Synthesized stems for "The Shortest War": music.wav (march + drone + button) and sfx.wav. Levels are set later by mix.py.
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
# ---------------- music: brisk naval march with a hint of the harbour ----------------
music = np.zeros(N)
BPM = 120; beat = 60 / BPM
STOP = F(800)
pluck = lambda m, d=0.3: lpv(tone(mtof(m), d, 'tri'), 900) * env(int(d * SR), 0.003, 0.12)
snare = lambda: bpv(noise(0.14), 2500, 0.8) * env(int(0.14 * SR), 0.001, 0.05) * 0.5
kick = lambda: thunk(60, 0.25) * 0.9
bass = [38, 45, 38, 45, 41, 48, 41, 48, 36, 43, 36, 43, 45, 44, 45, 33]
mel = [62, 65, 69, None, 67, 65, 64, 65, 67, None, 64, 60, 62, None, 69, 68]
t = 0.0; i = 0
while t < STOP:
    put(music, pluck(bass[i % 16] - 12 + 12, 0.3), t, 0.8)
    if i % 2 == 0: put(music, kick(), t, 0.7)
    else: put(music, snare(), t, 0.9)
    put(music, snare(), t + beat * 0.75, 0.25)
    mm = mel[i % 16]
    if mm is not None and i >= 8:
        x = tone(mtof(mm), beat * 0.85, 'sq', vib=0.008) * 0.45 + tone(mtof(mm) * 1.004, beat * 0.85, 'saw', vib=0.008) * 0.4
        put(music, lpv(x, 2000) * env(len(x), 0.02, 0.35, 0.5, 0.05), t, 0.17)
    if i % 4 == 2:
        ch = sum(tone(mtof(n), beat * 0.5, 'saw') for n in [62, 65, 69]) / 3
        put(music, lpv(ch, 1500) * env(len(ch), 0.005, 0.12), t, 0.18)
    t += beat; i += 1
music[int(STOP * SR):] = 0
fade = int(0.12 * SR); music[int(STOP * SR) - fade:int(STOP * SR)] *= np.linspace(1, 0, fade)
dr = lpv(tone(mtof(26), DUR - STOP, 'saw') * 0.5 + tone(mtof(33), DUR - STOP, 'saw') * 0.3, 200) * env(int((DUR - STOP) * SR), 0.3, 99, 1, 0.3)
put(music, dr, STOP, 0.55)
bt = sum(tone(mtof(m), 1.6, 'saw') for m in [38, 45, 50, 53, 57]) / 5 * env(int(1.6 * SR), 0.005, 0.6)
put(music, lpv(bt, 2600), F(836), 1.0)
put(music, hpv(noise(1.0), 5000) * env(int(1.0 * SR), 0.001, 0.4), F(836), 0.25)

def tick(): n = int(0.03 * SR); return bpv(noise(0.03), 3200, 4) * env(n, 0.0005, 0.008) * 2.5
def bong(f0=196, d=2.0): n = int(d * SR); return (tone(f0, d, 'sin') + 0.6 * tone(f0 * 2.01, d, 'sin') + 0.3 * tone(f0 * 3.2, d, 'sin')) * env(n, 0.003, d / 3)
def cannon(): n = int(0.9 * SR); return (np.sin(2 * np.pi * np.cumsum(np.linspace(120, 35, n)) / SR) * 0.8 + lpv(noise(0.9), 700) * 0.9) * env(n, 0.002, 0.25)
def crash(d=1.6): n = int(d * SR); return (lpv(noise(d), 1500) * 0.8 + bpv(noise(d), 3000, 1.0) * 0.4) * env(n, 0.005, d / 3) * (0.6 + 0.4 * np.abs(np.sin(np.linspace(0, 40, n))))
def rumble(d=2.0): n = int(d * SR); return lpv(noise(d), 160) * 2.5 * np.sin(np.pi * np.linspace(0, 1, n))
def gurgle(d=1.4):
    out = np.zeros(int(d * SR))
    for k in range(14):
        n = int(0.09 * SR); f0 = 300 + 500 * rng.random(); x = np.sin(2 * np.pi * np.cumsum(np.linspace(f0, f0 * 1.8, n)) / SR) * env(n, 0.003, 0.03)
        i0 = int(rng.random() * (len(out) - n)); out[i0:i0 + n] += x
    return out
def gull():
    n = int(0.35 * SR); return np.sin(2 * np.pi * np.cumsum(1700 + 500 * np.sin(np.linspace(0, 9, n))) / SR) * env(n, 0.02, 0.15) * 0.4
def sea(d): n = int(d * SR); x = lpv(noise(d), 380) * (0.7 + 0.3 * np.sin(np.linspace(0, d * 1.3, n))); return x
put(sfx, sea(DUR), 0, 0.22)
for k in range(int((130 - 18) / 15)): put(sfx, tick(), F(18) + k * 0.5, 0.5)
put(sfx, pop(), F(112), 0.45); put(sfx, ding(1760), F(113), 0.45)
put(sfx, whoosh(0.5, 500, 2600), F(138), 0.6)
for a in (160, 190, 205): put(sfx, gull(), F(a), 0.5)
put(sfx, fall(), F(242), 0.55); put(sfx, pop(), F(264), 0.5)
for k in range(5): put(sfx, step(), F(280) + k * 0.2, 0.4)
put(sfx, whoosh(0.3, 600, 2400), F(306), 0.5); put(sfx, sparkle(), F(310), 0.5)
put(sfx, whoosh(0.35, 400, 2000), F(360), 0.55)
put(sfx, thunk(110, 0.3), F(395), 0.85); put(sfx, knock(500), F(395), 0.5)
put(sfx, thunk(90, 0.25), F(443), 0.6); put(sfx, rustle(0.5), F(450), 0.4)
for a in (495, 502): put(sfx, tick(), F(a), 0.9); put(sfx, knock(1400), F(a), 0.25)
put(sfx, bong(196, 1.6), F(509), 0.9); put(sfx, bong(392, 1.0), F(509), 0.3)
put(sfx, whoosh(0.4, 400, 2200), F(521), 0.5)
for a in [536, 541, 546, 551, 556, 566, 570, 574, 578, 582]: put(sfx, cannon(), F(a), 0.9)
for a in [592, 597, 602, 608, 614, 620]: put(sfx, boom(), F(a), 0.9); put(sfx, crash(0.6), F(a), 0.4)
put(sfx, rumble(1.8), F(598), 0.8); put(sfx, crash(1.6), F(612), 0.7)
put(sfx, whoosh(0.6, 300, 1500), F(628), 0.5)
put(sfx, bpv(noise(0.6), 900, 0.8) * env(int(0.6 * SR), 0.01, 0.25), F(648), 0.7); put(sfx, gurgle(1.3), F(652), 0.6)
put(sfx, pop(), F(690), 0.4); put(sfx, ding(1760), F(691), 0.45)
put(sfx, knock(1800), F(738), 0.8); put(sfx, sparkle(), F(740), 0.4)
put(sfx, bpv(noise(1.2), 300, 0.7) * 0.6, F(762), 0.3)
put(sfx, ripp(0.9), F(806), 0.5); put(sfx, rustle(1.0), F(806), 0.5)
put(sfx, thunk(55, 0.5), F(836), 0.9); put(sfx, ting(2600, 0.3), F(837), 0.3)

def save(name, x):
    x = x[: int(DUR * SR)]
    pk = np.max(np.abs(x)) or 1
    x = x / pk * 0.9
    with wave.open(name, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x * 32767).astype(np.int16).tobytes())
save('music.wav', music); save('sfx.wav', sfx)
print('stems written', DUR)
