/**
 * Componente Input reutilizable y optimizado
 */

import React, { memo, forwardRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/**
 * Input reutilizable con validación y estados
 */
const Input = memo(forwardRef(({
  label,
  error,
  helperText,
  icon: Icon = null,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  disabled = false,
  required = false,
  fullWidth = true,
  className = '',
  inputClassName = '',
  showPasswordToggle = false,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = React.useState(false);
  
  // Determinar el tipo de input
  const inputType = type === 'password' && showPassword ? 'text' : type;
  
  // Clases del contenedor
  const containerClasses = [
    fullWidth ? 'w-full' : '',
    className
  ].filter(Boolean).join(' ');
  
  // Clases del input
  const baseInputClasses = 'block w-full rounded-lg border bg-zinc-900 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  
  const inputClasses = [
    baseInputClasses,
    error 
      ? 'border-red-500 focus:ring-red-500' 
      : 'border-zinc-700 focus:ring-amber-500',
    Icon ? 'pl-10' : 'pl-4',
    showPasswordToggle ? 'pr-10' : 'pr-4',
    'py-3',
    inputClassName
  ].filter(Boolean).join(' ');
  
  return (
    <div className={containerClasses}>
      {label && (
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-3.5 h-5 w-5 text-zinc-400" />
        )}
        
        <input
          ref={ref}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          className={inputClasses}
          {...props}
        />
        
        {showPasswordToggle && type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3.5 text-zinc-400 hover:text-zinc-300 focus:outline-none"
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        )}
      </div>
      
      {error && (
        <p className="text-red-400 text-sm mt-1">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="text-zinc-400 text-sm mt-1">{helperText}</p>
      )}
    </div>
  );
}));

Input.displayName = 'Input';

export default Input;
