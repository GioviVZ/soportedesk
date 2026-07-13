# Rediseño visual de Administración — Usuarios de Red/AD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Partir el componente monolítico `usuarios-red-administracion.component.ts` (~980 líneas) en 6 subcomponentes autocontenidos con diseño agrupado por secciones (`app-section-card` con ícono), siguiendo el patrón visual del modelo de referencia del backend, sin cambiar ningún campo, endpoint ni comportamiento de negocio existente.

**Architecture:** Cada panel (crear usuario, reset password, grupos, mover OU, editar info) pasa a ser un componente standalone autocontenido que inyecta directamente `ActiveDirectoryService` (y `CatalogoService`/`UsuarioRedContratoService` donde aplique), gestiona su propio estado de carga/error, y comunica el resultado al padre vía `(saved)` o `(changed)` con un payload `AdPanelResult`. El padre se reduce a orquestar qué modal está abierto y a refrescar `user`/`dashboard` cuando un panel emite. Un componente nuevo `ad-admin-summary` reemplaza los KPIs `stat-pill` por `summary-card` con tono, solo en esta vista.

**Tech Stack:** Angular 17 standalone components, RxJS, Jasmine/Karma (`ng test`), `HttpClientTestingModule`.

## Global Constraints

- No se modifica ningún endpoint, DTO, ni lógica de backend — este es un rediseño de presentación únicamente.
- No se modifica `ad-kpis.component.ts` (se reusa en Dashboard, fuera de alcance).
- Se preserva exactamente el comportamiento actual de cierre/no-cierre de cada modal en éxito/error (documentado por tarea abajo).
- Todos los componentes nuevos viven en `soportedesk-frontend/src/app/features/usuarios-red/` (mismo nivel que el resto del módulo, sin subcarpeta), con template inline + `styleUrl`/`styleUrls`, igual que `ad-user-search.component.ts` y `usuario-red-contratos-panel.component.ts` — no se introducen archivos `.html` externos.
- Se reutilizan `app-section-card`, `app-field`, `app-modal`, `app-status-badge`, `app-vencimiento-badge` tal cual existen hoy, sin modificarlos.
- Los specs nuevos siguen el patrón ya usado en `usuarios-red-administracion.component.spec.ts`: `TestBed.runInInjectionContext(() => new Componente())` + `HttpClientTestingModule` + `HttpTestingController`, sin renderizar el template (no `fixture.detectChanges()`), para no depender de stubs de componentes hijos.
- Comando para correr un spec puntual: `ng test --watch=false --include='**/<archivo>.spec.ts'` ejecutado desde `soportedesk-frontend/`.
- Spec de referencia para el diseño: `docs/superpowers/specs/2026-07-13-usuarios-red-administracion-rediseno-design.md`.

---

## Task 1: Tipo compartido `AdPanelResult`

**Files:**
- Modify: `soportedesk-frontend/src/app/features/usuarios-red/active-directory.model.ts`

**Interfaces:**
- Produces: `AdPanelResult { user: AdUser; notice: { tone: 'success' | 'error'; text: string } }` — usado por todos los paneles nuevos (Tasks 3-7) y por el componente padre (Task 8).

- [ ] **Step 1: Agregar la interfaz al final del archivo**

Al final de `active-directory.model.ts` (después de `UpdateUserInfoRequest`), agregar:

```ts
export interface AdPanelResult {
  user: AdUser;
  notice: { tone: 'success' | 'error'; text: string };
}
```

- [ ] **Step 2: Verificar que el proyecto sigue compilando**

Run (desde `soportedesk-frontend/`): `npx tsc -p tsconfig.app.json --noEmit`
Expected: sin errores nuevos relacionados a `active-directory.model.ts`.

- [ ] **Step 3: Commit**

```bash
git add soportedesk-frontend/src/app/features/usuarios-red/active-directory.model.ts
git commit -m "feat: agregar tipo AdPanelResult para paneles de administracion AD"
```

---

## Task 2: `ad-admin-summary.component.ts` — KPIs con tono

**Files:**
- Create: `soportedesk-frontend/src/app/features/usuarios-red/ad-admin-summary.component.ts`
- Create: `soportedesk-frontend/src/app/features/usuarios-red/ad-admin-summary.component.scss`
- Test: `soportedesk-frontend/src/app/features/usuarios-red/ad-admin-summary.component.spec.ts`

**Interfaces:**
- Consumes: `ActiveDirectoryDashboard` (ya existe en `active-directory.model.ts`).
- Produces: componente `app-ad-admin-summary` con `@Input({required:true}) dashboard: ActiveDirectoryDashboard | null` y método público `total(): number`, consumido por Task 8.

- [ ] **Step 1: Escribir el spec (falla porque el componente no existe)**

Crear `ad-admin-summary.component.spec.ts`:

```ts
import { AdAdminSummaryComponent } from './ad-admin-summary.component';

describe('AdAdminSummaryComponent', () => {
  it('calcula el total como habilitados + deshabilitados', () => {
    const component = new AdAdminSummaryComponent();
    component.dashboard = {
      usuariosHabilitados: 110,
      usuariosBloqueados: 3,
      usuariosDeshabilitados: 15,
      controladoresDominio: 2,
    };
    expect(component.total()).toBe(125);
  });

  it('retorna 0 de total cuando no hay dashboard', () => {
    const component = new AdAdminSummaryComponent();
    component.dashboard = null;
    expect(component.total()).toBe(0);
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `ng test --watch=false --include='**/ad-admin-summary.component.spec.ts'` (desde `soportedesk-frontend/`)
Expected: FAIL — no se puede resolver el módulo `./ad-admin-summary.component`.

- [ ] **Step 3: Crear el componente**

Crear `ad-admin-summary.component.ts`:

```ts
import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ActiveDirectoryDashboard } from './active-directory.model';

