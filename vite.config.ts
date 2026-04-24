import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  
  return {
    plugins: [react(), tailwindcss()],
    // Base ./ es vital para que GitHub Pages cargue los assets correctamente
    base: './',
    server: {
      port: 3000,
      host: '0.0.0.0',
      strictPort: true,
      hmr: {
        // Forzamos puerto 443 para el WebSocket de HMR en entornos cloud
        clientPort: 443,
        protocol: 'wss',
        path: 'hmr/'
      },
      allowedHosts: [
        '.us-west1.run.app',
        'localhost'
      ]
    },
    define: {
      // Pasamos la API KEY al cliente de forma segura
      'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY),
      'process.env': {}, 
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      emptyOutDir: true,
      sourcemap: false,
      target: 'esnext',
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './'),
      },
    },
  };
});
