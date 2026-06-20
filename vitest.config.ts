import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    css: false,
    // Unit/component tests only. Playwright owns e2e/ (added with the first real flow).
    exclude: ["node_modules", ".next", "e2e"],
  },
  resolve: {
    // Mirror the tsconfig "@/*" -> "./*" alias so imports resolve the same in tests.
    alias: { "@": resolve(__dirname, ".") },
  },
});
