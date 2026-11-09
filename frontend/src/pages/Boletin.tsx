import React, { useState, useEffect } from 'react';
import AppLayout from '../components/layout/AppLayout';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import EmptyState from '../components/ui/EmptyState';
import { useToast } from '../contexts/ToastContext';
import { API_URL } from '../config/api';

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
    const baseStyle: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      fontSize: '0.72rem',
      fontWeight: 700,
      padding: '0.22rem 0.65rem',
      borderRadius: '99px',
      letterSpacing: '0.03em',
      whiteSpace: 'nowrap',
      fontFamily: "'Sora', sans-serif",
    };

    switch (estado) {
      case 'Excelente':
        return (
          <span style={{ ...baseStyle, background: 'rgba(124,58,237,0.18)', color: '#c4b5fd', border: '1px solid rgba(124,58,237,0.35)' }}>
            Excelente
          </span>
        );
      case 'Muy bueno':
      case 'Bueno':
      case 'Aprobado':
        return (
          <span style={{ ...baseStyle, background: 'rgba(16,185,129,0.15)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.3)' }}>
            Aprobado
          </span>
        );
      case 'Regular':
        return (
          <span style={{ ...baseStyle, background: 'rgba(245,158,11,0.15)', color: '#fcd34d', border: '1px solid rgba(245,158,11,0.3)' }}>
            Regular
          </span>
        );
      case 'Bajo':
        return (
          <span style={{ ...baseStyle, background: 'rgba(244,63,94,0.15)', color: '#fca5a5', border: '1px solid rgba(244,63,94,0.3)' }}>
            Bajo
          </span>
        );
      default:
        return (
          <span style={{ ...baseStyle, background: 'rgba(100,116,139,0.15)', color: '#94a3b8', border: '1px solid rgba(100,116,139,0.25)' }}>
            {estado}
          </span>
        );
    }
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return '#64748b';
    if (score >= 7) return '#34d399';
    if (score >= 4) return '#fbbf24';
    return '#f87171';
  };

  return (
    <AppLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

        {/* ── Page Header ───────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.3rem' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'rgba(124,58,237,0.18)', border: '1px solid rgba(124,58,237,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#a78bfa', fontSize: '1.1rem'
              }}>
                <i className="bx bx-receipt"></i>
              </div>
              <h1 style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: '1.85rem',
                fontWeight: 800,
                color: '#f8fafc',
                margin: 0,
                letterSpacing: '-0.03em'
              }}>
                Boletín Académico
              </h1>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0, paddingLeft: '3rem' }}>
              Calificaciones y promedios por período lectivo
            </p>
          </div>

          <button
            onClick={() => window.print()}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.65rem 1.2rem',
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.055)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#e2e8f0',
              fontFamily: "'Sora', sans-serif",
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.09)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.055)'; }}
          >
            <i className="bx bx-printer"></i> Imprimir
          </button>
        </div>

        {loading ? (
          <LoadingSkeleton />
        ) : boletinData.length === 0 ? (
          <EmptyState
            title="Sin registros de boletín"
            description="Actualmente no tienes materias registradas o calificaciones en el sistema."
            icon="bx-receipt"
          />
        ) : (
          <>
            {/* ── Period Selector ─────────────────── */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {boletinData.map((b) => {
                const isActive = selectedPeriodoId === b.periodo.id;
                return (
                  <button
                    key={b.periodo.id}
                    onClick={() => setSelectedPeriodoId(b.periodo.id)}
                    style={{
                      padding: '0.55rem 1.1rem',
                      borderRadius: '8px',
                      fontFamily: "'Sora', sans-serif",
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      border: '1px solid',
                      transition: 'all 0.2s ease',
                      background: isActive ? 'rgba(124,58,237,0.18)' : 'rgba(255,255,255,0.04)',
                      borderColor: isActive ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.08)',
                      color: isActive ? '#c4b5fd' : '#94a3b8',
                    }}
                  >
                    {b.periodo.nombre} ({b.periodo.anio})
                  </button>
                );
              })}
            </div>

            {currentBoletin && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                {/* ── KPI Summary Cards ─────────────── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>

                  {/* Promedio General */}
                  <div style={{
                    background: 'rgba(255,255,255,0.038)',
                    border: '1px solid rgba(255,255,255,0.075)',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem',
                    position: 'relative',
                    overflow: 'hidden',
                  }}>
                    <div style={{ position: 'absolute', top: '1rem', right: '1rem', fontSize: '1.4rem', color: 'rgba(124,58,237,0.4)' }}>
                      <i className="bx bx-trending-up"></i>
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Sora', sans-serif" }}>
                      Promedio General
                    </span>
                    <div style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: '2.8rem',
                      fontWeight: 800,
                      color: '#f8fafc',
                      letterSpacing: '-0.03em',
                      lineHeight: 1,
                    }}>
                      {currentBoletin.promedio_general !== null ? currentBoletin.promedio_general : '—'}
                    </div>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Período actual</span>
                  </div>

                  {/* Mejor Rendimiento */}
                  <div style={{
                    background: 'rgba(255,255,255,0.038)',
                    border: '1px solid rgba(255,255,255,0.075)',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem',
                    position: 'relative',
                    overflow: 'hidden',
                  }}>
                    <div style={{ position: 'absolute', top: '1rem', right: '1rem', fontSize: '1.4rem', color: 'rgba(16,185,129,0.4)' }}>
                      <i className="bx bx-medal"></i>
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Sora', sans-serif" }}>
                      Mejor Materia
                    </span>
                    <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#34d399', marginTop: '0.3rem' }}>
                      {currentBoletin.mejor_materia
                        ? currentBoletin.mejor_materia.materia
                        : 'Sin datos'}
                    </div>
                    {currentBoletin.mejor_materia && (
                      <span style={{ fontSize: '0.875rem', color: '#64748b', fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>
                        {currentBoletin.mejor_materia.promedio} / 10
                      </span>
                    )}
                  </div>

                  {/* Materias Count */}
                  <div style={{
                    background: 'rgba(255,255,255,0.038)',
                    border: '1px solid rgba(255,255,255,0.075)',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem',
                    position: 'relative',
                    overflow: 'hidden',
                  }}>
                    <div style={{ position: 'absolute', top: '1rem', right: '1rem', fontSize: '1.4rem', color: 'rgba(56,189,248,0.4)' }}>
                      <i className="bx bx-book-open"></i>
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Sora', sans-serif" }}>
                      Materias
                    </span>
                    <div style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: '2.8rem',
                      fontWeight: 800,
                      color: '#f8fafc',
                      letterSpacing: '-0.03em',
                      lineHeight: 1,
                    }}>
                      {currentBoletin.materias?.length ?? 0}
                    </div>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Cursadas este período</span>
                  </div>
                </div>

                {/* ── Subject Table ──────────────────── */}
                <div style={{
                  background: 'rgba(10,14,23,0.7)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'Sora', sans-serif" }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.025)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                        <th style={{ padding: '0.9rem 1.25rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                          Materia
                        </th>
                        <th style={{ padding: '0.9rem 1.25rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                          Trabajos
                        </th>
                        <th style={{ padding: '0.9rem 1.25rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                          Promedio
                        </th>
                        <th style={{ padding: '0.9rem 1.25rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                          Estado
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentBoletin.materias.map((mat: any, idx: number) => (
                        <tr
                          key={idx}
                          style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(124,58,237,0.04)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                        >
                          <td style={{ padding: '1rem 1.25rem', verticalAlign: 'middle' }}>
                            <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.92rem' }}>
                              {mat.materia || mat.nombre}
                            </div>
                            {mat.nombre && mat.materia && (
                              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.1rem' }}>{mat.nombre}</div>
                            )}
                          </td>
                          <td style={{ padding: '1rem 1.25rem', color: '#94a3b8', fontSize: '0.875rem', verticalAlign: 'middle' }}>
                            {mat.cantidad_calificadas} trabajos
                          </td>
                          <td style={{ padding: '1rem 1.25rem', verticalAlign: 'middle' }}>
                            <span style={{
                              fontFamily: "'Outfit', sans-serif",
                              fontWeight: 800,
                              fontSize: '1.3rem',
                              color: getScoreColor(mat.promedio),
                              letterSpacing: '-0.02em',
                            }}>
                              {mat.promedio !== null ? mat.promedio : '—'}
                            </span>
                            {mat.promedio !== null && (
                              <span style={{ color: '#64748b', fontSize: '0.78rem', marginLeft: '0.3rem' }}>/10</span>
                            )}
                          </td>
                          <td style={{ padding: '1rem 1.25rem', verticalAlign: 'middle' }}>
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
