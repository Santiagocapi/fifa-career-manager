# CLAUDE.md

App web para registrar partidas del modo carrera de EA FC: plantilla, tácticas, partidos, scouting, historial y trofeos.
Stack: React 18 + TypeScript (strict) + Vite + Tailwind + Zustand + Supabase (Postgres + Auth + RLS). Sin backend propio.

## Comandos

- `npm run dev` — servidor local en http://localhost:5173
- `npm run build` — `tsc -b && vite build`. **Debe pasar antes de dar una tarea por terminada.**
- `npm run lint` — ESLint. Sin errores nuevos.
- `npx tsc -b` — chequeo de tipos rápido (usar `-b`, no `--noEmit`: el proyecto usa project references).

## Arquitectura

- `src/pages/` — una página por ruta. Las páginas componen; no deberían tener lógica de datos ni superar ~400 líneas. Si una crece, extraer componentes a `src/components/<feature>/`.
- `src/hooks/use*.ts` — **único lugar que habla con Supabase**. Los componentes nunca importan `supabase` directamente.
- `src/store/` — Zustand solo para estado de UI/selección (carrera y temporada activas, alineación). Los datos del servidor viven en los hooks, no en stores.
- `src/types/database.ts` — tipos de las tablas. Debe reflejar exactamente lo que hay en `supabase/migrations/`.
- `src/lib/constants.ts` — formaciones, posiciones, helpers de formato (dinero, banderas, tiers de OVR).

## Modelo de datos — reglas importantes

- Jerarquía: `careers → seasons → (players ↔ season_stats) / matches → match_events / trophies`. `scouting_list` cuelga de `careers`.
- **`match_events` es la fuente de verdad** de goles, asistencias, tarjetas, partidos jugados y vallas invictas. `season_stats` guarda solo datos que no salen de partidos (OVR, valor, salario, lesión, notas). No añadir lógica nueva que incremente contadores a mano.
- Toda operación que toque varias tablas (registrar/editar/borrar partido, cerrar temporada) debe ser **atómica**: implementarla como función Postgres (`supabase.rpc(...)`) en una migración, no como varias llamadas encadenadas desde el cliente.
- Dinero en **céntimos** (`BIGINT`). Convertir solo en la UI con los helpers de `constants.ts`.
- Una temporada con `is_closed = true` es de solo lectura.

## Base de datos / migraciones

- Cualquier cambio de esquema = nueva migración numerada en `supabase/migrations/NNN_descripcion.sql`. Nunca editar migraciones ya aplicadas.
- Toda tabla nueva: `ENABLE ROW LEVEL SECURITY` + política basada en `auth.uid()` vía la cadena hasta `careers.user_id`, con `USING` y `WITH CHECK`.
- Tras cambiar el esquema, actualizar `src/types/database.ts` en el mismo cambio (idealmente regenerar con `supabase gen types typescript`).
- Nunca usar la service_role / secret key en el frontend. Solo `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.

## Convenciones de código

- TypeScript strict; prohibido `any` (usar tipos de `database.ts` o `unknown` + narrowing).
- Componentes funcionales, export default por página, named exports para helpers.
- Estilos con Tailwind y `clsx`; usar los tokens de `tailwind.config.js` (`pitch-*`, `neon-*`), no colores sueltos.
- Iconos de `lucide-react`. Animaciones con `framer-motion` solo si aportan.
- Texto visible al usuario en **español**; código, nombres de variables y commits en **inglés**.
- Los hooks devuelven `{ data, loading, error, ...acciones }` y comprueban siempre el `error` de cada llamada a Supabase.
- Comentarios: explicar el *porqué* de reglas de negocio no obvias (p. ej. cuándo cuenta una valla invicta), no lo que hace cada línea.

## Diseño / UX

- Mobile-first: la app se usa con el móvil al lado de la consola. Verificar en < 640px y en escritorio.
- Navegación: `BottomNav` en móvil, `Sidebar` en escritorio. Las rutas nuevas van en ambos y en `App.tsx`.
- Nombres de jugadores/posiciones con `translate="no"`.

## Flujo de trabajo

- Ramas `feat/`, `fix/`, `refactor/`, `docs/`; commits con Conventional Commits.
- Antes de cerrar una tarea: `npm run build` y `npm run lint` en verde, y probar el flujo afectado en el navegador.
- Cambios pequeños y enfocados; no mezclar refactors con features.
- No commitear `.env`, `node_modules/`, `dist/` ni `.vite/`.
