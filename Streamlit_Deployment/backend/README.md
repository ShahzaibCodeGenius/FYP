# PulmoScan — Backend (FastAPI + your .keras model)

This serves your `model.keras` file (MobileNet, 3-class: `aca` / `normal` / `scc`)
behind a REST API that the React frontend calls.

## Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Run

```bash
python3 main.py
```

or with auto-reload during development:

```bash
uvicorn main:app --reload --port 8000
```

The API will be live at `http://localhost:8000`.
Check it's healthy: open `http://localhost:8000/api/health` in your browser —
you should see `{"status":"ok","model_loaded":true}`.

## Endpoints

- `GET /api/health` — health check
- `POST /api/predict` — send an image as multipart form-data under the field
  name `file`. Returns the predicted class, confidence, and a probability
  breakdown for all three classes.

Example with curl:

```bash
curl -X POST http://localhost:8000/api/predict \
  -F "file=@/path/to/slide.png"
```

## Notes

- `model.keras` is your uploaded model, copied in as-is — nothing about its
  weights or architecture was changed.
- Class order (`aca`, `normal`, `scc`) matches the alphabetical
  `class_indices` your training notebook printed
  (`{'aca': 0, 'normal': 1, 'scc': 2}`). If you retrain with a different
  folder structure, check `CLASS_ORDER` in `main.py` still matches.
- Preprocessing (`resize to 224x224`, `rescale 1/255`) mirrors your training
  notebook's `ImageDataGenerator` exactly.
- CORS is wide open (`allow_origins=["*"]`) for easy local development.
  Restrict this to your real frontend domain before deploying publicly.
