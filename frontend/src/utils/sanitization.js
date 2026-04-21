/**
 * Utilidades de sanitización para prevenir XSS y ataques de inyección.
 */

/**
 * Escapa caracteres HTML peligrosos de un string.
 * @param {string} str - El string a sanitizar.
 * @returns {string} El string sanitizado.
 */
export const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    "/": '&#x2F;',
  };
  
  const reg = /[&<>"'/]/ig;
  return str.replace(reg, (match) => map[match]);
};

/**
 * Limpia un objeto de datos de entrada.
 * @param {Object} data - El objeto con los campos a sanitizar.
 * @returns {Object} El objeto con los valores sanitizados.
 */
export const sanitizeData = (data) => {
  const sanitized = {};
  for (const key in data) {
    if (typeof data[key] === 'string') {
      sanitized[key] = sanitizeString(data[key]);
    } else {
      sanitized[key] = data[key];
    }
  }
  return sanitized;
};
