# Servidor gratis, sin tarjeta, siempre activo y con datos que no se pierden

Combinación: **Render** (ejecuta el servidor) + **Supabase** (guarda datos y fotos) + **UptimeRobot** (lo mantiene despierto). Los tres tienen plan gratuito sin tarjeta. Tiempo: ~25 minutos. Las claves se escriben solo en el panel de Render, **nunca en archivos ni en GitHub**.

## 1. Sube el proyecto a GitHub
Sigue `GUIA-PUBLICAR.md` (crear repositorio y subir la carpeta). Puede ser privado.

## 2. Supabase (datos y fotos)
1. Entra en supabase.com → **Start your project** → crea cuenta (con GitHub, sin tarjeta).
2. **New project**: nombre `gymcrew`, elige una contraseña (no la necesitarás), región **West EU (Ireland)** o la más cercana.
3. Espera 1–2 min. Ve a **SQL Editor → New query**, pega el contenido de `server/supabase.sql` y pulsa **Run**. Debe decir «Success».
4. Ve a **Project Settings → API Keys** y copia:
   - **Project URL** (empieza por `https://` y acaba en `.supabase.co`) → será `SUPABASE_URL`.
   - La clave **secret** (empieza por `sb_secret_…`; en proyectos antiguos es la `service_role`) → será `SUPABASE_KEY`. **Es una contraseña: no la compartas ni la pegues en el chat.**

## 3. Render (el servidor)
1. render.com → **Get Started** → entra con GitHub (sin tarjeta).
2. **New → Blueprint** → elige tu repositorio. Render lee `render.yaml`.
3. Te pedirá `SUPABASE_URL` y `SUPABASE_KEY`: pega los dos valores del paso 2.
4. **Apply**. Tras ~3 min verás **Live**. Tu dirección es la que muestra Render (`https://gymcrew-xxxx.onrender.com`; si «gymcrew» estaba cogido le añade letras).
5. Comprueba abriendo `TU_DIRECCIÓN/health`: debe salir `{"app":"gymcrew","ok":true,...}`. En **Logs** debe poner «datos en Supabase (base nueva)».

## 4. Que no se duerma (UptimeRobot)
Render gratis se duerme tras 15 min sin visitas (despertar tarda ~40 s). Un aviso cada 5 min lo evita:
1. uptimerobot.com → cuenta gratuita → **Add New Monitor**.
2. Tipo **HTTP(s)**, URL `TU_DIRECCIÓN/health`, intervalo **5 minutos** → Create.

## 5. Usar la app
Abre **TU_DIRECCIÓN** en el móvil (la app se sirve desde el propio servidor, así que no hay que configurar nada) y «Añadir a pantalla de inicio». Todos tus amigos usan esa misma dirección.
Si prefieres seguir sirviendo la app desde GitHub Pages, pon en `config.js`: `serverUrl: 'https://TU_DIRECCIÓN'`.

## Qué se guarda y qué no
- En Supabase: cuentas, amistades, grupos, chats, publicaciones, retos y las fotos/vídeos (hasta que caducan: 25 h historias, 30 días publicaciones). Sobreviven a reinicios y despliegues.
- El plan gratuito de Supabase da 500 MB de base y **1 GB de archivos**. Con los límites de la app (40 MB por persona) alcanza para un grupo de gimnasio.
- El servidor hace una lectura diaria a Supabase para que no pause el proyecto por inactividad (lo hace si no hay uso durante 7 días).
- Tus entrenos siguen guardados en cada móvil, no en el servidor.

## Si algo falla
| Síntoma | Causa probable |
|---|---|
| Render muestra «Deploy failed» o el log dice `Supabase respondió 401` | `SUPABASE_KEY` mal copiada o es la clave pública (`publishable`/`anon`) en vez de la **secret** |
| El log dice `falta la tabla gc_kv` / `404` | No ejecutaste `server/supabase.sql` |
| `SUPABASE_URL debe empezar por https://` | Pegaste la URL sin `https://` |
| Las fotos dan error al subir | El cubo `gcmedia` no existe: vuelve a ejecutar `supabase.sql` |
| Tarda ~40 s en abrir | Render se durmió: revisa el monitor de UptimeRobot |
| Los datos se borran | Faltan las variables: el log dice «datos en …/db.json» en vez de «Supabase» |

El servidor **se niega a arrancar** si no puede leer Supabase (así nunca sobrescribe tus datos con una base vacía).

## Límites a tener en cuenta
Render gratis ofrece 750 h/mes (justo un servicio las 24 h) y puede reiniciar el servicio de vez en cuando; la app reconecta sola. Es un servicio para probar con amigos, no para miles de usuarios.
