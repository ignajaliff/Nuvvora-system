import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface VoiceRecorderProps {
  empresa: string;
  disabled?: boolean;
  onResult: (result: { titulo: string; descripcion: string }) => void;
}

const WaveformBars = () => (
  <div className="flex items-center gap-[3px] h-5">
    {[0, 1, 2, 3, 4].map(i => (
      <motion.div
        key={i}
        className="w-[3px] rounded-full bg-destructive"
        animate={{ height: ['6px', '18px', '6px'] }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          delay: i * 0.12,
          ease: 'easeInOut',
        }}
      />
    ))}
  </div>
);

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export const VoiceRecorder = ({ empresa, disabled, onResult }: VoiceRecorderProps) => {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = useCallback(async () => {
    if (!empresa) {
      toast.error('Selecciona un proyecto antes de grabar');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        if (timerRef.current) clearInterval(timerRef.current);

        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await processAudio(blob);
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setRecording(true);
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed(prev => prev + 1), 1000);
    } catch {
      toast.error('No se pudo acceder al micrófono');
    }
  }, [empresa]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  }, []);

  const processAudio = async (blob: Blob) => {
    setProcessing(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const { data, error } = await supabase.functions.invoke('transcribe-task', {
        body: { audio: base64, empresa },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      onResult({ titulo: data.titulo, descripcion: data.descripcion });
      toast.success('Audio analizado correctamente');
    } catch (e: any) {
      console.error('Voice processing error:', e);
      toast.error(e.message || 'Error al procesar el audio');
    } finally {
      setProcessing(false);
    }
  };

  if (processing) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border">
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Procesando audio con IA...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        disabled={disabled}
        onClick={recording ? stopRecording : startRecording}
        className={`p-2.5 rounded-full transition-all duration-200 ${
          recording
            ? 'bg-destructive text-destructive-foreground animate-pulse shadow-lg shadow-destructive/25'
            : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {recording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
      </button>

      <AnimatePresence>
        {recording && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            className="flex items-center gap-3"
          >
            <WaveformBars />
            <span className="text-xs font-mono text-destructive font-medium">
              {formatTime(elapsed)}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
