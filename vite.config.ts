import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  publicDir: "generated/work-package-1",
  build: {
    outDir: "dist/frontend",
  },
});
