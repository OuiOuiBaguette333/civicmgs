import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@components": "/src/components",
      "@data": "/src/data",
      "@hooks": "/src/hooks",
      "@model": "/src/model",
      "@pages": "/src/pages",
      "@utils": "/src/utils",
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // The election countdown counts calendar days in Melbourne. Run the tests
    // from a timezone where that differs from the local day, or a bug that used
    // the local day would pass on every Melbourne machine.
    env: { TZ: "UTC" },
  },
});
