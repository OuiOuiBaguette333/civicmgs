import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@components": "/src/components",
      "@data": "/src/data",
      "@hooks": "/src/hooks",
      "@pages": "/src/pages",
      "@utils": "/src/utils",
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
