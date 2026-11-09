import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import Button from '../../components reutilizables/Button';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import { API_URL } from '../../config/api';

interface Stats {
  total_alumnos: number;
  total_profesores: number;
  total_clases: number;
  total_trabajos: number;
  entregas_pendientes: number;
}

interface AuditoriaItem {
  id: number;
  evento: string;
  detalle?: string;
  correo?: string;
  fecha: string;
}

interface ClaseResumen {
  id: number;
  nombre: string;
  seccion?: string;
  materia: string;
  aula?: string;
  codigo: string;
  titular_nombre?: string;
  cantidad_alumnos: number;
  total_trabajos: number;
}

const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [clases, setClases] = useState<ClaseResumen[]>([]);
  const [auditoria, setAuditoria] = useState<AuditoriaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      setLoading(true);
      try {
        const [resStats, resClases, resAudit] = await Promise.all([
          fetch(`${API_URL}/admin/stats`, { credentials: 'include' }),
          fetch(`${API_URL}/admin/clases`, { credentials: 'include' }),
          fetch(`${API_URL}/admin/auditoria?limit=8`, { credentials: 'include' }),
        ]);

        if (resStats.ok) setStats(await resStats.json());
        if (resClases.ok) {
          const dataClases = await resClases.json();
          setClases(Array.isArray(dataClases) ? dataClases : []);
        }
        if (resAudit.ok) {
          const dataAudit = await resAudit.json();
          setAuditoria(Array.isArray(dataAudit) ? dataAudit : []);
        }
      } catch (err) {
        console.error('Error fetching admin telemetry:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  // Agrupamiento por divisiones para la matriz de aislamiento
  const divisionesMap = clases.reduce((acc, c) => {
    const divKey = c.seccion || 'Sin División';
    if (!acc[divKey]) acc[divKey] = [];
    acc[divKey].push(c);
    return acc;
  }, {} as Record<string, ClaseResumen[]>);

  const divisiones = Object.entries(divisionesMap);

  return (
    <AdminLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        {/* Console Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
              <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Sistema Operacional en Línea
              </span>
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#f8fafc', margin: 0, fontFamily: 'var(--font-family-display)' }}>
              Centro de Operaciones Institucional
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.25rem', margin: 0 }}>
              Telemetría de infraestructura escolar, auditoría en vivo y matriz de divisiones técnicas
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Button onClick={() => navigate('/admin/clases')} icon="bx-plus">
              Nueva Clase
            </Button>
            <Button variant="outline" onClick={() => navigate('/admin/usuarios')} icon="bx-user-plus">
              Matricular Usuario
            </Button>
          </div>
        </div>

        {/* ── Fila 1: Telemetría de Red (4 KPIs de Control) ── */}
        {loading ? (
          <LoadingSkeleton type="card" count={4} />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            {/* KPI 1: Alumnos */}
            <div
              onClick={() => navigate('/admin/usuarios?rol=alumno')}
              style={{
                background: '#0f172a',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '1.25rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.4)'; e.currentTarget.style.background = '#141d33'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.background = '#0f172a'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
                  Matrícula Estudiantil
                </span>
                <i className="bx bx-group" style={{ fontSize: '1.3rem', color: '#a78bfa' }}></i>
              </div>
              <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.35rem', fontFamily: 'var(--font-family-display)' }}>
                {stats?.total_alumnos ?? 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <i className="bx bx-check"></i> Usuarios con acceso activo
              </div>
            </div>

            {/* KPI 2: Profesores */}
            <div
              onClick={() => navigate('/admin/usuarios?rol=profesor')}
              style={{
                background: '#0f172a',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '1.25rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.4)'; e.currentTarget.style.background = '#141d33'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.background = '#0f172a'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
                  Plantel Docente
                </span>
                <i className="bx bx-chalkboard" style={{ fontSize: '1.3rem', color: '#38bdf8' }}></i>
              </div>
              <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.35rem', fontFamily: 'var(--font-family-display)' }}>
                {stats?.total_profesores ?? 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#38bdf8', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <i className="bx bx-badge-check"></i> Titulares e interinos asignados
              </div>
            </div>

            {/* KPI 3: Clases en Red */}
            <div
              onClick={() => navigate('/admin/clases')}
              style={{
                background: '#0f172a',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '1.25rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.4)'; e.currentTarget.style.background = '#141d33'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.background = '#0f172a'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
                  Aulas y Materias en Red
                </span>
                <i className="bx bx-network-chart" style={{ fontSize: '1.3rem', color: '#fbbf24' }}></i>
              </div>
              <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.35rem', fontFamily: 'var(--font-family-display)' }}>
                {stats?.total_clases ?? 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#fbbf24', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <i className="bx bx-shield"></i> Aislamiento estricto por división
              </div>
            </div>

            {/* KPI 4: Entregas y TPs */}
            <div
              style={{
                background: '#0f172a',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '1.25rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
                  Actividad de Tareas
                </span>
                <i className="bx bx-task" style={{ fontSize: '1.3rem', color: '#34d399' }}></i>
              </div>
              <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.35rem', fontFamily: 'var(--font-family-display)' }}>
                {stats?.total_trabajos ?? 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                {stats?.entregas_pendientes ?? 0} entregas pendientes de corrección
              </div>
            </div>
          </div>
        )}

        {/* ── Fila 2: Matriz de Aislamiento de Divisiones + Live Audit Log ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {/* Panel Izquierdo: Matriz Operativa de Divisiones */}
          <div
            style={{
              background: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '18px',
              padding: '1.5rem',
              gridColumn: 'span 2',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                  Matriz Operativa de Divisiones
                </h2>
                <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                  Estado de cobertura docente y asignación estanca por curso
                </span>
              </div>
              <Button variant="outline" onClick={() => navigate('/admin/clases')} icon="bx-slider-alt">
                Ver Todas las Clases
              </Button>
            </div>

            {divisiones.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                No hay divisiones registradas aún en el sistema.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                {divisiones.map(([seccion, items]) => {
                  const conDocente = items.filter((c) => c.titular_nombre).length;
                  const pctCobertura = Math.round((conDocente / items.length) * 100);

                  return (
                    <div
                      key={seccion}
                      style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: '12px',
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', fontFamily: 'var(--font-family-display)' }}>
                          {seccion}
                        </span>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: pctCobertura === 100 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: pctCobertura === 100 ? '#34d399' : '#fbbf24',
                            border: `1px solid ${pctCobertura === 100 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                            fontSize: '0.72rem',
                            fontWeight: 600,
                          }}
                        >
                          {pctCobertura}% Docentes
                        </span>
                      </div>

                      <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                        {items.length} materias registradas
                      </div>

                      {/* Mini lista de materias */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {items.slice(0, 3).map((c) => (
                          <span
                            key={c.id}
                            style={{
                              fontSize: '0.72rem',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: 'rgba(255, 255, 255, 0.04)',
                              color: '#cbd5e1',
                              fontFamily: 'var(--font-family-mono)',
                            }}
                          >
                            {c.codigo}
                          </span>
                        ))}
                        {items.length > 3 && (
                          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            +{items.length - 3} más
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Panel Derecho: Stream de Auditoría en Vivo */}
          <div
            style={{
              background: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '18px',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                  Registro de Auditoría en Vivo
                </h2>
                <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                  Telemetría de eventos de seguridad
                </span>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '2px 8px', borderRadius: '50px', fontWeight: 600 }}>
                LIVE
              </span>
            </div>

            {auditoria.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                Sin eventos de auditoría recientes.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {auditoria.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      fontSize: '0.8rem',
                    }}
                  >
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: item.evento.includes('EXITOSO') ? '#10b981' : item.evento.includes('CREACION') ? '#38bdf8' : '#fbbf24',
                        marginTop: '6px',
                        flexShrink: 0,
                      }}
                    ></span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.evento}
                      </div>
                      <div style={{ color: '#64748b', fontSize: '0.72rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.correo || item.detalle || 'Acción del sistema'}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#475569', flexShrink: 0 }}>
                      {new Date(item.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboardPage;
