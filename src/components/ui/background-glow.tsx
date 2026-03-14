import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";

const glowOrbs = [
  {
    className: "top-[-20%] left-[-10%] h-[600px] w-[600px]",
    color: "#D4D8F8",
    opacity: 0.35,
    blur: 140,
    animateTo: { x: [0, 40, -20, 0], y: [0, -30, 20, 0] },
  },
  {
    className: "top-[10%] right-[5%] h-[500px] w-[500px]",
    color: "#A5F3FC",
    opacity: 0.2,
    blur: 140,
    animateTo: { x: [0, -50, 30, 0], y: [0, 40, -20, 0] },
  },
  {
    className: "bottom-[0%] left-[30%] h-[550px] w-[550px]",
    color: "#D0EBFC",
    opacity: 0.18,
    blur: 160,
    animateTo: { x: [0, 30, -40, 0], y: [0, -25, 35, 0] },
  },
  {
    className: "top-[50%] right-[30%] h-[400px] w-[400px]",
    color: "#E2E8F0",
    opacity: 0.45,
    blur: 100,
    animateTo: { x: [0, -30, 20, 0], y: [0, 30, -15, 0] },
  },
  {
    className: "top-[20%] left-[40%] h-[300px] w-[300px]",
    color: "#F8FAFC",
    opacity: 0.4,
    blur: 80,
    animateTo: { x: [0, 25, -35, 0], y: [0, -20, 25, 0] },
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
          initial={isDashboard ? { opacity: 0, scale: 0.7 } : { opacity: orb.opacity, scale: 1 }}
          animate={
            isDashboard
              ? {
                  opacity: orb.opacity,
                  scale: 1,
                  ...orb.animateTo,
                }
              : { opacity: orb.opacity, scale: 1 }
          }
          transition={
            isDashboard
              ? {
                  opacity: { duration: 1.4, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] },
                  scale: { duration: 1.8, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] },
                  x: { duration: 20, repeat: Infinity, ease: "easeInOut" },
                  y: { duration: 18, repeat: Infinity, ease: "easeInOut" },
                }
              : undefined
          }
        />
      ))}
      {children}
    </div>
  );
};
