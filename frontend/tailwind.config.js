/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bauhaus-black': '#000000',
        'bauhaus-white': '#FFFFFF',
        'bauhaus-red': '#E53935',
        'bauhaus-blue': '#1565C0',
        'bauhaus-yellow': '#FDD835',
        'bauhaus-surface': '#F5F5F0',
        'bauhaus-card': '#FFFFFF',
        'bauhaus-gray': '#6B6B63',
        'bauhaus-border': '#D4D4CF',
        'bauhaus-dark': '#1A1A16',
      },
      fontFamily: {
        'display': ['Syne', 'sans-serif'],
        'body': ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      borderWidth: {
        '3': '3px',
      },
    },
  },
  plugins: [],
}