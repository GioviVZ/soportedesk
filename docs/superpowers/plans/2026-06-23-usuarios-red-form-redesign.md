# Usuarios de Red — Rediseño UI/UX del Formulario Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rediseñar el formulario de alta/edición de Usuarios de Red (`usuario-red-form.component.html`) para que use el mismo lenguaje visual ya establecido en el módulo de Impresoras (tarjetas `app-section-card` con ícono, pastillas `app-status-badge` para el campo Estado), y agregar una alerta de vencimiento de contrato (`app-vencimiento-badge`) junto al campo "Fecha fin de contrato".

**Architecture:** Reutiliza 3 componentes compartidos ya existentes (`SectionCardComponent`, `StatusBadgeComponent`, `VencimientoBadgeComponent`) sin modificarlos. Se agrega una función pura `usuarioRedEstadoTone()` + constante `USUARIO_RED_ESTADOS` en `usuario-red.model.ts` (mismo patrón que `impresoraEstadoTone`/`IMPRESORA_ESTADOS` en `impresora.model.ts`), que también elimina la duplicación del mapeo Activo→success/Inactivo→danger que hoy vive como método privado en `usuarios-red-list.component.ts`.

**Tech Stack:** Angular 17+ standalone components, Reactive Forms, Karma/Jasmine.

## Global Constraints

- No modificar `SectionCardComponent`, `StatusBadgeComponent`, `VencimientoBadgeComponent`, `UbicacionSelectComponent` — son compartidos y usados por otros módulos.
- No modificar la lógica de validaciones del `FormGroup` ni el método `submit()` de `usuario-red-form.component.ts`.
- No reordenar ni regrupar los campos en secciones distintas a las 3 actuales (Cuenta, Ubicación, Contrato).
- Ningún otro módulo se modifica.
- Comando de test de la suite completa: `cd soportedesk-frontend && npx ng test --watch=false`

---

### Task 1: Modelo — `USUARIO_RED_ESTADOS` y `usuarioRedEstadoTone()`

**Files:**
- Modify: `soportedesk-frontend/src/app/features/usuarios-red/usuario-red.model.ts`
- Test: `soportedesk-frontend/src/app/features/usuarios-red/usuario-red.model.spec.ts` (crear)

**Interfaces:**
- Consumes: `BadgeTone` type de `soportedesk-frontend/src/app/shared/status-badge/status-badge.component.ts` (ya existe: `'success' | 'warning' | 'danger' | 'neutral'`).
- Produces: `USUARIO_RED_ESTADOS: { value: string; tone: BadgeTone }[]` y `usuarioRedEstadoTone(estado: string | null | undefined): BadgeTone`, exportados desde `usuario-red.model.ts`. Usados por Task 2 y Task 3.

- [ ] **Step 1: Escribir el test que falla**

Crear `soportedesk-frontend/src/app/features/usuarios-red/usuario-red.model.spec.ts`:

```ts
import { usuarioRedEstadoTone } from './usuario-red.model';

describe('usuarioRedEstadoTone', () => {
  it('returns success for Activo', () => {
    expect(usuarioRedEstadoTone('Activo')).toBe('success');
  });

  it('returns danger for Inactivo', () => {
    expect(usuarioRedEstadoTone('Inactivo')).toBe('danger');
  });

  it('returns neutral for an unknown or missing value', () => {
    expect(usuarioRedEstadoTone('algo-raro')).toBe('neutral');
    expect(usuarioRedEstadoTone(null)).toBe('neutral');
    expect(usuarioRedEstadoTone(undefined)).toBe('neutral');
  });
});
```

- [ ] **Step 2: Ejecutar el test y confirmar que falla**

Run: `cd soportedesk-frontend && npx ng test --watch=false --include="**/usuario-red.model.spec.ts"`
Expected: FAIL — `usuarioRedEstadoTone` no existe / error de compilación TS (módulo no exporta ese nombre).

- [ ] **Step 3: Implementar en el modelo**

En `soportedesk-frontend/src/app/features/usuarios-red/usuario-red.model.ts`, agregar el import al inicio del archivo (después de la línea 1 existente) y el código nuevo al final del archivo (después de la línea 35, `export interface UsuarioRedRequest { ... }`):

