import React, { useState } from 'react';
import Button from '../../components reutilizables/Button';

interface Props {
  onSaveSession: (datos: any) => void;
}

const ProbabilidadSimulator: React.FC<Props> = ({ onSaveSession }) => {
  const [tipoExperimento, setTipoExperimento] = useState<'moneda' | 'dado'>('moneda');
  const [cantidadTiradas, setCantidadTiradas] = useState<number>(100);
  const [historialResultados, setHistorialResultados] = useState<{ [key: string]: number }>({});
  const [totalSimulado, setTotalSimulado] = useState<number>(0);
  const [reflexionRespondida, setReflexionRespondida] = useState<string | null>(null);

  const ejecutarExperimento = () => {
    const res: { [key: string]: number } = {};
    if (tipoExperimento === 'moneda') {
      res['Cara'] = 0;
      res['Cruz'] = 0;
      for (let i = 0; i < cantidadTiradas; i++) {
        const val = Math.random() < 0.5 ? 'Cara' : 'Cruz';
        res[val]++;
      }
    } else {
      for (let d = 1; d <= 6; d++) res[`Cara ${d}`] = 0;
      for (let i = 0; i < cantidadTiradas; i++) {
        const val = Math.floor(Math.random() * 6) + 1;
        res[`Cara ${val}`]++;
      }
    }
    setHistorialResultados(res);
    setTotalSimulado(cantidadTiradas);
  };

  const probtTeorica = tipoExperimento === 'moneda' ? 50 : (100 / 6);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* 1. OBJETIVO PEDAGÓGICO */}
      <div style={{ background: 'rgba(124, 58, 237, 0.08)', border: '1px solid rgba(124, 58, 237, 0.2)', borderRadius: '14px', padding: '1rem 1.25rem' }}>
        <h4 style={{ margin: '0 0 0.35rem 0', color: '#a78bfa', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <i className="bx bx-target-lock"></i> Objetivo Pedagógico
        </h4>
        <p style={{ margin: 0, fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.5 }}>
          Experimentar la <strong>Ley de los Grandes Números</strong>: observa cómo al aumentar el número de experimentos, la probabilidad experimental converge hacia la probabilidad teórica.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        
        {/* 2. VARIABLES & CONTROLES */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '1.25rem' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#f8fafc', fontSize: '0.95rem', fontWeight: 700 }}>
            🎛️ Variables del Experimento
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.4rem' }}>
                Tipo de Experimento:
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => setTipoExperimento('moneda')}
                  style={{
                    flex: 1, padding: '0.5rem', borderRadius: '8px', border: 'none',
                    background: tipoExperimento === 'moneda' ? 'rgba(124, 58, 237, 0.3)' : 'rgba(255,255,255,0.05)',
                    color: tipoExperimento === 'moneda' ? '#38bdf8' : '#94a3b8', fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  🪙 Moneda (2 lados)
                </button>
                <button
                  onClick={() => setTipoExperimento('dado')}
                  style={{
                    flex: 1, padding: '0.5rem', borderRadius: '8px', border: 'none',
                    background: tipoExperimento === 'dado' ? 'rgba(124, 58, 237, 0.3)' : 'rgba(255,255,255,0.05)',
                    color: tipoExperimento === 'dado' ? '#38bdf8' : '#94a3b8', fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  🎲 Dado (6 caras)
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
                Número de Lanzamientos: <strong style={{ color: '#f8fafc' }}>{cantidadTiradas}</strong>
              </label>
              <input
                type="range"
                min="10"
                max="5000"
                step="10"
                value={cantidadTiradas}
                onChange={(e) => setCantidadTiradas(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#7c3aed' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748b' }}>
                <span>10 (Poca muestra)</span>
                <span>5000 (Gran muestra)</span>
              </div>
            </div>

            <Button onClick={ejecutarExperimento} icon="bx-play">
              Lanzar Experimento
            </Button>
          </div>
        </div>

        {/* 3. VISUALIZACIÓN DINÁMICA */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '1.25rem' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#f8fafc', fontSize: '0.95rem', fontWeight: 700 }}>
            📊 Comparativa Teórica vs. Experimental
          </h4>

          {totalSimulado === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748b' }}>
              Haz clic en "Lanzar Experimento" para ver los gráficos.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {Object.entries(historialResultados).map(([label, count]) => {
                const pctExp = totalSimulado > 0 ? (count / totalSimulado) * 100 : 0;
                return (
                  <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#e2e8f0' }}>
                      <span><strong>{label}</strong>: {count} veces</span>
                      <span>Exp: <strong style={{ color: '#38bdf8' }}>{pctExp.toFixed(1)}%</strong> | Teór: <strong style={{ color: '#a78bfa' }}>{probtTeorica.toFixed(1)}%</strong></span>
                    </div>
                    {/* Barra de progreso experimental */}
                    <div style={{ height: '10px', background: 'rgba(255,255,255,0.06)', borderRadius: '5px', overflow: 'hidden', position: 'relative' }}>
                      <div style={{ height: '100%', width: `${pctExp}%`, background: 'linear-gradient(90deg, #7c3aed, #06b6d4)', transition: 'width 0.3s ease' }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* 4. PREGUNTA DE REFLEXIÓN PEDAGÓGICA */}
      {totalSimulado > 0 && (
        <div style={{ background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.2)', borderRadius: '16px', padding: '1.25rem' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#38bdf8', fontSize: '0.95rem', fontWeight: 700 }}>
            🤔 Reflexión Pedagógica
          </h4>
          <p style={{ margin: '0 0 0.85rem 0', fontSize: '0.88rem', color: '#cbd5e1' }}>
            ¿Qué ocurrió con la diferencia entre la probabilidad teórica ({probtTeorica.toFixed(1)}%) y la esperada al aumentar las tiradas de {cantidadTiradas}?
          </p>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                setReflexionRespondida('correct');
                onSaveSession({ tipoExperimento, tiradas: cantidadTiradas, acierto: true });
              }}
              style={{
                padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid rgba(52, 211, 153, 0.3)',
                background: reflexionRespondida === 'correct' ? 'rgba(52, 211, 153, 0.25)' : 'rgba(255,255,255,0.04)',
                color: '#34d399', fontSize: '0.85rem', cursor: 'pointer'
              }}
            >
              ✅ Al haber más tiradas, los resultados se acercan más al porcentaje teórico.
            </button>
            <button
              onClick={() => setReflexionRespondida('incorrect')}
              style={{
                padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid rgba(244, 63, 94, 0.3)',
                background: reflexionRespondida === 'incorrect' ? 'rgba(244, 63, 94, 0.25)' : 'rgba(255,255,255,0.04)',
                color: '#fb7185', fontSize: '0.85rem', cursor: 'pointer'
              }}
            >
              ❌ No afecta en nada la cantidad de tiradas.
            </button>
          </div>

          {reflexionRespondida === 'correct' && (
            <div style={{ marginTop: '0.75rem', color: '#34d399', fontSize: '0.85rem', fontWeight: 600 }}>
              ¡Correcto! Es la Ley de los Grandes Números: a mayor muestra, menor dispersión.
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default ProbabilidadSimulator;
