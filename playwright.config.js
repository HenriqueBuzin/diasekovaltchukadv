import { defineConfig, devices } from '@playwright/test';

const python = process.env.PYTHON || 'python';
const browserChannel = process.env.PLAYWRIGHT_CHANNEL;
const channel = browserChannel ? { channel: browserChannel } : {};
process.env.PLAYWRIGHT_PORT ||= String(20_000 + (process.pid % 20_000));
const port = Number(process.env.PLAYWRIGHT_PORT);
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  use: {
    baseURL,
    trace: 'retain-on-failure'
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], ...channel } },
    {
      name: 'mobile',
      use: { ...devices['iPhone SE'], browserName: 'chromium', ...channel }
    }
  ],
  webServer: {
    command: `${python} src/main.py`,
    url: `${baseURL}/`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      FLASK_SECRET_KEY: 'e2e-secret',
      FLASK_DEBUG: 'false',
      MAIL_SERVER: 'localhost',
      MAIL_PORT: '25',
      MAIL_USE_TLS: 'false',
      MAIL_USE_SSL: 'false',
      MAIL_USERNAME: 'site@example.com',
      MAIL_PASSWORD: 'password',
      CONTACT_EMAIL: 'contato@example.com',
      WHATS_NUMBER: '55 (48) 98802-6847',
      SOCIAL_FB_URL: 'https://facebook.com/example',
      SOCIAL_IG_URL: 'https://instagram.com/example',
      CAPTCHA_ENABLED: 'false',
      CONTACT_TO: 'destino@example.com',
      ASSET_VERSION: 'e2e',
      PORT: String(port)
    }
  }
});
