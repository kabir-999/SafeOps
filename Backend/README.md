# Warehouse Compliance Backend

This backend runs locally on `127.0.0.1:8007` and accepts raw image/video uploads for PPE-compliance analysis plus depth-map generation.

## Start

```bash
python3 Backend/main.py
```

Or:

```bash
./Backend/run_local.sh
```

## Browser Upload UI

Open:

```text
http://127.0.0.1:8007
```

## API

Raw upload:

```bash
curl -X POST "http://127.0.0.1:8007/api/analyze?filename=sample.mp4" \
  -H "Content-Type: video/mp4" \
  --data-binary "@sample.mp4"
```

Analyze an existing local file by path:

```bash
curl -X POST "http://127.0.0.1:8007/api/analyze/path" \
  -H "Content-Type: application/json" \
  -d '{"path": "/absolute/path/to/sample.jpg"}'
```

Health:

```bash
curl "http://127.0.0.1:8007/api/health"
```

## Important Model Note

The current `yolov8n-seg.pt` in the repo is the standard COCO model. It detects `person`, but it does not include PPE labels like `helmet`, `vest`, or `gloves`.

That means:

- People counting works now.
- Depth-map generation works now.
- True missing-PPE classification becomes fully accurate only after replacing `yolov8n-seg.pt` with a PPE-trained YOLO weight file that contains those PPE classes.

The backend already auto-detects PPE class names when such a model is dropped into the repo.
