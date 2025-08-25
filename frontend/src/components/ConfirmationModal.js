// frontend/src/components/ConfirmationModal.js
import React from 'react';

// Componente para mostrar un modal de confirmación
const ConfirmationModal = ({ message, onConfirm, onCancel, confirmText = "Confirmar", cancelText = "Cancelar", showCancelButton = true }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-800 p-8 rounded-2xl shadow-xl border border-zinc-700 max-w-sm w-full text-white text-center">
        <div className="mb-6">{message}</div> {/* Cambiado de <p> a <div> para permitir contenido JSX */}
        <div className="flex justify-center space-x-4">
          {showCancelButton && ( // Muestra el botón de cancelar si showCancelButton es true
            <button
              onClick={onCancel}
              className="bg-zinc-700 hover:bg-zinc-600 text-white font-bold py-2 px-5 rounded-lg transition duration-200"
            >
              {cancelText} {/* Texto del botón de cancelar */}
            </button>
          )}
          <button
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-5 rounded-lg transition duration-200"
          >
            {confirmText} {/* Texto del botón de confirmar */}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
