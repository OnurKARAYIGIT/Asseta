/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "var(--primary-color)",
        "primary-hover": "var(--primary-hover-color)",
        secondary: "var(--secondary-color)",
        white: "var(--white-color)",
        danger: "var(--danger-color)",
        background: "var(--background-color)",
        "card-background": "var(--card-background-color)",
        "text-main": "var(--text-color)",
        "text-light": "var(--text-color-light)",
        border: "var(--border-color)",
        "light-gray": "var(--light-gray-color)",
      },
    },
  },
  plugins: [],
};
