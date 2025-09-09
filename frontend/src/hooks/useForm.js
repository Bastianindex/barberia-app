/**
 * Hook personalizado para manejar formularios
 */

import { useState, useCallback } from 'react';

/**
 * Hook para manejar formularios de manera eficiente
 * @param {Object} initialValues - Valores iniciales del formulario
 * @param {Function} validationFn - Función de validación
 * @returns {Object} Estado y funciones del formulario
 */
export const useForm = (initialValues = {}, validationFn = null) => {
  const safeInitialValues = initialValues || {};
  const [values, setValues] = useState(safeInitialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Actualizar un campo específico
  const setValue = useCallback((name, value) => {
    setValues(prev => ({
      ...(prev || {}),
      [name]: value
    }));
  }, []);

  // Manejar cambios en inputs
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    
    setValue(name, fieldValue);
    
    // Limpiar error cuando el usuario empieza a escribir
    if (errors && errors[name]) {
      setErrors(prev => ({
        ...(prev || {}),
        [name]: ''
      }));
    }
  }, [setValue, errors]);

  // Manejar blur (cuando el campo pierde el foco)
  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));

    // Validar solo este campo si hay función de validación
    if (validationFn && values && typeof values === 'object') {
      const validation = validationFn({ [name]: values[name] });
      if (!validation.isValid && validation.errors && validation.errors[name]) {
        setErrors(prev => ({
          ...prev,
          [name]: validation.errors[name]
        }));
      }
    }
  }, [values, validationFn]);

  // Validar todo el formulario
  const validate = useCallback(() => {
    if (!validationFn || !values || typeof values !== 'object') {
      return { isValid: true, errors: {} };
    }
    
    const validation = validationFn(values);
    const safeErrors = validation.errors || {};
    setErrors(safeErrors);
    return validation;
  }, [values, validationFn]);

  // Resetear formulario
  const reset = useCallback(() => {
    const safeInitialValues = initialValues || {};
    setValues(safeInitialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  // Establecer errores manualmente
  const setError = useCallback((name, error) => {
    setErrors(prev => ({
      ...(prev || {}),
      [name]: error
    }));
  }, []);

  // Verificar si el formulario es válido
  const isValid = errors && typeof errors === 'object' ? Object.keys(errors).length === 0 : true;

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    setValue,
    handleChange,
    handleBlur,
    validate,
    reset,
    setError,
    setIsSubmitting,
    setValues,
    setErrors
  };
};
