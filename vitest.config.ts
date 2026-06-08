import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import path from 'path';

export default defineConfig(({ mode }) => {
  // Carrega variáveis do .env.test quando rodando testes
  const env = loadEnv("test", process.cwd(), "");
  process.env.DATABASE_URL = env.DATABASE_URL;

  return {
    test: {
      include: ['tests/**/*.test.ts'],
      environment: 'node',
      globals: true,
      setupFiles: ['./vitest.setup.ts'],
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './'),
      },
    },
  };
});
