// frontend/src/components/Notification.js
import React, { useEffect } from 'react';
import { CheckCircle, XCircle } from 'lucide-react'; // Iconos

// Componente para mostrar notificaciones tipo pop-up
const Notification = ({ message, type, onClose, duration = 3000 }) => {
  // Define los estilos de fondo y los íconos según el tipo de notificación
  const bgColor = type === 'success' ? 'bg-green-600' : (type === 'error' ? 'bg-red-600' : 'bg-blue-600');
  const icon = type === 'success' ? <CheckCircle size={20} /> : (type === 'error' ? <XCircle size={20} /> : <span className="text-xl">ℹ️</span>);

  // Efecto para ocultar la notificación automáticamente después de una duración
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer); // Limpia el temporizador si el componente se desmonta o el mensaje cambia
  }, [duration, onClose, message]); // Se ejecuta cada vez que cambia la duración, onClose o el mensaje

  return (
    <div className={`fixed bottom-4 right-4 ${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 z-50`}>
      {icon} {/* Muestra el ícono correspondiente */}
      <span>{message}</span> {/* Muestra el mensaje */}
      <button onClick={onClose} className="ml-4 text-white hover:text-gray-200">
        &times; {/* Botón para cerrar manualmente la notificación */}
      </button>
    </div>
  );
};

export default Notification;
