import React, { useState, useEffect } from 'react';
import PreceptoriaAPI, {
  type AdminAsistenciaDocenteItem,
  type ListarAsistenciasDocentesResponse
} from '../services/preceptoria_api';

export const AdminAsistenciasDocentesView: React.FC = () => {
  const [fecha, setFecha] = useState<string>(new Date().toISOString().split('T')[0]);
  const [busqueda, setBusqueda] = useState<string>('');
  const [data, setData] = useState<ListarAsistenciasDocentesResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  // Modal para justificación / observaciones
  const [modalDocente, setModalDocente] = useState<AdminAsistenciaDocenteItem | null>(null);
  const [estadoModal, setEstadoModal] = useState<'PRESENTE' | 'AUSENTE_JUSTIFICADO' | 'AUSENTE_INJUSTIFICADO' | 'TARDE'>('AUSENTE_JUSTIFICADO');
  const [motivoModal, setMotivoModal] = useState<string>('');
  const [observacionesModal, setObservacionesModal] = useState<string>('');
  const [guardandoModal, setGuardandoModal] = useState<boolean>(false);

  useEffect(() => {
    cargarAsistencias();
  }, [fecha]);

  const cargarAsistencias = async () => {
    try {
      setLoading(true);
      const res = await PreceptoriaAPI.listarAsistenciasDocentes(fecha, busqueda);
      setData(res);
    } catch (err: any) {
      console.error('Error al cargar asistencias docentes:', err);
      setMensaje({ tipo: 'error', texto: err.message || 'Error al cargar datos.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCambiarEstadoRapido = async (
    profesorId: number,
    nuevoEstado: 'PRESENTE' | 'AUSENTE_JUSTIFICADO' | 'AUSENTE_INJUSTIFICADO' | 'TARDE',
    motivoExistente?: string,
    obsExistente?: string
  ) => {
    try {
      setSavingId(profesorId);
      await PreceptoriaAPI.guardarAsistenciaDocente({
        profesorId,
        fecha,
        estado: nuevoEstado,
        motivo: motivoExistente || '',
        observaciones: obsExistente || ''
      });
      setMensaje({ tipo: 'success', texto: 'Registro de asistencia docente actualizado.' });
      await cargarAsistencias();
      setTimeout(() => setMensaje(null), 3000);
    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: err.message || 'Error al guardar asistencia.' });
    } finally {
      setSavingId(null);
    }
  };

  const handleAbrirModalJustificar = (docente: AdminAsistenciaDocenteItem) => {
    setModalDocente(docente);
    setEstadoModal(docente.estado === 'PRESENTE' ? 'AUSENTE_JUSTIFICADO' : docente.estado);
    setMotivoModal(docente.motivo || 'Licencia médica / Trámite institucional');
    setObservacionesModal(docente.observaciones || '');
  };

  const handleGuardarModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalDocente) return;

    try {
      setGuardandoModal(true);
      await PreceptoriaAPI.guardarAsistenciaDocente({
        profesorId: modalDocente.profesor.id,
        fecha,
        estado: estadoModal,
        motivo: motivoModal,
        observaciones: observacionesModal
      });
      setMensaje({ tipo: 'success', texto: `Asistencia de ${modalDocente.profesor.nombre_completo} guardada con éxito.` });
      setModalDocente(null);
      await cargarAsistencias();
      setTimeout(() => setMensaje(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Error al guardar justificación');
    } finally {
      setGuardandoModal(false);
    }
  };

  const handleMarcarTodosPresentes = async () => {
    if (!data || data.docentes.length === 0) return;
    const confirm = window.confirm(`¿Deseas marcar a todos los docentes (${data.docentes.length}) como PRESENTES para la fecha ${fecha}?`);
    if (!confirm) return;

    try {
      setLoading(true);
      for (const d of data.docentes) {
        if (!d.existe_registro || d.estado !== 'PRESENTE') {
          await PreceptoriaAPI.guardarAsistenciaDocente({
            profesorId: d.profesor.id,
            fecha,
            estado: 'PRESENTE',
            motivo: '',
            observaciones: 'Presentismo general registrado'
          });
        }
      }
      setMensaje({ tipo: 'success', texto: 'Todos los profesores fueron marcados como PRESENTES.' });
      await cargarAsistencias();
      setTimeout(() => setMensaje(null), 4000);
    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: err.message || 'Error al procesar asistencia masiva.' });
      setLoading(false);
    }
  };

  const docentesFiltrados = (data?.docentes || []).filter(d => {
    if (!busqueda.trim()) return true;
    const b = busqueda.toLowerCase();
    return (
      d.profesor.nombre_completo.toLowerCase().includes(b) ||
      d.profesor.correo.toLowerCase().includes(b) ||
      (d.profesor.DNI && d.profesor.DNI.toLowerCase().includes(b)) ||
      (d.profesor.materia && d.profesor.materia.toLowerCase().includes(b))
    );
  });

  const conteo = {
    total: docentesFiltrados.length,
    presentes: docentesFiltrados.filter(d => d.estado === 'PRESENTE').length,
    tardes: docentesFiltrados.filter(d => d.estado === 'TARDE').length,
    justificados: docentesFiltrados.filter(d => d.estado === 'AUSENTE_JUSTIFICADO').length,
    injustificados: docentesFiltrados.filter(d => d.estado === 'AUSENTE_INJUSTIFICADO').length,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Notificación de feedback */}
      {mensaje && (
        <div style={{
          background: mensaje.tipo === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${mensaje.tipo === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          color: mensaje.tipo === 'success' ? '#34d399' : '#f87171',
          padding: '0.9rem 1.25rem',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <i className={`bx ${mensaje.tipo === 'success' ? 'bx-check-circle' : 'bx-error-circle'}`} style={{ fontSize: '1.4rem' }}></i>
          <span>{mensaje.texto}</span>
        </div>
      )}

      {/* Controles Superiores: Fecha, Búsqueda y Botón Masivo */}
      <div style={{
        background: 'rgba(30, 41, 59, 0.7)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '1.25rem 1.5rem',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem', fontWeight: 600 }}>
              Fecha de Registro
            </label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              style={{
                padding: '0.55rem 0.85rem',
                borderRadius: '8px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#f8fafc',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem', fontWeight: 600 }}>
              Buscar Docente
            </label>
            <div style={{ position: 'relative' }}>
              <i className="bx bx-search" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}></i>
              <input
                type="text"
                placeholder="Nombre, DNI o materia..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                style={{
                  padding: '0.55rem 0.85rem 0.55rem 2.2rem',
                  borderRadius: '8px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#f8fafc',
                  fontSize: '0.9rem',
                  outline: 'none',
                  minWidth: '220px'
                }}
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleMarcarTodosPresentes}
          disabled={loading || docentesFiltrados.length === 0}
          style={{
            padding: '0.65rem 1.25rem',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            border: 'none',
            color: '#fff',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
            opacity: loading ? 0.6 : 1
          }}
        >
          <i className="bx bx-check-double"></i>
          Marcar Todos Presentes
        </button>
      </div>

      {/* Resumen Estadístico Diario */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '0.85rem'
      }}>
        <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '0.9rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Total Docentes</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc' }}>{conteo.total}</div>
        </div>
        <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.9rem', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          <div style={{ fontSize: '0.75rem', color: '#34d399' }}>Presentes</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34d399' }}>{conteo.presentes}</div>
        </div>
        <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '0.9rem', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
          <div style={{ fontSize: '0.75rem', color: '#fbbf24' }}>Llegadas Tarde</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fbbf24' }}>{conteo.tardes}</div>
        </div>
        <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '0.9rem', borderRadius: '10px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
          <div style={{ fontSize: '0.75rem', color: '#38bdf8' }}>Aus. Justificados</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8' }}>{conteo.justificados}</div>
        </div>
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '0.9rem', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          <div style={{ fontSize: '0.75rem', color: '#f87171' }}>Aus. Injustificados</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f87171' }}>{conteo.injustificados}</div>
        </div>
      </div>

      {/* Tabla de Asistencia Docente */}
      <div style={{
        background: 'rgba(30, 41, 59, 0.5)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '1.5rem',
        overflowX: 'auto'
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
            <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '2.5rem', color: '#38bdf8', marginBottom: '1rem' }}></i>
            <p>Cargando plantilla docente...</p>
          </div>
        ) : docentesFiltrados.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            <i className="bx bx-user-x" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}></i>
            <p>No se encontraron profesores registrados en la plataforma.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Docente</th>
                <th style={{ padding: '0.75rem 1rem' }}>DNI / Correo</th>
                <th style={{ padding: '0.75rem 1rem' }}>Materia / Nivel</th>
                <th style={{ padding: '0.75rem 1rem' }}>Estado Asistencia</th>
                <th style={{ padding: '0.75rem 1rem' }}>Motivo / Obs.</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Acciones Rápidas</th>
              </tr>
            </thead>
            <tbody>
              {docentesFiltrados.map((item) => {
                const isSaving = savingId === item.profesor.id;
                return (
                  <tr
                    key={item.profesor.id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      opacity: isSaving ? 0.5 : 1,
                      transition: 'background 0.2s'
                    }}
                  >
                    <td style={{ padding: '0.9rem 1rem' }}>
                      <div style={{ fontWeight: 600, color: '#f8fafc' }}>
                        {item.profesor.nombre_completo}
                      </div>
                      {item.registro && (
                        <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                          Guardado: {item.modificado_por_nombre || 'Sistema'}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '0.9rem 1rem' }}>
                      <div style={{ color: '#cbd5e1' }}>{item.profesor.DNI || '—'}</div>
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{item.profesor.correo}</div>
                    </td>

                    <td style={{ padding: '0.9rem 1rem' }}>
                      <div style={{ color: '#cbd5e1' }}>{item.profesor.materia || 'General'}</div>
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{item.profesor.nivel_educativo || 'Secundario'}</div>
                    </td>

                    <td style={{ padding: '0.9rem 1rem' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.25rem 0.65rem',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        background:
                          item.estado === 'PRESENTE' ? 'rgba(16, 185, 129, 0.15)' :
                          item.estado === 'TARDE' ? 'rgba(245, 158, 11, 0.15)' :
                          item.estado === 'AUSENTE_JUSTIFICADO' ? 'rgba(56, 189, 248, 0.15)' :
                          'rgba(239, 68, 68, 0.15)',
                        color:
                          item.estado === 'PRESENTE' ? '#34d399' :
                          item.estado === 'TARDE' ? '#fbbf24' :
                          item.estado === 'AUSENTE_JUSTIFICADO' ? '#38bdf8' :
                          '#f87171',
                        border: `1px solid ${
                          item.estado === 'PRESENTE' ? 'rgba(16, 185, 129, 0.3)' :
                          item.estado === 'TARDE' ? 'rgba(245, 158, 11, 0.3)' :
                          item.estado === 'AUSENTE_JUSTIFICADO' ? 'rgba(56, 189, 248, 0.3)' :
                          'rgba(239, 68, 68, 0.3)'
                        }`
                      }}>
                        <i className={`bx ${
                          item.estado === 'PRESENTE' ? 'bx-check-circle' :
                          item.estado === 'TARDE' ? 'bx-time' :
                          item.estado === 'AUSENTE_JUSTIFICADO' ? 'bx-file-blank' :
                          'bx-x-circle'
                        }`}></i>
                        {item.estado === 'PRESENTE' ? 'Presente' :
                         item.estado === 'TARDE' ? 'Llegada Tarde' :
                         item.estado === 'AUSENTE_JUSTIFICADO' ? 'Aus. Justificado' :
                         'Aus. Injustificado'}
                      </span>
                    </td>

                    <td style={{ padding: '0.9rem 1rem', color: item.motivo ? '#cbd5e1' : '#64748b' }}>
                      {item.motivo || item.observaciones ? (
                        <div>
                          {item.motivo && <div style={{ fontWeight: 500 }}>{item.motivo}</div>}
                          {item.observaciones && <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{item.observaciones}</div>}
                        </div>
                      ) : '—'}
                    </td>

                    <td style={{ padding: '0.9rem 1rem', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                        {/* Botón P */}
                        <button
                          onClick={() => handleCambiarEstadoRapido(item.profesor.id, 'PRESENTE')}
                          title="Marcar Presente"
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '6px',
                            border: '1px solid rgba(16, 185, 129, 0.4)',
                            background: item.estado === 'PRESENTE' ? '#10b981' : 'rgba(16, 185, 129, 0.1)',
                            color: item.estado === 'PRESENTE' ? '#fff' : '#34d399',
                            cursor: 'pointer',
                            fontWeight: 700
                          }}
                        >
                          P
                        </button>

                        {/* Botón T */}
                        <button
                          onClick={() => handleCambiarEstadoRapido(item.profesor.id, 'TARDE')}
                          title="Marcar Llegada Tarde"
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '6px',
                            border: '1px solid rgba(245, 158, 11, 0.4)',
                            background: item.estado === 'TARDE' ? '#f59e0b' : 'rgba(245, 158, 11, 0.1)',
                            color: item.estado === 'TARDE' ? '#fff' : '#fbbf24',
                            cursor: 'pointer',
                            fontWeight: 700
                          }}
                        >
                          T
                        </button>

                        {/* Botón AJ */}
                        <button
                          onClick={() => handleAbrirModalJustificar(item)}
                          title="Justificar Ausencia / Agregar Observación"
                          style={{
                            padding: '0 0.5rem',
                            height: '32px',
                            borderRadius: '6px',
                            border: '1px solid rgba(56, 189, 248, 0.4)',
                            background: item.estado === 'AUSENTE_JUSTIFICADO' ? '#0284c7' : 'rgba(56, 189, 248, 0.1)',
                            color: item.estado === 'AUSENTE_JUSTIFICADO' ? '#fff' : '#38bdf8',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <i className="bx bx-edit"></i> Justificar
                        </button>

                        {/* Botón AI */}
                        <button
                          onClick={() => handleCambiarEstadoRapido(item.profesor.id, 'AUSENTE_INJUSTIFICADO')}
                          title="Marcar Ausente Injustificado"
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '6px',
                            border: '1px solid rgba(239, 68, 68, 0.4)',
                            background: item.estado === 'AUSENTE_INJUSTIFICADO' ? '#ef4444' : 'rgba(239, 68, 68, 0.1)',
                            color: item.estado === 'AUSENTE_INJUSTIFICADO' ? '#fff' : '#f87171',
                            cursor: 'pointer',
                            fontWeight: 700
                          }}
                        >
                          A
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal para justificar o modificar con observaciones */}
      {modalDocente && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '1rem'
        }}>
          <div style={{
            background: '#1e293b',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '500px',
            padding: '1.75rem',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.2rem' }}>
                Justificación de Asistencia Docente
              </h3>
              <button
                onClick={() => setModalDocente(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.4rem', cursor: 'pointer' }}
              >
                <i className="bx bx-x"></i>
              </button>
            </div>

            <p style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              Docente: <strong>{modalDocente.profesor.nombre_completo}</strong> <br />
              Fecha: <strong>{fecha}</strong>
            </p>

            <form onSubmit={handleGuardarModal} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.4rem', fontWeight: 600 }}>
                  Estado de Asistencia
                </label>
                <select
                  value={estadoModal}
                  onChange={(e: any) => setEstadoModal(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    borderRadius: '8px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#f8fafc',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                >
                  <option value="AUSENTE_JUSTIFICADO">Ausente Justificado (Licencia / Trámite)</option>
                  <option value="AUSENTE_INJUSTIFICADO">Ausente Injustificado</option>
                  <option value="TARDE">Llegada Tarde</option>
                  <option value="PRESENTE">Presente</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.4rem', fontWeight: 600 }}>
                  Motivo / Artículo de Justificación
                </label>
                <input
                  type="text"
                  value={motivoModal}
                  onChange={(e) => setMotivoModal(e.target.value)}
                  placeholder="Ej: Art. 70A Licencia médica, Trámite personal..."
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    borderRadius: '8px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#f8fafc',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.4rem', fontWeight: 600 }}>
                  Observaciones Institucionales (Opcional)
                </label>
                <textarea
                  rows={3}
                  value={observacionesModal}
                  onChange={(e) => setObservacionesModal(e.target.value)}
                  placeholder="Detalles adicionales, número de certificado o constancia adjunta..."
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    borderRadius: '8px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#f8fafc',
                    fontSize: '0.9rem',
                    outline: 'none',
                    resize: 'none',
                    boxSizing: 'border-box'
                  }}
                ></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setModalDocente(null)}
                  style={{
                    padding: '0.6rem 1.2rem',
                    borderRadius: '8px',
                    background: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#cbd5e1',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoModal}
                  style={{
                    padding: '0.6rem 1.4rem',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                    border: 'none',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(56, 189, 248, 0.3)'
                  }}
                >
                  {guardandoModal ? 'Guardando...' : 'Guardar Justificación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAsistenciasDocentesView;
