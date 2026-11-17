import React, { useState, useEffect } from 'react';
import PreceptoriaAPI, {
  type ClasePreceptorOption,
  type AlumnoAsistenciaItem,
  type EstadoAsistencia,
} from '../services/preceptoria_api';
import styles from '../styles/preceptoria.module.css';

interface Props {
  claseId: number;
  clases: ClasePreceptorOption[];
  onClaseChange: (id: number) => void;
}

export const PreceptoriaTomaAsistenciaView: React.FC<Props> = ({
  claseId,
  clases,
  onClaseChange,
}) => {
  const [fecha, setFecha] = useState<string>(new Date().toISOString().split('T')[0]);
  const [alumnos, setAlumnos] = useState<AlumnoAsistenciaItem[]>([]);
  const [observaciones, setObservaciones] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [guardando, setGuardando] = useState<boolean>(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  useEffect(() => {
    if (claseId && fecha) {
      cargarPlanilla();
    }
  }, [claseId, fecha]);

  const cargarPlanilla = async () => {
    try {
      setLoading(true);
      setMensajeExito(null);
      setErrorCarga(null);
      const data = await PreceptoriaAPI.getPlanillaFecha(claseId, fecha);
      const listaAlumnos = Array.isArray(data?.alumnos) ? data.alumnos : [];
      setAlumnos(listaAlumnos);
      setObservaciones(data?.sesion?.observaciones || '');
    } catch (err: any) {
      console.error('Error al cargar planilla:', err);
      setErrorCarga(err.message || 'No se pudo cargar la nómina de asistencia de la comisión seleccionada.');
      setAlumnos([]);
    } finally {
      setLoading(false);
    }
  };

  const cambiarEstado = (alumnoId: number, estado: EstadoAsistencia) => {
    setAlumnos((prev) =>
      prev.map((a) => (a.alumno_id === alumnoId ? { ...a, estado } : a))
    );
  };

  const cambiarObservacion = (alumnoId: number, obs: string) => {
    setAlumnos((prev) =>
      prev.map((a) => (a.alumno_id === alumnoId ? { ...a, observacion: obs } : a))
    );
  };

  const marcarTodos = (estado: EstadoAsistencia) => {
    setAlumnos((prev) => prev.map((a) => ({ ...a, estado })));
  };

  const handleGuardar = async () => {
    try {
      setGuardando(true);
      setMensajeExito(null);
      setErrorCarga(null);
      await PreceptoriaAPI.guardarAsistencia(
        claseId,
        fecha,
        observaciones,
        alumnos.map((a) => ({
          alumnoId: a.alumno_id,
          estado: a.estado,
          observacion: a.observacion,
        }))
      );
      setMensajeExito('¡Planilla de asistencia guardada exitosamente en el servidor!');
      setTimeout(() => setMensajeExito(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Error al guardar asistencia');
    } finally {
      setGuardando(false);
    }
  };

  // Contadores rápidos defensivos
  const totalPresentes = (alumnos || []).filter((a) => a.estado === 'PRESENTE').length;
  const totalAusentes = (alumnos || []).filter((a) => a.estado === 'AUSENTE').length;
  const totalTardes = (alumnos || []).filter((a) => a.estado === 'TARDE').length;
  const totalJustificados = (alumnos || []).filter((a) => a.estado === 'JUSTIFICADO').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Controles de Clase y Fecha */}
      <div className={styles.controlsBar}>
        <div className={styles.selectorGroup}>
          <label htmlFor="comisionAsignadaSelect" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8' }}>
            Comisión Asignada:
          </label>
          <select
            id="comisionAsignadaSelect"
            aria-label="Seleccionar comisión asignada"
            className={styles.selectInput}
            value={claseId}
            onChange={(e) => onClaseChange(Number(e.target.value))}
          >
            {clases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} {c.seccion ? `(${c.seccion})` : ''} — {c.total_alumnos} alumnos
              </option>
            ))}
          </select>

          <label htmlFor="fechaTomaAsistenciaInput" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8' }}>
            Fecha:
          </label>
          <input
            id="fechaTomaAsistenciaInput"
            aria-label="Seleccionar fecha para toma de asistencia"
            type="date"
            className={styles.dateInput}
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={() => marcarTodos('PRESENTE')}
            title="Marcar a todos como Presentes"
          >
            <i className="bx bx-check-double"></i> Todos Presentes
          </button>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={handleGuardar}
            disabled={guardando || loading}
          >
            {guardando ? (
              <>
                <i className="bx bx-loader-alt bx-spin"></i> Guardando...
              </>
            ) : (
              <>
                <i className="bx bx-save"></i> Guardar Asistencia
              </>
            )}
          </button>
        </div>
      </div>

      {/* Alerta de éxito */}
      {mensajeExito && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#34d399',
            padding: '0.75rem 1.25rem',
            borderRadius: '10px',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <i className="bx bx-check-circle" style={{ fontSize: '1.25rem' }}></i>
          {mensajeExito}
        </div>
      )}

      {/* Alerta de error */}
      {errorCarga && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#f87171',
            padding: '0.9rem 1.25rem',
            borderRadius: '10px',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <i className="bx bx-error-circle" style={{ fontSize: '1.4rem' }}></i>
            <span>{errorCarga}</span>
          </div>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={cargarPlanilla}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
          >
            <i className="bx bx-refresh"></i> Reintentar
          </button>
        </div>
      )}

      {/* Resumen en vivo de la jornada */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <span className={`${styles.badge} ${styles.badgeSuccess}`}>
          Presentes: {totalPresentes}
        </span>
        <span className={`${styles.badge} ${styles.badgeDanger}`}>
          Ausentes: {totalAusentes}
        </span>
        <span className={`${styles.badge} ${styles.badgeWarning}`}>
          Tardes: {totalTardes}
        </span>
        <span className={`${styles.badge} ${styles.badgeInfo}`}>
          Justificados: {totalJustificados}
        </span>
        <span style={{ fontSize: '0.82rem', color: '#94a3b8', marginLeft: 'auto' }}>
          Total matrícula: {alumnos.length} estudiantes
        </span>
      </div>

      {/* Tabla de Alumnos */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
          <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '2rem' }}></i>
          <p>Cargando lista de alumnos...</p>
        </div>
      ) : alumnos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          <i className="bx bx-user-x" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}></i>
          <p>No hay alumnos matriculados en esta comisión.</p>
        </div>
      ) : (
        <div className={styles.attendanceTableWrapper}>
          <table className={styles.attendanceTable}>
            <thead>
              <tr>
                <th style={{ width: '50px' }}>#</th>
                <th>Estudiante</th>
                <th>DNI / Legajo</th>
                <th style={{ minWidth: '320px' }}>Estado de Presentismo</th>
                <th>Observación</th>
              </tr>
            </thead>
            <tbody>
              {alumnos.map((a, idx) => (
                <tr key={a.alumno_id}>
                  <td style={{ color: '#64748b', fontWeight: 600 }}>{idx + 1}</td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#f8fafc' }}>{a.nombre_completo}</div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{a.correo}</div>
                  </td>
                  <td style={{ color: '#cbd5e1', fontSize: '0.84rem' }}>{a.DNI || 'S/D'}</td>
                  <td>
                    <div className={styles.statusButtonGroup}>
                      <button
                        type="button"
                        className={`${styles.statusBtn} ${a.estado === 'PRESENTE' ? styles.statusBtnPresente : ''}`}
                        onClick={() => cambiarEstado(a.alumno_id, 'PRESENTE')}
                      >
                        Presente
                      </button>
                      <button
                        type="button"
                        className={`${styles.statusBtn} ${a.estado === 'AUSENTE' ? styles.statusBtnAusente : ''}`}
                        onClick={() => cambiarEstado(a.alumno_id, 'AUSENTE')}
                      >
                        Ausente
                      </button>
                      <button
                        type="button"
                        className={`${styles.statusBtn} ${a.estado === 'TARDE' ? styles.statusBtnTarde : ''}`}
                        onClick={() => cambiarEstado(a.alumno_id, 'TARDE')}
                      >
                        Tarde
                      </button>
                      <button
                        type="button"
                        className={`${styles.statusBtn} ${a.estado === 'JUSTIFICADO' ? styles.statusBtnJustificado : ''}`}
                        onClick={() => cambiarEstado(a.alumno_id, 'JUSTIFICADO')}
                      >
                        Justificado
                      </button>
                    </div>
                  </td>
                  <td>
                    <input
                      type="text"
                      placeholder="Nota (ej: retiro anticipado)"
                      value={a.observacion || ''}
                      onChange={(e) => cambiarObservacion(a.alumno_id, e.target.value)}
                      style={{
                        background: 'rgba(30, 41, 59, 0.6)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        color: '#f8fafc',
                        padding: '0.35rem 0.65rem',
                        borderRadius: '6px',
                        fontSize: '0.82rem',
                        outline: 'none',
                        width: '100%',
                        maxWidth: '240px',
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Observaciones generales de la jornada */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
        <label htmlFor="observacionesJornadaTextarea" style={{ fontSize: '0.84rem', fontWeight: 600, color: '#94a3b8' }}>
          Observaciones Generales de la Comisión para la Fecha {fecha}:
        </label>
        <textarea
          id="observacionesJornadaTextarea"
          aria-label="Observaciones generales de la jornada"
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          placeholder="Anotaciones generales del preceptor sobre la jornada..."
          style={{
            background: 'rgba(30, 41, 59, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: '#f8fafc',
            padding: '0.65rem',
            borderRadius: '8px',
            fontSize: '0.86rem',
            minHeight: '70px',
            resize: 'vertical',
            outline: 'none',
          }}
        />
      </div>
    </div>
  );
};

export default PreceptoriaTomaAsistenciaView;

