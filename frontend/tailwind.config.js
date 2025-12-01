/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      'xs': '320px',   // Extra small - thin phones (69-70mm width)
      'sm': '640px',   // Small
      'md': '768px',   // Medium
      'lg': '1024px',  // Large
      'xl': '1280px',  // Extra large
      '2xl': '1536px', // 2X large
    },
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

