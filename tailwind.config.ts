import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

export default {
  content: ["./{pages,layouts,components,src}/**/*.{html,js,jsx,ts,tsx,vue}"],
  theme: {
    extend: {
      gridTemplateColumns: {
        puzzle: "3fr repeat(10, minmax(0, 1fr))",
      },
      gridTemplateRows: {
        puzzle: "3fr repeat(10, minmax(0, 1fr))",
      },
    },
  },
  plugins: [],
} satisfies Config;
