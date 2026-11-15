import React, { useState, useEffect } from 'react';
import PreceptoriaAPI, { type PreceptorUsuarioItem } from '../services/preceptoria_api';
import styles from '../styles/preceptoria.module.css';

export const PreceptoriaAdminAsignacionesView: React.FC = () => {
  const [preceptores, setPreceptores] = useState<PreceptorUsuarioItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal Asignar Clase
  const [modalAsignar, setModalAsignar] = useState<boolean>(false);
  const [preceptorSeleccionado, setPreceptorSeleccionado] = useState<number | null>(null);
  const [claseId, setClaseId] = useState<string>('');

  useEffect(() => {
    cargarPreceptores();
  }, []);

  const cargarPreceptores = async () => {
    try {
      setLoading(true);
      const data = await PreceptoriaAPI.listarPreceptores();
      setPreceptores(data);
    } catch (err) {
      console.error('Error al cargar preceptores:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAsignar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!preceptorSeleccionado || !claseId) return;

    try {
      await PreceptoriaAPI.asignarClase(preceptorSeleccionado, Number(claseId));
      alert('Preceptor asignado exitosamente a la comisión.');
      setModalAsignar(false);
      setClaseId('');
      cargarPreceptores();
    } catch (err: any) {
      alert(err.message || 'Error al asignar');
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
            El administrador gestiona asignaciones de comisiones. La toma de asistencia es exclusiva de los preceptores.
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
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {preceptores.map((p) => (
                <tr key={p.id_usuario}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#f8fafc' }}>{p.nombre_completo}</div>
                  </td>
                  <td style={{ color: '#38bdf8' }}>{p.correo}</td>
                  <td style={{ color: '#cbd5e1' }}>{p.DNI || 'S/D'}</td>
                  <td>
                    <span className={`${styles.badge} ${p.total_clases_asignadas > 0 ? styles.badgeSuccess : styles.badgeWarning}`}>
                      {p.total_clases_asignadas} comisiones
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className={styles.secondaryBtn}
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                      onClick={() => {
                        setPreceptorSeleccionado(p.id_usuario);
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
      {modalAsignar && (
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
              maxWidth: '450px',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#f8fafc' }}>
              Asignar Comisión a Preceptor
            </h3>
            <form onSubmit={handleAsignar} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1' }}>ID de Comisión (Clase) *</label>
                <input
                  type="number"
                  required
                  placeholder="Ej: 1"
                  value={claseId}
                  onChange={(e) => setClaseId(e.target.value)}
                  className={styles.selectInput}
                  style={{ width: '100%', marginTop: '0.35rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className={styles.secondaryBtn} onClick={() => setModalAsignar(false)}>
                  Cancelar
                </button>
                <button type="submit" className={styles.primaryBtn}>
                  Asignar Comisión
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

