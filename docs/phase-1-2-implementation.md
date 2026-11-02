# Fases 1 y 2 — implementación

## Fase 1: identidad y acceso
- Registro email/contraseña.
- Confirmación por email mediante callback PKCE.
- Inicio/cierre de sesión.
- Perfil creado automáticamente desde el trigger de Auth.
- Protección de páginas privadas mediante verificación de sesión.
- Colores personales pastel configurables en perfil (campo preparado en esquema).

## Fase 2: hogares y miembros
- Crear hogar y añadir al creador como owner en una única función transaccional.
- Listar hogares donde la persona tiene membresía activa.
- Añadir perfiles gestionados sin cuenta, solo por owner/admin.
- Color propio por hogar y color propio por persona.
- RLS en perfiles, hogares y membresías.
- Una identidad por persona: pertenecer a varios hogares no crea cuentas duplicadas.

## Paleta visual
Cielo, lavanda, rosa, melocotón, mantequilla, salvia, menta y piedra. La paleta se aplica como identificador de calendario, no como color global de la interfaz.

## Aplicación de migración pendiente
La migración está versionada en `supabase/migrations/20261102000100_bayit_phase_1_2.sql`, pero no se ha ejecutado. Antes de ejecutarla:
1. Confirmar que el proyecto Supabase seleccionado es Bayit (ref: terldpykimxtwnucdfgr).
2. Revisar la migración en SQL Editor.
3. Aplicarla en ese proyecto y verificar tablas, trigger, funciones y RLS.
4. Probar con dos usuarios y dos hogares independientes, además de un perfil gestionado.
5. Confirmar registro, correo y login desde el dominio Vercel.

No se han creado datos familiares ni se ha ejecutado SQL contra ningún proyecto.
