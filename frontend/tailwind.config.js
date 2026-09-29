/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
          orange: '#EA580C',
        },
        met: {
          bg: '#F8FAFC',
          card: '#FFFFFF',
          cardSubtle: '#F1F5F9',
          border: '#E2E8F0',
          borderLight: '#CBD5E1',
          textPrimary: '#0F172A',
          textSecondary: '#475569',
          textMuted: '#94A3B8',
          accent: '#EA580C',
          radarGreen: '#16A34A',
          radarYellow: '#D97706',
          radarRed: '#DC2626',
          radarPurple: '#9333EA',
          ltg: '#0284C7'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Roboto Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
