# Puesta en marcha local

1. Instala Node.js 20 o superior.
2. Clona el repositorio y ejecuta `npm install`.
3. Copia `.env.example` a `.env.local`.
4. En Supabase → Project Settings → API, copia el Project URL y la publishable key (no la secret/service_role).
5. Rellena `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
6. En Supabase Authentication → URL Configuration, configura Site URL y Redirect URLs para el dominio local y el dominio de producción.
7. Ejecuta `npm run dev`.

No añadas claves secretas al repositorio. El esquema de base de datos y las políticas RLS aún no están creados; no introduzcas datos familiares hasta que se hayan implementado y probado.