```ts
import { Dependencia, Sede, Subdependencia, TipoContrato } from '../../core/models/catalogo.model';
import { BadgeTone } from '../../shared/status-badge/status-badge.component';

// ... interfaces UsuarioRed y UsuarioRedRequest existentes, sin cambios ...

export const USUARIO_RED_ESTADOS: { value: string; tone: BadgeTone }[] = [
  { value: 'Activo', tone: 'success' },
  { value: 'Inactivo', tone: 'danger' },
];

export function usuarioRedEstadoTone(estado: string | null | undefined): BadgeTone {
  return USUARIO_RED_ESTADOS.find((e) => e.value === estado)?.tone ?? 'neutral';
}
```

- [ ] **Step 4: Ejecutar el test y confirmar que pasa**

Run: `cd soportedesk-frontend && npx ng test --watch=false --include="**/usuario-red.model.spec.ts"`
Expected: PASS — 3 specs, 0 failures.

- [ ] **Step 5: Commit**

```bash
git add soportedesk-frontend/src/app/features/usuarios-red/usuario-red.model.ts soportedesk-frontend/src/app/features/usuarios-red/usuario-red.model.spec.ts
git commit -m "feat: add usuarioRedEstadoTone helper to usuario-red model"
```

---

### Task 2: Usar `usuarioRedEstadoTone` en la lista (eliminar duplicación)

**Files:**
- Modify: `soportedesk-frontend/src/app/features/usuarios-red/usuarios-red-list.component.ts`
- Modify: `soportedesk-frontend/src/app/features/usuarios-red/usuarios-red-list.component.html`
- Test: `soportedesk-frontend/src/app/features/usuarios-red/usuarios-red-list.component.spec.ts` (existente, sin cambios — solo se re-corre)

**Interfaces:**
- Consumes: `usuarioRedEstadoTone` de Task 1.
- Produces: N/A — uso final, ninguna otra tarea de este plan depende de este archivo.

- [ ] **Step 1: Confirmar el comportamiento actual con el test existente**

Run: `cd soportedesk-frontend && npx ng test --watch=false --include="**/usuarios-red-list.component.spec.ts"`
Expected: PASS — 2 specs, 0 failures (este test no renderiza el template, así que el refactor de abajo no debería romperlo; lo corremos antes y después como red de seguridad).

- [ ] **Step 2: Reemplazar el método `estadoTone` por la función del modelo**

En `soportedesk-frontend/src/app/features/usuarios-red/usuarios-red-list.component.ts`, cambiar el import (línea 9 actual):

```ts
// Antes:
import { BadgeTone, StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
// ...
import { UsuarioRed } from './usuario-red.model';

// Después:
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
// ...
import { UsuarioRed, usuarioRedEstadoTone } from './usuario-red.model';
```

Agregar la propiedad de clase junto a `columns` (la plantilla solo puede invocar miembros de la instancia del componente, no funciones importadas sueltas — mismo patrón que `readonly impresoraEstadoTone = impresoraEstadoTone;` en `impresoras-list.component.ts`):

```ts
export class UsuariosRedListComponent implements OnInit {
  private service = inject(UsuarioRedService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);

  items: UsuarioRed[] = [];
  columns: TableColumn[] = [ /* ... sin cambios ... */ ];
  readonly usuarioRedEstadoTone = usuarioRedEstadoTone;

  // ...
```

Eliminar el método `estadoTone()` completo (al final de la clase):

```ts
// Eliminar este método:
estadoTone(estado: string | null | undefined): BadgeTone {
  return estado?.toLowerCase() === 'activo' ? 'success' : 'danger';
}
```

- [ ] **Step 3: Actualizar la plantilla**

En `soportedesk-frontend/src/app/features/usuarios-red/usuarios-red-list.component.html`, dentro del `app-section-card title="Cuenta"` del modal de detalle, cambiar:

```html
<!-- Antes: -->
<app-status-badge [label]="viewing.estado || 'Sin estado'" [tone]="estadoTone(viewing.estado)" />

<!-- Después: -->
<app-status-badge [label]="viewing.estado || 'Sin estado'" [tone]="usuarioRedEstadoTone(viewing.estado)" />
```

- [ ] **Step 4: Ejecutar el test y confirmar que sigue pasando**

Run: `cd soportedesk-frontend && npx ng test --watch=false --include="**/usuarios-red-list.component.spec.ts"`
Expected: PASS — 2 specs, 0 failures.

- [ ] **Step 5: Commit**

```bash
git add soportedesk-frontend/src/app/features/usuarios-red/usuarios-red-list.component.ts soportedesk-frontend/src/app/features/usuarios-red/usuarios-red-list.component.html
git commit -m "refactor: reuse usuarioRedEstadoTone in usuarios-red-list, drop duplicated mapping"
```

---

