// Tailwind v4 uses CSS-based configuration via @theme in globals.css
// This file is kept for compatibility with tooling that expects it.
// All custom tokens are defined in src/app/globals.css under @theme.

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
};

export default config;
