# Impresoras — Rediseño UI/UX (Formulario, Ficha, Lista, Resumen)

## Contexto

El rediseño de campos del módulo Impresoras (`2026-06-22-impresoras-rediseno-campos-design.md`, ya implementado y mergeado) agregó los campos `tipoImpresora`, `serie`, `codigoInventario`, `codigoPatrimonial` y `tipoConexion`, pero mantuvo el estilo visual preexistente — los mismos inputs/filas planas de antes, solo con más campos insertados.

Al revisar el código se confirmó que los componentes compartidos `GenericTableComponent` y `ModalComponent` ya usan un lenguaje visual "moderno" (tarjetas con sombra, tokens `--color-surface`/`--radius-*`/`--shadow-*`, botones de acción con color por tipo). Como la lista de Impresoras ya usa `app-generic-table`, **la lista ya se ve moderna**. El formulario y la ficha técnica, en cambio, siguen con el estilo "legacy" (`--color-green`, `--color-gray`, sin tarjetas, sin jerarquía visual) — ningún formulario/ficha de ningún módulo ha sido rediseñado todavía, así que este es el primer caso.

También existe un componente compartido `FieldComponent` (`app-field`) usado por las vistas de detalle de Equipos, VPN, Correos, WiFi y Usuarios de Red — pero **no se modifica** en este trabajo (ver Alcance).

## Objetivo

Rediseñar visualmente el formulario, la ficha técnica, la columna Estado de la lista, y alinear tokens del resumen de consumibles del módulo Impresoras, usando los tokens de diseño ya existentes en `_variables.scss`. Introducir 2 componentes compartidos nuevos y pequeños, reusables a futuro por otros módulos, sin modificar ningún componente compartido existente.

## Alcance

**Dentro de alcance:**
- `impresora-form.component.html/scss` — reestructurar en secciones con tarjetas.
- `impresora-ficha.component.html/scss` — reestructurar contenido de las 3 pestañas en tarjetas (incluye la pestaña Driver, solo estilo, sin tocar su lógica).
- `impresoras-list.component.ts/html` — columna Estado con pastilla de color.
- `impresora-resumen.component.scss` — alinear valores CSS sueltos a los tokens `--radius-*`/`--shadow-*` (sin cambios de layout/estructura).
- 2 componentes compartidos nuevos: `SectionCardComponent`, `StatusBadgeComponent`.
- Tests: actualizar los 2 specs existentes de Impresoras que verifiquen markup que cambia de forma, y añadir specs para los 2 componentes nuevos.

**Fuera de alcance (explícito):**
- Ningún otro módulo (Equipos, VPN, Correos, WiFi, Usuarios de Red) se modifica.
- `FieldComponent`, `GenericTableComponent` y `ModalComponent` no se modifican — son compartidos y usados por otros módulos hoy.
- Lógica de negocio: validaciones del formulario, reglas de IP/tipoConexion, subida/descarga de driver — sin cambios, solo estilo/markup.
- Columnas de la lista: se mantienen las 10 columnas actuales (consistente con la convención del resto de módulos, p.ej. Equipos tiene 9); no se reduce ni reordena el set de columnas.
- `--color-impresoras` (gris, usado en gráficos del dashboard) no se introduce en estos componentes; los acentos usan `--color-accent` (verde), igual que botones y el resto de la UI.

## Arquitectura — Componentes compartidos nuevos

### `SectionCardComponent` (`shared/section-card/`)

Agrupa un bloque de campos bajo un título con icono. Sin lógica de negocio, 100% presentacional.

```ts
// section-card.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-section-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './section-card.component.html',
  styleUrl: './section-card.component.scss',
})
export class SectionCardComponent {
  @Input({ required: true }) title!: string;
}
```

```html
<!-- section-card.component.html -->
<div class="section-card">
  <div class="section-header">
    <span class="section-icon"><ng-content select="[icon]" /></span>
    <h4>{{ title }}</h4>
  </div>
  <div class="section-body"><ng-content /></div>
</div>
```

Consumo:
```html
<app-section-card title="Identificación">
  <svg icon xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><!-- icono --></svg>
  <div class="field">...</div>
</app-section-card>
```

Estilo: tarjeta `background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); box-shadow: var(--shadow-sm);`, header con icono en círculo `--color-accent-subtle`/`--color-accent`, separador inferior antes del cuerpo.

### `StatusBadgeComponent` (`shared/status-badge/`)

Pastilla de color genérica — no conoce los valores de "estado" de ningún módulo. El módulo consumidor decide el `tone` según su propio valor.

