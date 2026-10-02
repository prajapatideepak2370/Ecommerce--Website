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
          50: "rgb(var(--color-ink-50) / <alpha-value>)",
          100: "rgb(var(--color-ink-100) / <alpha-value>)",
          200: "rgb(var(--color-ink-200) / <alpha-value>)",
          300: "rgb(var(--color-ink-300) / <alpha-value>)",
          400: "rgb(var(--color-ink-400) / <alpha-value>)",
          500: "rgb(var(--color-ink-500) / <alpha-value>)",
          600: "rgb(var(--color-ink-600) / <alpha-value>)",
          700: "rgb(var(--color-ink-700) / <alpha-value>)",
          800: "rgb(var(--color-ink-800) / <alpha-value>)",
          900: "rgb(var(--color-ink-900) / <alpha-value>)",
          950: "rgb(var(--color-ink-950) / <alpha-value>)",
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
