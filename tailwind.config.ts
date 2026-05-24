import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  blocklist: [
    'duration',
    'ease',
    'delay',
    '[&[data-state=closed]]:duration-[200ms]',
    '[&[data-state=open]]:duration-[300ms]',
    'duration-[100ms]',
    'duration-[150ms]',
    'duration-[200ms]',
    'duration-[300ms]',
    'duration-[400ms]',
    'ease-[cubic-bezier(0.2,0,0,1)]',
    'ease-[cubic-bezier(0.34,1.2,0.64,1)]',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--bg)',
        foreground: 'var(--text)',
        card: {
          DEFAULT: 'var(--surface)',
          foreground: 'var(--text)',
        },
        muted: {
          DEFAULT: 'var(--surface-2)',
          foreground: 'var(--text-3)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--surface-2)',
        },
        primary: {
          DEFAULT: 'var(--accent)',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: 'var(--surface-3)',
          foreground: 'var(--text-2)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: '#ffffff',
        },
        border: 'var(--border)',
        input: 'var(--border-2)',
        ring: 'var(--accent)',
      },
      borderRadius: {
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '1.2' }],
        xs: ['11px', { lineHeight: '1.4' }],
        sm: ['12px', { lineHeight: '1.5' }],
        base: ['13px', { lineHeight: '1.5' }],
        lg: ['14px', { lineHeight: '1.4' }],
        xl: ['17px', { lineHeight: '1.3' }],
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      spacing: {
        0.5: '2px',
        1: '4px',
        1.5: '6px',
        2: '8px',
        2.5: '10px',
        3: '12px',
        3.5: '14px',
        5: '20px',
        6: '24px',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
