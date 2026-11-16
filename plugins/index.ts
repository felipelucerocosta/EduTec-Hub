/**
 * ============================================================================
 * ARCHIVO: plugins/index.ts
 * PROYECTO: EduTec-Hub / TECH-ROOM 29
 * ROL ARQUITECTURAL: Registro Central y Gestor de Ciclo de Vida de Plugins
 * ============================================================================
 * 
 * PROPÓSITO:
 * Este archivo implementa el patrón "Microkernel / Plugin Architecture".
 * Su responsabilidad es desacoplar los módulos complementarios del núcleo central:
 * 1. Mantiene el catálogo en memoria de plugins disponibles.
 * 2. Ejecuta ordenadamente la inicialización de bases de datos de cada plugin.
 * 3. Monta los enrutadores de Express bajo prefijos HTTP seguros y aislados:
 *    /api/plugins/<id-plugin>
 * 4. Garantiza resiliencia: si un plugin falla al arrancar, atrapa la excepción
 *    sin interrumpir la operatividad del resto de la plataforma.
 */

import { Express } from 'express';
import { BackendPlugin } from './plugin_types';
import preceptoriaPlugin from './edutech-preceptoria/backend/index';
import oportunidadesPlugin from './edutech-oportunidades/backend/index';

/**
 * Clase que centraliza la administración de todos los plugins del backend.
 */
class PluginRegistry {
  /**
   * Mapa en memoria donde la clave es el manifest.id único y el valor es el objeto BackendPlugin.
   */
  private plugins: Map<string, BackendPlugin> = new Map();

  /**
   * Registra un nuevo plugin en el catálogo del sistema.
   * 
   * @param plugin Objeto que implementa la interfaz BackendPlugin
   */
  public register(plugin: BackendPlugin): void {
    if (this.plugins.has(plugin.manifest.id)) {
      console.warn(`⚠️ [Plugin Registry] Plugin '${plugin.manifest.id}' ya registrado. Se sobrescribirá.`);
    }
    this.plugins.set(plugin.manifest.id, plugin);
    console.log(`🔌 [Plugin Registry] Plugin registrado: ${plugin.manifest.name} v${plugin.manifest.version} [${plugin.manifest.baseRoute}]`);
  }

  /**
   * Inicializa esquemas de base de datos y monta los routers en la aplicación Express.
   * Este método es invocado por `backend/server.ts` durante el arranque del servidor.
   * 
   * @param app Instancia principal de Express
   */
  public async mountAll(app: Express): Promise<void> {
    console.log('🚀 [Plugin Registry] Inicializando plugins...');

    // Convertir a Array para iteración compatible sin depender de downlevelIteration
    const pluginList = Array.from(this.plugins.values());
    
    for (const plugin of pluginList) {
      const id = plugin.manifest.id;

      // Si el plugin fue deshabilitado mediante configuración, se omite de forma segura
      if (!plugin.manifest.enabled) {
        console.log(`⏸️ [Plugin Registry] Plugin deshabilitado: ${id}`);
        continue;
      }

      try {
        // 1. Ejecutar script de migraciones e inicialización de tablas DDL
        if (plugin.initialize) {
          await plugin.initialize();
        }

        // 2. Montar el enrutador de Express bajo el prefijo aislado
        const routePath = `/api/plugins/${plugin.manifest.id}`;
        app.use(routePath, plugin.router);
        console.log(`✅ [Plugin Registry] Plugin montado con éxito en: ${routePath}`);
      } catch (error) {
        // Captura defensiva de errores: el fallo de un plugin no derriba el servidor
        console.error(`❌ [Plugin Registry] Error al inicializar plugin '${id}':`, error);
      }
    }
  }

  /**
   * Retorna la lista de todos los plugins registrados para introspección o telemetría.
   */
  public getPlugins(): BackendPlugin[] {
    return Array.from(this.plugins.values());
  }
}

// Instancia única (Singleton) compartida en toda la aplicación
export const pluginRegistry = new PluginRegistry();

// ----------------------------------------------------------------------------
// REGISTRO DE PLUGINS OFICIALES DEL SISTEMA
// ----------------------------------------------------------------------------

// Plugin 1: EduTech Preceptoría — Control Exclusivo de Asistencia y Regularidad
pluginRegistry.register(preceptoriaPlugin);

// Plugin 2: EduTech Oportunidades — Portal de Pasantías, Becas y Proyectos
pluginRegistry.register(oportunidadesPlugin);

export default pluginRegistry;
