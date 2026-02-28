import { defineConfig } from 'vite';

export default defineConfig({
  publicDir: 'public',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'index.html',
        boardTest: 'board_test.html'
      }
    }
  },
  test: {
    environment: 'jsdom'
  }
});
