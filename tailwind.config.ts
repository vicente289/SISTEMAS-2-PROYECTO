import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/data/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        leaf: {
          50: "#f3f8ef",
          100: "#dfeeda",
          600: "#357a38",
          700: "#27622c",
          900: "#173c1d",
        },
        earth: {
          100: "#f3eadf",
          300: "#d8b990",
          500: "#a3663c",
          700: "#704125",
        },
        tech: {
          500: "#277a7b",
          700: "#19595a",
        },
      },
      boxShadow: {
        soft: "0 14px 45px rgba(23, 60, 29, 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
