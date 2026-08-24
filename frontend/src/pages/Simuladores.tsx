import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components reutilizables/Button';
import { useToast } from '../contexts/ToastContext';

// Import simulators
import EcuacionesSimulator from '../simuladores/matematica/EcuacionesSimulator';
import FuncionesSimulator from '../simuladores/matematica/FuncionesSimulator';
import GeometriaSimulator from '../simuladores/matematica/GeometriaSimulator';
import MetodologiasSimulator from '../simuladores/desarrollo/MetodologiasSimulator';
import TopologiasSimulator from '../simuladores/redes/TopologiasSimulator';

const API_URL = "http://localhost:3001/api";

const Simuladores: React.FC = () => {
  const { claseId } = useParams<{ claseId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [claseInfo, setClaseInfo] = useState<any>(null);
  const [keyword, setKeyword] = useState<string>("general");
  const [simuladores, setSimuladores] = useState<any[]>([]);
  const [selectedTipo, setSelectedTipo] = useState<string>("");

  useEffect(() => {
    fetchSimuladores();
  }, [claseId]);

  const fetchSimuladores = async () => {
    if (!claseId) return;
    setLoading(true);
    try {
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
          clase_id: Number(claseId),
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

  if (loading) {
    return (
      <AppLayout>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <LoadingSkeleton type="card" count={2} />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.25), rgba(56, 189, 248, 0.15))',
          border: '1px solid rgba(124, 58, 237, 0.3)',
          borderRadius: '20px', padding: '1.75rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span className="badge badge-purple">{claseInfo?.materia || "Materia"}</span>
              <span className="badge badge-blue">Categoría: {keyword}</span>
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
              Simuladores Educativos — {claseInfo?.nombre || "Materia"}
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginTop: '0.35rem' }}>
              Entorno interactivo para experimentar y afianzar los contenidos de la materia.
            </p>
          </div>

          <Button variant="outline" onClick={() => navigate(-1)} icon="bx-arrow-back">
            Volver
          </Button>
        </div>

        {simuladores.length === 0 ? (
          <EmptyState
            icon="bx-planet"
            title="Sin simuladores para esta materia"
            description="No hay experiencias interactivas registradas para la materia actual."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Simulator Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem', overflowX: 'auto' }}>
              {simuladores.map((sim) => (
                <button
                  key={sim.tipo}
                  onClick={() => setSelectedTipo(sim.tipo)}
                  style={{
                    padding: '0.65rem 1.25rem', borderRadius: '12px', border: 'none',
                    background: selectedTipo === sim.tipo ? 'rgba(124, 58, 237, 0.25)' : 'transparent',
                    color: selectedTipo === sim.tipo ? '#f8fafc' : '#94a3b8',
                    fontWeight: selectedTipo === sim.tipo ? 700 : 500, fontSize: '0.9rem',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap'
                  }}
                >
                  <i className="bx bx-atom"></i> {sim.nombre}
                </button>
              ))}
            </div>

            {/* Active Simulator Container */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '1.75rem', boxShadow: 'var(--shadow-md)' }}>
              {selectedTipo === 'ecuaciones' && <EcuacionesSimulator onSaveSession={handleSaveSession} />}
              {selectedTipo === 'funciones' && <FuncionesSimulator onSaveSession={handleSaveSession} />}
              {selectedTipo === 'geometria' && <GeometriaSimulator onSaveSession={handleSaveSession} />}
              {selectedTipo === 'metodologias' && <MetodologiasSimulator onSaveSession={handleSaveSession} />}
              {selectedTipo === 'topologias' && <TopologiasSimulator onSaveSession={handleSaveSession} />}
            </div>

          </div>
        )}

      </div>
    </AppLayout>
  );
};

export default Simuladores;