```ts
// status-badge.component.ts
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeTone = 'success' | 'warning' | 'danger' | 'neutral';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-badge.component.html',
  styleUrl: './status-badge.component.scss',
})
export class StatusBadgeComponent {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) tone!: BadgeTone;
  @Input() selectable = false;
  @Input() active = true;
  @Output() select = new EventEmitter<void>();

  onClick(): void {
    if (this.selectable) this.select.emit();
  }
}
```

```html
<!-- status-badge.component.html -->
<span
  class="status-badge"
  [class.selectable]="selectable"
  [class.inactive]="selectable && !active"
  [class]="'tone-' + tone"
  (click)="onClick()"
>{{ label }}</span>
```

Estilo: pastilla redondeada (`border-radius: 20px`), color de fondo claro + texto del mismo tono (`success` → `--color-success-light`/`--color-success`, `warning` → `--color-warning-light`/`--color-warning`, `danger` → `--color-danger-light`/`--color-danger`, `neutral` → `--color-muted`/`--color-text-secondary`). Cuando `selectable && !active`: fondo `--color-muted`, texto `--color-text-muted`, borde transparente (visualmente "apagada" hasta que se selecciona). Cuando `selectable`: `cursor: pointer`.

### Mapeo de tono específico de Impresora

Para no duplicar el mapeo "estado string → tone" en 3 archivos, se agrega una función pura en `impresora.model.ts`:

```ts
// impresora.model.ts (agregar al final)
import { BadgeTone } from '../../shared/status-badge/status-badge.component';

export const IMPRESORA_ESTADOS: { value: string; tone: BadgeTone }[] = [
  { value: 'Activa', tone: 'success' },
  { value: 'En mantenimiento', tone: 'warning' },
  { value: 'De baja', tone: 'danger' },
];

export function impresoraEstadoTone(estado: string): BadgeTone {
  return IMPRESORA_ESTADOS.find((e) => e.value === estado)?.tone ?? 'neutral';
}
```

Usado por `impresora-form` (selector de pastillas), `impresora-ficha` (badge de solo lectura) e `impresoras-list` (badge en la celda Estado).

## Diseño — Formulario (`impresora-form`)

Mismo `FormGroup` y lógica (`valueChanges` para limpiar IP, validaciones) — solo cambia el template/estilo. 4 `app-section-card`:

1. **Identificación**: Nombre, Marca, Modelo, Tipo de impresora, Serie, Código de Inventario, Código Patrimonial, y el selector de Estado (ver abajo).
2. **Conexión**: selector USB/IP (select nativo, igual lógica actual), campo IP condicional (igual lógica actual: `*ngIf="form.value.tipoConexion === 'IP'"`).
3. **Ubicación**: `<app-ubicacion-select>` igual que hoy.
4. **Consumibles**: los 4 campos de tóner, igual que hoy.

**Selector de Estado**: en vez de `<select formControlName="estado">`, se reemplaza por 3 `app-status-badge` en modo `selectable`, lado a lado:

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

donde `estadoOptions = IMPRESORA_ESTADOS` (importado del modelo). El control reactivo `estado` sigue existiendo en el `FormGroup` igual que hoy (con su validador `Validators.required` si lo tuviera) — solo deja de estar enlazado vía `formControlName` en el template y se actualiza vía `patchValue` en el evento `select`. Esto no requiere implementar `ControlValueAccessor`.

## Diseño — Ficha técnica (`impresora-ficha`)

Misma estructura de pestañas (`activeTab`, lógica de `setTab`, `hasConsumibles()`, subida/descarga de driver) — solo cambia el template/estilo de cada pestaña.

**Instalación** — 2 `app-section-card`, cada campo dentro de un `.detail-field` (clase nueva, reemplaza a `.row`) con `.detail-label` y `.detail-value`:

```html
<div class="detail-field">
  <span class="detail-label">Conexión</span>
  <span class="detail-value">{{ impresora.tipoConexion }}<ng-container *ngIf="impresora.tipoConexion === 'IP'"> — {{ impresora.ip }}</ng-container></span>
</div>
```

- "Identificación": Nombre, Marca/Modelo, Tipo de impresora, Serie, Código de Inventario, Código Patrimonial, Estado (`app-status-badge` de solo lectura, `[tone]="impresoraEstadoTone(impresora.estado)"`).
- "Conexión y ubicación": Conexión (+ IP en monospace si aplica, igual lógica `*ngIf` actual), Sede, Dependencia, Subdependencia.

**Consumibles** — grid de 2 columnas dentro de un único `app-section-card` ("Consumibles"), una tarjeta interna pequeña por tóner registrado (Negro/Cyan/Magenta/Amarillo), mismo condicional `*ngIf` por campo y el mismo mensaje "Sin modelos de consumibles registrados" si `!hasConsumibles()`.

