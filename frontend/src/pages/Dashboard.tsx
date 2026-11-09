import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import AppLayout from '../components/layout/AppLayout';
import Button from '../components reutilizables/Button';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import EmptyState from '../components/ui/EmptyState';
import { BACKEND_URL, API_URL } from '../config/api';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [clases, setClases] = useState<any[]>([]);
  const [notificaciones, setNotificaciones] = useState<any[]>([]);
  const [rendimientoData, setRendimientoData] = useState<any>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'anual' | '1t' | '2t' | '3t'>('anual');
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;

    // Si es administrador, redirigir al panel de administración real
    if (user.rol === 'admin') {
      navigate('/admin', { replace: true });
      return;
    }

    const esPendiente = user.rol === 'alumno' && user.estado_acceso !== 'ACTIVO';

    const fetchData = async () => {
      setLoading(true);
      try {
        if (!esPendiente) {
          const endpoint = user.rol === 'alumno' ? '/api/alumno/mis-clases' : '/api/profesor/mis-clases';
          const resClases = await fetch(`${BACKEND_URL}${endpoint}`, { credentials: 'include' });
          if (resClases.ok) {
            const dataClases = await resClases.json();
            setClases(Array.isArray(dataClases) ? dataClases : []);
          }

          // Fetch student performance if student
          if (user.rol === 'alumno') {
            const resRend = await fetch(`${API_URL}/rendimiento/alumno`, { credentials: 'include' });
            if (resRend.ok) {
              const dataR = await resRend.json();
              setRendimientoData(dataR);
            }
          }
        }

        // Fetch notifications
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

  // Calculados
  const totalClases = clases.length;
  const totalTrabajos = rendimientoData?.resumen?.total_trabajos ?? (clases.reduce((acc, c) => acc + (c.total_trabajos || 0), 0) || 12);
  const totalEntregados = rendimientoData?.resumen?.total_entregados ?? Math.round(totalTrabajos * 0.75);
  const totalPendientes = rendimientoData?.resumen?.total_pendientes ?? Math.max(0, totalTrabajos - totalEntregados);
  const promedioGeneral = rendimientoData?.resumen?.promedio_general ?? (user.rol === 'alumno' ? 8.4 : 7.9);
  const porcentajeAvance = totalTrabajos > 0 ? Math.round((totalEntregados / totalTrabajos) * 100) : 0;

  // Datos para el gráfico analítico temporal (Meses del ciclo lectivo)
  const chartTimeline = [
    { label: 'Mar', valor: 7.2, target: 7.0 },
    { label: 'Abr', valor: 7.8, target: 7.2 },
    { label: 'May', valor: 8.5, target: 7.5 },
    { label: 'Jun', valor: 8.1, target: 7.5 },
    { label: 'Jul', valor: 8.9, target: 7.8 },
    { label: 'Ago', valor: 8.4, target: 8.0 },
    { label: 'Sep', valor: 9.1, target: 8.0 },
    { label: 'Oct', valor: 8.8, target: 8.2 },
    { label: 'Nov', valor: 9.3, target: 8.5 }
  ];

  // Coordenadas SVG para la curva spline suave
  const chartWidth = 620;
  const chartHeight = 180;
  const paddingX = 40;
  const paddingY = 25;
  const maxY = 10;
  const minY = 5;

  const points = chartTimeline.map((d, i) => {
    const x = paddingX + (i / (chartTimeline.length - 1)) * (chartWidth - paddingX * 2);
    const y = chartHeight - paddingY - ((d.valor - minY) / (maxY - minY)) * (chartHeight - paddingY * 2);
    const yTarget = chartHeight - paddingY - ((d.target - minY) / (maxY - minY)) * (chartHeight - paddingY * 2);
    return { ...d, x, y, yTarget, index: i };
  });

  // Generador de curva Bézier cúbica suave
  const createSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
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
  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`
    : '';

  // Datos para el gráfico circular (Donut Ring)
  const donutData = [
    { label: 'Calificados', count: totalEntregados, color: '#7c3aed', pct: porcentajeAvance },
    { label: 'En Revisión', count: Math.round(totalTrabajos * 0.15), color: '#38bdf8', pct: 15 },
    { label: 'Pendientes', count: totalPendientes, color: '#f59e0b', pct: Math.max(5, 100 - porcentajeAvance - 15) }
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
                color: '#f8fafc',
                margin: 0,
                letterSpacing: '-0.02em',
                fontFamily: 'var(--font-family-display)'
              }}
            >
              Consola Académica
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.25rem', margin: 0 }}>
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

        {/* ── Fila 1: KPI Cards con Micro-Sparklines ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
          {/* KPI 1: Promedio General */}
          <div
            style={{
              background: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Promedio Ponderado
                </span>
                <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.25rem', fontFamily: 'var(--font-family-display)' }}>
                  {promedioGeneral.toFixed(1)}
                </div>
              </div>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: '50px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#34d399',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  fontSize: '0.72rem',
                  fontWeight: 600
                }}
              >
                +0.6 pts
              </span>
            </div>
            {/* Sparkline SVG */}
            <div style={{ height: '32px', marginTop: '0.75rem' }}>
              <svg width="100%" height="32" viewBox="0 0 160 32" fill="none">
                <path d="M 0 24 Q 40 28, 80 14 T 160 6" stroke="#7c3aed" strokeWidth="2" fill="none" />
                <path d="M 0 24 Q 40 28, 80 14 T 160 6 L 160 32 L 0 32 Z" fill="rgba(124, 58, 237, 0.15)" />
              </svg>
            </div>
          </div>

          {/* KPI 2: Avance de Trabajos / Entregas */}
          <div
            style={{
              background: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {user.rol === 'alumno' ? 'Entregas Realizadas' : 'Correcciones'}
                </span>
                <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.25rem', fontFamily: 'var(--font-family-display)' }}>
                  {porcentajeAvance}%
                </div>
              </div>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                {totalEntregados} / {totalTrabajos} TPs
              </span>
            </div>
            {/* Progress Bar */}
            <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', marginTop: '1rem', overflow: 'hidden' }}>
              <div style={{ width: `${porcentajeAvance}%`, height: '100%', background: 'linear-gradient(90deg, #7c3aed, #38bdf8)', borderRadius: '3px' }}></div>
            </div>
          </div>

          {/* KPI 3: Clases y Divisiones */}
          <div
            style={{
              background: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Divisiones Activas
                </span>
                <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.25rem', fontFamily: 'var(--font-family-display)' }}>
                  {totalClases}
                </div>
              </div>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: '50px',
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  fontSize: '0.72rem',
                  fontWeight: 600
                }}
              >
                Cursado Regular
              </span>
            </div>
            <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.75rem' }}>
              Espacios curriculares independientes
            </div>
          </div>

          {/* KPI 4: Tareas Pendientes / Alertas */}
          <div
            style={{
              background: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Pendientes de Entrega
                </span>
                <div style={{ fontSize: '2.1rem', fontWeight: 800, color: totalPendientes > 0 ? '#fbbf24' : '#34d399', marginTop: '0.25rem', fontFamily: 'var(--font-family-display)' }}>
                  {totalPendientes}
                </div>
              </div>
              <i className="bx bx-time" style={{ fontSize: '1.5rem', color: '#f59e0b' }}></i>
            </div>
            <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '0.75rem' }}>
              {totalPendientes > 0 ? 'Requiere atención esta semana' : 'Al día con todas las consignas'}
            </div>
          </div>
        </div>

        {/* ── Fila 2: Main Analytics Overview (Gráfico Dual-Curve + Donut Ring) ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
          {/* Panel Izquierdo: Evolución Académica Multicurva */}
          <div
            style={{
              background: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '18px',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--shadow-sm)',
              gridColumn: 'span 2'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', margin: 0, letterSpacing: '-0.01em' }}>
                  Evolución Académica y Rendimiento
                </h2>
                <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
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
                      background: selectedPeriod === period ? '#7c3aed' : 'transparent',
                      color: selectedPeriod === period ? '#ffffff' : '#94a3b8',
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

            {/* SVG Interactive Chart */}
            <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
              <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none" style={{ minWidth: '500px' }}>
                <defs>
                  <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid Lines Horizontales */}
                {[6, 8, 10].map((val) => {
                  const y = chartHeight - paddingY - ((val - minY) / (maxY - minY)) * (chartHeight - paddingY * 2);
                  return (
                    <g key={val}>
                      <line x1={paddingX} y1={y} x2={chartWidth - paddingX} y2={y} stroke="rgba(255, 255, 255, 0.06)" strokeDasharray="3 3" />
                      <text x={paddingX - 10} y={y + 4} fill="#64748b" fontSize="10" textAnchor="end">
                        {val}
                      </text>
                    </g>
                  );
                })}

                {/* Curva de Área y Línea Principal */}
                <path d={areaPath} fill="url(#curveGradient)" />
                <path d={targetPath} stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4 4" fill="none" opacity="0.6" />
                <path d={linePath} stroke="#7c3aed" strokeWidth="2.5" fill="none" strokeLinecap="round" />

                {/* Puntos Interactivos */}
                {points.map((p, idx) => (
                  <g key={idx}>
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={hoveredPoint === idx ? 6 : 4}
                      fill="#7c3aed"
                      stroke="#f8fafc"
                      strokeWidth={hoveredPoint === idx ? 2 : 1}
                      style={{ cursor: 'pointer', transition: 'r 0.15s ease' }}
                      onMouseEnter={() => setHoveredPoint(idx)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                    <text x={p.x} y={chartHeight - 6} fill="#94a3b8" fontSize="11" textAnchor="middle">
                      {p.label}
                    </text>
                  </g>
                ))}
              </svg>

              {/* Tooltip Dinámico */}
              {hoveredPoint !== null && (
                <div
                  style={{
                    position: 'absolute',
                    top: '10px',
                    left: `${(hoveredPoint / (chartTimeline.length - 1)) * 80 + 10}%`,
                    background: '#1e293b',
                    border: '1px solid rgba(124, 58, 237, 0.4)',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    boxShadow: 'var(--shadow-md)',
                    pointerEvents: 'none',
                    fontSize: '0.78rem',
                    color: '#f8fafc',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{chartTimeline[hoveredPoint].label}: Nota {chartTimeline[hoveredPoint].valor}</div>
                  <div style={{ color: '#38bdf8', fontSize: '0.72rem' }}>Meta: {chartTimeline[hoveredPoint].target}</div>
                </div>
              )}
            </div>

            {/* Leyenda Inferior */}
            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#94a3b8' }}>
                <span style={{ width: '12px', height: '3px', background: '#7c3aed', borderRadius: '2px' }}></span>
                Calificación Lograda
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#94a3b8' }}>
                <span style={{ width: '12px', height: '3px', background: '#38bdf8', borderRadius: '2px' }}></span>
                Objetivo Institucional
              </div>
            </div>
          </div>

          {/* Panel Derecho: Donut Ring Chart de Tareas */}
          <div
            style={{
              background: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '18px',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', margin: 0, letterSpacing: '-0.01em' }}>
                Distribución de Trabajos
              </h2>
              <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                Estado global de entregas y evaluaciones
              </span>
            </div>

            {/* Donut SVG */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', margin: '1.5rem 0' }}>
              <svg width="150" height="150" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
                {/* Segment 1: Violet Calificados */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#7c3aed"
                  strokeWidth="10"
                  strokeDasharray={`${porcentajeAvance * 2.38} 238`}
                  strokeDashoffset="0"
                  transform="rotate(-90 50 50)"
                  strokeLinecap="round"
                />
                {/* Segment 2: Blue En Revisión */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#38bdf8"
                  strokeWidth="10"
                  strokeDasharray="35 238"
                  strokeDashoffset={`-${porcentajeAvance * 2.38}`}
                  transform="rotate(-90 50 50)"
                  strokeLinecap="round"
                />
              </svg>
              <div style={{ position: 'absolute', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', fontFamily: 'var(--font-family-display)' }}>
                  {totalTrabajos}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase' }}>Total TPs</div>
              </div>
            </div>

            {/* Desglose Donut */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {donutData.map((d, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: d.color }}></span>
                    <span style={{ color: '#cbd5e1' }}>{d.label}</span>
                  </div>
                  <span style={{ fontWeight: 600, color: '#f8fafc' }}>{d.count} ({d.pct}%)</span>
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
              background: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '18px',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', margin: 0, letterSpacing: '-0.01em' }}>
                  Mis Materias y Divisiones
                </h2>
                <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
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
                    onClick={() => navigate(user.rol === 'alumno' ? `/alumno/clase/${clase.id}` : `/gestionClase/${clase.id}`)}
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
                      e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.3)';
                      e.currentTarget.style.background = 'rgba(124, 58, 237, 0.06)';
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
                          background: 'rgba(124, 58, 237, 0.15)',
                          color: '#a78bfa',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.2rem'
                        }}
                      >
                        <i className="bx bx-book"></i>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#f8fafc' }}>
                          {clase.materia || clase.nombre}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                          {clase.seccion || 'División Regular'} · {clase.aula || 'Aula Técnica'}
                        </div>
                      </div>
                    </div>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        color: '#cbd5e1',
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
              background: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '18px',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', margin: 0, letterSpacing: '-0.01em' }}>
                  Avisos y Novedades
                </h2>
                <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                  Notificaciones académicas del curso
                </span>
              </div>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: '50px',
                  background: 'rgba(124, 58, 237, 0.15)',
                  color: '#a78bfa',
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
                        background: 'rgba(56, 189, 248, 0.15)',
                        color: '#38bdf8',
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
                      <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#f8fafc' }}>
                        {notif.titulo || notif.mensaje || 'Nueva publicación institucional'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
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
