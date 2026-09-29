/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12'
        },
        // Warm cream surfaces for the customer app
        cream: {
          50: '#FFFBF5',
          100: '#FFF7EE',
          200: '#FDEEDF',
          300: '#FBE3C8'
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'ui-sans-serif', 'sans-serif']
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.08)',
        pop: '0 10px 30px -10px rgb(0 0 0 / 0.25)',
        // Soft warm shadow for customer cards (matches the orange/cream theme)
        warm: '0 8px 24px -10px rgb(234 88 12 / 0.18), 0 2px 6px -2px rgb(0 0 0 / 0.06)',
        glow: '0 8px 20px -6px rgb(249 115 22 / 0.55)'
      }
    }
  },
  plugins: []
}
