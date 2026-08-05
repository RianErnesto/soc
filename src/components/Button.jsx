import React, { useState } from 'react';

function Button({ children, onClick, variant = 'primary', size = 'md', disabled, loading, icon, style, ...props }) {
  const [hovered, setHovered] = useState(false);

  const variants = {
    primary: {
      background: hovered ? 'linear-gradient(135deg, #5a88ff, #9b6ff9)' : 'var(--gradient-1)',
      color: '#fff',
      border: 'none',
    },
    secondary: {
      background: hovered ? 'rgba(79, 125, 249, 0.15)' : 'rgba(79, 125, 249, 0.08)',
      color: 'var(--accent-blue)',
      border: '1px solid var(--accent-blue)',
    },
    danger: {
      background: hovered ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
      color: 'var(--accent-red)',
      border: '1px solid var(--accent-red)',
    },
    success: {
      background: hovered ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)',
      color: 'var(--accent-green)',
      border: '1px solid var(--accent-green)',
    },
    ghost: {
      background: hovered ? 'rgba(255,255,255,0.05)' : 'transparent',
      color: 'var(--text-secondary)',
      border: '1px solid transparent',
    }
  };

  const sizes = {
    sm: { padding: '6px 14px', fontSize: '12px', borderRadius: '8px' },
    md: { padding: '10px 20px', fontSize: '14px', borderRadius: '10px' },
    lg: { padding: '14px 28px', fontSize: '16px', borderRadius: '12px' },
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...variants[variant],
        ...sizes[size],
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.2s ease',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        justifyContent: 'center',
        transform: hovered && !disabled ? 'translateY(-1px)' : 'none',
        boxShadow: hovered && variant === 'primary' ? '0 4px 15px rgba(79, 125, 249, 0.3)' : 'none',
        ...style,
      }}
      {...props}
    >
      {loading ? (
        <span style={{ display: 'inline-block' }}>⏳</span>
      ) : icon ? (
        <span>{icon}</span>
      ) : null}
      {children}
    </button>
  );
}

export default Button;