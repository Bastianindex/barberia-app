/**
 * Servicio centralizado para Firestore
 */

import { 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  collection, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { COLLECTIONS } from '../constants';

/**
 * Maneja errores de Firestore
 * @param {Error} error - Error de Firestore
 * @returns {string} Mensaje de error
 */
const handleFirestoreError = (error) => {
  console.error('Firestore error:', error);
  return 'Error de base de datos';
};

/**
 * Guarda datos de usuario en Firestore
 * @param {string} userId - ID del usuario
 * @param {UserData} userData - Datos del usuario
 * @param {string} collection - Colección (clients o admins)
 * @returns {Promise<AuthResult>}
 */
export const saveUserData = async (userId, userData, collectionName = COLLECTIONS.CLIENTS) => {
  try {
    await setDoc(doc(db, collectionName, userId), {
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: handleFirestoreError(error) 
    };
  }
};

/**
 * Obtiene datos de usuario desde Firestore
 * @param {string} userId - ID del usuario
 * @param {string} collectionName - Nombre de la colección
 * @returns {Promise<{success: boolean, data?: UserData, error?: string}>}
 */
export const getUserData = async (userId, collectionName = COLLECTIONS.CLIENTS) => {
  try {
    const userDoc = await getDoc(doc(db, collectionName, userId));
    if (userDoc.exists()) {
      return { 
        success: true, 
        data: userDoc.data() 
      };
    } else {
      return { 
        success: false, 
        error: 'Usuario no encontrado' 
      };
    }
  } catch (error) {
    return { 
      success: false, 
      error: handleFirestoreError(error) 
    };
  }
};

/**
 * Busca usuario en múltiples colecciones
 * @param {string} userId - ID del usuario
 * @returns {Promise<{success: boolean, data?: UserData, role?: string, error?: string}>}
 */
export const findUserInCollections = async (userId) => {
  try {
    // Buscar en admins primero
    const adminResult = await getUserData(userId, COLLECTIONS.ADMINS);
    if (adminResult.success) {
      return { 
        ...adminResult, 
        role: 'admin' 
      };
    }

    // Buscar en clientes
    const clientResult = await getUserData(userId, COLLECTIONS.CLIENTS);
    if (clientResult.success) {
      return { 
        ...clientResult, 
        role: 'client' 
      };
    }

    return { 
      success: false, 
      error: 'Usuario no encontrado en ninguna colección' 
    };
  } catch (error) {
    return { 
      success: false, 
      error: handleFirestoreError(error) 
    };
  }
};

/**
 * Obtiene todos los servicios activos
 * @returns {Promise<{success: boolean, data?: Service[], error?: string}>}
 */
export const getActiveServices = async () => {
  try {
    const servicesRef = collection(db, COLLECTIONS.SERVICES);
    const q = query(servicesRef, where('isActive', '==', true), orderBy('name'));
    const querySnapshot = await getDocs(q);
    
    const services = [];
    querySnapshot.forEach((doc) => {
      services.push({ id: doc.id, ...doc.data() });
    });

    return { 
      success: true, 
      data: services 
    };
  } catch (error) {
    return { 
      success: false, 
      error: handleFirestoreError(error) 
    };
  }
};

/**
 * Crea una nueva cita
 * @param {Appointment} appointmentData - Datos de la cita
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
export const createAppointment = async (appointmentData) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.APPOINTMENTS), {
      ...appointmentData,
      createdAt: new Date(),
      status: 'pending'
    });
    
    return { 
      success: true, 
      id: docRef.id 
    };
  } catch (error) {
    return { 
      success: false, 
      error: handleFirestoreError(error) 
    };
  }
};

/**
 * Obtiene citas por cliente
 * @param {string} clientId - ID del cliente
 * @returns {Promise<{success: boolean, data?: Appointment[], error?: string}>}
 */
export const getAppointmentsByClient = async (clientId) => {
  try {
    const appointmentsRef = collection(db, COLLECTIONS.APPOINTMENTS);
    const q = query(
      appointmentsRef, 
      where('clientId', '==', clientId), 
      orderBy('date', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    const appointments = [];
    querySnapshot.forEach((doc) => {
      appointments.push({ id: doc.id, ...doc.data() });
    });

    return { 
      success: true, 
      data: appointments 
    };
  } catch (error) {
    return { 
      success: false, 
      error: handleFirestoreError(error) 
    };
  }
};

/**
 * Actualiza un documento
 * @param {string} collectionName - Nombre de la colección
 * @param {string} docId - ID del documento
 * @param {Object} data - Datos a actualizar
 * @returns {Promise<AuthResult>}
 */
export const updateDocument = async (collectionName, docId, data) => {
  try {
    await updateDoc(doc(db, collectionName, docId), {
      ...data,
      updatedAt: new Date()
    });
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: handleFirestoreError(error) 
    };
  }
};

/**
 * Elimina un documento
 * @param {string} collectionName - Nombre de la colección
 * @param {string} docId - ID del documento
 * @returns {Promise<AuthResult>}
 */
export const deleteDocument = async (collectionName, docId) => {
  try {
    await deleteDoc(doc(db, collectionName, docId));
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: handleFirestoreError(error) 
    };
  }
};
