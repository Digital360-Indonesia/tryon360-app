/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fff1ee',
          100: '#ffe0d9',
          200: '#ffc7b8',
          300: '#ffa088',
          400: '#ff6b47',
          500: '#ff4b00',
          600: '#ed3500',
          700: '#c82700',
          800: '#a52208',
          900: '#881f0c',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      aspectRatio: {
        '2/3': '2 / 3',
      }
    },
  },
  plugins: [],
}
