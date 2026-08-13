import React from 'react';

interface LoadingSkeletonProps {
  type?: 'card' | 'list' | 'table' | 'text';
  count?: number;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ type = 'card', count = 3 }) => {
  const items = Array.from({ length: count });

  if (type === 'card') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
        {items.map((_, i) => (
          <div key={i} style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '16px',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem'
          }}>
            <div className="skeleton" style={{ width: '40%', height: '20px' }}></div>
            <div className="skeleton" style={{ width: '80%', height: '16px' }}></div>
            <div className="skeleton" style={{ width: '60%', height: '14px' }}></div>
            <div className="skeleton" style={{ width: '30%', height: '14px', marginTop: '0.5rem' }}></div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {items.map((_, i) => (
          <div key={i} style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            padding: '1rem 1.25rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', width: '60%' }}>
              <div className="skeleton" style={{ width: '70%', height: '18px' }}></div>
              <div className="skeleton" style={{ width: '40%', height: '14px' }}></div>
            </div>
            <div className="skeleton" style={{ width: '80px', height: '28px', borderRadius: '6px' }}></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {items.map((_, i) => (
        <div key={i} className="skeleton" style={{ width: '100%', height: '20px' }}></div>
      ))}
    </div>
  );
};

export default LoadingSkeleton;
