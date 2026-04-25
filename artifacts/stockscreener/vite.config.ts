import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// Упрощаем получение путей, чтобы GitHub не путался
const basePath = process.env.BASE_PATH || "./";
const apiTarget = process.env.VITE_API_URL || "http://localhost:8080";

export default defineConfig({
  base: basePath === "./" ? "" : basePath,
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      // Если папка attached_assets реально нужна, оставляем так:
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  // Указываем корень явно
  root: process.cwd(),
  server: {
    proxy: {
      "/api": {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
  build: {
    // Собираем в папку dist в корне проекта
    outDir: "dist",
    emptyOutDir: true,
  },
});