/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  version: string;
};

// GitHub Pages serves the project under /<repo>/. Locally we stay at /.
const REPO_BASE = '/aetherium/';

export default defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? (process.env.VITE_BASE ?? REPO_BASE) : '/',
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    target: 'es2022',
    sourcemap: false,
    chunkSizeWarningLimit: 800,
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
}));
