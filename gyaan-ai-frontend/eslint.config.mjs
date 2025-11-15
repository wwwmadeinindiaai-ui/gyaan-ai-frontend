// eslint.config.mjs
import next from "eslint-config-next";

export default [
  ...next(), // Next.js + TS + React sensible defaults
  {
    ignores: ["**/.next/**", "**/node_modules/**", "**/dist/**"],
  },
  {
    // Enforce named exports for better tree-shaking and consistency
    rules: {
      // Note: Next.js requires default exports for pages, app routes, layouts, etc.
      // This rule is configured to warn (not error) to maintain flexibility
      "import/no-default-export": "warn",
      "import/prefer-default-export": "off",
    },
    // Exclude Next.js special files that require default exports
    ignores: [
      "**/app/**/page.tsx",
      "**/app/**/layout.tsx",
      "**/app/**/loading.tsx",
      "**/app/**/error.tsx",
      "**/app/**/not-found.tsx",
      "**/app/**/template.tsx",
      "**/pages/**/*.tsx",
      "**/pages/**/*.ts",
      "**/*.config.js",
      "**/*.config.mjs",
      "**/*.config.ts",
      "**/middleware.ts",
    ],
  },
];
