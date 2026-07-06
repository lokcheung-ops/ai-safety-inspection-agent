import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/**", "coverage/**", "node_modules/**"] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.ts", "tests/**/*.ts", "frontend/**/*.ts", "frontend/**/*.tsx", "vite.config.ts"],
    languageOptions: {
      globals: {
        document: "readonly",
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
);
