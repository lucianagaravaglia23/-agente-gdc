# Agente GDC

Prototipo de "Agente GDC" — herramienta de acompañamiento para Gestión del Cambio. React + TypeScript + Vite + Tailwind v4, con datos persistidos en Supabase (Postgres + Auth).

## Setup local

1. `npm install`
2. Crear un archivo `.env` en la raíz (copiando `.env.example`) con las credenciales de tu proyecto de Supabase:
   ```
   VITE_SUPABASE_URL=https://<tu-proyecto>.supabase.co
   VITE_SUPABASE_ANON_KEY=<tu Publishable/anon key>
   ```
   Sacás estos valores de Supabase → Project Settings → API Keys. Usá la URL **base** del proyecto (sin `/rest/v1/` al final).
3. Correr el script `supabase/schema.sql` completo en el SQL Editor del dashboard de Supabase (Project → SQL Editor → New query → pegar → Run). Crea las 5 tablas del modelo de datos con Row Level Security habilitada.
4. Crear el usuario que va a iniciar sesión en la app desde Supabase → Authentication → Users → Add user (email + password). No hay pantalla de registro en la app.
5. `npm run dev` y entrar con ese email/password.

## Scripts

- `npm run dev` — servidor de desarrollo.
- `npm run build` — build de producción (`tsc -b && vite build`), genera la carpeta `dist/`.
- `npm run preview` — sirve el build de producción localmente.
- `npm run lint` — oxlint.

## Deploy (Vercel o Netlify)

La app es un sitio estático (frontend-only, sin backend propio) — cualquiera de las dos plataformas sirve, ambas con plan gratuito sin tarjeta.

**Pasos generales:**
1. Conectar el repositorio de GitHub al proyecto en Vercel/Netlify.
2. Build command: `npm run build`. Output directory: `dist`.
3. Configurar las variables de entorno del proyecto (no alcanza con el `.env` local, hay que cargarlas en la plataforma):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy. En cada push a la rama configurada, la plataforma vuelve a buildear automáticamente.

**Vercel específicamente:** Framework preset "Vite" (lo detecta solo). Las env vars se cargan en Project Settings → Environment Variables.

**Netlify específicamente:** Site settings → Build & deploy → Environment → Environment variables. Si el enrutado de React Router da 404 al refrescar una ruta interna, agregar un archivo `public/_redirects` con `/* /index.html 200`.

## Modelo de datos

Ver `supabase/schema.sql` para el esquema completo (tablas `proyectos`, `respuestas_diagnostico`, `tareas`, `audit_log`, `question_escalations`, todas con RLS restringido a usuarios autenticados).

## Notas del prototipo

- Login único: existe un solo usuario ("Demo") con acceso completo — no hay selector de rol ni pantalla de administración de usuarios.
- Las personas asignables a tareas (Luciana, Monica, Maria de los Milagros) están hardcodeadas en `src/data/personas.ts`, no son usuarios de Supabase Auth.
- El asistente de IA del cuestionario es un generador de texto mock (`src/lib/agentMock.ts`), no llama a ningún modelo real.
