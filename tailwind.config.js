/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Noto Sans KR"', 'sans-serif'],
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
