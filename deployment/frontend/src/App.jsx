import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import UploadZone from './components/UploadZone';
import ScanFrame from './components/ScanFrame';
import ResultsPanel from './components/ResultsPanel';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const CLASS_CARDS = [
  {
    short: 'ACA',
    name: 'Adenocarcinoma',
    note: 'Glandular-cell origin, often peripheral lung tissue',
    tone: 'malignant',
  },
  {
    short: 'Normal',
    name: 'Normal Tissue',
    note: 'No malignant pattern detected',
    tone: 'benign',
  },
  {
    short: 'SCC',
    name: 'Squamous Cell Carcinoma',
    note: 'Airway-lining origin, often central chest region',
    tone: 'malignant',
  },
];

export default function App() {
  const [file, setFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | scanning | done | error
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  const handleFileSelected = useCallback((selected) => {
    setFile(selected);
    setResult(null);
    setErrorMsg(null);
    setStatus('idle');
    const url = URL.createObjectURL(selected);
    setImageUrl(url);
  }, []);

  const runDetection = useCallback(async () => {
    if (!file) return;
    setStatus('scanning');
    setErrorMsg(null);

    const minScanTime = new Promise((res) => setTimeout(res, 1900));

    try {
      const formData = new FormData();
      formData.append('file', file);

      const [response] = await Promise.all([
        fetch(`${API_URL}/api/predict`, { method: 'POST', body: formData }),
        minScanTime,
      ]);

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.detail || 'Detection failed. Please try again.');
      }

      const data = await response.json();
      setResult(data);
      setStatus('done');
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong while contacting the detection server.');
      setStatus('error');
    }
  }, [file]);

  const reset = () => {
    setFile(null);
    setImageUrl(null);
    setResult(null);
    setErrorMsg(null);
    setStatus('idle');
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="container app-header__row">
          <div className="app-header__brand">
            <span className="app-header__mark" aria-hidden="true" />
            <span className="mono app-header__wordmark">PULMOSCAN</span>
          </div>
          <span className="mono app-header__tag">Histopathology AI · MobileNet</span>
        </div>
      </header>

      <section className="hero">
        <div className="container hero__grid">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="hero__eyebrow mono">Lung cancer histopathology classifier</p>
            <h1 className="hero__title">
              Read the slide
              <br />
              before the pathologist does.
            </h1>
            <p className="hero__body">
              Upload a lung tissue histopathology image and this model &mdash; a MobileNet
              network fine-tuned on 15,000 labeled slides &mdash; classifies it as
              adenocarcinoma, squamous cell carcinoma, or normal tissue in under a second.
            </p>
            <div className="hero__stats">
              <div className="hero__stat">
                <span className="hero__stat-value mono">98.6%</span>
                <span className="hero__stat-label">test accuracy</span>
              </div>
              <div className="hero__stat">
                <span className="hero__stat-value mono">15,000</span>
                <span className="hero__stat-label">training slides</span>
              </div>
              <div className="hero__stat">
                <span className="hero__stat-value mono">3</span>
                <span className="hero__stat-label">tissue classes</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="hero__classes"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            {CLASS_CARDS.map((c) => (
              <div key={c.short} className={`class-card class-card--${c.tone}`}>
                <span className="class-card__short mono">{c.short}</span>
                <span className="class-card__name">{c.name}</span>
                <span className="class-card__note">{c.note}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <main className="container detector" id="detect">
        <div className="detector__grid">
          <div className="detector__left">
            <h2 className="detector__heading">Upload a slide</h2>
            {!imageUrl ? (
              <UploadZone onFileSelected={handleFileSelected} disabled={status === 'scanning'} />
            ) : (
              <>
                <ScanFrame
                  imageUrl={imageUrl}
                  scanning={status === 'scanning'}
                  done={status === 'done'}
                />
                <div className="detector__actions">
                  {status !== 'scanning' && (
                    <button className="btn btn--ghost" onClick={reset}>
                      Choose different image
                    </button>
                  )}
                  {status === 'idle' && (
                    <button className="btn btn--primary" onClick={runDetection}>
                      Run detection
                    </button>
                  )}
                  {status === 'done' && (
                    <button className="btn btn--primary" onClick={runDetection}>
                      Re-run detection
                    </button>
                  )}
                </div>
              </>
            )}

            {status === 'error' && (
              <div className="detector__error" role="alert">
                <strong>Couldn&apos;t complete detection.</strong>
                <p>{errorMsg}</p>
                <p className="detector__error-hint">
                  Make sure the backend API is running at <code>{API_URL}</code>.
                </p>
              </div>
            )}
          </div>

          <div className="detector__right">
            <h2 className="detector__heading">Result</h2>
            <AnimatePresence mode="wait">
              {status === 'scanning' && (
                <motion.div
                  key="scanning"
                  className="detector__waiting"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <span className="mono">ANALYZING TISSUE PATTERN&hellip;</span>
                </motion.div>
              )}
              {status === 'done' && result && (
                <motion.div key="result">
                  <ResultsPanel result={result} />
                </motion.div>
              )}
              {(status === 'idle' || status === 'error') && !result && (
                <motion.div
                  key="empty"
                  className="detector__waiting detector__waiting--muted"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <span>Results will appear here after you run detection.</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <footer className="footer">
        <div className="container footer__inner">
          <p className="footer__disclaimer">
            <strong>Not a diagnostic device.</strong> PulmoScan is a student research
            project for educational purposes only. It is not FDA-cleared or CE-marked,
            has not been validated for clinical use, and must never replace evaluation
            by a licensed pathologist or physician.
          </p>
        </div>
      </footer>
    </div>
  );
}
