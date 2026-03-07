import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: "#8B5CF6",
          "purple-deep": "#6D28D9",
          cyan: "#06B6D4",
          "cyan-light": "#22D3EE",
          dark: "#0F0B1E",
          "dark-card": "#1A1333",
          "dark-surface": "#140F26",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "sans-serif"],
        display: [
          "var(--font-space-grotesk)",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
        "fade-in-up": "fadeInUp 0.8s ease-out forwards",
        shimmer: "shimmer 3s linear infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(139,92,246,0.3)" },
          "50%": {
            boxShadow:
              "0 0 40px rgba(139,92,246,0.6), 0 0 80px rgba(6,182,212,0.2)",
          },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;

