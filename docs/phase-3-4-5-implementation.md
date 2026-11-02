# Fases 3, 4 y 5 — implementación y decisiones técnicas

Actualizado: 2 de noviembre de 2026.

Este documento separa lo que ya tiene interfaz de lo que puede considerarse funcional. Ninguna pantalla local debe presentarse como sincronizada o segura entre hogares.

## Fase 3 — Conexión entre hogares

### Flujo de invitación previsto
1. Un administrador activo del hogar A inicia una invitación.
2. El servidor genera un token aleatorio de un solo uso; solo almacena su hash.
3. La invitación queda vinculada al hogar emisor, caduca (propuesta inicial: 7 días) y puede revocarse.
4. El administrador del hogar B verifica el código y acepta expresamente.
5. La aceptación crea una conexión pendiente de permisos; no comparte datos por defecto.
6. Los administradores conceden permisos separados por persona, calendario y nivel de detalle.
7. Toda concesión, cambio, aceptación y revocación queda auditada.

### Límites de seguridad
- Nunca guardar tokens de invitación en texto claro en la base de datos.
- No permitir que una invitación cree automáticamente membresías en el hogar receptor.
- No heredar permisos de forma transitiva entre hogares conectados.
- No compartir tareas domésticas, miembros completos ni datos privados por defecto.
- Las consultas de disponibilidad solo devuelven el mínimo necesario.
- La revocación debe surtir efecto en la siguiente consulta; no basta con ocultar un control en la interfaz.
- Invitados externos a eventos no reciben acceso general a calendarios ni a hogares.

### Estado
La ruta `/app/connections` ya permite probar localmente el flujo visual, generar códigos ficticios y cambiar preferencias de compartición. Se guarda en localStorage y no envía invitaciones ni concede acceso. No usar esos códigos como credenciales reales.

## Fase 4 — Calendarios y planificación

### Modelo funcional requerido
- Un perfil tiene un calendario personal único, aunque pertenezca a varios hogares.
- Cada hogar tiene su propio calendario compartido.
- Un evento tiene propietario (perfil u hogar), creador, fechas con zona horaria, condición de todo el día, categoría, estado, prioridad, flexibilidad, visibilidad y margen de desplazamiento.
- La visibilidad debe aplicarse por consulta y por recurso: oculto, disponibilidad, básico o completo.
- La disponibilidad ausente o desactualizada se representa como desconocida.
- El formulario mensual es una revisión de compromisos, no el único canal para editar la agenda.
- Antes de editar o borrar eventos existentes, se presenta una comparación y se solicita confirmación.
- La creación de eventos a partir del formulario requiere confirmación explícita.

### Planificador compartido
1. El organizador elige rango, duración, margen, hogares y perfiles.
2. Se aplican primero restricciones duras: eventos inamovibles, indisponibilidad confirmada y márgenes.
3. Se descartan intervalos que no cumplan esas restricciones.
4. Se ordenan los huecos restantes por preferencias, flexibilidad y disponibilidad autorizada.
5. Se explica el motivo de cada sugerencia sin revelar detalles que el hogar no haya compartido.
6. Cada participante puede aceptar, rechazar o sugerir otra opción.
7. El organizador confirma el evento definitivo. Los cambios posteriores notifican; nunca reprograman automáticamente.

### Estado
`/app/calendar` sigue siendo una vista visual de ejemplo. `/app/planning` guarda un borrador local. El nuevo formulario de `/app/organize` guarda una solicitud local con participantes y restricciones. Ninguna de estas rutas consulta disponibilidad real ni crea eventos sincronizados.

## Fase 5 — Tareas domésticas

### Reglas
- Las tareas pertenecen exclusivamente a un hogar y no se comparten con hogares conectados.
- Una tarea puede asignarse a una persona fija o a una rotación ordenada.
- La rotación avanza al marcar la tarea como completada, no al llegar la fecha límite.
- Debe conservarse historial de asignaciones y cambios.
- Se puede pausar una tarea, excluir temporalmente a un miembro o reasignar una ocurrencia.
- Las personas sin cuenta reciben avisos a través de su representante autorizado, según permisos.
- Las notificaciones requieren preferencias, consentimiento y un canal verificado.

### Estado
`/app/tasks` permite probar tareas recurrentes y rotación en localStorage. La notificación del navegador solo puede mostrarse cuando el navegador está activo y el permiso ha sido concedido. No hay todavía planificador en servidor, notificaciones push reales ni correo.

## Bloqueo de arquitectura que debe resolverse antes de activar la base de datos

La migración de fundación actual define `profiles.id` como FK obligatorio a `auth.users(id)`, pero el producto requiere perfiles gestionados sin cuenta. Además, el RPC de alta de miembro gestionado intenta insertar un UUID que no existe en `auth.users`. Por tanto, ese diseño no puede soportar de forma coherente a abuelos, menores u otros perfiles sin login.

Antes de aplicar migraciones se debe revisar el modelo de identidad para separar:
- `profiles.id`: identidad estable de la persona.
- `profiles.auth_user_id`: referencia nullable y única a `auth.users(id)`.
- `family_members.profile_id`: referencia a la identidad, no al usuario de autenticación.
- Representantes autorizados: relación entre un perfil gestionado y uno o más perfiles de adulto, con permisos granulares y revocables.

También hay que actualizar los RPC y las políticas RLS para comprobar la relación entre `auth.uid()` y `profiles.auth_user_id`, no asumir que ambos UUID son iguales. La migración de representantes existente es solo una propuesta y no debe ejecutarse aislada.

## Próximas tareas técnicas, en orden seguro

1. Rediseñar y revisar la migración fundacional para perfiles con y sin cuenta.
2. Definir helpers RLS que resuelvan el perfil autenticado y sus hogares; probar contra recursión.
3. Implementar invitaciones y conexiones con tokens hasheados, expiración, aceptación y revocación en servidor.
4. Implementar grants de compartición por hogar, perfil, calendario y visibilidad.
5. Implementar eventos y consultas de disponibilidad con políticas de mínimo privilegio.
6. Implementar revisión/diff del formulario mensual antes de aplicar cambios.
7. Implementar tareas recurrentes y ocurrencias en servidor, con rotación transaccional e historial.
8. Añadir bandeja de notificaciones y después push/correo con preferencias y límites de proveedor.
9. Ejecutar pruebas RLS con usuarios de hogares distintos, perfiles gestionados y representantes; verificar que ninguna conexión filtra tareas.
10. Solo entonces conectar las pantallas a datos reales y retirar los avisos de prototipo.

## Pruebas de aceptación obligatorias

- Un usuario del hogar A no puede leer eventos privados del hogar B por el mero hecho de estar conectado.
- Revocar un permiso bloquea inmediatamente la consulta correspondiente.
- Un perfil gestionado puede tener calendario y tareas sin cuenta de autenticación.
- Dos representantes pueden gestionar el mismo perfil sin crear identidades duplicadas.
- Un representante no puede realizar acciones fuera de sus permisos.
- Las tareas no aparecen nunca en consultas de hogares conectados.
- Un evento con disponibilidad desconocida no se cuenta como hueco libre.
- Dos completados simultáneos no hacen avanzar dos veces la rotación ni asignan la misma ocurrencia a dos personas.
- La aceptación/revocación de invitaciones y las operaciones representativas dejan auditoría.
