#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# GoFiixit — "On Demand" BRAND FILM build (logo-only, 30s, 100% free/offline)
#
# Composition: remotion-composer/src/GoFiixitBrandAd.tsx  (id: GoFiixitBrandAd)
# Voice:       Piper en_GB-cori-high (premium British female)
# Audio fix:   each line is normalized individually (NOT across the silent
#              gaps), so there is no pumped-up hiss / "shhh".
#
# Run from the openmontage/ root:  bash ads/gofiixit/build_brandfilm.sh
# In proxied-TLS sandboxes first:  export REMOTION_IGNORE_CERT_ERRORS=1
# ---------------------------------------------------------------------------
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

MODEL="voices/en_GB-cori-high.onnx"
WORK="work"; OUT="projects/gofiixit/renders/GoFiixit_BrandFilm_30s.mp4"
mkdir -p voices "$WORK/vo2" "$WORK/music" "$(dirname "$OUT")"

# 1) Voice model -------------------------------------------------------------
if [[ ! -f "$MODEL" ]]; then
  B="https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_GB/cori/high"
  curl -sSL -o "$MODEL" "$B/en_GB-cori-high.onnx"
  curl -sSL -o "$MODEL.json" "$B/en_GB-cori-high.onnx.json"
fi

# 2) Narration (scene-aligned start times, in ms) ----------------------------
LINES=(
  "When something in your home breaks," "we make it right."
  "Verified, background checked professionals."
  "Book in minutes. Track in real time."
  "Upfront pricing, and secure payments."
  "Plumbing, electrical, air conditioning, and more."
  "Go Fix It." "Trusted home services, on demand." "Download today."
)
DELAYS=(600 2900 6300 9900 13300 16700 21400 22700 26600)
for i in "${!LINES[@]}"; do
  printf '%s' "${LINES[$i]}" | piper -m "$MODEL" -f "$WORK/vo2/r$i.wav" \
    --length-scale 1.05 --sentence-silence 0.15 >/dev/null 2>&1
done

# Per-line: highpass + gentle denoise + INDIVIDUAL loudnorm, then place at its
# timestamp. Gaps are pure adelay silence -> no boosted hiss.
INPUTS=(); FILTER=""; MIX=""
for i in "${!LINES[@]}"; do
  INPUTS+=(-i "$WORK/vo2/r$i.wav")
  FILTER+="[$i]highpass=f=80,afftdn=nr=12,loudnorm=I=-16:TP=-1.5:LRA=11,aformat=channel_layouts=stereo:sample_rates=48000,adelay=${DELAYS[$i]}|${DELAYS[$i]}[a$i];"
  MIX+="[a$i]"
done
ffmpeg -y -loglevel error "${INPUTS[@]}" -filter_complex \
  "${FILTER}${MIX}amix=inputs=${#LINES[@]}:normalize=0,apad,atrim=0:30.06[vo]" \
  -map "[vo]" "$WORK/voiceover2.wav"

# 3) Warm, quiet procedural music bed ---------------------------------------
gen_chord() { local out="$1"; shift; local ins=() maps=() idx=0
  for f in "$@"; do ins+=(-f lavfi -i "sine=frequency=$f:duration=10"); maps+=("[$idx]"); idx=$((idx+1)); done
  ffmpeg -y -loglevel error "${ins[@]}" -filter_complex \
    "${maps[*]}amix=inputs=${#maps[@]}:normalize=1,aformat=channel_layouts=stereo:sample_rates=48000[c]" -map "[c]" "$out"; }
gen_chord "$WORK/music/c1.wav" 261.63 329.63 392.00 587.33
gen_chord "$WORK/music/c2.wav" 220.00 261.63 329.63 392.00
gen_chord "$WORK/music/c3.wav" 174.61 220.00 261.63 329.63
gen_chord "$WORK/music/c4.wav" 196.00 246.94 293.66 392.00
ffmpeg -y -loglevel error -i "$WORK/music/c1.wav" -i "$WORK/music/c2.wav" -i "$WORK/music/c3.wav" -i "$WORK/music/c4.wav" \
  -filter_complex "[0][1]acrossfade=d=2:c1=tri:c2=tri[a];[a][2]acrossfade=d=2:c1=tri:c2=tri[b];[b][3]acrossfade=d=2:c1=tri:c2=tri[p];\
   [p]lowpass=f=1700,tremolo=f=0.1:d=0.25,aecho=0.8:0.6:50:0.2,volume=0.42,afade=t=in:st=0:d=3,apad,atrim=0:30,afade=t=out:st=27:d=3[m]" \
  -map "[m]" "$WORK/music/bed2.wav"

# 4) Render (silent) ---------------------------------------------------------
CERT=""; [[ "${REMOTION_IGNORE_CERT_ERRORS:-}" == "1" ]] && CERT="--ignore-certificate-errors --disable-web-security"
( cd remotion-composer && npx remotion render src/index.tsx GoFiixitBrandAd \
    "../$WORK/brand_silent.mp4" --codec h264 --crf 18 $CERT )

# 5) Mux: duck music under voice, pad audio to video length -----------------
ffmpeg -y -loglevel error -i "$WORK/brand_silent.mp4" -i "$WORK/voiceover2.wav" -i "$WORK/music/bed2.wav" \
  -filter_complex \
  "[2:a]volume=0.55[bed];[1:a]asplit=2[vo1][vokey];\
   [bed][vokey]sidechaincompress=threshold=0.025:ratio=10:attack=15:release=350[bd];\
   [vo1][bd]amix=inputs=2:normalize=0:duration=first,alimiter=limit=0.95:level=false,aresample=48000[mix]" \
  -map 0:v -map "[mix]" -c:v copy -c:a aac -b:a 192k "$OUT"

echo "Done -> $OUT"
