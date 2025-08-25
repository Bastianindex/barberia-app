// frontend/src/pages/ServiceSelectionScreen.js
import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  Scissors,
  Clock,
  DollarSign,
  ArrowRight
} from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import Notification from '../components/Notification';

const ServiceSelectionScreen = ({ 
  clientData, 
  onGoBack, 
  onServiceSelected 
}) => {
  // Estados principales
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  
  // Cargar servicios disponibles
  useEffect(() => {
    const loadServices = async () => {
      try {
        if (!db) {
          setServices([]);
          setLoading(false);
          return;
        }
        
        // Cargar servicios desde la colección services
        const servicesRef = collection(db, 'services');
        const q = query(servicesRef, where('isActive', '==', true));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const servicesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setServices(servicesData);
        } else {
          setServices([]);
        }
      } catch (error) {
        console.error('Error loading services:', error);
        setServices([]);
        showNotification('Error al cargar servicios', 'error');
      }
      
      setLoading(false);
    };
    
    loadServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Función para mostrar notificaciones
  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 4000);
  };
  
  // Manejar selección de servicio
  const handleServiceSelection = (service) => {
    setSelectedService(service);
  };
  
  // Continuar con el servicio seleccionado
  const handleContinue = () => {
    if (!selectedService) {
      showNotification('Por favor, selecciona un servicio', 'error');
      return;
    }
    
    if (onServiceSelected) {
      onServiceSelected(selectedService);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      {/* Header */}
      <div className="bg-zinc-800 border-b border-zinc-700 px-4 py-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button
            onClick={onGoBack}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Regresar</span>
          </button>
          
          <div className="flex items-center gap-2">
            <Scissors className="w-6 h-6 text-amber-400" />
            <h1 className="text-lg font-bold">BarberShop</h1>
          </div>
        </div>
      </div>
      
      <div className="max-w-md mx-auto p-6">
        {/* Información del cliente */}
        <div className="bg-zinc-800 rounded-lg p-4 mb-6 border border-zinc-700">
          <h2 className="text-lg font-semibold text-amber-400 mb-2">
            ¡Hola {clientData?.name}!
          </h2>
          <p className="text-zinc-300 text-sm">
            Selecciona el servicio que deseas para tu cita
          </p>
        </div>
        
        {/* Lista de servicios */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Nuestros Servicios</h3>
          
          <div className="space-y-3">
            {services.map((service) => (
              <div
                key={service.id}
                onClick={() => handleServiceSelection(service)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedService?.id === service.id
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-zinc-600 bg-zinc-800 hover:border-zinc-500'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-white">{service.name}</h4>
                  <div className="text-right">
                    <div className="text-amber-400 font-bold">
                      ${service.price?.toLocaleString()}
                    </div>
                  </div>
                </div>
                
                <p className="text-zinc-400 text-sm mb-3">
                  {service.description}
                </p>
                
                <div className="flex items-center gap-4 text-xs text-zinc-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{service.duration} min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    <span>Precio incluye todo</span>
                  </div>
                </div>
                
                {selectedService?.id === service.id && (
                  <div className="mt-3 p-2 bg-amber-500/20 rounded text-amber-400 text-sm flex items-center gap-2">
                    <Scissors className="w-4 h-4" />
                    <span>Servicio seleccionado</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Botón Continue */}
        <button
          onClick={handleContinue}
          disabled={!selectedService}
          className={`w-full py-4 rounded-lg font-semibold text-lg transition-all flex items-center justify-center gap-2 ${
            selectedService
              ? 'bg-amber-500 hover:bg-amber-600 text-black'
              : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
          }`}
        >
          {selectedService ? (
            <>
              <span>CONTINUAR</span>
              <ArrowRight className="w-5 h-5" />
            </>
          ) : (
            'SELECCIONA UN SERVICIO'
          )}
        </button>
        
        {/* Información adicional */}
        <div className="mt-6 text-center text-sm text-zinc-400">
          <p>Todos nuestros servicios incluyen asesoramiento personalizado</p>
          <p>Horarios disponibles de 9:00 AM a 9:00 PM</p>
        </div>
      </div>
      
      {/* Notificación */}
      <Notification
        show={notification.show}
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification({ show: false, message: '', type: '' })}
      />
    </div>
  );
};

export default ServiceSelectionScreen;
