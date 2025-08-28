/**
 * Constantes de la aplicación
 */

// Rutas de navegación
export const ROUTES = {
  CLIENT_REGISTRATION: 'clientRegistration',
  SERVICE_SELECTION: 'serviceSelection',
  APPOINTMENT_BOOKING: 'appointmentBooking',
  LOGIN: 'login',
  ADMIN_PANEL: 'adminPanel',
  DASHBOARD: 'dashboard'
};

// Roles de usuario
export const USER_ROLES = {
  CLIENT: 'client',
  ADMIN: 'admin',
  DEVELOPER: 'developer'
};

// Estados de notificación
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// Colecciones de Firestore
export const COLLECTIONS = {
  CLIENTS: 'clients',
  ADMINS: 'admins',
  APPOINTMENTS: 'appointments',
  SERVICES: 'services'
};

// Códigos de error de Firebase
export const FIREBASE_ERROR_CODES = {
  'auth/user-not-found': 'Usuario no encontrado',
  'auth/wrong-password': 'Contraseña incorrecta',
  'auth/invalid-email': 'Correo electrónico no válido',
  'auth/invalid-credential': 'Credenciales incorrectas',
  'auth/too-many-requests': 'Demasiados intentos fallidos',
  'auth/email-already-in-use': 'Este correo ya está registrado',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres'
};

// Configuración de la aplicación
export const APP_CONFIG = {
  APP_NAME: 'Olimu Barbershop',
  SUPPORT_EMAIL: 'soporte@olimu.com',
  PHONE: '+1234567890'
};

// Validaciones
export const VALIDATION_RULES = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^\+?[\d\s-()]+$/,
  MIN_PASSWORD_LENGTH: 6,
  MIN_NAME_LENGTH: 2
};
