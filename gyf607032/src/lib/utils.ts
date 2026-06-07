import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type ToastType = "success" | "error" | "info";

interface ToastOptions {
  type?: ToastType;
  duration?: number;
}

let toastContainer: HTMLDivElement | null = null;

function getContainer(): HTMLDivElement {
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.className =
      "fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none";
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

export function toast(message: string, type: ToastType = "info", options: ToastOptions = {}) {
  const container = getContainer();
  const duration = options.duration || 2500;

  const colorMap: Record<ToastType, string> = {
    success: "bg-mint-500 border-mint-600 text-white",
    error: "bg-coral-500 border-coral-600 text-white",
    info: "bg-slate-800 border-slate-900 text-white",
  };

  const el = document.createElement("div");
  el.className = `px-4 py-2.5 rounded-lg text-sm font-medium shadow-lg border ${colorMap[type]} opacity-0 translate-y-[-8px] transition-all duration-200`;
  el.textContent = message;
  container.appendChild(el);

  requestAnimationFrame(() => {
    el.classList.remove("opacity-0", "translate-y-[-8px]");
  });

  setTimeout(() => {
    el.classList.add("opacity-0", "translate-y-[-8px]");
    setTimeout(() => {
      el.remove();
    }, 200);
  }, duration);
}
