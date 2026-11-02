# Bayit

**Muchos hogares. Una vida compartida.**

Bayit es una plataforma privada para coordinar la vida entre varios hogares: calendarios personales y familiares, organización de eventos compartidos y tareas domésticas.

## Estado del proyecto

Fase inicial: definición y preparación de la arquitectura. Todavía no hay datos familiares ni credenciales conectadas.

## Principios del producto

- Una identidad por persona, aunque participe en varios hogares.
- Cada hogar controla qué información comparte y con quién.
- Los calendarios y eventos privados no revelan detalles a otros hogares.
- Las tareas domésticas son siempre privadas del hogar.
- Los eventos compartidos pueden reunir a varios hogares y personas invitadas.
- La disponibilidad desconocida nunca se interpreta como disponibilidad libre.

## MVP — primera entrega

1. Registro e inicio de sesión.
2. Crear un hogar.
3. Añadir miembros, incluidos perfiles gestionados sin cuenta.
4. Invitar a otro hogar y aceptar la conexión.
5. Configurar permisos de calendarios compartidos.
6. Mostrar un calendario básico y eventos.

## Tecnología prevista

- Next.js + React + TypeScript
- Tailwind CSS
- Supabase (PostgreSQL, Auth y Row Level Security)
- Vercel
- GitHub

## Seguridad

- Activar RLS en todas las tablas expuestas.
- No incluir claves secretas ni service-role en el navegador.
- Aplicar permisos por hogar, miembro y concesión explícita de acceso.
- No compartir información automáticamente al conectar dos hogares.

## Próximos pasos

- Confirmar el proyecto Supabase independiente de Método Kiru.
- Diseñar y revisar el modelo de datos antes de aplicar migraciones.
- Crear la estructura inicial de la aplicación.
- Probar permisos con cuentas de prueba antes de introducir datos reales.
