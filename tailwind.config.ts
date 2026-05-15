import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-hover': 'var(--surface-hover)',
        primary: {
          DEFAULT: 'var(--primary)',
          hover: 'var(--primary-hover)',
          subtle: 'var(--primary-subtle)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          subtle: 'var(--destructive-subtle)',
        },
        success: {
          DEFAULT: 'var(--success)',
          subtle: 'var(--success-subtle)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          subtle: 'var(--warning-subtle)',
        },
        info: {
          DEFAULT: 'var(--info)',
          subtle: 'var(--info-subtle)',
        },
        sidebar: 'var(--sidebar-bg)',
        header: 'var(--header-bg)',
        'input-bg': 'var(--input-bg)',
        'input-hover': 'var(--input-bg-hover)',
        'input-border': 'var(--input-border)',
        input: 'var(--input)',
        muted: 'var(--muted)',
        'muted-foreground': 'var(--muted-foreground)',
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        'primary-foreground': 'var(--primary-foreground)',
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        'destructive-foreground': 'var(--destructive-foreground)',
        ring: 'var(--ring)',
      },
      textColor: {
        DEFAULT: 'var(--text)',
        muted: 'var(--text-muted)',
      },
      borderColor: {
        DEFAULT: 'var(--border)',
      },
      borderRadius: {
        sm: '6px',
        md: '8px',
        lg: '10px',
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '1.2' }],
        xs: ['11px', { lineHeight: '1.4' }],
        sm: ['13px', { lineHeight: '1.5' }],
        base: ['13px', { lineHeight: '1.5' }],
        lg: ['15px', { lineHeight: '1.4' }],
        xl: ['18px', { lineHeight: '1.3' }],
        '2xl': ['20px', { lineHeight: '1.3' }],
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
