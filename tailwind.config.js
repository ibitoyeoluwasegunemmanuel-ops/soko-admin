/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        soko: {
          bg:      "#0a0a0f",
          surface: "#12121c",
          border:  "#1e1e2e",
          muted:   "#2a2a3e",
          accent:  "#7c3aed",
          green:   "#10b981",
          red:     "#ef4444",
          amber:   "#f59e0b",
        },
      },
    },
  },
  plugins: [],
}

