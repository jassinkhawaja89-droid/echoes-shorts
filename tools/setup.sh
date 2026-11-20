#!/bin/bash
# setup.sh <workdir> : prepares a fresh project from this repo (engine + tools + node deps + TTS)
set -e
REPO="$(cd "$(dirname "$0")/.." && pwd)"
W="$1"; mkdir -p "$W"/{web,frames,stills,out,work}
cp "$REPO"/engine/web/* "$W/web/"
cp "$REPO"/tools/{render.mjs,sheet.py,mix.py,finish.sh,audio.py,tts.py} "$W/"
cd "$W"
[ -d node_modules/playwright ] || (npm init -y >/dev/null && PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm i playwright >/dev/null 2>&1)
python3 -c "import kokoro_onnx, soundfile" 2>/dev/null || pip install -q --break-system-packages kokoro-onnx soundfile numpy pillow
CHROME=$(ls -d /opt/pw-browsers/chromium-*/chrome-linux*/chrome 2>/dev/null | head -1)
[ -n "$CHROME" ] && sed -i "s#executablePath: '[^']*'#executablePath: '$CHROME'#" render.mjs
(cd web && setsid nohup python3 -m http.server 8790 >/dev/null 2>&1 &)
echo "ready: $W  (chrome: $CHROME)"
