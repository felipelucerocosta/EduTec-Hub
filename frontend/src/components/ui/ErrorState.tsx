import React from 'react';
import Button from '../../components reutilizables/Button';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Ocurrió un error',
  message,
  onRetry
}) => {
  return (
    <div style={{
      textAlign: 'center',
      padding: '2.5rem 1.5rem',
      background: 'rgba(244, 63, 94, 0.05)',
      border: '1px solid rgba(244, 63, 94, 0.2)',
      borderRadius: '16px',
      margin: '1rem 0'
    }}>
      <div style={{
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        background: 'rgba(244, 63, 94, 0.1)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fb7185',
        fontSize: '1.8rem',
        marginBottom: '1rem'
      }}>
        <i className="bx bx-error-circle"></i>
      </div>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f1f5f9', marginBottom: '0.4rem' }}>
        {title}
      </h3>
      <p style={{ color: '#94a3b8', fontSize: '0.88rem', maxWidth: '420px', margin: '0 auto 1.25rem', lineHeight: 1.6 }}>
        {message}
      </p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} icon="bx-refresh">
          Reintentar
        </Button>
      )}
    </div>
  );
};

export default ErrorState;
