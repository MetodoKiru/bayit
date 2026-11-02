# Fase 8 — tareas recurrentes y reparto justo

## Definición de una tarea
- Hogar propietario, título, descripción, categoría, frecuencia, fecha de inicio y próxima fecha.
- Frecuencia: una vez, diaria, semanal, cada dos semanas, mensual o regla personalizada.
- Asignación: persona fija o rotación.
- Rotación: orden explícito de miembros elegibles, índice actual, posibilidad de pausar/excluir temporalmente a una persona.
- El turno avanza al marcar la tarea como completada, no solo por abrir el aviso.
- Reasignación manual con registro de quién y por qué.
- Historial de completado, vencimientos y asignaciones.
- La tarea y su historial solo son visibles a miembros activos del hogar.

## Recordatorios sin coste
- En la web: centro de notificaciones y contador de tareas pendientes.
- PWA: instalar desde el navegador en pantalla de inicio; cachear app shell y permitir abrir la app.
- Web Push: usar VAPID + Push API + service worker. El navegador no cobra por entregar push; el coste operativo depende de dónde se ejecute el trabajo programado.
- Email: opcional, mediante proveedor con nivel gratuito limitado; no prometer envío ilimitado gratuito.
- Sin permisos del navegador, mostrar avisos dentro de la web; nunca pedir permisos al cargar la página.
- No almacenar tokens de push sin consentimiento. Permitir revocar suscripciones.

## PWA
- Manifest, iconos 192/512, standalone, theme color, service worker, offline fallback.
- En iOS, la instalación se hace manualmente desde Compartir > Añadir a pantalla de inicio.
- En Android/desktop Chromium, mostrar botón de instalación cuando el navegador dispare beforeinstallprompt.
- No cachear respuestas privadas ni datos de familia en Cache Storage; cachear solo shell estático.
- El modo offline no debe fingir que cambios no sincronizados están guardados en servidor.
