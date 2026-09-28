# Modularización física del frontend (Nx) — bitácora

**Motivo:** continuación del mismo requerimiento de calidad ISO/IEC 25010 —
"Modularidad" — aplicado al frontend, una vez terminado por completo el
backend (ver el archivo `-backend` hermano de este). Se decidió hacer todo
el backend primero por ser el trabajo de mayor riesgo; el frontend, con solo
3 imports cruzados entre features en toda la auditoría previa, era de bajo
riesgo comparado.

Este documento resume el trabajo; el resultado técnico final vive en
`docs/ARQUITECTURA.md` §8.1 (siempre actualizado) — este archivo es la
bitácora de decisiones y fases, no la referencia técnica vigente.

## Auditoría previa

Solo 3 imports cruzados entre los 13 features de negocio en todo el código:

- `catalogos → vpn` (formulario de configuración institucional de VPN
  embebido en la pantalla de administración de catálogos) — legítimo.
- `vpn → equipos` (búsqueda de equipo al crear una solicitud VPN) — legítimo.
- `herramientas` importando `OrdenServicio`/`OrdenServicioHito` desde dentro
  de otro feature — acoplamiento accidental, no una relación de dominio real.

`core`/`shared` no tenían ninguna dependencia hacia atrás hacia features
(la extracción más segura posible, confirmado antes de tocar Nx).

## Fases y resultado de verificación

Igual que en el backend: cada fase vía Codex, con verificación independiente
posterior (`npx nx build`, `npx nx test`) — nunca se confió en el
auto-reporte de Codex.

- **F0 — Limpieza previa.** Se movió `OrdenServicio`/`OrdenServicioHito` de
  `features/herramientas/herramientas.model` a `core/models/` — resuelve el
  único acoplamiento accidental encontrado, antes de que Nx pudiera
  "legalizarlo" como dependencia de proyecto.
- **F1 — Migración a Nx.** `npx nx@latest init` (codemod oficial) sobre el
  workspace Angular CLI existente. Requirió bump de `@angular/*` /
  `@angular-devkit/*` / `@schematics/angular` de `^22.0.7` a `^22.2.0` (el
  peer dependency de `@nx/angular@23.2.1` lo exigía; confirmado root-cause
  vía `npm view` en vez de forzar con `--legacy-peer-deps`). Se descubrió de
  paso un spec pre-existente y no relacionado
  (`usuarios-red-consultas.component.spec.ts`) que probaba una API de
  filtros ya reemplazada en trabajo de sesiones anteriores — nunca se había
  detectado porque `ng build` no compila `.spec.ts`; se corrigió aparte.
  225/225 tests verdes tras la migración.
- **F2 — Extracción de `core` y `ui`.** Las dos únicas librerías sin ninguna
  dependencia hacia atrás. Se encontró una dependencia inversa real
  (`app→core→app`): varios servicios de `core` importaban
  `environments/environment.ts` (propiedad de la app) solo para leer
  `apiUrl: '/api'`, un valor que nunca varía (no existen
  `environment.development.ts`/`environment.prod.ts`). Se descartó
  deliberadamente la solución con `InjectionToken` que Codex propuso
  (abstracción innecesaria para un valor constante) y se reemplazó por el
  literal `/api` en cada sitio, eliminando el import — patrón reaplicado
  ~10+ veces en fases posteriores cada vez que reapareció.
- **F3 — Extracción de las 13 features de negocio**, de las más aisladas a
  las más conectadas: primero las 10 sin ninguna dependencia cruzada, luego
  `vpn` (depende de `equipos`, ya extraído), luego `catalogos` (depende de
  `vpn`, ya extraído), `dashboard` al final (agregador puro, nadie depende de
  él). El routing pasó de `import('./features/x/...')` a
  `import('@soportedesk/x')` en cada extracción.
- **F4 — Reglas de límites de Nx.** Tags `scope:<feature>` +
  `type:feature`/`type:ui`/`type:data-access`/`type:app` por proyecto;
  `@nx/enforce-module-boundaries` con `depConstraints` que permiten
  explícitamente `vpn→equipos` y `catalogos→vpn` y bloquean cualquier otra
  dependencia feature-a-feature. Se hizo una prueba deliberada (import
  prohibido agregado en `libs/impresoras` hacia `@soportedesk/equipos`,
  confirmado que el lint falla, revertido) antes de dar la fase por cerrada.
- **F5 — Verificación final.** `npm run build` + `npx nx test` + smoke
  aproximado (no hay navegador disponible en este flujo: se verificó vía
  build+test+lint, consistente con cómo se verificó trabajo de UI en el
  resto de la sesión).

## Regresión encontrada y corregida durante F5: code-splitting por librería en vez de por ruta

Al revisar el bundle de producción generado tras F4, el número de chunks
lazy había bajado de ~40+ (antes de la migración, uno pequeño por componente,
con nombre descriptivo) a solo 18, el más grande de 744 kB. Causa: cada ruta
en `app.routes.ts` hacía `loadComponent: () =>
import('@soportedesk/<feature>').then(m => m.X)` — es decir, importaba el
*barrel* (`index.ts`) completo de la librería. Como todas las rutas de una
misma librería resuelven al mismo especificador de módulo, esbuild las
colapsaba en un único chunk por librería en vez de mantener un chunk por
componente.

**Corrección aplicada** (patrón estándar de Nx para "feature libraries" con
múltiples rutas internas): cada una de las 13 librerías de negocio ahora
expone su propio `<nombre>.routes.ts` (un `Routes[]` de Angular con
lazy-imports **relativos internos** a la librería, no vía el barrel
público), reexportado desde `src/index.ts`. `app.routes.ts` dejó de usar
`loadComponent` apuntando al barrel y pasó a usar `loadChildren:
() => import('@soportedesk/<nombre>').then(m => m.<nombre>Routes)` una sola
vez por feature, delegando el resto del árbol de rutas (guards, redirects,
children anidados — preservados exactamente igual, incluida la ruta especial
`equipos/:id`) al archivo de rutas interno.

Un primer intento de Codex se cortó por límite de uso de la API justo
después de escribir los 13 archivos de rutas, actualizar los 13 barrels y
reescribir `app.routes.ts` (el mismo tipo de corte por límite de uso que ya
había ocurrido en la Fase B6 del backend — no un error de código). Se
verificó el contenido de los 27 archivos tocados antes de continuar y se
completó la verificación de forma independiente:

- Build limpio (`--skip-nx-cache`): ~55 chunks lazy (vs. 18 antes de la
  corrección), con nombres descriptivos por componente restaurados
  (`equipos-inventario-component`, `vpn-registros-component`, etc.). Los
  pocos chunks grandes sin nombre que persisten (744 kB, 338 kB, 333 kB,
  ~180 kB) son librerías de terceros cargadas bajo demanda (`xlsx`, `three`,
  `chart.js`/`ng2-charts`), de tamaño prácticamente idéntico antes y después
  del cambio — no relacionados con el problema de código propio.
- 225/225 tests en verde.
- Lint de los 16 proyectos limpio — `enforce-module-boundaries` (F4) intacto.
- Las 2 dependencias legítimas (`vpn→equipos`, `catalogos→vpn`) sin cambios.

## Resultado final

15 librerías Nx (`core`, `ui`, + 13 features de negocio) más la app, cero
ciclos entre features de negocio salvo las 2 dependencias explícitamente
auditadas y permitidas, `enforce-module-boundaries` como guardia permanente
de regresión, code-splitting por componente preservado. Detalle técnico
vigente en `docs/ARQUITECTURA.md` §8 y §8.1.
