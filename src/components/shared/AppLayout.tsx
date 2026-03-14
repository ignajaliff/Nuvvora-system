import { ReactNode } from 'react';
import { AppNavbar } from './AppNavbar';
import { BackgroundGlow } from '@/components/ui/background-glow';

export const AppLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="relative min-h-screen">
      <BackgroundGlow />
      <div className="relative z-10">
        <AppNavbar />
        <main>
          <div className="max-w-[1200px] mx-auto px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
