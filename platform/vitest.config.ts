import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.{test,spec}.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/build/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/*.d.ts',
        '**/*.config.ts',
        '**/prisma/**',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@funrun/shared': resolve(__dirname, 'packages/shared/src'),
      '@funrun/database': resolve(__dirname, 'packages/database/src'),
      '@funrun/logger': resolve(__dirname, 'packages/logger/src'),
      '@funrun/redis': resolve(__dirname, 'packages/redis/src'),
      '@funrun/config': resolve(__dirname, 'packages/config/src'),
    },
  },
});
