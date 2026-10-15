/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: '#0f1115',
        card: '#171a21',
        line: '#262b36',
        txt: '#e8eaed',
        muted: '#8b93a1',
        green: '#3ddc84',
        red: '#ff6b6b',
        blue: '#5b9dff',
        amber: '#ffc15e',
      },
    },
  },
  plugins: [],
};
