// Shared motion language — one place to tune the app's feel.
export const SPRING = { type: "spring", stiffness: 300, damping: 26 };
export const SPRING_SNAP = { type: "spring", stiffness: 420, damping: 32 };
export const TAP = { scale: 0.96 };
export const pageVariants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};