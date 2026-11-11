# MODELADO UML DEL PLUGIN: ASISTENCIA ACADÉMICA
## EduTech-Hub — Prácticas Profesionalizantes
**Plugin:** `asistencia-academica`  
**Autor:** Integrante 1 (Equipo de Ingeniería de Software)

---

## 1. Diagrama de Casos de Uso (UML Use Case)

### Diagrama en Formato Mermaid
```mermaid
flowchart LR
    subgraph Actores
        Docente["👨‍🏫 Profesor"]
        Estudiante["👨‍🎓 Alumno"]
        Admin["🛡️ Administrador"]
    end

    subgraph EduTechHub_Sistema_Base ["EduTech-Hub (Sistema Base)"]
        CU_Auth(["CU-00: Autenticación & Sesión"])
    end

    subgraph Plugin_Asistencias ["Plugin: Asistencia Académica"]
        CU_TomarAsistencia(["CU-01: Registrar/Actualizar Asistencia de Clase"])
        CU_HistorialDocente(["CU-02: Consultar Fechas e Historial del Curso"])
        CU_VerRegularidad(["CU-03: Consultar Mi Porcentaje de Asistencia"])
        CU_DetalleInasistencias(["CU-04: Ver Detalle de Ausencias y Tardanzas"])
        CU_MonitoreoAdmin(["CU-05: Supervisar Presentismo Institucional por División"])
        CU_HealthCheck(["CU-06: Diagnóstico de Estado y Salud del Plugin"])
        CU_AlertaRegularidad(["CU-07: Emitir Alerta de Pérdida de Regularidad (<75%)"])
    end

    Docente --> CU_TomarAsistencia
    Docente --> CU_HistorialDocente

    Estudiante --> CU_VerRegularidad
    Estudiante --> CU_DetalleInasistencias

    Admin --> CU_MonitoreoAdmin
    Admin --> CU_HealthCheck
    Admin --> CU_TomarAsistencia

    CU_TomarAsistencia -.-> |<<include>>| CU_Auth
    CU_HistorialDocente -.-> |<<include>>| CU_Auth
    CU_VerRegularidad -.-> |<<include>>| CU_Auth
    CU_MonitoreoAdmin -.-> |<<include>>| CU_Auth

    CU_AlertaRegularidad -.-> |<<extend>>| CU_VerRegularidad
```

### Código Fuente PlantUML
```plantuml
@startuml DiagramaCasosDeUso_Asistencias
left to right direction
skinparam packageStyle rectangle
skinparam handwritten false
skinparam monochrome false

actor "Profesor" as Docente
actor "Alumno" as Estudiante
actor "Administrador" as Admin

rectangle "EduTech-Hub (Sistema Base)" {
  usecase "CU-00: Autenticación y Sesión Activa" as CU_Auth
}

rectangle "Plugin: Asistencia Académica" {
  usecase "CU-01: Registrar / Modificar Asistencia de Clase" as CU_01
  usecase "CU-02: Consultar Historial de Fechas de la Comisión" as CU_02
  usecase "CU-03: Consultar Regularidad y % Presentismo" as CU_03
  usecase "CU-04: Ver Detalle de Ausencias y Justificaciones" as CU_04
  usecase "CU-05: Supervisar Presentismo Institucional por División" as CU_05
  usecase "CU-06: Diagnóstico de Estado y Salud (Health Check)" as CU_06
  usecase "CU-07: Alerta de Pérdida de Regularidad (< 75%)" as CU_07
}

Docente --> CU_01
Docente --> CU_02

Estudiante --> CU_03
Estudiante --> CU_04

Admin --> CU_05
Admin --> CU_06
Admin --> CU_01

CU_01 ..> CU_Auth : <<include>>
CU_02 ..> CU_Auth : <<include>>
CU_03 ..> CU_Auth : <<include>>
CU_05 ..> CU_Auth : <<include>>

CU_07 ..> CU_03 : <<extend>>

@enduml
```

---

## 2. Diagrama de Secuencia (UML Sequence)

Representa la operación crítica y principal del plugin: **Registro Idempotente de Asistencia de Clase por parte del Profesor**.

