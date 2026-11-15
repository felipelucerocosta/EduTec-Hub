import { BackendPlugin } from '../../plugin_types';
import preceptoriaRoutes from './routes/preceptoria_routes';
import setupPreceptoriaDatabase from './database/setup_plugin_db';

export const preceptoriaPlugin: BackendPlugin = {
  manifest: {
    id: 'edutech-preceptoria',
    name: 'EduTech Preceptoría — Control Exclusivo de Asistencia',
    version: '1.0.0',
    description: 'Gestión exclusiva de toma y control de asistencia escolar para preceptores asignados.',
    author: 'Equipo EduTech',
    enabled: true,
    baseRoute: '/api/plugins/edutech-preceptoria',
  },
  router: preceptoriaRoutes,
  initialize: async () => {
    await setupPreceptoriaDatabase();
  },
};

export default preceptoriaPlugin;

