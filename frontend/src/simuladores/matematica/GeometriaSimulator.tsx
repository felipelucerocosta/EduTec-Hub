import React, { useState } from 'react';
import Button from '../../components reutilizables/Button';

type ShapeType = 'cuadrado' | 'rectangulo' | 'circulo' | 'triangulo';

const GeometriaSimulator: React.FC<{ onSaveSession?: (data: any) => void }> = ({ onSaveSession }) => {
  const [shape, setShape] = useState<ShapeType>('rectangulo');
  const [ancho, setAncho] = useState<number>(8);
  const [alto, setAlto] = useState<number>(5);
  const [radio, setRadio] = useState<number>(5);
  const [baseTri, setBaseTri] = useState<number>(6);
  const [alturaTri, setAlturaTri] = useState<number>(8);

  let area = 0;
  let perimetro = 0;

  if (shape === 'cuadrado') {
    area = ancho * ancho;
    perimetro = 4 * ancho;
  } else if (shape === 'rectangulo') {
    area = ancho * alto;
    perimetro = 2 * (ancho + alto);
  } else if (shape === 'circulo') {
    area = Math.round(Math.PI * radio * radio * 100) / 100;
    perimetro = Math.round(2 * Math.PI * radio * 100) / 100;
  } else if (shape === 'triangulo') {
    area = Math.round((baseTri * alturaTri / 2) * 100) / 100;
    // Assuming isosceles triangle for perimeter calculation:
    const ladoC = Math.sqrt((baseTri / 2) ** 2 + alturaTri ** 2);
    perimetro = Math.round((baseTri + 2 * ladoC) * 100) / 100;
  }

  const handleFinish = () => {
    if (onSaveSession) {
      onSaveSession({ shape, area, perimetro });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      <div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 0.35rem' }}>
          Simulador de Geometría Plana
        </h3>
        <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: 0 }}>
          Seleccioná una figura, modificá sus dimensiones y observá el cálculo de área y perímetro.
        </p>
      </div>

      {/* Shape Selector Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {(['cuadrado', 'rectangulo', 'circulo', 'triangulo'] as ShapeType[]).map((s) => (
          <button
            key={s}
            onClick={() => setShape(s)}
            style={{
              padding: '0.6rem 1.25rem', borderRadius: '10px', border: 'none',
              background: shape === s ? 'rgba(124, 58, 237, 0.25)' : 'rgba(255,255,255,0.05)',
              color: shape === s ? '#f8fafc' : '#94a3b8',
              fontWeight: shape === s ? 700 : 500, fontSize: '0.88rem', cursor: 'pointer',
              textTransform: 'capitalize'
            }}
          >
            {s}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        
        {/* Controls & Metrics */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
            {(shape === 'cuadrado' || shape === 'rectangulo') && (
              <label>
                <strong>{shape === 'cuadrado' ? 'Lado (l):' : 'Ancho (b):'} {ancho} cm</strong>
                <input type="range" min="1" max="15" step="1" value={ancho} onChange={(e) => setAncho(Number(e.target.value))} style={{ width: '100%' }} />
              </label>
            )}

            {shape === 'rectangulo' && (
              <label>
                <strong>Alto (h): {alto} cm</strong>
                <input type="range" min="1" max="15" step="1" value={alto} onChange={(e) => setAlto(Number(e.target.value))} style={{ width: '100%' }} />
              </label>
            )}

            {shape === 'circulo' && (
              <label>
                <strong>Radio (r): {radio} cm</strong>
                <input type="range" min="1" max="12" step="1" value={radio} onChange={(e) => setRadio(Number(e.target.value))} style={{ width: '100%' }} />
              </label>
            )}

            {shape === 'triangulo' && (
              <>
                <label>
                  <strong>Base (b): {baseTri} cm</strong>
                  <input type="range" min="1" max="15" step="1" value={baseTri} onChange={(e) => setBaseTri(Number(e.target.value))} style={{ width: '100%' }} />
                </label>
                <label>
                  <strong>Altura (h): {alturaTri} cm</strong>
                  <input type="range" min="1" max="15" step="1" value={alturaTri} onChange={(e) => setAlturaTri(Number(e.target.value))} style={{ width: '100%' }} />
                </label>
              </>
            )}
          </div>

          {/* Real-time Calculation Card */}
          <div style={{ background: 'rgba(124, 58, 237, 0.08)', border: '1px solid rgba(124, 58, 237, 0.2)', borderRadius: '14px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Área calculada:</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#34d399' }}>{area} cm²</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Perímetro calculado:</span>
              <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#38bdf8' }}>{perimetro} cm</span>
            </div>
          </div>

          {onSaveSession && (
            <Button onClick={handleFinish} icon="bx-check-circle" style={{ width: '100%' }}>
              Registrar Ejercicio
            </Button>
          )}

        </div>

        {/* Dynamic SVG Visualizer */}
        <div style={{ background: '#090d16', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width={300} height={300} viewBox="0 0 300 300" style={{ background: '#0b1120', borderRadius: '12px', width: '100%', maxWidth: '300px' }}>
            {shape === 'cuadrado' && (
              <rect
                x={150 - (ancho * 10) / 2}
                y={150 - (ancho * 10) / 2}
                width={ancho * 10}
                height={ancho * 10}
                fill="rgba(124, 58, 237, 0.3)"
                stroke="#a78bfa"
                strokeWidth="3"
                rx="6"
              />
            )}
            {shape === 'rectangulo' && (
              <rect
                x={150 - (ancho * 10) / 2}
                y={150 - (alto * 10) / 2}
                width={ancho * 10}
                height={alto * 10}
                fill="rgba(56, 189, 248, 0.3)"
                stroke="#38bdf8"
                strokeWidth="3"
                rx="6"
              />
            )}
            {shape === 'circulo' && (
              <circle
                cx={150}
                cy={150}
                r={radio * 9}
                fill="rgba(52, 211, 153, 0.3)"
                stroke="#34d399"
                strokeWidth="3"
              />
            )}
            {shape === 'triangulo' && (
              <polygon
                points={`
                  ${150 - (baseTri * 10) / 2},${150 + (alturaTri * 5)}
                  ${150 + (baseTri * 10) / 2},${150 + (alturaTri * 5)}
                  150,${150 - (alturaTri * 5)}
                `}
                fill="rgba(245, 158, 11, 0.3)"
                stroke="#fbbf24"
                strokeWidth="3"
              />
            )}
          </svg>
        </div>

      </div>

    </div>
  );
};

export default GeometriaSimulator;
