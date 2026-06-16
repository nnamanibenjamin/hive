# GoFiixit — 30s Vertical Advert

A premium social advert (1080×1920, 30s, H.264 + AAC) for **GoFiixit**, a home
services platform. Produced entirely **free / offline** with OpenMontage:
Remotion for visuals, **Piper TTS** for the voiceover, a procedural FFmpeg music
bed, and FFmpeg for the final mux. **No API keys used.**

## Build

```bash
cd openmontage
. .venv/bin/activate
export REMOTION_IGNORE_CERT_ERRORS=1   # only in proxied-TLS sandboxes
bash ads/gofiixit/build.sh
# -> projects/gofiixit/renders/GoFiixit_Ad_30s.mp4
```

## What's where

| Piece | Path |
|-------|------|
| Composition (React/Remotion) | `remotion-composer/src/GoFiixitAd.tsx` |
| Registered as composition id | `GoFiixitAd` (in `src/Root.tsx`) |
| Brand assets (logo + screenshots) | `remotion-composer/public/gofiixit/` |
| Reproducible build script | `ads/gofiixit/build.sh` |
| Final render (git-ignored, regenerable) | `projects/gofiixit/renders/GoFiixit_Ad_30s.mp4` |

## Creative

- **Palette:** navy `#0F4C81` + amber `#F5B301` on soft dark gradients.
- **Voice:** Piper `en_US-ryan-high`, length-scale 1.12 (calm/confident).
- **Scene flow:**
  - **0–5s Hook** — "Leaking pipes / Broken AC / Electrical faults" →
    *"Home problems shouldn't slow your life."*
  - **5–22s App demo** — five real screenshots in a phone mockup with Ken-Burns
    pans and kicker captions: One app · Verified professionals · Fast booking ·
    Real-time tracking · Transparent pricing.
  - **22–30s Close** — logo reveal, *"Trusted Home Services, On Demand."*,
    amber CTA *"Download GoFiixit Today."*

## Tuning

- **Edit copy / scene text:** `GoFiixitAd.tsx` (`SceneHook`, `SceneApp.screens`, `SceneClose`).
- **Edit narration:** the `LINES`/`DELAYS_MS` arrays in `build.sh`, then re-run.
- **Swap a screenshot:** drop a new file in `public/gofiixit/` and point the
  matching `screens[]` entry at it.
- **Different voice:** change the model URL/path in `build.sh` (any Piper voice).
- **Use a licensed music track instead of the procedural bed:** replace
  `work/music/bed.wav` before step 5, or edit the mux in `build.sh`.

> Note: the music bed is a tasteful procedural ambient pad (sine-based chord
> progression), chosen so the whole pipeline stays key-free. Swap in a licensed
> corporate track anytime for extra polish.
