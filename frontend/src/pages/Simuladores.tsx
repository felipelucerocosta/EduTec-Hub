import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components reutilizables/Button';
import { useToast } from '../contexts/ToastContext';
import { getSimulatorComponent } from '../simuladores/SimulatorRegistry';
import { API_URL } from '../config/api';

const Simuladores: React.FC = () => {
  const { claseId } = useParams<{ claseId?: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [claseInfo, setClaseInfo] = useState<any>(null);
  const [keyword, setKeyword] = useState<string>("general");
  const [simuladores, setSimuladores] = useState<any[]>([]);
  const [selectedCategoria, setSelectedCategoria] = useState<string>("todas");
  const [selectedTipo, setSelectedTipo] = useState<string>("");

  useEffect(() => {
    fetchSimuladores();
  }, [claseId]);

  const fetchSimuladores = async () => {
    setLoading(true);
    try {
      if (claseId) {
        // Modo específico por clase
        const res = await fetch(`${API_URL}/simuladores/${claseId}`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setClaseInfo(data.clase);
          setKeyword(data.keyword);
          const list = data.simuladores || [];
          setSimuladores(list);
          if (list.length > 0) {
            setSelectedTipo(list[0].tipo);
          }
        } else {
          showToast("Error al cargar simuladores de la materia.", "error");
        }
      } else {
        // Catálogo general de simuladores
        const res = await fetch(`${API_URL}/simuladores`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setClaseInfo(null);
          setKeyword("general");
          const list = data.simuladores || [];
          setSimuladores(list);
          if (list.length > 0) {
            setSelectedTipo(list[0].tipo);
          }
        } else {
          showToast("Error al cargar catálogo de simuladores.", "error");
        }
      }
    } catch (err) {
      console.error(err);
      showToast("Error de conexión al obtener simuladores.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSession = async (datosSesion: any) => {
    try {
      const res = await fetch(`${API_URL}/simuladores/sesion`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          simulador_tipo: selectedTipo,
          clase_id: claseId ? Number(claseId) : null,
          datos_sesion: datosSesion,
          duracion_segundos: 60,
        }),
      });
      if (res.ok) {
        showToast("¡Experiencia registrada correctamente en tu historial!", "success");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredSimuladores = selectedCategoria === 'todas'
    ? simuladores
    : simuladores.filter(s => s.categoria === selectedCategoria);

  const activeSim = simuladores.find(s => s.tipo === selectedTipo);
  const ActiveComponent = getSimulatorComponent(selectedTipo);

  if (loading) {
    return (
      <AppLayout>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '1rem' }}>
          <LoadingSkeleton type="card" count={2} />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div style={{ maxWidth: '1140px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1rem 0' }}>
        
        {/* Header Hero */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.22), rgba(56, 189, 248, 0.12))',
          border: '1px solid rgba(124, 58, 237, 0.3)',
          borderRadius: '20px',
          padding: '1.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
              <span className="badge badge-purple" style={{ padding: '4px 10px', borderRadius: '50px', background: 'rgba(124, 58, 237, 0.3)', color: '#c4b5fd', fontSize: '0.75rem', fontWeight: 700 }}>
                {claseInfo ? `${claseInfo.materia} · ${keyword}` : "Laboratorio Virtual"}
              </span>
              <span className="badge badge-blue" style={{ padding: '4px 10px', borderRadius: '50px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', fontSize: '0.75rem', fontWeight: 600 }}>
                {claseInfo ? `Materia: ${claseInfo.nombre}` : `Catálogo General · ${simuladores.length} Experiencias`}
              </span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', margin: 0, fontFamily: 'var(--font-family-display)' }}>
              {claseInfo ? `Simuladores — ${claseInfo.nombre}` : "Simuladores Educativos Interactivos"}
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.4rem', maxWidth: '650px', margin: '0.4rem 0 0 0' }}>
              {claseInfo
                ? "Entorno interactivo para experimentar y afianzar los conceptos prácticos de la materia."
                : "Explora los laboratorios virtuales de matemática, física, circuitos, topologías de redes y metodologías de software."}
            </p>
          </div>

          <Button variant="outline" onClick={() => navigate(-1)} icon="bx-arrow-back">
            Volver
          </Button>
        </div>

        {/* Categorías (si es catálogo general sin clase específica) */}
        {!claseId && (
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
            {[
              { id: 'todas', label: 'Todas las Áreas', icon: 'bx-layer' },
              { id: 'matematica', label: 'Matemática', icon: 'bx-math' },
              { id: 'redes', label: 'Redes', icon: 'bx-network-chart' },
              { id: 'desarrollo', label: 'Desarrollo', icon: 'bx-code-alt' },
              { id: 'lengua', label: 'Lengua', icon: 'bx-book-content' },
              { id: 'ciencia', label: 'Física y Circuitos', icon: 'bx-bulb' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategoria(cat.id);
                  const inCat = cat.id === 'todas' ? simuladores : simuladores.filter(s => s.categoria === cat.id);
                  if (inCat.length > 0 && !inCat.some(s => s.tipo === selectedTipo)) {
                    setSelectedTipo(inCat[0].tipo);
                  }
                }}
                style={{
                  padding: '0.55rem 1rem',
                  borderRadius: '10px',
                  border: '1px solid',
                  borderColor: selectedCategoria === cat.id ? '#7929d2' : 'rgba(255, 255, 255, 0.08)',
                  background: selectedCategoria === cat.id ? 'rgba(121, 41, 210, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                  color: selectedCategoria === cat.id ? '#ffffff' : '#a9a3c7',
                  fontWeight: selectedCategoria === cat.id ? 700 : 500,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                <i className={`bx ${cat.icon}`}></i> {cat.label}
              </button>
            ))}
          </div>
        )}

        {filteredSimuladores.length === 0 ? (
          <EmptyState
            icon="bx-planet"
            title="Sin simuladores disponibles"
            description="No hay experiencias interactivas registradas para la categoría seleccionada."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Simuladores Tabs */}
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              paddingBottom: '0.75rem',
              overflowX: 'auto'
            }}>
              {filteredSimuladores.map((sim) => (
                <button
                  key={sim.tipo}
                  onClick={() => setSelectedTipo(sim.tipo)}
                  style={{
                    padding: '0.65rem 1.15rem',
                    borderRadius: '12px',
                    border: '1px solid',
                    borderColor: selectedTipo === sim.tipo ? 'rgba(121, 41, 210, 0.5)' : 'rgba(255, 255, 255, 0.06)',
                    background: selectedTipo === sim.tipo ? 'rgba(124, 58, 237, 0.28)' : 'rgba(13, 18, 34, 0.6)',
                    color: selectedTipo === sim.tipo ? '#f8fafc' : '#94a3b8',
                    fontWeight: selectedTipo === sim.tipo ? 700 : 500,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <i className="bx bx-atom" style={{ color: selectedTipo === sim.tipo ? '#55ddf5' : '#7929d2' }}></i>
                  {sim.nombre}
                </button>
              ))}
            </div>

            {/* Sim Info Banner */}
            {activeSim && (
              <div style={{
                background: 'rgba(121, 41, 210, 0.1)',
                border: '1px solid rgba(121, 41, 210, 0.2)',
                borderRadius: '12px',
                padding: '0.85rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <i className="bx bx-info-circle" style={{ fontSize: '1.3rem', color: '#55ddf5', flexShrink: 0 }}></i>
                <div>
                  <span style={{ fontWeight: 700, color: '#f3f0ff', fontSize: '0.9rem' }}>{activeSim.nombre}: </span>
                  <span style={{ color: '#a9a3c7', fontSize: '0.85rem' }}>{activeSim.descripcion}</span>
                </div>
              </div>
            )}

            {/* Active Simulator Container */}
            <div style={{
              background: '#0d1222',
              border: '1px solid rgba(151, 71, 255, 0.15)',
              borderRadius: '20px',
              padding: '1.75rem',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
              minHeight: '400px'
            }}>
              {ActiveComponent ? (
                <ActiveComponent onSaveSession={handleSaveSession} />
              ) : (
                <EmptyState
                  icon="bx-error"
                  title="Simulador en preparación"
                  description="El laboratorio para esta sección se encuentra en proceso de implementación."
                />
              )}
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
};

export default Simuladores;
