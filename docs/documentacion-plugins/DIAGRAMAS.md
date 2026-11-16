# Diagramas Técnicos de los Plugins (TECH-ROOM 29)

Este documento recopila los diagramas visuales en formato **Mermaid** que describen la arquitectura, la base de datos y la comunicación de los plugins **EduTech Preceptoría** y **EduTech Oportunidades**.

---

## 1. Diagrama General de Arquitectura de la Plataforma

Muestra cómo los plugins se acoplan al núcleo de **EduTec-Hub** de forma no invasiva:

```mermaid
graph TD
    subgraph Cliente ["Cliente (Frontend React)"]
        UI_Core["EduTec-Hub Core (Dashboard, Clases, Admin)"]
        UI_Precep["Plugin Preceptoría (PreceptoriaPage, Asistencias)"]
        UI_Oport["Plugin Oportunidades (OportunidadesPage, Postulaciones)"]
    end

    subgraph Red ["Capa de Comunicación"]
        HTTP["Peticiones HTTP REST (Fetch API)"]
        WS["Eventos en Tiempo Real (Socket.IO)"]
    end

    subgraph Servidor ["Servidor Backend (Node.js & Express)"]
        CoreServer["server.ts (Express App & Sockets)"]
        Registry["PluginRegistry (plugins/index.ts)"]
        
        subgraph Sub_Preceptoria ["Módulo edutech-preceptoria"]
            Routes_P["preceptoria_routes.ts"]
            Auth_P["preceptoria_auth.ts"]
            Ctrl_P["preceptoria_controller.ts"]
            Srv_P["preceptoria_service.ts"]
        end

        subgraph Sub_Oportunidades ["Módulo edutech-oportunidades"]
            Routes_O["oportunidades_routes.ts"]
            Ctrl_O["oportunidades_controller.ts"]
            Srv_O["oportunidades_service.ts"]
            Mail_O["email_service.ts"]
        end
    end

    subgraph Datos ["Capa de Persistencia"]
        DB[("Base de Datos Canónica SQLite (edutechhub.sql)")]
    end

    UI_Core --> HTTP
    UI_Precep --> HTTP
    UI_Oport --> HTTP

    HTTP --> CoreServer
    WS <--> CoreServer

    CoreServer --> Registry
    Registry --> Routes_P
    Registry --> Routes_O

    Routes_P --> Auth_P --> Ctrl_P --> Srv_P
    Routes_O --> Ctrl_O --> Srv_O
    Srv_O --> Mail_O

    Srv_P --> DB
    Srv_O --> DB
    CoreServer --> DB
```

> **Interpretación:**
> Los plugins no modifican los archivos principales del servidor. El archivo `server.ts` solo invoca a `PluginRegistry`, que monta dinámicamente las rutas bajo `/api/plugins/edutech-preceptoria` y `/api/plugins/edutech-oportunidades`. Ambos plugins comparten el bus de WebSockets y la base de datos central.

---

## 2. Diagrama Entidad-Relación (Base de Datos)

Muestra las tablas introducidas por los plugins y cómo se relacionan con las tablas del sistema central (`usuarios` y `clases`):

```mermaid
erDiagram
    usuarios ||--o{ preceptores_clases : "es asignado como preceptor"
    clases ||--o{ preceptores_clases : "tiene preceptor asignado"

    clases ||--o{ plugin_preceptoria_sesiones : "registra jornada de"
    usuarios ||--o{ plugin_preceptoria_sesiones : "asentada por preceptor"

    plugin_preceptoria_sesiones ||--|{ plugin_preceptoria_registros : "contiene registros de"
    usuarios ||--o{ plugin_preceptoria_registros : "asistencia de alumno"

    usuarios ||--o{ plugin_preceptoria_constancias : "solicita constancia"
    usuarios ||--o{ plugin_preceptoria_constancias : "resuelta por preceptor"
    clases ||--o{ plugin_preceptoria_constancias : "pertenece a comision"

    usuarios ||--o{ plugin_asistencias_docentes : "asistencia de profesor"

    usuarios ||--o{ plugin_oportunidades : "publicada por responsable"
    plugin_oportunidades ||--o{ plugin_oportunidades_postulaciones : "recibe postulaciones"
    usuarios ||--o{ plugin_oportunidades_postulaciones : "postulacion de alumno"

    usuarios {
        int id_usuario PK
        string nombre_completo
        string correo
        string rol
        string DNI
        string estado_acceso
    }

    clases {
        int id PK
        string nombre
        string seccion
        string materia
        string codigo
    }

    preceptores_clases {
        int id PK
        int preceptor_id FK
        int clase_id FK
        datetime fecha_asignacion
    }

    plugin_preceptoria_sesiones {
        int id PK
        int clase_id FK
        string fecha
        int preceptor_id FK
        string observaciones
    }

    plugin_preceptoria_registros {
        int id PK
        int sesion_id FK
        int alumno_id FK
        string estado
        string observacion
    }

    plugin_preceptoria_constancias {
        int id PK
        int alumno_id FK
        int preceptor_id FK
        string motivo
        string estado
        string codigo_verificacion
    }

    plugin_asistencias_docentes {
        int id PK
        int profesor_id FK
        string fecha
        string estado
        string motivo
    }

    plugin_oportunidades {
        int id PK
        string titulo
        string institucion
        string categoria
        int vacantes_totales
        int vacantes_ocupadas
        date fecha_cierre_inscripcion
        int responsable_id FK
        string estado
    }

    plugin_oportunidades_postulaciones {
        int id PK
        int oportunidad_id FK
        int alumno_id FK
        string presentacion
        string motivacion
        string estado
        string notas_responsable
    }
```

