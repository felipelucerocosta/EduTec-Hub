import React, { useState, useEffect } from 'react';
import PreceptoriaAPI, { type PreceptorUsuarioItem, type ClasePreceptorOption } from '../services/preceptoria_api';
import styles from '../styles/preceptoria.module.css';

export const PreceptoriaAdminAsignacionesView: React.FC = () => {
  const [preceptores, setPreceptores] = useState<PreceptorUsuarioItem[]>([]);
  const [clasesDisponibles, setClasesDisponibles] = useState<ClasePreceptorOption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal Asignar Clase
  const [modalAsignar, setModalAsignar] = useState<boolean>(false);
  const [preceptorSeleccionado, setPreceptorSeleccionado] = useState<PreceptorUsuarioItem | null>(null);
  const [claseId, setClaseId] = useState<string>('');
  const [guardando, setGuardando] = useState<boolean>(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [dataPreceptores, dataClases] = await Promise.all([
        PreceptoriaAPI.listarPreceptores(),
        PreceptoriaAPI.getMisClases()
      ]);
      setPreceptores(dataPreceptores);
      setClasesDisponibles(dataClases);
    } catch (err) {
      console.error('Error al cargar datos de preceptoría:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAsignar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!preceptorSeleccionado || !claseId) return;

    try {
      setGuardando(true);
      await PreceptoriaAPI.asignarClase(preceptorSeleccionado.id_usuario, Number(claseId));
      setModalAsignar(false);
      setClaseId('');
      await cargarDatos();
    } catch (err: any) {
      alert(err.message || 'Error al asignar comisión');
    } finally {
      setGuardando(false);
    }
  };

  const handleDesasignar = async (preceptorId: number, claseIdNum: number, claseNombre: string) => {
    if (!confirm(`¿Estás seguro de desasignar la comisión "${claseNombre}" de este preceptor?`)) {
      return;
    }
    try {
      await PreceptoriaAPI.revocarClase(preceptorId, claseIdNum);
      await cargarDatos();
    } catch (err: any) {
      alert(err.message || 'Error al desasignar comisión');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
            Nómina Institucional de Preceptores
          </h2>
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.84rem', color: '#94a3b8' }}>
            El administrador asigna las comisiones oficiales a cargo de cada preceptor.
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
          <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '2rem' }}></i>
          <p>Cargando nómina...</p>
        </div>
      ) : preceptores.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          <i className="bx bx-user-x" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}></i>
          <p>No se encontraron usuarios con rol 'preceptor' creados en el sistema.</p>
        </div>
      ) : (
        <div className={styles.attendanceTableWrapper}>
          <table className={styles.attendanceTable}>
            <thead>
              <tr>
                <th>Preceptor</th>
                <th>Correo Institucional</th>
                <th>DNI</th>
                <th>Comisiones Asignadas</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {preceptores.map((p) => (
                <tr key={p.id_usuario}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#f8fafc' }}>{p.nombre_completo}</div>
                    <div style={{ fontSize: '0.74rem', color: '#64748b' }}>ID: #{p.id_usuario}</div>
                  </td>
                  <td style={{ color: '#38bdf8' }}>{p.correo}</td>
                  <td style={{ color: '#cbd5e1' }}>{p.DNI || 'S/D'}</td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
                      {p.clases && p.clases.length > 0 ? (
                        p.clases.map((c) => (
                          <span
                            key={c.id}
                            style={{
                              background: 'rgba(56, 189, 248, 0.12)',
                              border: '1px solid rgba(56, 189, 248, 0.3)',
                              color: '#38bdf8',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '6px',
                              fontSize: '0.78rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                            }}
                          >
                            <span>{c.nombre} {c.seccion ? `(${c.seccion})` : ''}</span>
                            <button
                              type="button"
                              onClick={() => handleDesasignar(p.id_usuario, c.id, c.nombre)}
                              title="Desasignar comisión"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#f87171',
                                cursor: 'pointer',
                                padding: '0 2px',
                                display: 'flex',
                                alignItems: 'center',
                                fontSize: '0.9rem',
                              }}
                            >
                              &times;
                            </button>
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: '#eab308' }}>
                          Sin comisiones asignadas
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className={styles.secondaryBtn}
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                      onClick={() => {
                        setPreceptorSeleccionado(p);
                        setClaseId('');
                        setModalAsignar(true);
                      }}
                    >
                      <i className="bx bx-plus"></i> Asignar Comisión
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Asignar */}
      {modalAsignar && preceptorSeleccionado && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setModalAsignar(false)}
        >
          <div
            style={{
              background: '#0f172a',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '14px',
              padding: '1.75rem',
              width: '100%',
              maxWidth: '480px',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#f8fafc' }}>
              Asignar Comisión a Preceptor
            </h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
              Preceptor: <strong style={{ color: '#38bdf8' }}>{preceptorSeleccionado.nombre_completo}</strong> ({preceptorSeleccionado.correo})
            </p>

            <form onSubmit={handleAsignar} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1' }}>
                  Seleccionar Comisión / Clase *
                </label>
                <select
                  required
                  value={claseId}
                  onChange={(e) => setClaseId(e.target.value)}
                  className={styles.selectInput}
                  style={{ width: '100%', marginTop: '0.35rem' }}
                >
                  <option value="">— Seleccionar Comisión —</option>
                  {clasesDisponibles
                    .filter((c) => !preceptorSeleccionado.clases?.some((pc) => pc.id === c.id))
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} {c.seccion ? `(${c.seccion})` : ''} — {c.materia} #{c.codigo}
                      </option>
                    ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => setModalAsignar(false)}
                  disabled={guardando}
                >
                  Cancelar
                </button>
                <button type="submit" className={styles.primaryBtn} disabled={guardando || !claseId}>
                  {guardando ? 'Asignando...' : 'Asignar Comisión'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PreceptoriaAdminAsignacionesView;

