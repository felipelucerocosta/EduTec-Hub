import React, { useState, useRef, useEffect } from 'react';
import Button from '../../components reutilizables/Button';

const FuncionesSimulator: React.FC<{ onSaveSession?: (data: any) => void }> = ({ onSaveSession }) => {
  const [a, setA] = useState<number>(1);
  const [b, setB] = useState<number>(0);
  const [c, setC] = useState<number>(-4);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Calculations for quadratic function f(x) = a*x^2 + b*x + c
  const delta = b * b - 4 * a * c;

  let root1: number | null = null;
  let root2: number | null = null;
  let verticeX: number | null = null;
  let verticeY: number | null = null;

  if (a !== 0) {
    verticeX = Math.round((-b / (2 * a)) * 100) / 100;
    verticeY = Math.round((a * verticeX * verticeX + b * verticeX + c) * 100) / 100;

    if (delta > 0) {
      root1 = Math.round(((-b + Math.sqrt(delta)) / (2 * a)) * 100) / 100;
      root2 = Math.round(((-b - Math.sqrt(delta)) / (2 * a)) * 100) / 100;
    } else if (delta === 0) {
      root1 = Math.round((-b / (2 * a)) * 100) / 100;
    }
  } else {
    // Linear function b*x + c = 0
    if (b !== 0) {
      root1 = Math.round((-c / b) * 100) / 100;
    }
  }

  // Draw plot on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const halfX = width / 2;
    const halfY = height / 2;
    const scale = 20; // 1 unit = 20px

    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = '#0b1120';
    ctx.fillRect(0, 0, width, height);

    // Gridlines
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let x = -15; x <= 15; x++) {
      ctx.beginPath();
      ctx.moveTo(halfX + x * scale, 0);
      ctx.lineTo(halfX + x * scale, height);
      ctx.stroke();
    }
    for (let y = -15; y <= 15; y++) {
      ctx.beginPath();
      ctx.moveTo(0, halfY - y * scale);
      ctx.lineTo(width, halfY - y * scale);
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, halfY);
    ctx.lineTo(width, halfY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(halfX, 0);
    ctx.lineTo(halfX, height);
    ctx.stroke();

    // Plot Curve
    ctx.strokeStyle = '#a78bfa';
    ctx.lineWidth = 3;
    ctx.beginPath();

    let started = false;
    for (let px = 0; px <= width; px += 2) {
      const x = (px - halfX) / scale;
      const y = a * x * x + b * x + c;
      const py = halfY - y * scale;

      if (py >= -100 && py <= height + 100) {
        if (!started) {
          ctx.moveTo(px, py);
          started = true;
        } else {
          ctx.lineTo(px, py);
        }
      }
    }
    ctx.stroke();

    // Draw Vertex point if parabola
    if (a !== 0 && verticeX !== null && verticeY !== null) {
      const vx = halfX + verticeX * scale;
      const vy = halfY - verticeY * scale;

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(vx, vy, 6, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Draw Roots
    ctx.fillStyle = '#34d399';
    if (root1 !== null) {
      const rx1 = halfX + root1 * scale;
      ctx.beginPath();
      ctx.arc(rx1, halfY, 5, 0, 2 * Math.PI);
      ctx.fill();
    }
    if (root2 !== null && root2 !== root1) {
      const rx2 = halfX + root2 * scale;
      ctx.beginPath();
      ctx.arc(rx2, halfY, 5, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Y Intercept (0, c)
    const cy = halfY - c * scale;
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(halfX, cy, 5, 0, 2 * Math.PI);
    ctx.fill();

  }, [a, b, c]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      <div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 0.35rem' }}>
          Laboratorio de Funciones
        </h3>
        <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: 0 }}>
          f(x) = {a}x² + ({b})x + ({c})
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        
        {/* Controls & Metrics */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
            <label>
              <strong>a (Curvatura / Apertura): {a}</strong>
              <input type="range" min="-4" max="4" step="0.5" value={a} onChange={(e) => setA(Number(e.target.value))} style={{ width: '100%' }} />
            </label>
            <label>
              <strong>b (Inclinación): {b}</strong>
              <input type="range" min="-8" max="8" step="1" value={b} onChange={(e) => setB(Number(e.target.value))} style={{ width: '100%' }} />
            </label>
            <label>
              <strong>c (Ordenada al origen): {c}</strong>
              <input type="range" min="-10" max="10" step="1" value={c} onChange={(e) => setC(Number(e.target.value))} style={{ width: '100%' }} />
            </label>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
            <div>
              <span style={{ color: '#94a3b8' }}>Tipo de Función: </span>
              <strong style={{ color: a !== 0 ? '#a78bfa' : '#38bdf8' }}>{a !== 0 ? 'Cuadrática (Parábola)' : 'Lineal (Recta)'}</strong>
            </div>

            {a !== 0 && (
              <div>
                <span style={{ color: '#94a3b8' }}>Vértice (Xv, Yv): </span>
                <strong style={{ color: '#f59e0b' }}>({verticeX}, {verticeY})</strong>
              </div>
            )}

            <div>
              <span style={{ color: '#94a3b8' }}>Raíces (Ceros): </span>
              <strong style={{ color: '#34d399' }}>
                {root1 !== null && root2 !== null ? `x₁ = ${root1}, x₂ = ${root2}` :
                 root1 !== null ? `x = ${root1}` : 'Sin raíces reales'}
              </strong>
            </div>

            <div>
              <span style={{ color: '#94a3b8' }}>Intersección Eje Y: </span>
              <strong style={{ color: '#38bdf8' }}>(0, {c})</strong>
            </div>
          </div>

          {onSaveSession && (
            <Button onClick={() => onSaveSession({ a, b, c, verticeX, verticeY, root1, root2 })} icon="bx-check-circle" style={{ width: '100%' }}>
              Guardar Experimento
            </Button>
          )}

        </div>

        {/* Canvas Graphic */}
        <div style={{ background: '#090d16', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <canvas ref={canvasRef} width={340} height={340} style={{ width: '100%', maxWidth: '340px', borderRadius: '12px' }} />
          
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', fontSize: '0.78rem', flexWrap: 'wrap' }}>
            <span style={{ color: '#a78bfa', fontWeight: 600 }}>── Función</span>
            {a !== 0 && <span style={{ color: '#f59e0b', fontWeight: 600 }}>● Vértice</span>}
            <span style={{ color: '#34d399', fontWeight: 600 }}>● Raíces</span>
            <span style={{ color: '#38bdf8', fontWeight: 600 }}>● Eje Y</span>
          </div>
        </div>

      </div>

    </div>
  );
};

export default FuncionesSimulator;
