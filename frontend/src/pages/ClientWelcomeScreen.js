// frontend/src/pages/ClientWelcomeScreen.js
import React from 'react';
import { 
  Scissors,
  MessageSquare,
  Clock,
  MapPin,
  Star,
  Settings
} from 'lucide-react';

const ClientWelcomeScreen = ({ onOwnerAccess }) => {
  const handleWhatsAppContact = () => {
    // Número de WhatsApp de la barbería (puedes cambiarlo por el real)
    const phoneNumber = "+573001234567"; // Cambiar por el número real
    const message = encodeURIComponent(
      "¡Hola! Me gustaría agendar una cita en Olimu BarberShop. ¿Podrían ayudarme con los horarios disponibles?"
    );
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 text-white">
      {/* Header con acceso discreto para el dueño */}
      <div className="relative px-4 py-4">
        <button
          onClick={onOwnerAccess}
          className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-zinc-300 transition-colors"
          title="Acceso dueño"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Contenido principal */}
      <div className="max-w-md mx-auto px-6 pt-8">
        {/* Logo y título */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-500 rounded-full mb-6">
            <Scissors className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Olimu BarberShop</h1>
          <p className="text-zinc-400 text-lg">Tu estilo, nuestra pasión</p>
        </div>

        {/* Información de la barbería */}
        <div className="bg-zinc-800/50 rounded-2xl p-6 mb-8 border border-zinc-700">
          <h2 className="text-xl font-semibold mb-4 text-center">Información</h2>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-400" />
              <div>
                <p className="font-medium">Horarios</p>
                <p className="text-sm text-zinc-400">Lun - Sáb: 9:00 AM - 8:00 PM</p>
                <p className="text-sm text-zinc-400">Dom: 10:00 AM - 6:00 PM</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-amber-400" />
              <div>
                <p className="font-medium">Ubicación</p>
                <p className="text-sm text-zinc-400">Calle Principal #123</p>
                <p className="text-sm text-zinc-400">Centro, Ciudad</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Star className="w-5 h-5 text-amber-400" />
              <div>
                <p className="font-medium">Calificación</p>
                <p className="text-sm text-zinc-400">4.8 ⭐ (150+ reseñas)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Servicios populares */}
        <div className="bg-zinc-800/50 rounded-2xl p-6 mb-8 border border-zinc-700">
          <h2 className="text-xl font-semibold mb-4 text-center">Servicios Populares</h2>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2">
              <span className="font-medium">Corte Clásico</span>
              <span className="text-amber-400 font-bold">$15.000</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="font-medium">Corte + Barba</span>
              <span className="text-amber-400 font-bold">$25.000</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="font-medium">Afeitado Tradicional</span>
              <span className="text-amber-400 font-bold">$18.000</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="font-medium">Corte Premium</span>
              <span className="text-amber-400 font-bold">$35.000</span>
            </div>
          </div>
        </div>

        {/* Botón principal de WhatsApp */}
        <div className="text-center">
          <button
            onClick={handleWhatsAppContact}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-2xl transition-colors duration-200 flex items-center justify-center gap-3 text-lg shadow-lg"
          >
            <MessageSquare className="w-6 h-6" />
            Agendar por WhatsApp
          </button>
          
          <p className="text-sm text-zinc-400 mt-4">
            Contacta con nosotros para agendar tu cita y conocer disponibilidad
          </p>
        </div>

        {/* Información adicional */}
        <div className="mt-8 text-center">
          <p className="text-xs text-zinc-500">
            💡 Tip: Menciona el servicio que deseas al contactarnos
          </p>
        </div>
      </div>
    </div>
  );
};

export default ClientWelcomeScreen;
