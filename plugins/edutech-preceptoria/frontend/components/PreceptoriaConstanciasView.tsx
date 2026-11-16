import React, { useState, useEffect } from 'react';
import PreceptoriaAPI, { type ConstanciaItem, type AlumnoRendimientoItem } from '../services/preceptoria_api';

export const PreceptoriaConstanciasView: React.FC = () => {
  const [constancias, setConstancias] = useState<ConstanciaItem[]>([]);
  const [alumnos, setAlumnos] = useState<AlumnoRendimientoItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filtro de estado
  const [filtroEstado, setFiltroEstado] = useState<'TODOS' | 'PENDIENTE' | 'APROBADA' | 'RECHAZADA'>('TODOS');
  const [busqueda, setBusqueda] = useState<string>('');

  // Modal Emisión Directa
  const [showModalDirecta, setShowModalDirecta] = useState<boolean>(false);
  const [alumnoDirectoId, setAlumnoDirectoId] = useState<number | ''>('');
  const [motivoDirecto, setMotivoDirecto] = useState<string>('Trámite previsional / Familiar / Becas');
  const [obsDirecto, setObsDirecto] = useState<string>('Emisión oficial por Preceptoría tras verificación de condición regular');
  const [procesandoDirecto, setProcesandoDirecto] = useState<boolean>(false);

  // Modal Resolución (Aprobar / Rechazar)
  const [resolviendoItem, setResolviendoItem] = useState<ConstanciaItem | null>(null);
  const [resolviendoAccion, setResolviendoAccion] = useState<'APROBADA' | 'RECHAZADA'>('APROBADA');
  const [obsResolucion, setObsResolucion] = useState<string>('');
  const [guardandoResolucion, setGuardandoResolucion] = useState<boolean>(false);

  // Modal Ver/Imprimir Constancia
  const [constanciaImprimir, setConstanciaImprimir] = useState<ConstanciaItem | null>(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);
      const [listC, listA] = await Promise.all([
        PreceptoriaAPI.listarConstancias(),
        PreceptoriaAPI.getAlumnosRendimiento()
      ]);
      setConstancias(listC);
      setAlumnos(listA);
    } catch (err: any) {
      console.error('Error al cargar constancias en preceptoría:', err);
      setError(err.message || 'Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleResolver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolviendoItem) return;

    try {
      setGuardandoResolucion(true);
      await PreceptoriaAPI.resolverConstancia(resolviendoItem.id, resolviendoAccion, obsResolucion);
      setResolviendoItem(null);
      setObsResolucion('');
      await cargarDatos();
    } catch (err: any) {
      alert(err.message || 'Error al resolver constancia');
    } finally {
      setGuardandoResolucion(false);
    }
  };

  const handleEmitirDirecta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alumnoDirectoId) return;

    try {
      setProcesandoDirecto(true);
      await PreceptoriaAPI.emitirConstanciaDirecta(Number(alumnoDirectoId), motivoDirecto, obsDirecto);
      setShowModalDirecta(false);
      setAlumnoDirectoId('');
      await cargarDatos();
    } catch (err: any) {
      alert(err.message || 'Error al emitir constancia');
    } finally {
      setProcesandoDirecto(false);
    }
  };

  // Filtrado
  const constanciasFiltradas = constancias.filter(c => {
    if (filtroEstado !== 'TODOS' && c.estado !== filtroEstado) return false;
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase().trim();
      const match = (c.alumno_nombre && c.alumno_nombre.toLowerCase().includes(q)) ||
                    (c.alumno_dni && c.alumno_dni.includes(q)) ||
                    (c.motivo && c.motivo.toLowerCase().includes(q)) ||
                    (c.codigo_verificacion && c.codigo_verificacion.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const pendientesCount = constancias.filter(c => c.estado === 'PENDIENTE').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Cabecera de Gestión */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.25rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#f8fafc', fontWeight: 700 }}>
              Gestión de Condición de Alumno Regular & Constancias
            </h3>
            {pendientesCount > 0 && (
              <span style={{
                background: 'rgba(245, 158, 11, 0.2)',
                color: '#fbbf24',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                padding: '0.2rem 0.6rem',
                borderRadius: '999px',
                fontSize: '0.78rem',
                fontWeight: 700
              }}>
                {pendientesCount} pendientes de resolución
              </span>
            )}
          </div>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
            Revisión académica institucional y firma digitalizada de constancias oficiales.
          </p>
        </div>

        <button
          onClick={() => setShowModalDirecta(true)}
          style={{
            padding: '0.7rem 1.3rem',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: '#fff',
            border: 'none',
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
          }}
        >
          <i className="bx bx-plus-circle" style={{ fontSize: '1.2rem' }}></i>
          Emitir Constancia Directa
        </button>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '14px',
        padding: '1rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        {/* Buscador */}
        <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: '400px' }}>
          <i className="bx bx-search" style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#94a3b8',
            fontSize: '1.15rem'
          }}></i>
          <input
            type="text"
            placeholder="Buscar por alumno, DNI o código..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            style={{
              width: '100%',
              padding: '0.6rem 1rem 0.6rem 2.3rem',
              borderRadius: '8px',
              background: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#f8fafc',
              fontSize: '0.88rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Filtros de Pestañas Rápidas */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {(['TODOS', 'PENDIENTE', 'APROBADA', 'RECHAZADA'] as const).map(est => (
            <button
              key={est}
              type="button"
              onClick={() => setFiltroEstado(est)}
              style={{
                padding: '0.5rem 0.9rem',
                borderRadius: '8px',
                border: 'none',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: filtroEstado === est ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                color: filtroEstado === est ? '#38bdf8' : '#94a3b8',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: filtroEstado === est ? 'rgba(56, 189, 248, 0.4)' : 'transparent'
              }}
            >
              {est === 'TODOS' ? 'Todas' : est === 'PENDIENTE' ? `Pendientes (${pendientesCount})` : est}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de Solicitudes y Emisiones */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
          <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '2.5rem', color: '#38bdf8', marginBottom: '1rem' }}></i>
          <p>Cargando registros de constancias...</p>
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#f87171' }}>
          <p>{error}</p>
        </div>
      ) : constanciasFiltradas.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem',
          background: 'rgba(15, 23, 42, 0.4)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          color: '#64748b'
        }}>
          <i className="bx bx-folder-open" style={{ fontSize: '3rem', marginBottom: '0.5rem' }}></i>
          <p>No se encontraron constancias con el filtro seleccionado.</p>
        </div>
      ) : (
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          overflow: 'hidden'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Fecha</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Alumno / DNI</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Curso</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Motivo</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Estado</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Preceptor</th>
                  <th style={{ padding: '0.85rem 1.25rem', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {constanciasFiltradas.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '0.85rem 1.25rem', color: '#cbd5e1' }}>
                      {new Date(c.fecha_solicitud).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem' }}>
                      <div style={{ fontWeight: 600, color: '#f8fafc' }}>{c.alumno_nombre}</div>
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>DNI {c.alumno_dni || 'S/D'}</div>
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', color: '#cbd5e1' }}>
                      {c.alumno_curso || 'Secundario Técnico'}
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', color: '#f8fafc', maxWidth: '240px' }}>
                      <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {c.motivo}
                      </div>
                      {c.codigo_verificacion && (
                        <div style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 600 }}>
                          Cód: {c.codigo_verificacion}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem' }}>
                      <span style={{
                        padding: '0.2rem 0.65rem',
                        borderRadius: '999px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background:
                          c.estado === 'APROBADA' ? 'rgba(16,185,129,0.15)' :
                          c.estado === 'RECHAZADA' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                        color:
                          c.estado === 'APROBADA' ? '#34d399' :
                          c.estado === 'RECHAZADA' ? '#f87171' : '#fbbf24',
                        border: `1px solid ${
                          c.estado === 'APROBADA' ? 'rgba(16,185,129,0.35)' :
                          c.estado === 'RECHAZADA' ? 'rgba(239,68,68,0.35)' : 'rgba(245,158,11,0.35)'
                        }`
                      }}>
                        {c.estado}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', color: '#94a3b8', fontSize: '0.82rem' }}>
                      {c.preceptor_nombre || 'Pendiente'}
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        {c.estado === 'PENDIENTE' && (
                          <>
                            <button
                              onClick={() => {
                                setResolviendoItem(c);
                                setResolviendoAccion('APROBADA');
                                setObsResolucion('Condición regular verificada en el sistema.');
                              }}
                              style={{
                                padding: '0.4rem 0.75rem',
                                borderRadius: '8px',
                                background: 'rgba(16, 185, 129, 0.15)',
                                color: '#34d399',
                                border: '1px solid rgba(16, 185, 129, 0.35)',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.3rem'
                              }}
                            >
                              <i className="bx bx-check"></i> Aprobar
                            </button>
                            <button
                              onClick={() => {
                                setResolviendoItem(c);
                                setResolviendoAccion('RECHAZADA');
                                setObsResolucion('No cumple con el porcentaje reglamentario de presentismo.');
                              }}
                              style={{
                                padding: '0.4rem 0.75rem',
                                borderRadius: '8px',
                                background: 'rgba(239, 68, 68, 0.15)',
                                color: '#f87171',
                                border: '1px solid rgba(239, 68, 68, 0.35)',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.3rem'
                              }}
                            >
                              <i className="bx bx-x"></i> Rechazar
                            </button>
                          </>
                        )}

                        {c.estado === 'APROBADA' && (
                          <button
                            onClick={() => setConstanciaImprimir(c)}
                            style={{
                              padding: '0.4rem 0.75rem',
                              borderRadius: '8px',
                              background: 'rgba(56, 189, 248, 0.15)',
                              color: '#38bdf8',
                              border: '1px solid rgba(56, 189, 248, 0.35)',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.3rem'
                            }}
                          >
                            <i className="bx bx-printer"></i> Ver
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODAL: RESOLVER SOLICITUD ─────────────────────────────────────────── */}
      {resolviendoItem && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1300,
          padding: '1rem'
        }}>
          <div style={{
            background: '#0f172a',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '520px',
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            color: '#f8fafc'
          }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
              {resolviendoAccion === 'APROBADA' ? 'Aprobar y Emitir Constancia' : 'Rechazar Solicitud'}
            </h3>
            <p style={{ margin: 0, fontSize: '0.88rem', color: '#94a3b8' }}>
              Alumno: <strong>{resolviendoItem.alumno_nombre}</strong> (DNI {resolviendoItem.alumno_dni || 'S/D'})
            </p>

            <form onSubmit={handleResolver} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                  Observaciones / Justificación Institucional
                </label>
                <textarea
                  rows={3}
                  value={obsResolucion}
                  onChange={e => setObsResolucion(e.target.value)}
                  placeholder="Detallar fundamentos reglamentarios..."
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#f8fafc',
                    fontSize: '0.88rem',
                    boxSizing: 'border-box',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setResolviendoItem(null)}
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
                  disabled={guardandoResolucion}
                  style={{
                    padding: '0.6rem 1.4rem',
                    borderRadius: '10px',
                    background: resolviendoAccion === 'APROBADA'
                      ? 'linear-gradient(135deg, #10b981, #059669)'
                      : 'linear-gradient(135deg, #ef4444, #dc2626)',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 700,
                    cursor: guardandoResolucion ? 'not-allowed' : 'pointer'
                  }}
                >
                  {guardandoResolucion ? 'Procesando...' : `Confirmar ${resolviendoAccion}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: EMISIÓN DIRECTA POR PRECEPTORÍA ────────────────────────────── */}
      {showModalDirecta && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1300,
          padding: '1rem'
        }}>
          <div style={{
            background: '#0f172a',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '560px',
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            color: '#f8fafc'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                Emisión Directa de Constancia de Alumno Regular
              </h3>
              <button
                onClick={() => setShowModalDirecta(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.4rem', cursor: 'pointer' }}
              >
                <i className="bx bx-x"></i>
              </button>
            </div>

            <form onSubmit={handleEmitirDirecta} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                  Seleccionar Alumno *
                </label>
                <select
                  required
                  value={alumnoDirectoId}
                  onChange={e => setAlumnoDirectoId(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#f8fafc',
                    fontSize: '0.88rem',
                    outline: 'none'
                  }}
                >
                  <option value="">-- Seleccionar de la nómina institucional --</option>
                  {alumnos.map(a => (
                    <option key={`${a.alumno_id}-${a.clase_id}`} value={a.alumno_id}>
                      {a.nombre_completo} (DNI {a.DNI}) — {a.curso} [{a.estadoRegularidad}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                  Motivo declarado *
                </label>
                <input
                  required
                  type="text"
                  value={motivoDirecto}
                  onChange={e => setMotivoDirecto(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#f8fafc',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                  Observaciones de Preceptoría
                </label>
                <textarea
                  rows={2}
                  value={obsDirecto}
                  onChange={e => setObsDirecto(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#f8fafc',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowModalDirecta(false)}
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
                  disabled={procesandoDirecto}
                  style={{
                    padding: '0.6rem 1.4rem',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 700,
                    cursor: procesandoDirecto ? 'not-allowed' : 'pointer'
                  }}
                >
                  {procesandoDirecto ? 'Emitiendo...' : 'Emitir Constancia Oficial'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: VER / IMPRIMIR CONSTANCIA OFICIAL ───────────────────────────── */}
      {constanciaImprimir && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1400,
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
            <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '1rem' }}>
              <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.3rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Escuela Técnica N° 29 DE 6 — Tech-Room
              </h2>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#334155' }}>
                CONSTANCIA OFICIAL DE ALUMNO REGULAR
              </h3>
            </div>

            <div style={{ fontSize: '1rem', lineHeight: 1.6, textAlign: 'justify' }}>
              <p>
                Por medio de la presente, la <strong>Preceptoría Institucional</strong> hace constar que el/la estudiante <strong>{constanciaImprimir.alumno_nombre}</strong>, DNI N° <strong>{constanciaImprimir.alumno_dni || 'S/D'}</strong>, perteneciente al curso <strong>{constanciaImprimir.alumno_curso || 'Secundario'}</strong>, se encuentra formalmente inscripto/a y cursando en calidad de <strong>ALUMNO/A REGULAR</strong> durante el presente Ciclo Lectivo 2026.
              </p>
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', margin: '1rem 0', fontFamily: 'sans-serif', fontSize: '0.9rem' }}>
                <p style={{ margin: '0 0 0.4rem 0' }}><strong>Motivo declarado:</strong> {constanciaImprimir.motivo}</p>
                <p style={{ margin: '0 0 0.4rem 0' }}><strong>Código Único de Validación:</strong> <code style={{ background: '#e2e8f0', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>{constanciaImprimir.codigo_verificacion || 'CAR-2026-OFICIAL'}</code></p>
                <p style={{ margin: '0 0 0.4rem 0' }}><strong>Fecha de Emisión:</strong> {constanciaImprimir.fecha_resolucion ? new Date(constanciaImprimir.fecha_resolucion).toLocaleDateString() : new Date().toLocaleDateString()}</p>
                <p style={{ margin: 0 }}><strong>Preceptor Interviniente:</strong> {constanciaImprimir.preceptor_nombre || 'Preceptoría Oficial'}</p>
              </div>
              <p style={{ fontSize: '0.88rem', color: '#475569' }}>
                Se expide la presente a pedido de la parte interesada y para ser presentada ante quien corresponda, en la Ciudad Autónoma de Buenos Aires.
              </p>
            </div>

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
                onClick={() => setConstanciaImprimir(null)}
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

export default PreceptoriaConstanciasView;
