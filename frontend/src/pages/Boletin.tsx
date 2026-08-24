import React, { useState, useEffect } from 'react';
import AppLayout from '../components/layout/AppLayout';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import EmptyState from '../components/ui/EmptyState';
import { useToast } from '../contexts/ToastContext';

const API_URL = 'http://localhost:3001/api';

const Boletin: React.FC = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [boletinData, setBoletinData] = useState<any[]>([]);
  const [selectedPeriodoId, setSelectedPeriodoId] = useState<number | null>(null);

  useEffect(() => {
    const fetchBoletin = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/boletin`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setBoletinData(Array.isArray(data) ? data : []);
          if (data.length > 0) {
            setSelectedPeriodoId(data[0].periodo.id);
          }
        } else {
          showToast('Error al obtener datos del boletín', 'error');
        }
      } catch (err) {
        console.error('Error fetching boletín:', err);
        showToast('Error de conexión con el servidor', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchBoletin();
  }, []);

  const currentBoletin = boletinData.find((b) => b.periodo.id === selectedPeriodoId) || boletinData[0];

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'Excelente':
        return <span className="badge badge-purple">Excelente</span>;
      case 'Muy bueno':
      case 'Bueno':
      case 'Aprobado':
        return <span className="badge badge-green">Aprobado</span>;
      case 'Regular':
        return <span className="badge badge-amber">Regular</span>;
      case 'Bajo':
      case 'Sin calificaciones':
        return <span className="badge badge-gray">{estado}</span>;
      default:
        return <span className="badge badge-gray">{estado}</span>;
    }
  };

  return (
    <AppLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <i className="bx bx-receipt" style={{ color: '#7c3aed' }}></i> Mi Boletín Académico
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginTop: '0.25rem' }}>
              Consulta las calificaciones y promedio por período lectivo
            </p>
          </div>

          <button
            onClick={() => window.print()}
            style={{
              padding: '0.75rem 1.25rem',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#f8fafc',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <i className="bx bx-printer"></i> Imprimir Boletín
          </button>
        </div>

        {loading ? (
          <LoadingSkeleton />
        ) : boletinData.length === 0 ? (
          <EmptyState
            title="No se encontraron registros de boletín"
            description="Actualmente no tienes materias registradas o calificaciones en el sistema."
            icon="bx-receipt"
          />
        ) : (
          <>
            {/* Period selector tabs */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {boletinData.map((b) => (
                <button
                  key={b.periodo.id}
                  onClick={() => setSelectedPeriodoId(b.periodo.id)}
                  style={{
                    padding: '0.6rem 1.25rem',
                    borderRadius: '10px',
                    background: selectedPeriodoId === b.periodo.id ? 'linear-gradient(135deg, #7c3aed, #4c1d95)' : 'rgba(30, 41, 59, 0.6)',
                    color: '#f8fafc',
                    border: selectedPeriodoId === b.periodo.id ? '1px solid #7c3aed' : '1px solid rgba(255,255,255,0.08)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {b.periodo.nombre} ({b.periodo.anio})
                </button>
              ))}
            </div>

            {currentBoletin && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Summary Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.15), rgba(56, 189, 248, 0.1))',
                    border: '1px solid rgba(124, 58, 237, 0.3)',
                    borderRadius: '16px',
                    padding: '1.25rem'
                  }}>
                    <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Promedio General del Período</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.25rem' }}>
                      {currentBoletin.promedio_general !== null ? currentBoletin.promedio_general : '—'}
                    </div>
                  </div>

                  <div style={{
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(56, 189, 248, 0.1))',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '16px',
                    padding: '1.25rem'
                  }}>
                    <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Mejor Rendimiento</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#34d399', marginTop: '0.5rem' }}>
                      {currentBoletin.mejor_materia ? `${currentBoletin.mejor_materia.materia} (${currentBoletin.mejor_materia.promedio})` : 'Sin datos'}
                    </div>
                  </div>
                </div>

                {/* Table of Subjects */}
                <div style={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        <th style={{ padding: '1rem 1.25rem', color: '#94a3b8', fontWeight: 600, fontSize: '0.85rem' }}>Materia / Clase</th>
                        <th style={{ padding: '1rem 1.25rem', color: '#94a3b8', fontWeight: 600, fontSize: '0.85rem' }}>Trabajos Calificados</th>
                        <th style={{ padding: '1rem 1.25rem', color: '#94a3b8', fontWeight: 600, fontSize: '0.85rem' }}>Promedio</th>
                        <th style={{ padding: '1rem 1.25rem', color: '#94a3b8', fontWeight: 600, fontSize: '0.85rem' }}>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentBoletin.materias.map((mat: any, idx: number) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                          <td style={{ padding: '1rem 1.25rem' }}>
                            <div style={{ fontWeight: 600, color: '#f8fafc' }}>{mat.materia || mat.nombre}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{mat.nombre}</div>
                          </td>
                          <td style={{ padding: '1rem 1.25rem', color: '#cbd5e1' }}>
                            {mat.cantidad_calificadas} trabajos
                          </td>
                          <td style={{ padding: '1rem 1.25rem', fontWeight: 700, fontSize: '1.1rem', color: mat.promedio >= 7 ? '#34d399' : mat.promedio !== null ? '#f59e0b' : '#94a3b8' }}>
                            {mat.promedio !== null ? mat.promedio : '—'}
                          </td>
                          <td style={{ padding: '1rem 1.25rem' }}>
                            {getStatusBadge(mat.estado)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Boletin;
