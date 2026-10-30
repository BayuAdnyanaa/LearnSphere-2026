import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import environment from "vite-plugin-environment";

// https://vite.dev/config/
export default defineConfig({
  // dfx writes CANISTER_ID_* and DFX_NETWORK into the .env file at the repo root
  envDir: "..",
  plugins: [
    react(),
    tailwindcss(),
    environment("all", { prefix: "CANISTER_" }),
    environment("all", { prefix: "DFX_" }),
  ],

  resolve: {
    alias: [
      {
        find: "declarations",
        replacement: fileURLToPath(
          new URL("../declarations", import.meta.url)
        )
      },
      // dfx 0.31 generates declarations for the renamed SDK (@icp-sdk/core);
      // the app still uses @dfinity/agent 3.2.1, which has the same Actor/HttpAgent API
      {
        find: "@icp-sdk/core/agent",
        replacement: "@dfinity/agent",
      },
    ]
  },
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:4943",
        changeOrigin: true,
      },
    },
  },
  define: {
    global: "globalThis",
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
  },
});