> **Interpretación:**
> Las entidades centrales (`usuarios` y `clases`) se mantienen intactas. Los plugins agregan tablas especializadas con claves foráneas en cascada (`ON DELETE CASCADE`), garantizando que si un estudiante o clase se desactiva, los registros vinculados mantengan la integridad referencial.

---

## 3. Diagrama de Secuencia: Aprobación de Constancia de Alumno Regular

Muestra el flujo cuando un preceptor aprueba una solicitud de constancia de alumno regular:

```mermaid
sequenceDiagram
    autonumber
    actor Preceptor as Preceptor
    participant UI as PreceptoriaConstanciasView
    participant API as PreceptoriaAPI
    participant Ctrl as PreceptoriaController
    participant Srv as PreceptoriaService
    participant DB as SQLite
    participant Socket as Socket.IO
    actor Alumno as Alumno

    Preceptor->>UI: Clic en "Aprobar Constancia"
    UI->>API: resolverConstancia(id, "APROBADA", "Cumple presentismo")
    API->>Ctrl: PUT /api/plugins/edutech-preceptoria/constancias/5
    Ctrl->>Srv: resolverConstancia(5, preceptorId, "APROBADA", "...")
    Note over Srv: Genera código alfanumérico CAR-2026-X8K1A9
    Srv->>DB: UPDATE plugin_preceptoria_constancias SET estado='APROBADA', codigo_verificacion='CAR-2026-X8K1A9' WHERE id=5
    Srv->>Socket: emitToUser(alumnoId, 'preceptoria:constancia_resuelta', { codigo })
    Srv-->>Ctrl: { success: true, codigo: 'CAR-2026-X8K1A9' }
    Ctrl-->>API: HTTP 200 OK
    API-->>UI: Actualiza fila en tabla con código verde
    Socket-->>Alumno: Notificación instantánea en pantalla
    Alumno->>Alumno: Descarga o imprime certificado oficial
```

---

## 4. Diagrama de Flujo: Evaluación de Vacantes en Postulaciones

Describe cómo el servicio `OportunidadesService` protege el cupo disponible de una pasantía o beca:

```mermaid
flowchart TD
    Inicio([Docente evalúa postulación]) --> Estado{¿Nuevo estado es 'aceptada'?}
    
    Estado -- No --> UpdateDirecto[Actualiza estado de postulación] --> Fin([Fin del proceso])
    
    Estado -- Sí --> Cupo{¿vacantes_ocupadas < vacantes_totales?}
    
    Cupo -- No --> ErrorCupo[Lanza Error: Convocatoria completó sus vacantes] --> Abortar([Cancela operación con HTTP 400])
    
    Cupo -- Sí --> IncCupo[UPDATE plugin_oportunidades SET vacantes_ocupadas = vacantes_ocupadas + 1]
    IncCupo --> UpdatePost[UPDATE plugin_oportunidades_postulaciones SET estado = 'aceptada']
    UpdatePost --> NotifMail[Envía email formal al estudiante]
    NotifMail --> NotifSocket[Emite evento Socket: application.accepted]
    NotifSocket --> Fin
```

> **Interpretación:**
> El sistema previene la sobreinscripción: si una empresa ofrece 3 vacantes, el backend valida matemáticamente la disponibilidad antes de confirmar la admisión del estudiante.
