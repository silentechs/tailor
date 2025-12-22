import { resolve } from 'node:path';
import * as dotenv from 'dotenv';
import { configDefaults, defineConfig } from 'vitest/config';

dotenv.config();

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    exclude: [...configDefaults.exclude, 'src/__tests__/e2e/**'],
    // Using simple pool configuration
    pool: 'threads',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/__tests__/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        'src/app/layout.tsx',
        'src/middleware.ts',
        'prisma/',
      ],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
