/**
 * Componente Card reutilizable
 */

import React, { memo } from 'react';

/**
 * Card reutilizable para contenido
 */
const Card = memo(({
  children,
  className = '',
  padding = 'md',
  ...props
}) => {
  // Tamaños de padding
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10'
  };
  
  const classes = [
    'bg-zinc-800 rounded-2xl shadow-xl border border-zinc-700',
    paddings[padding],
    className
  ].filter(Boolean).join(' ');
  
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
});

Card.displayName = 'Card';

export default Card;
