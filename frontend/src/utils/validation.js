/**
 * Utilidades de validación
 */

import { VALIDATION_RULES } from '../constants';

/**
 * Valida un email
 * @param {string} email - Email a validar
 * @returns {{isValid: boolean, error?: string}}
 */
export const validateEmail = (email) => {
  if (!email) {
    return { isValid: false, error: 'Email es requerido' };
  }
  
  if (!VALIDATION_RULES.EMAIL_REGEX.test(email)) {
    return { isValid: false, error: 'Email no válido' };
  }
  
  return { isValid: true };
};

/**
 * Valida una contraseña
 * @param {string} password - Contraseña a validar
 * @returns {{isValid: boolean, error?: string}}
 */
export const validatePassword = (password) => {
  if (!password) {
    return { isValid: false, error: 'Contraseña es requerida' };
  }
  
  if (password.length < VALIDATION_RULES.MIN_PASSWORD_LENGTH) {
    return { 
      isValid: false, 
      error: `Contraseña debe tener al menos ${VALIDATION_RULES.MIN_PASSWORD_LENGTH} caracteres` 
    };
  }
  
  return { isValid: true };
};

/**
 * Valida un nombre
 * @param {string} name - Nombre a validar
 * @returns {{isValid: boolean, error?: string}}
 */
export const validateName = (name) => {
  if (!name) {
    return { isValid: false, error: 'Nombre es requerido' };
  }
  
  if (name.trim().length < VALIDATION_RULES.MIN_NAME_LENGTH) {
    return { 
      isValid: false, 
      error: `Nombre debe tener al menos ${VALIDATION_RULES.MIN_NAME_LENGTH} caracteres` 
    };
  }
  
  return { isValid: true };
};

/**
 * Valida un teléfono
 * @param {string} phone - Teléfono a validar
 * @returns {{isValid: boolean, error?: string}}
 */
export const validatePhone = (phone) => {
  if (!phone) {
    return { isValid: false, error: 'Teléfono es requerido' };
  }
  
  if (!VALIDATION_RULES.PHONE_REGEX.test(phone)) {
    return { isValid: false, error: 'Teléfono no válido' };
  }
  
  return { isValid: true };
};

/**
 * Valida datos de registro de cliente
 * @param {Object} data - Datos del cliente
 * @returns {{isValid: boolean, errors: Object}}
 */
export const validateClientRegistration = (data) => {
  const errors = {};
  
  const nameValidation = validateName(data.name);
  if (!nameValidation.isValid) {
    errors.name = nameValidation.error;
  }
  
  const emailValidation = validateEmail(data.email);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.error;
  }
  
  const passwordValidation = validatePassword(data.password);
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.error;
  }
  
  if (data.phone) {
    const phoneValidation = validatePhone(data.phone);
    if (!phoneValidation.isValid) {
      errors.phone = phoneValidation.error;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Valida datos de login
 * @param {Object} data - Datos de login
 * @returns {{isValid: boolean, errors: Object}}
 */
export const validateLogin = (data) => {
  const errors = {};
  
  const emailValidation = validateEmail(data.email);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.error;
  }
  
  const passwordValidation = validatePassword(data.password);
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.error;
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
