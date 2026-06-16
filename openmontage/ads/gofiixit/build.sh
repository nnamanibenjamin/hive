#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# GoFiixit — 30s vertical advert build (100% free / offline)
#
# Regenerates the voiceover (Piper TTS), the procedural music bed (FFmpeg),
# renders the Remotion composition, and muxes everything into the final MP4.
#
# Prereqs (see ../../SANDBOX_SETUP.md):
#   - openmontage Python venv active, piper-tts installed
#   - remotion-composer/node_modules installed (npm install)
#   - ffmpeg on PATH
#   - In proxied-TLS sandboxes: export REMOTION_IGNORE_CERT_ERRORS=1
#
# Run from the openmontage/ root:  bash ads/gofiixit/build.sh
# ---------------------------------------------------------------------------
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

VOICE_DIR="voices"
MODEL="$VOICE_DIR/en_US-ryan-high.onnx"
WORK="work"
OUT="projects/gofiixit/renders/GoFiixit_Ad_30s.mp4"
mkdir -p "$VOICE_DIR" "$WORK/vo" "$WORK/music" "$(dirname "$OUT")"

# 1) Voice model (calm, confident male, neutral US accent) ------------------
if [[ ! -f "$MODEL" ]]; then
  BASE="https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/ryan/high"
  curl -sSL -o "$MODEL" "$BASE/en_US-ryan-high.onnx"
  curl -sSL -o "$MODEL.json" "$BASE/en_US-ryan-high.onnx.json"
fi

# 2) Narration lines, synced to scene start times ---------------------------
LINES=(
  "Home problems shouldn't slow you down."
  "Meet Go Fix It. Every home service, in one app."
  "Verified, background checked professionals."
  "Book in minutes, right from your phone."
  "Track every job, in real time."
  "Transparent pricing, and secure payments."
  "Go Fix It. Trusted home services, on demand. Download today."
)
DELAYS_MS=(500 5200 8600 11900 15300 18700 22600)  # scene-aligned start times
for i in "${!LINES[@]}"; do
  printf '%s' "${LINES[$i]}" | piper -m "$MODEL" -f "$WORK/vo/l$i.wav" \
    --length-scale 1.12 --sentence-silence 0.25 >/dev/null 2>&1
done

# Place each line at its timestamp, mix, normalize to -16 LUFS.
FILTER=""; INPUTS=(); MIX=""
for i in "${!LINES[@]}"; do
  INPUTS+=(-i "$WORK/vo/l$i.wav")
  FILTER+="[$i]aformat=channel_layouts=stereo:sample_rates=48000,adelay=${DELAYS_MS[$i]}|${DELAYS_MS[$i]}[a$i];"
  MIX+="[a$i]"
done
ffmpeg -y -loglevel error "${INPUTS[@]}" -filter_complex \
  "${FILTER}${MIX}amix=inputs=${#LINES[@]}:normalize=0,apad,atrim=0:30,loudnorm=I=-16:TP=-1.5:LRA=11[vo]" \
  -map "[vo]" "$WORK/voiceover.wav"

# 3) Procedural cinematic music bed (Cadd9 - Am7 - Fmaj7 - G) ---------------
gen_chord() { local out="$1"; shift; local ins=() maps=() idx=0
  for f in "$@"; do ins+=(-f lavfi -i "sine=frequency=$f:duration=10"); maps+=("[$idx]"); idx=$((idx+1)); done
  ffmpeg -y -loglevel error "${ins[@]}" -filter_complex \
    "${maps[*]}amix=inputs=${#maps[@]}:normalize=1,aformat=channel_layouts=stereo:sample_rates=48000[c]" \
    -map "[c]" "$out"; }
gen_chord "$WORK/music/c1.wav" 261.63 329.63 392.00 587.33
gen_chord "$WORK/music/c2.wav" 220.00 261.63 329.63 392.00
gen_chord "$WORK/music/c3.wav" 174.61 220.00 261.63 329.63
gen_chord "$WORK/music/c4.wav" 196.00 246.94 293.66 392.00
ffmpeg -y -loglevel error -i "$WORK/music/c1.wav" -i "$WORK/music/c2.wav" \
  -i "$WORK/music/c3.wav" -i "$WORK/music/c4.wav" -filter_complex \
  "[0][1]acrossfade=d=2:c1=tri:c2=tri[a];[a][2]acrossfade=d=2:c1=tri:c2=tri[b];\
   [b][3]acrossfade=d=2:c1=tri:c2=tri[p];\
   [p]lowpass=f=2200,tremolo=f=0.12:d=0.35,aecho=0.8:0.7:60:0.3,volume=0.5,\
   afade=t=in:st=0:d=2.5,apad,atrim=0:30,afade=t=out:st=27:d=3[m]" \
  -map "[m]" "$WORK/music/bed.wav"

# 4) Render the Remotion composition (silent) -------------------------------
CERT=""
[[ "${REMOTION_IGNORE_CERT_ERRORS:-}" == "1" ]] && CERT="--ignore-certificate-errors --disable-web-security"
( cd remotion-composer && npx remotion render src/index.tsx GoFiixitAd \
    "../$WORK/gofiixit_silent.mp4" --codec h264 --crf 18 $CERT )

# 5) Mux: duck music under voiceover, combine with video --------------------
ffmpeg -y -loglevel error -i "$WORK/gofiixit_silent.mp4" -i "$WORK/voiceover.wav" -i "$WORK/music/bed.wav" \
  -filter_complex \
  "[2:a]volume=0.8[bed];[1:a]asplit=2[vo1][vokey];\
   [bed][vokey]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=400[bd];\
   [vo1][bd]amix=inputs=2:normalize=0,alimiter=limit=0.95:level=false,aresample=48000[mix]" \
  -map 0:v -map "[mix]" -c:v copy -c:a aac -b:a 192k -shortest "$OUT"

echo "Done -> $OUT"
