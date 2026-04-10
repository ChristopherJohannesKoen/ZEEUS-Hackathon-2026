import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@packages/contracts': path.resolve(__dirname, '../../packages/contracts/src/index.ts'),
      '@packages/scoring': path.resolve(__dirname, '../../packages/scoring/src/index.ts'),
      '@packages/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts')
    }
  },
  test: {
    environment: 'node',
    include: ['test/**/*.spec.ts', 'test/**/*.e2e-spec.ts'],
    fileParallelism: false,
    hookTimeout: 30_000,
    maxWorkers: 1,
    pool: 'threads',
    testTimeout: 30_000
  }
});
