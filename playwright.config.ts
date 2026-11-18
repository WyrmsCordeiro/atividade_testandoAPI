import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './api-testing-playwright/test',
  use: {
    baseURL: 'http://localhost:3000',
  },
});