import { BackendPlugin } from '../../plugin_types';
import oportunidadesRoutes from './routes/oportunidades_routes';
import setupOportunidadesDatabase from './database/setup_plugin_db';

export const oportunidadesPlugin: BackendPlugin = {
  manifest: {
    id: 'oportunidades',
    name: 'EduTech Oportunidades — Portal de Pasantías y Proyectos',
    version: '1.0.0',
    description: 'Portal institucional de pasantías formativas, proyectos tecnológicos, investigaciones y becas profesionales.',
    author: 'Equipo EduTech',
    enabled: true,
    baseRoute: '/api/plugins/oportunidades',
  },
  router: oportunidadesRoutes,
  initialize: async () => {
    await setupOportunidadesDatabase();
  },
};

export default oportunidadesPlugin;

