/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        met: {
          bg: '#0B0F19',
          card: '#111827',
          cardSubtle: '#161F30',
          border: '#1F293D',
          borderLight: '#334155',
          textPrimary: '#F1F5F9',
          textSecondary: '#94A3B8',
          textMuted: '#64748B',
          accent: '#38BDF8',
          radarGreen: '#22C55E',
          radarYellow: '#EAB308',
          radarRed: '#EF4444',
          radarPurple: '#A855F7',
          ltg: '#06B6D4'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Roboto Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
