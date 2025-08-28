/**
 * Componente Button reutilizable y optimizado
 */

import React, { memo } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Botón reutilizable con diferentes variantes y estados
 */
const Button = memo(({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon: Icon = null,
  onClick,
  type = 'button',
  className = '',
  ...props
}) => {
  // Clases base
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  // Variantes de color
  const variants = {
    primary: 'bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500',
    secondary: 'bg-zinc-600 hover:bg-zinc-700 text-white focus:ring-zinc-500',
    outline: 'border-2 border-amber-600 text-amber-600 hover:bg-amber-600 hover:text-white focus:ring-amber-500',
    ghost: 'text-zinc-300 hover:text-white hover:bg-zinc-700 focus:ring-zinc-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500'
  };
  
  // Tamaños
  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg'
  };
  
  // Clase de ancho completo
  const widthClass = fullWidth ? 'w-full' : '';
  
  // Combinar todas las clases
  const classes = [
    baseClasses,
    variants[variant],
    sizes[size],
    widthClass,
    className
  ].filter(Boolean).join(' ');
  
  const isDisabled = disabled || loading;
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={classes}
      {...props}
    >
      {loading && (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      )}
      {!loading && Icon && (
        <Icon className="w-4 h-4 mr-2" />
      )}
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
