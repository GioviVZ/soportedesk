# Usuarios de Red — Rediseño UI/UX del Formulario

## Contexto

El rediseño de Impresoras (`2026-06-23-impresoras-ui-ux-redesign-design.md`, ya implementado y mergeado) introdujo el lenguaje visual moderno (`SectionCardComponent`, `StatusBadgeComponent`) para formularios y fichas. Ese mismo trabajo dejó la ficha de detalle y la lista de Usuarios de Red ya migradas a ese lenguaje (`usuarios-red-list.component.html` ya usa `app-section-card`, `app-status-badge` y `app-vencimiento-badge` en el modal de detalle y en la columna extra de la tabla). El formulario de alta/edición (`usuario-red-form.component.html`), en cambio, quedó con el estilo legacy anterior: secciones numeradas ("01", "02", "03") sin tarjeta visual, inputs en grilla plana, y el campo Estado como `<select>` nativo. Es la única pieza desalineada visualmente dentro del módulo.

## Objetivo

Rediseñar el formulario de alta/edición de Usuarios de Red para que use el mismo lenguaje visual ya establecido (tarjetas con ícono por sección, pastillas seleccionables para Estado), agregando además una alerta visual de vencimiento de contrato directamente en el formulario. Sin modificar componentes compartidos existentes ni la lógica de negocio.

## Alcance

**Dentro de alcance:**
- `usuario-red-form.component.html/scss/ts` — reestructurar en `app-section-card`, reemplazar el `<select>` de Estado por `app-status-badge` seleccionables, agregar `app-vencimiento-badge` junto al campo "Fecha fin de contrato".
- `usuario-red.model.ts` — agregar `USUARIO_RED_ESTADOS` y `usuarioRedEstadoTone()`, mismo patrón que `impresora.model.ts`.
- `usuarios-red-list.component.ts` — usar `usuarioRedEstadoTone()` del modelo en vez del método local `estadoTone()` (elimina mapeo duplicado).
- Tests: nuevo spec para `usuario-red-form.component.ts` (no existía antes).

**Fuera de alcance (explícito):**
- La lista (`usuarios-red-list.component.html`) y la ficha de detalle ya están migradas — no se tocan, salvo el cambio puntual de `estadoTone()` → `usuarioRedEstadoTone()` arriba.
- `SectionCardComponent`, `StatusBadgeComponent`, `VencimientoBadgeComponent`, `UbicacionSelectComponent` — componentes compartidos existentes, no se modifican.
- Validaciones del formulario, lógica de `submit()`, estructura del `FormGroup` (los nombres y validadores de los controles no cambian) — sin cambios.
- Reordenar o agrupar los campos en secciones distintas a las 3 actuales (Cuenta, Ubicación, Contrato) — se mantiene la agrupación existente.
- Ningún otro módulo se modifica.

## Arquitectura — Reutilización de componentes existentes

No se crean componentes compartidos nuevos. Se reutilizan, sin modificar:
- `SectionCardComponent` (`shared/section-card/`)
- `StatusBadgeComponent` (`shared/status-badge/`)
- `VencimientoBadgeComponent` (`shared/vencimiento-badge/`) — ya usado en la lista; se auto-oculta cuando `fecha` es null o falta más de 30 días.

### Mapeo de tono en `usuario-red.model.ts`

Mismo patrón que `IMPRESORA_ESTADOS`/`impresoraEstadoTone` en `impresora.model.ts`:

```ts
// usuario-red.model.ts (agregar al final)
import { BadgeTone } from '../../shared/status-badge/status-badge.component';

export const USUARIO_RED_ESTADOS: { value: string; tone: BadgeTone }[] = [
  { value: 'Activo', tone: 'success' },
  { value: 'Inactivo', tone: 'danger' },
];

export function usuarioRedEstadoTone(estado: string | null | undefined): BadgeTone {
  return USUARIO_RED_ESTADOS.find((e) => e.value === estado)?.tone ?? 'neutral';
}
```

En `usuarios-red-list.component.ts`, el método `estadoTone(estado)` se elimina y el template (`usuarios-red-list.component.html`, línea del `app-status-badge` en el modal de detalle) pasa a llamar `usuarioRedEstadoTone(viewing.estado)` importado del modelo.

## Diseño — Formulario (`usuario-red-form`)

