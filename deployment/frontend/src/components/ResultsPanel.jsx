import { motion } from 'framer-motion';
import './ResultsPanel.css';

function pct(v) {
  return `${(v * 100).toFixed(1)}%`;
}

export default function ResultsPanel({ result }) {
  if (!result) return null;

  const { prediction, all_results, inference_time_ms } = result;
  const isMalignant = prediction.severity === 'malignant';

  return (
    <motion.div
      className="results-panel"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className={`results-panel__verdict ${isMalignant ? 'is-malignant' : 'is-benign'}`}>
        <span className="results-panel__eyebrow mono">Primary finding</span>
        <h3>{prediction.label}</h3>
        <div className="results-panel__confidence">
          <span className="mono">{pct(prediction.confidence)}</span> confidence
        </div>
      </div>

      <div className="results-panel__bars">
        {all_results.map((r, i) => (
          <div className="result-bar" key={r.id}>
            <div className="result-bar__label-row">
              <span className="result-bar__name">{r.label}</span>
              <span className="result-bar__value mono">{pct(r.probability)}</span>
            </div>
            <div className="result-bar__track">
              <motion.div
                className={`result-bar__fill ${r.severity === 'malignant' ? 'fill-malignant' : 'fill-benign'}`}
                initial={{ width: 0 }}
                animate={{ width: pct(r.probability) }}
                transition={{ duration: 0.7, delay: 0.15 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="results-panel__description">{prediction.severity === 'benign'
        ? all_results.find((r) => r.id === prediction.class_id)?.description
        : all_results.find((r) => r.id === prediction.class_id)?.description}
      </p>

      <div className="results-panel__meta mono">
        Inference time: {inference_time_ms}ms
      </div>
    </motion.div>
  );
}