@Component({
  selector: 'app-ad-admin-summary',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="summary-grid" aria-label="Resumen de cuentas de red" *ngIf="dashboard">
      <article class="summary-card">
        <span>Total</span>
        <strong>{{ total() }}</strong>
        <small>cuentas en Active Directory</small>
      </article>
      <article class="summary-card success">
        <span>Habilitados</span>
        <strong>{{ dashboard.usuariosHabilitados }}</strong>
        <small>con acceso activo</small>
      </article>
      <article class="summary-card danger">
        <span>Bloqueados</span>
        <strong>{{ dashboard.usuariosBloqueados }}</strong>
        <small>por intentos fallidos</small>
      </article>
      <article class="summary-card warning">
        <span>Deshabilitados</span>
        <strong>{{ dashboard.usuariosDeshabilitados }}</strong>
        <small>cuentas sin acceso</small>
      </article>
    </section>
  `,
  styleUrl: './ad-admin-summary.component.scss',
})
export class AdAdminSummaryComponent {
  @Input({ required: true }) dashboard: ActiveDirectoryDashboard | null = null;

  total(): number {
    if (!this.dashboard) return 0;
    return this.dashboard.usuariosHabilitados + this.dashboard.usuariosDeshabilitados;
  }
}
```

Crear `ad-admin-summary.component.scss`:

```scss
.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.summary-card {
  display: grid;
  gap: 4px;
  padding: 14px;
  border: 1px solid var(--color-border);
  border-left: 4px solid var(--color-accent);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);

  span {
    color: var(--color-text-secondary);
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
  }

  strong {
    color: var(--color-text);
    font-size: 28px;
    line-height: 1;
  }

  small {
    color: var(--color-text-secondary);
    font-size: 12px;
  }

  &.success { border-left-color: var(--color-success); }
  &.danger { border-left-color: var(--color-danger); }
  &.warning { border-left-color: var(--color-warning); }
}

@media (max-width: 900px) {
  .summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 640px) {
  .summary-card strong { font-size: 24px; }
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `ng test --watch=false --include='**/ad-admin-summary.component.spec.ts'` (desde `soportedesk-frontend/`)
Expected: PASS (2 specs).

- [ ] **Step 5: Commit**

```bash
git add soportedesk-frontend/src/app/features/usuarios-red/ad-admin-summary.component.ts soportedesk-frontend/src/app/features/usuarios-red/ad-admin-summary.component.scss soportedesk-frontend/src/app/features/usuarios-red/ad-admin-summary.component.spec.ts
git commit -m "feat: agregar ad-admin-summary con KPIs por tono para Administracion AD"
```

---

## Task 3: `ad-reset-password-panel.component.ts`

**Files:**
- Create: `soportedesk-frontend/src/app/features/usuarios-red/ad-reset-password-panel.component.ts`
- Test: `soportedesk-frontend/src/app/features/usuarios-red/ad-reset-password-panel.component.spec.ts`

**Interfaces:**
- Consumes: `ActiveDirectoryService.resetPassword(samAccountName, newPassword, forceChange): Observable<ActiveDirectoryResponse<AdUser>>` (ya existe).
- Produces: componente `app-ad-reset-password-panel` con `@Input({required:true}) samAccountName: string`, `@Output() saved: EventEmitter<AdPanelResult>`, `@Output() cancelled: EventEmitter<void>`. Consumido por Task 8.

- [ ] **Step 1: Escribir el spec**

Crear `ad-reset-password-panel.component.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AdResetPasswordPanelComponent } from './ad-reset-password-panel.component';

describe('AdResetPasswordPanelComponent', () => {
  let httpMock: HttpTestingController;

  function createComponent(): AdResetPasswordPanelComponent {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    httpMock = TestBed.inject(HttpTestingController);
    const component = TestBed.runInInjectionContext(() => new AdResetPasswordPanelComponent());
    component.samAccountName = 'jperez';
    return component;
  }

  afterEach(() => httpMock.verify());

  it('no envia la peticion si la contraseña esta vacia', () => {
    const component = createComponent();
    component.newPassword = '   ';
    component.submit();
    expect(component.error).toBe('Ingresa una contraseña temporal.');
    httpMock.expectNone('/api/active-directory/usuarios/jperez/reset-password');
  });

  it('emite saved con el usuario actualizado cuando el reset es exitoso', () => {
    const component = createComponent();
    let result: any = null;
    component.saved.subscribe((r) => (result = r));
    component.newPassword = 'Temporal123';
    component.forceChange = true;
    component.submit();

    httpMock.expectOne('/api/active-directory/usuarios/jperez/reset-password').flush({
      success: true,
      message: 'Contraseña restablecida.',
      data: { samAccountName: 'jperez', displayName: 'Juan Perez' },
    });

    expect(result.user.samAccountName).toBe('jperez');
    expect(result.notice).toEqual({ tone: 'success', text: 'Contraseña restablecida.' });
    expect(component.working).toBe(false);
  });

  it('muestra el error y no emite saved cuando el backend responde success:false', () => {
    const component = createComponent();
    let emitted = false;
    component.saved.subscribe(() => (emitted = true));
    component.newPassword = 'Temporal123';
    component.submit();

    httpMock.expectOne('/api/active-directory/usuarios/jperez/reset-password').flush({
      success: false,
      message: 'No se pudo restablecer.',
      data: null,
    });

    expect(emitted).toBe(false);
    expect(component.error).toBe('No se pudo restablecer.');
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `ng test --watch=false --include='**/ad-reset-password-panel.component.spec.ts'` (desde `soportedesk-frontend/`)
Expected: FAIL — no se puede resolver el módulo `./ad-reset-password-panel.component`.

- [ ] **Step 3: Crear el componente**

Crear `ad-reset-password-panel.component.ts`:

```ts
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SectionCardComponent } from '../../shared/section-card/section-card.component';
import { ActiveDirectoryService } from './active-directory.service';
import { AdPanelResult } from './active-directory.model';

@Component({
  selector: 'app-ad-reset-password-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, SectionCardComponent],
  template: `
    <form class="modal-form" (ngSubmit)="submit()">
      <app-section-card title="Nueva contraseña">
        <svg icon xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="7.5" cy="15.5" r="5.5" /><path d="m21 2-9.6 9.6" /><path d="m15.5 7.5 3 3L22 7l-3-3" />
        </svg>

        <div class="notice error" *ngIf="error">{{ error }}</div>

        <div class="field">
          <label>Contraseña temporal</label>
          <input type="password" name="newPassword" [(ngModel)]="newPassword" minlength="8" required />
        </div>
        <label class="checkbox-field">
          <input type="checkbox" name="forceChange" [(ngModel)]="forceChange" />
          Exigir cambio al iniciar sesión
        </label>
      </app-section-card>

      <footer class="modal-actions">
        <button type="button" class="btn btn-ghost" (click)="cancelled.emit()">Cancelar</button>
        <button type="submit" class="btn btn-primary" [disabled]="working">Guardar</button>
      </footer>
    </form>
  `,
  styleUrl: './usuarios-red.shared.scss',
})
export class AdResetPasswordPanelComponent {
  private adService = inject(ActiveDirectoryService);

  @Input({ required: true }) samAccountName!: string;
  @Output() saved = new EventEmitter<AdPanelResult>();
  @Output() cancelled = new EventEmitter<void>();

  newPassword = '';
  forceChange = true;
  working = false;
  error = '';

  submit(): void {
    const password = this.newPassword.trim();
    if (!password) {
      this.error = 'Ingresa una contraseña temporal.';
      return;
    }
    this.error = '';
    this.working = true;
    this.adService.resetPassword(this.samAccountName, password, this.forceChange).subscribe({
      next: (response) => {
        this.working = false;
        if (!response.success) {
          this.error = response.message;
          return;
        }
        this.saved.emit({ user: response.data!, notice: { tone: 'success', text: response.message } });
      },
      error: () => {
        this.working = false;
        this.error = 'No se pudo completar la acción.';
      },
    });
  }
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `ng test --watch=false --include='**/ad-reset-password-panel.component.spec.ts'` (desde `soportedesk-frontend/`)
Expected: PASS (3 specs).

- [ ] **Step 5: Commit**

```bash
git add soportedesk-frontend/src/app/features/usuarios-red/ad-reset-password-panel.component.ts soportedesk-frontend/src/app/features/usuarios-red/ad-reset-password-panel.component.spec.ts
git commit -m "feat: extraer panel de reset de contraseña AD como componente autocontenido"
```

---

## Task 4: `ad-move-ou-panel.component.ts`

**Files:**
- Create: `soportedesk-frontend/src/app/features/usuarios-red/ad-move-ou-panel.component.ts`
- Test: `soportedesk-frontend/src/app/features/usuarios-red/ad-move-ou-panel.component.spec.ts`

**Interfaces:**
- Consumes: `ActiveDirectoryService.searchOus(nombre): Observable<ActiveDirectoryOu[]>`, `ActiveDirectoryService.moveUser(samAccountName, ouDestinoDn): Observable<ActiveDirectoryResponse<AdUser>>` (ya existen).
- Produces: componente `app-ad-move-ou-panel` con `@Input({required:true}) samAccountName: string`, `@Output() saved: EventEmitter<AdPanelResult>`. Consumido por Task 8. No emite `cancelled` (el modal original no tiene botón "Cancelar" en este panel, solo cierre por X/backdrop).

- [ ] **Step 1: Escribir el spec**

Crear `ad-move-ou-panel.component.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AdMoveOuPanelComponent } from './ad-move-ou-panel.component';

describe('AdMoveOuPanelComponent', () => {
  let httpMock: HttpTestingController;

  function createComponent(): AdMoveOuPanelComponent {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    httpMock = TestBed.inject(HttpTestingController);
    const component = TestBed.runInInjectionContext(() => new AdMoveOuPanelComponent());
    component.samAccountName = 'jperez';
    return component;
  }

  afterEach(() => httpMock.verify());

  it('no busca si el termino tiene menos de 2 caracteres', () => {
    const component = createComponent();
    component.ouSearch = 'a';
    component.search();
    httpMock.expectNone((req) => req.url === '/api/active-directory/ous');
  });

  it('busca OUs y llena los resultados', () => {
    const component = createComponent();
    component.ouSearch = 'Soporte';
    component.search();
    httpMock
      .expectOne((req) => req.url === '/api/active-directory/ous' && req.params.get('nombre') === 'Soporte')
      .flush([{ name: 'Soporte', dn: 'OU=Soporte,DC=inia,DC=local' }]);
    expect(component.results.length).toBe(1);
  });

  it('emite saved con el usuario actualizado al mover exitosamente', () => {
    const component = createComponent();
    let result: any = null;
    component.saved.subscribe((r) => (result = r));
    component.move('OU=Soporte,DC=inia,DC=local');

    httpMock.expectOne('/api/active-directory/usuarios/jperez/mover-ou').flush({
      success: true,
      message: 'Usuario movido.',
      data: { samAccountName: 'jperez', organizationalUnit: 'OU=Soporte,DC=inia,DC=local' },
    });

    expect(result.user.organizationalUnit).toBe('OU=Soporte,DC=inia,DC=local');
    expect(component.working).toBe(false);
  });

  it('muestra error y no emite saved si el backend responde success:false', () => {
    const component = createComponent();
    let emitted = false;
    component.saved.subscribe(() => (emitted = true));
    component.move('OU=X');

    httpMock.expectOne('/api/active-directory/usuarios/jperez/mover-ou').flush({
      success: false,
      message: 'No se pudo mover.',
      data: null,
    });

    expect(emitted).toBe(false);
    expect(component.error).toBe('No se pudo mover.');
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `ng test --watch=false --include='**/ad-move-ou-panel.component.spec.ts'` (desde `soportedesk-frontend/`)
Expected: FAIL — no se puede resolver el módulo `./ad-move-ou-panel.component`.

- [ ] **Step 3: Crear el componente**

Crear `ad-move-ou-panel.component.ts`:

```ts
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SectionCardComponent } from '../../shared/section-card/section-card.component';
import { ActiveDirectoryService } from './active-directory.service';
import { ActiveDirectoryOu, AdPanelResult } from './active-directory.model';

@Component({
  selector: 'app-ad-move-ou-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, SectionCardComponent],
  template: `
    <app-section-card title="Nueva unidad organizativa">
      <svg icon xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>

      <div class="notice error" *ngIf="error">{{ error }}</div>

      <div class="inline-search">
        <input name="ouSearch" [(ngModel)]="ouSearch" placeholder="Buscar OU" (keyup.enter)="search()" />
        <button type="button" class="btn btn-ghost" (click)="search()">Buscar</button>
      </div>
      <div class="pick-list" *ngIf="results.length">
        <button type="button" *ngFor="let ou of results" [disabled]="working" (click)="move(ou.dn)">
          <strong>{{ ou.name }}</strong>
          <span>{{ ou.dn }}</span>
        </button>
      </div>
    </app-section-card>
  `,
  styleUrl: './usuarios-red.shared.scss',
})
export class AdMoveOuPanelComponent {
  private adService = inject(ActiveDirectoryService);

  @Input({ required: true }) samAccountName!: string;
  @Output() saved = new EventEmitter<AdPanelResult>();

  ouSearch = '';
  results: ActiveDirectoryOu[] = [];
  working = false;
  error = '';

  search(): void {
    const term = this.ouSearch.trim();
    if (term.length < 2) return;
    this.adService.searchOus(term).subscribe((ous) => (this.results = ous));
  }

  move(ouDn: string): void {
    if (!ouDn) return;
    this.error = '';
    this.working = true;
    this.adService.moveUser(this.samAccountName, ouDn).subscribe({
      next: (response) => {
        this.working = false;
        if (!response.success) {
          this.error = response.message;
          return;
        }
        this.saved.emit({ user: response.data!, notice: { tone: 'success', text: response.message } });
      },
      error: () => {
        this.working = false;
        this.error = 'No se pudo completar la acción.';
      },
    });
  }
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `ng test --watch=false --include='**/ad-move-ou-panel.component.spec.ts'` (desde `soportedesk-frontend/`)
Expected: PASS (4 specs).

- [ ] **Step 5: Commit**

```bash
git add soportedesk-frontend/src/app/features/usuarios-red/ad-move-ou-panel.component.ts soportedesk-frontend/src/app/features/usuarios-red/ad-move-ou-panel.component.spec.ts
git commit -m "feat: extraer panel de mover OU como componente autocontenido"
```

---

## Task 5: `ad-groups-panel.component.ts`

**Files:**
- Create: `soportedesk-frontend/src/app/features/usuarios-red/ad-groups-panel.component.ts`
- Test: `soportedesk-frontend/src/app/features/usuarios-red/ad-groups-panel.component.spec.ts`

**Interfaces:**
- Consumes: `ActiveDirectoryService.getUserGroups`, `.searchGroups`, `.addGroup`, `.removeGroup` (ya existen).
- Produces: componente `app-ad-groups-panel` con `@Input({required:true}) samAccountName: string`, `@Output() changed: EventEmitter<AdPanelResult>`. A diferencia de los demás paneles, **no cierra el modal** (no emite un evento que el padre interprete como cierre) — el padre solo refresca `user`/`dashboard`. Consumido por Task 8.

- [ ] **Step 1: Escribir el spec**

Crear `ad-groups-panel.component.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AdGroupsPanelComponent } from './ad-groups-panel.component';

describe('AdGroupsPanelComponent', () => {
  let httpMock: HttpTestingController;

  function createComponent(): AdGroupsPanelComponent {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    httpMock = TestBed.inject(HttpTestingController);
    const component = TestBed.runInInjectionContext(() => new AdGroupsPanelComponent());
    component.samAccountName = 'jperez';
    return component;
  }

  afterEach(() => httpMock.verify());

  it('carga los grupos asignados al iniciar', () => {
    const component = createComponent();
    component.ngOnInit();
    httpMock.expectOne('/api/active-directory/usuarios/jperez/grupos').flush([
      { cn: 'Soporte-TI', dn: 'CN=Soporte-TI,DC=inia,DC=local', description: null },
    ]);
    expect(component.groups.length).toBe(1);
  });

  it('agrega un grupo, recarga la lista y emite changed con el usuario actualizado', () => {
    const component = createComponent();
    component.ngOnInit();
    httpMock.expectOne('/api/active-directory/usuarios/jperez/grupos').flush([]);

    let result: any = null;
    component.changed.subscribe((r) => (result = r));
    component.add('CN=Soporte-TI,DC=inia,DC=local');

    httpMock.expectOne('/api/active-directory/usuarios/jperez/grupos/agregar').flush({
      success: true,
      message: 'Grupo agregado.',
      data: { samAccountName: 'jperez' },
    });
    httpMock.expectOne('/api/active-directory/usuarios/jperez/grupos').flush([
      { cn: 'Soporte-TI', dn: 'CN=Soporte-TI,DC=inia,DC=local', description: null },
    ]);

    expect(result.notice.text).toBe('Grupo agregado.');
    expect(component.groups.length).toBe(1);
  });

  it('muestra error y no emite changed si el backend responde success:false', () => {
    const component = createComponent();
    component.ngOnInit();
    httpMock.expectOne('/api/active-directory/usuarios/jperez/grupos').flush([]);

    let emitted = false;
    component.changed.subscribe(() => (emitted = true));
    component.remove('CN=Soporte-TI,DC=inia,DC=local');

    httpMock.expectOne('/api/active-directory/usuarios/jperez/grupos/quitar').flush({
      success: false,
      message: 'No se pudo quitar el grupo.',
      data: null,
    });

    expect(emitted).toBe(false);
    expect(component.error).toBe('No se pudo quitar el grupo.');
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `ng test --watch=false --include='**/ad-groups-panel.component.spec.ts'` (desde `soportedesk-frontend/`)
Expected: FAIL — no se puede resolver el módulo `./ad-groups-panel.component`.

- [ ] **Step 3: Crear el componente**

Crear `ad-groups-panel.component.ts`:

```ts
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { SectionCardComponent } from '../../shared/section-card/section-card.component';
import { ActiveDirectoryService } from './active-directory.service';
import { ActiveDirectoryGroup, ActiveDirectoryResponse, AdPanelResult, AdUser } from './active-directory.model';

@Component({
  selector: 'app-ad-groups-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, SectionCardComponent],
  template: `
    <app-section-card title="Membresías">
      <svg icon xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>

      <div class="notice error" *ngIf="error">{{ error }}</div>

      <div class="inline-search">
        <input name="groupSearch" [(ngModel)]="groupSearch" placeholder="Buscar grupo" (keyup.enter)="search()" />
        <button type="button" class="btn btn-ghost" (click)="search()">Buscar</button>
      </div>
      <div class="pick-list" *ngIf="results.length">
        <button type="button" *ngFor="let group of results" [disabled]="working" (click)="add(group.dn)">
          <strong>{{ group.cn }}</strong>
          <span>{{ group.description || group.dn }}</span>
        </button>
      </div>
      <div class="assigned-list" *ngIf="groups.length">
        <div *ngFor="let group of groups">
          <span>{{ group.cn }}</span>
          <button type="button" class="link-danger" [disabled]="working" (click)="remove(group.dn)">Quitar</button>
        </div>
      </div>
    </app-section-card>
  `,
  styleUrl: './usuarios-red.shared.scss',
})
export class AdGroupsPanelComponent implements OnInit {
  private adService = inject(ActiveDirectoryService);

  @Input({ required: true }) samAccountName!: string;
  @Output() changed = new EventEmitter<AdPanelResult>();

  groupSearch = '';
  results: ActiveDirectoryGroup[] = [];
  groups: ActiveDirectoryGroup[] = [];
  working = false;
  error = '';

  ngOnInit(): void {
    this.loadGroups();
  }

  search(): void {
    const term = this.groupSearch.trim();
    if (term.length < 2) return;
    this.adService.searchGroups(term).subscribe((groups) => (this.results = groups));
  }

  add(groupDn: string): void {
    if (!groupDn) return;
    this.run(this.adService.addGroup(this.samAccountName, groupDn));
  }

  remove(groupDn: string): void {
    if (!groupDn) return;
    this.run(this.adService.removeGroup(this.samAccountName, groupDn));
  }

  private run(request: Observable<ActiveDirectoryResponse<AdUser>>): void {
    this.error = '';
    this.working = true;
    request.subscribe({
      next: (response) => {
        this.working = false;
        if (!response.success) {
          this.error = response.message;
          return;
        }
        this.loadGroups();
        this.changed.emit({ user: response.data!, notice: { tone: 'success', text: response.message } });
      },
      error: () => {
        this.working = false;
        this.error = 'No se pudo completar la acción.';
      },
    });
  }

  private loadGroups(): void {
    this.adService.getUserGroups(this.samAccountName).subscribe({
      next: (groups) => (this.groups = groups),
      error: () => (this.groups = []),
    });
  }
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `ng test --watch=false --include='**/ad-groups-panel.component.spec.ts'` (desde `soportedesk-frontend/`)
Expected: PASS (3 specs).

- [ ] **Step 5: Commit**

```bash
git add soportedesk-frontend/src/app/features/usuarios-red/ad-groups-panel.component.ts soportedesk-frontend/src/app/features/usuarios-red/ad-groups-panel.component.spec.ts
git commit -m "feat: extraer panel de membresias de grupos AD como componente autocontenido"
```

---

## Task 6: `ad-edit-info-panel.component.ts`

**Files:**
- Create: `soportedesk-frontend/src/app/features/usuarios-red/ad-edit-info-panel.component.ts`
- Test: `soportedesk-frontend/src/app/features/usuarios-red/ad-edit-info-panel.component.spec.ts`

**Interfaces:**
- Consumes: `ActiveDirectoryService.updateInfo`, `CatalogoService.getDependencias()`, `CatalogoService.getSubdependencias(id)` (ya existen).
- Produces: componente `app-ad-edit-info-panel` con `@Input({required:true}) user: AdUser`, `@Output() saved: EventEmitter<AdPanelResult>`, `@Output() cancelled: EventEmitter<void>`. Consumido por Task 8.

- [ ] **Step 1: Escribir el spec**

Crear `ad-edit-info-panel.component.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AdEditInfoPanelComponent } from './ad-edit-info-panel.component';
import { AdUser } from './active-directory.model';

function buildUser(overrides: Partial<AdUser> = {}): AdUser {
  return {
    samAccountName: 'jperez',
    displayName: 'Juan Perez',
    givenName: 'Juan',
    surname: 'Perez',
    mail: 'jperez@inia.local',
    department: 'Soporte',
    company: null,
    title: 'Analista',
    telephoneNumber: null,
    mobile: null,
    office: 'Soporte',
    description: null,
    distinguishedName: null,
    userPrincipalName: 'jperez@inia.local',
    enabled: true,
    locked: false,
    organizationalUnit: null,
    whenCreated: null,
    whenChanged: null,
    pwdLastSet: null,
    lastLogonTimestamp: null,
    accountExpires: null,
    badPwdCount: null,
    daysSincePasswordChange: null,
    groups: [],
    ...overrides,
  };
}

describe('AdEditInfoPanelComponent', () => {
  let httpMock: HttpTestingController;

  function createComponent(user: AdUser): AdEditInfoPanelComponent {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    httpMock = TestBed.inject(HttpTestingController);
    const component = TestBed.runInInjectionContext(() => new AdEditInfoPanelComponent());
    component.user = user;
    return component;
  }

  afterEach(() => httpMock.verify());

  it('precarga el formulario y selecciona la dependencia que coincide con el area de AD', () => {
    const component = createComponent(buildUser());
    component.ngOnInit();

    httpMock.expectOne('/api/catalogos/dependencias').flush([
      { id: 1, nombre: 'Soporte' },
      { id: 2, nombre: 'Administracion' },
    ]);
    httpMock
      .expectOne((req) => req.url === '/api/catalogos/subdependencias' && req.params.get('dependenciaId') === '1')
      .flush([{ id: 10, nombre: 'Soporte' }]);

    expect(component.form.displayName).toBe('Juan Perez');
    expect(component.dependenciaId).toBe(1);
  });

  it('emite saved con el usuario actualizado cuando el guardado es exitoso', () => {
    const component = createComponent(buildUser());
    component.ngOnInit();
    httpMock.expectOne('/api/catalogos/dependencias').flush([]);

    let result: any = null;
    component.saved.subscribe((r) => (result = r));
    component.submit();

    httpMock.expectOne('/api/active-directory/usuarios/jperez/actualizar-info').flush({
      success: true,
      message: 'Datos actualizados.',
      data: buildUser({ title: 'Analista Senior' }),
    });

    expect(result.user.title).toBe('Analista Senior');
  });

  it('muestra error y no emite saved si el backend responde success:false', () => {
    const component = createComponent(buildUser());
    component.ngOnInit();
    httpMock.expectOne('/api/catalogos/dependencias').flush([]);

    let emitted = false;
    component.saved.subscribe(() => (emitted = true));
    component.submit();

    httpMock.expectOne('/api/active-directory/usuarios/jperez/actualizar-info').flush({
      success: false,
      message: 'No se pudo actualizar.',
      data: null,
    });

    expect(emitted).toBe(false);
    expect(component.error).toBe('No se pudo actualizar.');
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `ng test --watch=false --include='**/ad-edit-info-panel.component.spec.ts'` (desde `soportedesk-frontend/`)
Expected: FAIL — no se puede resolver el módulo `./ad-edit-info-panel.component`.

- [ ] **Step 3: Crear el componente**

Crear `ad-edit-info-panel.component.ts`:

```ts
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SectionCardComponent } from '../../shared/section-card/section-card.component';
import { CatalogoService } from '../../core/catalogos/catalogo.service';
import { Dependencia, Subdependencia } from '../../core/models/catalogo.model';
import { ActiveDirectoryService } from './active-directory.service';
import { AdPanelResult, AdUser, UpdateUserInfoRequest } from './active-directory.model';

@Component({
  selector: 'app-ad-edit-info-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, SectionCardComponent],
  template: `
    <form class="modal-form form-grid" (ngSubmit)="submit()">
      <app-section-card title="Datos de AD" class="full">
        <svg icon xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z" />
        </svg>

        <div class="notice error full" *ngIf="error">{{ error }}</div>

        <div class="field"><label>Nombre mostrado</label><input name="displayName" [(ngModel)]="form.displayName" /></div>
        <div class="field"><label>Cargo</label><input name="title" [(ngModel)]="form.title" /></div>
        <div class="field">
          <label>Dependencia</label>
          <select name="dependenciaId" [(ngModel)]="dependenciaId" (ngModelChange)="onDependenciaChange($event)">
            <option [ngValue]="null">Seleccione...</option>
            <option *ngFor="let dependencia of dependencias" [ngValue]="dependencia.id">{{ dependencia.nombre }}</option>
          </select>
        </div>
        <div class="field">
          <label>Subdependencia</label>
          <select name="subdependenciaId" [(ngModel)]="subdependenciaId" (ngModelChange)="onSubdependenciaChange($event)" [disabled]="!dependenciaId">
            <option [ngValue]="null">Usar dependencia seleccionada</option>
            <option *ngFor="let subdependencia of subdependencias" [ngValue]="subdependencia.id">{{ subdependencia.nombre }}</option>
          </select>
        </div>
        <div class="field"><label>Telefono</label><input name="telephoneNumber" [(ngModel)]="form.telephoneNumber" /></div>
        <div class="field"><label>Celular</label><input name="mobile" [(ngModel)]="form.mobile" /></div>
        <div class="field"><label>Correo</label><input name="mail" [(ngModel)]="form.mail" /></div>
        <div class="field full"><label>Descripcion</label><textarea name="description" rows="3" [(ngModel)]="form.description"></textarea></div>
      </app-section-card>

      <footer class="modal-actions full">
        <button type="button" class="btn btn-ghost" (click)="cancelled.emit()">Cancelar</button>
        <button type="submit" class="btn btn-primary" [disabled]="working">Guardar</button>
      </footer>
    </form>
  `,
  styleUrl: './usuarios-red.shared.scss',
})
export class AdEditInfoPanelComponent implements OnInit {
  private adService = inject(ActiveDirectoryService);
  private catalogoService = inject(CatalogoService);

  @Input({ required: true }) user!: AdUser;
  @Output() saved = new EventEmitter<AdPanelResult>();
  @Output() cancelled = new EventEmitter<void>();

  form: UpdateUserInfoRequest = {};
  dependencias: Dependencia[] = [];
  subdependencias: Subdependencia[] = [];
  dependenciaId: number | null = null;
  subdependenciaId: number | null = null;
  working = false;
  error = '';

  ngOnInit(): void {
    this.form = {
      displayName: this.user.displayName,
      title: this.user.title,
      department: this.user.department,
      office: this.user.office,
      telephoneNumber: this.user.telephoneNumber,
      mobile: this.user.mobile,
      mail: this.user.mail,
      description: this.user.description,
    };
    this.catalogoService.getDependencias().subscribe({
      next: (items) => {
        this.dependencias = this.sortByName(items);
        this.syncCatalogSelectionFromInfo();
      },
      error: () => (this.dependencias = []),
    });
  }

  onDependenciaChange(value: number | null): void {
    this.dependenciaId = this.normalizeSelectId(value);
    this.subdependenciaId = null;
    this.subdependencias = [];
    const dependencia = this.findDependencia(this.dependenciaId);
    this.form = { ...this.form, department: dependencia?.nombre ?? null, office: dependencia?.nombre ?? null };
    if (this.dependenciaId) {
      this.catalogoService.getSubdependencias(this.dependenciaId).subscribe((items) => (this.subdependencias = this.sortByName(items)));
    }
  }

  onSubdependenciaChange(value: number | null): void {
    this.subdependenciaId = this.normalizeSelectId(value);
    const subdependencia = this.findSubdependencia(this.subdependenciaId);
    this.form = { ...this.form, office: subdependencia?.nombre || this.form.department || null };
  }

  submit(): void {
    this.error = '';
    this.working = true;
    const department = this.blankToNull(this.form.department);
    const office = this.blankToNull(this.form.office) ?? department;
    const request: UpdateUserInfoRequest = {
      displayName: this.blankToNull(this.form.displayName),
      title: this.blankToNull(this.form.title),
      department,
      office,
      telephoneNumber: this.blankToNull(this.form.telephoneNumber),
      mobile: this.blankToNull(this.form.mobile),
      mail: this.blankToNull(this.form.mail),
      description: this.blankToNull(this.form.description),
    };
    this.adService.updateInfo(this.user.samAccountName, request).subscribe({
      next: (response) => {
        this.working = false;
        if (!response.success) {
          this.error = response.message;
          return;
        }
        this.saved.emit({ user: response.data!, notice: { tone: 'success', text: response.message } });
      },
      error: () => {
        this.working = false;
        this.error = 'No se pudo completar la acción.';
      },
    });
  }

  private syncCatalogSelectionFromInfo(): void {
    const dependencia = this.findDependenciaByName(this.form.department);
    this.dependenciaId = dependencia?.id ?? null;
    this.subdependenciaId = null;
    this.subdependencias = [];
    if (!dependencia) return;

    this.catalogoService.getSubdependencias(dependencia.id).subscribe((items) => {
      this.subdependencias = this.sortByName(items);
      const office = this.normalizeName(this.form.office);
      const department = this.normalizeName(this.form.department);
      this.subdependenciaId = office && office !== department
        ? (this.subdependencias.find((item) => this.normalizeName(item.nombre) === office)?.id ?? null)
        : null;
      if (!this.subdependenciaId && this.form.department) {
        this.form = { ...this.form, office: this.form.department };
      }
    });
  }

  private findDependencia(id: number | null): Dependencia | null {
    return id ? (this.dependencias.find((item) => item.id === id) ?? null) : null;
  }

  private findDependenciaByName(name: string | null | undefined): Dependencia | null {
    const normalized = this.normalizeName(name);
    return normalized ? (this.dependencias.find((item) => this.normalizeName(item.nombre) === normalized) ?? null) : null;
  }

  private findSubdependencia(id: number | null): Subdependencia | null {
    return id ? (this.subdependencias.find((item) => item.id === id) ?? null) : null;
  }

  private normalizeSelectId(value: number | string | null | undefined): number | null {
    if (value === null || value === undefined || value === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private normalizeName(value: string | null | undefined): string {
    return value?.trim().toLowerCase() ?? '';
  }

  private sortByName<T extends { nombre: string }>(items: T[]): T[] {
    return [...items].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }

  private blankToNull(value: string | null | undefined): string | null {
    return value?.trim() ? value.trim() : null;
  }
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `ng test --watch=false --include='**/ad-edit-info-panel.component.spec.ts'` (desde `soportedesk-frontend/`)
Expected: PASS (3 specs).

- [ ] **Step 5: Commit**

```bash
git add soportedesk-frontend/src/app/features/usuarios-red/ad-edit-info-panel.component.ts soportedesk-frontend/src/app/features/usuarios-red/ad-edit-info-panel.component.spec.ts
git commit -m "feat: extraer panel de edicion de datos AD como componente autocontenido"
```

---

## Task 7: `ad-create-user-panel.component.ts`

**Files:**
- Create: `soportedesk-frontend/src/app/features/usuarios-red/ad-create-user-panel.component.ts`
- Test: `soportedesk-frontend/src/app/features/usuarios-red/ad-create-user-panel.component.spec.ts`

**Interfaces:**
- Consumes: `ActiveDirectoryService.createUser`, `.searchOus`, `CatalogoService.getDependencias/getSubdependencias/getTiposContrato`, `UsuarioRedContratoService.create` (ya existen). `esTipoContratoOs` de `usuario-red-contrato.model.ts`.
- Produces: componente `app-ad-create-user-panel` con `@Output() saved: EventEmitter<AdPanelResult>`, `@Output() cancelled: EventEmitter<void>`. Sin `@Input` (alta nueva, no requiere usuario existente). Consumido por Task 8.

- [ ] **Step 1: Escribir el spec**

Crear `ad-create-user-panel.component.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AdCreateUserPanelComponent } from './ad-create-user-panel.component';

describe('AdCreateUserPanelComponent', () => {
  let httpMock: HttpTestingController;

  function createComponent(): AdCreateUserPanelComponent {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    httpMock = TestBed.inject(HttpTestingController);
    const component = TestBed.runInInjectionContext(() => new AdCreateUserPanelComponent());
    component.ngOnInit();
    httpMock.expectOne('/api/catalogos/dependencias').flush([]);
    return component;
  }

  afterEach(() => httpMock.verify());

  it('autogenera el UPN a partir del usuario mientras no se edite manualmente', () => {
    const component = createComponent();
    component.onSamChanged('jperez');
    expect(component.form.userPrincipalName).toBe('jperez@inia.local');

    component.onUpnChanged('otro@inia.local');
    component.onSamChanged('jperez2');
    expect(component.form.userPrincipalName).toBe('otro@inia.local');
  });

  it('no envia la peticion si faltan campos obligatorios', () => {
    const component = createComponent();
    component.submit();
    expect(component.error).toBe('Completa usuario, nombres, apellidos, contraseña temporal y OU destino.');
    httpMock.expectNone('/api/active-directory/usuarios');
  });

  it('crea el usuario sin contrato y emite saved', () => {
    const component = createComponent();
    component.form.samAccountName = 'jperez';
    component.form.givenName = 'Juan';
    component.form.surname = 'Perez';
    component.form.temporaryPassword = 'Temporal123';
    component.form.ouDestinoDn = 'OU=Soporte,DC=inia,DC=local';

    let result: any = null;
    component.saved.subscribe((r) => (result = r));
    component.submit();

    httpMock.expectOne('/api/active-directory/usuarios').flush({
      success: true,
      message: 'Usuario creado.',
      data: { samAccountName: 'jperez' },
    });

    expect(result.user.samAccountName).toBe('jperez');
    expect(result.notice.text).toBe('Usuario creado.');
  });

  it('crea el usuario con contrato inicial y encadena el registro del contrato', () => {
    const component = createComponent();
    component.form.samAccountName = 'jperez';
    component.form.givenName = 'Juan';
    component.form.surname = 'Perez';
    component.form.temporaryPassword = 'Temporal123';
    component.form.ouDestinoDn = 'OU=Soporte,DC=inia,DC=local';
    component.contratoEnabled = true;
    component.contratoForm.tipoContratoId = 5;
    component.contratoForm.fechaInicio = '2026-07-13';

    let result: any = null;
    component.saved.subscribe((r) => (result = r));
    component.submit();

    httpMock.expectOne('/api/active-directory/usuarios').flush({
      success: true,
      message: 'Usuario creado.',
      data: { samAccountName: 'jperez' },
    });
    httpMock.expectOne('/api/usuarios-red/contratos').flush({
      id: 1, usuario: 'jperez', tipoContratoId: 5, tipoContratoNombre: 'CAS', fechaInicio: '2026-07-13', fechaFin: null,
      numeroContrato: null, personalNombre: null, personalApellidos: null, registradoPor: null, fechaRegistro: null,
      actualizadoPor: null, fechaActualizacion: null,
    });

    expect(result.notice.text).toBe('Usuario creado. Contrato inicial registrado.');
  });

  it('si el registro del contrato falla, igual emite saved pero con notice de error', () => {
    const component = createComponent();
    component.form.samAccountName = 'jperez';
    component.form.givenName = 'Juan';
    component.form.surname = 'Perez';
    component.form.temporaryPassword = 'Temporal123';
    component.form.ouDestinoDn = 'OU=Soporte,DC=inia,DC=local';
    component.contratoEnabled = true;
    component.contratoForm.tipoContratoId = 5;
    component.contratoForm.fechaInicio = '2026-07-13';

    let result: any = null;
    component.saved.subscribe((r) => (result = r));
    component.submit();

    httpMock.expectOne('/api/active-directory/usuarios').flush({
      success: true,
      message: 'Usuario creado.',
      data: { samAccountName: 'jperez' },
    });
    httpMock
      .expectOne('/api/usuarios-red/contratos')
      .flush({ message: 'Tipo de contrato invalido.' }, { status: 400, statusText: 'Bad Request' });

    expect(result.notice.tone).toBe('error');
    expect(result.notice.text).toContain('Usuario creado en AD, pero no se pudo registrar el contrato');
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `ng test --watch=false --include='**/ad-create-user-panel.component.spec.ts'` (desde `soportedesk-frontend/`)
Expected: FAIL — no se puede resolver el módulo `./ad-create-user-panel.component`.

- [ ] **Step 3: Crear el componente**

Crear `ad-create-user-panel.component.ts`:

```ts
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SectionCardComponent } from '../../shared/section-card/section-card.component';
import { CatalogoService } from '../../core/catalogos/catalogo.service';
import { Dependencia, Subdependencia, TipoContrato } from '../../core/models/catalogo.model';
import { ActiveDirectoryService } from './active-directory.service';
import { ActiveDirectoryOu, AdPanelResult, CreateAdUserRequest } from './active-directory.model';
import { UsuarioRedContratoRequest, esTipoContratoOs } from './usuario-red-contrato.model';
import { UsuarioRedContratoService } from './usuario-red-contrato.service';

@Component({
  selector: 'app-ad-create-user-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, SectionCardComponent],
  template: `
    <form class="modal-form" (ngSubmit)="submit()">
      <div class="notice error" *ngIf="error">{{ error }}</div>

      <app-section-card title="Cuenta">
        <svg icon xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
        </svg>
        <div class="form-grid">
          <div class="field">
            <label>Usuario</label>
            <input name="samAccountName" [(ngModel)]="form.samAccountName" (ngModelChange)="onSamChanged($event)" required minlength="2" pattern="[A-Za-z0-9._-]+" />
          </div>
          <div class="field">
            <label>Contraseña temporal</label>
            <input type="password" name="temporaryPassword" [(ngModel)]="form.temporaryPassword" minlength="8" required />
          </div>
          <div class="field">
            <label>Nombres</label>
            <input name="givenName" [(ngModel)]="form.givenName" required />
          </div>
          <div class="field">
            <label>Apellidos</label>
            <input name="surname" [(ngModel)]="form.surname" required />
          </div>
          <div class="field">
            <label>Nombre mostrado</label>
            <input name="displayName" [(ngModel)]="form.displayName" />
          </div>
          <div class="field">
            <label>Correo</label>
            <input type="email" name="mail" [(ngModel)]="form.mail" />
          </div>
          <div class="field">
            <label>UPN</label>
            <input name="userPrincipalName" [(ngModel)]="form.userPrincipalName" (ngModelChange)="onUpnChanged($event)" placeholder="usuario@inia.local" />
          </div>
          <div class="field">
            <label>Cargo</label>
            <input name="title" [(ngModel)]="form.title" />
          </div>
          <label class="checkbox-field">
            <input type="checkbox" name="enabled" [(ngModel)]="form.enabled" />
            Habilitar cuenta al crearla
          </label>
          <label class="checkbox-field">
            <input type="checkbox" name="forceChange" [(ngModel)]="form.forceChange" />
            Exigir cambio al iniciar sesión
          </label>
        </div>
      </app-section-card>

      <app-section-card title="Ubicación">
        <svg icon xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 21s7-4.35 7-11a7 7 0 1 0-14 0c0 6.65 7 11 7 11z" /><circle cx="12" cy="10" r="2" />
        </svg>
        <div class="form-grid">
          <div class="field">
            <label>Dependencia</label>
            <select name="dependenciaId" [(ngModel)]="dependenciaId" (ngModelChange)="onDependenciaChange($event)">
              <option [ngValue]="null">Seleccione...</option>
              <option *ngFor="let dependencia of dependencias" [ngValue]="dependencia.id">{{ dependencia.nombre }}</option>
            </select>
          </div>
          <div class="field">
            <label>Subdependencia</label>
            <select name="subdependenciaId" [(ngModel)]="subdependenciaId" (ngModelChange)="onSubdependenciaChange($event)" [disabled]="!dependenciaId">
              <option [ngValue]="null">Usar dependencia seleccionada</option>
              <option *ngFor="let subdependencia of subdependencias" [ngValue]="subdependencia.id">{{ subdependencia.nombre }}</option>
            </select>
          </div>
          <div class="field">
            <label>Telefono</label>
            <input name="telephoneNumber" [(ngModel)]="form.telephoneNumber" />
          </div>
          <div class="field">
            <label>Celular</label>
            <input name="mobile" [(ngModel)]="form.mobile" />
          </div>
          <div class="field full">
            <label>Unidad organizativa destino</label>
            <div class="inline-search">
              <input name="ouSearch" [(ngModel)]="ouSearch" placeholder="Buscar OU" (keyup.enter)="searchOus()" />
              <button type="button" class="btn btn-ghost" (click)="searchOus()">Buscar</button>
            </div>
            <div class="selected-dn" *ngIf="form.ouDestinoDn">{{ form.ouDestinoDn }}</div>
            <div class="pick-list" *ngIf="ouResults.length">
              <button type="button" *ngFor="let ou of ouResults" (click)="selectOu(ou)">
                <strong>{{ ou.name }}</strong>
                <span>{{ ou.dn }}</span>
              </button>
            </div>
          </div>
          <div class="field full">
            <label>Descripcion</label>
            <textarea name="description" rows="2" [(ngModel)]="form.description"></textarea>
          </div>
        </div>
      </app-section-card>

      <app-section-card title="Contrato">
        <svg icon xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" />
          <path d="M9 13h6" /><path d="M9 17h6" />
        </svg>
        <label class="checkbox-field contract-toggle">
          <input type="checkbox" name="contratoEnabled" [(ngModel)]="contratoEnabled" (ngModelChange)="onContratoToggle($event)" />
          Registrar contrato al crear el usuario
        </label>

        <div class="contract-inline-grid" *ngIf="contratoEnabled">
          <div class="field">
            <label>Tipo de contrato</label>
            <select name="tipoContratoId" [(ngModel)]="contratoForm.tipoContratoId" required>
              <option [ngValue]="null" disabled>Selecciona...</option>
              <option *ngFor="let tipo of tiposContrato" [ngValue]="tipo.id">{{ tipo.nombre }}</option>
            </select>
          </div>
          <div class="field">
            <label>Nro. de contrato</label>
            <input name="numeroContrato" [(ngModel)]="contratoForm.numeroContrato" />
          </div>
          <div class="field">
            <label>Fecha inicio</label>
            <input type="date" name="fechaInicio" [(ngModel)]="contratoForm.fechaInicio" required />
          </div>
          <div class="field">
            <label>Fecha fin</label>
            <input type="date" name="fechaFin" [(ngModel)]="contratoForm.fechaFin" />
          </div>
          <ng-container *ngIf="esContratoOs()">
            <div class="field">
              <label>Nombre del personal</label>
              <input name="personalNombre" [(ngModel)]="contratoForm.personalNombre" />
            </div>
            <div class="field">
              <label>Apellidos del personal</label>
              <input name="personalApellidos" [(ngModel)]="contratoForm.personalApellidos" />
            </div>
          </ng-container>
        </div>
      </app-section-card>

      <footer class="modal-actions">
        <button type="button" class="btn btn-ghost" (click)="cancelled.emit()">Cancelar</button>
        <button type="submit" class="btn btn-primary" [disabled]="working">{{ contratoEnabled ? 'Crear en AD y registrar contrato' : 'Crear en AD' }}</button>
      </footer>
    </form>
  `,
  styleUrl: './usuarios-red.shared.scss',
})
export class AdCreateUserPanelComponent implements OnInit {
  private adService = inject(ActiveDirectoryService);
  private contratoService = inject(UsuarioRedContratoService);
  private catalogoService = inject(CatalogoService);
  private readonly adDomain = 'inia.local';

  @Output() saved = new EventEmitter<AdPanelResult>();
  @Output() cancelled = new EventEmitter<void>();

  form: CreateAdUserRequest = this.emptyForm();
  contratoEnabled = false;
  contratoForm: UsuarioRedContratoRequest = this.emptyContratoForm();
  tiposContrato: TipoContrato[] = [];
  dependencias: Dependencia[] = [];
  subdependencias: Subdependencia[] = [];
  dependenciaId: number | null = null;
  subdependenciaId: number | null = null;
  ouSearch = '';
  ouResults: ActiveDirectoryOu[] = [];
  working = false;
  error = '';
  private upnEdited = false;

  ngOnInit(): void {
    this.catalogoService.getDependencias().subscribe({
      next: (items) => (this.dependencias = this.sortByName(items)),
      error: () => (this.dependencias = []),
    });
  }

  esContratoOs(): boolean {
    const tipo = this.tiposContrato.find((item) => item.id === this.contratoForm.tipoContratoId);
    return esTipoContratoOs(tipo?.nombre);
  }

  onSamChanged(value: string): void {
    this.form.samAccountName = value;
    this.contratoForm = { ...this.contratoForm, usuario: value };
    if (!this.upnEdited) {
      this.form.userPrincipalName = this.generatedUpn(value);
    }
  }

  onUpnChanged(value: string): void {
    this.form.userPrincipalName = value;
    this.upnEdited = !!value?.trim() && value.trim() !== this.generatedUpn(this.form.samAccountName);
  }

  onDependenciaChange(value: number | null): void {
    this.dependenciaId = this.normalizeSelectId(value);
    this.subdependenciaId = null;
    this.subdependencias = [];
    const dependencia = this.findDependencia(this.dependenciaId);
    this.form.department = dependencia?.nombre ?? '';
    this.form.office = dependencia?.nombre ?? '';
    if (this.dependenciaId) {
      this.catalogoService.getSubdependencias(this.dependenciaId).subscribe((items) => (this.subdependencias = this.sortByName(items)));
    }
  }

  onSubdependenciaChange(value: number | null): void {
    this.subdependenciaId = this.normalizeSelectId(value);
    const subdependencia = this.findSubdependencia(this.subdependenciaId);
    this.form.office = subdependencia?.nombre || this.form.department || '';
  }

  onContratoToggle(enabled: boolean): void {
    this.contratoEnabled = enabled;
    if (enabled) {
      this.contratoForm = { ...this.contratoForm, usuario: this.form.samAccountName };
      this.ensureTiposContrato();
    }
  }

  searchOus(): void {
    const term = this.ouSearch.trim();
    if (term.length < 2) return;
    this.adService.searchOus(term).subscribe((ous) => (this.ouResults = ous));
  }

  selectOu(ou: ActiveDirectoryOu): void {
    this.form.ouDestinoDn = ou.dn;
    this.ouSearch = ou.name;
    this.ouResults = [];
  }

  submit(): void {
    this.ensureUpn();
    const request = this.normalizedRequest();
    if (!request.samAccountName || !request.givenName || !request.surname || !request.temporaryPassword || !request.ouDestinoDn) {
      this.error = 'Completa usuario, nombres, apellidos, contraseña temporal y OU destino.';
      return;
    }
    if (request.temporaryPassword.length < 8) {
      this.error = 'La contraseña temporal debe tener al menos 8 caracteres.';
      return;
    }
    if (this.contratoEnabled && (!this.contratoForm.tipoContratoId || !this.contratoForm.fechaInicio)) {
      this.error = 'Completa tipo de contrato y fecha de inicio del contrato inicial.';
      return;
    }

    this.error = '';
    this.working = true;
    this.adService.createUser(request).subscribe({
      next: (response) => {
        if (!response.success || !response.data) {
          this.working = false;
          this.error = response.message;
          return;
        }
        const user = response.data;
        const usuarioCreado = user.samAccountName || request.samAccountName;
        if (!this.contratoEnabled) {
          this.working = false;
          this.saved.emit({ user, notice: { tone: 'success', text: response.message } });
          return;
        }
        this.contratoService.create(this.normalizedContratoRequest(usuarioCreado)).subscribe({
          next: () => {
            this.working = false;
            this.saved.emit({ user, notice: { tone: 'success', text: `${response.message} Contrato inicial registrado.` } });
          },
          error: (err) => {
            this.working = false;
            this.saved.emit({
              user,
              notice: { tone: 'error', text: `Usuario creado en AD, pero no se pudo registrar el contrato: ${err?.error?.message || 'error no especificado'}.` },
            });
          },
        });
      },
      error: () => {
        this.working = false;
        this.error = 'No se pudo crear el usuario en Active Directory.';
      },
    });
  }

  private ensureTiposContrato(): void {
    if (this.tiposContrato.length) return;
    this.catalogoService.getTiposContrato().subscribe({
      next: (tipos) => (this.tiposContrato = this.sortByName(tipos)),
      error: () => (this.tiposContrato = []),
    });
  }

  private emptyForm(): CreateAdUserRequest {
    return {
      samAccountName: '',
      givenName: '',
      surname: '',
      displayName: '',
      mail: '',
      userPrincipalName: '',
      temporaryPassword: '',
      ouDestinoDn: '',
      title: '',
      department: '',
      office: '',
      telephoneNumber: '',
      mobile: '',
      description: '',
      enabled: true,
      forceChange: true,
    };
  }

  private emptyContratoForm(): UsuarioRedContratoRequest {
    return {
      usuario: '',
      tipoContratoId: null as unknown as number,
      fechaInicio: '',
      fechaFin: null,
      numeroContrato: null,
      personalNombre: null,
      personalApellidos: null,
    };
  }

  private normalizedRequest(): CreateAdUserRequest {
    const department = this.blankToNull(this.form.department);
    const office = this.blankToNull(this.form.office) ?? department;
    return {
      samAccountName: this.form.samAccountName.trim(),
      givenName: this.form.givenName.trim(),
      surname: this.form.surname.trim(),
      displayName: this.blankToNull(this.form.displayName),
      mail: this.blankToNull(this.form.mail),
      userPrincipalName: this.blankToNull(this.form.userPrincipalName),
      temporaryPassword: this.form.temporaryPassword,
      ouDestinoDn: this.form.ouDestinoDn.trim(),
      title: this.blankToNull(this.form.title),
      department,
      office,
      telephoneNumber: this.blankToNull(this.form.telephoneNumber),
      mobile: this.blankToNull(this.form.mobile),
      description: this.blankToNull(this.form.description),
      enabled: this.form.enabled,
      forceChange: this.form.forceChange,
    };
  }

  private normalizedContratoRequest(usuario: string): UsuarioRedContratoRequest {
    return {
      usuario: usuario.trim(),
      tipoContratoId: this.contratoForm.tipoContratoId,
      fechaInicio: this.contratoForm.fechaInicio,
      fechaFin: this.blankToNull(this.contratoForm.fechaFin),
      numeroContrato: this.blankToNull(this.contratoForm.numeroContrato),
      personalNombre: this.blankToNull(this.contratoForm.personalNombre),
      personalApellidos: this.blankToNull(this.contratoForm.personalApellidos),
    };
  }

  private findDependencia(id: number | null): Dependencia | null {
    return id ? (this.dependencias.find((item) => item.id === id) ?? null) : null;
  }

  private findSubdependencia(id: number | null): Subdependencia | null {
    return id ? (this.subdependencias.find((item) => item.id === id) ?? null) : null;
  }

  private normalizeSelectId(value: number | string | null | undefined): number | null {
    if (value === null || value === undefined || value === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private sortByName<T extends { nombre: string }>(items: T[]): T[] {
    return [...items].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }

  private blankToNull(value: string | null | undefined): string | null {
    return value?.trim() ? value.trim() : null;
  }

  private ensureUpn(): void {
    if (!this.form.userPrincipalName?.trim()) {
      this.form.userPrincipalName = this.generatedUpn(this.form.samAccountName);
    }
  }

  private generatedUpn(value: string | null | undefined): string {
    const sam = value?.trim();
    return sam ? `${sam}@${this.adDomain}` : '';
  }
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `ng test --watch=false --include='**/ad-create-user-panel.component.spec.ts'` (desde `soportedesk-frontend/`)
Expected: PASS (5 specs).

- [ ] **Step 5: Commit**

```bash
git add soportedesk-frontend/src/app/features/usuarios-red/ad-create-user-panel.component.ts soportedesk-frontend/src/app/features/usuarios-red/ad-create-user-panel.component.spec.ts
git commit -m "feat: extraer panel de creacion de usuario AD como componente autocontenido"
```

---

## Task 8: Reescribir el componente padre y su spec

**Files:**
- Modify: `soportedesk-frontend/src/app/features/usuarios-red/usuarios-red-administracion.component.ts`
- Modify: `soportedesk-frontend/src/app/features/usuarios-red/usuarios-red-administracion.component.spec.ts`

**Interfaces:**
- Consumes: `AdAdminSummaryComponent`, `AdCreateUserPanelComponent`, `AdResetPasswordPanelComponent`, `AdGroupsPanelComponent`, `AdMoveOuPanelComponent`, `AdEditInfoPanelComponent` (Tasks 2-7), `AdPanelResult` (Task 1).
- Produces: métodos públicos `onPanelSaved(result: AdPanelResult): void` y `onPanelChanged(result: AdPanelResult): void` en `UsuariosRedAdministracionComponent`, usados por los bindings `(saved)`/`(changed)` del template.

- [ ] **Step 1: Actualizar el spec existente (quitar la expectativa de `dependencias` que ya no aplica)**

En `usuarios-red-administracion.component.spec.ts`, la función `flushInitialRequests()` (líneas 24-41) y el bloque duplicado dentro del segundo `it` (líneas 100-118) actualmente hacen:

```ts
    httpMock.expectOne('/api/catalogos/dependencias').flush([]);
    httpMock.expectOne('/api/active-directory/dashboard').flush({
```

Quitar la línea de `/api/catalogos/dependencias` en ambos lugares (el padre ya no inyecta `CatalogoService`, esa carga ahora vive en `ad-create-user-panel` y `ad-edit-info-panel`, y solo ocurre cuando esos paneles se abren). Debe quedar:

```ts
    httpMock.expectOne('/api/active-directory/dashboard').flush({
```

Luego, al final del archivo (antes del cierre final si lo hay, o agregando un nuevo `describe`), agregar:

```ts

describe('UsuariosRedAdministracionComponent - paneles', () => {
  let httpMock: HttpTestingController;

  function createComponent(): UsuariosRedAdministracionComponent {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { queryParamMap: of(convertToParamMap({})) },
        },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    return TestBed.runInInjectionContext(() => new UsuariosRedAdministracionComponent());
  }

  function flushInitialRequests(): void {
    httpMock.expectOne('/api/active-directory/dashboard').flush({
      usuariosHabilitados: 0,
      usuariosBloqueados: 0,
      usuariosDeshabilitados: 0,
      controladoresDominio: 0,
    });
    httpMock.expectOne('/api/active-directory/sync/estado').flush({
      running: false,
      procesados: 0,
      total: 0,
      iniciadoEn: null,
      finalizadoEn: null,
      ultimoResultado: null,
      error: null,
    });
  }

  afterEach(() => httpMock.verify());

  it('onPanelSaved actualiza el usuario, cierra el panel activo y refresca el dashboard', () => {
    const component = createComponent();
    component.ngOnInit();
    flushInitialRequests();

    component.activePanel = 'password';
    component.onPanelSaved({
      user: { samAccountName: 'jperez', enabled: true } as any,
      notice: { tone: 'success', text: 'Contraseña restablecida.' },
    });

    httpMock.expectOne('/api/active-directory/dashboard').flush({
      usuariosHabilitados: 1,
      usuariosBloqueados: 0,
      usuariosDeshabilitados: 0,
      controladoresDominio: 1,
    });

    expect(component.user?.samAccountName).toBe('jperez');
    expect(component.activePanel).toBeNull();
    expect(component.notice?.text).toBe('Contraseña restablecida.');
  });

  it('onPanelChanged actualiza el usuario sin cerrar el panel activo', () => {
    const component = createComponent();
    component.ngOnInit();
    flushInitialRequests();

    component.activePanel = 'groups';
    component.onPanelChanged({
      user: { samAccountName: 'jperez', enabled: true } as any,
      notice: { tone: 'success', text: 'Grupo agregado.' },
    });

    httpMock.expectOne('/api/active-directory/dashboard').flush({
      usuariosHabilitados: 1,
      usuariosBloqueados: 0,
      usuariosDeshabilitados: 0,
      controladoresDominio: 1,
    });

    expect(component.user?.samAccountName).toBe('jperez');
    expect(component.activePanel).toBe('groups');
  });

  it('openPanel no abre paneles de gestion si no hay usuario seleccionado', () => {
    const component = createComponent();
    component.ngOnInit();
    flushInitialRequests();

    component.openPanel('password');
    expect(component.activePanel).toBeNull();

    component.openPanel('create');
    expect(component.activePanel).toBe('create');
  });
});
```

- [ ] **Step 2: Correr el spec y verificar que falla**

Run: `ng test --watch=false --include='**/usuarios-red-administracion.component.spec.ts'` (desde `soportedesk-frontend/`)
Expected: FAIL — `onPanelSaved`, `onPanelChanged` no existen todavía en la clase actual, y la expectativa de `dependencias` ya no coincide con lo que el componente actual dispara.

- [ ] **Step 3: Reescribir el componente padre**

Reemplazar completamente el contenido de `usuarios-red-administracion.component.ts` por:

```ts
import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { switchMap, takeWhile } from 'rxjs/operators';
import { ModalComponent } from '../../shared/modal/modal.component';
import { ActiveDirectoryService } from './active-directory.service';
import { ActiveDirectoryDashboard, AdPanelResult, AdSyncStatus, AdUser, AdUserSummary } from './active-directory.model';
import { AdAdminSummaryComponent } from './ad-admin-summary.component';
import { AdUserDetailComponent } from './ad-user-detail.component';
import { AdUserSearchComponent } from './ad-user-search.component';
import { AdCreateUserPanelComponent } from './ad-create-user-panel.component';
import { AdResetPasswordPanelComponent } from './ad-reset-password-panel.component';
import { AdGroupsPanelComponent } from './ad-groups-panel.component';
import { AdMoveOuPanelComponent } from './ad-move-ou-panel.component';
import { AdEditInfoPanelComponent } from './ad-edit-info-panel.component';

type Panel = 'create' | 'password' | 'groups' | 'ou' | 'info' | null;

@Component({
  selector: 'app-usuarios-red-administracion',
  standalone: true,
  imports: [
    CommonModule,
    ModalComponent,
    AdAdminSummaryComponent,
    AdUserSearchComponent,
    AdUserDetailComponent,
    AdCreateUserPanelComponent,
    AdResetPasswordPanelComponent,
    AdGroupsPanelComponent,
    AdMoveOuPanelComponent,
    AdEditInfoPanelComponent,
  ],
  template: `
    <div class="usuarios-red-page">
      <div class="module-dash-toolbar">
        <div class="module-dash-title">
          <strong>Sincronización con Active Directory</strong>
          <span>{{ lastSyncLabel() }}</span>
        </div>
        <div class="module-dash-actions">
          <button type="button" class="module-dash-refresh" (click)="startSync()" [disabled]="syncStatus?.running">
            <span class="module-dash-refresh-icon" aria-hidden="true"></span>
            {{ syncStatus?.running ? 'Sincronizando' : 'Sincronizar AD' }}
          </button>
        </div>
      </div>

      <div class="module-dash-progress" *ngIf="syncStatus?.running">
        <div class="module-dash-progress-row">
          <span>{{ syncProgressLabel() }}</span>
          <strong>{{ syncPercent() }}%</strong>
          <div class="module-dash-track" [class.indeterminate]="!syncStatus!.total">
            <i [style.width.%]="syncPercent()"></i>
          </div>
        </div>
      </div>

      <app-ad-admin-summary [dashboard]="dashboard" />

      <section class="actions-grid admin-primary-actions">
        <button type="button" class="action-card create" (click)="openPanel('create')">
          <span class="action-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" />
              <path d="M20 8v6" /><path d="M23 11h-6" />
            </svg>
          </span>
          <strong>Crear usuario de red</strong>
          <small>Alta directa en Active Directory</small>
        </button>
      </section>

      <app-ad-user-search (selected)="selectUser($event)" />

      <div class="notice" [class.error]="notice.tone === 'error'" [class.success]="notice.tone === 'success'" *ngIf="notice">
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        {{ notice.text }}
      </div>

      <section class="empty-state" *ngIf="!user">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
        </svg>
        <strong>Selecciona una cuenta de red</strong>
        <span>También puedes llegar aquí desde Consultas o Dashboard con un usuario precargado.</span>
      </section>

      <ng-container *ngIf="user">
        <app-ad-user-detail [user]="user" [puedeEditarContratos]="true" />

        <section class="actions-grid">
          <button type="button" class="action-card" (click)="openPanel('password')">
            <span class="action-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="7.5" cy="15.5" r="5.5" /><path d="m21 2-9.6 9.6" /><path d="m15.5 7.5 3 3L22 7l-3-3" />
              </svg>
            </span>
            <strong>Restablecer clave</strong>
            <small>Clave temporal y cambio obligatorio</small>
          </button>
          <button type="button" class="action-card" (click)="unlock()" [disabled]="working || !user.locked">
            <span class="action-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 9.9-1" />
              </svg>
            </span>
            <strong>Desbloquear</strong>
            <small>Libera bloqueo por intentos fallidos</small>
          </button>
          <button type="button" class="action-card" [class.danger]="user.enabled" (click)="toggleEnabled()" [disabled]="working">
            <span class="action-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18.36 6.64a9 9 0 1 1-12.73 0" /><line x1="12" y1="2" x2="12" y2="12" />
              </svg>
            </span>
            <strong>{{ user.enabled ? 'Deshabilitar' : 'Habilitar' }}</strong>
            <small>Control de acceso al dominio</small>
          </button>
          <button type="button" class="action-card" (click)="openPanel('groups')">
            <span class="action-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </span>
            <strong>Grupos</strong>
            <small>Agregar o quitar membresías</small>
          </button>
          <button type="button" class="action-card" (click)="openPanel('ou')">
            <span class="action-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            </span>
            <strong>Mover OU</strong>
            <small>Reubicar la cuenta en AD</small>
          </button>
          <button type="button" class="action-card" (click)="openPanel('info')">
            <span class="action-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z" />
              </svg>
            </span>
            <strong>Editar datos</strong>
            <small>Contacto, cargo y descripcion</small>
          </button>
        </section>
      </ng-container>
    </div>

    <app-modal title="Crear usuario de red" size="wide" [open]="activePanel === 'create'" (closed)="closePanel()">
      <app-ad-create-user-panel (saved)="onPanelSaved($event)" (cancelled)="closePanel()" />
    </app-modal>

    <app-modal title="Restablecer contraseña" [open]="activePanel === 'password'" (closed)="closePanel()">
      <app-ad-reset-password-panel *ngIf="user" [samAccountName]="user.samAccountName" (saved)="onPanelSaved($event)" (cancelled)="closePanel()" />
    </app-modal>

    <app-modal title="Membresias de grupos" [open]="activePanel === 'groups'" (closed)="closePanel()">
      <app-ad-groups-panel *ngIf="user" [samAccountName]="user.samAccountName" (changed)="onPanelChanged($event)" />
    </app-modal>

    <app-modal title="Mover a unidad organizativa" [open]="activePanel === 'ou'" (closed)="closePanel()">
      <app-ad-move-ou-panel *ngIf="user" [samAccountName]="user.samAccountName" (saved)="onPanelSaved($event)" />
    </app-modal>

    <app-modal title="Editar informacion AD" size="wide" [open]="activePanel === 'info'" (closed)="closePanel()">
      <app-ad-edit-info-panel *ngIf="user" [user]="user" (saved)="onPanelSaved($event)" (cancelled)="closePanel()" />
    </app-modal>
  `,
  styleUrl: './usuarios-red.shared.scss',
})
export class UsuariosRedAdministracionComponent implements OnInit, OnDestroy {
  private adService = inject(ActiveDirectoryService);
  private route = inject(ActivatedRoute);

  dashboard: ActiveDirectoryDashboard | null = null;
  syncStatus: AdSyncStatus | null = null;
  user: AdUser | null = null;
  activePanel: Panel = null;
  working = false;
  notice: { tone: 'success' | 'error' | 'info'; text: string } | null = null;
  private syncPollSub?: Subscription;

  ngOnInit(): void {
    this.loadDashboard();
    this.checkSyncStatus();
    this.route.queryParamMap.subscribe((params) => {
      const sam = params.get('sam');
      if (sam) this.loadUser(sam);
    });
  }

  ngOnDestroy(): void {
    this.syncPollSub?.unsubscribe();
  }

  loadDashboard(): void {
    this.adService.getDashboard().subscribe({
      next: (dashboard) => (this.dashboard = dashboard),
      error: () => (this.dashboard = null),
    });
  }

  startSync(): void {
    this.adService.startSync().subscribe({
      next: (status) => {
        this.syncStatus = status;
        this.pollSyncStatus();
      },
      error: () => this.flash('error', 'No se pudo iniciar la sincronizacion.'),
    });
  }

  syncPercent(): number {
    const total = this.syncStatus?.total ?? 0;
    const procesados = this.syncStatus?.procesados ?? 0;
    return total > 0 ? Math.min(100, Math.round((procesados / total) * 100)) : 0;
  }

  syncProgressLabel(): string {
    const total = this.syncStatus?.total ?? 0;
    const procesados = this.syncStatus?.procesados ?? 0;
    return total > 0 ? `${procesados} de ${total} usuarios` : 'Calculando el total de cuentas...';
  }

  lastSyncLabel(): string {
    const fecha = this.syncStatus?.ultimoResultado?.sincronizadoEn;
    return fecha ? `Última sincronización: ${new Date(fecha).toLocaleString('es-PE')}` : 'Nunca sincronizado en esta sesión.';
  }

  private checkSyncStatus(): void {
    this.adService.getSyncStatus().subscribe({
      next: (status) => {
        this.syncStatus = status;
        if (status.running) {
          this.pollSyncStatus();
        }
      },
      error: () => {},
    });
  }

  private pollSyncStatus(): void {
    this.syncPollSub?.unsubscribe();
    this.syncPollSub = interval(1500)
      .pipe(
        switchMap(() => this.adService.getSyncStatus()),
        takeWhile((status) => status.running, true),
      )
      .subscribe({
        next: (status) => {
          this.syncStatus = status;
          if (!status.running) {
            this.loadDashboard();
            if (status.error) {
              this.flash('error', `Error sincronizando: ${status.error}`);
            } else if (status.ultimoResultado) {
              this.flash('success', `${status.ultimoResultado.usuariosSincronizados} usuarios sincronizados desde AD.`);
            }
          }
        },
        error: () => this.flash('error', 'No se pudo consultar el estado de sincronizacion.'),
      });
  }

  selectUser(summary: AdUserSummary): void {
    this.loadUser(summary.samAccountName);
  }

  openPanel(panel: Panel): void {
    if (panel !== 'create' && !this.user) return;
    this.activePanel = panel;
    this.notice = null;
  }

  closePanel(): void {
    this.activePanel = null;
  }

  onPanelSaved(result: AdPanelResult): void {
    this.user = result.user;
    this.loadDashboard();
    this.closePanel();
    this.flash(result.notice.tone, result.notice.text);
  }

  onPanelChanged(result: AdPanelResult): void {
    this.user = result.user;
    this.loadDashboard();
    this.flash(result.notice.tone, result.notice.text);
  }

  unlock(): void {
    if (!this.user) return;
    this.runAction(this.adService.unlockUser(this.user.samAccountName));
  }

  toggleEnabled(): void {
    if (!this.user) return;
    const request = this.user.enabled
      ? this.adService.disableUser(this.user.samAccountName)
      : this.adService.enableUser(this.user.samAccountName);
    this.runAction(request);
  }

  private loadUser(sam: string): void {
    this.notice = null;
    this.adService.getUser(sam).subscribe({
      next: (response) => {
        if (!response.success || !response.data) {
          this.user = null;
          this.flash('error', response.message || 'Usuario no encontrado.');
          return;
        }
        this.user = response.data;
        this.flash('success', response.message);
      },
      error: () => {
        this.user = null;
        this.flash('error', 'No se pudo consultar Active Directory.');
      },
    });
  }

  private runAction(request: ReturnType<ActiveDirectoryService['unlockUser']>): void {
    this.working = true;
    request.subscribe({
      next: (response) => {
        this.working = false;
        if (response.success) {
          if (response.data) {
            this.user = response.data;
          } else if (this.user) {
            this.loadUser(this.user.samAccountName);
          }
          this.loadDashboard();
          this.flash('success', response.message);
        } else {
          this.flash('error', response.message);
        }
      },
      error: () => {
        this.working = false;
        this.flash('error', 'No se pudo completar la acción.');
      },
    });
  }

  private flash(tone: 'success' | 'error' | 'info', text: string): void {
    this.notice = { tone, text };
  }
}
```

- [ ] **Step 4: Correr el spec y verificar que pasa**

Run: `ng test --watch=false --include='**/usuarios-red-administracion.component.spec.ts'` (desde `soportedesk-frontend/`)
Expected: PASS (5 specs: 2 de sincronizacion + 3 de paneles).

- [ ] **Step 5: Commit**

```bash
git add soportedesk-frontend/src/app/features/usuarios-red/usuarios-red-administracion.component.ts soportedesk-frontend/src/app/features/usuarios-red/usuarios-red-administracion.component.spec.ts
git commit -m "refactor: reducir usuarios-red-administracion a orquestador de paneles autocontenidos"
```

---

## Task 9: Verificación final

**Files:** ninguno (solo verificación).

- [ ] **Step 1: Correr toda la suite de specs del módulo usuarios-red**

Run: `ng test --watch=false --include='**/usuarios-red/**/*.spec.ts'` (desde `soportedesk-frontend/`)
Expected: PASS — todos los specs del módulo (nuevos y existentes) pasan.

- [ ] **Step 2: Verificar que el build de producción sigue compilando**

Run: `ng build` (desde `soportedesk-frontend/`)
Expected: build exitoso, sin errores de TypeScript ni de plantillas.

- [ ] **Step 3: Verificación manual en navegador (smoke test)**

Levantar el backend y `ng serve`, entrar a Usuarios de Red → Administración, y verificar visualmente:
- Los KPIs se muestran como cards con borde de color (no como pills).
- El botón "Crear usuario de red" abre el modal con las 3 secciones (Cuenta/Ubicación/Contrato) tituladas con ícono.
- Buscar un usuario, abrir cada uno de los 5 paneles (reset password, grupos, mover OU, editar info) y confirmar que cada uno hace lo mismo que antes (mismos endpoints, mismos mensajes, mismo comportamiento de cierre).

Este paso es manual — reportar explícitamente si no se pudo ejecutar (por ejemplo, si el entorno no tiene AD/LDAP disponible localmente) en vez de asumir que pasó.

- [ ] **Step 4: Commit final (si hubo ajustes de la verificación manual)**

Si la verificación manual no requirió cambios, no hay nada que commitear en este paso.
