// frontend/src/pages/ServiceSelectionScreen.js
import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  Scissors,
  Clock,
  DollarSign,
  ArrowRight,
  Check,
  Star
} from 'lucide-react';
import { useNotification } from '../hooks/useNotification';
import { getActiveServices } from '../services/firestoreService';
import { COLLECTIONS } from '../constants';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import Notification from '../components/Notification';

const ServiceSelectionScreen = ({ 
  clientData, 
  onGoBack, 
  onServiceSelected 
}) => {
  const { notification, showSuccess, showError, showInfo, hideNotification } = useNotification();
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Cargar servicios disponibles
  useEffect(() => {
    const loadServices = async () => {
      setLoading(true);
      try {
        const servicesData = await getActiveServices();
        setServices(servicesData);
        
        if (servicesData.length === 0) {
          showInfo('No hay servicios disponibles en este momento');
        }
      } catch (error) {
        console.error('Error loading services:', error);
        showError('Error al cargar los servicios');
        
        // Servicios de fallback en caso de error
        setServices([
          {
            id: 'corte-clasico',
            name: 'Corte Clásico',
            description: 'Corte tradicional con tijera y máquina',
            price: 15000,
            duration: 30,
            category: 'corte',
            isActive: true
          },
          {
            id: 'corte-barba',
            name: 'Corte + Barba',
            description: 'Corte completo más arreglo de barba',
            price: 25000,
            duration: 45,
            category: 'corte',
            isActive: true
          },
          {
            id: 'solo-barba',
            name: 'Solo Barba',
            description: 'Arreglo y perfilado de barba',
            price: 12000,
            duration: 20,
            category: 'barba',
            isActive: true
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadServices();
  }, [showError, showInfo]);

  // Manejar selección de servicio
  const handleServiceSelect = (service) => {
    setSelectedService(service);
  };

  // Continuar con el servicio seleccionado
  const handleContinue = () => {
    if (!selectedService) {
      showError('Por favor, selecciona un servicio');
      return;
    }

    showSuccess(`¡Excelente elección! ${selectedService.name} seleccionado`);
    
    setTimeout(() => {
      onServiceSelected?.({
        ...selectedService,
        clientData
      });
    }, 1000);
  };

  // Formatear precio en pesos colombianos
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  };

  // Formatear duración
  const formatDuration = (minutes) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  };

  if (loading) {
    return (
      <LoadingSpinner 
        type="barbershop" 
        message="Cargando servicios..." 
        fullScreen={true}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={onGoBack}
            className="flex items-center gap-2 text-zinc-400 hover:text-white"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Regresar</span>
          </Button>
        </div>

        {/* Welcome Message */}
        <Card className="mb-8 text-center bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 backdrop-blur-sm border-zinc-700">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mr-3">
              <Scissors className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                ¡Hola {clientData?.name}!
              </h1>
              <p className="text-sm text-zinc-400">Selecciona tu servicio</p>
            </div>
          </div>
          <p className="text-zinc-300">
            Elige el servicio que mejor se adapte a lo que necesitas hoy
          </p>
        </Card>

        {/* Services Grid */}
        <div className="space-y-4 mb-8">
          {services.map((service) => (
            <Card
              key={service.id}
              className={`cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
                selectedService?.id === service.id
                  ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 border-amber-500 shadow-lg shadow-amber-500/20'
                  : 'bg-zinc-800/80 border-zinc-700 hover:border-zinc-600'
              }`}
              onClick={() => handleServiceSelect(service)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      selectedService?.id === service.id 
                        ? 'bg-amber-500' 
                        : 'bg-zinc-700'
                    }`}>
                      <Scissors className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {service.name}
                      </h3>
                      {service.category && (
                        <span className="text-xs text-amber-400 uppercase tracking-wide">
                          {service.category}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-zinc-400 text-sm mb-3">
                    {service.description}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-green-400">
                      <DollarSign className="w-4 h-4" />
                      <span className="font-semibold">
                        {formatPrice(service.price)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-blue-400">
                      <Clock className="w-4 h-4" />
                      <span>{formatDuration(service.duration)}</span>
                    </div>
                  </div>
                </div>

                {/* Selection Indicator */}
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                  selectedService?.id === service.id
                    ? 'border-amber-500 bg-amber-500'
                    : 'border-zinc-600'
                }`}>
                  {selectedService?.id === service.id && (
                    <Check className="w-4 h-4 text-white" />
                  )}
                </div>
              </div>

              {/* Popular Badge */}
              {service.isPopular && (
                <div className="absolute top-2 right-2">
                  <div className="bg-amber-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    <span>Popular</span>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Continue Button */}
        {selectedService && (
          <Card className="bg-gradient-to-r from-amber-500/10 to-amber-600/10 border-amber-500/50">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white mb-2">
                Servicio Seleccionado
              </h3>
              <p className="text-amber-400 font-medium mb-4">
                {selectedService.name} - {formatPrice(selectedService.price)}
              </p>
              
              <Button
                onClick={handleContinue}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
              >
                Continuar con {selectedService.name}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </Card>
        )}

        {/* Empty State */}
        {services.length === 0 && !loading && (
          <Card className="text-center bg-zinc-800/50">
            <div className="py-8">
              <Scissors className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-zinc-400 mb-2">
                No hay servicios disponibles
              </h3>
              <p className="text-zinc-500 text-sm">
                Por favor, contacta al barbershop para más información
              </p>
            </div>
          </Card>
        )}

        {/* Notifications */}
        {notification && (
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={hideNotification}
          />
        )}
      </div>
    </div>
  );
};

export default ServiceSelectionScreen;
