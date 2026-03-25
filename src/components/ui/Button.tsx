import React from 'react';
import { cn } from './Card';

export const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className,
  disabled,
  type = 'button'
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit';
}) => {
  const variants = {
    primary: "bg-golf-beige hover:opacity-90 text-golf-medium font-bold",
    secondary: "bg-black/20 hover:bg-black/30 text-golf-beige",
    danger: "bg-red-950/40 hover:bg-red-950/60 text-golf-beige border border-red-900/20",
    ghost: "bg-transparent hover:bg-black/10 text-golf-beige/60 hover:text-golf-beige"
  };

  return (
    <button 
      type={type}
      onClick={onClick} 
      disabled={disabled}
      className={cn(
        "px-4 py-2 rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2",
        variants[variant],
        className
      )}
    >
      {children}
    </button>
  );
};
