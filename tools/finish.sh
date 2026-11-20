#!/bin/bash
# finish.sh "Title" : loudness gain + limiter, encode, QA
set -e
T="${1:-short}"; S=$(echo "$T" | tr ' ' '_' | tr -cd 'A-Za-z0-9_')
mkdir -p out
I=$(ffmpeg -hide_banner -i mix.wav -af ebur128 -f null - 2>&1 | grep -A2 "Integrated loudness" | grep "I:" | awk '{print $2}')
G=$(python3 -c "print(round(-14 - ($I), 2))")
echo "mix integrated $I LUFS -> gain $G dB"
ffmpeg -y -v error -i mix.wav -af "volume=${G}dB,alimiter=limit=0.7:attack=5:release=50:level=disabled" -ar 48000 out/final_audio.wav
ffmpeg -y -v error -framerate 30 -i frames/f%04d.jpg -i out/final_audio.wav -map 0:v:0 -map 1:a:0 -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p \
  -c:a aac -b:a 192k -shortest -movflags +faststart -metadata title="$T" "out/$S.mp4"
echo "== QA =="
ffprobe -v error -show_entries format=duration:stream=width,height,r_frame_rate,nb_frames -of compact "out/$S.mp4"
ffmpeg -hide_banner -i "out/$S.mp4" -vf "freezedetect=n=0.0015:d=0.4,blackdetect=d=0.05:pix_th=0.06" -an -f null - 2>&1 | grep -E "freeze_|black_" || echo "no freezes or black frames"
ffmpeg -hide_banner -i "out/$S.mp4" -af ebur128=peak=true -vn -f null - 2>&1 | grep -E "^\s+(I|Peak):" | tail -2
ffmpeg -y -v error -i "out/$S.mp4" -vf "fps=1,scale=216:384,tile=7x6" -frames:v 1 out/qa_sheet.jpg
echo "out/$S.mp4"
