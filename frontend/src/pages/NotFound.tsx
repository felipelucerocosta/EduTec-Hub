import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components reutilizables/Button';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-dark)',
      color: 'var(--text-main)',
      padding: '2rem',
      textAlign: 'center'
    }}>
      <div style={{
        fontSize: '6rem',
        fontWeight: 800,
        background: 'linear-gradient(135deg, #7c3aed, #38bdf8)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        lineHeight: 1
      }}>
        404
      </div>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '1rem 0 0.5rem' }}>
        Página No Encontrada
      </h1>
      <p style={{ color: '#94a3b8', fontSize: '0.95rem', maxWidth: '440px', marginBottom: '2rem' }}>
        Lo sentimos, la dirección que buscas no existe o ha sido movida. Puedes volver al panel principal.
      </p>
      <Button onClick={() => navigate('/')} icon="bx-home">
        Volver al Inicio
      </Button>
    </div>
  );
};

export default NotFound;
