import React, { useState, useEffect } from 'react';
import PreceptoriaAPI, { type MiAsistenciaDocenteData, type RegistroAsistenciaDocente } from '../services/preceptoria_api';

export const AsistenciasDocenteView: React.FC = () => {
  const [data, setData] = useState<MiAsistenciaDocenteData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState<string>('');

  useEffect(() => {
    cargarAsistenciaDocente();
  }, []);

  const cargarAsistenciaDocente = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await PreceptoriaAPI.getMiAsistenciaDocente();
      setData(res);
    } catch (err: any) {
      console.error('Error al cargar asistencia docente:', err);
      setError(err.message || 'Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
        <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '2.5rem', color: '#38bdf8', marginBottom: '1rem' }}></i>
        <p>Cargando registros oficiales de asistencia docente...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: '#f87171' }}>
        <i className="bx bx-error-circle" style={{ fontSize: '3rem', marginBottom: '1rem' }}></i>
        <h3>Error al obtener tus registros de asistencia</h3>
        <p>{error || 'No se pudieron recuperar los datos de asistencia.'}</p>
        <button
          onClick={cargarAsistenciaDocente}
          style={{
            marginTop: '1rem',
            padding: '0.6rem 1.4rem',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
            border: 'none',
            color: '#fff',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Reintentar
        </button>
      </div>
    );
  }

  const registrosFiltrados = data.historial.filter((reg: RegistroAsistenciaDocente) => {
    const matchEstado = filtroEstado === 'todos' || reg.estado === filtroEstado;
    const matchBusqueda = !busqueda.trim() ||
      reg.fecha.toLowerCase().includes(busqueda.toLowerCase()) ||
      (reg.motivo && reg.motivo.toLowerCase().includes(busqueda.toLowerCase())) ||
      (reg.observaciones && reg.observaciones.toLowerCase().includes(busqueda.toLowerCase()));
    return matchEstado && matchBusqueda;
  });

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'PRESENTE':
        return {
          label: 'Presente',
          bg: 'rgba(16, 185, 129, 0.15)',
          color: '#34d399',
          border: 'rgba(16, 185, 129, 0.3)',
          icon: 'bx-check-circle'
        };
      case 'TARDE':
        return {
          label: 'Llegada Tarde',
          bg: 'rgba(245, 158, 11, 0.15)',
          color: '#fbbf24',
          border: 'rgba(245, 158, 11, 0.3)',
          icon: 'bx-time'
        };
      case 'AUSENTE_JUSTIFICADO':
        return {
          label: 'Ausente Justificado',
          bg: 'rgba(56, 189, 248, 0.15)',
          color: '#38bdf8',
          border: 'rgba(56, 189, 248, 0.3)',
          icon: 'bx-file-blank'
        };
      case 'AUSENTE_INJUSTIFICADO':
        return {
          label: 'Ausente Injustificado',
          bg: 'rgba(239, 68, 68, 0.15)',
          color: '#f87171',
          border: 'rgba(239, 68, 68, 0.3)',
          icon: 'bx-x-circle'
        };
      default:
        return {
          label: estado,
          bg: 'rgba(148, 163, 184, 0.15)',
          color: '#94a3b8',
          border: 'rgba(148, 163, 184, 0.3)',
          icon: 'bx-help-circle'
        };
    }
  };

  const getSituacionBadge = () => {
    if (data.inasistenciasInjustificadas > 0) {
      return {
        label: 'Inasistencias pendientes de justificación',
        bg: 'rgba(245, 158, 11, 0.15)',
        color: '#fbbf24',
        border: 'rgba(245, 158, 11, 0.35)',
        icon: 'bx-error-circle'
      };
    }
    if (data.inasistenciasJustificadas > 0) {
      return {
        label: 'Inasistencias justificadas',
        bg: 'rgba(56, 189, 248, 0.15)',
        color: '#38bdf8',
        border: 'rgba(56, 189, 248, 0.35)',
        icon: 'bx-check-double'
      };
    }
    return {
      label: 'Asistencia normal',
      bg: 'rgba(16, 185, 129, 0.15)',
      color: '#34d399',
      border: 'rgba(16, 185, 129, 0.35)',
      icon: 'bx-shield-quarter'
    };
  };

  const situacion = getSituacionBadge();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Banner Superior de Período y Estado Laboral */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85), rgba(30, 41, 59, 0.85))',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '1.5rem 1.75rem',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1.25rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(56, 189, 248, 0.4)'
          }}>
            <i className="bx bx-briefcase-alt" style={{ fontSize: '1.8rem', color: '#fff' }}></i>
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Asistencia Laboral Docente
            </div>
            <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#f8fafc', fontWeight: 700 }}>
              {data.periodoAcademico}
            </h2>
          </div>
        </div>

        {/* Badge de Estado Laboral */}
        <div style={{
          background: situacion.bg,
          border: `1px solid ${situacion.border}`,
          borderRadius: '12px',
          padding: '0.75rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <i className={`bx ${situacion.icon}`} style={{ fontSize: '1.5rem', color: situacion.color }}></i>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Estado de Asistencia</div>
            <div style={{ color: situacion.color, fontWeight: 700, fontSize: '1.05rem' }}>
              {situacion.label}
            </div>
          </div>
        </div>
      </div>

      {/* Tarjetas de Métricas Estadísticas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem'
      }}>
        {/* Presentismo */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '14px',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Porcentaje de Asistencia</span>
            <i className="bx bx-pie-chart-alt-2" style={{ color: '#38bdf8', fontSize: '1.3rem' }}></i>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: data.porcentajeAsistencia >= 85 ? '#34d399' : '#fbbf24' }}>
            {data.porcentajeAsistencia}%
          </div>
          <div style={{
            height: '6px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '3px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${Math.min(100, Math.max(0, data.porcentajeAsistencia))}%`,
              background: data.porcentajeAsistencia >= 85 ? 'linear-gradient(90deg, #10b981, #34d399)' : 'linear-gradient(90deg, #f59e0b, #fbbf24)',
              transition: 'width 0.5s ease'
            }}></div>
          </div>
        </div>

        {/* Asistencias Registradas */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '14px',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Asistencias Registradas</span>
            <i className="bx bx-check-double" style={{ color: '#34d399', fontSize: '1.3rem' }}></i>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc' }}>
            {data.asistenciasRegistradas}
          </div>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            {data.tardesRegistradas} llegada(s) tarde registrada(s)
          </span>
        </div>

        {/* Total Inasistencias */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '14px',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Total de Inasistencias</span>
            <i className="bx bx-calendar-x" style={{ color: '#f87171', fontSize: '1.3rem' }}></i>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: data.totalInasistencias === 0 ? '#34d399' : '#f87171' }}>
            {data.totalInasistencias}
          </div>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            Días con ausencia computada
          </span>
        </div>

        {/* Desglose Justificaciones */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '14px',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Justificaciones</span>
            <i className="bx bx-file" style={{ color: '#38bdf8', fontSize: '1.3rem' }}></i>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginTop: '0.2rem' }}>
            <div>
              <span style={{ fontSize: '1.3rem', fontWeight: 700, color: '#38bdf8' }}>{data.inasistenciasJustificadas}</span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: '4px' }}>justificada(s)</span>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
            <div>
              <span style={{ fontSize: '1.3rem', fontWeight: 700, color: data.inasistenciasInjustificadas > 0 ? '#fbbf24' : '#94a3b8' }}>
                {data.inasistenciasInjustificadas}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: '4px' }}>sin justificar</span>
            </div>
          </div>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            Administradas por Rectoría y Preceptoría
          </span>
        </div>
      </div>

      {/* Nota institucional informativa */}
      <div style={{
        background: 'rgba(56, 189, 248, 0.08)',
        border: '1px solid rgba(56, 189, 248, 0.2)',
        borderRadius: '12px',
        padding: '0.9rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        fontSize: '0.88rem',
        color: '#bae6fd'
      }}>
        <i className="bx bx-info-circle" style={{ fontSize: '1.3rem', flexShrink: 0, color: '#38bdf8' }}></i>
        <span>
          <strong>Información Laboral:</strong> Este módulo refleja exclusivamente la asistencia laboral docente oficial registrada por las autoridades institucionales. Como docente, tu acceso es de consulta personal en modo lectura. Ante cualquier discrepancia en las fechas, comunícate con la Secretaría Académica.
        </span>
      </div>

      {/* Sección de Historial Personal */}
      <div style={{
        background: 'rgba(30, 41, 59, 0.5)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem'
      }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          paddingBottom: '1rem'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#f8fafc', fontWeight: 700 }}>
              Historial Personal de Asistencias
            </h3>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
              Registros cronológicos de cumplimiento laboral en el ciclo lectivo
            </span>
          </div>

          {/* Filtros */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <i className="bx bx-search" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}></i>
              <input
                type="text"
                placeholder="Buscar por fecha o motivo..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                style={{
                  padding: '0.5rem 0.75rem 0.5rem 2rem',
                  borderRadius: '8px',
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#f8fafc',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
            </div>

            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#f8fafc',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            >
              <option value="todos">Todos los Estados</option>
              <option value="PRESENTE">Presente</option>
              <option value="TARDE">Llegada Tarde</option>
              <option value="AUSENTE_JUSTIFICADO">Ausente Justificado</option>
              <option value="AUSENTE_INJUSTIFICADO">Ausente Injustificado</option>
            </select>
          </div>
        </div>

        {/* Tabla de Registros */}
        {registrosFiltrados.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
            <i className="bx bx-calendar-check" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}></i>
            <p>No se encontraron registros de asistencia con los filtros seleccionados.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Fecha</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Estado</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Motivo / Justificación</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Observaciones Autorizadas</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Registrado por</th>
                </tr>
              </thead>
              <tbody>
                {registrosFiltrados.map((reg: RegistroAsistenciaDocente) => {
                  const badge = getEstadoBadge(reg.estado);
                  return (
                    <tr
                      key={reg.id}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        transition: 'background 0.2s'
                      }}
                    >
                      <td style={{ padding: '0.9rem 1rem', fontWeight: 600, color: '#f8fafc' }}>
                        {reg.fecha}
                      </td>
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          background: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`,
                          padding: '0.25rem 0.65rem',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          fontWeight: 600
                        }}>
                          <i className={`bx ${badge.icon}`}></i>
                          {badge.label}
                        </span>
                      </td>
                      <td style={{ padding: '0.9rem 1rem', color: reg.motivo ? '#cbd5e1' : '#64748b' }}>
                        {reg.motivo || '—'}
                      </td>
                      <td style={{ padding: '0.9rem 1rem', color: reg.observaciones ? '#cbd5e1' : '#64748b' }}>
                        {reg.observaciones || '—'}
                      </td>
                      <td style={{ padding: '0.9rem 1rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                        {reg.modificado_por_nombre || 'Secretaría / Preceptoría'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AsistenciasDocenteView;
