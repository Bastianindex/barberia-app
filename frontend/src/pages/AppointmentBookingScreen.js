// frontend/src/pages/AppointmentBookingScreen.js
import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  Calendar,
  Clock,
  User,
  Phone,
  Scissors,
  ArrowRight,
  Check,
  AlertCircle
} from 'lucide-react';
import { useNotification } from '../hooks/useNotification';
import { createAppointment, getUserData } from '../services/firestoreService';
import { getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { COLLECTIONS } from '../constants';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmationModal from '../components/ConfirmationModal';
import Notification from '../components/Notification';

const AppointmentBookingScreen = ({ 
  clientData, 
  selectedService, 
  onGoBack, 
  onBookAppointment 
}) => {
  const { notification, showSuccess, showError, showInfo, hideNotification } = useNotification();
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [existingAppointments, setExistingAppointments] = useState([]);
  const [serviceDetails, setServiceDetails] = useState(selectedService);
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Generar fechas disponibles (próximos 14 días, excluyendo domingos)
  useEffect(() => {
    const generateAvailableDates = () => {
      const dates = [];
      const today = new Date();
      let daysAdded = 0;
      let currentDate = new Date(today);

      while (daysAdded < 14) {
        // Excluir domingos (0 = domingo)
        if (currentDate.getDay() !== 0) {
          dates.push({
            date: new Date(currentDate),
            dateString: currentDate.toISOString().split('T')[0],
            displayName: daysAdded === 0 ? 'Hoy' : 
                        daysAdded === 1 ? 'Mañana' : 
                        currentDate.toLocaleDateString('es-CO', { 
                          weekday: 'long', 
                          day: 'numeric', 
                          month: 'short' 
                        }),
            dayOfWeek: currentDate.toLocaleDateString('es-CO', { weekday: 'short' })
          });
          daysAdded++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      setAvailableDates(dates);
    };

    generateAvailableDates();
  }, []);

  // Generar horarios disponibles cuando se selecciona una fecha
  useEffect(() => {
    if (selectedDate) {
      generateAvailableTimes(selectedDate).catch(error => {
        console.error('❌ Error generando horarios:', error);
        setAvailableTimes([]);
      });
    }
  }, [selectedDate]);

  // Obtener citas existentes para una fecha específica
  const getExistingAppointments = async (dateString) => {
    try {
      console.log('🔍 Obteniendo citas existentes para:', dateString);
      
      const appointmentsRef = collection(db, 'appointments');
      const q = query(
        appointmentsRef, 
        where('appointmentDate', '==', dateString),
        where('status', 'in', ['confirmed', 'pending']) // Solo citas activas
      );
      
      const snapshot = await getDocs(q);
      const appointments = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        appointments.push({
          id: doc.id,
          appointmentTime: data.appointmentTime,
          appointmentDateTime: data.appointmentDateTime,
          serviceDuration: data.serviceDuration || 30
        });
      });
      
      console.log('📅 Citas encontradas:', appointments);
      setExistingAppointments(appointments);
      return appointments;
      
    } catch (error) {
      console.error('❌ Error obteniendo citas existentes:', error);
      setExistingAppointments([]);
      return [];
    }
  };

  // Verificar si un horario está ocupado
  const isTimeSlotOccupied = (timeSlot, serviceDuration, existingAppts) => {
    const slotStart = new Date(timeSlot);
    const slotEnd = new Date(slotStart);
    slotEnd.setMinutes(slotEnd.getMinutes() + serviceDuration);
    
    return existingAppts.some(appointment => {
      const appointmentStart = new Date(appointment.appointmentDateTime);
      const appointmentEnd = new Date(appointmentStart);
      appointmentEnd.setMinutes(appointmentEnd.getMinutes() + appointment.serviceDuration);
      
      // Verificar si hay solapamiento
      return (slotStart < appointmentEnd) && (slotEnd > appointmentStart);
    });
  };

  // Generar horarios disponibles considerando citas existentes
  const generateAvailableTimes = async (date) => {
    console.log('⏰ Generando horarios para:', date.dateString);
    
    // Obtener citas existentes para esta fecha
    const existingAppts = await getExistingAppointments(date.dateString);
    
    const times = [];
    const selectedDateObj = new Date(date.dateString);
    const now = new Date();
    const serviceDuration = serviceDetails?.duration || 30;
    
    // Horarios de trabajo: 9:00 AM - 7:00 PM
    const workingHours = {
      start: 9,
      end: 19
    };

    for (let hour = workingHours.start; hour < workingHours.end; hour++) {
      for (let minute of [0, 30]) {
        const timeSlot = new Date(selectedDateObj);
        timeSlot.setHours(hour, minute, 0, 0);
        
        // No mostrar horarios pasados para hoy
        if (date.displayName === 'Hoy' && timeSlot <= now) {
          continue;
        }

        // Verificar si el horario está ocupado
        const isOccupied = isTimeSlotOccupied(timeSlot, serviceDuration, existingAppts);
        
        // Agregar duración del servicio para mostrar cuando termina
        const endTime = new Date(timeSlot);
        endTime.setMinutes(endTime.getMinutes() + serviceDuration);

        times.push({
          time: timeSlot,
          timeString: timeSlot.toLocaleTimeString('es-CO', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          }),
          endTime: endTime,
          available: !isOccupied,
          occupied: isOccupied
        });
      }
    }

    console.log('⏰ Horarios generados:', times.length, 'disponibles:', times.filter(t => t.available).length);
    setAvailableTimes(times);
  };

  // Manejar selección de fecha
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedTime(null);
  };

  // Manejar selección de hora
  const handleTimeSelect = (time) => {
    setSelectedTime(time);
  };

  // Mostrar modal de confirmación
  const handleBookingConfirm = () => {
    if (!selectedDate || !selectedTime) {
      showError('Por favor, selecciona fecha y hora');
      return;
    }
    if (!serviceDetails || !serviceDetails.id) {
      showError('Error: Datos del servicio no disponibles');
      return;
    }
    setShowConfirmModal(true);
  };

  // Confirmar y crear la cita
  const confirmBooking = async () => {
    setShowConfirmModal(false);
    setLoading(true);

    try {
      console.log('=== CONFIRMANDO CITA ===');
      console.log('clientData:', clientData);
      console.log('clientData.id:', clientData?.id);
      console.log('serviceDetails:', serviceDetails);
      console.log('selectedDate:', selectedDate);
      console.log('selectedTime:', selectedTime);

      // Validar que tenemos el ID del cliente
      if (!clientData?.id) {
        console.error('ERROR: clientData.id está undefined');
        throw new Error('ID de cliente no válido. Por favor, regístrate nuevamente.');
      }

      const appointmentData = {
        clientId: clientData.id,
        clientName: clientData.name,
        clientPhone: clientData.phone,
        clientEmail: clientData.email || null,
        serviceId: serviceDetails?.id,
        serviceName: serviceDetails?.name,
        servicePrice: serviceDetails?.price,
        serviceDuration: serviceDetails?.duration,
        appointmentDate: selectedDate.dateString,
        appointmentTime: selectedTime.timeString,
        appointmentDateTime: selectedTime.time.toISOString(),
        status: 'confirmed',
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('Datos de la cita a crear:', appointmentData);

      const appointmentRef = await createAppointment(appointmentData);
      
      console.log('Cita creada exitosamente:', appointmentRef);
      
      showSuccess('¡Cita agendada exitosamente!');
      
      // Actualizar localStorage con la nueva cita
      const clientDataWithAppointment = {
        ...clientData,
        lastAppointment: appointmentData,
        totalAppointments: (clientData.totalAppointments || 0) + 1
      };
      localStorage.setItem('olimubarbershop_client', JSON.stringify(clientDataWithAppointment));

      setTimeout(() => {
        onBookAppointment?.({
          ...appointmentData,
          id: appointmentRef.id
        });
      }, 2000);

    } catch (error) {
      console.error('Error creating appointment:', error);
      showError('Error al agendar la cita. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Formatear precio
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  };

  if (loading) {
    return (
      <LoadingSpinner 
        type="barbershop" 
        message="Agendando tu cita..." 
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

        {/* Service Summary */}
        <Card className="mb-8 bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 backdrop-blur-sm border-zinc-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
              <Scissors className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white mb-1">
                Agendar Cita
              </h1>
              <p className="text-zinc-400 text-sm">
                {clientData?.name} • {serviceDetails?.name}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-amber-400">
                {formatPrice(serviceDetails?.price)}
              </p>
              <p className="text-sm text-zinc-400">
                {serviceDetails?.duration} min
              </p>
            </div>
          </div>
        </Card>

        {/* Date Selection */}
        <Card className="mb-6 bg-zinc-800/80 border-zinc-700">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-400" />
              Selecciona una fecha
            </h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {availableDates.map((date, index) => (
              <button
                key={index}
                onClick={() => handleDateSelect(date)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedDate?.dateString === date.dateString
                    ? 'border-amber-500 bg-amber-500/20 text-amber-400'
                    : 'border-zinc-600 bg-zinc-700/50 text-zinc-300 hover:border-zinc-500'
                }`}
              >
                <div className="text-sm font-medium">
                  {date.displayName}
                </div>
                <div className="text-xs text-zinc-400 mt-1">
                  {date.dayOfWeek}
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Time Selection */}
        {selectedDate && (
          <Card className="mb-6 bg-zinc-800/80 border-zinc-700">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                Selecciona una hora
              </h2>
              <p className="text-sm text-zinc-400 mt-1">
                Horarios disponibles para {selectedDate.displayName}
              </p>
            </div>
            
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3 max-h-64 overflow-y-auto">
              {availableTimes.map((time, index) => (
                <button
                  key={index}
                  onClick={() => handleTimeSelect(time)}
                  disabled={!time.available}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedTime?.timeString === time.timeString
                      ? 'border-amber-500 bg-amber-500/20 text-amber-400'
                      : time.available
                        ? 'border-zinc-600 bg-zinc-700/50 text-zinc-300 hover:border-zinc-500'
                        : 'border-red-700 bg-red-800/50 text-red-400 cursor-not-allowed'
                  }`}
                >
                  <div className="text-sm font-medium">
                    {time.timeString}
                  </div>
                  {time.occupied && (
                    <div className="text-xs text-red-400 mt-1">
                      Ocupado
                    </div>
                  )}
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Summary and Confirm */}
        {selectedDate && selectedTime && (
          <Card className="bg-gradient-to-r from-amber-500/10 to-amber-600/10 border-amber-500/50">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">
                Resumen de tu cita
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-zinc-300">
                  <User className="w-5 h-5 text-amber-400" />
                  <span>{clientData?.name}</span>
                </div>
                
                <div className="flex items-center gap-3 text-zinc-300">
                  <Phone className="w-5 h-5 text-amber-400" />
                  <span>{clientData?.phone}</span>
                </div>
                
                <div className="flex items-center gap-3 text-zinc-300">
                  <Scissors className="w-5 h-5 text-amber-400" />
                  <span>{serviceDetails?.name}</span>
                </div>
                
                <div className="flex items-center gap-3 text-zinc-300">
                  <Calendar className="w-5 h-5 text-amber-400" />
                  <span>{selectedDate.displayName}</span>
                </div>
                
                <div className="flex items-center gap-3 text-zinc-300">
                  <Clock className="w-5 h-5 text-amber-400" />
                  <span>{selectedTime.timeString}</span>
                </div>
              </div>

              <div className="border-t border-amber-500/20 pt-4">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span className="text-white">Total:</span>
                  <span className="text-amber-400">
                    {formatPrice(serviceDetails?.price)}
                  </span>
                </div>
              </div>

              <Button
                onClick={handleBookingConfirm}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
              >
                <Check className="w-5 h-5 mr-2" />
                Confirmar Cita
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </Card>
        )}

        {/* Instructions */}
        <Card className="mt-6 bg-zinc-800/50 border-zinc-700">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
            <h4 className="font-semibold text-white mb-2">Instrucciones importantes</h4>
            <ul className="text-sm text-zinc-400 space-y-1">
              <li>• Llega 5 minutos antes de tu cita</li>
              <li>• Si necesitas cancelar, avisa con 2 horas de anticipación</li>
              <li>• Trae una identificación válida</li>
            </ul>
          </div>
        </Card>

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <ConfirmationModal
            title="Confirmar Cita"
            message={
              <div className="text-left space-y-2">
                <p className="text-center mb-4">¿Confirmas que quieres agendar esta cita?</p>
                <div className="bg-zinc-700/50 p-3 rounded text-sm">
                  <p><strong>Servicio:</strong> {serviceDetails?.name}</p>
                  <p><strong>Fecha:</strong> {selectedDate?.displayName}</p>
                  <p><strong>Hora:</strong> {selectedTime?.timeString}</p>
                  <p><strong>Total:</strong> {formatPrice(serviceDetails?.price)}</p>
                </div>
              </div>
            }
            onConfirm={confirmBooking}
            onCancel={() => setShowConfirmModal(false)}
            confirmText="Sí, agendar"
            cancelText="Cancelar"
            type="warning"
          />
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

export default AppointmentBookingScreen;
