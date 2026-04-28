/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#13201a",
        mint: {
          50: "#f4fbf7",
          100: "#e4f7ec",
          200: "#c9f2dc",
          300: "#9ee5bd",
          400: "#68d297",
          500: "#34b978",
          600: "#168452",
          700: "#116940"
        }
      },
      boxShadow: {
        soft: "0 18px 48px rgba(30, 91, 61, 0.12)"
      }
    }
  },
  plugins: []
};
