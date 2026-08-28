/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        'muted-foreground': 'hsl(var(--muted-foreground))',
        card: 'hsl(var(--card))',
        border: 'hsl(var(--border))',
        'hero-subtitle': 'hsl(var(--hero-subtitle))',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['"Instrument Serif"', 'serif'],
      },
    },
  },
  plugins: [],
};
