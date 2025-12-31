
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

console.log("Iniciando Gold Clash no GitHub Pages...");

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("Erro crítico: Elemento root não encontrado no DOM.");
} else {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("Aplicação montada com sucesso.");
  } catch (err) {
    console.error("Erro fatal durante a renderização:", err);
    rootElement.innerHTML = `
      <div style="background: #fff; color: #000; padding: 20px; border: 10px solid #3e2723; margin: 20px; font-family: 'VT323', monospace; text-align: center;">
        <h2 style="color: #ff0000; font-size: 30px;">ERRO DE CARREGAMENTO</h2>
        <p style="font-size: 20px;">O Oráculo encontrou um erro ao iniciar os módulos.</p>
        <pre style="background: #eee; padding: 10px; margin-top: 10px; white-space: pre-wrap;">${err instanceof Error ? err.message : String(err)}</pre>
        <p style="margin-top: 10px;">Verifique se a internet está estável para baixar as bibliotecas externas.</p>
      </div>
    `;
  }
}
