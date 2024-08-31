import { fileURLToPath } from "url";

import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue2";

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), "");
  const STEAM = env.VITE_STEAM === "true";
  const path = fileURLToPath(new URL("./src", import.meta.url));

  return {
    plugins: [vue()],
    base: "./",
    outDir: STEAM ? "../AppFiles" : "dist",
    resolve: {
      alias: {
        "@": path,
      },
      extensions: [".js", ".vue", ".json"],
    },
  };
});
