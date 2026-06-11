import { useCallback, useRef } from "react";

export function useAlertSound() {
  const ctxRef = useRef<AudioContext | null>(null);

  const ensureCtx = () => {
    if (typeof window === "undefined") return null;
    if (!ctxRef.current) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctxRef.current = new Ctx();
    }
    return ctxRef.current;
  };

  const beep = useCallback((type: "alert" | "warn" | "ok" = "alert") => {
    const ctx = ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "alert") {
      osc.type = "square";
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(600, now + 0.18);
      osc.frequency.setValueAtTime(880, now + 0.36);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
      osc.start(now);
      osc.stop(now + 0.8);
    } else if (type === "warn") {
      osc.type = "triangle";
      osc.frequency.value = 520;
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else {
      osc.type = "sine";
      osc.frequency.setValueAtTime(660, now);
      osc.frequency.setValueAtTime(880, now + 0.08);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    }
  }, []);

  return { beep };
}
