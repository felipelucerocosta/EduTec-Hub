import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import AppLayout from '../components/layout/AppLayout';
import Button from '../components reutilizables/Button';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import EmptyState from '../components/ui/EmptyState';
import { BACKEND_URL, API_URL } from '../config/api';

const MESES_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [clases, setClases] = useState<any[]>([]);
  const [notificaciones, setNotificaciones] = useState<any[]>([]);
  const [rendimientoData, setRendimientoData] = useState<any>(null);
  const [evolucionData, setEvolucionData] = useState<any[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'anual' | '1t' | '2t' | '3t'>('anual');
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;

    // Si es administrador, redirigir a la consola de administración
    if (user.rol === 'admin') {
      navigate('/admin', { replace: true });
      return;
    }

    const esPendiente = user.rol === 'alumno' && user.estado_acceso !== 'ACTIVO';

    const fetchData = async () => {
      setLoading(true);
      try {
        if (!esPendiente) {
          // 1. Clases asignadas
          const endpoint = user.rol === 'alumno' ? '/api/alumno/mis-clases' : '/api/profesor/mis-clases';
          const resClases = await fetch(`${BACKEND_URL}${endpoint}`, { credentials: 'include' });
          if (resClases.ok) {
            const dataClases = await resClases.json();
            setClases(Array.isArray(dataClases) ? dataClases : []);
          }

          // 2. Rendimiento real según rol
          if (user.rol === 'alumno') {
            const resRend = await fetch(`${API_URL}/rendimiento/alumno`, { credentials: 'include' });
            if (resRend.ok) {
              const dataR = await resRend.json();
              setRendimientoData(dataR);
            }
          } else if (user.rol === 'profesor') {
            const resRend = await fetch(`${API_URL}/rendimiento/profesor/resumen`, { credentials: 'include' });
            if (resRend.ok) {
              const dataR = await resRend.json();
              setRendimientoData(dataR);
            }
          }

          // 3. Evolución histórica real
          const resEvol = await fetch(`${API_URL}/rendimiento/evolucion`, { credentials: 'include' });
          if (resEvol.ok) {
            const dataE = await resEvol.json();
            setEvolucionData(Array.isArray(dataE) ? dataE : []);
          }
        }

        // 4. Notificaciones
        const resNotif = await fetch(`${API_URL}/notificaciones`, { credentials: 'include' });
        if (resNotif.ok) {
          const dataNotif = await resNotif.json();
          setNotificaciones(Array.isArray(dataNotif) ? dataNotif : []);
        }
      } catch (err) {
        console.error('Error al cargar datos del dashboard:', err);
        showToast('Error al conectar con el servidor.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, navigate, showToast]);

  if (!user || user.rol === 'admin') return null;

  // Métricas calculadas honestas (0 o S/D si no existen)
  const totalClases = clases.length;
  const totalTrabajos = Number(rendimientoData?.resumen?.total_trabajos ?? 0);
  const totalEntregados = Number(rendimientoData?.resumen?.total_entregados ?? 0);
  const totalPendientes = Number(rendimientoData?.resumen?.total_pendientes ?? 0);
  const totalCalificados = Number(rendimientoData?.resumen?.total_calificados ?? 0);
  const promedioGeneral: number | null = rendimientoData?.resumen?.promedio_general !== undefined
    ? rendimientoData.resumen.promedio_general
    : null;
  const porcentajeAvance = totalTrabajos > 0 ? Math.round((totalEntregados / totalTrabajos) * 100) : 0;

  // Formatear línea de tiempo real
  const chartTimeline = evolucionData.map((d: any) => {
    let mesLabel = d.periodo || '';
    if (d.periodo && d.periodo.includes('-')) {
      const parts = d.periodo.split('-');
      const monthIdx = parseInt(parts[1], 10) - 1;
      if (monthIdx >= 0 && monthIdx < 12) {
        mesLabel = MESES_ES[monthIdx];
      }
    }
    return {
      label: mesLabel,
      valor: Number(d.promedio || 0),
      target: 7.0,
      cantidad: Number(d.cantidad || 0)
    };
  });

  // Coordenadas SVG
  const chartWidth = 620;
  const chartHeight = 180;
  const paddingX = 40;
  const paddingY = 25;
  const maxY = 10;
  const minY = 1;

  const points = chartTimeline.map((d, i) => {
    const divisor = chartTimeline.length > 1 ? chartTimeline.length - 1 : 1;
    const x = paddingX + (i / divisor) * (chartWidth - paddingX * 2);
    const clampedVal = Math.max(minY, Math.min(maxY, d.valor));
    const y = chartHeight - paddingY - ((clampedVal - minY) / (maxY - minY)) * (chartHeight - paddingY * 2);
    const yTarget = chartHeight - paddingY - ((d.target - minY) / (maxY - minY)) * (chartHeight - paddingY * 2);
    return { ...d, x, y, yTarget, index: i };
  });

  const createSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    return pts.reduce((acc, point, i, arr) => {
      if (i === 0) return `M ${point.x} ${point.y}`;
      const prev = arr[i - 1];
      const cp1x = prev.x + (point.x - prev.x) / 2;
      const cp1y = prev.y;
      const cp2x = prev.x + (point.x - prev.x) / 2;
      const cp2y = point.y;
      return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${point.x} ${point.y}`;
    }, '');
  };

  const linePath = createSmoothPath(points.map((p) => ({ x: p.x, y: p.y })));
  const targetPath = createSmoothPath(points.map((p) => ({ x: p.x, y: p.yTarget })));
  const areaPath = points.length > 1
    ? `${linePath} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`
    : '';

  // Donut Ring Data basado en datos reales
  const enRevision = Math.max(0, totalEntregados - totalCalificados);
  const pctCalificados = totalTrabajos > 0 ? Math.round((totalCalificados / totalTrabajos) * 100) : 0;
  const pctRevision = totalTrabajos > 0 ? Math.round((enRevision / totalTrabajos) * 100) : 0;
  const pctPendientes = totalTrabajos > 0 ? Math.max(0, 100 - pctCalificados - pctRevision) : 0;

  const donutData = [
    { label: 'Calificados', count: totalCalificados, color: '#7929d2', pct: pctCalificados },
    { label: user.rol === 'alumno' ? 'En Corrección' : 'Pendiente Revisión', count: enRevision, color: '#55ddf5', pct: pctRevision },
    { label: 'Sin Entregar', count: totalPendientes, color: '#f59e0b', pct: pctPendientes }
  ];

  return (
    <AppLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Header de Consola */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1
              style={{
                fontSize: '1.75rem',
                fontWeight: 800,
                color: '#f3f0ff',
                margin: 0,
                letterSpacing: '-0.02em',
                fontFamily: 'var(--font-family-display)'
              }}
            >
              Consola Académica EduTech
            </h1>
            <p style={{ color: '#a9a3c7', fontSize: '0.9rem', marginTop: '0.25rem', margin: 0 }}>
              {user.rol === 'alumno'
                ? 'Monitoreo de rendimiento académico, entregas y estado de cursada'
                : 'Supervisión de cursos asignados, calificaciones y entregas de alumnos'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem' }}>
            {user.rol === 'alumno' ? (
              <Button onClick={() => navigate('/boletin')} icon="bx-receipt">
                Mi Boletín Oficial
              </Button>
            ) : (
              <Button onClick={() => navigate('/clases')} icon="bx-plus">
                Gestionar Clases
              </Button>
            )}
          </div>
        </div>

        {/* ── Fila 1: KPI Cards con Métricas Reales ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
          {/* KPI 1: Promedio General */}
          <div
            style={{
              background: '#0d1222',
              border: '1px solid rgba(151, 71, 255, 0.12)',
              borderRadius: '16px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: '#a9a3c7', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Promedio Ponderado
                </span>
                <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#f3f0ff', marginTop: '0.25rem', fontFamily: 'var(--font-family-display)' }}>
                  {promedioGeneral !== null && promedioGeneral !== undefined ? promedioGeneral.toFixed(1) : 'S/D'}
                </div>
              </div>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: '50px',
                  background: promedioGeneral !== null && promedioGeneral >= 7
                    ? 'rgba(16, 185, 129, 0.15)'
                    : 'rgba(121, 41, 210, 0.15)',
                  color: promedioGeneral !== null && promedioGeneral >= 7 ? '#34d399' : '#c4b5fd',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  fontSize: '0.72rem',
                  fontWeight: 600
                }}
              >
                {promedioGeneral !== null
                  ? (promedioGeneral >= 7 ? 'Regularizado' : 'En Seguimiento')
                  : 'Sin Notas'}
              </span>
            </div>
            <div style={{ fontSize: '0.82rem', color: '#6b6688', marginTop: '0.75rem' }}>
              {promedioGeneral !== null ? 'Calculado sobre evaluaciones oficiales' : 'Pendiente de cierre evaluativo'}
            </div>
          </div>

          {/* KPI 2: Avance de Trabajos / Entregas */}
          <div
            style={{
              background: '#0d1222',
              border: '1px solid rgba(151, 71, 255, 0.12)',
              borderRadius: '16px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: '#a9a3c7', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {user.rol === 'alumno' ? 'Entregas Realizadas' : 'Trabajos Recibidos'}
                </span>
                <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#f3f0ff', marginTop: '0.25rem', fontFamily: 'var(--font-family-display)' }}>
                  {porcentajeAvance}%
                </div>
              </div>
              <span style={{ fontSize: '0.85rem', color: '#a9a3c7' }}>
                {totalEntregados} / {totalTrabajos} TPs
              </span>
            </div>
            {/* Progress Bar */}
            <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', marginTop: '1rem', overflow: 'hidden' }}>
              <div style={{ width: `${porcentajeAvance}%`, height: '100%', background: 'linear-gradient(90deg, #7929d2, #55ddf5)', borderRadius: '3px' }}></div>
            </div>
          </div>

          {/* KPI 3: Clases y Divisiones */}
          <div
            style={{
              background: '#0d1222',
              border: '1px solid rgba(151, 71, 255, 0.12)',
              borderRadius: '16px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: '#a9a3c7', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Divisiones Activas
                </span>
                <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#f3f0ff', marginTop: '0.25rem', fontFamily: 'var(--font-family-display)' }}>
                  {totalClases}
                </div>
              </div>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: '50px',
                  background: 'rgba(85, 221, 245, 0.12)',
                  color: '#55ddf5',
                  border: '1px solid rgba(85, 221, 245, 0.28)',
                  fontSize: '0.72rem',
                  fontWeight: 600
                }}
              >
                Cursado Activo
              </span>
            </div>
            <div style={{ fontSize: '0.82rem', color: '#6b6688', marginTop: '0.75rem' }}>
              Espacios curriculares independientes
            </div>
          </div>

          {/* KPI 4: Tareas Pendientes / Alertas */}
          <div
            style={{
              background: '#0d1222',
              border: '1px solid rgba(151, 71, 255, 0.12)',
              borderRadius: '16px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: '#a9a3c7', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {user.rol === 'alumno' ? 'Pendientes de Entrega' : 'Pendientes de Corrección'}
                </span>
                <div style={{ fontSize: '2.1rem', fontWeight: 800, color: totalPendientes > 0 ? '#fbbf24' : '#34d399', marginTop: '0.25rem', fontFamily: 'var(--font-family-display)' }}>
                  {totalPendientes}
                </div>
              </div>
              <i className="bx bx-time" style={{ fontSize: '1.5rem', color: totalPendientes > 0 ? '#f59e0b' : '#34d399' }}></i>
            </div>
            <div style={{ fontSize: '0.82rem', color: '#a9a3c7', marginTop: '0.75rem' }}>
              {totalPendientes > 0 ? 'Requiere atención' : 'Al día con todas las consignas'}
            </div>
          </div>
        </div>

        {/* ── Fila 2: Main Analytics Overview (Gráfico Dinámico + Donut Ring) ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
          {/* Panel Izquierdo: Evolución Académica Multicurva */}
          <div
            style={{
              background: '#0d1222',
              border: '1px solid rgba(151, 71, 255, 0.12)',
              borderRadius: '18px',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
              gridColumn: 'span 2'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f3f0ff', margin: 0, letterSpacing: '-0.01em' }}>
                  Evolución Académica y Rendimiento
                </h2>
                <span style={{ fontSize: '0.82rem', color: '#a9a3c7' }}>
                  Curva de notas mensuales vs. promedio objetivo institucional
                </span>
              </div>

              {/* Selector de Períodos */}
              <div style={{ display: 'flex', gap: '4px', background: 'rgba(255, 255, 255, 0.04)', padding: '3px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                {(['anual', '1t', '2t', '3t'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      background: selectedPeriod === period ? '#7929d2' : 'transparent',
                      color: selectedPeriod === period ? '#ffffff' : '#a9a3c7',
                      border: 'none',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>

            {/* SVG Interactive Chart o Estado Limpio */}
            {points.length === 0 ? (
              <div style={{
                height: chartHeight,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '12px',
                border: '1px dashed rgba(255, 255, 255, 0.08)',
                padding: '1.5rem',
                textAlign: 'center'
              }}>
                <i className="bx bx-line-chart" style={{ fontSize: '2.5rem', color: '#6b6688', marginBottom: '0.5rem' }}></i>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f3f0ff' }}>
                  Sin registro de calificaciones en el período
                </div>
                <div style={{ fontSize: '0.8rem', color: '#a9a3c7', marginTop: '0.25rem', maxWidth: '420px' }}>
                  La curva de evolución se traza automáticamente a medida que los profesores corrigen entregas y publican calificaciones.
                </div>
              </div>
            ) : (
              <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
                <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none" style={{ minWidth: '500px' }}>
                  <defs>
                    <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7929d2" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#7929d2" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Grid Lines Horizontales */}
                  {[4, 7, 10].map((val) => {
                    const y = chartHeight - paddingY - ((val - minY) / (maxY - minY)) * (chartHeight - paddingY * 2);
                    return (
                      <g key={val}>
                        <line x1={paddingX} y1={y} x2={chartWidth - paddingX} y2={y} stroke="rgba(255, 255, 255, 0.06)" strokeDasharray="3 3" />
                        <text x={paddingX - 10} y={y + 4} fill="#6b6688" fontSize="10" textAnchor="end">
                          {val}
                        </text>
                      </g>
                    );
                  })}

                  {/* Curva de Área y Línea Principal */}
                  {areaPath && <path d={areaPath} fill="url(#curveGradient)" />}
                  {targetPath && <path d={targetPath} stroke="#55ddf5" strokeWidth="1.5" strokeDasharray="4 4" fill="none" opacity="0.6" />}
                  {linePath && <path d={linePath} stroke="#7929d2" strokeWidth="2.5" fill="none" strokeLinecap="round" />}

                  {/* Puntos Interactivos */}
                  {points.map((p, idx) => (
                    <g key={idx}>
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={hoveredPoint === idx ? 6 : 4}
                        fill="#7929d2"
                        stroke="#f3f0ff"
                        strokeWidth={hoveredPoint === idx ? 2 : 1}
                        style={{ cursor: 'pointer', transition: 'r 0.15s ease' }}
                        onMouseEnter={() => setHoveredPoint(idx)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                      <text x={p.x} y={chartHeight - 6} fill="#a9a3c7" fontSize="11" textAnchor="middle">
                        {p.label}
                      </text>
                    </g>
                  ))}
                </svg>

                {/* Tooltip Dinámico */}
                {hoveredPoint !== null && points[hoveredPoint] && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '10px',
                      left: `${Math.min(80, Math.max(10, (hoveredPoint / Math.max(1, points.length - 1)) * 80 + 10))}%`,
                      background: '#16142a',
                      border: '1px solid rgba(151, 71, 255, 0.4)',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      boxShadow: 'var(--shadow-md)',
                      pointerEvents: 'none',
                      fontSize: '0.78rem',
                      color: '#f3f0ff',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>{points[hoveredPoint].label}: Promedio {points[hoveredPoint].valor.toFixed(1)}</div>
                    <div style={{ color: '#55ddf5', fontSize: '0.72rem' }}>Meta: {points[hoveredPoint].target.toFixed(1)} · {points[hoveredPoint].cantidad} evaluaciones</div>
                  </div>
                )}
              </div>
            )}

            {/* Leyenda Inferior */}
            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#a9a3c7' }}>
                <span style={{ width: '12px', height: '3px', background: '#7929d2', borderRadius: '2px' }}></span>
                Calificación Lograda
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#a9a3c7' }}>
                <span style={{ width: '12px', height: '3px', background: '#55ddf5', borderRadius: '2px' }}></span>
                Objetivo Institucional (7.0)
              </div>
            </div>
          </div>

          {/* Panel Derecho: Estado de Cumplimiento (Donut) */}
          <div
            style={{
              background: '#0d1222',
              border: '1px solid rgba(151, 71, 255, 0.12)',
              borderRadius: '18px',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f3f0ff', margin: 0, letterSpacing: '-0.01em' }}>
                Estado de Actividades
              </h2>
              <span style={{ fontSize: '0.82rem', color: '#a9a3c7' }}>
                Distribución de entregas y correcciones
              </span>
            </div>

            {/* Donut Chart Visual */}
            <div style={{ position: 'relative', width: '150px', height: '150px', margin: '1.25rem auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="150" height="150" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="rgba(255, 255, 255, 0.06)" strokeWidth="10" />
                {/* Segment Calificados */}
                {totalTrabajos > 0 && (
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="#7929d2"
                    strokeWidth="10"
                    strokeDasharray={`${pctCalificados * 2.38} 238`}
                    transform="rotate(-90 50 50)"
                    strokeLinecap="round"
                  />
                )}
                {/* Segment En Revisión */}
                {totalTrabajos > 0 && (
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="#55ddf5"
                    strokeWidth="10"
                    strokeDasharray={`${pctRevision * 2.38} 238`}
                    strokeDashoffset={`-${pctCalificados * 2.38}`}
                    transform="rotate(-90 50 50)"
                    strokeLinecap="round"
                  />
                )}
              </svg>
              <div style={{ position: 'absolute', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f3f0ff', fontFamily: 'var(--font-family-display)' }}>
                  {totalTrabajos}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#a9a3c7', textTransform: 'uppercase' }}>Total TPs</div>
              </div>
            </div>

            {/* Desglose Donut */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {donutData.map((d, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: d.color }}></span>
                    <span style={{ color: '#c5bde0' }}>{d.label}</span>
                  </div>
                  <span style={{ fontWeight: 600, color: '#f3f0ff' }}>{d.count} ({d.pct}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Fila 3: Mis Clases / Divisiones & Actividad Reciente ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {/* Bloque: Mis Clases */}
          <div
            style={{
              background: '#0d1222',
              border: '1px solid rgba(151, 71, 255, 0.12)',
              borderRadius: '18px',
              padding: '1.5rem',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f3f0ff', margin: 0, letterSpacing: '-0.01em' }}>
                  Mis Materias y Divisiones
                </h2>
                <span style={{ fontSize: '0.82rem', color: '#a9a3c7' }}>
                  Espacios curriculares en curso
                </span>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate(user.rol === 'alumno' ? '/alumno' : '/clases')}
                icon="bx-right-arrow-alt"
              >
                Ver Todas
              </Button>
            </div>

            {loading ? (
              <LoadingSkeleton type="list" count={3} />
            ) : clases.length === 0 ? (
              <EmptyState
                icon="bx-book-open"
                title="Sin materias asignadas"
                description={user.rol === 'alumno' ? 'Tu división aún no tiene materias asignadas por secretaría.' : 'No tenés cursos asignados.'}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {clases.slice(0, 4).map((clase, idx) => (
                  <div
                    key={idx}
                    onClick={() => navigate(user.rol === 'alumno' ? `/alumno/gestion/${clase.id}` : `/gestionClase/${clase.id}`)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem 1rem',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(151, 71, 255, 0.35)';
                      e.currentTarget.style.background = 'rgba(121, 41, 210, 0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          background: 'rgba(121, 41, 210, 0.18)',
                          color: '#B99AFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.2rem'
                        }}
                      >
                        <i className="bx bx-book"></i>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#f3f0ff' }}>
                          {clase.materia || clase.nombre}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#6b6688' }}>
                          {clase.seccion || 'División Regular'} · {clase.aula || 'Aula Técnica'}
                        </div>
                      </div>
                    </div>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        color: '#c5bde0',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        fontFamily: 'var(--font-family-mono)'
                      }}
                    >
                      {clase.codigo || 'MAT-31'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bloque: Notificaciones y Actividad Reciente */}
          <div
            style={{
              background: '#0d1222',
              border: '1px solid rgba(151, 71, 255, 0.12)',
              borderRadius: '18px',
              padding: '1.5rem',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f3f0ff', margin: 0, letterSpacing: '-0.01em' }}>
                  Avisos y Novedades
                </h2>
                <span style={{ fontSize: '0.82rem', color: '#a9a3c7' }}>
                  Notificaciones académicas del curso
                </span>
              </div>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: '50px',
                  background: 'rgba(121, 41, 210, 0.18)',
                  color: '#B99AFF',
                  fontSize: '0.72rem',
                  fontWeight: 600
                }}
              >
                {notificaciones.length} avisos
              </span>
            </div>

            {notificaciones.length === 0 ? (
              <EmptyState
                icon="bx-bell-off"
                title="Sin avisos recientes"
                description="No tienes notificaciones pendientes en este momento."
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {notificaciones.slice(0, 4).map((notif, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      padding: '0.85rem 1rem',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.06)'
                    }}
                  >
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'rgba(85, 221, 245, 0.12)',
                        color: '#55ddf5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.1rem',
                        flexShrink: 0,
                        marginTop: '2px'
                      }}
                    >
                      <i className="bx bx-bell"></i>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#f3f0ff' }}>
                        {notif.titulo || notif.mensaje || 'Nueva publicación institucional'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6b6688', marginTop: '2px' }}>
                        {notif.fecha_creacion ? new Date(notif.fecha_creacion).toLocaleDateString('es-AR') : 'Reciente'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
