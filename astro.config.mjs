import { defineConfig, envField } from 'astro/config';

export default defineConfig({
  outDir: process.env.OUT_DIR ?? './dist',
  env: {
    schema: {
      PUBLIC_CONSULT_ENDPOINT: envField.string({ context: 'client', access: 'public', optional: true, url: true }),
      PUBLIC_KAKAO_CHANNEL_URL: envField.string({ context: 'client', access: 'public', optional: true, url: true }),
    },
  },
});
