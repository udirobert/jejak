import confetti from "canvas-confetti";

// Gold sunrise confetti burst — fired once when a trace completes.
export function celebrate() {
  const colors = ["#FFC24B", "#E8921A", "#FF8A65", "#FF3D81", "#2FBF71"];
  confetti({ particleCount: 80, spread: 72, startVelocity: 38, origin: { y: 0.72 }, colors, scalar: 0.9, disableForReducedMotion: true });
  setTimeout(() => confetti({ particleCount: 36, angle: 60, spread: 55, origin: { x: 0, y: 0.8 }, colors, disableForReducedMotion: true }), 120);
  setTimeout(() => confetti({ particleCount: 36, angle: 120, spread: 55, origin: { x: 1, y: 0.8 }, colors, disableForReducedMotion: true }), 120);
}