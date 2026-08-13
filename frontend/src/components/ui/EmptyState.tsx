import React from 'react';
import Button from '../../components reutilizables/Button';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionIcon?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'bx-folder-open',
  title,
  description,
  actionLabel,
  actionIcon,
  onAction
}) => {
  return (
    <div style={{
      textAlign: 'center',
      padding: '3rem 1.5rem',
      background: 'rgba(255, 255, 255, 0.02)',
      border: '1px dashed rgba(255, 255, 255, 0.08)',
      borderRadius: '16px',
      margin: '1rem 0'
    }}>
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        background: 'rgba(124, 58, 237, 0.1)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#a78bfa',
        fontSize: '2rem',
        marginBottom: '1rem'
      }}>
        <i className={`bx ${icon}`}></i>
      </div>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f1f5f9', marginBottom: '0.4rem' }}>
        {title}
      </h3>
      <p style={{ color: '#94a3b8', fontSize: '0.88rem', maxWidth: '420px', margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} icon={actionIcon || 'bx-plus'}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
