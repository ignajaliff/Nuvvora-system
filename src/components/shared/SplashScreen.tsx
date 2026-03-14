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
            <img
              src="/pwa-192x192.png"
              alt="Nuvvora"
              className="h-10 w-10 rounded-xl"
            />
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
