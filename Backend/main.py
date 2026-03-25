from __future__ import annotations

from pathlib import Path
import sys
from tempfile import NamedTemporaryFile

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

CURRENT_FILE = Path(__file__).resolve()
ROOT_DIR = CURRENT_FILE.parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from Backend.inference import BACKEND_DIR, ComplianceService

HOST = "127.0.0.1"
PORT = 8007
FAVICON_PATH = ROOT_DIR / "public" / "favicon.svg"

app = FastAPI(
    title="Warehouse Compliance Backend",
    version="1.0.0",
    description="Local FastAPI service for PPE/compliance analysis with final per-person SAFE/NO SAFE output.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/outputs", StaticFiles(directory=str(BACKEND_DIR / "outputs")), name="outputs")

service = ComplianceService()


class AnalyzePathRequest(BaseModel):
    path: str


def with_absolute_artifact_urls(report: dict, request: Request) -> dict:
    base_url = str(request.base_url).rstrip("/")
    report["artifacts"] = {
        key: f"{base_url}{value}" if isinstance(value, str) and value.startswith("/") else value
        for key, value in report["artifacts"].items()
    }
    return report


def playground_html() -> str:
    return """<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Warehouse Compliance Backend</title>
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  <link rel="shortcut icon" href="/favicon.ico" />
  <style>
    :root {
      color-scheme: dark;
      --bg: #091018;
      --panel: #111c27;
      --panel-2: #172635;
      --text: #edf5ff;
      --muted: #9bb2c8;
      --accent: #52c6ff;
      --accent-2: #ffb347;
      --border: rgba(255,255,255,0.1);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      font-family: "Avenir Next", "Segoe UI", sans-serif;
      color: var(--text);
      background:
        radial-gradient(circle at top left, rgba(82,198,255,0.18), transparent 34%),
        radial-gradient(circle at top right, rgba(255,179,71,0.14), transparent 28%),
        linear-gradient(180deg, #081018 0%, #0d1520 100%);
      padding: 32px 18px;
    }
    .shell {
      width: min(1100px, 100%);
      margin: 0 auto;
      display: grid;
      gap: 18px;
    }
    .card {
      background: linear-gradient(180deg, rgba(23,38,53,0.95), rgba(15,27,39,0.95));
      border: 1px solid var(--border);
      border-radius: 22px;
      padding: 22px;
      box-shadow: 0 24px 60px rgba(0,0,0,0.28);
      backdrop-filter: blur(10px);
    }
    h1 { margin: 0 0 8px; font-size: clamp(28px, 4vw, 44px); }
    p { margin: 0; color: var(--muted); line-height: 1.5; }
    .upload-row {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 18px;
      align-items: center;
    }
    input[type=file] {
      flex: 1 1 300px;
      background: rgba(255,255,255,0.04);
      color: var(--text);
      border: 1px dashed rgba(255,255,255,0.18);
      border-radius: 16px;
      padding: 14px;
    }
    button {
      border: 0;
      border-radius: 16px;
      padding: 14px 18px;
      background: linear-gradient(135deg, var(--accent), #2a7fff);
      color: #03131f;
      font-weight: 800;
      cursor: pointer;
      min-width: 180px;
    }
    button:disabled { opacity: 0.6; cursor: wait; }
    .meta {
      display: grid;
      gap: 8px;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      margin-top: 18px;
    }
    .pill {
      padding: 12px 14px;
      border-radius: 16px;
      border: 1px solid var(--border);
      background: rgba(255,255,255,0.03);
    }
    .grid {
      display: grid;
      gap: 18px;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    }
    .media-box img, .media-box video {
      width: 100%;
      border-radius: 16px;
      border: 1px solid var(--border);
      background: #05080c;
    }
    pre {
      margin: 0;
      overflow: auto;
      max-height: 420px;
      padding: 16px;
      border-radius: 16px;
      background: rgba(4,8,12,0.95);
      border: 1px solid var(--border);
      color: #d8ecff;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .status {
      margin-top: 14px;
      font-size: 14px;
      color: var(--accent-2);
    }
  </style>
</head>
<body>
  <main class="shell">
    <section class="card">
      <h1>Warehouse Compliance Backend</h1>
      <p>Upload an image or video and this local FastAPI service will run person/compliance analysis, generate annotated original output, and return a final SAFE/NO SAFE JSON summary per person.</p>
      <div class="upload-row">
        <input id="fileInput" type="file" accept="image/*,video/*" />
        <button id="uploadBtn">Analyze On Localhost:8007</button>
      </div>
      <div class="status" id="status">Ready on http://127.0.0.1:8007</div>
      <div class="meta">
        <div class="pill"><strong>POST</strong><br/>`/api/analyze?filename=your-file.jpg`</div>
        <div class="pill"><strong>Artifacts</strong><br/>Annotated original media and final JSON report</div>
        <div class="pill"><strong>Warning</strong><br/>PPE compliance only works fully when the YOLO weights include PPE classes</div>
      </div>
    </section>

    <section class="grid">
      <section class="card media-box">
        <h2>Annotated Output</h2>
        <div id="annotatedContainer"></div>
      </section>
    </section>

    <section class="card">
      <h2>Final Output JSON</h2>
      <pre id="jsonOutput">No analysis yet.</pre>
    </section>
  </main>
  <script>
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadBtn');
    const status = document.getElementById('status');
    const jsonOutput = document.getElementById('jsonOutput');
    const annotatedContainer = document.getElementById('annotatedContainer');

    function renderMedia(container, url, filename, label) {
      container.innerHTML = '';
      if (!url) {
        container.textContent = 'No artifact generated.';
        return;
      }
      const lower = filename.toLowerCase();
      if (lower.endsWith('.mp4') || lower.endsWith('.mov') || lower.endsWith('.avi') || lower.endsWith('.mkv') || lower.endsWith('.m4v')) {
        const video = document.createElement('video');
        video.controls = true;
        video.playsInline = true;
        video.preload = 'metadata';
        const source = document.createElement('source');
        source.src = url;
        source.type = 'video/mp4';
        video.appendChild(source);
        const fallback = document.createElement('a');
        fallback.href = url;
        fallback.textContent = 'Open video directly';
        fallback.style.color = '#9dd8ff';
        container.appendChild(video);
        container.appendChild(document.createElement('br'));
        container.appendChild(fallback);
      } else {
        const img = document.createElement('img');
        img.src = url;
        img.alt = label;
        container.appendChild(img);
      }
    }

    uploadBtn.addEventListener('click', async () => {
      const file = fileInput.files?.[0];
      if (!file) {
        status.textContent = 'Choose an image or video first.';
        return;
      }
      uploadBtn.disabled = true;
      status.textContent = `Uploading ${file.name} to localhost:8007...`;
      annotatedContainer.innerHTML = '';
      jsonOutput.textContent = 'Running analysis...';
      try {
        const response = await fetch(`/api/analyze?filename=${encodeURIComponent(file.name)}`, {
          method: 'POST',
          headers: {
            'Content-Type': file.type || 'application/octet-stream',
          },
          body: file,
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.detail || 'Analysis failed');
        }
        jsonOutput.textContent = JSON.stringify(payload, null, 2);
        renderMedia(annotatedContainer, payload.artifacts.annotated_media_url, payload.artifacts.annotated_media_url, 'Annotated output');
        status.textContent = `Done. Analysis ID: ${payload.analysis_id}`;
      } catch (error) {
        jsonOutput.textContent = String(error);
        status.textContent = `Error: ${error.message}`;
      } finally {
        uploadBtn.disabled = false;
      }
    });
  </script>
</body>
</html>"""


