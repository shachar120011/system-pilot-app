/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f4f2f9',
          100: '#e9e6f3',
          200: '#d3cde7',
          300: '#b2a8d4',
          400: '#8c7bbe',
          500: '#432a61', // הסגול המדויק מהלוגו שלך
          600: '#3a2454',
          700: '#311f46',
          800: '#281a39',
          900: '#21152f',
        },
      },
    },
  },
  plugins: [],
}
