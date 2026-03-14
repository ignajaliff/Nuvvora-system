import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";

const glowOrbs = [
  {
    className: "top-[-20%] left-[-10%] h-[600px] w-[600px]",
    color: "#D4D8F8",
    opacity: 0.35,
    blur: 140,
  },
  {
    className: "top-[10%] right-[5%] h-[500px] w-[500px]",
    color: "#A5F3FC",
    opacity: 0.2,
    blur: 140,
  },
  {
    className: "bottom-[0%] left-[30%] h-[550px] w-[550px]",
    color: "#D0EBFC",
    opacity: 0.18,
    blur: 160,
  },
  {
    className: "top-[50%] right-[30%] h-[400px] w-[400px]",
    color: "#E2E8F0",
    opacity: 0.45,
    blur: 100,
  },
  {
    className: "top-[20%] left-[40%] h-[300px] w-[300px]",
    color: "#F8FAFC",
    opacity: 0.4,
    blur: 80,
  },
];

export const BackgroundGlow = ({ children, className }: { children?: React.ReactNode; className?: string }) => {
  const location = useLocation();
  const isDashboard = location.pathname === "/";

  return (
    <div className={cn("fixed inset-0 -z-10 overflow-hidden bg-background", className)}>
      {glowOrbs.map((orb, i) => (
        <motion.div
          key={i}
          className={cn("absolute rounded-full", orb.className)}
          style={{
            background: orb.color,
            filter: `blur(${orb.blur}px)`,
          }}
          initial={isDashboard ? { opacity: 0 } : { opacity: orb.opacity }}
          animate={{ opacity: orb.opacity }}
          transition={isDashboard ? { duration: 0.8, delay: 0.1, ease: "easeOut" } : undefined}
        />
      ))}
      {children}
    </div>
  );
};