/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          green: '#00FF94',
          pink: '#FF2E97',
          yellow: '#FFD600',
        },
        bg: {
          primary: '#0A0E27',
          secondary: '#1A1F3A',
          card: '#151930',
        },
        border: '#2D3350',
      },
      boxShadow: {
        'brutal': '8px 8px 0px 0px rgba(0, 0, 0, 1)',
        'brutal-sm': '4px 4px 0px 0px rgba(0, 0, 0, 1)',
        'brutal-lg': '12px 12px 0px 0px rgba(0, 0, 0, 1)',
        'brutal-neon-green': '8px 8px 0px 0px #00FF94',
        'brutal-neon-pink': '8px 8px 0px 0px #FF2E97',
        'brutal-neon-yellow': '8px 8px 0px 0px #FFD600',
      },
      fontFamily: {
        'display': ['Bungee', 'cursive'],
        'body': ['Outfit', 'sans-serif'],
        'mono': ['Share Tech Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
