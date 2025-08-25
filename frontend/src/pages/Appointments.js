// frontend/src/pages/Appointments.js
import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot,
  query,
  orderBy
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
  Save,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ConfirmationModal from '../components/ConfirmationModal';
import Notification from '../components/Notification';

const Appointments = () => {
  const { db, userId } = useAuth();
  
  // Estados principales
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  
  // Estados del formulario
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    serviceId: '',
    serviceName: '',
    date: '',
    time: '',
    status: 'pending',
    notes: '',
    totalAmount: 0
  });
  
  // Estados de modales y notificaciones
  const [deleteModal, setDeleteModal] = useState({ show: false, appointmentId: null });
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  
  // Mock data para desarrollo
  const mockServices = [
    { id: '1', name: 'Corte Clásico', price: 15000, duration: 30, isActive: true },
    { id: '2', name: 'Corte + Barba', price: 25000, duration: 45, isActive: true },
    { id: '3', name: 'Afeitado Tradicional', price: 18000, duration: 30, isActive: true },
    { id: '4', name: 'Corte Premium', price: 35000, duration: 60, isActive: true }
  ];
  
  const mockAppointments = [
    {
      id: '1',
      clientName: 'Juan Pérez',
      clientPhone: '+57 300 123 4567',
      serviceId: '1',
      serviceName: 'Corte Clásico',
      date: '2025-08-26',
      time: '09:00',
      status: 'Confirmada',
      createdAt: new Date()
    },
    {
      id: '2',
      clientName: 'Carlos Rodríguez',
      clientPhone: '+57 301 234 5678',
      serviceId: '2',
      serviceName: 'Corte + Barba',
      date: '2025-08-26',
      time: '10:30',
      status: 'Pendiente',
      createdAt: new Date()
    },
    {
      id: '3',
      clientName: 'Miguel Torres',
      clientPhone: '+57 302 345 6789',
      serviceId: '3',
      serviceName: 'Afeitado Tradicional',
      date: '2025-08-27',
      time: '14:00',
      status: 'Completada',
      createdAt: new Date()
    }
  ];
  
  // Cargar servicios disponibles
  useEffect(() => {
    const loadServices = async () => {
      if (!db) {
        setServices(mockServices);
        return;
      }
      
      try {
        // Cargar servicios desde la colección services
        const servicesRef = collection(db, 'services');
        const servicesSnapshot = await getDocs(servicesRef);
        
        if (!servicesSnapshot.empty) {
          const servicesData = servicesSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(service => service.isActive === true);
          setServices(servicesData);
        } else {
          setServices(mockServices);
        }
      } catch (error) {
        console.error('Error loading services:', error);
        setServices(mockServices);
        showNotification('Error al cargar servicios, usando datos de prueba', 'error');
      }
    };
    
    loadServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, userId]);
  
  // Cargar citas en tiempo real
  useEffect(() => {
    if (!db || !userId) {
      setAppointments(mockAppointments);
      setLoading(false);
      return;
    }
    
    try {
      const appointmentsRef = collection(db, 'appointments');
      // Simplificar consulta para evitar error de índice - solo ordenar por fecha
      const q = query(appointmentsRef, orderBy('date', 'asc'));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const appointmentsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAppointments(appointmentsData);
        setLoading(false);
      }, (error) => {
        console.error('Error loading appointments:', error);
        setAppointments(mockAppointments);
        setLoading(false);
        showNotification('Error al cargar citas, usando datos de prueba', 'error');
      });
      
      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up appointments listener:', error);
      setAppointments(mockAppointments);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, userId]);
  
  // Función para mostrar notificaciones
  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 4000);
  };
  
  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'serviceId') {
      const selectedService = services.find(service => service.id === value);
      setFormData(prev => ({
        ...prev,
        serviceId: value,
        serviceName: selectedService ? selectedService.name : ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Resetear formulario
  const resetForm = () => {
    setFormData({
      clientName: '',
      clientPhone: '',
      clientEmail: '',
      serviceId: '',
      serviceName: '',
      date: '',
      time: '',
      status: 'Pendiente',
      notes: '',
      totalAmount: 0
    });
    setEditingId(null);
    setShowForm(false);
  };
  
  // Validar formulario
  const validateForm = () => {
    const { clientName, clientPhone, serviceId, date, time } = formData;
    
    if (!clientName.trim()) {
      showNotification('El nombre del cliente es obligatorio', 'error');
      return false;
    }
    
    if (!clientPhone.trim()) {
      showNotification('El teléfono del cliente es obligatorio', 'error');
      return false;
    }
    
    if (!serviceId) {
      showNotification('Debe seleccionar un servicio', 'error');
      return false;
    }
    
    if (!date) {
      showNotification('La fecha es obligatoria', 'error');
      return false;
    }
    
    if (!time) {
      showNotification('La hora es obligatoria', 'error');
      return false;
    }
    
    return true;
  };
  
  // Crear nueva cita
  const handleCreateAppointment = async () => {
    if (!validateForm()) return;
    
    setFormLoading(true);
    
    try {
      if (!db || !userId) {
        // Simulación para desarrollo
        const newAppointment = {
          id: Date.now().toString(),
          ...formData,
          createdAt: new Date()
        };
        setAppointments(prev => [...prev, newAppointment]);
        showNotification('Cita agendada con éxito', 'success');
        resetForm();
        setFormLoading(false);
        return;
      }
      
      const appointmentsRef = collection(db, 'appointments');
      
      const appointmentData = {
        ...formData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await addDoc(appointmentsRef, appointmentData);
      showNotification('Cita agendada con éxito', 'success');
      resetForm();
    } catch (error) {
      console.error('Error creating appointment:', error);
      showNotification('Error al agendar la cita', 'error');
    }
    
    setFormLoading(false);
  };
  
  // Editar cita
  const handleEditAppointment = (appointment) => {
    setFormData({
      clientName: appointment.clientName,
      clientPhone: appointment.clientPhone,
      serviceId: appointment.serviceId,
      serviceName: appointment.serviceName,
      date: appointment.date,
      time: appointment.time,
      status: appointment.status
    });
    setEditingId(appointment.id);
    setShowForm(true);
  };
  
  // Actualizar cita
  const handleUpdateAppointment = async () => {
    if (!validateForm()) return;
    
    setFormLoading(true);
    
    try {
      if (!db || !userId) {
        // Simulación para desarrollo
        setAppointments(prev => prev.map(appointment => 
          appointment.id === editingId 
            ? { ...appointment, ...formData, updatedAt: new Date() }
            : appointment
        ));
        showNotification('Cita actualizada con éxito', 'success');
        resetForm();
        setFormLoading(false);
        return;
      }
      
      const appointmentRef = doc(db, 'appointments', editingId);
      
      const updateData = {
        ...formData,
        updatedAt: new Date()
      };
      
      await updateDoc(appointmentRef, updateData);
      showNotification('Cita actualizada con éxito', 'success');
      resetForm();
    } catch (error) {
      console.error('Error updating appointment:', error);
      showNotification('Error al actualizar la cita', 'error');
    }
    
    setFormLoading(false);
  };
  
  // Eliminar cita
  const handleDeleteAppointment = async (appointmentId) => {
    try {
      if (!db || !userId) {
        // Simulación para desarrollo
        setAppointments(prev => prev.filter(appointment => appointment.id !== appointmentId));
        showNotification('Cita eliminada con éxito', 'success');
        setDeleteModal({ show: false, appointmentId: null });
        return;
      }
      
      const appointmentRef = doc(db, 'appointments', appointmentId);
      await deleteDoc(appointmentRef);
      showNotification('Cita eliminada con éxito', 'success');
      setDeleteModal({ show: false, appointmentId: null });
    } catch (error) {
      console.error('Error deleting appointment:', error);
      showNotification('Error al eliminar la cita', 'error');
    }
  };
  
  // Obtener icono del estado
  const getStatusIcon = (status) => {
    switch (status) {
      case 'Confirmada':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'Completada':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'Cancelada':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };
  
  // Obtener color del estado
  const getStatusColor = (status) => {
    switch (status) {
      case 'Confirmada':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Completada':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Cancelada':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };
  
  // Formatear fecha
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-CO', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-zinc-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-amber-400 mb-2">
              Gestión de Citas
            </h1>
            <p className="text-zinc-400">
              Administra las citas de la barbería
            </p>
          </div>
          
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 sm:mt-0 bg-amber-500 hover:bg-amber-600 text-black px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nueva Cita
          </button>
        </div>
        
        {/* Formulario */}
        {showForm && (
          <div className="bg-zinc-800 rounded-lg p-6 mb-8 border border-zinc-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-amber-400">
                {editingId ? 'Editar Cita' : 'Nueva Cita'}
              </h2>
              <button
                onClick={resetForm}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Nombre del Cliente */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Nombre del Cliente
                </label>
                <input
                  type="text"
                  name="clientName"
                  value={formData.clientName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Ingrese el nombre completo"
                  required
                />
              </div>
              
              {/* Teléfono */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Teléfono
                </label>
                <input
                  type="tel"
                  name="clientPhone"
                  value={formData.clientPhone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="+57 300 123 4567"
                  required
                />
              </div>
              
              {/* Servicio */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Servicio
                </label>
                <select
                  name="serviceId"
                  value={formData.serviceId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  required
                >
                  <option value="">Seleccione un servicio</option>
                  {services.map(service => (
                    <option key={service.id} value={service.id}>
                      {service.name} - ${service.price?.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Fecha */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Fecha
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  required
                />
              </div>
              
              {/* Hora */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Hora
                </label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  required
                />
              </div>
              
              {/* Estado */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Estado
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="Confirmada">Confirmada</option>
                  <option value="Cancelada">Cancelada</option>
                  <option value="Completada">Completada</option>
                </select>
              </div>
            </div>
            
            {/* Botones del formulario */}
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={resetForm}
                className="px-6 py-3 bg-zinc-600 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={editingId ? handleUpdateAppointment : handleCreateAppointment}
                disabled={formLoading}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black rounded-lg font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {formLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {editingId ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </div>
        )}
        
        {/* Tabla de citas */}
        <div className="bg-zinc-800 rounded-lg border border-zinc-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-700">
            <h3 className="text-lg font-semibold text-amber-400">
              Lista de Citas ({appointments.length})
            </h3>
          </div>
          
          {appointments.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-400 text-lg">No hay citas agendadas</p>
              <p className="text-zinc-500 mt-2">Haz clic en "Nueva Cita" para agregar la primera</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-750">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">
                      Teléfono
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">
                      Servicio
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">
                      Hora
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-700">
                  {appointments.map((appointment) => (
                    <tr key={appointment.id} className="hover:bg-zinc-750 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-zinc-400 mr-2" />
                          <span className="text-white font-medium">
                            {appointment.clientName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 text-zinc-400 mr-2" />
                          <span className="text-zinc-300">
                            {appointment.clientPhone}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-amber-400 font-medium">
                          {appointment.serviceName}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-zinc-400 mr-2" />
                          <span className="text-zinc-300">
                            {formatDate(appointment.date)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 text-zinc-400 mr-2" />
                          <span className="text-zinc-300">
                            {appointment.time}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(appointment.status)}`}>
                          {getStatusIcon(appointment.status)}
                          {appointment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditAppointment(appointment)}
                            className="p-2 text-blue-400 hover:text-blue-300 hover:bg-zinc-700 rounded-lg transition-colors"
                            title="Editar cita"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteModal({ show: true, appointmentId: appointment.id })}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-zinc-700 rounded-lg transition-colors"
                            title="Eliminar cita"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      {/* Modal de confirmación de eliminación */}
      {deleteModal.show && (
        <ConfirmationModal
          message={
            <div className="text-center">
              <h3 className="text-lg font-semibold text-red-400 mb-4">Eliminar Cita</h3>
              <p>¿Estás seguro de que deseas eliminar esta cita?</p>
              <p className="text-red-300 mt-2">Esta acción no se puede deshacer.</p>
            </div>
          }
          onConfirm={() => handleDeleteAppointment(deleteModal.appointmentId)}
          onCancel={() => setDeleteModal({ show: false, appointmentId: null })}
          confirmText="Eliminar"
          cancelText="Cancelar"
          showCancelButton={true}
        />
      )}
      
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

export default Appointments;
