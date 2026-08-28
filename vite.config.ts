import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // The Express middleware server is reached through a preview proxy that
      // does not forward Vite's WebSocket upgrade. Keep the client from
      // opening a socket that can never complete.
      hmr: false,
      watch: null,
    },
  };
});
