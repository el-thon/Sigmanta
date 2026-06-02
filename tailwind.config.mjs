const config = {
  content: ["./src/app/**/*.{js,ts,jsx,tsx,mdx}", "./src/components/**/*.{js,ts,jsx,tsx,mdx}", "./src/lib/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        earth: {
          dark: "#1C1A14",
          mid: "#2E2B1F",
          light: "#F5F0E8",
          paper: "#EDE8DC"
        },
        moss: {
          DEFAULT: "#3B6D11",
          light: "#C0DD97"
        },
        hazard: {
          DEFAULT: "#D85A30",
          light: "#F5C4B3"
        },
        water: {
          DEFAULT: "#185FA5",
          light: "#B5D4F4"
        },
        amberWarn: "#BA7517"
      },
      fontFamily: {
        mono: ["DM Mono", "Courier New", "monospace"],
        display: ["Fraunces", "Georgia", "serif"],
        accent: ["Instrument Serif", "Georgia", "serif"]
      }
    }
  },
  plugins: []
};

export default config;