Mismo `FormGroup` y lógica de `submit()` — solo cambia el template/estilo. 3 `app-section-card`, mismas secciones de hoy:

1. **Cuenta** (ícono persona): Usuario, Nombre, Apellidos, Grupo, Unidad Organizativa (ancho completo), y Estado.

   **Selector de Estado**: igual que en Impresoras, se reemplaza `<select formControlName="estado">` por 2 `app-status-badge` lado a lado:

   ```html
   <div class="estado-selector">
     <app-status-badge
       *ngFor="let opt of estadoOptions"
       [label]="opt.value"
       [tone]="opt.tone"
       [selectable]="true"
       [active]="form.value.estado === opt.value"
       (select)="form.patchValue({ estado: opt.value })"
     />
   </div>
   ```

   donde `estadoOptions = USUARIO_RED_ESTADOS` (importado del modelo). El control reactivo `estado` sigue existiendo igual en el `FormGroup` (con su `Validators.required`) — solo deja de estar enlazado vía `formControlName` en el template.

2. **Ubicación** (ícono pin): `<app-ubicacion-select>` igual que hoy, sin cambios de lógica.

3. **Contrato** (ícono documento): Nro. de contrato (ancho completo), Fecha de creación, Fecha fin de contrato.

   **Alerta de vencimiento**: junto al campo "Fecha fin de contrato", se agrega el badge:

   ```html
   <div class="field">
     <label>Fecha fin de contrato</label>
     <input type="date" formControlName="fechaFinContrato" />
     <app-vencimiento-badge [fecha]="form.value.fechaFinContrato" />
   </div>
   ```

   El badge se renderiza solo si `fechaFinContrato` está vencida o vence en ≤30 días (lógica interna del componente, sin cambios). Funciona tanto en alta (sin fecha → no se muestra nada) como en edición.

**Estilo (`usuario-red-form.component.scss`)**: se reemplazan las clases legacy (`.form-section`, `.section-title`, `.form-grid`) por las mismas clases que ya usa `impresora-form.component.scss` (`.two-col`, `.field`, `.estado-selector`, `.actions`), que ya están alineadas a los tokens `--color-*`/`--radius-*`. El selector raíz pasa de `.usuario-red-form { display: grid; gap: 14px }` a `.usuario-red-form { display: flex; flex-direction: column; gap: 14px }`, igual que `.impresora-form`.

## Diseño — Cambios en `usuarios-red-list.component.ts/html`

Cambio puntual, sin alterar layout ni lógica de filtrado/búsqueda:
- `usuarios-red-list.component.ts`: elimina el método `estadoTone()`, importa `usuarioRedEstadoTone` de `./usuario-red.model`.
- `usuarios-red-list.component.html`: el `app-status-badge` dentro del modal de detalle (sección "Cuenta") cambia `[tone]="estadoTone(viewing.estado)"` por `[tone]="usuarioRedEstadoTone(viewing.estado)"`.

## Testing

**Spec nuevo:** `usuario-red-form.component.spec.ts` (no existe hoy):
- Al hacer click en la pastilla "Inactivo" estando "Activo" seleccionado, el control reactivo `form.value.estado` cambia a `"Inactivo"` y la pastilla "Activo" deja de tener la clase `active`.
- Con `usuarioRed` input seteado con `fechaFinContrato` a 10 días de hoy, el componente `app-vencimiento-badge` renderiza el texto "Por vencer"; con `fechaFinContrato` null, no renderiza ningún badge.

**Specs existentes a verificar (sin cambios esperados, solo re-correr):**
- Ningún spec existente consulta las clases `.form-section`/`.section-title`/`.form-grid` que se eliminan — no hay specs de `usuario-red-form` hoy.

**Comando de test:** `cd soportedesk-frontend && npx ng test --watch=false`

## Resumen de archivos

**Crear:**
- `usuarios-red/usuario-red-form.component.spec.ts`

**Modificar:**
- `usuarios-red/usuario-red.model.ts` (agregar `USUARIO_RED_ESTADOS`, `usuarioRedEstadoTone`)
- `usuarios-red/usuario-red-form.component.ts/.html/.scss`
- `usuarios-red/usuarios-red-list.component.ts` (usar `usuarioRedEstadoTone` en vez de `estadoTone`)
- `usuarios-red/usuarios-red-list.component.html` (línea del badge de Estado en el modal de detalle)
