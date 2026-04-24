import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const registerSW = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      // Usamos ruta relativa para compatibilidad con GitHub Pages
      navigator.serviceWorker.register('./service-worker.js')
        .then((reg) => {
          reg.onupdatefound = () => {
            const worker = reg.installing;
            if (worker) {
              worker.onstatechange = () => {
                if (worker.state === 'installed' && navigator.serviceWorker.controller) {
                  // Notificación visual de actualización
                  const updateBanner = document.createElement('div');
                  updateBanner.setAttribute('id', 'update-notification-banner');
                  updateBanner.style.cssText = `
                    position: fixed;
                    bottom: 24px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: #1e293b;
                    color: white;
                    padding: 16px 24px;
                    border-radius: 16px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.4);
                    z-index: 10000;
                    border: 1px solid #3b82f6;
                    text-align: center;
                    font-family: 'Inter', sans-serif;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    min-width: 280px;
                  `;
                  
                  updateBanner.innerHTML = `
                    <p style="margin:0; font-size: 14px; font-weight: 500;">🚀 Nueva actualización disponible</p>
                    <button id="reload-app" style="background:#3b82f6; border:none; color:white; padding:10px 20px; border-radius:8px; cursor:pointer; font-weight: bold; font-size: 13px; transition: background 0.2s;">
                      Actualizar Ahora
                    </button>
                  `;
                  
                  document.body.appendChild(updateBanner);
                  document.getElementById('reload-app')?.addEventListener('click', () => {
                    window.location.reload();
                  });
                }
              };
            }
          };
        })
        .catch(err => console.error("SW fail:", err));
    });
  }
};

registerSW();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
