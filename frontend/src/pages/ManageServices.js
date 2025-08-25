// frontend/src/pages/ManageServices.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; // Asumo que AuthContext es lo que provee db, userId
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import Notification from '../components/Notification'; // Usamos el componente Notification
import ConfirmationModal from '../components/ConfirmationModal'; // Usamos el componente ConfirmationModal
import { PlusCircle, Edit, Trash2, Scissors, DollarSign, Clock } from 'lucide-react'; // Iconos para servicios

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

  // Estado inicial del formulario para un nuevo servicio
  const initialFormState = {
    name: '',
    description: '',
    price: '',
    durationMinutes: '',
    isActive: true, // Nuevo campo para indicar si el servicio está activo
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
      description: service.description,
      price: service.price.toString(), // Convertir a string para el input
      durationMinutes: service.durationMinutes.toString(), // Convertir a string para el input
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
      <button
        onClick={() => { setShowForm(true); setCurrentService(null); setFormData(initialFormState); }}
        className="mb-6 w-full md:w-auto bg-amber-500 hover:bg-amber-600 text-zinc-900 font-bold py-3 px-6 rounded-xl shadow-lg flex items-center justify-center transition duration-300 transform hover:-translate-y-1"
      >
        <PlusCircle size={24} className="mr-2" /> Añadir Nuevo Servicio
      </button>

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
        {services.length === 0 ? (
          <p className="text-gray-400">No hay servicios registrados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-700">
              <thead className="bg-zinc-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider rounded-tl-lg">Nombre</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Descripción</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Precio</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Duración (min)</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Estado</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider rounded-tr-lg">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-zinc-800 divide-y divide-zinc-700">
                {services.map((service) => (
                  <tr key={service.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white flex items-center">
                      <Scissors size={16} className="mr-2 text-amber-400"/> {service.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{service.description}</td>
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