### Task 3: Rediseñar el formulario (`usuario-red-form`)

**Files:**
- Modify: `soportedesk-frontend/src/app/features/usuarios-red/usuario-red-form.component.ts`
- Modify: `soportedesk-frontend/src/app/features/usuarios-red/usuario-red-form.component.html`
- Modify: `soportedesk-frontend/src/app/features/usuarios-red/usuario-red-form.component.scss`
- Test: `soportedesk-frontend/src/app/features/usuarios-red/usuario-red-form.component.spec.ts` (crear)

**Interfaces:**
- Consumes: `USUARIO_RED_ESTADOS` de Task 1; `SectionCardComponent` (`shared/section-card/section-card.component.ts`, input `title: string`), `StatusBadgeComponent` (`shared/status-badge/status-badge.component.ts`, inputs `label/tone/selectable/active`, output `select`), `VencimientoBadgeComponent` (`shared/vencimiento-badge/vencimiento-badge.component.ts`, input `fecha: string | null`) — todos componentes compartidos existentes, sin modificar.
- Produces: N/A — formulario final, ninguna otra tarea depende de este archivo.

- [ ] **Step 1: Escribir el test que falla**

Crear `soportedesk-frontend/src/app/features/usuarios-red/usuario-red-form.component.spec.ts`:

```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UsuarioRedFormComponent } from './usuario-red-form.component';

function isoDateOffset(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().substring(0, 10);
}

describe('UsuarioRedFormComponent', () => {
  let component: UsuarioRedFormComponent;
  let fixture: ComponentFixture<UsuarioRedFormComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsuarioRedFormComponent, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(UsuarioRedFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    httpMock = TestBed.inject(HttpTestingController);

    httpMock.expectOne((req) => req.url.includes('/catalogos/sedes')).flush([]);
    httpMock.expectOne((req) => req.url.includes('/catalogos/tipos-contrato')).flush([]);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('updates the estado control and toggles the inactive class when clicking the Inactivo pill', () => {
    component.form.patchValue({ estado: 'Activo' });
    fixture.detectChanges();

    const badges = Array.from(
      fixture.nativeElement.querySelectorAll('.estado-selector .status-badge'),
    ) as HTMLElement[];
    const inactivoBadge = badges.find((el) => el.textContent?.trim() === 'Inactivo')!;
    inactivoBadge.click();
    fixture.detectChanges();

    expect(component.form.value.estado).toBe('Inactivo');

    const activoBadge = Array.from(
      fixture.nativeElement.querySelectorAll('.estado-selector .status-badge'),
    ).find((el) => (el as HTMLElement).textContent?.trim() === 'Activo') as HTMLElement;
    expect(activoBadge.classList).toContain('inactive');
  });

  it('shows the vencimiento badge when fechaFinContrato is within 30 days', () => {
    component.form.patchValue({ fechaFinContrato: isoDateOffset(10) });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Por vencer');
  });

  it('shows no vencimiento badge when fechaFinContrato is empty', () => {
    component.form.patchValue({ fechaFinContrato: '' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Por vencer');
    expect(fixture.nativeElement.textContent).not.toContain('Vencido');
  });
});
```

- [ ] **Step 2: Ejecutar el test y confirmar que falla**

Run: `cd soportedesk-frontend && npx ng test --watch=false --include="**/usuario-red-form.component.spec.ts"`
Expected: FAIL — no existe `.estado-selector` ni `.status-badge` en el DOM (el template actual usa `<select formControlName="estado">`), y no hay texto "Por vencer" en ningún lado.

- [ ] **Step 3: Actualizar `usuario-red-form.component.ts`**

Reemplazar el archivo completo `soportedesk-frontend/src/app/features/usuarios-red/usuario-red-form.component.ts`:

