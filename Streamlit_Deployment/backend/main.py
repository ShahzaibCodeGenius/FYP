"""
Lung Cancer Detection API
Serves the MobileNet-based .keras model for histopathology image classification.

Classes (must match training order from ImageDataGenerator.flow_from_directory,
which sorts class subfolder names alphabetically):
    0 -> aca     (Adenocarcinoma)
    1 -> normal  (Normal / benign tissue)
    2 -> scc     (Squamous Cell Carcinoma)
"""

import io
import time
import numpy as np
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image
import tensorflow as tf

MODEL_PATH = "model.keras"
IMG_SIZE = (224, 224)

CLASS_INFO = {
    "aca": {
        "label": "Adenocarcinoma",
        "short": "ACA",
        "description": (
            "A non-small-cell lung cancer that begins in the mucus-producing "
            "glandular cells, most often found in the outer regions of the lung."
        ),
        "severity": "malignant",
    },
    "normal": {
        "label": "Normal Tissue",
        "short": "Normal",
        "description": (
            "No malignant patterns detected. Tissue architecture is consistent "
            "with healthy, non-cancerous lung tissue."
        ),
        "severity": "benign",
    },
    "scc": {
        "label": "Squamous Cell Carcinoma",
        "short": "SCC",
        "description": (
            "A non-small-cell lung cancer arising from the flat cells lining "
            "the airways, typically located closer to the central chest area."
        ),
        "severity": "malignant",
    },
}

# Order must match the training generator's alphabetically-sorted class_indices:
# {'aca': 0, 'normal': 1, 'scc': 2}
CLASS_ORDER = ["aca", "normal", "scc"]

app = FastAPI(title="Lung Cancer Detection API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten this to your frontend origin in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = None


@app.on_event("startup")
def load_model():
    global model
    model = tf.keras.models.load_model(MODEL_PATH)
    # Warm up the model with a dummy forward pass so the first real
    # request isn't slowed down by lazy graph tracing.
    dummy = np.zeros((1, IMG_SIZE[0], IMG_SIZE[1], 3), dtype=np.float32)
    model.predict(dummy, verbose=0)
    print("Model loaded and warmed up.")


def preprocess_image(file_bytes: bytes) -> np.ndarray:
    try:
        img = Image.open(io.BytesIO(file_bytes)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Could not read image file. Please upload a valid image.")

    img = img.resize(IMG_SIZE)
    arr = np.array(img).astype(np.float32) / 255.0  # matches rescale=1./255 in training
    arr = np.expand_dims(arr, axis=0)
    return arr


@app.get("/api/health")
def health_check():
    return {"status": "ok", "model_loaded": model is not None}


@app.post("/api/predict")
async def predict(file: UploadFile = File(...)):
    if model is None:
        raise HTTPException(status_code=503, detail="Model is not loaded yet. Please try again shortly.")

    if file.content_type not in ("image/jpeg", "image/png", "image/jpg", "image/webp"):
        raise HTTPException(status_code=400, detail="Unsupported file type. Please upload a JPEG, PNG, or WEBP image.")

    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    start = time.time()
    input_arr = preprocess_image(file_bytes)
    predictions = model.predict(input_arr, verbose=0)[0]
    elapsed_ms = round((time.time() - start) * 1000, 1)

    probs = {CLASS_ORDER[i]: float(predictions[i]) for i in range(len(CLASS_ORDER))}
    top_class = max(probs, key=probs.get)
    confidence = probs[top_class]

    results = [
        {
            "id": cls,
            "label": CLASS_INFO[cls]["label"],
            "short": CLASS_INFO[cls]["short"],
            "description": CLASS_INFO[cls]["description"],
            "severity": CLASS_INFO[cls]["severity"],
            "probability": probs[cls],
        }
        for cls in CLASS_ORDER
    ]
    results.sort(key=lambda r: r["probability"], reverse=True)

    return JSONResponse(
        {
            "prediction": {
                "class_id": top_class,
                "label": CLASS_INFO[top_class]["label"],
                "confidence": confidence,
                "severity": CLASS_INFO[top_class]["severity"],
            },
            "all_results": results,
            "inference_time_ms": elapsed_ms,
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
