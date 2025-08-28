// frontend/src/components/ConfirmationModal.js
import React from 'react';
import Button from './ui/Button';
import Card from './ui/Card';
import { AlertTriangle } from 'lucide-react';

/**
 * Modal de confirmación refactorizado usando nuevos componentes UI
 */
const ConfirmationModal = ({ 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = "Confirmar", 
  cancelText = "Cancelar", 
  showCancelButton = true,
  type = 'warning',
  title = 'Confirmar acción'
}) => {
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && onCancel) {
      onCancel();
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />;
      case 'warning':
        return <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />;
      default:
        return null;
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={handleBackdropClick}
    >
      <Card className="max-w-md w-full bg-zinc-800 border-zinc-700 animate-scale-in">
        <div className="text-center">
          {getIcon()}
          
          <h3 className="text-lg font-semibold text-white mb-2">
            {title}
          </h3>
          
          <div className="text-zinc-300 mb-6">
            {message}
          </div>

          <div className="flex justify-center gap-3">
            {showCancelButton && (
              <Button
                variant="secondary"
                onClick={onCancel}
                className="min-w-[100px]"
              >
                {cancelText}
              </Button>
            )}
            
            <Button
              variant={type === 'danger' ? 'danger' : 'primary'}
              onClick={onConfirm}
              className="min-w-[100px]"
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ConfirmationModal;
