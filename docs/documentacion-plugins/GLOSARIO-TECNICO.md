# Glosario Técnico y Pedagógico (TECH-ROOM 29)

Este glosario fue elaborado para vincular los conceptos teóricos de ingeniería de software y programación web con su implementación concreta dentro de los plugins de **EduTec-Hub**.

---

## 1. Conceptos de Arquitectura y Redes

### Arquitectura Cliente-Servidor (Client-Server)
- **Concepto Teórico**: Modelo de diseño de software en el que las tareas se reparten entre los proveedores de recursos o servicios, llamados servidores, y los demandantes, llamados clientes.
- **Implementación en el Proyecto**:
  - *Cliente*: La aplicación React que corre en el navegador web del usuario (en [frontend/](file:///c:/Users/marti/EduTec-Hub/frontend/) y en las carpetas `frontend/` de los plugins).
  - *Servidor*: La aplicación Node.js/Express escuchando peticiones en el puerto 5000 o configurado (en [backend/](file:///c:/Users/marti/EduTec-Hub/backend/) y `backend/` de los plugins).

---

### API REST (Representational State Transfer)
- **Concepto Teórico**: Estilo de arquitectura de software para sistemas hipermedia distribuidos. Utiliza el protocolo HTTP estándar, URLs representativas de recursos y formatos de intercambio universales (como JSON).
- **Implementación en el Proyecto**:
  - Los plugins exponen recursos mediante sustantivos plurales:
    - `/api/plugins/edutech-preceptoria/clases` (Comisiones).
    - `/api/plugins/edutech-preceptoria/constancias` (Constancias escolares).
    - `/api/plugins/edutech-oportunidades/oportunidades` (Convocatorias).
    - `/api/plugins/edutech-oportunidades/mis-postulaciones` (Postulaciones del alumno).

---

### Métodos HTTP y Semántica REST
- **`GET`**: Solicitud de lectura de recursos sin efectos secundarios en el servidor.
  - *Ejemplo*: `GET /api/plugins/edutech-preceptoria/mi-asistencia` para que el alumno lea sus asistencias.
- **`POST`**: Creación de nuevos recursos o desencadenamiento de acciones procesables.
  - *Ejemplo*: `POST /api/plugins/edutech-oportunidades/oportunidades` para publicar una pasantía.
- **`PUT`**: Reemplazo o actualización completa de un recurso.
  - *Ejemplo*: `PUT /api/plugins/edutech-preceptoria/constancias/:id` para aprobar o rechazar un certificado.
- **`DELETE`**: Eliminación o revocación de un recurso.
  - *Ejemplo*: `DELETE /api/plugins/edutech-oportunidades/postulaciones/:id` para cancelar una postulación.

---

### Códigos de Estado HTTP (Status Codes)
- **`200 OK`**: Petición resuelta satisfactoriamente (ej. consulta de asistencia).
- **`201 Created`**: Creación exitosa de un recurso nuevo (ej. postulación registrada).
- **`400 Bad Request`**: Datos incompletos o inválidos enviados por el cliente (ej. faltan vacantes o fecha de cierre).
- **`401 Unauthorized`**: Falta de autenticación; el usuario no ha iniciado sesión.
- **`403 Forbidden`**: El usuario está autenticado pero no tiene permisos para esa operación (ej. un alumno intentando tomar asistencia de una clase).
- **`404 Not Found`**: El recurso solicitado no existe (ej. oportunidad inexistente).
- **`500 Internal Server Error`**: Excepción no controlada o fallo imprevisto en la base de datos.

---

## 2. Conceptos de Backend y Bases de Datos

### SQL Parametrizado (Prepared Statements)
- **Concepto Teórico**: Técnica para ejecutar sentencias SQL de forma precompilada, donde los datos proporcionados por el usuario se envían por separado como parámetros y nunca se concatenan directamente en la cadena de texto de la consulta. Previene de forma absoluta los ataques de **Inyección SQL (SQL Injection)**.
- **Implementación en el Proyecto**:
  - En [preceptoria_service.ts](file:///c:/Users/marti/EduTec-Hub/plugins/edutech-preceptoria/backend/services/preceptoria_service.ts):
    ```typescript
    await pool.query(
      'SELECT id FROM preceptores_clases WHERE preceptor_id = $1 AND clase_id = $2',
      [usuario.id, claseId]
    );
    ```

---

### Transacciones ACID (Atomicidad, Consistencia, Aislamiento, Durabilidad)
- **Concepto Teórico**: Conjunto de operaciones sobre la base de datos que se ejecutan como una única unidad lógica e indivisible. Si alguna operación falla, todas las operaciones intermedias se cancelan (Rollback), impidiendo que la base de datos quede en un estado corrupto o inconsistente.
- **Implementación en el Proyecto**:
  - Al tomar asistencia en `PreceptoriaService.guardarAsistencia`:
    Se inicia con `BEGIN`, se guarda la sesión de la comisión, se insertan los registros de todos los estudiantes y finalmente se ejecuta `COMMIT`. Si falla un registro, nada se almacena a medias.

---

### Claves Foráneas e Integridad Referencial (Foreign Keys & Cascading)
- **Concepto Teórico**: Restricción que vincula una columna de una tabla con la clave primaria de otra, garantizando que no existan registros "huérfanos". La cláusula `ON DELETE CASCADE` asegura que, si el registro padre se elimina, sus dependientes se supriman automáticamente.
- **Implementación en el Proyecto**:
  - En `plugin_oportunidades_postulaciones`:
    ```sql
    FOREIGN KEY(oportunidad_id) REFERENCES plugin_oportunidades(id) ON DELETE CASCADE
    ```
    Si una empresa elimina una pasantía, se borran automáticamente todas las postulaciones asociadas sin dejar registros inconsistentes en la base de datos.

---

### Control de Acceso Basado en Roles (RBAC - Role-Based Access Control)
- **Concepto Teórico**: Mecanismo de seguridad en el que los permisos para realizar ciertas operaciones se asignan a roles institucionales específicos en lugar de a usuarios individuales.
- **Implementación en el Proyecto**:
  - Roles activos: `alumno`, `profesor`, `preceptor`, `admin`.
  - El middleware `requireExclusivoPreceptor` garantiza que solo usuarios con `rol === 'preceptor'` puedan manipular las planillas de asistencia.

---

### WebSockets y Arquitectura Dirigida por Eventos (Event-Driven)
- **Concepto Teórico**: Protocolo de comunicación bidireccional y persistente sobre una única conexión TCP. Permite al servidor enviar datos al cliente en el mismo milisegundo en que ocurren (Push), sin que el cliente tenga que estar consultando periódicamente (Polling).
- **Implementación en el Proyecto**:
  - Implementado mediante `Socket.IO` en [socket_bus.ts](file:///c:/Users/marti/EduTec-Hub/backend/socket_bus.ts).
  - Cuando el preceptor asienta una falta, el servidor ejecuta `emitToUser(alumnoId, 'attendance:recorded')`, provocando que el navegador del estudiante actualice sus métricas en vivo.

---

## 3. Conceptos de Frontend y React

### Componentes y Estado React (State & Hooks)
- **`useState`**: Hook para almacenar datos reactivos locales dentro de un componente. Cuando el estado cambia, React vuelve a renderizar la vista automáticamente.
  - *Ejemplo*: `const [claseSeleccionada, setClaseSeleccionada] = useState<number | null>(null);`
- **`useEffect`**: Hook para gestionar efectos secundarios, como la carga inicial de datos desde la API al montar el componente en pantalla.
  - *Ejemplo*: `useEffect(() => { cargarClases(); }, []);`
- **Context API (`useAuth`)**: Mecanismo de React para compartir información global (en este caso, la identidad y rol del usuario logueado) a lo largo de todo el árbol de componentes sin necesidad de pasar *props* manualmente en cada nivel.

---

### Encapsulamiento de Estilos (CSS Modules)
- **Concepto Teórico**: Técnica de compilación donde cada archivo de estilos `.module.css` tiene alcance local (*scoped*). Las clases se transforman en identificadores únicos (ej. `preceptoria_container__x9f2a`), evitando colisiones de nombres con el resto de la aplicación.
- **Implementación en el Proyecto**:
  - [plugins/edutech-preceptoria/frontend/styles/preceptoria.module.css](file:///c:/Users/marti/EduTec-Hub/plugins/edutech-preceptoria/frontend/styles/preceptoria.module.css)
  - [plugins/edutech-oportunidades/frontend/styles/oportunidades.module.css](file:///c:/Users/marti/EduTec-Hub/plugins/edutech-oportunidades/frontend/styles/oportunidades.module.css)
