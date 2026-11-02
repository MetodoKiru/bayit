# Modelo de datos Bayit — propuesta v0.1

**Estado: diseño para revisión. No ejecutar todavía.**

Este documento define el primer modelo relacional. Antes de convertirlo en migraciones habrá que revisar todas las políticas RLS, restricciones, índices y flujos de invitación.

## Principios invariantes

1. Un perfil representa a una persona, no a una familia.
2. Una persona puede pertenecer a varios hogares sin duplicar su identidad ni su calendario personal.
3. Los hogares son límites de privacidad independientes.
4. Una conexión entre hogares no concede acceso automáticamente.
5. El acceso compartido se concede de forma explícita, granular y revocable.
6. Las tareas domésticas solo son visibles para miembros autorizados del hogar propietario.
7. La disponibilidad desconocida nunca equivale a disponibilidad libre.
8. Los perfiles gestionados sin cuenta no pueden autenticarse hasta reclamar la identidad mediante un flujo verificado.

## Tablas propuestas

### Identidad y hogares

- `profiles`: id UUID; auth_user_id nullable y único cuando exista; display_name; email normalizado opcional; timezone; created_at; updated_at.
- `families`: id UUID; name; created_by_profile_id; created_at; archived_at nullable.
- `family_members`: id UUID; family_id; profile_id; role (owner/admin/member); status (active/invited/left); joined_at; unique(family_id, profile_id).
- `family_invitations`: id UUID; family_id; invited_email normalizado; invited_by_profile_id; token_hash; expires_at; accepted_by_profile_id nullable; accepted_at; revoked_at. Nunca almacenar el token en claro.

### Conexiones y permisos

- `family_connections`: id UUID; family_a_id; family_b_id; requested_by_family_id; status (pending/accepted/revoked); created_at; accepted_at; revoked_at. Una pareja de hogares solo puede tener una conexión activa.
- `sharing_grants`: id UUID; connection_id; owner_family_id; grantee_family_id; resource_type (calendar/member/availability); resource_id; visibility (availability/basic/full); granted_by_profile_id; created_at; revoked_at.
- Cada concesión debe comprobar que quien la crea es administrador autorizado del hogar propietario y que los hogares pertenecen a la conexión aceptada.

### Calendarios y eventos

- `calendars`: id UUID; owner_profile_id nullable; owner_family_id nullable; calendar_type (personal/family); name; timezone; created_at. Restricción: exactamente uno entre owner_profile_id y owner_family_id.
- `calendar_memberships`: id UUID; calendar_id; profile_id; role; status. Permite autorizar miembros dentro del hogar sin duplicar el calendario.
- `calendar_events`: id UUID; calendar_id; created_by_profile_id; title; description; category; starts_at; ends_at; timezone; all_day; priority; flexibility; visibility; buffer_before_minutes; buffer_after_minutes; recurrence_rule nullable; status; created_at; updated_at. Validar ends_at > starts_at.
- `event_shares`: id UUID; event_id; grantee_family_id; visibility; granted_by_profile_id; revoked_at. Solo para compartir eventos concretos con otro hogar cuando proceda.
- `shared_events`: id UUID; organizer_profile_id; title; description; starts_at nullable; ends_at nullable; timezone; status (draft/searching/proposals_sent/confirmed/cancelled); created_at.
- `shared_event_participants`: id UUID; shared_event_id; family_id nullable; profile_id nullable; guest_email nullable; response_status; responded_at. Validar que exista un único destinatario por fila.
- `event_proposals`: id UUID; shared_event_id; starts_at; ends_at; status; created_by_profile_id; created_at.

### Tareas y auditoría

- `household_tasks`: id UUID; family_id; title; description; category; recurrence_rule nullable; due_at nullable; created_by_profile_id; status; created_at.
- `task_assignments`: id UUID; task_id; profile_id; assigned_by_profile_id; assigned_at; completed_at nullable; status.
- `audit_logs`: id UUID; actor_profile_id nullable; family_id nullable; action; resource_type; resource_id; created_at; metadata JSONB limitado a datos no sensibles.

## Reglas RLS a implementar y probar

- Un usuario autenticado solo puede leer su perfil y los hogares donde tiene membresía activa.
- Los perfiles gestionados solo son visibles a los miembros autorizados de sus hogares.
- Los administradores gestionan membresías e invitaciones; los miembros no pueden elevar sus propios roles.
- Las conexiones solo son visibles para hogares participantes.
- Los permisos compartidos requieren conexión aceptada, concesión vigente y nivel de visibilidad suficiente.
- Los eventos personales no se vuelven visibles por pertenecer a un hogar.
- Las tareas se limitan siempre al hogar propietario.
- Las escrituras deben validar tanto `USING` como `WITH CHECK` en políticas UPDATE.
- Ninguna política debe confiar en `user_metadata` editable por el usuario para autorizar roles.

## Decisiones pendientes antes de SQL

1. Cómo reclamar un perfil gestionado sin crear duplicados.
2. Si los calendarios familiares se crean automáticamente o por decisión del administrador.
3. Cómo se representa la disponibilidad agregada de un hogar sin filtrar eventos privados.
4. Cómo se resuelven permisos cuando un perfil pertenece a dos hogares conectados.
5. Política de eliminación, salida de un hogar y conservación de eventos compartidos.
6. Recurrencias: estándar RRULE y excepciones de instancias.

## Orden de construcción

1. Perfiles, hogares y membresías.
2. Invitaciones y reclamación de perfiles.
3. Conexiones y concesiones.
4. Calendarios y eventos.
5. Eventos compartidos y propuestas.
6. Tareas domésticas y auditoría.

No insertar datos familiares reales hasta completar pruebas RLS con al menos dos hogares y usuarios independientes.
