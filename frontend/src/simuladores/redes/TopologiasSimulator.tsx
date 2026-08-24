import React, { useState } from 'react';
import Button from '../../components reutilizables/Button';

type Topologia = 'estrella' | 'bus' | 'anillo' | 'malla';

const TopologiasSimulator: React.FC<{ onSaveSession?: (data: any) => void }> = ({ onSaveSession }) => {
  const [topologia, setTopologia] = useState<Topologia>('estrella');
  const [nodosCount, setNodosCount] = useState<number>(5);

  const handleFinish = () => {
    if (onSaveSession) {
      onSaveSession({ topologia, nodosCount });
    }
  };

  // SVG dimensions
  const width = 340;
  const height = 300;
  const cx = width / 2;
  const cy = height / 2;
  const radius = 100;

  // Calculate node positions in circle
  const nodos = Array.from({ length: nodosCount }).map((_, i) => {
    const angle = (i * 2 * Math.PI) / nodosCount - Math.PI / 2;
    return {
      id: i + 1,
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      <div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 0.35rem' }}>
          Simulador de Topologías de Red
        </h3>
        <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: 0 }}>
          Explorá las diferentes formas de interconectar nodos en una red y analizá su tolerancia a fallas.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {(['estrella', 'bus', 'anillo', 'malla'] as Topologia[]).map((t) => (
          <button
            key={t}
            onClick={() => setTopologia(t)}
            style={{
              padding: '0.65rem 1.25rem', borderRadius: '12px', border: 'none',
              background: topologia === t ? 'rgba(124, 58, 237, 0.25)' : 'rgba(255,255,255,0.05)',
              color: topologia === t ? '#f8fafc' : '#94a3b8',
              fontWeight: topologia === t ? 700 : 500, fontSize: '0.9rem', cursor: 'pointer',
              textTransform: 'capitalize'
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        
        {/* Controls & Features */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <label style={{ fontSize: '0.85rem' }}>
            <strong>Cantidad de Hosts / Nodos: {nodosCount}</strong>
            <input type="range" min="3" max="8" step="1" value={nodosCount} onChange={(e) => setNodosCount(Number(e.target.value))} style={{ width: '100%' }} />
          </label>

          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
            <div>
              <span style={{ color: '#94a3b8' }}>Tolerancia a fallas: </span>
              <strong style={{ color: topologia === 'malla' ? '#34d399' : topologia === 'estrella' ? '#38bdf8' : '#fb7185' }}>
                {topologia === 'malla' ? 'Alta (Múltiples caminos)' : topologia === 'estrella' ? 'Media (Depende del Switch)' : 'Baja (Punto único de falla)'}
              </strong>
            </div>

            <div>
              <span style={{ color: '#94a3b8' }}>Costo de Cableado: </span>
              <strong style={{ color: topologia === 'malla' ? '#fb7185' : topologia === 'bus' ? '#34d399' : '#fbbf24' }}>
                {topologia === 'malla' ? 'Muy Alto' : topologia === 'bus' ? 'Bajo' : 'Moderado'}
              </strong>
            </div>

            <div>
              <span style={{ color: '#94a3b8' }}>Facilidad de Expansión: </span>
              <strong style={{ color: topologia === 'estrella' ? '#34d399' : '#cbd5e1' }}>
                {topologia === 'estrella' ? 'Muy Fácil (Plug & Play)' : 'Moderada'}
              </strong>
            </div>
          </div>

          {onSaveSession && (
            <Button onClick={handleFinish} icon="bx-check-circle" style={{ width: '100%' }}>
              Registrar Experiencia de Red
            </Button>
          )}

        </div>

        {/* Network Diagram Visualizer */}
        <div style={{ background: '#090d16', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ background: '#0b1120', borderRadius: '12px', width: '100%', maxWidth: '340px' }}>
            
            {/* Topología Estrella */}
            {topologia === 'estrella' && (
              <g>
                {/* Central Switch/Hub */}
                <circle cx={cx} cy={cy} r="18" fill="#7c3aed" stroke="#ffffff" strokeWidth="2" />
                <text x={cx} y={cy + 4} fill="#ffffff" fontSize="9" fontWeight="800" textAnchor="middle">SWITCH</text>

                {/* Lines to hosts */}
                {nodos.map((n) => (
                  <line key={n.id} x1={cx} y1={cy} x2={n.x} y2={n.y} stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 3" />
                ))}
              </g>
            )}

            {/* Topología Bus */}
            {topologia === 'bus' && (
              <g>
                {/* Central Bus Line */}
                <line x1={40} y1={cy} x2={width - 40} y2={cy} stroke="#a78bfa" strokeWidth="4" />

                {/* Drops to nodes */}
                {nodos.map((n, i) => {
                  const busX = 50 + (i * (width - 100)) / (nodosCount - 1);
                  const isTop = i % 2 === 0;
                  const nodeY = isTop ? cy - 70 : cy + 70;
                  return (
                    <g key={n.id}>
                      <line x1={busX} y1={cy} x2={busX} y2={nodeY} stroke="#38bdf8" strokeWidth="2" />
                      <circle cx={busX} cy={nodeY} r="14" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
                      <text x={busX} y={nodeY + 4} fill="#f1f5f9" fontSize="10" fontWeight="700" textAnchor="middle">H{n.id}</text>
                    </g>
                  );
                })}
              </g>
            )}

            {/* Topología Anillo */}
            {topologia === 'anillo' && (
              <g>
                {/* Ring connections */}
                {nodos.map((n, i) => {
                  const nextNode = nodos[(i + 1) % nodosCount];
                  return (
                    <line key={i} x1={n.x} y1={n.y} x2={nextNode.x} y2={nextNode.y} stroke="#38bdf8" strokeWidth="2" />
                  );
                })}
              </g>
            )}

            {/* Topología Malla (Full Mesh) */}
            {topologia === 'malla' && (
              <g>
                {/* Connections between every pair of nodes */}
                {nodos.map((n1, i) =>
                  nodos.slice(i + 1).map((n2, j) => (
                    <line key={`${i}-${j}`} x1={n1.x} y1={n1.y} x2={n2.x} y2={n2.y} stroke="rgba(52, 211, 153, 0.4)" strokeWidth="1.5" />
                  ))
                )}
              </g>
            )}

            {/* Draw Hosts Nodes for Estrella, Anillo & Malla */}
            {topologia !== 'bus' && nodos.map((n) => (
              <g key={n.id}>
                <circle cx={n.x} cy={n.y} r="15" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
                <text x={n.x} y={n.y + 4} fill="#f8fafc" fontSize="10" fontWeight="700" textAnchor="middle">H{n.id}</text>
              </g>
            ))}

          </svg>
        </div>

      </div>

    </div>
  );
};

export default TopologiasSimulator;
