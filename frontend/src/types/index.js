/**
 * Tipos TypeScript para la aplicación (documentación para JavaScript)
 */

/**
 * @typedef {Object} User
 * @property {string} uid - ID único del usuario
 * @property {string} email - Email del usuario
 * @property {string} displayName - Nombre para mostrar
 * @property {boolean} emailVerified - Si el email está verificado
 */

/**
 * @typedef {Object} UserData
 * @property {string} name - Nombre completo
 * @property {string} email - Email
 * @property {string} phone - Teléfono (solo clientes)
 * @property {string} role - Rol del usuario
 * @property {Date} createdAt - Fecha de creación
 * @property {boolean} emailVerified - Email verificado
 * @property {boolean} isActive - Usuario activo
 * @property {string[]} permissions - Permisos (solo admins)
 */

/**
 * @typedef {Object} Service
 * @property {string} id - ID del servicio
 * @property {string} name - Nombre del servicio
 * @property {string} description - Descripción
 * @property {number} duration - Duración en minutos
 * @property {number} price - Precio
 * @property {boolean} isActive - Servicio activo
 */

/**
 * @typedef {Object} Appointment
 * @property {string} id - ID de la cita
 * @property {string} clientId - ID del cliente
 * @property {string} serviceId - ID del servicio
 * @property {Date} date - Fecha de la cita
 * @property {string} time - Hora de la cita
 * @property {string} status - Estado de la cita
 * @property {string} clientName - Nombre del cliente
 * @property {string} clientPhone - Teléfono del cliente
 * @property {string} serviceName - Nombre del servicio
 * @property {number} servicePrice - Precio del servicio
 */

/**
 * @typedef {Object} AuthResult
 * @property {boolean} success - Si la operación fue exitosa
 * @property {string} [message] - Mensaje de éxito
 * @property {string} [error] - Mensaje de error
 * @property {User} [user] - Usuario (si aplica)
 * @property {UserData} [userData] - Datos del usuario (si aplica)
 * @property {string} [role] - Rol del usuario (si aplica)
 */

/**
 * @typedef {Object} NotificationData
 * @property {string} message - Mensaje de la notificación
 * @property {'success'|'error'|'warning'|'info'} type - Tipo de notificación
 */

/**
 * @typedef {Object} ValidationError
 * @property {string} field - Campo con error
 * @property {string} message - Mensaje de error
 */

export default {};
