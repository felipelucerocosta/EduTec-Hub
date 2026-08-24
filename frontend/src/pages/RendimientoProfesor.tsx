import React, { useState, useEffect } from 'react';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import EmptyState from '../components/ui/EmptyState';
import { useToast } from '../contexts/ToastContext';

const API_URL = 'http://localhost:3001/api';

interface RendimientoProfesorProps {
  claseId: string | number;
}

const RendimientoProfesor: React.FC<RendimientoProfesorProps> = ({ claseId }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [selectedAlumno, setSelectedAlumno] = useState<any>(null);
  const [alumnoDetail, setAlumnoDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    if (!claseId) return;

    const fetchRendimientoClase = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/rendimiento/clase/${claseId}`, { credentials: 'include' });
        if (res.ok) {
          const resData = await res.json();
          setData(resData);
        } else {
          showToast('Error al cargar rendimiento de la clase', 'error');
        }
      } catch (err) {
        console.error('Error:', err);
        showToast('Error de conexión', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchRendimientoClase();
  }, [claseId]);

  const handleSelectAlumno = async (alumno: any) => {
    setSelectedAlumno(alumno);
    setLoadingDetail(true);
    try {
      const res = await fetch(`${API_URL}/rendimiento/alumno/${alumno.id}/clase/${claseId}`, { credentials: 'include' });
      if (res.ok) {
        const resData = await res.json();
        setAlumnoDetail(resData);
      }
    } catch (err) {
      console.error('Error fetching alumno detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  if (loading) return <LoadingSkeleton />;

  if (!data) return <EmptyState title="Sin datos" description="No fue posible cargar el rendimiento de la clase." icon="bx-bar-chart-alt-2" />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Metrics Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <div style={{ background: 'rgba(124, 58, 237, 0.12)', border: '1px solid rgba(124, 58, 237, 0.3)', padding: '1.25rem', borderRadius: '16px' }}>
          <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Promedio General del Curso</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.25rem' }}>
            {data.promedio_general !== null ? data.promedio_general : '—'}
          </div>
        </div>

        <div style={{ background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '1.25rem', borderRadius: '16px' }}>
          <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Total de Alumnos</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.25rem' }}>
            {data.total_alumnos}
          </div>
        </div>

        <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '1.25rem', borderRadius: '16px' }}>
          <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Trabajos Publicados</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#34d399', marginTop: '0.25rem' }}>
            {data.total_trabajos}
          </div>
        </div>
      </div>

      {/* Main Table + Detail Sidebar */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedAlumno ? '1fr 340px' : '1fr', gap: '1.5rem' }}>
        {/* Table of Students */}
        <div style={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)', fontWeight: 700, color: '#f8fafc' }}>
            Alumnos inscriptos ({data.alumnos.length})
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8', fontSize: '0.85rem' }}>Alumno</th>
                <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8', fontSize: '0.85rem' }}>Promedio</th>
                <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8', fontSize: '0.85rem' }}>% Entregas</th>
                <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8', fontSize: '0.85rem' }}>Estado</th>
                <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8', fontSize: '0.85rem' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {data.alumnos.map((alum: any) => (
                <tr
                  key={alum.id}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                    background: selectedAlumno?.id === alum.id ? 'rgba(124, 58, 237, 0.1)' : 'transparent'
                  }}
                >
                  <td style={{ padding: '0.85rem 1.25rem' }}>
                    <div style={{ fontWeight: 600, color: '#f8fafc' }}>{alum.nombre}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{alum.correo}</div>
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem', fontWeight: 700, color: alum.promedio >= 7 ? '#34d399' : alum.promedio !== null ? '#f59e0b' : '#94a3b8' }}>
                    {alum.promedio !== null ? alum.promedio : '—'}
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem', color: '#cbd5e1' }}>
                    {alum.porcentaje_entregas}% ({alum.entregados}/{data.total_trabajos})
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem' }}>
                    <span className={`badge ${
                      alum.estado_label === 'Excelente' || alum.estado_label === 'Muy bueno' ? 'badge-green' :
                      alum.estado_label === 'Bueno' ? 'badge-purple' :
                      alum.estado_label === 'Regular' ? 'badge-amber' : 'badge-red'
                    }`}>
                      {alum.estado_label}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem' }}>
                    <button
                      onClick={() => handleSelectAlumno(alum)}
                      style={{
                        padding: '0.4rem 0.8rem',
                        borderRadius: '8px',
                        background: 'rgba(56, 189, 248, 0.15)',
                        color: '#38bdf8',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Ver Detalle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Selected Alumno Detail Drawer */}
        {selectedAlumno && (
          <div style={{ background: 'rgba(30, 41, 59, 0.7)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ color: '#f8fafc', margin: 0, fontSize: '1.1rem' }}>Detalle de Alumno</h3>
              <button onClick={() => setSelectedAlumno(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1rem', borderRadius: '12px' }}>
              <div style={{ fontWeight: 700, color: '#f8fafc' }}>{selectedAlumno.nombre}</div>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{selectedAlumno.correo}</div>
            </div>

            {loadingDetail ? (
              <LoadingSkeleton />
            ) : alumnoDetail ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '400px', overflowY: 'auto' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1' }}>Calificaciones por Trabajo:</div>
                {alumnoDetail.trabajos.map((t: any) => (
                  <div key={t.id} style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.75rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.85rem' }}>{t.titulo}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.3rem', fontSize: '0.8rem' }}>
                      <span style={{ color: '#94a3b8' }}>Nota: <strong style={{ color: t.calificacion !== null ? '#34d399' : '#94a3b8' }}>{t.calificacion ?? 'Sin calificar'}</strong></span>
                      <span style={{ textTransform: 'capitalize', color: t.estado_entrega === 'corregido' ? '#34d399' : '#f59e0b' }}>{t.estado_entrega}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

export default RendimientoProfesor;
