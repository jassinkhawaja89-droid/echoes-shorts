# Synthesized stems for "The Emu War": music.wav (march + drone + button) and sfx.wav. Levels are set later by mix.py.
import numpy as np, wave, sys
SR = 48000
DUR = float(sys.argv[1]) if len(sys.argv) > 1 else 41.17
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

# ---------------- music ----------------
music = np.zeros(N)
BPM = 116; beat = 60 / BPM
STOP = F(1157)  # music stops at the twist line
kick = lambda: tone(1, 0.25, 'sin') * 0 + np.sin(2 * np.pi * np.cumsum(np.linspace(110, 45, int(0.25 * SR))) / SR) * env(int(0.25 * SR), 0.002, 0.09)
snare = lambda: hpv(noise(0.18), 1500) * env(int(0.18 * SR), 0.001, 0.05) * 0.5 + tone(190, 0.18, 'tri') * env(int(0.18 * SR), 0.001, 0.03) * 0.4
# Bb major march: I IV I V
prog = [(58, [58, 62, 65]), (63, [63, 67, 70]), (58, [58, 62, 65]), (65, [65, 69, 72])]
melody = [70, 72, 74, 70, 75, 74, 72, 70, 70, 72, 74, 77, 72, 70, 69, 65]  # one note per beat over 4 bars
t = 0.0; bar = 0
golden = F(770)
while t < STOP:
    root, chord = prog[bar % 4]
    for b in range(4):
        tb = t + b * beat
        if tb >= STOP: break
        put(music, kick(), tb, 0.9 if b % 2 == 0 else 0.0)
        if b % 2 == 1: put(music, snare(), tb, 0.7)
        if b == 3: put(music, snare(), tb + beat / 2, 0.35)
        # tuba oom-pah
        bn = root - 24 if b % 2 == 0 else root - 17
        tb_ = tone(mtof(bn), beat * 0.55, 'tri') * env(int(beat * 0.55 * SR), 0.01, 0.18)
        put(music, lpv(tb_, 600), tb, 0.55)
        # brass chord stabs on the off-beats
        st = sum(tone(mtof(m - 12), beat * 0.35, 'saw') for m in chord) / 3 * env(int(beat * 0.35 * SR), 0.01, 0.08)
        put(music, lpv(st, 1800), tb + beat / 2, 0.22)
        # piccolo/clarinet melody (only in the day part, softer later)
        mn = melody[(bar % 4) * 4 + b]
        ml = tone(mtof(mn), beat * 0.8, 'tri', vib=0.004) * env(int(beat * 0.8 * SR), 0.02, 0.35, 0.3, 0.05)
        put(music, ml, tb, 0.18 if tb < golden else 0.1)
    t += 4 * beat; bar += 1
music[int(STOP * SR):int((STOP + 0.25) * SR)] *= np.linspace(1, 0, int(0.25 * SR))[: len(music[int(STOP * SR):int((STOP + 0.25) * SR)])]
music[int((STOP + 0.25) * SR):] = 0
# low drone after the stop
dr = (tone(mtof(34), DUR - STOP, 'saw') * 0.5 + tone(mtof(41), DUR - STOP, 'saw') * 0.3)
dr = lpv(dr, 220) * env(len(dr), 0.4, 99, 1, 0.3)
put(music, dr, STOP, 0.5)
# button on "wheat": bright brass chord + cymbal
bt = sum(tone(mtof(m), 1.3, 'saw') for m in [58, 62, 65, 70]) / 4 * env(int(1.3 * SR), 0.005, 0.5)
put(music, lpv(bt, 2600), F(1213), 0.9)
put(music, hpv(noise(1.2), 5000) * env(int(1.2 * SR), 0.001, 0.45), F(1213), 0.25)
put(music, kick(), F(1213), 1.0)

# ---------------- sfx ----------------
sfx = np.zeros(N)
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

