import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [phase, setPhase] = useState<'black' | 'gradient' | 'exit'>('black');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('gradient'), 1000);
    const t2 = setTimeout(() => setPhase('exit'), 1800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {phase !== 'exit' && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl font-semibold tracking-tight select-none"
            style={{
              fontFamily: 'Inter, sans-serif',
              color: phase === 'black' ? 'hsl(240, 10%, 3.9%)' : 'transparent',
              backgroundImage: phase === 'gradient'
                ? 'linear-gradient(135deg, #D4D8F8, #A5F3FC, #D0EBFC)'
                : 'none',
              backgroundClip: phase === 'gradient' ? 'text' : 'unset',
              WebkitBackgroundClip: phase === 'gradient' ? 'text' : 'unset',
              transition: 'color 0.6s ease, background-image 0.6s ease',
            }}
          >
            N<span style={{ fontStyle: 'italic' }}>uvvora</span>
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
