# tts.py script.txt  -> voice.wav + work/phrases.json
# Narration with the Kokoro "bm_lewis" voice (British male), one line of script.txt per phrase.
# Each line is synthesized separately, so the timing of every phrase is exact (no alignment needed).
import sys, os, json, urllib.request
import numpy as np, soundfile as sf

MODEL_DIR = os.path.expanduser('~/tts')
BASE = 'https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/'
VOICE, SPEED, LANG = 'bm_lewis', 0.95, 'en-gb'
LEAD, GAP, TAIL = 0.6, 0.42, 0.7

os.makedirs(MODEL_DIR, exist_ok=True)
for f in ('kokoro-v1.0.int8.onnx', 'voices-v1.0.bin'):
    p = os.path.join(MODEL_DIR, f)
    if not os.path.exists(p):
        print('downloading', f); urllib.request.urlretrieve(BASE + f, p)

from kokoro_onnx import Kokoro
k = Kokoro(os.path.join(MODEL_DIR, 'kokoro-v1.0.int8.onnx'), os.path.join(MODEL_DIR, 'voices-v1.0.bin'))
lines = [l.strip() for l in open(sys.argv[1], encoding='utf-8') if l.strip()]
out, t, phrases, sr = [], 0.0, [], 24000
out.append(np.zeros(int(LEAD * sr))); t = LEAD
for i, line in enumerate(lines):
    a, sr = k.create(line, voice=VOICE, speed=SPEED, lang=LANG)
    # trim leading/trailing near-silence so the phrase times are tight
    env = np.abs(a) > 0.01
    if env.any():
        s0, s1 = np.argmax(env), len(a) - np.argmax(env[::-1])
        a = a[max(0, s0 - int(0.02 * sr)): min(len(a), s1 + int(0.05 * sr))]
    phrases.append({'i': i, 'text': line, 'start': round(t, 3), 'end': round(t + len(a) / sr, 3)})
    out.append(a); t += len(a) / sr
    gap = GAP * (1.4 if line.endswith(('?', '!')) or i in (0,) else 1.0)
    if i < len(lines) - 1: out.append(np.zeros(int(gap * sr))); t += gap
out.append(np.zeros(int(TAIL * sr))); t += TAIL
audio = np.concatenate(out).astype(np.float32)
audio = audio / max(1e-6, np.abs(audio).max()) * 0.89
sf.write('voice.wav', audio, sr)
os.makedirs('work', exist_ok=True)
json.dump({'duration': round(len(audio) / sr, 3), 'frames': int(round(len(audio) / sr * 30)), 'phrases': phrases}, open('work/phrases.json', 'w'), indent=1)
for p in phrases: print(f"{p['start']:6.2f}-{p['end']:6.2f}  f{int(p['start']*30):4d}-{int(p['end']*30):4d}  {p['text']}")
print('duration', round(len(audio) / sr, 2), 's, frames', int(round(len(audio) / sr * 30)))
