import { ReactNode } from 'react';
import { AppNavbar } from './AppNavbar';

export const AppLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <main>
        <div className="max-w-[1200px] mx-auto px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
};
