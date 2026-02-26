// tailwind.config.js
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F4F2F9',
          100: '#E9E6F3',
          200: '#D3CDE7',
          300: '#B2A8D4',
          400: '#8C7BBE',
          500: '#432A61', // הסגול העמוק של Inactu
          600: '#3A2454',
          700: '#311F46',
          800: '#281A39',
          900: '#21152F',
        },
      },
    },
  },
  plugins: [],
}
