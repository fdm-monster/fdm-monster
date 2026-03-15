import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    entry: ["src/**/*.ts"],
    platform: "node",
    unbundle: true,
    fixedExtension: false,
    outDir: "dist",
    sourcemap: true,
    deps: {
      skipNodeModulesBundle: true,
    },
  },
});