**Driver** — mismo contenido y lógica exacta (nombre/versión/SO del driver, botón "Descargar driver", formulario de subida visible solo si `isAdmin`), envuelto en `app-section-card` ("Driver instalado" / "Subir nuevo driver") para que visualmente combine con las otras 2 pestañas. Sin cambios a `downloadDriver()`, `onFileSelected()`, ni a los inputs de versión/SO.

## Diseño — Lista (`impresoras-list`)

Se mantienen las 10 columnas actuales del `TableColumn[]`. Se quita `estado` de la lista de columnas de texto plano y se renderiza vía el slot `extraCellTemplate` que `GenericTableComponent` ya expone (sin modificar ese componente):

```html
<app-generic-table
  [columns]="columns"
  [data]="items"
  [canEdit]="canWrite"
  extraColumnLabel="Estado"
  (searchChange)="onSearch($event)"
  (add)="onAdd()"
  (view)="onView($event)"
  (edit)="onEdit($event)"
  (delete)="onDelete($event)"
>
  <ng-template #extraCell let-row>
    <app-status-badge [label]="row.estado" [tone]="impresoraEstadoTone(row.estado)" />
  </ng-template>
</app-generic-table>
```

En `impresoras-list.component.ts`, el array `columns` quita la entrada `{ key: 'estado', label: 'Estado' }` (ya no se renderiza como texto plano; se sustituye por el `extraColumnLabel`/`extraCell` de arriba), y se importa `StatusBadgeComponent` + `impresoraEstadoTone`.

## Diseño — Resumen (`impresora-resumen`)

Sin cambios de estructura ni de `.ts`. Solo en `impresora-resumen.component.scss`, reemplazar valores sueltos por los tokens existentes:
- `border-radius: 8px` → `border-radius: var(--radius-md)`
- `box-shadow: 0 1px 3px rgba(0,0,0,.08)` → `box-shadow: var(--shadow-sm)`
- Los `border: 1px solid var(--color-border)` ya usan tokens, sin cambio.

## Testing

**Specs nuevos:**
- `shared/section-card/section-card.component.spec.ts`: renderiza el `title` en un `<h4>`, proyecta contenido del slot por defecto y del slot `[icon]`.
- `shared/status-badge/status-badge.component.spec.ts`: aplica la clase `tone-{tone}` según `[tone]`; en modo `selectable` con `active=false` aplica `.inactive` y al hacer click emite `select`; en modo no-`selectable` el click no emite nada.

**Specs existentes a actualizar:**
- `impresora-form.component.spec.ts`: los 3 tests actuales (`hides/shows ip field`, `clears ip`) siguen funcionando sin cambios — consultan `input[formControlName="ip"]`, que sigue existiendo igual dentro de la nueva tarjeta "Conexión". No requieren modificación, pero deben volver a correrse para confirmar que el nuevo markup no rompe el query selector.
- `impresora-ficha.component.spec.ts`: el test `hides the IP row when tipoConexion is USB` consulta `.row` (clase que desaparece con el nuevo markup). Se reemplaza por una consulta sobre `.detail-field` (la clase nueva definida arriba):
  ```ts
  it('hides the IP row when tipoConexion is USB', () => {
    component.impresora = { ...mockImpresora, tipoConexion: 'USB', ip: '' };
    fixture.detectChanges();

    const conexionField = Array.from(fixture.nativeElement.querySelectorAll('.detail-field')).find((el) =>
      (el as HTMLElement).querySelector('.detail-label')?.textContent === 'Conexión'
    ) as HTMLElement | undefined;
    expect(conexionField?.querySelector('.detail-value')?.textContent).not.toContain('—');
  });
  ```

**Comando de test:** `cd soportedesk-frontend && npx ng test --watch=false` (o el comando que use el proyecto para correr la suite completa de Karma/Jasmine una sola vez).

## Resumen de archivos

**Crear:**
- `shared/section-card/section-card.component.ts/.html/.scss/.spec.ts`
- `shared/status-badge/status-badge.component.ts/.html/.scss/.spec.ts`

**Modificar:**
- `impresoras/impresora.model.ts` (agregar `IMPRESORA_ESTADOS`, `impresoraEstadoTone`)
- `impresoras/impresora-form.component.ts/.html/.scss`
- `impresoras/impresora-ficha.component.ts` (import de `impresoraEstadoTone`/`StatusBadgeComponent`) `.html/.scss`
- `impresoras/impresoras-list.component.ts/.html`
- `impresoras/impresora-resumen.component.scss`
- `impresoras/impresora-form.component.spec.ts` (re-verificar, sin cambios esperados)
- `impresoras/impresora-ficha.component.spec.ts` (actualizar test de IP row)
