# PulmoScan — Lung Cancer Histopathology Classifier

A full-stack web app around your MobileNet `.keras` model. Upload a lung
tissue histopathology image and it classifies it as:

- **Adenocarcinoma (ACA)**
- **Normal tissue**
- **Squamous Cell Carcinoma (SCC)**

```
lung-cancer-detector/
├── backend/          FastAPI server that runs your .keras model
│   ├── main.py
│   ├── model.keras   (your uploaded model)
│   ├── requirements.txt
│   └── README.md
└── frontend/         React + Vite + Framer Motion website
    ├── src/
    ├── package.json
    └── .env.example
```

## Quick start

**1. Start the backend** (in one terminal):

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python3 main.py
```

Leave this running. It serves the model at `http://localhost:8000`.

**2. Start the frontend** (in a second terminal):

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open the URL it prints (usually `http://localhost:5173`). Upload an image
and click **Run detection**.

## How it works

- The frontend sends the uploaded image to `POST /api/predict` on the
  backend as multipart form data.
- The backend resizes it to 224×224, rescales pixels to 0–1 (matching your
  training notebook exactly), runs it through your model, and returns the
  softmax probabilities for all three classes plus the top prediction.
- The frontend shows an animated scanning effect while waiting, then
  displays the result with a confidence breakdown.

## Deploying

- **Backend**: any host that can run Python + TensorFlow (Render, Railway,
  Fly.io, a VPS, or a GPU box if you want faster inference). Set
  `allow_origins` in `main.py`'s CORS config to your real frontend domain
  instead of `"*"`.
- **Frontend**: `npm run build` produces a static `dist/` folder you can
  deploy to Vercel, Netlify, or any static host. Set `VITE_API_URL` in your
  hosting provider's environment variables to your deployed backend URL.

## Important

This is a research/educational demo, not a certified medical device. The
footer disclaimer in the app says this explicitly — please don't remove it
if you show this to others. Model accuracy (98.6% on your test set) reflects
performance on your specific dataset and does not guarantee real-world
clinical performance.
