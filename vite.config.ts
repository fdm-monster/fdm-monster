import { defineConfig } from "vite-plus";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export default defineConfig({
  build: {
    ssr: true,
    rolldownOptions: {
      input: "src/index.ts",
      external: ["snappy", "@napi-rs/snappy"],
    },
  },
  optimizeDeps: {
    exclude: ["snappy", "@napi-rs/snappy"],
  },
  fmt: {
    printWidth: 120,
    ignorePatterns: ["**/*.yml", "**/*.yaml", "**/*.md", "**/*.json", ".all-contributorsrc"],
  },
  staged: {
    "*": "vp check --fix",
  },
  resolve: {
    alias: {
      "@": resolve(fileURLToPath(new URL(".", import.meta.url)), "./src"),
    },
  },
  pack: {
    entry: ["src/**/*.ts", "!src/**/*.test.ts", "!src/**/*.spec.ts"],
    platform: "node",
    unbundle: true,
    fixedExtension: false,
    outDir: "dist",
    sourcemap: true,
    deps: {
      skipNodeModulesBundle: true,
    },
    onSuccess: process.env.START_SERVER === "true" ? "node --enable-source-maps dist/index.js" : undefined,
  },
  ssr: {
    external: ["snappy", "@napi-rs/snappy"],
  },
  test: {
    globals: true,
    environment: "node",
    testTimeout: 5000,
    silent: false,
    reporters: ["verbose"],
    setupFiles: ["./test/setup-after-env.ts"],
    globalSetup: "./test/setup-global.ts",
    coverage: {
      provider: "v8",
      reporter: ["clover", "json", "lcov", "text"],
      include: ["src/**/*.ts"],
      exclude: ["**/node_modules/**", "test/**", "coverage/**", "docker/**", "media/**", "setups/**"],
    },
    exclude: ["**/node_modules/**", "**/dist/**", "**/coverage/**", "setups/**"],
  },
});
