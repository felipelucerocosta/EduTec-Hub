import React, { useState, useEffect } from 'react';
import PreceptoriaAPI, { type AlumnoRendimientoItem, type ClasePreceptorOption } from '../services/preceptoria_api';

interface Props {
  clases: ClasePreceptorOption[];
}

export const PreceptoriaAlumnosView: React.FC<Props> = ({ clases }) => {
  const [alumnos, setAlumnos] = useState<AlumnoRendimientoItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [busqueda, setBusqueda] = useState<string>('');
  const [claseFiltro, setClaseFiltro] = useState<string>('todas');
  const [cursoFiltro, setCursoFiltro] = useState<string>('todos');
  const [regularidadFiltro, setRegularidadFiltro] = useState<string>('todos');

  // Modal de Detalle Académico
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<AlumnoRendimientoItem | null>(null);

  useEffect(() => {
    cargarAlumnos();
  }, [claseFiltro]);

  const cargarAlumnos = async () => {
    try {
      setLoading(true);
      setError(null);
      const cId = claseFiltro === 'todas' ? undefined : Number(claseFiltro);
      const data = await PreceptoriaAPI.getAlumnosRendimiento(cId);
      setAlumnos(data);
    } catch (err: any) {
      console.error('Error al cargar alumnos en preceptoría:', err);
      setError(err.message || 'Error al cargar alumnos.');
    } finally {
      setLoading(false);
    }
  };

  // Obtener cursos únicos disponibles
  const cursosDisponibles = Array.from(new Set(alumnos.map(a => a.curso).filter(Boolean)));

  // Filtrado reactivo en cliente
  const alumnosFiltrados = alumnos.filter(a => {
    // Búsqueda por texto (nombre, DNI, correo)
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase().trim();
      const match = a.nombre_completo.toLowerCase().includes(q) ||
                    (a.DNI && a.DNI.includes(q)) ||
                    a.correo.toLowerCase().includes(q);
      if (!match) return false;
    }

    // Filtro curso
    if (cursoFiltro !== 'todos' && a.curso !== cursoFiltro) {
      return false;
    }

    // Filtro regularidad
    if (regularidadFiltro === 'regular' && !a.esRegular) return false;
    if (regularidadFiltro === 'no_regular' && a.esRegular) return false;
    if (regularidadFiltro === 'seguimiento' && !a.requiereSeguimiento) return false;

    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Barra de Filtros y Búsqueda */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '1.25rem',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Buscador */}
        <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: '420px' }}>
          <i className="bx bx-search" style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#94a3b8',
            fontSize: '1.2rem'
          }}></i>
          <input
            type="text"
            placeholder="Buscar por nombre, apellido, DNI o usuario..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            style={{
              width: '100%',
              padding: '0.65rem 1rem 0.65rem 2.4rem',
              borderRadius: '10px',
              background: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#f8fafc',
              fontSize: '0.88rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Controles de selección */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          {/* Filtro Comisión */}
          {clases.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Comisión:</label>
              <select
                value={claseFiltro}
                onChange={e => setClaseFiltro(e.target.value)}
                style={{
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#f8fafc',
                  padding: '0.55rem 0.85rem',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              >
                <option value="todas">Todas las comisiones asignadas</option>
                {clases.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre} ({c.seccion})</option>
                ))}
              </select>
            </div>
          )}

          {/* Filtro Curso */}
          {cursosDisponibles.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Curso/Año:</label>
              <select
                value={cursoFiltro}
                onChange={e => setCursoFiltro(e.target.value)}
                style={{
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#f8fafc',
                  padding: '0.55rem 0.85rem',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              >
                <option value="todos">Todos los cursos</option>
                {cursosDisponibles.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}

          {/* Filtro Condición */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Condición:</label>
            <select
              value={regularidadFiltro}
              onChange={e => setRegularidadFiltro(e.target.value)}
              style={{
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#f8fafc',
                padding: '0.55rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            >
              <option value="todos">Todos los estados</option>
              <option value="regular">Regulares (&ge; 75%)</option>
              <option value="no_regular">No regulares (&lt; 75%)</option>
              <option value="seguimiento">Requieren seguimiento pedagógico</option>
            </select>
          </div>
        </div>
      </div>

      {/* Indicador de resultados */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94a3b8', fontSize: '0.88rem' }}>
        <span>Mostrando <strong>{alumnosFiltrados.length}</strong> alumnos</span>
        {alumnosFiltrados.some(a => a.requiereSeguimiento) && (
          <span style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <i className="bx bx-error-alt"></i>
            {alumnosFiltrados.filter(a => a.requiereSeguimiento).length} alumnos en seguimiento o riesgo
          </span>
        )}
      </div>

      {/* Tabla de Alumnos */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
          <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '2.5rem', color: '#38bdf8', marginBottom: '1rem' }}></i>
          <p>Cargando nómina de alumnos...</p>
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#f87171' }}>
          <p>{error}</p>
        </div>
      ) : alumnosFiltrados.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem',
          background: 'rgba(15, 23, 42, 0.4)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          color: '#64748b'
        }}>
          <i className="bx bx-user-x" style={{ fontSize: '3rem', marginBottom: '0.5rem' }}></i>
          <p>No se encontraron alumnos con los criterios seleccionados.</p>
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
                  <th style={{ padding: '0.85rem 1.25rem' }}>Alumno / Identificador</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Curso y División</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Comisión</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Presentismo</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Regularidad</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Rendimiento Académico</th>
                  <th style={{ padding: '0.85rem 1.25rem', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {alumnosFiltrados.map(a => (
                  <tr key={`${a.alumno_id}-${a.clase_id}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '0.85rem 1.25rem' }}>
                      <div style={{ fontWeight: 600, color: '#f8fafc' }}>{a.nombre_completo}</div>
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                        DNI: {a.DNI || '—'} &bull; {a.correo}
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', color: '#cbd5e1' }}>
                      {a.curso}
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', color: '#94a3b8' }}>
                      {a.clase_nombre} {a.clase_seccion && `(${a.clase_seccion})`}
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 700, color: a.esRegular ? '#38bdf8' : '#f87171' }}>
                          {a.porcentajeAsistencia}%
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          ({a.totalPresentes}P / {a.totalAusentes}A)
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem' }}>
                      <span style={{
                        padding: '0.2rem 0.65rem',
                        borderRadius: '999px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: a.esRegular ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                        color: a.esRegular ? '#34d399' : '#f87171',
                        border: `1px solid ${a.esRegular ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)'}`
                      }}>
                        {a.estadoRegularidad}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{
                          fontWeight: 700,
                          color: a.promedioNotas === null ? '#94a3b8' : (a.promedioNotas >= 6 ? '#34d399' : '#fbbf24')
                        }}>
                          {a.promedioNotas !== null ? `${a.promedioNotas} pts` : 'Sin notas'}
                        </span>
                        <span style={{
                          fontSize: '0.75rem',
                          color: a.estadoAcademico === 'Satisfactorio' ? '#34d399' : '#fbbf24'
                        }}>
                          &bull; {a.estadoAcademico}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', textAlign: 'center' }}>
                      <button
                        onClick={() => setAlumnoSeleccionado(a)}
                        style={{
                          padding: '0.45rem 0.85rem',
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
                        <i className="bx bx-user-pin"></i> Situación
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODAL: SITUACIÓN ACADÉMICA INDIVIDUAL (SOLO LECTURA) ───────────────── */}
      {alumnoSeleccionado && (
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'rgba(56, 189, 248, 0.2)',
                  color: '#38bdf8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.3rem'
                }}>
                  <i className="bx bx-id-card"></i>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>
                    {alumnoSeleccionado.nombre_completo}
                  </h3>
                  <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                    DNI {alumnoSeleccionado.DNI || 'S/D'} &bull; {alumnoSeleccionado.curso}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setAlumnoSeleccionado(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.4rem', cursor: 'pointer' }}
              >
                <i className="bx bx-x"></i>
              </button>
            </div>

            {/* Ficha técnica informativa */}
            <div style={{
              background: 'rgba(30, 41, 59, 0.6)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              padding: '1rem',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
              fontSize: '0.88rem'
            }}>
              <div>
                <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Comisión</span>
                <span style={{ fontWeight: 600 }}>{alumnoSeleccionado.clase_nombre}</span>
              </div>
              <div>
                <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Condición de Regularidad</span>
                <span style={{
                  fontWeight: 700,
                  color: alumnoSeleccionado.esRegular ? '#34d399' : '#f87171'
                }}>
                  {alumnoSeleccionado.estadoRegularidad} ({alumnoSeleccionado.porcentajeAsistencia}%)
                </span>
              </div>
              <div>
                <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Historial Asistencias</span>
                <span>{alumnoSeleccionado.totalPresentes} presentes / {alumnoSeleccionado.totalAusentes} ausencias</span>
              </div>
              <div>
                <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Rendimiento Evaluativo</span>
                <span style={{
                  fontWeight: 700,
                  color: alumnoSeleccionado.promedioNotas === null ? '#94a3b8' : (alumnoSeleccionado.promedioNotas >= 6 ? '#34d399' : '#fbbf24')
                }}>
                  {alumnoSeleccionado.promedioNotas !== null ? `${alumnoSeleccionado.promedioNotas} / 10` : 'Sin evaluaciones'}
                </span>
              </div>
            </div>

            <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b', fontStyle: 'italic' }}>
              Nota: El perfil de Preceptoría tiene facultades de supervisión y emisión de constancias de regularidad. Las calificaciones y trabajos prácticos solo pueden ser alterados por el profesor titular de cátedra.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button
                onClick={() => setAlumnoSeleccionado(null)}
                style={{
                  padding: '0.55rem 1.25rem',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.08)',
                  color: '#cbd5e1',
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

export default PreceptoriaAlumnosView;
