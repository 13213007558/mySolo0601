import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        nautical: {
          900: "#0A1628",
          800: "#0F2744",
          700: "#1A3A5C",
          600: "#264D75",
        },
        indicator: {
          cyan: "#00E5FF",
          amber: "#FFB020",
          red: "#FF3B30",
          green: "#30D158",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
        sans: ["Noto Sans SC", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "led-cyan": "0 0 8px 2px rgba(0, 229, 255, 0.5)",
        "led-amber": "0 0 8px 2px rgba(255, 176, 32, 0.5)",
        "led-red": "0 0 12px 4px rgba(255, 59, 48, 0.6)",
        "led-green": "0 0 8px 2px rgba(48, 209, 88, 0.5)",
      },
      keyframes: {
        pulseAlert: {
          "0%, 100%": { boxShadow: "inset 0 0 0 3px rgba(255,59,48,0.9)" },
          "50%": { boxShadow: "inset 0 0 0 6px rgba(255,59,48,0.4)" },
        },
        flipTick: {
          "0%": { transform: "rotateX(0deg)", opacity: "1" },
          "45%": { transform: "rotateX(-90deg)", opacity: "0.2" },
          "55%": { transform: "rotateX(90deg)", opacity: "0.2" },
          "100%": { transform: "rotateX(0deg)", opacity: "1" },
        },
        unlockSlide: {
          "0%": { transform: "translateY(-8px)", opacity: "0.4", filter: "grayscale(1)" },
          "100%": { transform: "translateY(0)", opacity: "1", filter: "grayscale(0)" },
        },
        sonarRipple: {
          "0%": { transform: "scale(0.6)", opacity: "0.8" },
          "100%": { transform: "scale(3)", opacity: "0" },
        },
      },
      animation: {
        "pulse-alert": "pulseAlert 1.2s ease-in-out infinite",
        "flip-tick": "flipTick 0.35s ease-out",
        "unlock-slide": "unlockSlide 0.45s ease-out",
        "sonar-ripple": "sonarRipple 3s ease-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
