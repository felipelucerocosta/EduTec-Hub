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

  const [subTab, setSubTab] = useState<'asistencia' | 'actas'>('asistencia');
  const [clases, setClases] = useState<ClaseOption[]>([]);
  const [selectedClaseId, setSelectedClaseId] = useState<number | null>(null);
  const [fecha, setFecha] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [observacionesGenerales, setObservacionesGenerales] = useState<string>('');

  const [alumnos, setAlumnos] = useState<AlumnoRegistroItem[]>([]);
  const [fechasTomadas, setFechasTomadas] = useState<SesionFechaItem[]>([]);

  // Actas state
  const [actas, setActas] = useState<any[]>([]);
  const [actasLoading, setActasLoading] = useState<boolean>(false);
  const [modalNuevaActa, setModalNuevaActa] = useState<boolean>(false);
  const [filtroTipoActa, setFiltroTipoActa] = useState<string>('todas');
  const [filtroEstadoActa, setFiltroEstadoActa] = useState<string>('todos');
  const [nuevaActa, setNuevaActa] = useState({
    alumno_id: '' as string | number,
    tipo: 'Conducta',
    descripcion: '',
    fecha: new Date().toISOString().split('T')[0]
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  // 1. Cargar clases del docente / preceptor
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

  // 4. Cargar actas de la clase
  const loadActas = useCallback(async (claseId: number) => {
    try {
      setActasLoading(true);
      const list = await AsistenciaAPI.getActasClase(claseId);
      setActas(Array.isArray(list) ? list : []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setActasLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedClaseId) {
      if (subTab === 'asistencia') {
        loadPlanilla(selectedClaseId, fecha);
      } else {
        loadActas(selectedClaseId);
      }
    }
  }, [selectedClaseId, fecha, subTab, loadPlanilla, loadActas]);

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

  // Crear Acta
  const handleCrearActa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClaseId) return;
    if (!nuevaActa.descripcion.trim()) {
      showToast('La descripción del acta es obligatoria.', 'error');
      return;
    }

    try {
      await AsistenciaAPI.crearActa({
        clase_id: selectedClaseId,
        alumno_id: nuevaActa.alumno_id ? Number(nuevaActa.alumno_id) : null,
        tipo: nuevaActa.tipo,
        descripcion: nuevaActa.descripcion.trim(),
        fecha: nuevaActa.fecha
      });
      showToast('Acta registrada exitosamente.', 'success');
      setModalNuevaActa(false);
      setNuevaActa({
        alumno_id: '',
        tipo: 'Conducta',
        descripcion: '',
        fecha: new Date().toISOString().split('T')[0]
      });
      loadActas(selectedClaseId);
    } catch (err: any) {
      showToast(err.message || 'Error al registrar acta', 'error');
    }
  };

  // Cambiar estado de Acta
  const handleCambiarEstadoActa = async (actaId: number, nuevoEstado: 'Abierta' | 'Resuelta') => {
    try {
      await AsistenciaAPI.actualizarEstadoActa(actaId, nuevoEstado);
      showToast(`Acta marcada como ${nuevoEstado}.`, 'info');
      if (selectedClaseId) loadActas(selectedClaseId);
    } catch (err: any) {
      showToast(err.message || 'Error al actualizar acta', 'error');
    }
  };

  // Eliminar Acta
  const handleEliminarActa = async (actaId: number) => {
    if (!confirm('¿Deseas eliminar esta acta?')) return;
    try {
      await AsistenciaAPI.eliminarActa(actaId);
      showToast('Acta eliminada correctamente.', 'success');
      if (selectedClaseId) loadActas(selectedClaseId);
    } catch (err: any) {
      showToast(err.message || 'Error al eliminar acta', 'error');
    }
  };

  // Cómputo en vivo de métricas
  const presentesCount = alumnos.filter((a) => a.estado === 'PRESENTE').length;
  const ausentesCount = alumnos.filter((a) => a.estado === 'AUSENTE').length;
  const tardesCount = alumnos.filter((a) => a.estado === 'TARDE').length;
  const justificadosCount = alumnos.filter((a) => a.estado === 'JUSTIFICADO').length;

  const actasFiltradas = actas.filter((a) => {
    const matchTipo = filtroTipoActa === 'todas' || a.tipo === filtroTipoActa;
    const matchEstado = filtroEstadoActa === 'todos' || a.estado === filtroEstadoActa;
    return matchTipo && matchEstado;
  });

  return (
    <div className={styles.container}>
      {/* ── SubTab Selector (Asistencia vs Actas) ── */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem' }}>
        <button
          type="button"
          onClick={() => setSubTab('asistencia')}
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: '10px',
            border: 'none',
            background: subTab === 'asistencia' ? '#7929d2' : 'transparent',
            color: subTab === 'asistencia' ? '#ffffff' : '#a9a3c7',
            fontWeight: subTab === 'asistencia' ? 700 : 500,
            cursor: 'pointer',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            transition: 'all 0.15s ease'
          }}
        >
          <i className="bx bx-calendar-check"></i> Planilla de Asistencia
        </button>
        <button
          type="button"
          onClick={() => {
            setSubTab('actas');
            if (selectedClaseId) loadActas(selectedClaseId);
          }}
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: '10px',
            border: 'none',
            background: subTab === 'actas' ? '#7929d2' : 'transparent',
            color: subTab === 'actas' ? '#ffffff' : '#a9a3c7',
            fontWeight: subTab === 'actas' ? 700 : 500,
            cursor: 'pointer',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            transition: 'all 0.15s ease'
          }}
        >
          <i className="bx bx-notepad"></i> Actas e Incidencias ({actas.length})
        </button>
      </div>

      {/* ── Barra de Selección de Clase ── */}
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

          {subTab === 'asistencia' && (
            <>
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
                    Historial Registrado
                  </label>
                  <select
                    className={styles.selectInput}
                    value={fechasTomadas.some((f) => f.fecha === fecha) ? fecha : ''}
                    onChange={(e) => {
                      if (e.target.value) setFecha(e.target.value);
                    }}
                    disabled={loading || saving}
                  >
                    <option value="">Seleccionar fecha previa...</option>
                    {fechasTomadas.map((f) => (
                      <option key={f.id} value={f.fecha}>
                        {f.fecha} (Pres: {f.presentes}, Aus: {f.ausentes})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          {subTab === 'actas' && (
            <div style={{ alignSelf: 'flex-end', marginLeft: 'auto' }}>
              <button
                type="button"
                onClick={() => setModalNuevaActa(true)}
                className={styles.btnPrimary}
                style={{ padding: '0.55rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
              >
                <i className="bx bx-plus-circle"></i> Registrar Nueva Acta
              </button>
            </div>
          )}
        </div>

        {subTab === 'asistencia' && (
          <div className={styles.btnGroupActions}>
            <button
              type="button"
              onClick={() => handleMarcarTodos('PRESENTE')}
              className={styles.btnSecondary}
              disabled={loading || saving}
            >
              Todos Presentes
            </button>
            <button
              type="button"
              onClick={() => handleMarcarTodos('AUSENTE')}
              className={styles.btnSecondary}
              disabled={loading || saving}
            >
              Todos Ausentes
            </button>
            <button
              type="button"
              onClick={handleGuardar}
              className={styles.btnPrimary}
              disabled={loading || saving}
            >
              {saving ? 'Guardando...' : 'Guardar Asistencia'}
            </button>
          </div>
        )}
      </div>

      {/* ── CONTENIDO: SUBTAB ASISTENCIA ── */}
      {subTab === 'asistencia' && (
        <>
          {/* Métricas del día */}
          <div className={styles.kpiGrid}>
            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <span className={styles.kpiTitle}>Presentes</span>
                <span className={`${styles.kpiBadge} ${styles.badgePresente}`}>P</span>
              </div>
              <div className={styles.kpiValue} style={{ color: '#34d399' }}>
                {presentesCount}
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <span className={styles.kpiTitle}>Ausentes</span>
                <span className={`${styles.kpiBadge} ${styles.badgeAusente}`}>A</span>
              </div>
              <div className={styles.kpiValue} style={{ color: '#f87171' }}>
                {ausentesCount}
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <span className={styles.kpiTitle}>Tardanzas</span>
                <span className={`${styles.kpiBadge} ${styles.badgeTarde}`}>T</span>
              </div>
              <div className={styles.kpiValue} style={{ color: '#fbbf24' }}>
                {tardesCount}
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <span className={styles.kpiTitle}>Justificados</span>
                <span className={`${styles.kpiBadge} ${styles.badgeJustificado}`}>J</span>
              </div>
              <div className={styles.kpiValue} style={{ color: '#38bdf8' }}>
                {justificadosCount}
              </div>
            </div>
          </div>

          {/* Tabla de Presentismo */}
          {loading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner}></div>
              <span>Cargando nómina de alumnos...</span>
            </div>
          ) : alumnos.length === 0 ? (
            <div className={styles.emptyContainer}>
              <i className="bx bx-user-x" style={{ fontSize: '3rem', color: '#64748b' }}></i>
              <p>No hay alumnos matriculados en esta comisión.</p>
            </div>
          ) : (
            <div className={styles.tableCard}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th style={{ width: '30%' }}>Alumno</th>
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
        </>
      )}

      {/* ── CONTENIDO: SUBTAB ACTAS E INCIDENCIAS ── */}
      {subTab === 'actas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Barra de Filtros */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#a9a3c7', fontWeight: 600 }}>Tipo:</span>
              <select
                className={styles.selectInput}
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                value={filtroTipoActa}
                onChange={(e) => setFiltroTipoActa(e.target.value)}
              >
                <option value="todas">Todos los tipos</option>
                <option value="Conducta">Conducta</option>
                <option value="Médica">Médica</option>
                <option value="Pedagógica">Pedagógica</option>
                <option value="Notificación a Padres">Notificación a Padres</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#a9a3c7', fontWeight: 600 }}>Estado:</span>
              <select
                className={styles.selectInput}
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                value={filtroEstadoActa}
                onChange={(e) => setFiltroEstadoActa(e.target.value)}
              >
                <option value="todos">Todos los estados</option>
                <option value="Abierta">Abiertas</option>
                <option value="Resuelta">Resueltas</option>
              </select>
            </div>

            <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#6b6688' }}>
              {actasFiltradas.length} actas registradas
            </span>
          </div>

          {/* Listado de Actas */}
          {actasLoading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner}></div>
              <span>Cargando actas institucionales...</span>
            </div>
          ) : actasFiltradas.length === 0 ? (
            <div className={styles.emptyContainer} style={{ padding: '2.5rem' }}>
              <i className="bx bx-check-shield" style={{ fontSize: '3rem', color: '#34d399' }}></i>
              <p style={{ marginTop: '0.5rem', fontWeight: 600, color: '#f8fafc' }}>
                Sin novedades registradas para esta comisión
              </p>
              <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                No existen actas de conducta, médicas o pedagógicas pendientes.
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {actasFiltradas.map((acta) => (
                <div
                  key={acta.id}
                  style={{
                    background: '#0d1222',
                    border: '1px solid rgba(151, 71, 255, 0.15)',
                    borderRadius: '14px',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span
                        style={{
                          padding: '3px 10px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: acta.tipo === 'Conducta'
                            ? 'rgba(239, 68, 68, 0.18)'
                            : acta.tipo === 'Médica'
                            ? 'rgba(56, 189, 248, 0.18)'
                            : acta.tipo === 'Pedagógica'
                            ? 'rgba(124, 58, 237, 0.18)'
                            : 'rgba(245, 158, 11, 0.18)',
                          color: acta.tipo === 'Conducta'
                            ? '#f87171'
                            : acta.tipo === 'Médica'
                            ? '#38bdf8'
                            : acta.tipo === 'Pedagógica'
                            ? '#c4b5fd'
                            : '#fbbf24',
                          border: '1px solid rgba(255, 255, 255, 0.08)'
                        }}
                      >
                        {acta.tipo}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: '#a9a3c7' }}>
                        Fecha: <strong>{acta.fecha}</strong>
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '50px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          background: acta.estado === 'Resuelta' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: acta.estado === 'Resuelta' ? '#34d399' : '#fbbf24',
                          border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}
                      >
                        {acta.estado}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleCambiarEstadoActa(acta.id, acta.estado === 'Abierta' ? 'Resuelta' : 'Abierta')}
                        style={{
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: '#f3f0ff',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          cursor: 'pointer'
                        }}
                      >
                        {acta.estado === 'Abierta' ? 'Marcar Resuelta' : 'Reabrir'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleEliminarActa(acta.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#ef4444',
                          padding: '4px',
                          cursor: 'pointer',
                          fontSize: '1rem'
                        }}
                        title="Eliminar acta"
                      >
                        <i className="bx bx-trash"></i>
                      </button>
                    </div>
                  </div>

                  <p style={{ margin: 0, color: '#f8fafc', fontSize: '0.9rem', lineHeight: 1.5 }}>
                    {acta.descripcion}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#6b6688', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '0.5rem' }}>
                    <span>
                      {acta.alumno_nombre ? `Alumno involucrado: ${acta.alumno_nombre}` : 'Novedad general de curso'}
                    </span>
                    <span>Registrado por: {acta.creador_nombre || 'Preceptoría'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Modal / Formulario Nueva Acta */}
          {modalNuevaActa && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(6px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem'
            }}>
              <div style={{
                background: '#0d1222',
                border: '1px solid rgba(151, 71, 255, 0.3)',
                borderRadius: '16px',
                padding: '1.75rem',
                width: '100%',
                maxWidth: '520px',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#f3f0ff' }}>
                    Registrar Acta de Novedad / Incidencia
                  </h3>
                  <button
                    type="button"
                    onClick={() => setModalNuevaActa(false)}
                    style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.3rem', cursor: 'pointer' }}
                  >
                    <i className="bx bx-x"></i>
                  </button>
                </div>

                <form onSubmit={handleCrearActa} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#a9a3c7', fontWeight: 600, marginBottom: '0.35rem' }}>
                      Tipo de Acta
                    </label>
                    <select
                      className={styles.selectInput}
                      style={{ width: '100%' }}
                      value={nuevaActa.tipo}
                      onChange={(e) => setNuevaActa({ ...nuevaActa, tipo: e.target.value })}
                    >
                      <option value="Conducta">Conducta / Disciplina</option>
                      <option value="Médica">Médica / Salud</option>
                      <option value="Pedagógica">Pedagógica / Académica</option>
                      <option value="Notificación a Padres">Notificación a Padres / Tutores</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#a9a3c7', fontWeight: 600, marginBottom: '0.35rem' }}>
                      Alumno Involucrado (Opcional)
                    </label>
                    <select
                      className={styles.selectInput}
                      style={{ width: '100%' }}
                      value={nuevaActa.alumno_id}
                      onChange={(e) => setNuevaActa({ ...nuevaActa, alumno_id: e.target.value })}
                    >
                      <option value="">Novedad general de comisión / Sin alumno individual</option>
                      {alumnos.map((a) => (
                        <option key={a.alumno_id} value={a.alumno_id}>
                          {a.nombre_completo} ({a.DNI})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#a9a3c7', fontWeight: 600, marginBottom: '0.35rem' }}>
                      Fecha del Suceso
                    </label>
                    <input
                      type="date"
                      className={styles.dateInput}
                      style={{ width: '100%' }}
                      value={nuevaActa.fecha}
                      onChange={(e) => setNuevaActa({ ...nuevaActa, fecha: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#a9a3c7', fontWeight: 600, marginBottom: '0.35rem' }}>
                      Descripción y Detalle de la Novedad
                    </label>
                    <textarea
                      rows={4}
                      className={styles.obsInput}
                      style={{ width: '100%', resize: 'vertical' }}
                      placeholder="Describa el hecho, medidas adoptadas o motivo de la incidencia..."
                      value={nuevaActa.descripcion}
                      onChange={(e) => setNuevaActa({ ...nuevaActa, descripcion: e.target.value })}
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setModalNuevaActa(false)}
                      className={styles.btnSecondary}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className={styles.btnPrimary}
                    >
                      Guardar Acta
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AsistenciaDocenteView;
