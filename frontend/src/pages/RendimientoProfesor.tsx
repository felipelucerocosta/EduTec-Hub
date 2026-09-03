import React, { useState, useEffect } from 'react';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import EmptyState from '../components/ui/EmptyState';
import { useToast } from '../contexts/ToastContext';

const API_URL = 'http://localhost:3001/api';

interface RendimientoProfesorProps {
  claseId: string | number;
}

interface ChartPoint {
  xLabel: string; // "Trabajo 1", "Trabajo 2", etc.
  titulo: string;
  value: number | null;
  aprobados?: number;
  desaprobados?: number;
  pctAprobados?: number;
  pctDesaprobados?: number;
  calificados?: number;
  estadoEntrega?: string;
}

// ─────────────────────────────────────────────────────────────
// Componente de Gráfico de Línea Interactivo SVG (Responsive)
// ─────────────────────────────────────────────────────────────
const LineChart: React.FC<{
  data: ChartPoint[];
  maxY?: number;
  color?: string;
  tooltipType: 'general' | 'alumno';
}> = ({ data, maxY = 10, color = '#38bdf8', tooltipType }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
        No hay datos suficientes para generar el gráfico.
      </div>
    );
  }

  const chartHeight = 220;
  const paddingX = 40;
  const paddingY = 30;
  const viewWidth = 700;

  const validPoints = data.map((d, i) => {
    const x = paddingX + (i / Math.max(1, data.length - 1)) * (viewWidth - paddingX * 2);
    const val = d.value !== null ? Math.min(maxY, Math.max(0, d.value)) : null;
    const y = val !== null
      ? chartHeight - paddingY - (val / maxY) * (chartHeight - paddingY * 2)
      : null;
    return { ...d, x, y, originalVal: d.value, index: i };
  });

  // Generar path para la polílinea
  const pathD = validPoints
    .filter(p => p.y !== null)
    .reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');

  // Area under curve
  const areaD = pathD
    ? `${pathD} L ${validPoints[validPoints.length - 1].x} ${chartHeight - paddingY} L ${validPoints[0].x} ${chartHeight - paddingY} Z`
    : '';

  const hoveredPoint = hoveredIndex !== null ? validPoints[hoveredIndex] : null;

  return (
    <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
      {/* Tooltip flotante */}
      {hoveredPoint && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: `${Math.min(Math.max(10, (hoveredPoint.x / viewWidth) * 100), 75)}%`,
            transform: 'translateX(-50%)',
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            borderRadius: '12px',
            padding: '0.75rem 1rem',
            zIndex: 10,
            pointerEvents: 'none',
            minWidth: '200px',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.85rem' }}>
            {hoveredPoint.xLabel}: {hoveredPoint.titulo}
          </div>
          <div style={{ marginTop: '0.4rem', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            {tooltipType === 'general' ? (
              <>
                <div style={{ color: '#38bdf8', fontWeight: 700 }}>
                  Promedio del curso: {hoveredPoint.originalVal !== null ? `${hoveredPoint.originalVal} / 10` : 'Sin nota'}
                </div>
                <div style={{ color: '#34d399' }}>
                  Aprobados (≥ 6): {hoveredPoint.pctAprobados}% ({hoveredPoint.aprobados || 0})
                </div>
                <div style={{ color: '#f43f5e' }}>
                  Desaprobados (&lt; 6): {hoveredPoint.pctDesaprobados}% ({hoveredPoint.desaprobados || 0})
                </div>
              </>
            ) : (
              <>
                <div style={{ color: '#38bdf8', fontWeight: 700 }}>
                  Nota obtenida: {hoveredPoint.originalVal !== null ? `${hoveredPoint.originalVal} / 10` : 'Sin calificar'}
                </div>
                <div style={{ color: '#94a3b8', textTransform: 'capitalize' }}>
                  Estado: {hoveredPoint.estadoEntrega || 'Pendiente'}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <svg
        viewBox={`0 0 ${viewWidth} ${chartHeight}`}
        style={{ width: '100%', height: 'auto', minHeight: '220px' }}
      >
        <defs>
          <linearGradient id={`grad-${tooltipType}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Ejes y líneas de fondo */}
        {[0, 2.5, 5, 7.5, 10].map(v => {
          const y = chartHeight - paddingY - (v / maxY) * (chartHeight - paddingY * 2);
          return (
            <g key={v}>
              <line
                x1={paddingX}
                y1={y}
                x2={viewWidth - paddingX}
                y2={y}
                stroke="rgba(255, 255, 255, 0.07)"
                strokeDasharray="4 4"
              />
              <text x={paddingX - 10} y={y + 4} fill="#64748b" fontSize="10" textAnchor="end">
                {v}
              </text>
            </g>
          );
        })}

        {/* Área rellena */}
        {areaD && <path d={areaD} fill={`url(#grad-${tooltipType})`} />}

        {/* Polílinea */}
        {pathD && (
          <path
            d={pathD}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Puntos y Etiquetas X */}
        {validPoints.map((p, i) => {
          if (p.y === null) return null;
          const isHovered = hoveredIndex === i;
          return (
            <g key={i}>
              {/* Punto circular interactivo */}
              <circle
                cx={p.x}
                cy={p.y}
                r={isHovered ? 7 : 5}
                fill={isHovered ? '#fff' : color}
                stroke={color}
                strokeWidth={isHovered ? 3 : 2}
                style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
              {/* Etiqueta Eje X (Trabajo 1, Trabajo 2...) */}
              <text
                x={p.x}
                y={chartHeight - 8}
                fill={isHovered ? '#f8fafc' : '#94a3b8'}
                fontSize="11"
                fontWeight={isHovered ? '700' : '500'}
                textAnchor="middle"
              >
                {p.xLabel}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

const RendimientoProfesor: React.FC<RendimientoProfesorProps> = ({ claseId }) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'general' | 'alumno'>('general');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  // Estado para Pestaña "POR ALUMNO"
  const [selectedAlumnoId, setSelectedAlumnoId] = useState<number | string | null>(null);
  const [alumnoDetail, setAlumnoDetail] = useState<any>(null);
  const [loadingAlumno, setLoadingAlumno] = useState(false);

  useEffect(() => {
    if (!claseId) return;

    const fetchRendimientoClase = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/rendimiento/clase/${claseId}`, { credentials: 'include' });
        if (res.ok) {
          const resData = await res.json();
          setData(resData);
          if (resData.alumnos && resData.alumnos.length > 0) {
            setSelectedAlumnoId(resData.alumnos[0].id);
          }
        } else {
          showToast('Error al cargar rendimiento de la clase', 'error');
        }
      } catch (err) {
        console.error('Error:', err);
        showToast('Error de conexión con el servidor', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchRendimientoClase();
  }, [claseId]);

  // Cargar detalle del alumno seleccionado
  useEffect(() => {
    if (!selectedAlumnoId || !claseId || activeTab !== 'alumno') return;

    const fetchAlumnoDetail = async () => {
      setLoadingAlumno(true);
      try {
        const res = await fetch(`${API_URL}/rendimiento/alumno/${selectedAlumnoId}/clase/${claseId}`, { credentials: 'include' });
        if (res.ok) {
          const detailData = await res.json();
          setAlumnoDetail(detailData);
        }
      } catch (err) {
        console.error('Error cargando detalle del alumno:', err);
      } finally {
        setLoadingAlumno(false);
      }
    };

    fetchAlumnoDetail();
  }, [selectedAlumnoId, claseId, activeTab]);

  if (loading) return <LoadingSkeleton />;

  if (!data) {
    return <EmptyState title="Sin datos" description="No fue posible cargar las estadísticas del curso." icon="bx-bar-chart-alt-2" />;
  }

  // Puntos para Gráfico Pestaña "GENERAL"
  const generalChartData: ChartPoint[] = (data.trabajos_resumen || []).map((t: any) => ({
    xLabel: t.label,
    titulo: t.titulo,
    value: t.promedio,
    aprobados: t.aprobados,
    desaprobados: t.desaprobados,
    pctAprobados: t.pct_aprobados,
    pctDesaprobados: t.pct_desaprobados,
    calificados: t.calificados,
  }));

  // Puntos para Gráfico Pestaña "POR ALUMNO"
  const alumnoChartData: ChartPoint[] = (alumnoDetail?.trabajos || []).map((t: any) => ({
    xLabel: t.label,
    titulo: t.titulo,
    value: t.calificacion,
    estadoEntrega: t.estado_entrega,
  }));

  const exportToExcel = () => {
    if (!data) return;
    const alumnosRows = (data.alumnos || []).map((a: any) => ({
      Alumno: a.nombre,
      Correo: a.correo,
      Promedio: a.promedio !== null ? a.promedio : 'Sin nota',
      Porcentaje_Entregas: `${a.porcentaje_entregas}%`,
      Entregados: `${a.entregados}/${data.total_trabajos}`,
      Estado: a.estado_label || 'Regular'
    }));

    // CSV with UTF-8 BOM
    const headers = ['Alumno', 'Correo', 'Promedio', '% Entregas', 'Entregas', 'Estado'];
    const csvContent = '\uFEFF' + [
      headers.join(';'),
      ...alumnosRows.map((r: any) => `"${r.Alumno}";"${r.Correo}";"${r.Promedio}";"${r.Porcentaje_Entregas}";"${r.Entregados}";"${r.Estado}"`)
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Rendimiento_Clase_${claseId}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Planilla Excel exportada correctamente', 'success');
  };

  const exportToPDF = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Selector de Pestañas (GENERAL / POR ALUMNO) + Botones de Exportación */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('general')}
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: '12px',
              background: activeTab === 'general' ? 'linear-gradient(135deg, #7c3aed, #38bdf8)' : 'rgba(30, 41, 59, 0.6)',
              color: '#fff',
              border: activeTab === 'general' ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease'
            }}
          >
            <i className="bx bx-line-chart"></i> 1. GENERAL (Curso Completo)
          </button>

          <button
            onClick={() => setActiveTab('alumno')}
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: '12px',
              background: activeTab === 'alumno' ? 'linear-gradient(135deg, #7c3aed, #38bdf8)' : 'rgba(30, 41, 59, 0.6)',
              color: '#fff',
              border: activeTab === 'alumno' ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease'
            }}
          >
            <i className="bx bx-user"></i> 2. POR ALUMNO (Individual)
          </button>
        </div>

        {/* Botones Exportar */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={exportToExcel}
            style={{
              padding: '0.55rem 1rem',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              color: '#34d399',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.15s ease'
            }}
            title="Descargar datos del rendimiento en formato Excel/CSV"
          >
            <i className="bx bx-spreadsheet"></i> Exportar Excel
          </button>

          <button
            onClick={exportToPDF}
            style={{
              padding: '0.55rem 1rem',
              borderRadius: '10px',
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              color: '#38bdf8',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.15s ease'
            }}
            title="Imprimir o guardar reporte en PDF"
          >
            <i className="bx bx-printer"></i> Exportar PDF
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* PESTAÑA 1: GENERAL (CURSO COMPLETO)                           */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'general' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Contenedor Principal del Gráfico Único General */}
          <div style={{ background: 'rgba(15, 23, 42, 0.7)', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <i className="bx bx-trending-up" style={{ color: '#38bdf8' }}></i> Evolución del Rendimiento Promedio del Curso
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
                  Visualiza cómo sube o baja el promedio del grupo en cada trabajo práctico (Pasa el mouse sobre un punto para ver detalles)
                </p>
              </div>
            </div>

            <LineChart data={generalChartData} maxY={10} color="#38bdf8" tooltipType="general" />
          </div>

          {/* KPI Cards Destacadas de la Pestaña General */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            
            {/* Promedio General */}
            <div style={{ background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(124, 58, 237, 0.1))', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '16px', padding: '1.25rem' }}>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Promedio General del Curso</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.25rem' }}>
                {data.promedio_general !== null ? `${data.promedio_general} / 10` : '—'}
              </div>
            </div>

            {/* % Aprobación General */}
            <div style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(56, 189, 248, 0.1))', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '16px', padding: '1.25rem' }}>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Porcentaje de Aprobación</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#34d399', marginTop: '0.25rem' }}>
                {data.pct_aprobacion_general}%
              </div>
            </div>

            {/* Mejor Trabajo */}
            <div style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(56, 189, 248, 0.08))', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '16px', padding: '1.25rem' }}>
              <div style={{ fontSize: '0.85rem', color: '#34d399', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <i className="bx bx-trophy"></i> Mejor Rendimiento
              </div>
              <div style={{ fontWeight: 700, color: '#f8fafc', marginTop: '0.4rem', fontSize: '0.95rem' }}>
                {data.trabajo_mejor ? `${data.trabajo_mejor.label}: ${data.trabajo_mejor.titulo}` : 'Sin datos'}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#34d399', fontWeight: 700, marginTop: '0.2rem' }}>
                {data.trabajo_mejor ? `Promedio: ${data.trabajo_mejor.promedio}` : ''}
              </div>
            </div>

            {/* Peor Trabajo */}
            <div style={{ background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.15), rgba(245, 158, 11, 0.08))', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '16px', padding: '1.25rem' }}>
              <div style={{ fontSize: '0.85rem', color: '#fb7185', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <i className="bx bx-error-circle"></i> Peor Rendimiento
              </div>
              <div style={{ fontWeight: 700, color: '#f8fafc', marginTop: '0.4rem', fontSize: '0.95rem' }}>
                {data.trabajo_peor ? `${data.trabajo_peor.label}: ${data.trabajo_peor.titulo}` : 'Sin datos'}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#fb7185', fontWeight: 700, marginTop: '0.2rem' }}>
                {data.trabajo_peor ? `Promedio: ${data.trabajo_peor.promedio}` : ''}
              </div>
            </div>

          </div>

          {/* Dificultades Detectadas en el Curso */}
          {data.trabajos_dificultad && data.trabajos_dificultad.length > 0 && (
            <div style={{ background: 'rgba(244, 63, 94, 0.08)', borderRadius: '16px', border: '1px solid rgba(244, 63, 94, 0.25)', padding: '1.25rem' }}>
              <h4 style={{ margin: 0, color: '#fb7185', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <i className="bx bx-alert-triangle"></i> Trabajos con mayores dificultades detectadas en el curso:
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
                {data.trabajos_dificultad.map((t: any) => (
                  <div key={t.id} style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.75rem 1rem', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ color: '#f8fafc', fontWeight: 600, fontSize: '0.85rem' }}>
                      {t.label}: {t.titulo}
                    </span>
                    <span style={{ color: '#fb7185', fontWeight: 700, fontSize: '0.85rem' }}>
                      Promedio: {t.promedio} | Desaprobados: {t.pct_desaprobados}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* PESTAÑA 2: POR ALUMNO (EVOLUCIÓN INDIVIDUAL)                   */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'alumno' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Selector / Dropdown de Alumno */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(15, 23, 42, 0.7)', padding: '1.25rem', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)', flexWrap: 'wrap' }}>
            <label style={{ color: '#f8fafc', fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="bx bx-user-check" style={{ color: '#38bdf8' }}></i> Seleccionar Alumno del curso:
            </label>
            <select
              value={selectedAlumnoId || ''}
              onChange={(e) => setSelectedAlumnoId(Number(e.target.value))}
              style={{
                flex: 1,
                minWidth: '240px',
                padding: '0.65rem 1rem',
                borderRadius: '12px',
                background: 'rgba(30, 41, 59, 0.9)',
                color: '#f8fafc',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                fontSize: '0.95rem',
                fontWeight: 600
              }}
            >
              {data.alumnos.map((alum: any) => (
                <option key={alum.id} value={alum.id}>
                  {alum.nombre} ({alum.correo}) — Promedio: {alum.promedio !== null ? alum.promedio : '—'}
                </option>
              ))}
            </select>
          </div>

          {loadingAlumno ? (
            <LoadingSkeleton />
          ) : alumnoDetail ? (
            <>
              {/* Gráfico Único de Evolución Individual del Alumno */}
              <div style={{ background: 'rgba(15, 23, 42, 0.7)', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '1.5rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <i className="bx bx-trending-up" style={{ color: '#10b981' }}></i> Evolución de Notas de {alumnoDetail.alumno.nombre_completo}
                  </h3>
                  <p style={{ margin: '0.2rem 0 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
                    Visualiza si el estudiante está mejorando, manteniendo o empeorando su rendimiento a lo largo de los trabajos
                  </p>
                </div>

                <LineChart data={alumnoChartData} maxY={10} color="#10b981" tooltipType="alumno" />
              </div>

              {/* Indicadores Destacados del Alumno Seleccionado */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                
                {/* Promedio General Alumno */}
                <div style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(56, 189, 248, 0.1))', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '16px', padding: '1.25rem' }}>
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Promedio General del Alumno</div>
                  <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#34d399', marginTop: '0.25rem' }}>
                    {alumnoDetail.promedio !== null ? `${alumnoDetail.promedio} / 10` : '—'}
                  </div>
                </div>

                {/* Mejor Trabajo */}
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '16px', padding: '1.25rem' }}>
                  <div style={{ fontSize: '0.85rem', color: '#34d399', fontWeight: 700 }}>Mejor Trabajo</div>
                  <div style={{ fontWeight: 700, color: '#f8fafc', marginTop: '0.4rem', fontSize: '0.9rem' }}>
                    {alumnoDetail.mejor_trabajo ? `${alumnoDetail.mejor_trabajo.label}: ${alumnoDetail.mejor_trabajo.titulo}` : 'Sin nota'}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#34d399', fontWeight: 700, marginTop: '0.2rem' }}>
                    {alumnoDetail.mejor_trabajo ? `Nota: ${alumnoDetail.mejor_trabajo.calificacion}` : ''}
                  </div>
                </div>

                {/* Peor Trabajo */}
                <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.25)', borderRadius: '16px', padding: '1.25rem' }}>
                  <div style={{ fontSize: '0.85rem', color: '#fb7185', fontWeight: 700 }}>Peor Trabajo</div>
                  <div style={{ fontWeight: 700, color: '#f8fafc', marginTop: '0.4rem', fontSize: '0.9rem' }}>
                    {alumnoDetail.peor_trabajo ? `${alumnoDetail.peor_trabajo.label}: ${alumnoDetail.peor_trabajo.titulo}` : 'Sin nota'}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#fb7185', fontWeight: 700, marginTop: '0.2rem' }}>
                    {alumnoDetail.peor_trabajo ? `Nota: ${alumnoDetail.peor_trabajo.calificacion}` : ''}
                  </div>
                </div>

                {/* Trabajos Aprobados */}
                <div style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '16px', padding: '1.25rem' }}>
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Trabajos Aprobados (≥6)</div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.25rem' }}>
                    {alumnoDetail.trabajos_aprobados}
                  </div>
                </div>

                {/* Trabajos Desaprobados */}
                <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '16px', padding: '1.25rem' }}>
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Trabajos Desaprobados (&lt;6)</div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fbbf24', marginTop: '0.25rem' }}>
                    {alumnoDetail.trabajos_desaprobados}
                  </div>
                </div>

              </div>

            </>
          ) : null}

        </div>
      )}

      {/* Tabla General de Alumnos Inscriptos */}
      <div style={{ background: 'rgba(15, 23, 42, 0.7)', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.08)', overflow: 'hidden', marginTop: '1rem' }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)', fontWeight: 700, color: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Alumnos del Curso ({data.alumnos.length})</span>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Total Trabajos: {data.total_trabajos}</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8', fontSize: '0.85rem' }}>Alumno</th>
                <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8', fontSize: '0.85rem' }}>Promedio</th>
                <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8', fontSize: '0.85rem' }}>% Entregas</th>
                <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8', fontSize: '0.85rem' }}>Estado</th>
                <th style={{ padding: '0.85rem 1.25rem', color: '#94a3b8', fontSize: '0.85rem' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.alumnos.map((alum: any) => (
                <tr
                  key={alum.id}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                    background: selectedAlumnoId === alum.id && activeTab === 'alumno' ? 'rgba(56, 189, 248, 0.1)' : 'transparent'
                  }}
                >
                  <td style={{ padding: '0.85rem 1.25rem' }}>
                    <div style={{ fontWeight: 600, color: '#f8fafc' }}>{alum.nombre}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{alum.correo}</div>
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem', fontWeight: 700, color: alum.promedio >= 7 ? '#34d399' : alum.promedio !== null ? '#f59e0b' : '#94a3b8' }}>
                    {alum.promedio !== null ? `${alum.promedio} / 10` : '—'}
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem', color: '#cbd5e1' }}>
                    {alum.porcentaje_entregas}% ({alum.entregados}/{data.total_trabajos})
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem' }}>
                    <span className={`badge ${
                      alum.estado_label === 'Excelente' || alum.estado_label === 'Muy bueno' ? 'badge-green' :
                      alum.estado_label === 'Bueno' ? 'badge-purple' :
                      alum.estado_label === 'Regular' ? 'badge-amber' : 'badge-red'
                    }`}>
                      {alum.estado_label}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem' }}>
                    <button
                      onClick={() => {
                        setSelectedAlumnoId(alum.id);
                        setActiveTab('alumno');
                      }}
                      style={{
                        padding: '0.4rem 0.8rem',
                        borderRadius: '8px',
                        background: 'rgba(56, 189, 248, 0.15)',
                        color: '#38bdf8',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Ver Evolución
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default RendimientoProfesor;
