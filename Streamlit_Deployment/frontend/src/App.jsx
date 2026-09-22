import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, BrainCircuit, Clock3, ImagePlus, Info, Microscope, ShieldCheck, Sparkles, UploadCloud } from 'lucide-react';
import UploadZone from './components/UploadZone';
import ScanFrame from './components/ScanFrame';
import ResultsPanel from './components/ResultsPanel';
import './App.css';

const SAMPLE_IMAGE_URL = new URL('../lung_imge.jpeg', import.meta.url).href;

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

  const handleSampleSelected = useCallback(async () => {
    const response = await fetch(SAMPLE_IMAGE_URL);
    const blob = await response.blob();
    const sampleFile = new File([blob], 'lung-microscopy-sample.jpeg', { type: 'image/jpeg' });
    handleFileSelected(sampleFile);
  }, [handleFileSelected]);

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
            <span className="app-header__mark" aria-hidden="true"><Microscope size={22} /></span>
            <div>
              <span className="app-header__wordmark">TissueVision</span>
              <span className="app-header__submark">AI-powered microscopy</span>
            </div>
          </div>
          <nav className="app-header__nav" aria-label="Primary navigation">
            <a className="app-header__nav-link app-header__nav-link--active" href="#detect"><Activity size={15} /> Analyze</a>
            <a className="app-header__nav-link" href="#about"><Info size={15} /> About</a>
            <span className="app-header__tag">RGB tissue classifier</span>
          </nav>
        </div>
      </header>

      <section className="hero">
        <div className="container hero__grid">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="hero__eyebrow"><Sparkles size={15} /> Microscopy intelligence</p>
            <h1 className="hero__title">
              See deeper into
              <br />
              every tissue sample.
            </h1>
            <p className="hero__body">
              Upload a microscopic RGB tissue image and let our trained vision model identify
              the cellular patterns that matter. Built for fast, clear research workflows.
            </p>
            <div className="hero__stats">
              <div className="hero__stat">
                <span className="hero__stat-value">RGB</span>
                <span className="hero__stat-label">image input</span>
              </div>
              <div className="hero__stat">
                <span className="hero__stat-value">3</span>
                <span className="hero__stat-label">tissue classes</span>
              </div>
              <div className="hero__stat">
                <span className="hero__stat-value">AI</span>
                <span className="hero__stat-label">assisted review</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="hero__classes"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="hero__visual" aria-hidden="true">
              <img className="hero__visual-image" src={SAMPLE_IMAGE_URL} alt="" />
              <div className="hero__visual-overlay" />
              <span className="hero__visual-label"><Microscope size={15} /> cellular pattern map</span>
            </div>
            <div className="hero__class-list">
            {CLASS_CARDS.map((c) => (
              <div key={c.short} className={`class-card class-card--${c.tone}`}>
                <span className="class-card__short mono">{c.short}</span>
                <span className="class-card__name">{c.name}</span>
                <span className="class-card__note">{c.note}</span>
              </div>
            ))}
            </div>
          </motion.div>
        </div>
      </section>

      <main className="container detector" id="detect">
        <div className="detector__grid">
          <div className="detector__left">
            <div className="panel-heading"><span className="panel-heading__icon"><UploadCloud size={18} /></span><div><h2 className="detector__heading">Upload tissue image</h2><p>Start with a clear microscopic RGB sample</p></div></div>
            {!imageUrl ? (
              <UploadZone onFileSelected={handleFileSelected} onSampleSelected={handleSampleSelected} disabled={status === 'scanning'} />
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
                      Choose another image
                    </button>
                  )}
                  {status === 'idle' && (
                    <button className="btn btn--primary" onClick={runDetection}>
                      Analyze image
                    </button>
                  )}
                  {status === 'done' && (
                    <button className="btn btn--primary" onClick={runDetection}>
                      Analyze again
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
            <div className="panel-heading"><span className="panel-heading__icon panel-heading__icon--green"><BrainCircuit size={18} /></span><div><h2 className="detector__heading">Prediction results</h2><p>Model interpretation and confidence</p></div></div>
            <AnimatePresence mode="wait">
              {status === 'scanning' && (
                <motion.div
                  key="scanning"
                  className="detector__waiting"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <span><Clock3 size={18} /> Analyzing cellular patterns&hellip;</span>
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
                  <span><ImagePlus size={22} /> Results will appear here after analysis.</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <footer className="footer">
        <div className="container footer__inner">
          <p className="footer__disclaimer">
            <strong><ShieldCheck size={14} /> Research use only.</strong> TissueVision is a student research
            project for educational purposes only. It is not FDA-cleared or CE-marked,
            has not been validated for clinical use, and must never replace evaluation
            by a licensed pathologist or physician.
          </p>
        </div>
      </footer>
    </div>
  );
}
