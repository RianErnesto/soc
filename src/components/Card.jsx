import React, { useState } from 'react';

function Card({ children, style, glow, gradient, hover = true, onClick, ...props }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: gradient || 'var(--bg-card)',
        borderRadius: '16px',
        border: `1px solid ${isHovered && hover ? 'var(--accent-blue)' : 'var(--border-color)'}`,
        padding: '24px',
        transition: 'all 0.3s ease',
        transform: isHovered && hover ? 'translateY(-2px)' : 'none',
        boxShadow: isHovered && glow ? '0 0 30px rgba(79, 125, 249, 0.15)' : 'var(--shadow-card)',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;