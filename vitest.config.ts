import { accessSync, constants as fsConstants } from 'node:fs';
import { resolve } from 'node:path';
import * as dotenv from 'dotenv';
import { configDefaults, defineConfig } from 'vitest/config';

dotenv.config();

// In some sandboxes, `.env` is present but not readable (EPERM). In that case, avoid Vite env file loading
// entirely by pointing `envDir` at a non-existent directory so Vite falls back to process.env only.
const projectRoot = __dirname;
let envDir = projectRoot;
try {
  accessSync(resolve(projectRoot, '.env'), fsConstants.R_OK);
} catch {
  envDir = resolve(projectRoot, '.vitest-env');
}

export default defineConfig({
  envDir,
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
