import React, { useState, useEffect } from 'react';
import PreceptoriaAPI, { type MiAsistenciaData, type ConstanciaItem } from '../services/preceptoria_api';

export const AsistenciasAlumnoView: React.FC = () => {
  const [data, setData] = useState<MiAsistenciaData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal de solicitud de constancia
  const [showModal, setShowModal] = useState<boolean>(false);
  const [motivo, setMotivo] = useState<string>('Presentación ante organismo oficial / Obra social / Trámite familiar');
  const [enviando, setEnviando] = useState<boolean>(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // Modal de visualización de constancia emitida
  const [constanciaSeleccionada, setConstanciaSeleccionada] = useState<ConstanciaItem | null>(null);

  // Filtro de materia
  const [filtroMateria, setFiltroMateria] = useState<string>('todas');

  useEffect(() => {
    cargarAsistencias();
  }, []);

  const cargarAsistencias = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await PreceptoriaAPI.getMiAsistencia();
      setData(res);
    } catch (err: any) {
      console.error('Error al cargar mis asistencias:', err);
      setError(err.message || 'Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleSolicitarConstancia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!motivo.trim()) return;

    try {
      setEnviando(true);
      await PreceptoriaAPI.solicitarConstancia(motivo);
      setMensajeExito('¡Solicitud enviada a Preceptoría! Un preceptor revisará tu condición a la brevedad.');
      setShowModal(false);
      setMotivo('Presentación ante organismo oficial / Obra social / Trámite familiar');
      // Recargar datos
      await cargarAsistencias();
      setTimeout(() => setMensajeExito(null), 6000);
    } catch (err: any) {
      alert(err.message || 'Error al enviar solicitud');
    } finally {
      setEnviando(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
        <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '2.5rem', color: '#38bdf8', marginBottom: '1rem' }}></i>
        <p>Cargando registros oficiales de asistencia...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: '#f87171' }}>
        <i className="bx bx-error-circle" style={{ fontSize: '3rem', marginBottom: '1rem' }}></i>
        <h3>Error al obtener tus registros</h3>
        <p>{error || 'No se pudieron recuperar los datos de asistencia.'}</p>
        <button
          onClick={cargarAsistencias}
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

  // Lista de materias para filtro
  const materias = Array.from(new Set(data.registros.map(r => r.materia_nombre || r.clase_nombre))).filter(Boolean);
  const registrosFiltrados = filtroMateria === 'todas'
    ? data.registros
    : data.registros.filter(r => (r.materia_nombre || r.clase_nombre) === filtroMateria);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Aviso de confirmación */}
      {mensajeExito && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#34d399',
          padding: '1rem 1.25rem',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <i className="bx bx-check-circle" style={{ fontSize: '1.4rem' }}></i>
          <span>{mensajeExito}</span>
        </div>
      )}

      {/* Banner Superior de Período y Estado de Regularidad */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.8))',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.25rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            background: data.esRegular ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${data.esRegular ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.75rem',
            color: data.esRegular ? '#34d399' : '#f87171'
          }}>
            <i className={`bx ${data.esRegular ? 'bx-check-shield' : 'bx-error-alt'}`}></i>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Condición Institucional
              </span>
              <span style={{
                fontSize: '0.8rem',
                padding: '0.2rem 0.65rem',
                borderRadius: '999px',
                fontWeight: 700,
                background: data.esRegular ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                color: data.esRegular ? '#34d399' : '#f87171',
                border: `1px solid ${data.esRegular ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`
              }}>
                {data.estadoRegularidad.toUpperCase()}
              </span>
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f8fafc', margin: '0.25rem 0' }}>
              {data.periodoAcademico}
            </h2>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
              El porcentaje de presentismo mínimo requerido por el reglamento técnico escolar es del <strong>75%</strong>.
            </p>
          </div>
        </div>

        {/* Botón Solicitar Constancia */}
        <button
          onClick={() => setShowModal(true)}
          style={{
            padding: '0.75rem 1.4rem',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
            color: '#ffffff',
            border: 'none',
            fontWeight: 700,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(124, 58, 237, 0.35)',
            transition: 'all 0.2s ease'
          }}
        >
          <i className="bx bx-file-blank" style={{ fontSize: '1.2rem' }}></i>
          Solicitar Constancia de Alumno Regular
        </button>
      </div>

      {/* Tarjetas informativas con estadísticas reales */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem'
      }}>
        {/* Presentismo % */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '14px',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Porcentaje de Asistencia</span>
            <i className="bx bx-pie-chart-alt-2" style={{ fontSize: '1.3rem', color: '#38bdf8' }}></i>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: data.esRegular ? '#38bdf8' : '#f87171' }}>
            {data.porcentajeAsistencia}%
          </div>
          <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{
              width: `${Math.min(data.porcentajeAsistencia, 100)}%`,
              height: '100%',
              background: data.esRegular ? 'linear-gradient(90deg, #38bdf8, #10b981)' : '#f87171',
              borderRadius: '999px'
            }} />
          </div>
        </div>

        {/* Asistencias Registradas */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '14px',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Asistencias Registradas</span>
            <i className="bx bx-check-circle" style={{ fontSize: '1.3rem', color: '#34d399' }}></i>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#34d399' }}>
            {data.totalAsistenciasRegistradas}
          </div>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Jornadas escolares con presentismo registrado
          </span>
        </div>

        {/* Total Inasistencias */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '14px',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Total de Inasistencias</span>
            <i className="bx bx-x-circle" style={{ fontSize: '1.3rem', color: '#f87171' }}></i>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f87171' }}>
            {data.totalInasistencias}
          </div>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Ausencias acumuladas en el período
          </span>
        </div>

        {/* Tardanzas y Justificados */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '14px',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Tardes / Justificados</span>
            <i className="bx bx-time" style={{ fontSize: '1.3rem', color: '#fbbf24' }}></i>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fbbf24' }}>
            {data.totalTardes} <span style={{ fontSize: '1rem', color: '#94a3b8', fontWeight: 500 }}>/ {data.totalJustificados} justif.</span>
          </div>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Llegadas tarde y ausencias con certificado
          </span>
        </div>
      </div>

      {/* Historial de Solicitudes de Constancias (si existen) */}
      {data.constancias && data.constancias.length > 0 && (
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <i className="bx bx-receipt" style={{ fontSize: '1.4rem', color: '#a78bfa' }}></i>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc', fontWeight: 700 }}>
              Mis Solicitudes de Constancia de Alumno Regular
            </h3>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Fecha Solicitud</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Motivo</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Estado</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Preceptor Responsable</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Constancia</th>
                </tr>
              </thead>
              <tbody>
                {data.constancias.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '0.75rem 1rem', color: '#cbd5e1' }}>
                      {new Date(c.fecha_solicitud).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#f8fafc', fontWeight: 500 }}>
                      {c.motivo}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{
                        padding: '0.25rem 0.65rem',
                        borderRadius: '999px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        background:
                          c.estado === 'APROBADA' ? 'rgba(16,185,129,0.15)' :
                          c.estado === 'RECHAZADA' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                        color:
                          c.estado === 'APROBADA' ? '#34d399' :
                          c.estado === 'RECHAZADA' ? '#f87171' : '#fbbf24',
                        border: `1px solid ${
                          c.estado === 'APROBADA' ? 'rgba(16,185,129,0.3)' :
                          c.estado === 'RECHAZADA' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'
                        }`
                      }}>
                        {c.estado}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#94a3b8' }}>
                      {c.preceptor_nombre || 'En revisión por Preceptoría'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      {c.estado === 'APROBADA' ? (
                        <button
                          onClick={() => setConstanciaSeleccionada(c)}
                          style={{
                            padding: '0.4rem 0.85rem',
                            borderRadius: '8px',
                            background: 'rgba(56, 189, 248, 0.15)',
                            color: '#38bdf8',
                            border: '1px solid rgba(56, 189, 248, 0.3)',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem'
                          }}
                        >
                          <i className="bx bx-download"></i> Ver Constancia
                        </button>
                      ) : (
                        <span style={{ color: '#64748b', fontSize: '0.8rem' }}>No disponible</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tabla detallada de asistencias individuales */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#f8fafc', fontWeight: 700 }}>
              Detalle Histórico de Asistencias
            </h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
              Registros asentados oficialmente por Preceptoría en tus comisiones.
            </p>
          </div>

          {/* Filtro por materia */}
          {materias.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Materia:</label>
              <select
                value={filtroMateria}
                onChange={e => setFiltroMateria(e.target.value)}
                style={{
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#f8fafc',
                  padding: '0.45rem 0.85rem',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              >
                <option value="todas">Todas las materias</option>
                {materias.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {registrosFiltrados.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            <i className="bx bx-calendar-x" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}></i>
            <p>No se encontraron registros de asistencia para el filtro seleccionado.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Fecha</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Materia / Comisión</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Condición</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Observaciones</th>
                </tr>
              </thead>
              <tbody>
                {registrosFiltrados.map(r => {
                  const est = (r.estado || '').toUpperCase();
                  const badgeColor =
                    est === 'PRESENTE' ? { bg: 'rgba(16,185,129,0.15)', text: '#34d399', border: 'rgba(16,185,129,0.3)' } :
                    est === 'AUSENTE' ? { bg: 'rgba(239,68,68,0.15)', text: '#f87171', border: 'rgba(239,68,68,0.3)' } :
                    est === 'TARDE' ? { bg: 'rgba(245,158,11,0.15)', text: '#fbbf24', border: 'rgba(245,158,11,0.3)' } :
                    { bg: 'rgba(56,189,248,0.15)', text: '#38bdf8', border: 'rgba(56,189,248,0.3)' };

                  return (
                    <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '0.75rem 1rem', color: '#cbd5e1', fontWeight: 600 }}>
                        {r.fecha}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#f8fafc' }}>
                        {r.materia_nombre || r.clase_nombre}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{
                          padding: '0.25rem 0.65rem',
                          borderRadius: '999px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          background: badgeColor.bg,
                          color: badgeColor.text,
                          border: `1px solid ${badgeColor.border}`
                        }}>
                          {est}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#94a3b8' }}>
                        {r.observacion || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── MODAL: SOLICITAR CONSTANCIA ────────────────────────────────────────── */}
      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1200,
          padding: '1rem'
        }}>
          <div style={{
            background: '#0f172a',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '520px',
            padding: '1.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <i className="bx bx-file-blank" style={{ fontSize: '1.5rem', color: '#a78bfa' }}></i>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#f8fafc', fontWeight: 700 }}>
                  Solicitud de Constancia
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.4rem', cursor: 'pointer' }}
              >
                <i className="bx bx-x"></i>
              </button>
            </div>

            <p style={{ margin: 0, fontSize: '0.88rem', color: '#94a3b8' }}>
              Tu solicitud será recibida por el equipo de Preceptoría. Para que la constancia sea aprobada, debes mantener tu condición de alumno regular.
            </p>

            <form onSubmit={handleSolicitarConstancia} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                  Motivo o Destino del Certificado *
                </label>
                <input
                  required
                  type="text"
                  value={motivo}
                  onChange={e => setMotivo(e.target.value)}
                  placeholder="Ej: Presentar en ANSES, Obra Social, Beca Progresar..."
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#f8fafc',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '0.6rem 1.2rem',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.06)',
                    color: '#cbd5e1',
                    border: 'none',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviando}
                  style={{
                    padding: '0.6rem 1.4rem',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 700,
                    cursor: enviando ? 'not-allowed' : 'pointer'
                  }}
                >
                  {enviando ? 'Enviando...' : 'Confirmar Solicitud'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: VER CONSTANCIA EMITIDA ────────────────────────────────────────── */}
      {constanciaSeleccionada && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1300,
          padding: '1rem'
        }}>
          <div style={{
            background: '#ffffff',
            color: '#0f172a',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '650px',
            padding: '2.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            fontFamily: "'Times New Roman', Times, serif"
          }}>
            {/* Cabecera Oficial */}
            <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '1rem' }}>
              <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.3rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Escuela Técnica N° 29 DE 6 — Tech-Room
              </h2>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#334155' }}>
                CONSTANCIA OFICIAL DE ALUMNO REGULAR
              </h3>
            </div>

            {/* Cuerpo del documento */}
            <div style={{ fontSize: '1rem', lineHeight: 1.6, textAlign: 'justify' }}>
              <p>
                Por medio de la presente, la <strong>Preceptoría Institucional</strong> hace constar que el/la estudiante se encuentra formalmente inscripto/a y cursando en calidad de <strong>ALUMNO/A REGULAR</strong> durante el presente Ciclo Lectivo 2026.
              </p>
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', margin: '1rem 0', fontFamily: 'sans-serif', fontSize: '0.9rem' }}>
                <p style={{ margin: '0 0 0.4rem 0' }}><strong>Motivo declarado:</strong> {constanciaSeleccionada.motivo}</p>
                <p style={{ margin: '0 0 0.4rem 0' }}><strong>Código de Validación Único:</strong> <code style={{ background: '#e2e8f0', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>{constanciaSeleccionada.codigo_verificacion || 'CAR-2026-REGULAR'}</code></p>
                <p style={{ margin: '0 0 0.4rem 0' }}><strong>Fecha de Emisión:</strong> {constanciaSeleccionada.fecha_resolucion ? new Date(constanciaSeleccionada.fecha_resolucion).toLocaleDateString() : new Date().toLocaleDateString()}</p>
                <p style={{ margin: 0 }}><strong>Preceptor Responsable:</strong> {constanciaSeleccionada.preceptor_nombre || 'Preceptoría Institucional'}</p>
              </div>
              <p style={{ fontSize: '0.88rem', color: '#475569' }}>
                Se expide la presente a pedido del interesado y para ser presentada ante quien corresponda, en la Ciudad Autónoma de Buenos Aires.
              </p>
            </div>

            {/* Acciones */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem', fontFamily: 'sans-serif' }}>
              <button
                onClick={() => window.print()}
                style={{
                  padding: '0.6rem 1.2rem',
                  borderRadius: '8px',
                  background: '#0f172a',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <i className="bx bx-printer"></i> Imprimir Constancia
              </button>
              <button
                onClick={() => setConstanciaSeleccionada(null)}
                style={{
                  padding: '0.6rem 1.2rem',
                  borderRadius: '8px',
                  background: '#e2e8f0',
                  color: '#334155',
                  border: 'none',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AsistenciasAlumnoView;
