# Arquitectura de Software — EduTech Oportunidades

## 1. Diseño y Desacoplamiento
El plugin **EduTech Oportunidades** se diseñó bajo principios de alta cohesión y bajo acoplamiento:
- No depende de Aula Activa ni del plugin de Asistencia.
- Reutiliza el sistema de autenticación central (`req.session.usuario`) y la tabla de usuarios de EduTech.
- Capa de correo (`EmailOportunidadesService`) con transporte dinámico y tolerancia a fallos.
- Control concurrente de vacantes mediante transacciones y bloqueos de cupo máximo.

## 2. Flujo de Datos
```
[React Frontend]
    │  REST (credentials: include)
    ▼
[OportunidadesController]
    │  Auth & Permissions Middleware
    ▼
[OportunidadesService]
    ├── [PostgreSQL/SQLite Adapter] (Transacciones & SQL)
    ├── [EmailService / Nodemailer] (Alerta por correo al responsable)
    └── [Socket Bus] (Broadcast 'application.created', 'opportunity.vacancies_updated')
```

