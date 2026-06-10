import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  use: {
    baseURL: 'https://reserveaqui.netlify.app',
    headless: true,
    trace: 'on', // grava tudo
    screenshot: 'on',
    video: 'on', // grava vídeo de cada teste
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
});