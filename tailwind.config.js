/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    'h-[100dvh]',
    'min-h-[100dvh]',
    'py-6',
    'pb-20',
  ],
  darkMode: 'class', // Увімкнення темної теми через клас
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      transitionDelay: {
        '0': '0ms',
        '100': '100ms',
        '200': '200ms',
        '300': '300ms',
        '400': '400ms',
        '500': '500ms',
      },
      animationDelay: { // Custom key if using a plugin, or just reuse standard delays
        '100': '100ms',
        '200': '200ms',
        '300': '300ms',
      },
      colors: {
        bg: {
          main: 'var(--bg-main)',
          surface: 'var(--bg-surface)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
        },
        border: {
          DEFAULT: 'var(--border-color)',
          subtle: 'var(--border-subtle)',
        },
        brand: {
          DEFAULT: 'var(--brand-primary)',
          hover: 'var(--brand-hover)',
          active: 'var(--brand-active)',
          subtle: 'var(--brand-subtle)',
          accent: 'var(--brand-accent)',
          'accent-hover': 'var(--brand-accent-hover)',
        },
        status: {
          success: 'var(--status-success)',
          error: 'var(--status-error)',
          warning: 'var(--status-warning)',
        },
        ui: {
          disabled: 'var(--ui-disabled)',
        }
      },
      borderRadius: {
        'card': '1.5rem', // 24px - for large containers
        'input': '0.75rem', // 12px - for inputs and list items
      },
      keyframes: {
        slideIn: {
          'from': { opacity: 0, transform: 'translateY(-15px) scale(0.98)' },
          'to': { opacity: 1, transform: 'translateY(0) scale(1)' },
        },
        popIn: {
          'from': { opacity: 0, transform: 'scale(0.95) translateY(10px)' },
          'to': { opacity: 1, transform: 'scale(1) translateY(0)' },
        },
        checkBounce: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.8)' },
          '100%': { transform: 'scale(1.1)' },
        }
      },
      animation: {
        'slide-in': 'slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pop-in': 'popIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'check-bounce': 'checkBounce 0.2s ease-in-out',
      }
    },
  },
  plugins: [],
}