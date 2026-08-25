/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        hospital: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#b9dffd',
          300: '#7cc4fb',
          400: '#36a4f6',
          500: '#0c87eb',
          600: '#026bc9',
          700: '#0355a3',
          800: '#074886',
          900: '#0c3d70',
          950: '#08274a',
        },
        slate: {
          850: '#172033',
          950: '#0b1120',
        },
        emergency: {
          DEFAULT: '#ef4444',
          glow: 'rgba(239, 68, 68, 0.4)',
        },
        critical: {
          DEFAULT: '#dc2626',
          glow: 'rgba(220, 38, 38, 0.4)',
        },
        occupancy: {
          free: '#10b981',
          reserved: '#f59e0b',
          occupied: '#ef4444',
          in_use: '#6366f1',
          cleaning: '#06b6d4',
          maintenance: '#64748b',
          compensated: '#a855f7'
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Consolas', 'monospace'],
      },
      animation: {
        'pulse-fast': 'pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      }
    },
  },
  plugins: [],
}
