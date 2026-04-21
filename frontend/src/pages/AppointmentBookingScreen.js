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
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../hooks/useNotification';
import { useBooking } from '../context/BookingContext';
import { createAppointment, getUserData } from '../services/firestoreService';
import { getDocs, collection, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { COLLECTIONS } from '../constants';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmationModal from '../components/ConfirmationModal';

const AppointmentBookingScreen = () => {
  const navigate = useNavigate();
  const { clientData, selectedService, resetBooking } = useBooking();
  const { notification, showSuccess, showError, showInfo, hideNotification } = useNotification();
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [existingAppointments, setExistingAppointments] = useState([]);
  const [serviceDetails, setServiceDetails] = useState(selectedService);
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [businessSettings, setBusinessSettings] = useState({
    workingHours: { start: 9, end: 19 },
    bookingConfig: { slotInterval: 30, maxDaysAhead: 14 }
  });

  // Cargar configuración del negocio
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsRef = doc(db, 'settings', 'business');
        const settingsSnap = await getDoc(settingsRef);
        if (settingsSnap.exists()) {
          setBusinessSettings(settingsSnap.data());
        }
      } catch (error) {
        console.warn('⚠️ No se pudo cargar configuración, usando valores por defecto');
      }
    };
    fetchSettings();
  }, []);

  // Generar fechas disponibles (próximos 14 días, excluyendo domingos)
  useEffect(() => {
    const generateAvailableDates = () => {
      const dates = [];
      const today = new Date();
      let daysAdded = 0;
      let currentDate = new Date(today);
      const maxDays = businessSettings.bookingConfig.maxDaysAhead || 14;

      while (daysAdded < maxDays) {
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
    
    // Obtener bloqueos para esta fecha
    let blockedSlots = [];
    try {
      const blockedRef = collection(db, 'blocked_slots');
      const blockedQuery = query(blockedRef, where('date', '==', date.dateString));
      const blockedSnapshot = await getDocs(blockedQuery);
      blockedSlots = blockedSnapshot.docs.map(doc => doc.data().time);
      console.log('🚫 Horarios bloqueados encontrados:', blockedSlots);
    } catch (error) {
      console.warn('⚠️ No se pudieron cargar horarios bloqueados:', error);
    }
    
    const times = [];
    
    // IMPORTANTE: Crear el objeto de fecha usando componentes individuales para evitar desfases de zona horaria
    const [year, month, day] = date.dateString.split('-').map(Number);
    const selectedDateObj = new Date(year, month - 1, day);
    
    const now = new Date();
    const serviceDuration = serviceDetails?.duration || 30;
    
    const { start, end } = businessSettings.workingHours;
    const interval = businessSettings.bookingConfig.slotInterval || 30;

    for (let hour = start; hour < end; hour++) {
      for (let minute = 0; minute < 60; minute += interval) {
        const timeSlot = new Date(selectedDateObj);
        timeSlot.setHours(hour, minute, 0, 0);
        
        // No mostrar horarios pasados para hoy
        if (date.displayName === 'Hoy' && timeSlot <= now) {
          continue;
        }

        // Verificar si el horario está ocupado por una cita
        const isOccupied = isTimeSlotOccupied(timeSlot, serviceDuration, existingAppts);
        
        // Verificar si el horario está bloqueado manualmente por el administrador
        const timeString24h = timeSlot.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false });
        const isBlocked = blockedSlots.includes(timeString24h);
        
        const finalAvailability = !isOccupied && !isBlocked;
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
          available: finalAvailability,
          occupied: isOccupied,
          blocked: isBlocked
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
      setIsSuccess(true);
      
      // Actualizar localStorage con la nueva cita
      const clientDataWithAppointment = {
        ...clientData,
        lastAppointment: appointmentData,
        totalAppointments: (clientData.totalAppointments || 0) + 1
      };
      localStorage.setItem('olimubarbershop_client', JSON.stringify(clientDataWithAppointment));

      setTimeout(() => {
        resetBooking();
        navigate('/select-service');
      }, 3000);

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

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <Card className="max-w-md w-full glass-card p-10 text-center animate-fadeIn">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-green-500 animate-bounce" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">¡Reserva Exitosa!</h2>
          <p className="text-zinc-400 mb-8 leading-relaxed">
            Tu hora ha sido agendada con éxito. Te esperamos en <span className="text-brand-amber-500 font-bold">Olimu Barbershop</span>.
          </p>
          <div className="bg-zinc-900/50 rounded-2xl p-6 mb-8 border border-zinc-800">
            <p className="text-sm text-zinc-500 uppercase tracking-widest font-bold mb-2">Servicio</p>
            <p className="text-xl font-bold text-white">{selectedService?.name}</p>
            <div className="flex items-center justify-center gap-4 mt-4 text-zinc-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4 text-brand-amber-500" />
                {selectedDate?.displayName}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-brand-amber-500" />
                {selectedTime?.timeString}
              </span>
            </div>
          </div>
          <p className="text-brand-amber-500 font-medium italic">
            "Muchas gracias por preferirnos"
          </p>
        </Card>
      </div>
    );
  }

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
            onClick={() => navigate('/select-service')}
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
                  {time.blocked && (
                    <div className="text-xs text-amber-400 mt-1">
                      Bloqueado
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

      </div>
    </div>
  );
};

export default AppointmentBookingScreen;
