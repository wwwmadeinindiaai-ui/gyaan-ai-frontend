// eslint.config.mjs
import next from "eslint-config-next";

export default [
  ...next(), // Next.js + TS + React sensible defaults
  {
    ignores: ["**/.next/**", "**/node_modules/**", "**/dist/**"],
  },
];
