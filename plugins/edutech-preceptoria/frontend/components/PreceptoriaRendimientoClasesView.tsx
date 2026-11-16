import React, { useState, useEffect } from 'react';
import PreceptoriaAPI, { type ClaseRendimientoItem } from '../services/preceptoria_api';

export const PreceptoriaRendimientoClasesView: React.FC = () => {
  const [clases, setClases] = useState<ClaseRendimientoItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [claseActivaId, setClaseActivaId] = useState<number | null>(null);

  useEffect(() => {
    cargarRendimiento();
  }, []);

  const cargarRendimiento = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await PreceptoriaAPI.getRendimientoClases();
      setClases(data);
      if (data.length > 0) {
        setClaseActivaId(data[0].clase_id);
      }
    } catch (err: any) {
      console.error('Error al cargar rendimiento de clases:', err);
      setError(err.message || 'Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
        <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '2.5rem', color: '#38bdf8', marginBottom: '1rem' }}></i>
        <p>Calculando estadísticas de rendimiento académico...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: '#f87171' }}>
        <p>{error}</p>
        <button
          onClick={cargarRendimiento}
          style={{
            marginTop: '1rem',
            padding: '0.6rem 1.2rem',
            borderRadius: '8px',
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

  if (clases.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '4rem',
        background: 'rgba(15, 23, 42, 0.4)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        color: '#64748b'
      }}>
        <i className="bx bx-bar-chart" style={{ fontSize: '3rem', marginBottom: '0.5rem' }}></i>
        <p>No hay comisiones asignadas para analizar rendimiento.</p>
      </div>
    );
  }

  const claseActual = clases.find(c => c.clase_id === claseActivaId) || clases[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Selector de Comisión */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#f8fafc', fontWeight: 700 }}>
            Supervisión Académica por Comisión
          </h3>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
            Indicadores generales de rendimiento, aprobación y presentismo escolar.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <label style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Comisión:</label>
          <select
            value={claseActual.clase_id}
            onChange={e => setClaseActivaId(Number(e.target.value))}
            style={{
              background: 'rgba(30, 41, 59, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#f8fafc',
              padding: '0.6rem 1rem',
              borderRadius: '10px',
              fontSize: '0.9rem',
              fontWeight: 600,
              outline: 'none'
            }}
          >
            {clases.map(c => (
              <option key={c.clase_id} value={c.clase_id}>
                {c.nombre} {c.seccion ? `(${c.seccion})` : ''} — {c.materia}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tarjetas Estadísticas de la Clase */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem'
      }}>
        {/* Total Alumnos */}
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
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Total de Alumnos</span>
            <i className="bx bx-group" style={{ fontSize: '1.3rem', color: '#38bdf8' }}></i>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc' }}>
            {claseActual.totalAlumnos}
          </div>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Matriculados en la división</span>
        </div>

        {/* Rendimiento Promedio */}
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
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Promedio Académico</span>
            <i className="bx bx-line-chart" style={{ fontSize: '1.3rem', color: '#a78bfa' }}></i>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#a78bfa' }}>
            {claseActual.promedioGeneral !== null ? `${claseActual.promedioGeneral} pts` : 'Sin notas'}
          </div>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Sobre evaluaciones y TPs calificados</span>
        </div>

        {/* Rendimiento Satisfactorio */}
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
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Rendimiento Satisfactorio</span>
            <i className="bx bx-check-double" style={{ fontSize: '1.3rem', color: '#34d399' }}></i>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#34d399' }}>
            {claseActual.alumnosSatisfactorios}
          </div>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Alumnos con promedio &ge; 6</span>
        </div>

        {/* Requieren Seguimiento */}
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
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Requieren Seguimiento</span>
            <i className="bx bx-alarm-exclamation" style={{ fontSize: '1.3rem', color: '#fbbf24' }}></i>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fbbf24' }}>
            {claseActual.alumnosRequierenSeguimiento}
          </div>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Promedio &lt; 6 o baja asistencia</span>
        </div>
      </div>

      {/* Paneles visuales de Aprobación y Presentismo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Tasa de Aprobación */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: 0, fontSize: '1rem', color: '#f8fafc', fontWeight: 700 }}>
              Tasa General de Aprobación
            </h4>
            <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#34d399' }}>
              {claseActual.tasaAprobacion}%
            </span>
          </div>

          <div style={{ height: '10px', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{
              width: `${claseActual.tasaAprobacion}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #10b981, #06b6d4)',
              borderRadius: '999px'
            }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8' }}>
            <span>Aprobados (&ge; 6 pts)</span>
            <span>Trabajos Prácticos Totales: {claseActual.totalTrabajos}</span>
          </div>
        </div>

        {/* Tasa de Presentismo */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: 0, fontSize: '1rem', color: '#f8fafc', fontWeight: 700 }}>
              Presentismo Global de la Clase
            </h4>
            <span style={{
              fontSize: '1.3rem',
              fontWeight: 800,
              color: claseActual.porcentajePresentismo >= 75 ? '#38bdf8' : '#f87171'
            }}>
              {claseActual.porcentajePresentismo}%
            </span>
          </div>

          <div style={{ height: '10px', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{
              width: `${claseActual.porcentajePresentismo}%`,
              height: '100%',
              background: claseActual.porcentajePresentismo >= 75
                ? 'linear-gradient(90deg, #38bdf8, #818cf8)'
                : '#f87171',
              borderRadius: '999px'
            }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8' }}>
            <span>Mínimo reglamentario: 75%</span>
            <span>{claseActual.porcentajePresentismo >= 75 ? 'Condición General Saludable' : 'Alerta de Inasistencias'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreceptoriaRendimientoClasesView;
