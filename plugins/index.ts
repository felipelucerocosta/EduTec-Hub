import { Express, Router } from 'express';
import { BackendPlugin } from './plugin_types';
import asistenciaPlugin from './asistencia-academica/backend/index';
import aulaActivaPlugin from './aula-activa/backend/index';
import oportunidadesPlugin from './oportunidades/backend/index';

/**
 * Registro Central de Plugins de EduTech-Hub
 * ==========================================
 * Permite registrar e inicializar plugins de forma modular y desacoplada.
 * Cada plugin se monta bajo /api/plugins/<id-del-plugin>
 */
class PluginRegistry {
  private plugins: Map<string, BackendPlugin> = new Map();

  /**
   * Registra un nuevo plugin en el sistema.
   * El segundo desarrollador puede invocar este método para incorporar su complemento.
   */
  public register(plugin: BackendPlugin): void {
    if (this.plugins.has(plugin.manifest.id)) {
      console.warn(`⚠️ Plugin '${plugin.manifest.id}' ya registrado. Se sobrescribirá.`);
    }
    this.plugins.set(plugin.manifest.id, plugin);
    console.log(`🔌 [Plugin Registry] Plugin registrado: ${plugin.manifest.name} v${plugin.manifest.version} [${plugin.manifest.baseRoute}]`);
  }

  /**
   * Inicializa las bases de datos y monta las rutas de todos los plugins habilitados en la app Express.
   */
  public async mountAll(app: Express): Promise<void> {
    console.log('🚀 [Plugin Registry] Inicializando plugins...');

    for (const [id, plugin] of this.plugins.entries()) {
      if (!plugin.manifest.enabled) {
        console.log(`⏸️ [Plugin Registry] Plugin deshabilitado: ${id}`);
        continue;
      }

      try {
        if (plugin.initialize) {
          await plugin.initialize();
        }

        const routePath = `/api/plugins/${plugin.manifest.id}`;
        app.use(routePath, plugin.router);
        console.log(`✅ [Plugin Registry] Plugin montado con éxito en: ${routePath}`);
      } catch (error) {
        console.error(`❌ [Plugin Registry] Error al inicializar plugin '${id}':`, error);
      }
    }
  }

  public getPlugins(): BackendPlugin[] {
    return Array.from(this.plugins.values());
  }
}

export const pluginRegistry = new PluginRegistry();

// Registro por defecto del Plugin 1: Asistencia Académica
pluginRegistry.register(asistenciaPlugin);

// Registro del Plugin 2: Aula Activa
pluginRegistry.register(aulaActivaPlugin);

// Registro del Plugin 3: Oportunidades
pluginRegistry.register(oportunidadesPlugin);

export default pluginRegistry;