# wind bed over the whole thing (lower at camp, warmer at dusk)
wind = lpv(noise(DUR), 500) * (0.6 + 0.4 * np.sin(np.linspace(0, 9, int(DUR * SR))))
put(sfx, wind, 0, 0.08)
# hook
put(sfx, rustle(0.6), F(140), 0.8)
put(sfx, knock(1100), F(199), 0.9)
dro = tone(1, 0.4, 'sin'); n = int(0.4 * SR); dro = np.sin(2 * np.pi * np.cumsum(np.linspace(520, 180, n)) / SR) * env(n, 0.005, 0.25) * 0.6
put(sfx, dro, F(200)); put(sfx, thunk(120, 0.25), F(204), 0.6)
put(sfx, whoosh(0.4), F(206), 0.6)
# herd
for k in range(5): put(sfx, boom(), F(230 + k * 16), 0.35)
for k in range(30): put(sfx, step(), F(216) + k * 0.14 + rng.random() * 0.05, 0.25)
# army truck
put(sfx, engine(F(345 - 300)) * np.linspace(0.6, 1, int(F(45) * SR)), F(300), 0.9)
sq = tone(2200, 0.25, 'saw', vib=0.03) * env(int(0.25 * SR), 0.02, 0.1); put(sfx, bpv(sq, 2200, 4), F(334), 0.25)
put(sfx, thunk(60, 0.4), F(340), 0.8)
for fp in (343, 349, 355): put(sfx, pop(), F(fp), 0.5)
for ft in (401, 408): put(sfx, ting(2600 if ft == 401 else 3100), F(ft), 0.6)
# easy, right?
put(sfx, knock(2400), F(477), 0.3)
# split
put(sfx, whoosh(0.7, 300, 3000), F(512), 0.9)
for k in range(110): put(sfx, step(), F(519) + k * 0.035 + rng.random() * 0.02, 0.25 * (1 - k / 140))
for k in range(3): put(sfx, burst(5), F(533 + k * 26), 0.5)
# mount + outrun
put(sfx, whoosh(0.35, 800, 300), F(643), 0.6); put(sfx, thunk(90, 0.35), F(654), 0.9); put(sfx, knock(700), F(655), 0.6)
put(sfx, engine(F(770 - 680), 1.0) * np.linspace(0.5, 1.2, int(F(90) * SR)), F(680), 0.8)
for k in range(24): put(sfx, thunk(140, 0.12), F(695) + k * 0.31, 0.25)
for k in range(70): put(sfx, step(), F(713) + k * 0.026, 0.28)
put(sfx, whoosh(0.5, 500, 2200), F(738), 0.7)
# camp
put(sfx, whoosh(0.4), F(764), 0.5)
for k in range(140): put(sfx, ting(3000 + rng.random() * 2500, 0.18), F(800) + rng.random() * 2.1, 0.12)
ch = bpv(noise(0.4), 4500, 2) * env(int(0.4 * SR), 0.01, 0.3, 0.5); put(sfx, ch, F(893), 0.4)
# commander
put(sfx, whoosh(0.25, 900, 400), F(978), 0.35)
# tank
put(sfx, boom() * 1.4, F(1024), 1.0); put(sfx, thunk(45, 0.6), F(1024), 0.9)
ric = np.sin(2 * np.pi * np.cumsum(np.linspace(3200, 1300, int(0.5 * SR))) / SR) * env(int(0.5 * SR), 0.001, 0.2) * 0.5
put(sfx, ting(3400, 0.3), F(1038), 0.5); put(sfx, ric, F(1039), 0.5)
# home: engine receding + sad trombone
eg = engine(F(1157 - 1060), 1.1); put(sfx, eg * np.linspace(1, 0.1, len(eg)), F(1060), 0.7)
sadtrom([58, 57, 56, 55], F(1100))
# the emus: rustle pop, peck crunch
put(sfx, rustle(0.4), F(1158), 0.8); put(sfx, pop(), F(1160), 0.4)
put(sfx, knock(1600), F(1212), 0.9); put(sfx, rustle(0.3), F(1213), 0.7)

def save(name, x):
    x = x[: int(DUR * SR)]
    pk = np.max(np.abs(x)) or 1
    x = x / pk * 0.9
    with wave.open(name, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x * 32767).astype(np.int16).tobytes())
save('music.wav', music); save('sfx.wav', sfx)
print('stems written', DUR)
