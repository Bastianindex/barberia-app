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
 * @param {string|null} userId - ID del usuario (null para crear nuevo)
 * @param {UserData} userData - Datos del usuario
 * @param {string} collection - Colección (clients o admins)
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
export const saveUserData = async (userId, userData, collectionName = COLLECTIONS.CLIENTS) => {
  try {
    console.log('=== SAVEUSERDATA INICIO ===');
    console.log('UserId:', userId);
    console.log('UserData:', userData);
    console.log('CollectionName:', collectionName);
    
    const timestamp = new Date();
    const dataToSave = {
      ...userData,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    console.log('Datos finales a guardar:', dataToSave);

    if (userId) {
      // Actualizar documento existente
      console.log('Actualizando documento existente...');
      await setDoc(doc(db, collectionName, userId), dataToSave);
      console.log('Documento actualizado exitosamente');
      return { success: true, id: userId };
    } else {
      // Crear nuevo documento con ID automático
      console.log('Creando nuevo documento...');
      const docRef = await addDoc(collection(db, collectionName), dataToSave);
      console.log('Documento creado exitosamente con ID:', docRef.id);
      return { success: true, id: docRef.id };
    }
  } catch (error) {
    console.error('=== ERROR EN SAVEUSERDATA ===');
    console.error('Error completo:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    return { 
      success: false, 
      error: `Error guardando datos: ${error.message}` 
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
 * Busca usuario en múltiples colecciones por email o teléfono
 * @param {string} searchValue - Email o teléfono a buscar
 * @param {string[]} searchFields - Campos a buscar ['email', 'phone']
 * @returns {Promise<{success: boolean, data?: UserData, role?: string, id?: string, error?: string}>}
 */
export const findUserInCollections = async (searchValue, searchFields = ['email']) => {
  try {
    console.log('=== FINDUSERINCOLLECTIONS INICIO ===');
    console.log('SearchValue:', searchValue);
    console.log('SearchFields:', searchFields);
    
    // Buscar en clientes
    for (const field of searchFields) {
      if (!searchValue) continue;
      
      console.log(`Buscando en clients por ${field}:`, searchValue);
      const clientsRef = collection(db, COLLECTIONS.CLIENTS);
      const q = query(clientsRef, where(field, '==', searchValue));
      const querySnapshot = await getDocs(q);
      
      console.log(`Resultados en clients:`, querySnapshot.size);
      
      if (!querySnapshot.empty) {
        const clientDoc = querySnapshot.docs[0];
        const result = { 
          success: true,
          data: clientDoc.data(),
          id: clientDoc.id,
          role: 'client'
        };
        console.log('Cliente encontrado:', result);
        return result;
      }
    }

    // Buscar en admins
    for (const field of searchFields) {
      if (!searchValue) continue;
      
      console.log(`Buscando en admins por ${field}:`, searchValue);
      const adminsRef = collection(db, COLLECTIONS.ADMINS);
      const q = query(adminsRef, where(field, '==', searchValue));
      const querySnapshot = await getDocs(q);
      
      console.log(`Resultados en admins:`, querySnapshot.size);
      
      if (!querySnapshot.empty) {
        const adminDoc = querySnapshot.docs[0];
        const result = { 
          success: true,
          data: adminDoc.data(),
          id: adminDoc.id,
          role: 'admin'
        };
        console.log('Admin encontrado:', result);
        return result;
      }
    }

    console.log('Usuario no encontrado');
    return { 
      success: false, 
      error: 'Usuario no encontrado' 
    };
  } catch (error) {
    console.error('=== ERROR EN FINDUSERINCOLLECTIONS ===');
    console.error('Error completo:', error);
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

/**
 * Obtiene estadísticas de la barbería
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getBusinessAnalytics = async () => {
  try {
    const analyticsRef = collection(db, 'business_analytics');
    const querySnapshot = await getDocs(analyticsRef);
    
    let analytics = {};
    querySnapshot.forEach((doc) => {
      analytics = { id: doc.id, ...doc.data() };
    });

    return { 
      success: true, 
      data: analytics 
    };
  } catch (error) {
    return { 
      success: false, 
      error: handleFirestoreError(error) 
    };
  }
};

/**
 * Actualiza estadísticas de negocio
 * @param {Object} analyticsData - Datos de analytics
 * @returns {Promise<AuthResult>}
 */
export const updateBusinessAnalytics = async (analyticsData) => {
  try {
    const analyticsRef = collection(db, 'business_analytics');
    const querySnapshot = await getDocs(analyticsRef);
    
    if (!querySnapshot.empty) {
      // Actualizar documento existente
      const docRef = querySnapshot.docs[0].ref;
      await updateDoc(docRef, {
        ...analyticsData,
        updatedAt: new Date()
      });
    } else {
      // Crear nuevo documento
      await addDoc(analyticsRef, {
        ...analyticsData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: handleFirestoreError(error) 
    };
  }
};

/**
 * Obtiene todas las citas
 * @returns {Promise<{success: boolean, data?: Appointment[], error?: string}>}
 */
export const getAllAppointments = async () => {
  try {
    const appointmentsRef = collection(db, COLLECTIONS.APPOINTMENTS);
    const q = query(appointmentsRef, orderBy('appointmentDate', 'desc'));
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
 * Obtiene todos los clientes
 * @returns {Promise<{success: boolean, data?: Client[], error?: string}>}
 */
export const getAllClients = async () => {
  try {
    const clientsRef = collection(db, COLLECTIONS.CLIENTS);
    const q = query(clientsRef, orderBy('name'));
    const querySnapshot = await getDocs(q);
    
    const clients = [];
    querySnapshot.forEach((doc) => {
      clients.push({ id: doc.id, ...doc.data() });
    });

    return { 
      success: true, 
      data: clients 
    };
  } catch (error) {
    return { 
      success: false, 
      error: handleFirestoreError(error) 
    };
  }
};
