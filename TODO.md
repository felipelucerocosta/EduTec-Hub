# EduTechHub — Roadmap & Seguimiento de Tareas

## ✅ Hitos Completados

### 1. Auditoría y Compilación Estructural
- [x] Corrección de errores de sintaxis y tipos en `backend/setup_db.ts`
- [x] Separación limpia de TypeScript: `tsconfig.app.json` (frontend) y `tsconfig.backend.json` (backend)
- [x] Unificación de tipos de sesión estricta (`rol: 'alumno' | 'profesor' | 'admin'`)
- [x] Verificación de compilación de producción con 0 errores (`npm run build` y `npm run build:backend`)

### 2. Arquitectura de Permisos y Roles (RBAC)
- [x] Implementación de módulo centralizado de verificación de permisos `backend/permisos.ts`
- [x] Regla de aislamiento: creación de clases con 0 profesores y 0 alumnos hasta asignación explícita
- [x] Aislamiento estricto de clases por división (3ro 1ra, 4to 2da, 5to 1ra)
- [x] Control de acceso en endpoints con retorno de `403 Forbidden` ante intentos no autorizados
- [x] Eliminación de persistencia insegura en `localStorage`

### 3. Frontend y Configuración Centralizada
- [x] Creación de `frontend/src/config/api.ts` para centralizar `API_URL`, `BACKEND_URL` y `SOCKET_URL`
- [x] Reemplazo de todas las URLs fijas (`localhost:3001`) en componentes y páginas
- [x] Redirección automática de administradores al panel `/admin`
- [x] Estados vacíos reales e intuitivos para docentes y alumnos sin materias asignadas

### 4. Asistencia y Recuperación de Credenciales (Alfred)
- [x] Flujo de verificación de correo institucional con código de un solo uso
- [x] Generación de contraseñas seguras mediante Alfred
- [x] Notificaciones por correo electrónico al iniciar sesión

---

## 🔮 Próximos Pasos y Mejoras Futuras

- [ ] Integración de notificaciones push en tiempo real para entrega de tareas corregidas
- [ ] Exportación de boletines de calificaciones a PDF descargable
- [ ] Más simuladores técnicos interactivos en `SimulatorRegistry`
- [ ] Soporte para modo oscuro / temas personalizables