### Diagrama en Formato Mermaid
```mermaid
sequenceDiagram
    autonumber
    actor Prof as Profesor (Navegador)
    participant UI as AsistenciaDocenteView (Frontend)
    participant API as asistencia_api.ts
    participant Router as asistencia_routes.ts
    participant Auth as asistencia_auth.ts (Middleware)
    participant Ctrl as asistencia_controller.ts
    participant Svc as asistencia_service.ts
    participant Model as asistencia_model.ts
    participant DB as SQLite (edutechhub.sql)

    Prof->>UI: Completa planilla de asistencia y presiona "Guardar Asistencia"
    UI->>API: guardarAsistencia(claseId, { fecha, registros, observaciones })
    API->>Router: POST /api/plugins/asistencia-academica/clases/:claseId
    
    Router->>Auth: verificarAutenticacion(req, res, next)
    alt Sesión no válida o no autenticado
        Auth-->>API: 401 Unauthorized { error: 'No autenticado' }
        API-->>UI: Muestra notificación de error y redirige a login
    end

    Auth->>Auth: verificarPermisoDocenteEnClase(usuario, claseId)
    alt Docente no asignado a esta clase
        Auth-->>API: 403 Forbidden { error: 'Acceso no autorizado a esta comisión' }
        API-->>UI: Muestra alerta de acceso denegado
    end

    Auth->>Ctrl: registrarAsistencia(req, res)
    Ctrl->>Svc: procesarPlanilla(claseId, docenteId, fecha, registros)
    
    Svc->>Svc: Validar fecha ISO y estados normados (PRESENTE, AUSENTE, TARDE, JUSTIFICADO)
    
    Svc->>Model: guardarSesionYRegistros(claseId, docenteId, fecha, registros)
    
    Model->>DB: BEGIN TRANSACTION;
    Model->>DB: INSERT INTO plugin_asistencias_sesiones ... ON CONFLICT(clase_id, fecha) DO UPDATE
    Model->>DB: INSERT INTO plugin_asistencias_registros ... ON CONFLICT(sesion_id, alumno_id) DO UPDATE
    Model->>DB: COMMIT;
    
    DB-->>Model: Transacción confirmada (changes > 0)
    Model-->>Svc: Objeto de sesión guardada con IDs y cómputos
    Svc-->>Ctrl: { sesionId, fecha, totalPresentes, totalAusentes, totalTardes, totalJustificados }
    Ctrl-->>Router: HTTP 200 OK
    Router-->>API: JSON { success: true, data: { ... } }
    API-->>UI: Promesa resuelta exitosamente
    UI->>Prof: Toast de confirmación "Asistencia guardada correctamente" + Actualización de métricas
```

### Código Fuente PlantUML
```plantuml
@startuml DiagramaSecuencia_GuardarAsistencia
autonumber
actor "Profesor" as Prof
boundary "AsistenciaDocenteView\n(React UI)" as UI
control "asistencia_api.ts\n(Client)" as API
control "asistencia_routes.ts\n(Express Router)" as Router
control "asistencia_auth.ts\n(Middleware)" as Auth
control "asistencia_controller.ts\n(Controller)" as Ctrl
entity "asistencia_service.ts\n(Service)" as Svc
entity "asistencia_model.ts\n(Model)" as Model
database "SQLite Database\n(edutechhub.sql)" as DB

Prof -> UI : Selecciona fecha y marca estados (Presente, Ausente, etc.)
Prof -> UI : Click en "Guardar Asistencia"
UI -> API : guardarAsistencia(claseId, payload)
API -> Router : POST /api/plugins/asistencia-academica/clases/:claseId

Router -> Auth : validarSesion(req)
alt No autenticado
    Auth --> Router : 401 Unauthorized
    Router --> API : HTTP 401 JSON
    API --> UI : Error: Sesión expirada
end

Router -> Auth : verificarDocenteEnClase(userId, claseId)
alt Usuario no es titular ni admin
    Auth --> Router : 403 Forbidden
    Router --> API : HTTP 403 JSON
    API --> UI : Error: Permiso denegado
end

Auth -> Ctrl : registrarAsistencia(req, res)
Ctrl -> Svc : procesarPlanilla(claseId, userId, fecha, registros)
Svc -> Svc : Validar campos y formato de estados

Svc -> Model : persistirAsistencia(claseId, fecha, registros)
Model -> DB : BEGIN TRANSACTION
Model -> DB : UPSERT plugin_asistencias_sesiones
Model -> DB : UPSERT plugin_asistencias_registros (por cada alumno)
Model -> DB : COMMIT
DB --> Model : Transacción OK

Model --> Svc : Datos de sesión consolidada
Svc --> Ctrl : Resumen estadístico ({presentes, ausentes, etc.})
Ctrl --> Router : HTTP 200 { success: true, data: ... }
Router --> API : Response JSON
API --> UI : Actualizar estado y métricas
UI --> Prof : Feedback visual (Toast verde + Badge de porcentaje)

@enduml
```

