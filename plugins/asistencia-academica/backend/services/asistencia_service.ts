import { AsistenciaModel, EstadoAsistencia, RegistroInput } from '../models/asistencia_model';

const ESTADOS_VALIDOS: EstadoAsistencia[] = ['PRESENTE', 'AUSENTE', 'TARDE', 'JUSTIFICADO'];

export class AsistenciaService {
  /**
   * Valida y procesa la planilla de asistencia enviada por el docente.
   */
  public static async procesarPlanilla(
    claseId: number,
    docenteId: number,
    fecha: string,
    observaciones: string | null,
    registros: RegistroInput[]
  ) {
    // 1. Validar formato de fecha ISO (YYYY-MM-DD)
    if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      throw { status: 400, message: 'La fecha es obligatoria y debe tener formato YYYY-MM-DD' };
    }

    // 2. Validar que la lista de registros no esté vacía
    if (!Array.isArray(registros) || registros.length === 0) {
      throw { status: 400, message: 'La planilla debe contener al menos un registro de estudiante' };
    }

    // 3. Validar cada estado de asistencia
    for (const reg of registros) {
      if (!reg.alumnoId || typeof reg.alumnoId !== 'number') {
        throw { status: 400, message: 'Identificador de alumno inválido en los registros' };
      }
      if (!ESTADOS_VALIDOS.includes(reg.estado)) {
        throw {
          status: 400,
          message: `Estado '${reg.estado}' inválido. Valores permitidos: ${ESTADOS_VALIDOS.join(', ')}`,
        };
      }
    }

    // 4. Persistir la planilla a través del modelo
    const resultado = await AsistenciaModel.guardarPlanilla(
      claseId,
      docenteId,
      fecha,
      observaciones,
      registros
    );

    // 5. Cómputo de resumen
    const resumen = {
      presentes: registros.filter((r) => r.estado === 'PRESENTE').length,
      ausentes: registros.filter((r) => r.estado === 'AUSENTE').length,
      tardes: registros.filter((r) => r.estado === 'TARDE').length,
      justificados: registros.filter((r) => r.estado === 'JUSTIFICADO').length,
    };

    return {
      ...resultado,
      resumen,
    };
  }

  /**
   * Obtiene la planilla de una fecha, con valores por defecto si aún no fue tomada.
   */
  public static async obtenerPlanillaFecha(claseId: number, fecha?: string) {
    const fechaEfectiva = fecha || new Date().toISOString().split('T')[0];
    return await AsistenciaModel.getSesionYRegistros(claseId, fechaEfectiva);
  }
}

export default AsistenciaService;

