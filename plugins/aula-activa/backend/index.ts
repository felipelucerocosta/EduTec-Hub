import { BackendPlugin } from '../../plugin_types';
import aulaActivaRoutes from './routes/aula_activa_routes';
import setupAulaActivaDatabase from './database/setup_plugin_db';

export const aulaActivaPlugin: BackendPlugin = {
  manifest: {
    id: 'aula-activa',
    name: 'Aula Activa — Gestión Interactiva de Tareas',
    version: '1.0.0',
    description: 'Plugin de gestión de trabajos, entregas, correcciones pedagógicas y consultas interactivas para clases de EduTech.',
    author: 'Equipo EduTech',
    enabled: true,
    baseRoute: '/api/plugins/aula-activa',
  },
  router: aulaActivaRoutes,
  initialize: async () => {
    await setupAulaActivaDatabase();
  },
};

export default aulaActivaPlugin;

