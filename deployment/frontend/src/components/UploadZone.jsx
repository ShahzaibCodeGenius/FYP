import { useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import './UploadZone.css';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

export default function UploadZone({ onFileSelected, disabled }) {
  const inputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);

  const validateAndEmit = useCallback(
    (file) => {
      if (!file) return;
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError('Please upload a JPEG, PNG, or WEBP image.');
        return;
      }
      if (file.size > 15 * 1024 * 1024) {
        setError('File is too large. Please upload an image under 15MB.');
        return;
      }
      setError(null);
      onFileSelected(file);
    },
    [onFileSelected]
  );

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    validateAndEmit(file);
  };

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    validateAndEmit(file);
  };

  return (
    <div>
      <motion.div
        className={`upload-zone ${dragActive ? 'upload-zone--active' : ''} ${disabled ? 'upload-zone--disabled' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Upload histopathology image"
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleChange}
          disabled={disabled}
          style={{ display: 'none' }}
        />

        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
          <rect x="6" y="8" width="28" height="24" rx="2" stroke="currentColor" strokeWidth="1.6" />
          <path d="M6 26L14 18L20 24L28 15L34 22" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" fill="none" />
          <circle cx="14" cy="14" r="2" stroke="currentColor" strokeWidth="1.6" />
        </svg>

        <p className="upload-zone__title">Drop a lung tissue slide here</p>
        <p className="upload-zone__sub">or click to browse &mdash; JPEG, PNG, WEBP up to 15MB</p>
      </motion.div>

      {error && (
        <p className="upload-zone__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
