import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Plus Jakarta Sans', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        // Brand
        violet: {
          50: '#f5f3ff',
          500: '#6c47ff',
          600: '#5535e8',
          700: '#4425cc',
        },
        green: {
          500: '#0dba7a',
          400: '#1fd9a4',
        },
        // Neutral
        slate: {
          900: '#0f1117',
          800: '#1a1d2e',
          700: '#2d3250',
          600: '#3d4263',
          500: '#5a5f7a',
          400: '#858aaa',
          300: '#b0b6cc',
          200: '#dde1ef',
          100: '#f4f5f9',
          50: '#fafbff',
        },
      },
      boxShadow: {
        card: '0 2px 8px rgba(0,0,0,.06)',
        modal: '0 32px 80px rgba(0,0,0,.25)',
        violet: '0 4px 14px rgba(108,71,255,.3)',
        green: '0 4px 14px rgba(13,186,122,.3)',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
      },
      animation: {
        'fade-in': 'fadeIn .25s ease',
        'slide-up': 'slideUp .3s ease',
        'page-in': 'pageIn .2s ease',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        pageIn: { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
export default config
