import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const currentDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@packages/contracts': resolve(currentDir, '../../packages/contracts/src/index.ts'),
      '@packages/scoring': resolve(currentDir, '../../packages/scoring/src/index.ts'),
      '@packages/shared': resolve(currentDir, '../../packages/shared/src/index.ts'),
      '@packages/ui': resolve(currentDir, '../../packages/ui/src/index.tsx')
    }
  },
  test: {
    environment: 'jsdom',
    include: ['test/**/*.test.ts', 'test/**/*.test.tsx'],
    fileParallelism: false,
    maxWorkers: 1,
    pool: 'threads'
  }
});