```ts
import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UbicacionSelectComponent } from '../../shared/ubicacion-select/ubicacion-select.component';
import { SectionCardComponent } from '../../shared/section-card/section-card.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { VencimientoBadgeComponent } from '../../shared/vencimiento-badge/vencimiento-badge.component';
import { USUARIO_RED_ESTADOS, UsuarioRed } from './usuario-red.model';
import { UsuarioRedService } from './usuario-red.service';

@Component({
  selector: 'app-usuario-red-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    UbicacionSelectComponent,
    SectionCardComponent,
    StatusBadgeComponent,
    VencimientoBadgeComponent,
  ],
  templateUrl: './usuario-red-form.component.html',
  styleUrl: './usuario-red-form.component.scss',
})
export class UsuarioRedFormComponent implements OnChanges {
  private fb = inject(FormBuilder);
  private service = inject(UsuarioRedService);

  @Input() usuarioRed: UsuarioRed | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  sedeId: number | null = null;
  dependenciaId: number | null = null;
  subdependenciaId: number | null = null;
  tipoContratoId: number | null = null;
  readonly estadoOptions = USUARIO_RED_ESTADOS;

  form = this.fb.nonNullable.group({
    usuario: ['', Validators.required],
    nombre: ['', Validators.required],
    apellidos: ['', Validators.required],
    grupo: ['', Validators.required],
    unidadOrganizativa: [''],
    estado: ['Activo', Validators.required],
    fechaFinContrato: [''],
    fechaCreacion: [''],
    numeroContrato: [''],
  });

  ngOnChanges(): void {
    if (this.usuarioRed) {
      this.form.patchValue({
        usuario: this.usuarioRed.usuario,
        nombre: this.usuarioRed.nombre,
        apellidos: this.usuarioRed.apellidos,
        grupo: this.usuarioRed.grupo,
        unidadOrganizativa: this.usuarioRed.unidadOrganizativa ?? '',
        estado: this.usuarioRed.estado,
        fechaFinContrato: this.usuarioRed.fechaFinContrato ?? '',
        fechaCreacion: this.usuarioRed.fechaCreacion ?? '',
        numeroContrato: this.usuarioRed.numeroContrato ?? '',
      });
      this.sedeId = this.usuarioRed.sede?.id ?? null;
      this.dependenciaId = this.usuarioRed.dependencia?.id ?? null;
      this.subdependenciaId = this.usuarioRed.subdependencia?.id ?? null;
      this.tipoContratoId = this.usuarioRed.tipoContrato?.id ?? null;
    } else {
      this.form.reset({ usuario: '', nombre: '', apellidos: '', grupo: '', unidadOrganizativa: '', estado: 'Activo', fechaFinContrato: '', fechaCreacion: '', numeroContrato: '' });
      this.sedeId = null;
      this.dependenciaId = null;
      this.subdependenciaId = null;
      this.tipoContratoId = null;
    }
  }

  submit(): void {
    if (this.form.invalid) return;
    if (!this.sedeId || !this.dependenciaId || !this.subdependenciaId || !this.tipoContratoId) {
      alert('Complete todos los campos de ubicacion y tipo de contrato.');
      return;
    }
    const raw = this.form.getRawValue();
    const request = {
      usuario: raw.usuario,
      nombre: raw.nombre,
      apellidos: raw.apellidos,
      grupo: raw.grupo,
      unidadOrganizativa: raw.unidadOrganizativa || null,
      estado: raw.estado,
      sedeId: this.sedeId,
      dependenciaId: this.dependenciaId,
      subdependenciaId: this.subdependenciaId,
      tipoContratoId: this.tipoContratoId,
      fechaFinContrato: raw.fechaFinContrato || null,
      fechaCreacion: raw.fechaCreacion || null,
      numeroContrato: raw.numeroContrato || null,
    };
    const obs = this.usuarioRed
      ? this.service.update(this.usuarioRed.id, request)
      : this.service.create(request);
    obs.subscribe(() => this.saved.emit());
  }
}
```

(Único cambio real respecto al archivo actual: 3 imports nuevos, `SectionCardComponent`/`StatusBadgeComponent`/`VencimientoBadgeComponent` en el array `imports`, y la línea `readonly estadoOptions = USUARIO_RED_ESTADOS;`. `ngOnChanges`/`submit` quedan idénticos.)

- [ ] **Step 4: Reemplazar `usuario-red-form.component.html`**

Reemplazar el archivo completo `soportedesk-frontend/src/app/features/usuarios-red/usuario-red-form.component.html`:

