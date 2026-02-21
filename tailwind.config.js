/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'cream': '#F5F2EB',
        'terracotta': '#B8956E',
        'teal-dark': '#3D6B6B',
        'sage': '#8B9F82',
        'teal-light': '#9BB5B5',
        'stone': '#5C5C5C',
        'sky': '#7DD3FC',
        'sky-muted': '#A5D8F3',
        'purple-glow': '#A78BFA',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        base: ['15px', { lineHeight: '1.6' }],
      },
      borderRadius: {
        card: '12px',
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(0 0 0 0.03)',
        'card-soft': '0 2px 8px -2px rgb(0 0 0 0.04)',
      },
      animation: {
        'glow-teal': 'glowTeal 5s ease-out forwards',
        'fade-in': 'fadeIn 0.3s ease-out',
        'logo-spin': 'logoSpin 1s ease-out',
        'dissolve': 'dissolve 2.5s ease-out forwards',
      },
      keyframes: {
        glowTeal: {
          '0%': { boxShadow: '0 0 0 0 rgb(61 107 107 / 0.35)', opacity: '1' },
          '15%': { boxShadow: '0 0 20px 4px rgb(61 107 107 / 0.2)', opacity: '1' },
          '100%': { boxShadow: '0 0 0 0 rgb(61 107 107 / 0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translate(-50%, 4px)' },
          '100%': { opacity: '1', transform: 'translate(-50%, 0)' },
        },
        dissolve: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        logoSpin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
    },
  },
  plugins: [],
}
