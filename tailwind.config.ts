import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        storybook: {
          bg: "#F0F4F8",
          surface: "#FFFFFF",
          muted: "#D9E2EC",
          border: "#BCCCDC",
          text: "#102A43",
          subtle: "#627D98",
          // Interactable complementary palette (warm peach/coral)
          interactable: "#F97316",
          "interactable-hover": "#EA580C",
          "interactable-soft": "#FFEDD5",
          // Magic / Trigger glow
          magic: "#0EA5E9",
          "magic-soft": "#E0F2FE",
          // Plate active emerald
          plate: "#10B981",
          "plate-soft": "#D1FAE5",
          // Stone Block
          stone: "#94A3B8",
          "stone-dark": "#64748B",
          // Ice Block
          ice: "#38BDF8",
          "ice-soft": "#BAE6FD",
        },
      },
    },
  },
  plugins: [],
};

export default config;
