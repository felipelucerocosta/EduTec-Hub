import React, { useState } from 'react';

interface Props {
  onSaveSession: (datos: any) => void;
}

const TEXTOS_EJEMPLO = [
  "El estudiante analiza detenidamente el simulador interactivo para comprender los conceptos complejos.",
  "Las computadoras procesan información en tiempo real mediante algoritmos eficientes y estructuras organizadas.",
  "En un ecosistema educativo digital, la colaboración constante entre docentes y alumnos fomenta el aprendizaje significativo."
];

const TextAnalysisSimulator: React.FC<Props> = ({ onSaveSession }) => {
  const [texto, setTexto] = useState<string>(TEXTOS_EJEMPLO[0]);
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todos');
  const [reflexion, setReflexion] = useState<string | null>(null);

  const palabras = texto.split(/\s+/).filter(Boolean);
  const totalPalabras = palabras.length;
  const oraciones = texto.split(/[.!?]+/).filter(p => p.trim().length > 0);
  const totalOraciones = oraciones.length;

  // Clasificación simulada de categorías sintácticas para la experiencia
  const clasificarPalabra = (p: string) => {
    const clean = p.toLowerCase().replace(/[^a-záéíóúñ]/g, '');
    if (['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'en', 'para', 'de', 'con', 'y', 'o'].includes(clean)) {
      return 'gramatical'; // artículos / preposiciones / conjunciones
    }
    if (['analiza', 'procesan', 'fomenta', 'comprender', 'crear', 'estudia'].includes(clean)) {
      return 'verbo';
    }
    if (['detenidamente', 'eficientes', 'organizadas', 'complejos', 'digital', 'significativo', 'constante'].includes(clean)) {
      return 'adjetivo_adverbio';
    }
    return 'sustantivo';
  };

  const conteoCategorias = palabras.reduce((acc, p) => {
    const cat = clasificarPalabra(p);
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* 1. OBJETIVO PEDAGÓGICO */}
      <div style={{ background: 'rgba(124, 58, 237, 0.08)', border: '1px solid rgba(124, 58, 237, 0.2)', borderRadius: '14px', padding: '1rem 1.25rem' }}>
        <h4 style={{ margin: '0 0 0.35rem 0', color: '#a78bfa', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <i className="bx bx-target-lock"></i> Laboratorio de Análisis Textual y Sintáctico
        </h4>
        <p style={{ margin: 0, fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.5 }}>
          Experimenta con la estructura del texto, la densidad categorial y las relaciones entre elementos sintácticos.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        
        {/* 2. ENTRADA Y TEXTO */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '1.25rem' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#f8fafc', fontSize: '0.95rem', fontWeight: 700 }}>
            📝 Editor de Texto y Modificadores
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.4rem' }}>
                Cargar Ejemplos:
              </label>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                {TEXTOS_EJEMPLO.map((t, idx) => (
                  <button
                    key={idx}
                    onClick={() => setTexto(t)}
                    style={{
                      flex: 1, padding: '0.4rem', borderRadius: '6px', border: 'none',
                      background: texto === t ? 'rgba(124, 58, 237, 0.3)' : 'rgba(255,255,255,0.05)',
                      color: texto === t ? '#38bdf8' : '#94a3b8', fontSize: '0.75rem', cursor: 'pointer'
                    }}
                  >
                    Texto #{idx + 1}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
                Editar o Ingresar Texto:
              </label>
              <textarea
                rows={4}
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                style={{
                  width: '100%', padding: '0.75rem', borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)',
                  color: '#f8fafc', fontSize: '0.9rem', outline: 'none'
                }}
              />
            </div>
          </div>
        </div>

        {/* 3. VISUALIZADOR INTERACTIVO */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '1.25rem' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#f8fafc', fontSize: '0.95rem', fontWeight: 700 }}>
            🔍 Resaltado Gramatical Dinámico
          </h4>

          {/* Filtros de categorías */}
          <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setFiltroCategoria('todos')}
              style={{ padding: '0.35rem 0.75rem', borderRadius: '6px', border: 'none', background: filtroCategoria === 'todos' ? '#7c3aed' : 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '0.78rem', cursor: 'pointer' }}
            >
              Todos
            </button>
            <button
              onClick={() => setFiltroCategoria('sustantivo')}
              style={{ padding: '0.35rem 0.75rem', borderRadius: '6px', border: 'none', background: filtroCategoria === 'sustantivo' ? '#06b6d4' : 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '0.78rem', cursor: 'pointer' }}
            >
              Sustantivos ({conteoCategorias['sustantivo'] || 0})
            </button>
            <button
              onClick={() => setFiltroCategoria('verbo')}
              style={{ padding: '0.35rem 0.75rem', borderRadius: '6px', border: 'none', background: filtroCategoria === 'verbo' ? '#34d399' : 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '0.78rem', cursor: 'pointer' }}
            >
              Verbos ({conteoCategorias['verbo'] || 0})
            </button>
            <button
              onClick={() => setFiltroCategoria('adjetivo_adverbio')}
              style={{ padding: '0.35rem 0.75rem', borderRadius: '6px', border: 'none', background: filtroCategoria === 'adjetivo_adverbio' ? '#f59e0b' : 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '0.78rem', cursor: 'pointer' }}
            >
              Modificadores ({conteoCategorias['adjetivo_adverbio'] || 0})
            </button>
          </div>

          {/* Renderizado de palabras interactivas */}
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', lineHeight: 1.8, fontSize: '0.95rem' }}>
            {palabras.map((p, idx) => {
              const cat = clasificarPalabra(p);
              const isActive = filtroCategoria === 'todos' || filtroCategoria === cat;

              let colorBg = 'transparent';
              let colorTxt = '#cbd5e1';
              if (cat === 'sustantivo') { colorBg = 'rgba(6, 182, 212, 0.2)'; colorTxt = '#38bdf8'; }
              if (cat === 'verbo') { colorBg = 'rgba(52, 211, 153, 0.2)'; colorTxt = '#34d399'; }
              if (cat === 'adjetivo_adverbio') { colorBg = 'rgba(245, 158, 11, 0.2)'; colorTxt = '#fbbf24'; }

              return (
                <span
                  key={idx}
                  style={{
                    background: isActive ? colorBg : 'transparent',
                    color: isActive ? colorTxt : '#475569',
                    padding: '0.15rem 0.3rem',
                    borderRadius: '4px',
                    marginRight: '0.3rem',
                    display: 'inline-block',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {p}
                </span>
              );
            })}
          </div>

          {/* Métricas del texto */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', fontSize: '0.8rem', color: '#94a3b8' }}>
            <div>Total Palabras: <strong style={{ color: '#f8fafc' }}>{totalPalabras}</strong></div>
            <div>Oraciones: <strong style={{ color: '#f8fafc' }}>{totalOraciones}</strong></div>
            <div>Promedio por Oración: <strong style={{ color: '#a78bfa' }}>{(totalPalabras / Math.max(1, totalOraciones)).toFixed(1)} palabras</strong></div>
          </div>
        </div>

      </div>

      {/* 4. PREGUNTA DE REFLEXIÓN */}
      <div style={{ background: 'rgba(124, 58, 237, 0.08)', border: '1px solid rgba(124, 58, 237, 0.2)', borderRadius: '16px', padding: '1.25rem' }}>
        <h4 style={{ margin: '0 0 0.5rem 0', color: '#a78bfa', fontSize: '0.95rem', fontWeight: 700 }}>
          🤔 Reflexión Pedagógica
        </h4>
        <p style={{ margin: '0 0 0.85rem 0', fontSize: '0.88rem', color: '#cbd5e1' }}>
          ¿Qué rol cumplen los verbos e hiperónimos en la cohesión y dinamismo del texto analizado?
        </p>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              setReflexion('correct');
              onSaveSession({ totalPalabras, totalOraciones, acierto: true });
            }}
            style={{
              padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid rgba(52, 211, 153, 0.3)',
              background: reflexion === 'correct' ? 'rgba(52, 211, 153, 0.25)' : 'rgba(255,255,255,0.04)',
              color: '#34d399', fontSize: '0.85rem', cursor: 'pointer'
            }}
          >
            ✅ Establecen las acciones principales y otorgan movimiento y estructura lógica a las ideas.
          </button>
          <button
            onClick={() => setReflexion('incorrect')}
            style={{
              padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid rgba(244, 63, 94, 0.3)',
              background: reflexion === 'incorrect' ? 'rgba(244, 63, 94, 0.25)' : 'rgba(255,255,255,0.04)',
              color: '#fb7185', fontSize: '0.85rem', cursor: 'pointer'
            }}
          >
            ❌ Son elementos decorativos prescindibles.
          </button>
        </div>

        {reflexion === 'correct' && (
          <div style={{ marginTop: '0.75rem', color: '#34d399', fontSize: '0.85rem', fontWeight: 600 }}>
            ¡Exacto! Los núcleos verbales articulan la sintaxis y sostienen el sentido global del texto.
          </div>
        )}
      </div>

    </div>
  );
};

export default TextAnalysisSimulator;
