import React, { useState } from 'react';

interface Props {
  onSaveSession: (datos: any) => void;
}

const ProyectosEvolutionSimulator: React.FC<Props> = ({ onSaveSession }) => {
  const [numSprints, setNumSprints] = useState<number>(4);
  const [coberturaTests, setCoberturaTests] = useState<number>(75);
  const [refactorFrecuencia, setRefactorFrecuencia] = useState<number>(50);
  const [reflexion, setReflexion] = useState<string | null>(null);

  // Simulación de métricas acumuladas
  const deidaTecnica = Math.max(0, Math.round((100 - coberturaTests) * 1.5 - refactorFrecuencia * 0.5));
  const velocidadEquipo = Math.max(10, Math.round(50 - deidaTecnica * 0.4 + (coberturaTests * 0.3)));
  const bugsCriticos = Math.max(0, Math.round((100 - coberturaTests) * 0.2 + (numSprints * 2) - refactorFrecuencia * 0.15));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* 1. OBJETIVO PEDAGÓGICO */}
      <div style={{ background: 'rgba(124, 58, 237, 0.08)', border: '1px solid rgba(124, 58, 237, 0.2)', borderRadius: '14px', padding: '1rem 1.25rem' }}>
        <h4 style={{ margin: '0 0 0.35rem 0', color: '#a78bfa', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <i className="bx bx-target-lock"></i> Laboratorio de Evolución y Calidad de Software
        </h4>
        <p style={{ margin: 0, fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.5 }}>
          Experimenta cómo la <strong>Deuda Técnica</strong>, la cobertura de pruebas unitarias y el refactoring impactan directamente en la velocidad del equipo a través de los sprints.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        
        {/* 2. CONTROLES DE INGENIERÍA */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '1.25rem' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#f8fafc', fontSize: '0.95rem', fontWeight: 700 }}>
            🎛️ Parámetros de Calidad del Código
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
                Cantidad de Sprints Transcurridos: <strong style={{ color: '#38bdf8' }}>{numSprints} sprints</strong>
              </label>
              <input
                type="range"
                min="1"
                max="12"
                value={numSprints}
                onChange={(e) => setNumSprints(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#06b6d4' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
                Cobertura de Tests (%): <strong style={{ color: '#34d399' }}>{coberturaTests}%</strong>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={coberturaTests}
                onChange={(e) => setCoberturaTests(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#34d399' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
                Frecuencia de Refactorings: <strong style={{ color: '#a78bfa' }}>{refactorFrecuencia}%</strong>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={refactorFrecuencia}
                onChange={(e) => setRefactorFrecuencia(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#7c3aed' }}
              />
            </div>
          </div>
        </div>

        {/* 3. EVOLUCIÓN VISUAL DE MÉTRICAS */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '1.25rem' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#f8fafc', fontSize: '0.95rem', fontWeight: 700 }}>
            📈 Tablero de Salud del Proyecto
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.3rem' }}>
                <span>Deuda Técnica Acumulada:</span>
                <strong style={{ color: deidaTecnica > 50 ? '#fb7185' : '#34d399' }}>{deidaTecnica} pts</strong>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(100, deidaTecnica)}%`, background: deidaTecnica > 50 ? '#f43f5e' : '#10b981', transition: 'all 0.3s ease' }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.3rem' }}>
                <span>Velocidad de Entrega (Puntos/Sprint):</span>
                <strong style={{ color: '#38bdf8' }}>{velocidadEquipo} pts/sprint</strong>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(100, velocidadEquipo * 1.5)}%`, background: '#06b6d4', transition: 'all 0.3s ease' }}></div>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Bugs Críticos en Producción:</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: bugsCriticos > 10 ? '#fb7185' : '#34d399' }}>
                🐞 {bugsCriticos}
              </span>
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
          Al reducir la cobertura de tests del {coberturaTests}% al 10%, ¿qué ocurre con la velocidad de desarrollo en los sprints avanzados?
        </p>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              setReflexion('correct');
              onSaveSession({ deidaTecnica, velocidadEquipo, acierto: true });
            }}
            style={{
              padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid rgba(52, 211, 153, 0.3)',
              background: reflexion === 'correct' ? 'rgba(52, 211, 153, 0.25)' : 'rgba(255,255,255,0.04)',
              color: '#34d399', fontSize: '0.85rem', cursor: 'pointer'
            }}
          >
            ✅ Al principio parece rápido, pero luego cae drásticamente debido a la deuda técnica y parches de errores.
          </button>
          <button
            onClick={() => setReflexion('incorrect')}
            style={{
              padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid rgba(244, 63, 94, 0.3)',
              background: reflexion === 'incorrect' ? 'rgba(244, 63, 94, 0.25)' : 'rgba(255,255,255,0.04)',
              color: '#fb7185', fontSize: '0.85rem', cursor: 'pointer'
            }}
          >
            ❌ El equipo mantiene la misma velocidad sin importar los tests.
          </button>
        </div>

        {reflexion === 'correct' && (
          <div style={{ marginTop: '0.75rem', color: '#34d399', fontSize: '0.85rem', fontWeight: 600 }}>
            ¡Excelente observación! Evitar los tests genera deuda técnica acumulada que desacelera cualquier proyecto.
          </div>
        )}
      </div>

    </div>
  );
};

export default ProyectosEvolutionSimulator;
