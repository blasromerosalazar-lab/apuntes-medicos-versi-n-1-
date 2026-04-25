import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  
  return {
    plugins: [react(), tailwindcss()],
    // Base relativa para GitHub Pages
    base: './',
    server: {
      port: 3000,
      host: true,
      strictPort: true,
      hmr: {
        // Redirección segura para el proxy de Google AI Studio
        protocol: 'wss',
        clientPort: 443,
        path: 'vite-hmr'
      },
      watch: {
        // Vital para entornos de contenedores cloud
        usePolling: true
      },
      allowedHosts: [
        '.us-west1.run.app',
        'localhost'
      ]
    },
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY),
      'process.env': {}, 
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      emptyOutDir: true,
      target: 'esnext',
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './'),
      },
    },
  };
});
