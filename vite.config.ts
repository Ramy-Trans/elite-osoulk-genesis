import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";


export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const isDev = mode === "development";

  return {
    plugins: [
      TanStackRouterVite({ target: "react", autoCodeSplitting: true }),
      react(),
      tailwindcss(),
      tsconfigPaths(),
    ],

    build: {
      outDir: "dist/client",
    },

    server: {
      host: "0.0.0.0",
      port: 5000,
      strictPort: true,
      allowedHosts: true,

      // ✅ ONLY used in development
      proxy: isDev
        ? {
            "/api": {
              target: env.VITE_API_TARGET || "http://localhost:3001",
              changeOrigin: true,
            },
          }
        : undefined,
    },
  };
});
