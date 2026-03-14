import { cn } from "@/lib/utils";

export const BackgroundGlow = ({ children, className }: { children?: React.ReactNode; className?: string }) => {
  return (
    <div className={cn("fixed inset-0 -z-10 overflow-hidden bg-background", className)}>
      {/* Primary soft indigo glow */}
      <div
        className="absolute top-[-20%] left-[-10%] h-[600px] w-[600px] rounded-full opacity-50 blur-[120px]"
        style={{ background: '#C7D2FE' }}
      />

      {/* Cyan accent */}
      <div
        className="absolute top-[10%] right-[5%] h-[500px] w-[500px] rounded-full opacity-25 blur-[120px]"
        style={{ background: '#67E8F9' }}
      />

      {/* Light blue spread */}
      <div
        className="absolute bottom-[0%] left-[30%] h-[550px] w-[550px] rounded-full opacity-20 blur-[140px]"
        style={{ background: '#BAE6FD' }}
      />

      {/* Subtle slate wash */}
      <div
        className="absolute top-[50%] right-[30%] h-[400px] w-[400px] rounded-full opacity-30 blur-[100px]"
        style={{ background: '#E2E8F0' }}
      />

      {/* Near-white highlight */}
      <div
        className="absolute top-[20%] left-[40%] h-[300px] w-[300px] rounded-full opacity-40 blur-[80px]"
        style={{ background: '#F8FAFC' }}
      />

      {children}
    </div>
  );
};
