import React, { useState } from 'react';
import Button from '../../components reutilizables/Button';

const EcuacionesSimulator: React.FC<{ onSaveSession?: (data: any) => void }> = ({ onSaveSession }) => {
  // Eq 1: a1*x + b1*y = c1
  const [a1, setA1] = useState<number>(1);
  const [b1, setB1] = useState<number>(1);
  const [c1, setC1] = useState<number>(5);

  // Eq 2: a2*x + b2*y = c2
  const [a2, setA2] = useState<number>(1);
  const [b2, setB2] = useState<number>(-1);
  const [c2, setC2] = useState<number>(1);

  // Calculate determinant
  const det = a1 * b2 - a2 * b1;
  const detX = c1 * b2 - c2 * b1;
  const detY = a1 * c2 - a2 * c1;

  let estado: 'unica' | 'ninguna' | 'infinitas';
  let intersectX: number | null = null;
  let intersectY: number | null = null;

  if (Math.abs(det) > 0.0001) {
    estado = 'unica';
    intersectX = Math.round((detX / det) * 100) / 100;
    intersectY = Math.round((detY / det) * 100) / 100;
  } else {
    if (Math.abs(detX) < 0.0001 && Math.abs(detY) < 0.0001) {
      estado = 'infinitas';
    } else {
      estado = 'ninguna';
    }
  }

  // SVG Coordinate mapping (range -10 to +10)
  const size = 340;
  const half = size / 2;
  const scale = 15; // 1 unit = 15px

  const toSvgX = (x: number) => half + x * scale;
  const toSvgY = (y: number) => half - y * scale;

  // Helper to get line start and end points for SVG line (from x = -15 to +15)
  const getLinePoints = (a: number, b: number, c: number) => {
    if (Math.abs(b) > 0.0001) {
      // y = (c - a*x) / b
      const xA = -15;
      const yA = (c - a * xA) / b;
      const xB = 15;
      const yB = (c - a * xB) / b;
      return { x1: toSvgX(xA), y1: toSvgY(yA), x2: toSvgX(xB), y2: toSvgY(yB) };
    } else if (Math.abs(a) > 0.0001) {
      // x = c / a
      const xVal = c / a;
      return { x1: toSvgX(xVal), y1: 0, x2: toSvgX(xVal), y2: size };
    }
    return { x1: 0, y1: 0, x2: 0, y2: 0 };
  };

  const line1 = getLinePoints(a1, b1, c1);
  const line2 = getLinePoints(a2, b2, c2);

  const handleFinish = () => {
    if (onSaveSession) {
      onSaveSession({ a1, b1, c1, a2, b2, c2, estado, intersectX, intersectY });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Description Header */}
      <div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 0.35rem' }}>
          Simulador de Sistemas de Ecuaciones Lineales
        </h3>
        <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: 0 }}>
          Modificá los coeficientes para observar el comportamiento gráfico de las rectas y la solución del sistema.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        
        {/* Controls Column */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Eq 1 Control */}
          <div style={{ background: 'rgba(124, 58, 237, 0.08)', border: '1px solid rgba(124, 58, 237, 0.2)', padding: '1rem', borderRadius: '12px' }}>
            <h4 style={{ margin: '0 0 0.75rem', color: '#a78bfa', fontSize: '0.9rem' }}>
              Ecuación 1: ({a1})x + ({b1})y = {c1}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.82rem' }}>
              <label>a₁: {a1} <input type="range" min="-5" max="5" step="1" value={a1} onChange={(e) => setA1(Number(e.target.value))} style={{ width: '100%' }} /></label>
              <label>b₁: {b1} <input type="range" min="-5" max="5" step="1" value={b1} onChange={(e) => setB1(Number(e.target.value))} style={{ width: '100%' }} /></label>
              <label>c₁: {c1} <input type="range" min="-10" max="10" step="1" value={c1} onChange={(e) => setC1(Number(e.target.value))} style={{ width: '100%' }} /></label>
            </div>
          </div>

          {/* Eq 2 Control */}
          <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.2)', padding: '1rem', borderRadius: '12px' }}>
            <h4 style={{ margin: '0 0 0.75rem', color: '#38bdf8', fontSize: '0.9rem' }}>
              Ecuación 2: ({a2})x + ({b2})y = {c2}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.82rem' }}>
              <label>a₂: {a2} <input type="range" min="-5" max="5" step="1" value={a2} onChange={(e) => setA2(Number(e.target.value))} style={{ width: '100%' }} /></label>
              <label>b₂: {b2} <input type="range" min="-5" max="5" step="1" value={b2} onChange={(e) => setB2(Number(e.target.value))} style={{ width: '100%' }} /></label>
              <label>c₂: {c2} <input type="range" min="-10" max="10" step="1" value={c2} onChange={(e) => setC2(Number(e.target.value))} style={{ width: '100%' }} /></label>
            </div>
          </div>

          {/* Result Card */}
          <div style={{ background: 'rgba(255,255,255,0.04)', padding: '1rem', borderRadius: '12px' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Resultado del Sistema:</span>
            {estado === 'unica' && (
              <div>
                <span className="badge badge-green" style={{ marginTop: '0.35rem' }}>Solución Única</span>
                <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#34d399', margin: '0.4rem 0 0' }}>
                  Intersection: X = {intersectX}, Y = {intersectY}
                </p>
              </div>
            )}
            {estado === 'ninguna' && (
              <div>
                <span className="badge badge-rose" style={{ marginTop: '0.35rem' }}>Sin Solución (Paralelas)</span>
                <p style={{ fontSize: '0.88rem', color: '#fb7185', margin: '0.4rem 0 0' }}>
                  Las rectas son paralelas y nunca se cortan.
                </p>
              </div>
            )}
            {estado === 'infinitas' && (
              <div>
                <span className="badge badge-amber" style={{ marginTop: '0.35rem' }}>Infinitas Soluciones (Coincidentes)</span>
                <p style={{ fontSize: '0.88rem', color: '#fbbf24', margin: '0.4rem 0 0' }}>
                  Las rectas son idénticas y se superponen en todos los puntos.
                </p>
              </div>
            )}
          </div>

          {onSaveSession && (
            <Button onClick={handleFinish} icon="bx-check-circle" style={{ width: '100%' }}>
              Registrar Experiencia
            </Button>
          )}

        </div>

        {/* Interactive SVG Plot */}
        <div style={{ background: '#090d16', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ width: '100%', maxWidth: '360px', background: '#0b1120', borderRadius: '12px' }}>
            {/* Gridlines */}
            {[-8, -6, -4, -2, 2, 4, 6, 8].map((g) => (
              <g key={g}>
                <line x1={toSvgX(g)} y1={0} x2={toSvgX(g)} y2={size} stroke="rgba(255,255,255,0.05)" />
                <line x1={0} y1={toSvgY(g)} x2={size} y2={toSvgY(g)} stroke="rgba(255,255,255,0.05)" />
              </g>
            ))}

            {/* X & Y Axes */}
            <line x1={0} y1={half} x2={size} y2={half} stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
            <line x1={half} y1={0} x2={half} y2={size} stroke="rgba(255,255,255,0.3)" strokeWidth="2" />

            {/* Line 1 (Purple) */}
            <line x1={line1.x1} y1={line1.y1} x2={line1.x2} y2={line1.y2} stroke="#a78bfa" strokeWidth="3" />

            {/* Line 2 (Blue) */}
            <line x1={line2.x1} y1={line2.y1} x2={line2.x2} y2={line2.y2} stroke="#38bdf8" strokeWidth="3" />

            {/* Intersection Point */}
            {estado === 'unica' && intersectX !== null && intersectY !== null && (
              <g>
                <circle cx={toSvgX(intersectX)} cy={toSvgY(intersectY)} r="7" fill="#34d399" stroke="#ffffff" strokeWidth="2" />
              </g>
            )}
          </svg>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', fontSize: '0.8rem' }}>
            <span style={{ color: '#a78bfa', fontWeight: 600 }}>── Recta 1</span>
            <span style={{ color: '#38bdf8', fontWeight: 600 }}>── Recta 2</span>
            {estado === 'unica' && <span style={{ color: '#34d399', fontWeight: 600 }}>● Intersección</span>}
          </div>
        </div>

      </div>
    </div>
  );
};

export default EcuacionesSimulator;
