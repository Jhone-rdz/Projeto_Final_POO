import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

const GOLD = '#C9922A';
const GOLD_DARK = '#b07e1e';

/**
 * Componente de Button reutilizável — tema ReservaFácil
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading = false, className = '', children, disabled, style, ...props }, ref) => {

    const base: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      fontWeight: 700,
      borderRadius: 8,
      cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
      opacity: disabled || isLoading ? 0.6 : 1,
      transition: 'all 0.2s ease',
      fontFamily: 'inherit',
      letterSpacing: '0.01em',
    };

    const variants: Record<string, React.CSSProperties> = {
      primary: {
        backgroundColor: GOLD,
        color: '#fff',
        border: `2px solid ${GOLD}`,
      },
      secondary: {
        backgroundColor: 'transparent',
        color: GOLD,
        border: `2px solid ${GOLD}`,
      },
      danger: {
        backgroundColor: '#dc2626',
        color: '#fff',
        border: '2px solid #dc2626',
      },
    };

    const sizes: Record<string, React.CSSProperties> = {
      sm: { padding: '6px 16px', fontSize: '0.875rem' },
      md: { padding: '10px 24px', fontSize: '1rem' },
      lg: { padding: '13px 32px', fontSize: '1.1rem' },
    };

    const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || isLoading) return;
      const btn = e.currentTarget;
      if (variant === 'primary') {
        btn.style.backgroundColor = GOLD_DARK;
        btn.style.borderColor = GOLD_DARK;
      } else if (variant === 'secondary') {
        btn.style.backgroundColor = GOLD;
        btn.style.color = '#fff';
      } else if (variant === 'danger') {
        btn.style.backgroundColor = '#b91c1c';
        btn.style.borderColor = '#b91c1c';
      }
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || isLoading) return;
      const btn = e.currentTarget;
      if (variant === 'primary') {
        btn.style.backgroundColor = GOLD;
        btn.style.borderColor = GOLD;
      } else if (variant === 'secondary') {
        btn.style.backgroundColor = 'transparent';
        btn.style.color = GOLD;
      } else if (variant === 'danger') {
        btn.style.backgroundColor = '#dc2626';
        btn.style.borderColor = '#dc2626';
      }
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        style={{ ...base, ...variants[variant], ...sizes[size], ...style }}
        className={className}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';