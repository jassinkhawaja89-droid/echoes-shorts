# tighten.py in.mp4 voice_audio out.mp4 [target_s] : shrink voice pauses, then mild pitch-safe speed-up to fit target
import sys, subprocess, re
src, voice, out = sys.argv[1:4]; target = float(sys.argv[4]) if len(sys.argv) > 4 else 29.5
G = 0.18; TAIL = 0.7
dur = float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',src]))
log = subprocess.run(['ffmpeg','-v','info','-i',voice,'-af','silencedetect=n=-38dB:d=0.16','-f','null','-'],capture_output=True,text=True).stderr
ss = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', log)]; ee = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', log)]
cuts = []
for s, e in zip(ss, ee + [dur]*(len(ss)-len(ee))):
    if e >= dur - 0.05:   # tail
        if e - s > TAIL: cuts.append((s + TAIL, dur))
    elif s < 0.05:        # lead
        if e > 0.25: cuts.append((0, e - 0.25))
    elif e - s > G: cuts.append((s + G/2, e - G/2))
keep, t = [], 0.0
for a, b in cuts:
    if a > t: keep.append((t, a))
    t = b
if t < dur: keep.append((t, dur))
new = sum(b - a for a, b in keep)
k = max(1.0, new / target)
expr = '+'.join(f'between(t,{a:.3f},{b:.3f})' for a, b in keep)
fc = (f"[0:v]select='{expr}',setpts=N/30/TB,setpts=PTS/{k:.4f},fps=30[v];"
      f"[0:a]aselect='{expr}',asetpts=N/SR/TB,atempo={k:.4f}[a]")
subprocess.run(['ffmpeg','-v','error','-y','-i',src,'-filter_complex',fc,'-map','[v]','-map','[a]','-c:v','libx264','-preset','slow','-crf','19',
                '-maxrate','18M','-bufsize','36M','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-movflags','+faststart',out],check=True)
print(f'{src}: {dur:.2f}s -> pauses {new:.2f}s -> speed x{k:.3f} -> {new/k:.2f}s')
