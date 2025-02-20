import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { configDefaults } from "vitest/config";
// 

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),      
    tsconfigPaths(),
  ],
  test: {
  globals: true,
  environment: "jsdom",
    exclude: [...configDefaults.exclude, "dist/**", "node_modules/**"],
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
})


