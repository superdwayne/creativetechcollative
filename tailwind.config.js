/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['"PP Neue Montreal"', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        'primary': ['"PP Neue Montreal"', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        'secondary': ['"TheGoodMonolith"', 'monospace'],
        'mono': ['"TheGoodMonolith"', 'monospace'],
        'serif': ['"Playfair Display"', 'Georgia', '"Times New Roman"', 'serif'],
      },
      colors: {
        'warm-off-white': '#f5f5f0',
        'warm-off-white-dim': '#d9d9d0',
        'text-primary': '#f5f5f0',
        'text-secondary': '#d9d9d0',
        'background-dark': '#050505',
        'background-gradient-1': '#1a1a1a',
        'background-gradient-2': '#0a0a0a',
      },
      fontSize: {
        'small': '0.825rem',
        'regular': '1rem',
        'medium': '1.5rem',
        'large': '4rem',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 1s ease-out forwards",
      },
      spacing: {
        'small': '0.5rem',
        'medium': '1rem',
        'large': '2rem',
      },
    },
  },
  plugins: [],
};