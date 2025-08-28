/**
 * Utilidades de formato y helpers
 */

/**
 * Formatea una fecha para mostrar
 * @param {Date|string} date - Fecha a formatear
 * @returns {string} Fecha formateada
 */
export const formatDate = (date) => {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  return dateObj.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Formatea un tiempo para mostrar
 * @param {Date|string} time - Tiempo a formatear
 * @returns {string} Tiempo formateado
 */
export const formatTime = (time) => {
  if (!time) return '';
  
  const timeObj = time instanceof Date ? time : new Date(time);
  
  return timeObj.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Formatea un precio
 * @param {number} price - Precio a formatear
 * @returns {string} Precio formateado
 */
export const formatPrice = (price) => {
  if (typeof price !== 'number') return '$0';
  
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'USD'
  }).format(price);
};

/**
 * Capitaliza la primera letra de una palabra
 * @param {string} str - Cadena a capitalizar
 * @returns {string} Cadena capitalizada
 */
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Trunca un texto a una longitud específica
 * @param {string} text - Texto a truncar
 * @param {number} maxLength - Longitud máxima
 * @returns {string} Texto truncado
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Genera un ID único simple
 * @returns {string} ID único
 */
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Debounce para funciones
 * @param {Function} func - Función a hacer debounce
 * @param {number} wait - Tiempo de espera en ms
 * @returns {Function} Función con debounce
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Copia texto al portapapeles
 * @param {string} text - Texto a copiar
 * @returns {Promise<boolean>} True si se copió exitosamente
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Error al copiar al portapapeles:', err);
    return false;
  }
};

/**
 * Verifica si un objeto está vacío
 * @param {Object} obj - Objeto a verificar
 * @returns {boolean} True si está vacío
 */
export const isEmpty = (obj) => {
  return Object.keys(obj).length === 0;
};

/**
 * Elimina propiedades undefined/null de un objeto
 * @param {Object} obj - Objeto a limpiar
 * @returns {Object} Objeto limpio
 */
export const cleanObject = (obj) => {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => value != null)
  );
};
