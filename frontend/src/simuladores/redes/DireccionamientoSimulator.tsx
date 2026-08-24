import React, { useState } from 'react';

interface Props {
  onSaveSession: (datos: any) => void;
}

const DireccionamientoSimulator: React.FC<Props> = ({ onSaveSession }) => {
  const [ipInput, setIpInput] = useState<string>('192.168.1.1');
  const [cidr, setCidr] = useState<number>(24);
  const [numSubredes, setNumSubredes] = useState<number>(4);
  const [reflexion, setReflexion] = useState<string | null>(null);

  // Math for subnet calculations
  const totalHosts = Math.pow(2, 32 - cidr);
  const hostsUtiles = Math.max(0, totalHosts - 2);
  const mascaraBin = '1'.repeat(cidr) + '0'.repeat(32 - cidr);
  const octetosMascara = [
    parseInt(mascaraBin.slice(0, 8), 2),
    parseInt(mascaraBin.slice(8, 16), 2),
    parseInt(mascaraBin.slice(16, 24), 2),
    parseInt(mascaraBin.slice(24, 32), 2),
  ].join('.');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* 1. OBJETIVO PEDAGÓGICO */}
      <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '14px', padding: '1rem 1.25rem' }}>
        <h4 style={{ margin: '0 0 0.35rem 0', color: '#38bdf8', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <i className="bx bx-target-lock"></i> Laboratorio de Direccionamiento IP y Subnetting
        </h4>
        <p style={{ margin: 0, fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.5 }}>
          Comprende visualmente la relación entre la <strong>Máscara de Subred (CIDR)</strong>, el espacio de direcciones IP asignables y la segmentación de red.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        
        {/* 2. CONTROLES */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '1.25rem' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#f8fafc', fontSize: '0.95rem', fontWeight: 700 }}>
            🎛️ Configuración de Red
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
                Dirección IP Base:
              </label>
              <input
                type="text"
                value={ipInput}
                onChange={(e) => setIpInput(e.target.value)}
                style={{
                  width: '100%', padding: '0.55rem 0.85rem', borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
                  color: '#f8fafc', fontSize: '0.9rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
                Prefijo Máscara CIDR: <strong style={{ color: '#38bdf8' }}>/{cidr}</strong>
              </label>
              <input
                type="range"
                min="16"
                max="30"
                value={cidr}
                onChange={(e) => setCidr(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#06b6d4' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748b' }}>
                <span>/16 (Grande - 65,534 hosts)</span>
                <span>/30 (Puntu-a-punto - 2 hosts)</span>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
                Subredes Requeridas: <strong style={{ color: '#a78bfa' }}>{numSubredes}</strong>
              </label>
              <input
                type="range"
                min="1"
                max="16"
                value={numSubredes}
                onChange={(e) => setNumSubredes(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#7c3aed' }}
              />
            </div>
          </div>
        </div>

        {/* 3. VISUALIZADOR DE ESPACIO DE RED */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '1.25rem' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#f8fafc', fontSize: '0.95rem', fontWeight: 700 }}>
            🌐 Resultado de Segmentación Visual
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '10px', fontSize: '0.85rem' }}>
              <div>Máscara decimal: <strong style={{ color: '#38bdf8' }}>{octetosMascara}</strong></div>
              <div>Total de direcciones: <strong style={{ color: '#f8fafc' }}>{totalHosts.toLocaleString()}</strong></div>
              <div>Hosts útiles por subred: <strong style={{ color: '#34d399' }}>{hostsUtiles.toLocaleString()}</strong></div>
            </div>

            {/* Diagrama de bloques visuales de subred */}
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.5rem' }}>
              Distribución de Bloques de Subred:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(numSubredes, 4)}, 1fr)`, gap: '0.5rem' }}>
              {Array.from({ length: numSubredes }).map((_, idx) => (
                <div key={idx} style={{
                  background: 'rgba(124, 58, 237, 0.15)', border: '1px solid rgba(124, 58, 237, 0.3)',
                  borderRadius: '10px', padding: '0.65rem 0.5rem', textAlign: 'center', fontSize: '0.75rem'
                }}>
                  <div style={{ color: '#a78bfa', fontWeight: 700 }}>Subred #{idx + 1}</div>
                  <div style={{ color: '#cbd5e1', fontSize: '0.7rem', marginTop: '0.2rem' }}>
                    ~{Math.floor(hostsUtiles / numSubredes)} hosts
                  </div>
                </div>
              ))}
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
          ¿Qué ocurre con la cantidad de hosts útiles disponibles al incrementar el prefijo CIDR de /{cidr} a /{Math.min(30, cidr + 2)}?
        </p>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              setReflexion('correct');
              onSaveSession({ cidr, hostsUtiles, acierto: true });
            }}
            style={{
              padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid rgba(52, 211, 153, 0.3)',
              background: reflexion === 'correct' ? 'rgba(52, 211, 153, 0.25)' : 'rgba(255,255,255,0.04)',
              color: '#34d399', fontSize: '0.85rem', cursor: 'pointer'
            }}
          >
            ✅ La cantidad de hosts útiles disminuye a la mitad por cada bit prestado a la red.
          </button>
          <button
            onClick={() => setReflexion('incorrect')}
            style={{
              padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid rgba(244, 63, 94, 0.3)',
              background: reflexion === 'incorrect' ? 'rgba(244, 63, 94, 0.25)' : 'rgba(255,255,255,0.04)',
              color: '#fb7185', fontSize: '0.85rem', cursor: 'pointer'
            }}
          >
            ❌ Aumenta la cantidad de hosts disponibles.
          </button>
        </div>

        {reflexion === 'correct' && (
          <div style={{ marginTop: '0.75rem', color: '#34d399', fontSize: '0.85rem', fontWeight: 600 }}>
            ¡Excelente! Cada bit adicional en la máscara duplica las subredes y reduce los hosts útiles.
          </div>
        )}
      </div>

    </div>
  );
};

export default DireccionamientoSimulator;
