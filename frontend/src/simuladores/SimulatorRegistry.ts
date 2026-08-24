import React from 'react';

// Modular Simulator Imports
import EcuacionesSimulator from './matematica/EcuacionesSimulator';
import FuncionesSimulator from './matematica/FuncionesSimulator';
import GeometriaSimulator from './matematica/GeometriaSimulator';
import ProbabilidadSimulator from './matematica/ProbabilidadSimulator';

import MetodologiasSimulator from './desarrollo/MetodologiasSimulator';
import ProyectosEvolutionSimulator from './desarrollo/ProyectosEvolutionSimulator';

import TopologiasSimulator from './redes/TopologiasSimulator';
import DireccionamientoSimulator from './redes/DireccionamientoSimulator';

import TextAnalysisSimulator from './lengua/TextAnalysisSimulator';
import FisicaCircuitosSimulator from './ciencia/FisicaCircuitosSimulator';

export interface SimulatorProps {
  onSaveSession: (datosSesion: any) => void;
}

// Extensible Registry mapping simulator 'tipo' to React component
export const SIMULATOR_REGISTRY: Record<string, React.FC<SimulatorProps>> = {
  // Matemática
  ecuaciones: EcuacionesSimulator as React.FC<SimulatorProps>,
  funciones: FuncionesSimulator as React.FC<SimulatorProps>,
  geometria: GeometriaSimulator as React.FC<SimulatorProps>,
  probabilidad: ProbabilidadSimulator as React.FC<SimulatorProps>,

  // Desarrollo de Sistemas
  metodologias: MetodologiasSimulator as React.FC<SimulatorProps>,
  proyectos_evolucion: ProyectosEvolutionSimulator as React.FC<SimulatorProps>,
  ciclo_vida: ProyectosEvolutionSimulator as React.FC<SimulatorProps>,

  // Redes
  topologias: TopologiasSimulator as React.FC<SimulatorProps>,
  direccionamiento: DireccionamientoSimulator as React.FC<SimulatorProps>,

  // Lengua / Prácticas del Lenguaje
  analisis_textual: TextAnalysisSimulator as React.FC<SimulatorProps>,

  // Ciencia y Tecnología / Física / Electrónica
  fisica_circuitos: FisicaCircuitosSimulator as React.FC<SimulatorProps>,
};

/**
 * Obtener el componente registrado para un tipo de simulador.
 */
export function getSimulatorComponent(tipo: string): React.FC<SimulatorProps> | null {
  return SIMULATOR_REGISTRY[tipo] || null;
}
