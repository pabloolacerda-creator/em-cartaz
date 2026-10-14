/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#000000",
        base: "#141414",
        surface: "#1F1F1F",
        surface2: "#2A2A2A",
        line: "#333333",
        text: "#F3F3F3",
        muted: "#9A9A9A",
        match: "#46D369",
        netflix: "#E50914",
        prime: "#1FA2FF",
        max: "#9A6CFF",
      },
      fontFamily: {
        sans: ["Archivo", "system-ui", "sans-serif"],
        display: ['"Bebas Neue"', "Archivo", "sans-serif"],
      },
      boxShadow: {
        card: "0 8px 24px -10px rgba(0,0,0,0.9)",
      },
    },
  },
  plugins: [],
};
