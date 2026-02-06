import React from 'react';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
};

export default function Button({ variant = 'ghost', size = 'md', className = '', children, ...rest }: Props) {
  const sizeCls = size === 'lg' ? 'px-8 py-4 text-lg' : size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-6 py-3 text-base';
  // Add smooth transitions for colors, shadow and transform, and a subtle lift on hover
  const base = `inline-flex items-center justify-center gap-2 rounded-full font-semibold transform transition-colors transition-shadow transition-transform duration-200 ease-out hover:-translate-y-0.5 ${sizeCls}`;
  const variantCls = variant === 'primary'
    ? 'bg-black text-white hover:brightness-110 hover:shadow-md'
    : 'bg-transparent text-white border border-white/10 hover:bg-white/12 hover:border-white/30 hover:shadow-sm';
  return (
    <button className={`${base} ${variantCls} ${className}`} {...rest}>
      {children}
    </button>
  );
}
