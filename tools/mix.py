# mix.py voice music.wav sfx.wav -> mix.wav
# Music at exactly 50 % of the voice's gated RMS (-6 dB), SFX at 50 % with peaks capped at 0.7x the voice peak.
import sys, subprocess, numpy as np, wave
SR = 48000
def load(p):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)
def gated_rms(x, blk=0.4):
    n = int(blk * SR); b = [x[i:i + n] for i in range(0, len(x) - n, n // 2)]
    r = np.array([np.sqrt(np.mean(v * v)) for v in b])
    g = r[r > max(1e-4, r.max() * 0.1)]
    return np.sqrt(np.mean(g * g))
db = lambda v: 20 * np.log10(v)
voice, music, sfx = load(sys.argv[1]), load(sys.argv[2]), load(sys.argv[3])
L = len(voice); music = np.pad(music, (0, max(0, L - len(music))))[:L]; sfx = np.pad(sfx, (0, max(0, L - len(sfx))))[:L]
rv = gated_rms(voice); pv = np.max(np.abs(voice))
music *= 0.5 * rv / gated_rms(music)
sfx *= 0.5 * rv / gated_rms(sfx)
pk = np.max(np.abs(sfx))
if pk > 0.7 * pv: sfx *= 0.7 * pv / pk
mix = voice + music + sfx
print(f'voice gated RMS {db(rv):.1f} dBFS | music {db(gated_rms(music)) - db(rv):+.1f} dB vs voice | sfx {db(gated_rms(sfx)) - db(rv):+.1f} dB vs voice (peak {np.max(np.abs(sfx)) / pv:.2f}x voice peak)')
with wave.open('mix.wav', 'wb') as w:
    w.setnchannels(1); w.setsampwidth(4); w.setframerate(SR)
    w.writeframes((np.clip(mix, -1, 1) * 2147483647).astype(np.int32).tobytes())
print('mix.wav', len(mix) / SR, 's')
