// frontend/src/pages/ManageServices.js
import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  orderBy 
} from 'firebase/firestore';
import { 
  PlusCircle, 
  Edit2, 
  Trash2, 
  Scissors, 
  DollarSign, 
  Clock, 
  Search, 
  Filter,
  Save,
  X,
  Star,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useForm } from '../hooks/useForm';
import { useNotification } from '../hooks/useNotification';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmationModal from '../components/ConfirmationModal';
import Notification from '../components/Notification';

const ManageServices = () => {
  const { db, isAuthReady } = useAuth();
  const { notification, showSuccess, showError, showInfo, hideNotification } = useNotification();
  
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  
  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Validación de servicios
  const validateService = (values) => {
    const errors = {};
    
    if (!values.name?.trim()) {
      errors.name = 'El nombre es obligatorio';
    }
    
    if (!values.description?.trim()) {
      errors.description = 'La descripción es obligatoria';
    }
    
    if (!values.price || values.price <= 0) {
      errors.price = 'El precio debe ser mayor a 0';
    }
    
    if (!values.duration || values.duration <= 0) {
      errors.duration = 'La duración debe ser mayor a 0';
    }
    
    return errors;
  };

  // Hook de formulario
  const {
    values: formData,
    errors,
    handleChange,
    handleBlur,
    validate,
    setValues,
    reset
  } = useForm({
    name: '',
    description: '',
    price: '',
    duration: '',
    category: 'corte',
    isActive: true
  }, validateService);

  // Cargar servicios
  useEffect(() => {
    if (!db || !isAuthReady) return;

    setLoading(true);
    
    try {
      const servicesQuery = query(
        collection(db, 'services'),
        orderBy('name')
      );

      const unsubscribe = onSnapshot(servicesQuery, (snapshot) => {
        const servicesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setServices(servicesData);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error loading services:', error);
      showError('Error al cargar los servicios');
      setLoading(false);
      
      // Servicios de ejemplo
      setServices([
        {
          id: '1',
          name: 'Corte Clásico',
          description: 'Corte tradicional con tijera y máquina',
          price: 15000,
          duration: 30,
          category: 'corte',
          isActive: true,
          isPopular: true
        },
        {
          id: '2',
          name: 'Corte + Barba',
          description: 'Corte completo más arreglo de barba',
          price: 25000,
          duration: 45,
          category: 'corte',
          isActive: true,
          isPopular: true
        },
        {
          id: '3',
          name: 'Solo Barba',
          description: 'Arreglo y perfilado de barba',
          price: 12000,
          duration: 20,
          category: 'barba',
          isActive: true,
          isPopular: false
        }
      ]);
    }
  }, [db, isAuthReady, showError]);

  // Filtrar servicios
  useEffect(() => {
    let filtered = [...services];

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(service => 
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por categoría
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(service => service.category === categoryFilter);
    }

    // Filtro por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(service => 
        statusFilter === 'active' ? service.isActive : !service.isActive
      );
    }

    setFilteredServices(filtered);
  }, [services, searchTerm, categoryFilter, statusFilter]);

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      showError('Por favor, corrige los errores en el formulario');
      return;
    }

    try {
      const serviceData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        duration: parseInt(formData.duration),
        category: formData.category,
        isActive: formData.isActive,
        updatedAt: new Date().toISOString(),
        ...(editingService ? {} : { createdAt: new Date().toISOString() })
      };

      if (editingService) {
        await updateDoc(doc(db, 'services', editingService.id), serviceData);
        showSuccess('Servicio actualizado exitosamente');
      } else {
        await addDoc(collection(db, 'services'), serviceData);
        showSuccess('Servicio creado exitosamente');
      }

      handleCloseForm();
    } catch (error) {
      console.error('Error saving service:', error);
      showError('Error al guardar el servicio');
    }
  };

  // Manejar edición
  const handleEdit = (service) => {
    setEditingService(service);
    setValues({
      name: service.name,
      description: service.description,
      price: service.price.toString(),
      duration: service.duration.toString(),
      category: service.category,
      isActive: service.isActive
    });
    setShowForm(true);
  };

  // Cerrar formulario
  const handleCloseForm = () => {
    setShowForm(false);
    setEditingService(null);
    reset();
  };

  // Confirmar eliminación
  const handleDelete = (service) => {
    setSelectedService(service);
    setShowDeleteModal(true);
  };

  // Eliminar servicio
  const deleteService = async () => {
    if (!selectedService) return;

    try {
      await deleteDoc(doc(db, 'services', selectedService.id));
      showSuccess('Servicio eliminado exitosamente');
      setShowDeleteModal(false);
      setSelectedService(null);
    } catch (error) {
      console.error('Error deleting service:', error);
      showError('Error al eliminar el servicio');
    }
  };

  // Alternar estado activo
  const toggleServiceStatus = async (service) => {
    try {
      await updateDoc(doc(db, 'services', service.id), {
        isActive: !service.isActive,
        updatedAt: new Date().toISOString()
      });
      showSuccess(`Servicio ${!service.isActive ? 'activado' : 'desactivado'}`);
    } catch (error) {
      console.error('Error updating service status:', error);
      showError('Error al actualizar el estado del servicio');
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Gestión de Servicios</h1>
          <p className="text-zinc-400">
            {services.length} servicios totales • {filteredServices.length} mostrados
          </p>
        </div>
        
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-amber-500 to-amber-600"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Nuevo Servicio
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-zinc-800/80 border-zinc-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="Buscar servicios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
          
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:ring-amber-500"
          >
            <option value="all">Todas las categorías</option>
            <option value="corte">Cortes</option>
            <option value="barba">Barba</option>
            <option value="combo">Combos</option>
            <option value="especial">Especiales</option>
          </select>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:ring-amber-500"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
          
          <Button variant="secondary">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
        </div>
      </Card>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((service) => (
          <Card
            key={service.id}
            className={`bg-zinc-800/80 border-zinc-700 hover:border-zinc-600 transition-colors relative ${
              !service.isActive ? 'opacity-60' : ''
            }`}
          >
            {/* Popular Badge */}
            {service.isPopular && (
              <div className="absolute top-3 right-3">
                <div className="bg-amber-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  <span>Popular</span>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  service.isActive 
                    ? 'bg-gradient-to-br from-amber-400 to-amber-600' 
                    : 'bg-zinc-600'
                }`}>
                  <Scissors className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate">
                    {service.name}
                  </h3>
                  <p className="text-sm text-amber-400 capitalize">
                    {service.category}
                  </p>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-zinc-400 line-clamp-2">
                {service.description}
              </p>

              {/* Details */}
              <div className="flex items-center justify-between text-sm">
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

              {/* Status */}
              <div className="flex items-center justify-between">
                <div className={`flex items-center gap-2 text-xs px-2 py-1 rounded-full ${
                  service.isActive 
                    ? 'text-green-400 bg-green-400/10' 
                    : 'text-red-400 bg-red-400/10'
                }`}>
                  {service.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  <span>{service.isActive ? 'Activo' : 'Inactivo'}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-zinc-700">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleEdit(service)}
                  className="flex-1"
                >
                  <Edit2 className="w-3 h-3 mr-1" />
                  Editar
                </Button>
                
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => toggleServiceStatus(service)}
                  className={service.isActive ? 'text-red-400' : 'text-green-400'}
                >
                  {service.isActive ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </Button>
                
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleDelete(service)}
                  className="text-red-400"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredServices.length === 0 && !loading && (
        <Card className="bg-zinc-800/50 text-center py-12">
          <Scissors className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-zinc-400 mb-2">
            No se encontraron servicios
          </h3>
          <p className="text-zinc-500">
            {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'Comienza creando tu primer servicio'
            }
          </p>
        </Card>
      )}

      {/* Service Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-zinc-800 border-zinc-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">
                {editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseForm}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Nombre del servicio"
                name="name"
                value={formData.name}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.name}
                placeholder="Ej: Corte Clásico"
                required
              />

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Descripción
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  rows={3}
                  placeholder="Describe el servicio..."
                  className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:border-amber-500 focus:ring-amber-500"
                />
                {errors.description && (
                  <p className="text-red-400 text-xs mt-1">{errors.description}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Precio (COP)"
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.price}
                  placeholder="15000"
                  required
                />

                <Input
                  label="Duración (min)"
                  name="duration"
                  type="number"
                  value={formData.duration}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.duration}
                  placeholder="30"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Categoría
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:border-amber-500 focus:ring-amber-500"
                >
                  <option value="corte">Corte</option>
                  <option value="barba">Barba</option>
                  <option value="combo">Combo</option>
                  <option value="especial">Especial</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={(e) => handleChange({
                    target: {
                      name: 'isActive',
                      value: e.target.checked
                    }
                  })}
                  className="w-4 h-4 text-amber-500 bg-zinc-700 border-zinc-600 rounded focus:ring-amber-500"
                />
                <label htmlFor="isActive" className="text-sm text-zinc-300">
                  Servicio activo
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCloseForm}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editingService ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedService && (
        <ConfirmationModal
          title="Eliminar Servicio"
          message={
            <div className="text-left space-y-2">
              <p className="text-center mb-4">¿Estás seguro de que quieres eliminar este servicio?</p>
              <div className="bg-zinc-700/50 p-3 rounded text-sm">
                <p><strong>Servicio:</strong> {selectedService.name}</p>
                <p><strong>Precio:</strong> {formatPrice(selectedService.price)}</p>
                <p><strong>Duración:</strong> {formatDuration(selectedService.duration)}</p>
              </div>
              <p className="text-xs text-zinc-500 text-center mt-4">
                Esta acción no se puede deshacer
              </p>
            </div>
          }
          onConfirm={deleteService}
          onCancel={() => {
            setShowDeleteModal(false);
            setSelectedService(null);
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

export default ManageServices;
