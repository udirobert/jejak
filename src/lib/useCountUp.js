import { useEffect, useRef, useState } from "react";

// Ledger-style count-up: eases 0 -> target whenever target changes.
// decimals=0 (default) returns integers; pass 2 for money.
export function useCountUp(target, duration = 900, reduce = false, decimals = 0) {
  const [val, setVal] = useState(target);
  const raf = useRef();
  useEffect(() => {
    if (reduce) {
      setVal(target);
      return;
    }
    const start = performance.now();
    const tick = (now) => {
      const p = Math.max(0, Math.min(1, (now - start) / duration));
      const eased = 1 - Math.pow(1 - p, 3);
      const v = target * eased;
      setVal(decimals > 0 ? Number(v.toFixed(decimals)) : Math.round(v));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration, reduce, decimals]);
  return val;
}
