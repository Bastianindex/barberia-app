// frontend/src/pages/Appointments.js
import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  where,
  updateDoc,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { 
  Calendar,
  Clock,
  User,
  Phone,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit2,
  Trash2,
  Plus,
  Search,
  Filter,
  Eye,
  MoreVertical
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../hooks/useNotification';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmationModal from '../components/ConfirmationModal';
import Notification from '../components/Notification';

const Appointments = () => {
  const { db } = useAuth();
  const { notification, showSuccess, showError, showInfo, hideNotification } = useNotification();
  
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  // Cargar citas en tiempo real
  useEffect(() => {
    if (!db) return;

    setLoading(true);
    
    try {
      const appointmentsQuery = query(
        collection(db, 'appointments'),
        orderBy('appointmentDateTime', 'desc')
      );

      const unsubscribe = onSnapshot(appointmentsQuery, (snapshot) => {
        const appointmentsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setAppointments(appointmentsData);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error loading appointments:', error);
      showError('Error al cargar las citas');
      setLoading(false);
      
      // Datos de ejemplo en caso de error
      setAppointments([
        {
          id: '1',
          clientName: 'Carlos Mendoza',
          clientPhone: '+57 300 123 4567',
          serviceName: 'Corte + Barba',
          servicePrice: 25000,
          appointmentDate: '2025-08-28',
          appointmentTime: '10:00 AM',
          status: 'confirmed',
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          clientName: 'Luis Rodriguez',
          clientPhone: '+57 301 987 6543',
          serviceName: 'Corte Clásico',
          servicePrice: 15000,
          appointmentDate: '2025-08-28',
          appointmentTime: '2:30 PM',
          status: 'pending',
          createdAt: new Date().toISOString()
        }
      ]);
    }
  }, [db, showError]);

  // Filtrar citas cuando cambian los filtros
  useEffect(() => {
    let filtered = [...appointments];

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(apt => 
        apt.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.clientPhone.includes(searchTerm) ||
        apt.serviceName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(apt => apt.status === statusFilter);
    }

    // Filtro por fecha
    if (dateFilter !== 'all') {
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      if (dateFilter === 'today') {
        filtered = filtered.filter(apt => apt.appointmentDate === today);
      } else if (dateFilter === 'tomorrow') {
        filtered = filtered.filter(apt => apt.appointmentDate === tomorrowStr);
      } else if (dateFilter === 'week') {
        const weekFromNow = new Date();
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        filtered = filtered.filter(apt => 
          new Date(apt.appointmentDate) <= weekFromNow &&
          new Date(apt.appointmentDate) >= new Date(today)
        );
      }
    }

    setFilteredAppointments(filtered);
  }, [appointments, searchTerm, statusFilter, dateFilter]);

  // Actualizar estado de cita
  const updateAppointmentStatus = async (appointmentId, newStatus) => {
    try {
      await updateDoc(doc(db, 'appointments', appointmentId), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });

      const statusMessages = {
        confirmed: 'Cita confirmada',
        completed: 'Cita marcada como completada',
        cancelled: 'Cita cancelada'
      };

      showSuccess(statusMessages[newStatus] || 'Estado actualizado');
    } catch (error) {
      console.error('Error updating appointment:', error);
      showError('Error al actualizar la cita');
    }
  };

  // Eliminar cita
  const deleteAppointment = async () => {
    if (!selectedAppointment) return;

    try {
      await deleteDoc(doc(db, 'appointments', selectedAppointment.id));
      showSuccess('Cita eliminada exitosamente');
      setShowDeleteModal(false);
      setSelectedAppointment(null);
    } catch (error) {
      console.error('Error deleting appointment:', error);
      showError('Error al eliminar la cita');
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

  // Formatear fecha
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  // Obtener color del estado
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'pending':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'completed':
        return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'cancelled':
        return 'text-red-400 bg-red-400/10 border-red-400/20';
      default:
        return 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20';
    }
  };

  // Obtener texto del estado
  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed': return 'Confirmada';
      case 'pending': return 'Pendiente';
      case 'completed': return 'Completada';
      case 'cancelled': return 'Cancelada';
      default: return 'Desconocido';
    }
  };

  if (loading) {
    return (
      <LoadingSpinner 
        type="barbershop" 
        message="Cargando citas..." 
        fullScreen={true}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Gestión de Citas</h1>
          <p className="text-zinc-400">
            {appointments.length} citas totales • {filteredAppointments.length} mostradas
          </p>
        </div>
        
        <Button className="bg-gradient-to-r from-amber-500 to-amber-600">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Cita
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-zinc-800/80 border-zinc-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="Buscar por nombre, teléfono o servicio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:ring-amber-500"
          >
            <option value="all">Todos los estados</option>
            <option value="pending">Pendientes</option>
            <option value="confirmed">Confirmadas</option>
            <option value="completed">Completadas</option>
            <option value="cancelled">Canceladas</option>
          </select>
          
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:ring-amber-500"
          >
            <option value="all">Todas las fechas</option>
            <option value="today">Hoy</option>
            <option value="tomorrow">Mañana</option>
            <option value="week">Esta semana</option>
          </select>
          
          <Button variant="secondary">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
        </div>
      </Card>

      {/* Appointments List */}
      <div className="space-y-4">
        {filteredAppointments.length > 0 ? (
          filteredAppointments.map((appointment) => (
            <Card 
              key={appointment.id}
              className="bg-zinc-800/80 border-zinc-700 hover:border-zinc-600 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  {/* Status Indicator */}
                  <div className={`w-3 h-3 rounded-full ${
                    appointment.status === 'confirmed' ? 'bg-green-400' :
                    appointment.status === 'pending' ? 'bg-yellow-400' :
                    appointment.status === 'completed' ? 'bg-blue-400' :
                    'bg-red-400'
                  }`} />

                  {/* Client Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-zinc-700 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-zinc-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">
                          {appointment.clientName}
                        </h3>
                        <p className="text-sm text-zinc-400 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {appointment.clientPhone}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-zinc-300">
                        <Calendar className="w-4 h-4 text-amber-400" />
                        <span>{formatDate(appointment.appointmentDate)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-zinc-300">
                        <Clock className="w-4 h-4 text-amber-400" />
                        <span>{appointment.appointmentTime}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-zinc-300">
                        <span>{appointment.serviceName}</span>
                        <span className="text-green-400 font-semibold">
                          {formatPrice(appointment.servicePrice)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className={`px-3 py-1 rounded-full border text-xs font-medium ${getStatusColor(appointment.status)}`}>
                    {getStatusText(appointment.status)}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4">
                  {appointment.status === 'pending' && (
                    <Button
                      size="sm"
                      onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                  )}
                  
                  {appointment.status === 'confirmed' && (
                    <Button
                      size="sm"
                      onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setSelectedAppointment(appointment);
                      setShowDeleteModal(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="bg-zinc-800/50 text-center py-12">
            <Calendar className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-zinc-400 mb-2">
              No se encontraron citas
            </h3>
            <p className="text-zinc-500">
              {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'No hay citas programadas aún'
              }
            </p>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedAppointment && (
        <ConfirmationModal
          title="Eliminar Cita"
          message={
            <div className="text-left space-y-2">
              <p className="text-center mb-4">¿Estás seguro de que quieres eliminar esta cita?</p>
              <div className="bg-zinc-700/50 p-3 rounded text-sm">
                <p><strong>Cliente:</strong> {selectedAppointment.clientName}</p>
                <p><strong>Servicio:</strong> {selectedAppointment.serviceName}</p>
                <p><strong>Fecha:</strong> {formatDate(selectedAppointment.appointmentDate)}</p>
                <p><strong>Hora:</strong> {selectedAppointment.appointmentTime}</p>
              </div>
              <p className="text-xs text-zinc-500 text-center mt-4">
                Esta acción no se puede deshacer
              </p>
            </div>
          }
          onConfirm={deleteAppointment}
          onCancel={() => {
            setShowDeleteModal(false);
            setSelectedAppointment(null);
          }}
          confirmText="Sí, eliminar"
          cancelText="Cancelar"
          type="danger"
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
  );
};

export default Appointments;
