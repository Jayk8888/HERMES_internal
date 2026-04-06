import forms from '@tailwindcss/forms'
import typography from '@tailwindcss/typography'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#f3f7f7',
        primary: {
          50: '#eef8f8',
          100: '#d8eeee',
          200: '#b6dfde',
          300: '#86c8c7',
          400: '#4fa9a8',
          500: '#2b8b89',
          600: '#206f6d',
          700: '#1d5958',
          800: '#1b4747',
          900: '#183c3c',
          950: '#0e2323',
        },
        critical: {
          light: '#fff1f2',
          DEFAULT: '#e11d48',
          dark: '#9f1239',
        },
        warning: {
          light: '#fffbeb',
          DEFAULT: '#d97706',
          dark: '#92400e',
        },
        success: {
          light: '#f0fdf4',
          DEFAULT: '#16a34a',
          dark: '#14532d',
        },
        info: {
          light: '#eff6ff',
          DEFAULT: '#2563eb',
          dark: '#1e3a8a',
        },
        sidebar: {
          bg: '#102629',
          hover: '#18363a',
          active: '#206f6d',
          text: '#9cb4b8',
          textActive: '#f7fbfb',
          border: '#18363a',
        },
      },
      fontFamily: {
        sans: ['Source Sans 3', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        shell: '0 18px 40px -28px rgba(15, 23, 42, 0.35)',
      },
      keyframes: {
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'slide-in-right': 'slide-in-right 0.25s ease-out',
        'fade-in': 'fade-in 0.2s ease-in',
      },
    },
  },
  plugins: [
    forms({ strategy: 'class' }),
    typography,
  ],
}
