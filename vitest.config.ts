import { defineConfig } from "vitest/config";
import { resolve } from "node:path";
import swc from "unplugin-swc";

export default defineConfig({
  // Note: esbuild is implicitly set to false when using swc.vite plugin
  esbuild: false,
  plugins: [
    swc.vite({
      jsc: {
        parser: {
          syntax: 'typescript',
          decorators: true,
          dynamicImport: true,
        },
        transform: {
          legacyDecorator: true,
          decoratorMetadata: true,
        },
        target: 'esnext',
        keepClassNames: true,
      },
      module: { type: 'es6' },
      sourceMaps: true,
    }),
  ],
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 5000,
    silent: false,
    reporters: ['verbose'],
    setupFiles: ['./test/setup-after-env.ts'],
    globalSetup: './test/setup-global.ts',
    coverage: {
      provider: 'v8',
      reporter: ['clover', 'json', 'lcov', 'text'],
      include: ['src/**/*.ts'],
      exclude: [
        '**/node_modules/**',
        'test/**',
        'src/consoles/**',
        'coverage/**',
        'docker/**',
        'media/**',
        'setups/**',
      ],
    },
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      'src/consoles/**',
      'setups/**',
    ],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  }
});
