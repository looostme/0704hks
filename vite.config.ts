import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    exclude: ["node_modules/**", "dist/**", "tests/e2e/**"],
    setupFiles: "./src/test/setup.ts"
  }
});
