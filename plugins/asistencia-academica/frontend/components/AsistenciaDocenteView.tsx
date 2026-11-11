import React, { useState, useEffect, useCallback } from 'react';
import {
  AsistenciaAPI,
  type ClaseOption,
  type AlumnoRegistroItem,
  type EstadoAsistencia,
  type SesionFechaItem,
} from '../services/asistencia_api';
import styles from '../styles/asistencia.module.css';
import { useToast } from '../../../../frontend/src/contexts/ToastContext';

export const AsistenciaDocenteView: React.FC = () => {
  const { showToast } = useToast();

  const [clases, setClases] = useState<ClaseOption[]>([]);
  const [selectedClaseId, setSelectedClaseId] = useState<number | null>(null);
  const [fecha, setFecha] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [observacionesGenerales, setObservacionesGenerales] = useState<string>('');

  const [alumnos, setAlumnos] = useState<AlumnoRegistroItem[]>([]);
  const [fechasTomadas, setFechasTomadas] = useState<SesionFechaItem[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  // 1. Cargar clases del docente
  useEffect(() => {
    async function loadClases() {
      try {
        setLoading(true);
        const data = await AsistenciaAPI.getClasesDocente();
        setClases(data);
        if (data.length > 0) {
          setSelectedClaseId(data[0].id);
        }
      } catch (err: any) {
        showToast(err.message || 'Error al cargar clases', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadClases();
  }, [showToast]);

  // 2. Cargar historial de fechas de la clase seleccionada
  const loadFechasHistorial = useCallback(async (claseId: number) => {
    try {
      const fechas = await AsistenciaAPI.getFechasClase(claseId);
      setFechasTomadas(fechas);
    } catch (_e) {
      // Opcional
    }
  }, []);

  // 3. Cargar planilla para la clase y fecha elegida
  const loadPlanilla = useCallback(async (claseId: number, fechaSel: string) => {
    try {
      setLoading(true);
      const data = await AsistenciaAPI.getPlanilla(claseId, fechaSel);
      setAlumnos(data.alumnos || []);
      setObservacionesGenerales(data.sesion?.observaciones || '');
      await loadFechasHistorial(claseId);
    } catch (err: any) {
      showToast(err.message || 'Error al cargar planilla', 'error');
    } finally {
      setLoading(false);
    }
  }, [loadFechasHistorial, showToast]);

  useEffect(() => {
    if (selectedClaseId) {
      loadPlanilla(selectedClaseId, fecha);
    }
  }, [selectedClaseId, fecha, loadPlanilla]);

  // Manejo de cambio de estado de un alumno
  const handleEstadoChange = (alumnoId: number, nuevoEstado: EstadoAsistencia) => {
    setAlumnos((prev) =>
      prev.map((a) => (a.alumno_id === alumnoId ? { ...a, estado: nuevoEstado } : a))
    );
  };

  // Manejo de observación de un alumno
  const handleObservacionChange = (alumnoId: number, obs: string) => {
    setAlumnos((prev) =>
      prev.map((a) => (a.alumno_id === alumnoId ? { ...a, observacion: obs } : a))
    );
  };

  // Acción rápida: Marcar a todos Presentes
  const handleMarcarTodos = (estado: EstadoAsistencia) => {
    setAlumnos((prev) => prev.map((a) => ({ ...a, estado })));
    showToast(`Se marcó a todos como ${estado}`, 'info');
  };

  // Guardar planilla
  const handleGuardar = async () => {
    if (!selectedClaseId) return;

    if (alumnos.length === 0) {
      showToast('No hay estudiantes en la lista para registrar asistencia.', 'error');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        fecha,
        observaciones: observacionesGenerales,
        registros: alumnos.map((a) => ({
          alumnoId: a.alumno_id,
          estado: a.estado,
          observacion: a.observacion || undefined,
        })),
      };

      await AsistenciaAPI.guardarPlanilla(selectedClaseId, payload);
      showToast('Planilla de asistencia guardada correctamente.', 'success');
      await loadFechasHistorial(selectedClaseId);
    } catch (err: any) {
      showToast(err.message || 'Error al guardar asistencia', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Cómputo en vivo de métricas
  const presentesCount = alumnos.filter((a) => a.estado === 'PRESENTE').length;
  const ausentesCount = alumnos.filter((a) => a.estado === 'AUSENTE').length;
  const tardesCount = alumnos.filter((a) => a.estado === 'TARDE').length;
  const justificadosCount = alumnos.filter((a) => a.estado === 'JUSTIFICADO').length;

  return (
    <div className={styles.container}>
      {/* ── Barra de Selección y Acciones ── */}
      <div className={styles.toolbarCard}>
        <div className={styles.toolbarGroup}>
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
              Materia / Comisión
            </label>
            <select
              className={styles.selectInput}
              value={selectedClaseId || ''}
              onChange={(e) => setSelectedClaseId(Number(e.target.value))}
              disabled={loading || saving}
            >
              {clases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} ({c.seccion}) — {c.total_alumnos} alumnos
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
              Fecha Lectiva
            </label>
            <input
              type="date"
              className={styles.dateInput}
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              disabled={loading || saving}
            />
          </div>

          {fechasTomadas.length > 0 && (
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                Historial de Fechas
              </label>
              <select
                className={styles.selectInput}
                onChange={(e) => {
                  if (e.target.value) setFecha(e.target.value);
                }}
                defaultValue=""
              >
                <option value="" disabled>Ver fecha anterior...</option>
                {fechasTomadas.map((f) => (
                  <option key={f.id} value={f.fecha}>
                    {f.fecha} (Pres: {f.presentes}, Aus: {f.ausentes})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={styles.statusBtn}
            onClick={() => handleMarcarTodos('PRESENTE')}
            disabled={loading || saving || alumnos.length === 0}
            style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.25)' }}
          >
            <i className="bx bx-check-double"></i> Todos Presentes
          </button>

          <button
            type="button"
            className={styles.btnSave}
            onClick={handleGuardar}
            disabled={loading || saving || alumnos.length === 0}
          >
            <i className={`bx ${saving ? 'bx-loader-alt bx-spin' : 'bx-save'}`}></i>
            {saving ? 'Guardando...' : 'Guardar Asistencia'}
          </button>
        </div>
      </div>

      {/* ── KPIs de la Jornada ── */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Total Alumnos</span>
          <span className={styles.kpiValue} style={{ color: '#f8fafc' }}>{alumnos.length}</span>
          <span className={styles.kpiSubtext}>Matriculados en la lista</span>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Presentes</span>
          <span className={styles.kpiValue} style={{ color: '#34d399' }}>{presentesCount}</span>
          <span className={styles.kpiSubtext}>Asistencia completa</span>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Ausentes</span>
          <span className={styles.kpiValue} style={{ color: '#f87171' }}>{ausentesCount}</span>
          <span className={styles.kpiSubtext}>Faltas computadas</span>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Tardes</span>
          <span className={styles.kpiValue} style={{ color: '#fbbf24' }}>{tardesCount}</span>
          <span className={styles.kpiSubtext}>Media falta</span>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Justificados</span>
          <span className={styles.kpiValue} style={{ color: '#38bdf8' }}>{justificadosCount}</span>
          <span className={styles.kpiSubtext}>Con certificado oficial</span>
        </div>
      </div>

      {/* ── Observaciones Generales de la Sesión ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
          Observaciones de la Jornada (Opcional)
        </label>
        <input
          type="text"
          className={styles.obsInput}
          placeholder="Ej: Clase práctica en Taller de Redes; examen de mitad de período..."
          value={observacionesGenerales}
          onChange={(e) => setObservacionesGenerales(e.target.value)}
        />
      </div>

      {/* ── Planilla de Alumnos ── */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
          <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '2rem', color: '#7c3aed' }}></i>
          <p style={{ marginTop: '0.5rem' }}>Cargando planilla de asistencia...</p>
        </div>
      ) : alumnos.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', background: 'rgba(10,14,23,0.5)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <i className="bx bx-user-x" style={{ fontSize: '2.5rem', color: '#64748b' }}></i>
          <h3 style={{ fontFamily: "'Outfit', sans-serif", color: '#f8fafc', marginTop: '0.5rem' }}>Sin alumnos matriculados</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem' }}>Esta comisión no tiene estudiantes registrados aún.</p>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '30%' }}>Estudiante</th>
                <th style={{ width: '15%' }}>DNI</th>
                <th style={{ width: '35%' }}>Estado de Asistencia</th>
                <th style={{ width: '20%' }}>Observación Individual</th>
              </tr>
            </thead>
            <tbody>
              {alumnos.map((alu) => (
                <tr key={alu.alumno_id}>
                  <td>
                    <div style={{ fontWeight: 700, color: '#f8fafc' }}>{alu.nombre_completo}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{alu.correo}</div>
                  </td>
                  <td style={{ fontFamily: 'monospace', color: '#94a3b8' }}>{alu.DNI}</td>
                  <td>
                    <div className={styles.statusButtonGroup}>
                      <button
                        type="button"
                        onClick={() => handleEstadoChange(alu.alumno_id, 'PRESENTE')}
                        className={`${styles.statusBtn} ${alu.estado === 'PRESENTE' ? styles.statusBtnPresenteActive : ''}`}
                      >
                        Presente
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEstadoChange(alu.alumno_id, 'AUSENTE')}
                        className={`${styles.statusBtn} ${alu.estado === 'AUSENTE' ? styles.statusBtnAusenteActive : ''}`}
                      >
                        Ausente
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEstadoChange(alu.alumno_id, 'TARDE')}
                        className={`${styles.statusBtn} ${alu.estado === 'TARDE' ? styles.statusBtnTardeActive : ''}`}
                      >
                        Tarde
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEstadoChange(alu.alumno_id, 'JUSTIFICADO')}
                        className={`${styles.statusBtn} ${alu.estado === 'JUSTIFICADO' ? styles.statusBtnJustificadoActive : ''}`}
                      >
                        Justificado
                      </button>
                    </div>
                  </td>
                  <td>
                    <input
                      type="text"
                      className={styles.obsInput}
                      placeholder="Sin observaciones"
                      value={alu.observacion || ''}
                      onChange={(e) => handleObservacionChange(alu.alumno_id, e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AsistenciaDocenteView;

