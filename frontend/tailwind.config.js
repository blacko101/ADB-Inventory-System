/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#123C2A",
        muted: "#66776C",
        canvas: "#f5f8f5",
        brand: "#026C3A",
        "brand-dark": "#01542E",
        "brand-accent": "#3CA61B",
        slate: {
          50: "#F5F8F5",
          100: "#E8EFE9",
          200: "#D7E2D9",
          300: "#BECEC1",
          400: "#87978A",
          500: "#64766A",
          600: "#4E6154",
          700: "#354A3B",
          800: "#24382B",
          900: "#17291D",
          950: "#0A140E",
        },
      },
      boxShadow: {
        card: "0 8px 30px rgba(2, 108, 58, 0.045)",
      },
    },
  },
  plugins: [],
};
