# OpenMontage — Sandbox / Web Session Setup

OpenMontage is vendored here (from https://github.com/calesthio/OpenMontage,
AGPLv3) so it can be driven by the coding agent to produce videos in this repo.

The committed tree is source only. The Python venv, Remotion `node_modules`, the
headless-Chromium download, and rendered media under `projects/` are **not**
committed (they are regenerable and large). After a fresh container start, run
the steps below to make rendering work again.

## One-time setup

```bash
cd openmontage

# 1. System dep (Remotion + post-production need it)
#    Already present on most machines; in a clean Ubuntu container:
#    sudo apt-get update && sudo apt-get install -y ffmpeg

# 2. Python deps (uv or pip)
uv venv .venv && . .venv/bin/activate && uv pip install -r requirements.txt
#   or: python -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt

# 3. Remotion composer deps (also downloads a headless Chromium on first render)
cd remotion-composer && npm install && cd ..

# 4. Env file
cp -n .env.example .env   # add API keys only if you want paid providers
```

## Rendering inside a proxied-TLS sandbox (e.g. Claude Code on the web)

Such environments terminate TLS with their own CA. Headless Chromium does not
trust it, so remote assets (Google Fonts) fail with
`ERR_CERT_AUTHORITY_INVALID` and the render aborts with a `NetworkError`.

To let Chromium accept the proxy certificate, export this before rendering:

```bash
export REMOTION_IGNORE_CERT_ERRORS=1
```

When set, the Remotion render commands add `--ignore-certificate-errors
--disable-web-security`. It is **off by default** so behaviour stays secure on
normal networks. Only enable it on a network you trust.

Wired into: `render_demo.py`, `tools/video/video_compose.py`,
`tools/video/remotion_caption_burn.py`.

## Smoke test (zero API keys)

```bash
. .venv/bin/activate
REMOTION_IGNORE_CERT_ERRORS=1 python render_demo.py
# -> projects/demos/renders/*.mp4  (1920x1080, h264+aac)
```
