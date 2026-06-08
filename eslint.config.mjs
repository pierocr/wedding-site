import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  ...nextCoreWebVitals,
  {
    ignores: [
      ".next/**",
      ".vercel/**",
      "node_modules/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
    ],
  },
  {
    rules: {
      // New React Compiler-oriented rules from Next 16 are useful,
      // but this codebase needs a separate refactor pass before enforcing them.
      "react-hooks/immutability": "off",
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/static-components": "off",
      "react-hooks/use-memo": "off",
    },
  },
];

export default eslintConfig;
