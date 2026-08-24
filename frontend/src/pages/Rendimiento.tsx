import React, { useState, useEffect } from 'react';
import AppLayout from '../components/layout/AppLayout';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import EmptyState from '../components/ui/EmptyState';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import RendimientoProfesor from './RendimientoProfesor';

const API_URL = 'http://localhost:3001/api';

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
          const res = await fetch(`${API_URL}/clases`, { credentials: 'include' });
          if (res.ok) {
            const clases = await res.json();
            setClasesProfesor(Array.isArray(clases) ? clases : []);
            if (clases.length > 0) {
              setSelectedClaseProfesor(clases[0].id);
            }
          }
        } else {
          // Alumno data
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
  }, [user]);

  if (!user) return null;

  // Render for Professor
  if (user.rol === 'profesor') {
    return (
      <AppLayout>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <i className="bx bx-bar-chart-alt-2" style={{ color: '#38bdf8' }}></i> Rendimiento del Alumnado
              </h1>
              <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginTop: '0.25rem' }}>
                Seguimiento de calificaciones y entregas por curso
              </p>
            </div>

            {clasesProfesor.length > 0 && (
              <select
                value={selectedClaseProfesor || ''}
                onChange={(e) => setSelectedClaseProfesor(Number(e.target.value))}
                style={{
                  padding: '0.65rem 1rem',
                  borderRadius: '12px',
                  background: 'rgba(30, 41, 59, 0.8)',
                  color: '#f8fafc',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  fontSize: '0.95rem',
                  fontWeight: 600
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
            <EmptyState title="Sin clases disponibles" description="Crea una clase para ver el rendimiento de tus alumnos." icon="bx-book-open" />
          )}
        </div>
      </AppLayout>
    );
  }

  // Render for Student
  const resumen = rendimientoData?.resumen;
  const materias = rendimientoData?.materias || [];

  return (
    <AppLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        {/* Header */}
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <i className="bx bx-bar-chart-alt-2" style={{ color: '#38bdf8' }}></i> Mi Rendimiento Académico
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginTop: '0.25rem' }}>
            Visualiza la evolución de tus notas, entregas y promedios por materia
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
            {/* KPI Resumen Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
              <div style={{ background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(124, 58, 237, 0.1))', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '16px', padding: '1.25rem' }}>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Promedio General</div>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.25rem' }}>
                  {resumen?.promedio_general !== null ? resumen?.promedio_general : '—'}
                </div>
              </div>

              <div style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(56, 189, 248, 0.1))', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '16px', padding: '1.25rem' }}>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Trabajos Entregados</div>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#34d399', marginTop: '0.25rem' }}>
                  {resumen?.total_entregados} <span style={{ fontSize: '1rem', color: '#94a3b8', fontWeight: 400 }}>/ {resumen?.total_trabajos}</span>
                </div>
              </div>

              <div style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(244, 63, 94, 0.1))', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '16px', padding: '1.25rem' }}>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Trabajos Pendientes</div>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fbbf24', marginTop: '0.25rem' }}>
                  {resumen?.total_pendientes}
                </div>
              </div>
            </div>

            {/* SVG Charts Section */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {/* Bar Chart: Subject Comparison */}
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <h3 style={{ color: '#f8fafc', margin: '0 0 1.25rem 0', fontSize: '1rem', fontWeight: 700 }}>
                  Promedio por Materia
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {materias.map((m: any, idx: number) => {
                    const pct = m.promedio !== null ? (m.promedio / 10) * 100 : 0;
                    return (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                          <span style={{ color: '#f8fafc', fontWeight: 600 }}>{m.materia || m.nombre}</span>
                          <span style={{ color: m.promedio >= 7 ? '#34d399' : m.promedio !== null ? '#f59e0b' : '#94a3b8', fontWeight: 700 }}>
                            {m.promedio !== null ? m.promedio : 'Sin nota'}
                          </span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${pct}%`,
                              height: '100%',
                              background: m.promedio >= 7 ? 'linear-gradient(90deg, #10b981, #34d399)' : 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                              borderRadius: '4px',
                              transition: 'width 0.5s ease'
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Line Chart / Evolution */}
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ color: '#f8fafc', margin: '0 0 1.25rem 0', fontSize: '1rem', fontWeight: 700 }}>
                  Evolución Mensual
                </h3>
                {evolucionData.length === 0 ? (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '0.9rem' }}>
                    Se requiere más actividad calificada para mostrar la gráfica de evolución.
                  </div>
                ) : (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', gap: '0.5rem', paddingTop: '1rem', minHeight: '180px' }}>
                    {evolucionData.map((ev, i) => {
                      const h = (ev.promedio / 10) * 140;
                      return (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 700 }}>{ev.promedio}</span>
                          <div
                            style={{
                              width: '28px',
                              height: `${h}px`,
                              background: 'linear-gradient(180deg, #38bdf8, #7c3aed)',
                              borderRadius: '6px 6px 0 0',
                              transition: 'height 0.5s ease'
                            }}
                          />
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{ev.periodo}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Materias Detailed List */}
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '1.5rem' }}>
              <h3 style={{ color: '#f8fafc', margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 700 }}>
                Desglose por Clase
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                {materias.map((mat: any) => (
                  <div key={mat.clase_id} style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <div style={{ fontWeight: 700, color: '#f8fafc' }}>{mat.materia || mat.nombre}</div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.75rem' }}>{mat.nombre}</div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#cbd5e1' }}>
                      <span>Entregas completadas:</span>
                      <strong style={{ color: '#38bdf8' }}>{mat.porcentaje_entregas}%</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#cbd5e1', marginTop: '0.25rem' }}>
                      <span>Promedio:</span>
                      <strong style={{ color: mat.promedio >= 7 ? '#34d399' : mat.promedio !== null ? '#f59e0b' : '#94a3b8' }}>
                        {mat.promedio !== null ? mat.promedio : '—'}
                      </strong>
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
