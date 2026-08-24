import React, { useState } from 'react';
import Button from '../../components reutilizables/Button';

type Metodologia = 'Waterfall' | 'Scrum' | 'Kanban';

const MetodologiasSimulator: React.FC<{ onSaveSession?: (data: any) => void }> = ({ onSaveSession }) => {
  const [metodologia, setMetodologia] = useState<Metodologia>('Scrum');
  const [devs, setDevs] = useState<number>(4);
  const [tareasTotal, setTareasTotal] = useState<number>(30);
  const [complejidad, setComplejidad] = useState<'baja' | 'media' | 'alta'>('media');

  // Simulated metrics computation
  const factorMet = metodologia === 'Scrum' ? 0.9 : metodologia === 'Kanban' ? 0.85 : 1.2;
  const factorComp = complejidad === 'baja' ? 0.8 : complejidad === 'media' ? 1.0 : 1.4;

  const tareasCompletadas = Math.min(tareasTotal, Math.round(devs * 6.5 / factorMet));
  const porcentaje = Math.round((tareasCompletadas / tareasTotal) * 100);

  const errores = Math.round((tareasCompletadas * 0.2) * factorComp * (metodologia === 'Waterfall' ? 1.8 : 0.9));
  const retrabajoPct = Math.round((errores / Math.max(tareasCompletadas, 1)) * 100);
  const semanasEstimadas = Math.round((tareasTotal / (devs * 2)) * factorMet * factorComp * 10) / 10;

  const handleFinish = () => {
    if (onSaveSession) {
      onSaveSession({ metodologia, devs, tareasTotal, complejidad, porcentaje, errores, retrabajoPct });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      <div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 0.35rem' }}>
          Simulador de Metodologías de Desarrollo de Software
        </h3>
        <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: 0 }}>
          Experimentá cómo influye la metodología elegida, la cantidad de desarrolladores y la complejidad de las tareas en la tasa de errores y retrabajo del proyecto.
        </p>
      </div>

      {/* Methodology selector tabs */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {(['Scrum', 'Kanban', 'Waterfall'] as Metodologia[]).map((m) => (
          <button
            key={m}
            onClick={() => setMetodologia(m)}
            style={{
              padding: '0.65rem 1.25rem', borderRadius: '12px', border: 'none',
              background: metodologia === m ? 'rgba(124, 58, 237, 0.25)' : 'rgba(255,255,255,0.05)',
              color: metodologia === m ? '#f8fafc' : '#94a3b8',
              fontWeight: metodologia === m ? 700 : 500, fontSize: '0.9rem', cursor: 'pointer'
            }}
          >
            {m}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        
        {/* Variables Form */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem' }}>
            <label>
              <strong>Desarrolladores en el equipo: {devs} personas</strong>
              <input type="range" min="1" max="10" step="1" value={devs} onChange={(e) => setDevs(Number(e.target.value))} style={{ width: '100%' }} />
            </label>

            <label>
              <strong>Volumen de Tareas del Proyecto: {tareasTotal} tareas</strong>
              <input type="range" min="10" max="60" step="5" value={tareasTotal} onChange={(e) => setTareasTotal(Number(e.target.value))} style={{ width: '100%' }} />
            </label>

            <div>
              <strong style={{ display: 'block', marginBottom: '0.35rem' }}>Complejidad Técnica:</strong>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {(['baja', 'media', 'alta'] as const).map((comp) => (
                  <button
                    key={comp}
                    type="button"
                    onClick={() => setComplejidad(comp)}
                    style={{
                      flex: 1, padding: '0.4rem', borderRadius: '8px', border: 'none',
                      background: complejidad === comp ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.05)',
                      color: complejidad === comp ? '#38bdf8' : '#94a3b8',
                      fontWeight: 600, textTransform: 'capitalize', fontSize: '0.8rem', cursor: 'pointer'
                    }}
                  >
                    {comp}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {onSaveSession && (
            <Button onClick={handleFinish} icon="bx-check-circle" style={{ width: '100%' }}>
              Finalizar Simulación
            </Button>
          )}

        </div>

        {/* Real-time Project Simulation Dashboard */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <i className="bx bx-rocket" style={{ color: '#a78bfa' }}></i> Estado del Proyecto en Tiempo Real
          </h4>

          {/* Progress Bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
              <span style={{ fontWeight: 600, color: '#cbd5e1' }}>Progreso de Desarrollo</span>
              <span style={{ fontWeight: 800, color: '#a78bfa' }}>{porcentaje}%</span>
            </div>
            <div style={{ width: '100%', height: '14px', background: 'rgba(255,255,255,0.06)', borderRadius: '7px', overflow: 'hidden' }}>
              <div style={{
                width: `${porcentaje}%`, height: '100%',
                background: 'linear-gradient(90deg, #7c3aed, #38bdf8)',
                borderRadius: '7px', transition: 'width 0.4s ease'
              }} />
            </div>
          </div>

          {/* Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.85rem', borderRadius: '12px' }}>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Tareas Completadas</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34d399', marginTop: '0.2rem' }}>
                {tareasCompletadas} / {tareasTotal}
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.85rem', borderRadius: '12px' }}>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Bugs / Errores</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: errores > 5 ? '#fb7185' : '#fbbf24', marginTop: '0.2rem' }}>
                {errores} detectados
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.85rem', borderRadius: '12px' }}>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Índice de Retrabajo</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: retrabajoPct > 20 ? '#fb7185' : '#38bdf8', marginTop: '0.2rem' }}>
                {retrabajoPct}%
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.85rem', borderRadius: '12px' }}>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Tiempo Estimado</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f1f5f9', marginTop: '0.2rem' }}>
                {semanasEstimadas} semanas
              </div>
            </div>
          </div>

          {/* Pedagógico Feedback box */}
          <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.2)', padding: '0.85rem 1rem', borderRadius: '12px', fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.5 }}>
            <strong style={{ color: '#38bdf8' }}>💡 Conclusión metodológica: </strong>
            {metodologia === 'Waterfall' && 'En Waterfall las fases son secuenciales. Los errores se detectan al final, generando mayor retrabajo.'}
            {metodologia === 'Scrum' && 'Scrum permite entregas iterativas en Sprints. La corrección temprana reduce el retrabajo y el riesgo.'}
            {metodologia === 'Kanban' && 'Kanban optimiza el flujo continuo reduciendo el trabajo en progreso (WIP) y cuellos de botella.'}
          </div>

        </div>

      </div>

    </div>
  );
};

export default MetodologiasSimulator;
