import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  
  return {
    plugins: [react(), tailwindcss()],
    // Vital para GitHub Pages: rutas relativas
    base: './',
    server: {
      port: 3000,
      host: '0.0.0.0',
      strictPort: true,
      hmr: {
        // Requerido para entornos de Google AI Studio / Cloud Run
        protocol: 'wss',
        clientPort: 443,
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
