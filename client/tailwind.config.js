/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f4f4ff",
          100: "#e9e8ff",
          200: "#d4d2ff",
          300: "#b0aaff",
          400: "#8679ff",
          500: "#6355ff",
          600: "#4c35f5",
          700: "#3b26d8",
          800: "#2f20ad",
          900: "#281d88",
          950: "#18104f",
        },
        accent: {
          DEFAULT: "#00f5d4",
          soft: "#a7f3d0",
        },
        ink: {
          50: "#f8f9fc",
          100: "#eceff5",
          200: "#d6dae5",
          300: "#afb6c8",
          400: "#828aa3",
          500: "#636981",
          600: "#4d5266",
          700: "#3c4050",
          800: "#262935",
          900: "#14161d",
          950: "#090a0f",
        },
      },
      fontFamily: {
        display: [
          "'Space Grotesk'",
          "'Plus Jakarta Sans'",
          "ui-sans-serif",
          "system-ui",
        ],
        body: ["'Inter'", "'Plus Jakarta Sans'", "ui-sans-serif", "system-ui"],
      },
      boxShadow: {
        glow: "0 0 60px -10px rgba(99, 85, 255, 0.45)",
        card: "0 12px 40px -12px rgba(9, 10, 15, 0.25)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      backgroundImage: {
        "grid-fade":
          "linear-gradient(to right, rgba(99,85,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(99,85,255,0.08) 1px, transparent 1px)",
        "hero-radial":
          "radial-gradient(60% 50% at 50% 0%, rgba(99,85,255,0.35), transparent 70%)",
      },
      animation: {
        "float-slow": "float 8s ease-in-out infinite",
        shimmer: "shimmer 2.5s linear infinite",
      },
      keyframes: {
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-14px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
      },
    },
  },
  plugins: [],
};
