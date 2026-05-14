import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: 'hsl(228 88% 5%)',
        card: 'hsl(222 47% 9%)',
        primary: 'hsl(217 100% 56%)',
      },
      borderRadius: {
        sm: '10px',
        md: '14px',
        lg: '18px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
