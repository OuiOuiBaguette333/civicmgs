import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@components": "/src/components",
      "@data": "/src/data",
      "@pages": "/src/pages",
      "@utils": "/src/utils",
    },
  },
});
