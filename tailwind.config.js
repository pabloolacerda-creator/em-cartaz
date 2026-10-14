/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0E0F15",
        base: "#12131A",
        surface: "#1C1E27",
        surface2: "#252834",
        line: "#2E3140",
        text: "#EDEEF2",
        muted: "#8A8D9A",
        gold: "#E8B84B",
        goldDim: "#8A7230",
        netflix: "#E50914",
        prime: "#1FA2FF",
        max: "#9A6CFF",
      },
      fontFamily: {
        sans: ['Archivo', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        poster: "0 10px 30px -12px rgba(0,0,0,0.7)",
      },
    },
  },
  plugins: [],
};
