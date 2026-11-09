import React, { useState, useEffect } from 'react';
import AppLayout from '../components/layout/AppLayout';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import EmptyState from '../components/ui/EmptyState';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import RendimientoProfesor from './RendimientoProfesor';
import { API_URL } from '../config/api';

const cardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.038)',
  border: '1px solid rgba(255,255,255,0.075)',
  borderRadius: '16px',
  padding: '1.5rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.4rem',
  position: 'relative',
  overflow: 'hidden',
};

const Rendimiento: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [rendimientoData, setRendimientoData] = useState<any>(null);
  const [evolucionData, setEvolucionData] = useState<any[]>([]);
  const [clasesProfesor, setClasesProfesor] = useState<any[]>([]);
  const [selectedClaseProfesor, setSelectedClaseProfesor] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        if (user.rol === 'profesor' || user.rol === 'admin') {
          const endpoint = user.rol === 'admin' ? '/api/admin/clases' : '/api/profesor/mis-clases';
          const res = await fetch(`${API_URL}${endpoint}`, { credentials: 'include' });
          if (res.ok) {
            const clases = await res.json();
            setClasesProfesor(Array.isArray(clases) ? clases : []);
            if (clases.length > 0) {
              setSelectedClaseProfesor(clases[0].id);
            } else {
              setSelectedClaseProfesor(null);
            }
          }
        } else {
          const [resRend, resEvol] = await Promise.all([
            fetch(`${API_URL}/rendimiento/alumno`, { credentials: 'include' }),
            fetch(`${API_URL}/rendimiento/evolucion`, { credentials: 'include' })
          ]);

          if (resRend.ok) {
            const dataR = await resRend.json();
            setRendimientoData(dataR);
          }
          if (resEvol.ok) {
            const dataE = await resEvol.json();
            setEvolucionData(Array.isArray(dataE) ? dataE : []);
          }
        }
      } catch (err) {
        console.error('Error fetching rendimiento:', err);
        showToast('Error al conectar con el servidor', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, showToast]);

  if (!user) return null;

  // ── Profesor / Admin View ─────────────────────────────────────
  if (user.rol === 'profesor') {
    return (
      <AppLayout>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: '1.85rem',
                fontWeight: 800,
                color: '#f8fafc',
                margin: 0,
                letterSpacing: '-0.03em',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
              }}>
                <i className="bx bx-bar-chart-alt-2" style={{ color: '#38bdf8', fontSize: '1.6rem' }}></i>
                Rendimiento del Alumnado
              </h1>
              <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.3rem', paddingLeft: '2.6rem' }}>
                Seguimiento de calificaciones y entregas por curso asignado
              </p>
            </div>

            {clasesProfesor.length > 0 && (
              <select
                value={selectedClaseProfesor || ''}
                onChange={(e) => setSelectedClaseProfesor(Number(e.target.value))}
                style={{
                  padding: '0.65rem 1rem',
                  borderRadius: '10px',
                  background: 'rgba(10,14,23,0.8)',
                  color: '#f8fafc',
                  border: '1px solid rgba(255,255,255,0.12)',
                  fontFamily: "'Sora', sans-serif",
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {clasesProfesor.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} ({c.materia})
                  </option>
                ))}
              </select>
            )}
          </div>

          {loading ? (
            <LoadingSkeleton />
          ) : selectedClaseProfesor ? (
            <RendimientoProfesor claseId={selectedClaseProfesor} />
          ) : (
            <EmptyState
              title="No tenés clases asignadas actualmente"
              description="Cuando la institución te asigne como docente a un curso o comisión, podrás analizar el rendimiento acá."
              icon="bx-book-open"
            />
          )}
        </div>
      </AppLayout>
    );
  }

  // ── Alumno View ───────────────────────────────────────────────
  const resumen = rendimientoData?.resumen;
  const materias = rendimientoData?.materias || [];

  return (
    <AppLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

        {/* ── Header ────────────────────────────── */}
        <div>
          <h1 style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: '1.85rem',
            fontWeight: 800,
            color: '#f8fafc',
            margin: 0,
            letterSpacing: '-0.03em',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
          }}>
            <i className="bx bx-bar-chart-alt-2" style={{ color: '#38bdf8', fontSize: '1.6rem' }}></i>
            Mi Rendimiento Académico
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.3rem', paddingLeft: '2.6rem' }}>
            Evolución de notas, entregas y promedios por materia
          </p>
        </div>

        {loading ? (
          <LoadingSkeleton />
        ) : !rendimientoData || materias.length === 0 ? (
          <EmptyState
            title="Sin materias registradas"
            description="Únete a una clase usando un código de invitación para comenzar a hacer seguimiento."
            icon="bx-bar-chart-alt-2"
          />
        ) : (
          <>
            {/* ── KPI Cards ─────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>

              {/* Promedio General */}
              <div style={cardStyle}>
                <div style={{ position: 'absolute', top: '1rem', right: '1rem', fontSize: '1.3rem', color: 'rgba(56,189,248,0.4)' }}>
                  <i className="bx bx-trending-up"></i>
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Sora', sans-serif" }}>
                  Promedio General
                </span>
                <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '2.6rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.03em', lineHeight: 1 }}>
                  {resumen?.promedio_general !== null ? resumen?.promedio_general : '—'}
                </div>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Sobre 10 puntos</span>
              </div>

              {/* Entregas */}
              <div style={cardStyle}>
                <div style={{ position: 'absolute', top: '1rem', right: '1rem', fontSize: '1.3rem', color: 'rgba(16,185,129,0.4)' }}>
                  <i className="bx bx-check-circle"></i>
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Sora', sans-serif" }}>
                  Entregados
                </span>
                <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '2.6rem', fontWeight: 800, color: '#34d399', letterSpacing: '-0.03em', lineHeight: 1 }}>
                  {resumen?.total_entregados}
                </div>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>de {resumen?.total_trabajos} trabajos</span>
              </div>

              {/* Pendientes */}
              <div style={cardStyle}>
                <div style={{ position: 'absolute', top: '1rem', right: '1rem', fontSize: '1.3rem', color: 'rgba(245,158,11,0.4)' }}>
                  <i className="bx bx-time-five"></i>
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Sora', sans-serif" }}>
                  Pendientes
                </span>
                <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '2.6rem', fontWeight: 800, color: '#fbbf24', letterSpacing: '-0.03em', lineHeight: 1 }}>
                  {resumen?.total_pendientes}
                </div>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Por entregar</span>
              </div>

              {/* Tasa de aprobación */}
              {resumen?.total_trabajos > 0 && (
                <div style={cardStyle}>
                  <div style={{ position: 'absolute', top: '1rem', right: '1rem', fontSize: '1.3rem', color: 'rgba(124,58,237,0.4)' }}>
                    <i className="bx bx-award"></i>
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Sora', sans-serif" }}>
                    Completitud
                  </span>
                  <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '2.6rem', fontWeight: 800, color: '#a78bfa', letterSpacing: '-0.03em', lineHeight: 1 }}>
                    {Math.round((resumen.total_entregados / resumen.total_trabajos) * 100)}%
                  </div>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Tasa de entrega</span>
                </div>
              )}
            </div>

            {/* ── Charts Grid ───────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>

              {/* Bar Chart: Promedio por Materia */}
              <div style={{ background: 'rgba(10,14,23,0.6)', border: '1px solid rgba(255,255,255,0.075)', borderRadius: '16px', padding: '1.5rem' }}>
                <h3 style={{ fontFamily: "'Outfit', sans-serif", color: '#f8fafc', margin: '0 0 1.5rem 0', fontSize: '1rem', fontWeight: 700 }}>
                  Promedio por Materia
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {materias.map((m: any, idx: number) => {
                    const pct = m.promedio !== null ? (m.promedio / 10) * 100 : 0;
                    const color = m.promedio >= 7 ? '#059669' : m.promedio !== null ? '#d97706' : '#475569';
                    const gradientEnd = m.promedio >= 7 ? '#34d399' : m.promedio !== null ? '#fbbf24' : '#64748b';
                    return (
                      <div key={idx}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                          <span style={{ color: '#e2e8f0', fontSize: '0.875rem', fontWeight: 600 }}>
                            {m.materia || m.nombre}
                          </span>
                          <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: '1rem', color: gradientEnd }}>
                            {m.promedio !== null ? m.promedio : '—'}
                          </span>
                        </div>
                        <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.06)', borderRadius: '5px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${pct}%`,
                            height: '100%',
                            background: `linear-gradient(90deg, ${color}, ${gradientEnd})`,
                            borderRadius: '5px',
                            transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Evolution Chart */}
              <div style={{ background: 'rgba(10,14,23,0.6)', border: '1px solid rgba(255,255,255,0.075)', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontFamily: "'Outfit', sans-serif", color: '#f8fafc', margin: '0 0 1.5rem 0', fontSize: '1rem', fontWeight: 700 }}>
                  Evolución Mensual
                </h3>
                {evolucionData.length === 0 ? (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: '0.875rem', textAlign: 'center', padding: '2rem' }}>
                    Se requiere más actividad calificada para mostrar la evolución.
                  </div>
                ) : (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', gap: '0.5rem', paddingTop: '1rem', minHeight: '180px' }}>
                    {evolucionData.map((ev, i) => {
                      const h = (ev.promedio / 10) * 150;
                      return (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '0.85rem', color: '#38bdf8', fontWeight: 800 }}>
                            {ev.promedio}
                          </span>
                          <div style={{
                            width: '32px',
                            height: `${Math.max(h, 8)}px`,
                            background: 'linear-gradient(180deg, #38bdf8 0%, #7c3aed 100%)',
                            borderRadius: '8px 8px 0 0',
                            transition: 'height 0.5s cubic-bezier(0.4,0,0.2,1)',
                          }} />
                          <span style={{ fontSize: '0.72rem', color: '#64748b', textAlign: 'center', maxWidth: '40px', lineHeight: 1.2 }}>
                            {ev.periodo}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ── Materias Detail Cards ─────────── */}
            <div>
              <h3 style={{ fontFamily: "'Outfit', sans-serif", color: '#f8fafc', margin: '0 0 1.25rem 0', fontSize: '1.1rem', fontWeight: 700 }}>
                Desglose por Clase
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                {materias.map((mat: any) => (
                  <div key={mat.clase_id} style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.065)',
                    borderRadius: '14px',
                    padding: '1.25rem',
                  }}>
                    <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.95rem', marginBottom: '0.2rem' }}>
                      {mat.materia || mat.nombre}
                    </div>
                    {mat.nombre && mat.materia && (
                      <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '0.9rem' }}>{mat.nombre}</div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: '#94a3b8' }}>
                        <span>Entregas completadas</span>
                        <strong style={{ color: '#38bdf8', fontFamily: "'Outfit', sans-serif" }}>{mat.porcentaje_entregas}%</strong>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${mat.porcentaje_entregas}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #0ea5e9, #38bdf8)',
                          borderRadius: '3px',
                          transition: 'width 0.5s ease',
                        }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                        <span>Promedio</span>
                        <strong style={{
                          fontFamily: "'Outfit', sans-serif",
                          fontWeight: 800,
                          color: mat.promedio >= 7 ? '#34d399' : mat.promedio !== null ? '#fbbf24' : '#64748b'
                        }}>
                          {mat.promedio !== null ? mat.promedio : '—'}
                        </strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Rendimiento;
