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
  darkMode: 'class',
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
      animationDelay: {
        '100': '100ms',
        '200': '200ms',
        '300': '300ms',
      },
      colors: {
        // Standard Palette Overrides
        blue: {
          500: 'hsl(var(--palette-blue) / <alpha-value>)',
          600: 'hsl(var(--palette-blue) / <alpha-value>)',
        },
        red: {
          500: 'hsl(var(--palette-red) / <alpha-value>)',
          600: 'hsl(var(--palette-red) / <alpha-value>)',
        },
        green: {
          500: 'hsl(var(--palette-green) / <alpha-value>)',
          600: 'hsl(var(--palette-green) / <alpha-value>)',
        },
        amber: {
          500: 'hsl(var(--palette-amber) / <alpha-value>)',
          600: 'hsl(var(--palette-amber) / <alpha-value>)',
        },
        indigo: {
          500: 'hsl(var(--palette-indigo) / <alpha-value>)',
          600: 'hsl(var(--palette-indigo) / <alpha-value>)',
        },
        purple: {
          500: 'hsl(var(--palette-purple) / <alpha-value>)',
          600: 'hsl(var(--palette-purple) / <alpha-value>)',
        },
        pink: {
          500: 'hsl(var(--palette-pink) / <alpha-value>)',
          600: 'hsl(var(--palette-pink) / <alpha-value>)',
        },
        cyan: {
          500: 'hsl(var(--palette-cyan) / <alpha-value>)',
          600: 'hsl(var(--palette-cyan) / <alpha-value>)',
        },
        emerald: {
          500: 'hsl(var(--palette-emerald) / <alpha-value>)',
          600: 'hsl(var(--palette-emerald) / <alpha-value>)',
        },

        bg: {
          main: 'hsl(var(--bg-main) / <alpha-value>)',
          surface: 'hsl(var(--bg-surface) / <alpha-value>)',
          subtle: 'hsl(var(--bg-subtle) / <alpha-value>)',
          inverse: 'hsl(var(--bg-inverse) / <alpha-value>)',
        },
        text: {
          primary: 'hsl(var(--text-primary) / <alpha-value>)',
          secondary: 'hsl(var(--text-secondary) / <alpha-value>)',
          inverse: 'hsl(var(--text-inverse) / <alpha-value>)',
          tertiary: 'hsl(var(--ui-disabled) / <alpha-value>)',
        },
        border: {
          DEFAULT: 'hsl(var(--border-color) / <alpha-value>)',
          subtle: 'hsl(var(--border-subtle) / <alpha-value>)',
        },
        brand: {
          DEFAULT: 'hsl(var(--brand-primary) / <alpha-value>)',
          primary: 'hsl(var(--brand-primary) / <alpha-value>)',
          hover: 'hsl(var(--brand-hover) / <alpha-value>)',
          active: 'hsl(var(--brand-active) / <alpha-value>)',
          subtle: 'hsl(var(--brand-subtle) / <alpha-value>)',
          accent: 'hsl(var(--brand-accent) / <alpha-value>)',
          'accent-hover': 'hsl(var(--brand-accent-hover) / <alpha-value>)',
        },
        status: {
          success: 'hsl(var(--status-success) / <alpha-value>)',
          error: 'hsl(var(--status-error) / <alpha-value>)',
          warning: 'hsl(var(--status-warning) / <alpha-value>)',
          info: 'hsl(var(--status-info) / <alpha-value>)',
        },
        ui: {
          disabled: 'hsl(var(--ui-disabled) / <alpha-value>)',
        },
        tag: {
          blue: 'hsl(var(--tag-blue) / <alpha-value>)',
          red: 'hsl(var(--tag-red) / <alpha-value>)',
          green: 'hsl(var(--tag-green) / <alpha-value>)',
          amber: 'hsl(var(--tag-amber) / <alpha-value>)',
          purple: 'hsl(var(--tag-purple) / <alpha-value>)',
          pink: 'hsl(var(--tag-pink) / <alpha-value>)',
          cyan: 'hsl(var(--tag-cyan) / <alpha-value>)',
          indigo: 'hsl(var(--tag-indigo) / <alpha-value>)',
          slate: 'hsl(var(--tag-slate) / <alpha-value>)',
          emerald: 'hsl(var(--tag-emerald) / <alpha-value>)',
        },
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(to right, hsl(var(--gradient-start)), hsl(var(--gradient-mid)), hsl(var(--gradient-end)))',
      },
      spacing: {
        'sidebar-focus': '400px',
        'card': '1.5rem',
        'input': '0.75rem',
      },
      width: {
        'sidebar-focus': '400px',
      },
      zIndex: {
        'overlay': '60',
        'modal': '70',
        'popover': '80',
        'toast': '90',
      },
      boxShadow: {
        'glow': '0 0 20px -5px hsl(var(--shadow-color) / 0.5)',
        'glow-lg': '0 0 30px -10px hsl(var(--shadow-color) / 0.6)',
        'brand-glow': '0 0 20px -5px hsl(var(--brand-primary) / 0.5)',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
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
      },
      fontSize: {
        // Mobile-Optimized Scale (Apple HIG Aligned)
        'xs': ['0.8125rem', { lineHeight: '1.5' }],    // 13px (Footnote)
        'sm': ['0.9375rem', { lineHeight: '1.5' }],    // 15px (Subhead)
        'base': ['1.0625rem', { lineHeight: '1.6' }],  // 17px (Body)
        'lg': ['1.25rem', { lineHeight: '1.4' }],      // 20px (Title 3)
        'xl': ['1.375rem', { lineHeight: '1.4' }],     // 22px (Title 2)
        '2xl': ['1.625rem', { lineHeight: '1.3' }],    // 26px
        '3xl': ['2rem', { lineHeight: '1.2' }],        // 32px (Large Title approx)
        '4xl': ['2.5rem', { lineHeight: '1.1' }],      // 40px
        '5xl': ['3rem', { lineHeight: '1' }],          // 48px
      },
    },
  },
  plugins: [],
}