import React from 'react';

interface AlertProps {
  type?: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onClose?: () => void;
  className?: string;
}

const alertStyles = {
  success: {
    backgroundColor: '#1a3a1a',
    borderColor: '#2d5f2d',
    color: '#7dff7d',
  },
  error: {
    backgroundColor: '#3a1a1a',
    borderColor: '#5f2d2d',
    color: '#ff7d7d',
  },
  warning: {
    backgroundColor: '#3a2f1a',
    borderColor: '#5f4d2d',
    color: '#ffce7d',
  },
  info: {
    backgroundColor: '#1a2a3a',
    borderColor: '#2d3f5f',
    color: '#7dc8ff',
  },
};

/**
 * Componente de Alert reutilizável — tema ReserveAqui
 */
export const Alert: React.FC<AlertProps> = ({ 
  type = 'info', 
  message, 
  onClose,
  className = '' 
}) => {
  const style = alertStyles[type];

  return (
    <div
      style={{
        backgroundColor: style.backgroundColor,
        border: `1.5px solid ${style.borderColor}`,
        borderRadius: 8,
        padding: '12px 16px',
        color: style.color,
        fontSize: '0.95rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
      }}
      className={className}
      role="alert"
    >
      <span>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: style.color,
            cursor: 'pointer',
            fontSize: '1.2rem',
            padding: '0 8px',
            marginLeft: 12,
          }}
          aria-label="Fechar alerta"
        >
          ×
        </button>
      )}
    </div>
  );
};