import { BackendPlugin } from '../../plugin_types';
import asistenciaRoutes from './routes/asistencia_routes';
import setupAsistenciaDatabase from './database/setup_plugin_db';

export const asistenciaPlugin: BackendPlugin = {
  manifest: {
    id: 'asistencia-academica',
    name: 'Asistencia y Regularidad Académica',
    version: '1.0.0',
    description: 'Control de presentismo escolar, cómputo de regularidad y alertas tempranas para E.E.S.T. N° 29',
    author: 'Equipo de Prácticas Profesionalizantes',
    enabled: true,
    baseRoute: '/api/plugins/asistencia-academica',
  },
  router: asistenciaRoutes,
  initialize: async () => {
    await setupAsistenciaDatabase();
  },
};

export default asistenciaPlugin;

