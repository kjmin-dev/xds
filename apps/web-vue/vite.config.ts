import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  // Not 5173 or 5174, so that it runs beside the React and Solid web apps of the same project.
  server: { port: 5175, strictPort: true },
});
