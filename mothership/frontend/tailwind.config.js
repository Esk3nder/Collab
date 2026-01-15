/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        matrix: {
          green: '#00ff41',
          dark: '#0d0d0d',
        },
        lavender: {
          400: '#a78bfa',
          500: '#8b5cf6',
        }
      }
    },
  },
  plugins: [],
}
