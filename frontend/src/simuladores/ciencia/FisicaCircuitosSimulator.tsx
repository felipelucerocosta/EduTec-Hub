import React, { useState } from 'react';

interface Props {
  onSaveSession: (datos: any) => void;
}

const FisicaCircuitosSimulator: React.FC<Props> = ({ onSaveSession }) => {
  const [voltaje, setVoltaje] = useState<number>(12); // Volts
  const [resistencia, setResistencia] = useState<number>(4); // Ohms
  const [reflexion, setReflexion] = useState<string | null>(null);

  // Ley de Ohm: I = V / R
  const corriente = resistencia > 0 ? voltaje / resistencia : 0;
  const potencia = voltaje * corriente; // P = V * I

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* 1. OBJETIVO PEDAGÓGICO */}
      <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '14px', padding: '1rem 1.25rem' }}>
        <h4 style={{ margin: '0 0 0.35rem 0', color: '#38bdf8', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <i className="bx bx-target-lock"></i> Laboratorio de Ley de Ohm y Circuitos Eléctricos
        </h4>
        <p style={{ margin: 0, fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.5 }}>
          Experimenta la relación fundamental de la física eléctrica: <strong>V = I × R</strong>. Observa el comportamiento de la corriente y la potencia disipada.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        
        {/* 2. CONTROLES */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '1.25rem' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#f8fafc', fontSize: '0.95rem', fontWeight: 700 }}>
            🎛️ Modificadores del Circuito
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
                Tensión / Voltaje (V): <strong style={{ color: '#38bdf8' }}>{voltaje} V</strong>
              </label>
              <input
                type="range"
                min="1"
                max="48"
                value={voltaje}
                onChange={(e) => setVoltaje(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#06b6d4' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
                Resistencia Eléctrica (R): <strong style={{ color: '#a78bfa' }}>{resistencia} Ω</strong>
              </label>
              <input
                type="range"
                min="1"
                max="20"
                value={resistencia}
                onChange={(e) => setResistencia(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#7c3aed' }}
              />
            </div>
          </div>
        </div>

        {/* 3. SIMULACIÓN VISUAL DEL CIRCUITO */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '1.25rem', textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#f8fafc', fontSize: '0.95rem', fontWeight: 700 }}>
            ⚡ Visualización del Flujo de Corriente
          </h4>

          {/* Circuito esquemático SVG interactivo */}
          <svg viewBox="0 0 300 150" style={{ width: '100%', height: '140px' }}>
            {/* Cableado */}
            <rect x="30" y="20" width="240" height="110" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" rx="10" />
            
            {/* Fuente V */}
            <circle cx="30" cy="75" r="18" fill="#0284c7" stroke="#38bdf8" strokeWidth="2" />
            <text x="30" y="80" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold">{voltaje}V</text>

            {/* Resistencia R */}
            <rect x="130" y="10" width="40" height="20" fill="#7c3aed" stroke="#a78bfa" strokeWidth="2" rx="4" />
            <text x="150" y="24" textAnchor="middle" fill="#fff" fontSize="10">{resistencia}Ω</text>

            {/* Lámpara/Carga */}
            <circle cx="270" cy="75" r="16" fill={corriente > 5 ? '#f59e0b' : '#334155'} stroke="#fbbf24" strokeWidth="2" />
            <text x="270" y="80" textAnchor="middle" fill="#fff" fontSize="10">{potencia.toFixed(0)}W</text>

            {/* Partículas de corriente animadas */}
            <circle cx={70 + (Date.now() % 1000) * 0.05} cy="20" r="3" fill="#38bdf8" />
          </svg>

          <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '0.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '10px' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Corriente (I)</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#34d399' }}>{corriente.toFixed(2)} A</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Potencia (P)</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fbbf24' }}>{potencia.toFixed(1)} W</div>
            </div>
          </div>
        </div>

      </div>

      {/* 4. PREGUNTA DE REFLEXIÓN */}
      <div style={{ background: 'rgba(124, 58, 237, 0.08)', border: '1px solid rgba(124, 58, 237, 0.2)', borderRadius: '16px', padding: '1.25rem' }}>
        <h4 style={{ margin: '0 0 0.5rem 0', color: '#a78bfa', fontSize: '0.95rem', fontWeight: 700 }}>
          🤔 Reflexión Pedagógica
        </h4>
        <p style={{ margin: '0 0 0.85rem 0', fontSize: '0.88rem', color: '#cbd5e1' }}>
          Si mantenemos el voltaje constante en {voltaje}V y duplicamos la resistencia a {resistencia * 2}Ω, ¿qué sucede con la intensidad de corriente?
        </p>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              setReflexion('correct');
              onSaveSession({ voltaje, resistencia, corriente, acierto: true });
            }}
            style={{
              padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid rgba(52, 211, 153, 0.3)',
              background: reflexion === 'correct' ? 'rgba(52, 211, 153, 0.25)' : 'rgba(255,255,255,0.04)',
              color: '#34d399', fontSize: '0.85rem', cursor: 'pointer'
            }}
          >
            ✅ La corriente disminuye exactamente a la mitad.
          </button>
          <button
            onClick={() => setReflexion('incorrect')}
            style={{
              padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid rgba(244, 63, 94, 0.3)',
              background: reflexion === 'incorrect' ? 'rgba(244, 63, 94, 0.25)' : 'rgba(255,255,255,0.04)',
              color: '#fb7185', fontSize: '0.85rem', cursor: 'pointer'
            }}
          >
            ❌ La corriente se duplica.
          </button>
        </div>

        {reflexion === 'correct' && (
          <div style={{ marginTop: '0.75rem', color: '#34d399', fontSize: '0.85rem', fontWeight: 600 }}>
            ¡Correcto! La intensidad de corriente es inversamente proporcional a la resistencia del circuito.
          </div>
        )}
      </div>

    </div>
  );
};

export default FisicaCircuitosSimulator;
