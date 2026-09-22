import { motion, AnimatePresence } from 'framer-motion';
import './ScanFrame.css';

/**
 * Displays the uploaded image inside a diagnostic-style frame.
 * While `scanning` is true, an animated scan line and corner ticks
 * sweep across the image — this is the single orchestrated motion
 * moment of the page.
 */
export default function ScanFrame({ imageUrl, scanning, done }) {
  return (
    <div className="scan-frame">
      <div className="scan-frame__corners" aria-hidden="true">
        <span className="corner corner--tl" />
        <span className="corner corner--tr" />
        <span className="corner corner--bl" />
        <span className="corner corner--br" />
      </div>

      {imageUrl ? (
        <img src={imageUrl} alt="Uploaded histopathology slide" className="scan-frame__image" />
      ) : (
        <div className="scan-frame__placeholder">
          <span className="mono">NO IMAGE LOADED</span>
        </div>
      )}

      <AnimatePresence>
        {scanning && (
          <motion.div
            className="scan-frame__line"
            initial={{ top: '0%', opacity: 0 }}
            animate={{
              top: ['0%', '100%', '0%'],
              opacity: 1,
            }}
            exit={{ opacity: 0 }}
            transition={{
              top: { duration: 1.8, repeat: Infinity, ease: 'linear' },
              opacity: { duration: 0.3 },
            }}
          />
        )}
      </AnimatePresence>

      {scanning && (
        <div className="scan-frame__grid" aria-hidden="true" />
      )}

      {done && !scanning && (
        <motion.div
          className="scan-frame__badge"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
          ✓
        </motion.div>
      )}
    </div>
  );
}
