// frontend/src/pages/ManageServices.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; // Asumo que AuthContext es lo que provee db, userId
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import Notification from '../components/Notification'; // Usamos el componente Notification
import ConfirmationModal from '../components/ConfirmationModal'; // Usamos el componente ConfirmationModal
import { PlusCircle, Edit, Trash2, Scissors, DollarSign, Clock, Search, Filter } from 'lucide-react'; // Iconos para servicios

const ManageServices = () => {
  const { db, isAuthReady } = useAuth(); // Obtener db, isAuthReady de AuthContext
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [currentService, setCurrentService] = useState(null);
  const [notification, setNotification] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('');
  
  // Estados para filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Estado inicial del formulario para un nuevo servicio
  const initialFormState = {
    name: '',
    description: '',
    price: '',
    durationMinutes: '',
    category: 'cortes',
    isActive: true,
  };
  const [formData, setFormData] = useState(initialFormState);

  // useEffect para cargar los servicios de Firestore
  useEffect(() => {
    if (!db || !isAuthReady) {
      console.log("Firestore/Auth not ready for services fetch.");
      return;
    }

    setLoading(true);
    // Ruta de la colección de servicios: services (colección raíz)
    const servicesCollectionRef = collection(db, 'services');
    const q = query(servicesCollectionRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const servicesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setServices(servicesData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching services:", error);
      setNotification({ message: 'Error al cargar los servicios.', type: 'error' });
      setLoading(false);
    });

    return () => unsubscribe(); // Limpiar el listener al desmontar
  }, [db, isAuthReady]); // userId no es necesario para colecciones públicas si no se filtra por usuario


  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Manejar el envío del formulario (crear/actualizar servicio)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!db) {
      setNotification({ message: 'La base de datos no está disponible.', type: 'error' });
      return;
    }

    const servicesCollectionRef = collection(db, 'services');

    try {
      if (currentService) {
        // Actualizar servicio existente
        await updateDoc(doc(db, 'services', currentService.id), {
          ...formData,
          price: parseFloat(formData.price), // Asegurar que el precio sea número
          durationMinutes: parseInt(formData.durationMinutes, 10), // Asegurar que la duración sea número
        });
        setNotification({ message: 'Servicio actualizado con éxito.', type: 'success' });
      } else {
        // Crear nuevo servicio
        await addDoc(servicesCollectionRef, {
          ...formData,
          price: parseFloat(formData.price), // Asegurar que el precio sea número
          durationMinutes: parseInt(formData.durationMinutes, 10), // Asegurar que la duración sea número
        });
        setNotification({ message: 'Servicio añadido con éxito.', type: 'success' });
      }
      setFormData(initialFormState); // Resetear formulario
      setCurrentService(null);
      setShowForm(false);
    } catch (error) {
      console.error("Error saving service:", error);
      setNotification({ message: 'Error al guardar el servicio.', type: 'error' });
    }
  };

  // Editar un servicio
  const handleEdit = (service) => {
    setFormData({
      name: service.name,
      description: service.description || '',
      price: service.price.toString(),
      durationMinutes: service.durationMinutes.toString(),
      category: service.category || 'cortes',
      isActive: service.isActive || false,
    });
    setCurrentService(service);
    setShowForm(true);
  };

  // Eliminar un servicio
  const handleDelete = (id) => {
    setConfirmMessage('¿Estás seguro de que quieres eliminar este servicio? Esta acción no se puede deshacer.');
    setConfirmAction(() => async () => {
      if (!db) return;
      try {
        await deleteDoc(doc(db, 'services', id));
        setNotification({ message: 'Servicio eliminado con éxito.', type: 'success' });
      } catch (error) {
        console.error("Error deleting service:", error);
        setNotification({ message: 'Error al eliminar el servicio.', type: 'error' });
      }
    });
    setShowConfirmModal(true);
  };

  // Manejar la confirmación del modal
  const handleConfirm = () => {
    if (confirmAction) {
      confirmAction();
    }
    setShowConfirmModal(false);
    setConfirmAction(null);
    setConfirmMessage('');
  };

  // Manejar la cancelación del modal
  const handleCancel = () => {
    setShowConfirmModal(false);
    setConfirmAction(null);
    setConfirmMessage('');
  };

  // Agregar servicios básicos predeterminados
  const addBasicServices = async () => {
    if (!db) {
      setNotification({ message: 'La base de datos no está disponible.', type: 'error' });
      return;
    }

    const basicServices = [
      {
        name: 'Corte Clásico',
        description: 'Corte tradicional de cabello masculino con tijera y máquina',
        price: 15000,
        durationMinutes: 30,
        isActive: true,
        category: 'cortes'
      },
      {
        name: 'Corte + Barba',
        description: 'Corte de cabello completo más arreglo y perfilado de barba',
        price: 25000,
        durationMinutes: 45,
        isActive: true,
        category: 'combos'
      },
      {
        name: 'Afeitado Tradicional',
        description: 'Afeitado clásico con navaja, toalla caliente y aftershave',
        price: 18000,
        durationMinutes: 30,
        isActive: true,
        category: 'afeitado'
      },
      {
        name: 'Corte Premium',
        description: 'Corte premium con lavado, masaje capilar y styling',
        price: 35000,
        durationMinutes: 60,
        isActive: true,
        category: 'premium'
      },
      {
        name: 'Corte Degradado',
        description: 'Corte moderno con degradado y acabados perfectos',
        price: 20000,
        durationMinutes: 35,
        isActive: true,
        category: 'cortes'
      },
      {
        name: 'Barba Completa',
        description: 'Arreglo completo de barba con perfilado y cuidado',
        price: 15000,
        durationMinutes: 25,
        isActive: true,
        category: 'afeitado'
      },
      {
        name: 'Corte + Barba + Cejas',
        description: 'Servicio completo: corte, barba y arreglo de cejas',
        price: 30000,
        durationMinutes: 50,
        isActive: true,
        category: 'combos'
      },
      {
        name: 'Tratamiento Capilar',
        description: 'Tratamiento hidratante y fortalecedor para el cabello',
        price: 25000,
        durationMinutes: 40,
        isActive: true,
        category: 'tratamientos'
      }
    ];

    try {
      const servicesCollectionRef = collection(db, 'services');
      let addedCount = 0;
      
      // Verificar si cada servicio ya existe antes de agregarlo
      for (const service of basicServices) {
        const existingService = services.find(s => s.name === service.name);
        if (!existingService) {
          await addDoc(servicesCollectionRef, service);
          addedCount++;
        }
      }
      
      if (addedCount > 0) {
        setNotification({ 
          message: `${addedCount} servicios básicos agregados exitosamente.`, 
          type: 'success' 
        });
      } else {
        setNotification({ 
          message: 'Todos los servicios básicos ya existen.', 
          type: 'info' 
        });
      }
    } catch (error) {
      console.error("Error adding basic services:", error);
      setNotification({ message: 'Error al agregar servicios básicos.', type: 'error' });
    }
  };

  // Función para filtrar servicios
  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || service.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && service.isActive) ||
                         (filterStatus === 'inactive' && !service.isActive);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Obtener categorías únicas para el filtro
  const categories = [...new Set(services.map(service => service.category).filter(Boolean))];

  const closeNotification = () => setNotification(null);


  if (loading) {
    return (
      <div className="flex justify-center items-center h-full bg-zinc-900 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400"></div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 bg-zinc-900 min-h-screen text-white">
      <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-6 text-center">Gestión de Servicios</h2>
      
      {/* Botón para añadir nuevo servicio */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <button
          onClick={() => { setShowForm(true); setCurrentService(null); setFormData(initialFormState); }}
          className="w-full md:w-auto bg-amber-500 hover:bg-amber-600 text-zinc-900 font-bold py-3 px-6 rounded-xl shadow-lg flex items-center justify-center transition duration-200 transform hover:-translate-y-1"
        >
          <PlusCircle size={24} className="mr-2" /> Añadir Nuevo Servicio
        </button>
        
        {/* Botón para agregar servicios básicos */}
        <button
          onClick={addBasicServices}
          className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg flex items-center justify-center transition duration-200 transform hover:-translate-y-1"
        >
          <Scissors size={24} className="mr-2" /> Agregar Servicios Básicos
        </button>
      </div>

      {/* Filtros de búsqueda */}
      <div className="mb-6 bg-zinc-800 p-4 rounded-2xl border border-zinc-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Búsqueda por texto */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar servicios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white placeholder-gray-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Filtro por categoría */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 appearance-none"
            >
              <option value="all">Todas las categorías</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por estado */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>
        </div>
        
        {/* Resumen de filtros */}
        <div className="mt-3 flex items-center justify-between text-sm text-gray-400">
          <span>
            Mostrando {filteredServices.length} de {services.length} servicios
          </span>
          {(searchTerm || filterCategory !== 'all' || filterStatus !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterCategory('all');
                setFilterStatus('all');
              }}
              className="text-amber-400 hover:text-amber-300 underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Formulario de Añadir/Editar Servicio */}
      {showForm && (
        <div className="bg-zinc-800 p-6 rounded-2xl shadow-xl mb-8 border border-zinc-700">
          <h3 className="text-2xl font-bold text-white mb-4">{currentService ? 'Editar Servicio' : 'Nuevo Servicio'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300">Nombre del Servicio</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-zinc-700 bg-zinc-900 text-white shadow-sm focus:border-amber-500 focus:ring-amber-500 p-3"
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-300">Descripción</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                className="mt-1 block w-full rounded-md border-zinc-700 bg-zinc-900 text-white shadow-sm focus:border-amber-500 focus:ring-amber-500 p-3"
              ></textarea>
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-300">Categoría</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-zinc-700 bg-zinc-900 text-white shadow-sm focus:border-amber-500 focus:ring-amber-500 p-3"
              >
                <option value="cortes">Cortes</option>
                <option value="afeitado">Afeitado</option>
                <option value="combos">Combos</option>
                <option value="premium">Premium</option>
                <option value="tratamientos">Tratamientos</option>
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-300">Precio</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-zinc-700 bg-zinc-900 text-white shadow-sm focus:border-amber-500 focus:ring-amber-500 p-3"
                />
              </div>
              <div>
                <label htmlFor="durationMinutes" className="block text-sm font-medium text-gray-300">Duración (minutos)</label>
                <input
                  type="number"
                  id="durationMinutes"
                  name="durationMinutes"
                  value={formData.durationMinutes}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-zinc-700 bg-zinc-900 text-white shadow-sm focus:border-amber-500 focus:ring-amber-500 p-3"
                />
              </div>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="h-4 w-4 text-amber-500 focus:ring-amber-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-300">Servicio Activo</label>
            </div>
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => { setShowForm(false); setFormData(initialFormState); setCurrentService(null); }}
                className="bg-zinc-700 hover:bg-zinc-600 text-white font-bold py-2 px-5 rounded-lg transition duration-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-amber-500 hover:bg-amber-600 text-zinc-900 font-bold py-2 px-5 rounded-lg transition duration-200"
              >
                {currentService ? 'Actualizar Servicio' : 'Añadir Servicio'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Listado de Servicios */}
      <div className="bg-zinc-800 p-6 rounded-2xl shadow-xl border border-zinc-700">
        <h3 className="text-2xl font-bold text-white mb-4">Servicios Disponibles</h3>
        {filteredServices.length === 0 ? (
          <div className="text-center py-8">
            {services.length === 0 ? (
              <p className="text-gray-400">No hay servicios registrados.</p>
            ) : (
              <p className="text-gray-400">No se encontraron servicios con los filtros aplicados.</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-700">
              <thead className="bg-zinc-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider rounded-tl-lg">Nombre</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Descripción</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Categoría</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Precio</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Duración (min)</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Estado</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider rounded-tr-lg">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-zinc-800 divide-y divide-zinc-700">
                {filteredServices.map((service) => (
                  <tr key={service.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white flex items-center">
                      <Scissors size={16} className="mr-2 text-amber-400"/> {service.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{service.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        service.category === 'cortes' ? 'bg-blue-700 text-blue-100' :
                        service.category === 'afeitado' ? 'bg-purple-700 text-purple-100' :
                        service.category === 'combos' ? 'bg-orange-700 text-orange-100' :
                        service.category === 'premium' ? 'bg-yellow-700 text-yellow-100' :
                        'bg-gray-700 text-gray-100'
                      }`}>
                        {service.category ? service.category.charAt(0).toUpperCase() + service.category.slice(1) : 'General'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 flex items-center">
                      <DollarSign size={16} className="mr-1 text-green-500"/> {service.price?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 flex items-center">
                      <Clock size={16} className="mr-1 text-blue-400"/> {service.durationMinutes}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        service.isActive ? 'bg-green-700 text-green-100' : 'bg-red-700 text-red-100'
                      }`}>
                        {service.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex space-x-2">
                      <button
                        onClick={() => handleEdit(service)}
                        className="text-amber-400 hover:text-amber-500 flex items-center p-2 rounded-md hover:bg-zinc-700 transition duration-200"
                        title="Editar"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(service.id)}
                        className="text-red-500 hover:text-red-600 flex items-center p-2 rounded-md hover:bg-zinc-700 transition duration-200"
                        title="Eliminar"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {notification && <Notification message={notification.message} type={notification.type} onClose={closeNotification} />}
      {showConfirmModal && <ConfirmationModal message={confirmMessage} onConfirm={handleConfirm} onCancel={handleCancel} />}
    </div>
  );
};

export default ManageServices;
