# Fases 3 y 4 — producto y UX

## Fase 3: conexiones entre hogares
- Invitación por correo o código de invitación de un solo uso, con hash del token, expiración y revocación.
- El hogar receptor debe aceptar desde un administrador activo.
- No se comparte información al crear una conexión.
- Concesiones separadas por calendario/persona/recurso.
- Niveles de visibilidad: oculto, disponibilidad, básico, completo.
- Permisos revocables y auditables.
- Las tareas domésticas nunca se comparten.
- Si una persona pertenece a dos hogares conectados, la autorización se evalúa por recurso y hogar propietario; nunca se hereda por transitividad.

## Fase 4: calendarios y planificación mensual
- Calendario nativo mensual/semanal.
- Calendario personal único por perfil; calendarios de hogar separados.
- Color pastel persistente para cada persona y hogar.
- Eventos con categoría, inicio/fin, zona horaria, todo el día, prioridad, flexibilidad, buffers, recurrencia, visibilidad y estado.
- Prioridad: inamovible, protegido, preferencia, flexible.
- Formulario mensual sugerido alrededor del día 25; recordatorios configurables, por defecto día 28.
- El formulario muestra compromisos existentes para confirmar, editar o eliminar antes de añadir nuevos.
- Categorías: exámenes, entregas, estudio, planes sociales, celebraciones, viajes, citas/gestiones, deporte, salud, familia y otros.
- Permite compromisos de todo el día, franjas horarias, días bloqueados y preferencias.
- Guardar como borrador antes de enviar. No se crean eventos automáticamente sin confirmación.
- Invitados sin cuenta pueden participar en un evento compartido con consentimiento limitado.

## Planificador de eventos
- Selección de varios hogares o personas.
- Rango de fechas, duración, buffers y restricciones.
- Primero aplicar restricciones duras; después puntuar opciones con disponibilidad, preferencias y cercanía a exámenes.
- No asumir disponibilidad cuando falten datos.
- Mostrar razones de recomendación y conflictos sin filtrar detalles privados.
- Propuestas con aceptar/rechazar/sugerir otra fecha; confirmación final del organizador.
- Cambios posteriores notifican; nunca reprograman automáticamente.

## Estado del código
Las rutas `/app/calendar`, `/app/planning` y `/app/connections` son prototipos de interfaz. El formulario guarda un borrador local en el navegador y no envía datos. No representan disponibilidad real ni comparten información. El esquema SQL y las políticas de estas fases requieren implementación y pruebas antes de activar persistencia.