@app.get("/", response_class=HTMLResponse)
async def root() -> HTMLResponse:
    return HTMLResponse(playground_html())


@app.get("/favicon.svg")
async def favicon_svg() -> FileResponse:
    return FileResponse(FAVICON_PATH, media_type="image/svg+xml")


@app.get("/favicon.ico")
async def favicon_ico() -> FileResponse:
    return FileResponse(FAVICON_PATH, media_type="image/svg+xml")


@app.get("/api/health")
async def health() -> dict:
    return {
        "status": "ok",
        "host": HOST,
        "port": PORT,
        "model_info": service.get_model_info(),
    }


@app.get("/api/model-info")
async def model_info() -> dict:
    return service.get_model_info()


@app.post("/api/analyze")
async def analyze_upload(
    request: Request,
    filename: str = Query(..., description="Original upload filename, including the extension."),
) -> dict:
    body = await request.body()
    if not body:
        raise HTTPException(status_code=400, detail="Empty request body. Send the raw file bytes in the POST body.")

    suffix = Path(filename).suffix or ".bin"
    try:
        with NamedTemporaryFile(delete=False, suffix=suffix, dir=str(BACKEND_DIR / "tmp")) as temp_file:
            temp_file.write(body)
            temp_path = Path(temp_file.name)
        report = service.analyze_file(temp_path, filename)
        return with_absolute_artifact_urls(report, request)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except Exception as error:  # pragma: no cover - keeps the API usable during inference failures
        raise HTTPException(status_code=500, detail=f"Analysis failed: {error}") from error
    finally:
        if "temp_path" in locals() and temp_path.exists():
            temp_path.unlink(missing_ok=True)


@app.post("/api/analyze/path")
async def analyze_path(payload: AnalyzePathRequest, request: Request) -> dict:
    input_path = Path(payload.path).expanduser().resolve()
    if not input_path.exists() or not input_path.is_file():
        raise HTTPException(status_code=404, detail=f"File not found: {input_path}")

    try:
        report = service.analyze_file(input_path, input_path.name)
        return with_absolute_artifact_urls(report, request)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except Exception as error:  # pragma: no cover
        raise HTTPException(status_code=500, detail=f"Analysis failed: {error}") from error


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host=HOST, port=PORT, reload=False)
