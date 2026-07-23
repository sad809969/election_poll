/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        pdp: {
          DEFAULT: '#008751',
          dark: '#00663d',
          light: '#e6f3ed',
          accent: '#ff0000',
        },
        darkbg: {
          main: '#0B132B',
          card: '#1C2541',
          sidebar: '#070D1E',
          border: '#2A365C'
        }
      },
    },
  },
  plugins: [],
}
