import React from 'react';

const GOLD = '#C9922A';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

/**
 * Componente de Input reutilizável — tema ReserveAqui
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', style, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label
            style={{
              display: 'block',
              color: GOLD,
              fontWeight: 700,
              fontSize: '1rem',
              marginBottom: 8,
              fontFamily: "'Georgia', serif",
            }}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          style={{
            width: '100%',
            backgroundColor: '#2e2b27',
            border: error ? '1.5px solid #e05555' : '1.5px solid #5a5248',
            borderRadius: 8,
            padding: '12px 16px',
            color: '#fff',
            fontSize: '0.95rem',
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.2s',
            ...style,
          }}
          className={className}
          onFocus={e => {
            if (!error) (e.currentTarget as HTMLInputElement).style.borderColor = GOLD;
          }}
          onBlur={e => {
            if (!error) (e.currentTarget as HTMLInputElement).style.borderColor = '#5a5248';
          }}
          {...props}
        />
        {error && (
          <p style={{ color: '#e05555', fontSize: '0.8rem', marginTop: 4, fontWeight: 500 }}>
            {error}
          </p>
        )}
        {helperText && !error && (
          <p style={{ color: '#888', fontSize: '0.8rem', marginTop: 4 }}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';