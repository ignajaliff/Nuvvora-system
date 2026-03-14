import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 1400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-3"
          >
            {/* Logo icon */}
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-primary">
                <path
                  d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            {/* Brand name */}
            <span
              className="text-2xl text-foreground"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
            >
              N<span style={{ fontStyle: 'italic', fontWeight: 500 }}>uvvora</span>
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
