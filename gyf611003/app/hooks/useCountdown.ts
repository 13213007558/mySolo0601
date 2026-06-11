import { useEffect, useRef, useState } from "react";

export type CountdownStatus = "idle" | "running" | "warning" | "overtime" | "alert";

export function useCountdown(
  plannedSeconds: number,
  isActive: boolean,
  startedAt?: number,
  onDeviation?: (seconds: number) => void,
  onAlert?: () => void
) {
  const [now, setNow] = useState(() => Date.now());
  const rafRef = useRef<number | null>(null);
  const alertedRef = useRef(false);

  useEffect(() => {
    if (!isActive || !startedAt) return;
    let running = true;
    const tick = () => {
      if (!running) return;
      setNow(Date.now());
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      running = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isActive, startedAt]);

  if (!isActive || !startedAt) {
    return {
      remaining: plannedSeconds,
      elapsed: 0,
      status: "idle" as CountdownStatus,
      progressPct: 0,
      deviation: 0,
    };
  }

  const elapsed = Math.floor((now - startedAt) / 1000);
  const remaining = plannedSeconds - elapsed;
  const progressPct = Math.max(0, Math.min(1, elapsed / plannedSeconds));
  const deviation = elapsed - plannedSeconds;

  let status: CountdownStatus = "running";
  if (remaining <= 30 && remaining > 0) status = "warning";
  if (remaining <= 0 && deviation <= 180) status = "overtime";
  if (deviation > 180) status = "alert";

  if (typeof window !== "undefined") {
    if (deviation > 180 && !alertedRef.current) {
      alertedRef.current = true;
      onAlert?.();
    }
    if (deviation !== undefined) {
      onDeviation?.(deviation);
    }
  }

  return { remaining: Math.max(0, remaining), elapsed, status, progressPct, deviation };
}

export function formatMMSS(totalSec: number) {
  const s = Math.abs(Math.floor(totalSec));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}
