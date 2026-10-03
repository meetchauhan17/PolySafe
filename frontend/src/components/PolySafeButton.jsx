// src/components/PolySafeButton.jsx
// Backward-compatible shim → delegates to new Button.jsx
import React from 'react';
import Button from './Button';
import { Loader2 } from 'lucide-react';

/**
 * PolySafeButton — legacy shim kept for backward compat.
 * Maps old variant names to new Button variants.
 * New code should import Button directly.
 */
export default function PolySafeButton({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  disabled = false,
  loading = false,
  className = '',
  children,
  onClick,
  type = 'button',
  ...props
}) {
  // Map old variant names to new system
  const variantMap = {
    primary: 'primary',
    secondary: 'secondary',
    teal: 'primary',     // teal → brand primary
    ghost: 'ghost',
    danger: 'danger',
    doctor: 'doctor',
  };

  const sizeMap = { sm: 'sm', md: 'md', lg: 'lg' };

  return (
    <Button
      type={type}
      variant={variantMap[variant] || 'primary'}
      size={sizeMap[size] || 'md'}
      disabled={disabled}
      loading={loading}
      icon={Icon && !loading ? (typeof Icon === 'function' ? <Icon className="w-4 h-4" /> : Icon) : undefined}
      className={className}
      onClick={onClick}
      {...props}
    >
      {children}
    </Button>
  );
}
