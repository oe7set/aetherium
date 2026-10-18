/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves the project under /<repo>/. Locally we stay at /.
const REPO_BASE = '/aetherium/';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? (process.env.VITE_BASE ?? REPO_BASE) : '/',
  plugins: [react()],
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
