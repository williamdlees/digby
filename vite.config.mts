import { fileURLToPath } from 'node:url';
import angular from '@analogjs/vite-plugin-angular';
import { defineConfig } from 'vitest/config';

const root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [angular({ tsconfig: `${root}tsconfig.spec.json` })],
  resolve: {
    alias: [
      { find: /^projects\/digby-swagger-client$/, replacement: `${root}projects/digby-swagger-client/index.ts` },
      { find: /^digby-swagger-client$/, replacement: `${root}projects/digby-swagger-client/index.ts` },
    ],
  },
  ssr: {
    // Keep Material and the CDK it imports in the same Vitest module graph.
    noExternal: [/@angular[\\/]material[\\/]/],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    include: ['src/**/*.spec.ts', 'projects/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/app/**/*.ts', 'projects/digby-swagger-client/api/refbook.service.ts'],
      exclude: ['**/*.spec.ts'],
      reporter: ['text', 'lcov'],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
});
