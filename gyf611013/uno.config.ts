import { defineConfig, presetUno, presetIcons } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetIcons({
      scale: 1.2,
      cdn: 'https://esm.sh/',
    }),
  ],
  theme: {
    colors: {
      forest: {
        50: '#f0fdf4',
        100: '#dcfce7',
        200: '#bbf7d0',
        300: '#86efac',
        400: '#4ade80',
        500: '#22c55e',
        600: '#16a34a',
        700: '#15803d',
        800: '#1B4332',
        900: '#14532d',
      },
      amber: {
        50: '#fffbeb',
        100: '#fef3c7',
        200: '#fde68a',
        300: '#fcd34d',
        400: '#fbbf24',
        500: '#D4A017',
        600: '#b45309',
        700: '#92400e',
        800: '#78350f',
        900: '#451a03',
      },
      bark: {
        50: '#F5F0EB',
        100: '#e8e0d6',
        200: '#d4c7b5',
        300: '#bfa98e',
        400: '#a88c6b',
        500: '#8B7355',
        600: '#6d5940',
        700: '#3E2723',
        800: '#2d1b14',
        900: '#1a0f0a',
      },
    },
    fontFamily: {
      sans: '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif',
      mono: '"DIN Alternate", "Roboto Mono", monospace',
    },
  },
  shortcuts: {
    'btn-primary': 'bg-forest-800 text-white rounded-lg px-4 py-2 hover:bg-forest-700 transition-colors cursor-pointer',
    'btn-danger': 'border-2 border-amber-500 text-amber-500 rounded-lg px-4 py-2 hover:bg-amber-50 transition-colors cursor-pointer',
    'btn-ghost': 'text-bark-500 rounded-lg px-4 py-2 hover:bg-bark-100 transition-colors cursor-pointer',
    'card': 'bg-white rounded-xl shadow-sm border border-bark-200 p-4',
    'badge-pending': 'bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full',
    'badge-confirmed': 'bg-forest-100 text-forest-700 text-xs px-2 py-0.5 rounded-full',
    'badge-expired': 'bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full',
    'badge-over-limit': 'bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full',
  },
})
