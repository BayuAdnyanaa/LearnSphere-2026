import { defineConfig, loadEnv } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import environment from "vite-plugin-environment";

// A mainnet build needs the frontend canister ID: App.jsx builds the fixed Internet Identity
// derivation origin from it, and a wrong origin would give every user a new principal
function requireMainnetIds() {
  const env = { ...loadEnv("production", "..", ""), ...process.env };
  if (env.DFX_NETWORK === "ic" && !env.CANISTER_ID_LEARNSPHERE_FRONTEND) {
    throw new Error("DFX_NETWORK is ic but CANISTER_ID_LEARNSPHERE_FRONTEND is missing. Create the canisters on ic first.");
  }
}

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  if (command === "build") requireMainnetIds();
  return {
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
  };
});
