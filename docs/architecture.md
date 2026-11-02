# Arquitectura inicial

## Dominios principales

- **Identidad:** perfil único de cada persona y vinculación segura con una cuenta.
- **Hogares:** hogares, miembros, roles y perfiles gestionados.
- **Conexiones:** solicitudes, aceptación y revocación entre hogares.
- **Permisos de compartición:** concesiones explícitas para miembros y calendarios.
- **Calendarios:** calendarios personales y de hogar; un perfil no debe duplicarse por pertenecer a varios hogares.
- **Eventos:** eventos privados y eventos compartidos entre varios hogares.
- **Tareas:** tareas y asignaciones privadas dentro de cada hogar.
- **Notificaciones:** avisos por email y registro de entregas.

## Reglas de autorización

1. Pertenecer a un hogar no concede acceso a otros hogares.
2. Una conexión entre hogares no comparte datos por sí sola.
3. Cada hogar decide qué calendario o miembro comparte y con qué nivel de detalle.
4. Los eventos privados pueden exponer únicamente un bloque de ocupación si el propietario lo autoriza.
5. Las tareas domésticas nunca se comparten entre hogares.
6. Revocar un permiso corta el acceso futuro sin borrar el contenido original.

## Modelo de datos — borrador

Entidades previstas: `profiles`, `families`, `family_members`, `family_connections`, `sharing_grants`, `calendars`, `calendar_events`, `shared_events`, `event_participants`, `event_proposals`, `household_tasks`, `task_assignments`, `notifications` y `audit_logs`.

Este modelo es conceptual. No crear tablas ni migraciones hasta revisar relaciones, restricciones, RLS e índices.

## Orden de implementación

1. Identidad, autenticación y hogares.
2. Membresías y perfiles gestionados.
3. Conexiones entre hogares y permisos.
4. Calendarios y eventos.
5. Planificación de eventos compartidos.
6. Tareas domésticas.
7. Notificaciones y automatizaciones.
