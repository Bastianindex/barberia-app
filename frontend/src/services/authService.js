/**
 * Servicio centralizado para Firebase Authentication
 */

import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile
} from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import { FIREBASE_ERROR_CODES } from '../constants';

/**
 * Maneja errores de Firebase Auth y retorna mensajes amigables
 * @param {Error} error - Error de Firebase
 * @returns {string} Mensaje de error amigable
 */
const handleAuthError = (error) => {
  return FIREBASE_ERROR_CODES[error.code] || 'Error desconocido de autenticación';
};

/**
 * Inicia sesión con email y contraseña
 * @param {string} email - Email del usuario
 * @param {string} password - Contraseña del usuario
 * @returns {Promise<AuthResult>}
 */
export const signInUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { 
      success: true, 
      user: userCredential.user 
    };
  } catch (error) {
    console.error('Error en signInUser:', error);
    return { 
      success: false, 
      error: handleAuthError(error) 
    };
  }
};

/**
 * Cierra la sesión del usuario
 * @returns {Promise<AuthResult>}
 */
export const signOutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error('Error en signOutUser:', error);
    return { 
      success: false, 
      error: handleAuthError(error) 
    };
  }
};

/**
 * Registra un nuevo usuario
 * @param {string} email - Email del usuario
 * @param {string} password - Contraseña del usuario
 * @param {string} displayName - Nombre para mostrar
 * @returns {Promise<AuthResult>}
 */
export const registerUser = async (email, password, displayName) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Actualizar el perfil con el nombre
    if (displayName) {
      await updateProfile(user, { displayName });
    }

    return { 
      success: true, 
      user: user 
    };
  } catch (error) {
    console.error('Error en registerUser:', error);
    return { 
      success: false, 
      error: handleAuthError(error) 
    };
  }
};

/**
 * Envía email de verificación
 * @param {User} user - Usuario de Firebase
 * @returns {Promise<AuthResult>}
 */
export const sendVerificationEmail = async (user) => {
  try {
    await sendEmailVerification(user);
    return { 
      success: true, 
      message: 'Email de verificación enviado' 
    };
  } catch (error) {
    console.error('Error en sendVerificationEmail:', error);
    return { 
      success: false, 
      error: handleAuthError(error) 
    };
  }
};

/**
 * Escucha cambios en el estado de autenticación
 * @param {Function} callback - Función a ejecutar cuando cambie el estado
 * @returns {Function} Función para cancelar la suscripción
 */
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};
