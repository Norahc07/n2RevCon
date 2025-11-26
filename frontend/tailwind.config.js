/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#DC2626', // Red
          dark: '#B91C1C',
          light: '#EF4444',
        },
        secondary: {
          DEFAULT: '#FFFFFF', // White
          dark: '#F3F4F6',
        },
        accent: {
          DEFAULT: '#000000', // Black
          light: '#1F2937',
        }
      },
    },
  },
  plugins: [],
}

