// frontend/src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Importa tus estilos globales (incluido Tailwind)
import App from './App'; // Importa el componente principal de la aplicación
import reportWebVitals from './reportWebVitals'; // Para medir el rendimiento web

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App /> {/* Renderiza el componente principal de la aplicación */}
  </React.StrictMode>
);

// Si quieres empezar a medir el rendimiento en tu app, pasa una función
// para registrar los resultados (ej. reportWebVitals(console.log))
// o para enviarlos a un endpoint de analíticas.
reportWebVitals();
