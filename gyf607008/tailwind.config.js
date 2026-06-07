/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        'night-bg': '#0f172a',
        'night-surface': '#1e293b',
        'night-border': '#334155',
        'night-text': '#e2e8f0',
        'night-muted': '#94a3b8',
        'status-normal': '#10b981',
        'status-pending': '#f59e0b',
        'status-abnormal': '#ef4444',
        'accent-amber': '#f59e0b',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Menlo', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
