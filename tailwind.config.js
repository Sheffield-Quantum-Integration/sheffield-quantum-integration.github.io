/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#0b1220',
          900: '#111b2e',
          800: '#1a263d'
        }
      }
    },
  },
  plugins: [],
}
