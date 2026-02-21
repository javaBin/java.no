/** @type {import("tailwindcss").Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      maxWidth: {
        content: "1280px",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        muted: "#777777",
        "muted-foreground": "var(--muted-foreground, #71717a)",
        "jz-salmon": "#f05350",
        "jz-yellow": "#fed136",
      },
      fontFamily: {
        slab: ['"Roboto Slab"', "Helvetica Neue", "Helvetica", "Arial", "sans-serif"],
        montserrat: ["Montserrat", "Helvetica Neue", "Helvetica", "Arial", "sans-serif"],
        serif: ['"Droid Serif"', "Helvetica Neue", "Helvetica", "Arial", "sans-serif"],
      },
      backgroundImage: {
        hero: "url(/img/banner/bg.jpg)",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    function ({ addBase }) {
      addBase({
        "::selection": { background: "#fed136", textShadow: "none" },
        "::-moz-selection": { background: "#fed136", textShadow: "none" },
        "img::selection": { background: "transparent" },
        "img::-moz-selection": { background: "transparent" },
      })
    },
  ],
}
