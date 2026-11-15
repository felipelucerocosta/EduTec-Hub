# Matriz de Roles y Permisos — Plugin Preceptoría

| Acción del Sistema | Preceptor Asignado | Preceptor NO Asignado | Administrador | Docente | Alumno |
|---|:---:|:---:|:---:|:---:|:---:|
| Ver mis clases asignadas | ✅ | ❌ | 👁️ (Ve todas) | ❌ | ❌ |
| Registrar / Guardar Asistencia Diaria | ✅ | ❌ (403) | ❌ (403 Estricto) | ❌ (403) | ❌ (403) |
| Rectificar / Modificar Asistencia Pasada | ✅ | ❌ (403) | ❌ (403 Estricto) | ❌ (403) | ❌ (403) |
| Consultar Historial de Fechas | ✅ | ❌ (403) | 👁️ (Solo lectura) | 👁️ (En su clase)| ❌ |
| Consultar Estadísticas de la Clase | ✅ | ❌ (403) | 👁️ (Solo lectura) | 👁️ (En su clase)| ❌ |
| Asignar / Revocar Preceptores a Clases | ❌ (403) | ❌ (403) | ✅ (Exclusivo Admin) | ❌ (403) | ❌ (403) |

> [!IMPORTANT]
> **Aclaración sobre el rol Administrador:**
> El administrador tiene privilegios plenos sobre la configuración institucional y asignación de personal. Sin embargo, para cumplir con el principio de división de responsabilidades y valor legal de la asistencia pública, la toma y firma de asistencia es potestad **exclusiva del rol Preceptor**. Los endpoints de registro rechazan solicitudes provenientes de `admin` con código HTTP 403.
