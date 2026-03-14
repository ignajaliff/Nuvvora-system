import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { BackgroundGlow } from '@/components/ui/background-glow';
import { motion } from 'framer-motion';

const LoginPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { nombre },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success('Cuenta creada. Revisa tu email para confirmar.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
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
          <p className="text-muted-foreground text-sm mt-2">
            {isSignUp ? 'Crea tu cuenta para comenzar' : 'Bienvenido de vuelta'}
          </p>
        </motion.div>

        {/* Card */}
        <motion.div 
          className="glass-card p-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
        >
          <h2 className="text-base font-semibold text-foreground mb-6 tracking-tight">
            {isSignUp ? 'Crear cuenta' : 'Iniciar sesión'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <motion.div 
                className="space-y-2"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Label htmlFor="nombre" className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  Nombre
                </Label>
                <Input
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Tu nombre"
                  required
                  className="bg-background/40 border-border/50 backdrop-blur-sm h-11 rounded-xl focus-visible:ring-primary/20 focus-visible:border-primary/30 transition-all"
                />
              </motion.div>
            )}

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
              ) : isSignUp ? 'Crear cuenta' : 'Entrar'}
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-border/30 text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              {isSignUp ? '¿Ya tienes cuenta? ' : '¿No tienes cuenta? '}
              <span className="font-medium text-foreground/80 hover:text-foreground">
                {isSignUp ? 'Inicia sesión' : 'Regístrate'}
              </span>
            </button>
          </div>
        </motion.div>

        <motion.p 
          className="text-center text-muted-foreground/60 text-xs mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Gestión inteligente de proyectos
        </motion.p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
