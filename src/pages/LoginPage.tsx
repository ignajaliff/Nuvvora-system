import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { BackgroundGlow } from '@/components/ui/background-glow';
import { motion } from 'framer-motion';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <BackgroundGlow />
      
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.2, 0, 0, 1] }}
        className="relative z-10 w-full max-w-[400px] mx-auto px-6"
      >
        {/* Logo */}
        <motion.div 
          className="text-center mb-10"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
        >
          <span className="text-3xl tracking-tight text-foreground" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
            N<span style={{ fontStyle: 'italic', fontWeight: 500 }}>uvvora</span>
          </span>
        </motion.div>

        {/* Card */}
        <motion.div 
          className="glass-card p-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
        >
          <h2 className="text-base font-semibold text-foreground mb-6 tracking-tight">
            Iniciar sesión
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                className="bg-background/40 border-border/50 backdrop-blur-sm h-11 rounded-xl focus-visible:ring-primary/20 focus-visible:border-primary/30 transition-all"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="bg-background/40 border-border/50 backdrop-blur-sm h-11 rounded-xl focus-visible:ring-primary/20 focus-visible:border-primary/30 transition-all"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 rounded-xl mt-1 font-medium text-sm shadow-sm hover:shadow-md transition-all" 
              disabled={loading}
            >
              {loading ? (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2"
                >
                  <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Cargando...
                </motion.span>
              ) : 'Entrar'}
            </Button>
          </form>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