```html
<form [formGroup]="form" (ngSubmit)="submit()" class="usuario-red-form">
  <app-section-card title="Cuenta">
    <svg icon xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>

    <div class="two-col">
      <div class="field">
        <label>Usuario</label>
        <input type="text" formControlName="usuario" autocomplete="off" />
      </div>
      <div class="field">
        <label>Estado</label>
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
      </div>
      <div class="field">
        <label>Nombre</label>
        <input type="text" formControlName="nombre" autocomplete="off" />
      </div>
      <div class="field">
        <label>Apellidos</label>
        <input type="text" formControlName="apellidos" autocomplete="off" />
      </div>
      <div class="field">
        <label>Grupo</label>
        <input type="text" formControlName="grupo" autocomplete="off" />
      </div>
      <div class="field wide">
        <label>Unidad Organizativa</label>
        <input type="text" formControlName="unidadOrganizativa" placeholder="Ej. OU=Soporte,OU=INIA" />
      </div>
    </div>
  </app-section-card>

  <app-section-card title="Ubicación">
    <svg icon xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 21s7-4.35 7-11a7 7 0 1 0-14 0c0 6.65 7 11 7 11z" />
      <circle cx="12" cy="10" r="2" />
    </svg>

    <app-ubicacion-select
      [(sedeId)]="sedeId"
      [(dependenciaId)]="dependenciaId"
      [(subdependenciaId)]="subdependenciaId"
      [(tipoContratoId)]="tipoContratoId"
    />
  </app-section-card>

  <app-section-card title="Contrato">
    <svg icon xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M9 13h6" />
      <path d="M9 17h6" />
    </svg>

    <div class="two-col">
      <div class="field wide">
        <label>Nro. de contrato</label>
        <input type="text" formControlName="numeroContrato" placeholder="Ej. CAS-001-2024" />
      </div>
      <div class="field">
        <label>Fecha de creación</label>
        <input type="date" formControlName="fechaCreacion" />
      </div>
      <div class="field">
        <label>Fecha fin de contrato</label>
        <div class="input-with-badge">
          <input type="date" formControlName="fechaFinContrato" />
          <app-vencimiento-badge [fecha]="form.value.fechaFinContrato" />
        </div>
      </div>
    </div>
  </app-section-card>

  <div class="actions">
    <button type="button" class="secondary" (click)="cancelled.emit()">Cancelar</button>
    <button type="submit" [disabled]="form.invalid">Guardar</button>
  </div>
</form>
```

- [ ] **Step 5: Reemplazar `usuario-red-form.component.scss`**

Reemplazar el archivo completo `soportedesk-frontend/src/app/features/usuarios-red/usuario-red-form.component.scss`:

```scss
.usuario-red-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.two-col {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.field {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 6px;

  &.wide {
    grid-column: 1 / -1;
  }

  label {
    font-size: 12px;
    font-weight: 700;
    color: var(--color-text-secondary);
  }

  input,
  select {
    width: 100%;
    min-height: 36px;
    padding: 8px 10px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-surface);
    color: var(--color-text);
    font-size: 13px;
    transition: var(--transition);

    &:focus {
      border-color: var(--color-accent);
      box-shadow: 0 0 0 3px var(--color-accent-light);
      outline: none;
    }
  }
}

.input-with-badge {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;

  input {
    flex: 1;
    min-width: 0;
  }
}

.estado-selector {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  min-height: 36px;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 2px;

  button {
    border: none;
    border-radius: var(--radius-sm);
    padding: 8px 16px;
    font-weight: 700;
    background-color: var(--color-accent);
    color: var(--color-white);
    cursor: pointer;
    transition: var(--transition);

    &:hover:not(:disabled) {
      background-color: var(--color-accent-hover);
    }

    &:disabled {
      background-color: var(--color-text-muted);
      cursor: not-allowed;
    }

    &.secondary {
      background-color: var(--color-muted);
      color: var(--color-text);
    }
  }
}

@media (max-width: 640px) {
  .two-col {
    grid-template-columns: 1fr;
  }

  .actions {
    flex-direction: column-reverse;

    button {
      width: 100%;
    }
  }
}
```

- [ ] **Step 6: Ejecutar el test y confirmar que pasa**

Run: `cd soportedesk-frontend && npx ng test --watch=false --include="**/usuario-red-form.component.spec.ts"`
Expected: PASS — 3 specs, 0 failures.

- [ ] **Step 7: Correr la suite completa**

Run: `cd soportedesk-frontend && npx ng test --watch=false`
Expected: PASS — 0 failures en toda la suite (confirma que el rediseño del formulario y el cambio de Task 2 no rompieron ningún otro spec, incluyendo `usuarios-red-list.component.spec.ts` y los specs de Impresoras).

- [ ] **Step 8: Commit**

```bash
git add soportedesk-frontend/src/app/features/usuarios-red/usuario-red-form.component.ts soportedesk-frontend/src/app/features/usuarios-red/usuario-red-form.component.html soportedesk-frontend/src/app/features/usuarios-red/usuario-red-form.component.scss soportedesk-frontend/src/app/features/usuarios-red/usuario-red-form.component.spec.ts
git commit -m "feat: redesign usuario-red-form with section cards, status pills and vencimiento badge"
```
