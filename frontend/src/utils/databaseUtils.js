// frontend/src/utils/databaseUtils.js
import { collection, addDoc, updateDoc, doc, query, where, getDocs, increment } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

// ==========================================
// FUNCIONES PARA CREAR CITAS CON RELACIONES CONSISTENTES
// ==========================================

/**
 * Crea una nueva cita asegurando relaciones consistentes
 * @param {Object} clientData - Datos del cliente
 * @param {Object} serviceData - Datos del servicio
 * @param {Object} appointmentDetails - Detalles de la cita (fecha, hora, etc.)
 * @returns {Object} - Documento de la cita creada
 */
export const createAppointmentWithRelations = async (clientData, serviceData, appointmentDetails) => {
  try {
    const appointmentData = {
      // Referencia del cliente
      clientId: clientData.id,
      clientPhone: clientData.phone,
      clientName: clientData.name,
      clientEmail: clientData.email || null,
      
      // Referencia del servicio
      serviceId: serviceData.id,
      serviceName: serviceData.name || 'Servicio',
      servicePrice: serviceData.price || 0, // Precio histórico
      serviceDuration: serviceData.duration || 30, // Default 30 minutos
      
      // Detalles de la cita
      date: appointmentDetails.date,
      time: appointmentDetails.time,
      dateDisplay: appointmentDetails.dateDisplay,
      timeDisplay: appointmentDetails.timeDisplay,
      status: 'pending',
      
      // Información adicional
      totalAmount: serviceData.price || 0,
      paymentStatus: 'pending',
      notes: appointmentDetails.notes || '',
      
      // Metadatos
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Crear la cita
    const appointmentRef = await addDoc(collection(db, 'appointments'), appointmentData);
    
    // Actualizar estadísticas del cliente
    await updateClientStats(clientData.id, 'increment');
    
    // Actualizar estadísticas del servicio
    await updateServiceStats(serviceData.id, 'increment');
    
    return { id: appointmentRef.id, ...appointmentData };
  } catch (error) {
    console.error('Error creating appointment with relations:', error);
    throw error;
  }
};

// ==========================================
// FUNCIONES PARA ACTUALIZAR ESTADÍSTICAS
// ==========================================

/**
 * Actualiza las estadísticas de un cliente
 * @param {string} clientId - ID del cliente
 * @param {string} operation - 'increment' o 'recalculate'
 */
export const updateClientStats = async (clientId, operation = 'increment') => {
  try {
    const clientRef = doc(db, 'clients', clientId);
    
    if (operation === 'increment') {
      // Incrementar contador simple
      await updateDoc(clientRef, {
        totalAppointments: increment(1),
        lastVisit: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } else if (operation === 'recalculate') {
      // Recalcular todas las estadísticas
      const stats = await calculateClientStats(clientId);
      await updateDoc(clientRef, {
        ...stats,
        updatedAt: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error updating client stats:', error);
  }
};

/**
 * Actualiza las estadísticas de un servicio
 * @param {string} serviceId - ID del servicio
 * @param {string} operation - 'increment' o 'recalculate'
 */
export const updateServiceStats = async (serviceId, operation = 'increment') => {
  try {
    const serviceRef = doc(db, 'services', serviceId);
    
    if (operation === 'increment') {
      await updateDoc(serviceRef, {
        timesBooked: increment(1),
        updatedAt: new Date().toISOString()
      });
    } else if (operation === 'recalculate') {
      const stats = await calculateServiceStats(serviceId);
      await updateDoc(serviceRef, {
        ...stats,
        updatedAt: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error updating service stats:', error);
  }
};

// ==========================================
// FUNCIONES PARA CALCULAR ESTADÍSTICAS
// ==========================================

/**
 * Calcula estadísticas completas de un cliente
 * @param {string} clientId - ID del cliente
 * @returns {Object} - Estadísticas calculadas
 */
export const calculateClientStats = async (clientId) => {
  try {
    // Obtener todas las citas del cliente
    const q = query(
      collection(db, 'appointments'),
      where('clientId', '==', clientId)
    );
    const snapshot = await getDocs(q);
    const appointments = snapshot.docs.map(doc => doc.data());
    
    // Calcular estadísticas
    const totalAppointments = appointments.length;
    const completedAppointments = appointments.filter(apt => apt.status === 'completed').length;
    const cancelledAppointments = appointments.filter(apt => apt.status === 'cancelled').length;
    
    const totalSpent = appointments
      .filter(apt => apt.status === 'completed')
      .reduce((sum, apt) => sum + (apt.servicePrice || apt.totalAmount || 0), 0);
    
    const dates = appointments.map(apt => new Date(apt.date).getTime()).sort((a, b) => a - b);
    const firstVisit = dates.length > 0 ? new Date(dates[0]).toISOString() : null;
    const lastVisit = dates.length > 0 ? new Date(dates[dates.length - 1]).toISOString() : null;
    
    // Calcular nivel de lealtad
    let loyaltyLevel = 'regular';
    if (totalSpent >= 200000) loyaltyLevel = 'VIP';
    else if (completedAppointments >= 5) loyaltyLevel = 'frequent';
    
    // Servicio favorito
    const serviceUsage = {};
    appointments.forEach(apt => {
      if (apt.serviceName) {
        serviceUsage[apt.serviceName] = (serviceUsage[apt.serviceName] || 0) + 1;
      }
    });
    const favoriteService = Object.keys(serviceUsage).reduce((a, b) => 
      serviceUsage[a] > serviceUsage[b] ? a : b, Object.keys(serviceUsage)[0]) || null;
    
    return {
      totalAppointments,
      completedAppointments,
      cancelledAppointments,
      totalSpent,
      firstVisit,
      lastVisit,
      loyaltyLevel,
      favoriteService
    };
  } catch (error) {
    console.error('Error calculating client stats:', error);
    return {};
  }
};

/**
 * Calcula estadísticas completas de un servicio
 * @param {string} serviceId - ID del servicio
 * @returns {Object} - Estadísticas calculadas
 */
export const calculateServiceStats = async (serviceId) => {
  try {
    // Obtener todas las citas del servicio
    const q = query(
      collection(db, 'appointments'),
      where('serviceId', '==', serviceId)
    );
    const snapshot = await getDocs(q);
    const appointments = snapshot.docs.map(doc => doc.data());
    
    const timesBooked = appointments.length;
    const completedBookings = appointments.filter(apt => apt.status === 'completed').length;
    const revenue = appointments
      .filter(apt => apt.status === 'completed')
      .reduce((sum, apt) => sum + (apt.servicePrice || apt.totalAmount || 0), 0);
    
    return {
      timesBooked,
      completedBookings,
      revenue
    };
  } catch (error) {
    console.error('Error calculating service stats:', error);
    return {};
  }
};

// ==========================================
// FUNCIONES DE BÚSQUEDA MEJORADAS
// ==========================================

/**
 * Busca citas de un cliente usando múltiples criterios
 * @param {Object} clientData - Datos del cliente
 * @returns {Array} - Array de citas
 */
export const getClientAppointments = async (clientData) => {
  try {
    let appointments = [];
    
    // Buscar por ID del cliente (método preferido)
    if (clientData.id) {
      const q = query(
        collection(db, 'appointments'),
        where('clientId', '==', clientData.id)
      );
      const snapshot = await getDocs(q);
      appointments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    
    // Si no encontró por ID, buscar por teléfono
    if (appointments.length === 0 && clientData.phone) {
      const q = query(
        collection(db, 'appointments'),
        where('clientPhone', '==', clientData.phone)
      );
      const snapshot = await getDocs(q);
      appointments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    
    return appointments;
  } catch (error) {
    console.error('Error getting client appointments:', error);
    return [];
  }
};

/**
 * Busca un cliente por teléfono o ID
 * @param {string} identifier - Teléfono o ID del cliente
 * @returns {Object|null} - Datos del cliente o null
 */
export const findClient = async (identifier) => {
  try {
    // Intentar buscar por teléfono primero (más común)
    if (identifier.includes('+') || identifier.match(/^\d+$/)) {
      const q = query(
        collection(db, 'clients'),
        where('phone', '==', identifier)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }
    }
    
    // Si no es un teléfono, podría ser un ID
    // (Esta funcionalidad requeriría una búsqueda por documento específico)
    
    return null;
  } catch (error) {
    console.error('Error finding client:', error);
    return null;
  }
};

// ==========================================
// FUNCIONES DE MIGRACIÓN DE DATOS
// ==========================================

/**
 * Migra datos antiguos para usar la nueva estructura de relaciones
 */
export const migrateLegacyData = async () => {
  try {
    console.log('Iniciando migración de datos legacy...');
    
    // Obtener todas las citas sin clientId
    const appointmentsSnapshot = await getDocs(collection(db, 'appointments'));
    const appointments = appointmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const appointmentsToUpdate = appointments.filter(apt => !apt.clientId && apt.clientPhone);
    
    console.log(`Encontradas ${appointmentsToUpdate.length} citas para migrar`);
    
    for (const appointment of appointmentsToUpdate) {
      // Buscar cliente por teléfono
      const client = await findClient(appointment.clientPhone);
      
      if (client) {
        // Actualizar cita con clientId
        const appointmentRef = doc(db, 'appointments', appointment.id);
        await updateDoc(appointmentRef, {
          clientId: client.id,
          updatedAt: new Date().toISOString()
        });
        
        console.log(`Migrada cita ${appointment.id} para cliente ${client.id}`);
      }
    }
    
    console.log('Migración completada');
  } catch (error) {
    console.error('Error en migración:', error);
  }
};

export default {
  createAppointmentWithRelations,
  updateClientStats,
  updateServiceStats,
  calculateClientStats,
  calculateServiceStats,
  getClientAppointments,
  findClient,
  migrateLegacyData
};
