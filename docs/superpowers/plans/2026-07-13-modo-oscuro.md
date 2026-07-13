# Modo oscuro Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar un modo oscuro que cubra toda la aplicación, controlado por un interruptor Claro/Oscuro ubicado en la pantalla de Configuración.

**Architecture:** Un `ThemeService` (signal, `providedIn: 'root'`) resuelve el tema inicial (localStorage → `prefers-color-scheme` → claro) y lo aplica de forma síncrona escribiendo `data-theme` en `<html>`. Un bloque `:root[data-theme='dark']` en `_variables.scss` redefine las mismas variables CSS que ya usa toda la interfaz, así que el cambio se propaga sin tocar componente por componente. El interruptor vive en `CatalogosComponent` (pantalla "Configuración").

**Tech Stack:** Angular 17 standalone, signals, SCSS custom properties, Jasmine/Karma.

## Global Constraints

- No se sincroniza el tema entre dispositivos/navegadores — solo `localStorage` del navegador actual.
- No se escuchan cambios en vivo de `prefers-color-scheme` del sistema operativo mientras la app está abierta (solo se usa como valor inicial la primera vez que no hay preferencia guardada).
- No se audita exhaustivamente cada color hexadecimal fijo en los ~26 archivos `.scss` de módulos — solo se corrige el hardcodeado detectado en el CSS global (`styles.scss`, selector `th`).
- Los colores de acento/estado (`--color-primary`, `--color-success`, `--color-warning`, `--color-danger`, `--color-info`, colores por módulo, `--color-white`) no cambian entre temas — solo cambian fondo/superficie/borde/texto neutro y las variantes `-light`.
- Spec de referencia: `docs/superpowers/specs/2026-07-13-modo-oscuro-design.md`.

---

## Task 1: `ThemeService`

**Files:**
- Create: `soportedesk-frontend/src/app/core/services/theme.service.ts`
- Test: `soportedesk-frontend/src/app/core/services/theme.service.spec.ts`

**Interfaces:**
- Produces: `export type ThemeMode = 'light' | 'dark'` y `ThemeService` con `readonly theme: WritableSignal<ThemeMode>`, `setTheme(mode: ThemeMode): void`, `toggle(): void`. Consumido por Task 3 (`AppComponent`) y Task 4 (`CatalogosComponent`).

- [ ] **Step 1: Escribir el spec**

Crear `theme.service.spec.ts`:

```ts
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  afterEach(() => {
    localStorage.removeItem('soportedesk-theme');
    document.documentElement.removeAttribute('data-theme');
  });

  it('usa la preferencia guardada en localStorage, ignorando el sistema operativo', () => {
    localStorage.setItem('soportedesk-theme', 'dark');
    spyOn(window, 'matchMedia').and.returnValue({ matches: false } as MediaQueryList);

    const service = new ThemeService();

    expect(service.theme()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('sin preferencia guardada, sigue la preferencia del sistema operativo', () => {
    spyOn(window, 'matchMedia').and.returnValue({ matches: true } as MediaQueryList);

    const service = new ThemeService();

    expect(service.theme()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('sin preferencia guardada ni el sistema operativo en oscuro, usa claro', () => {
    spyOn(window, 'matchMedia').and.returnValue({ matches: false } as MediaQueryList);

    const service = new ThemeService();

    expect(service.theme()).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('setTheme cambia el signal, aplica el atributo data-theme y persiste en localStorage', () => {
    spyOn(window, 'matchMedia').and.returnValue({ matches: false } as MediaQueryList);
    const service = new ThemeService();

    service.setTheme('dark');

    expect(service.theme()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('soportedesk-theme')).toBe('dark');
  });

  it('toggle alterna entre claro y oscuro', () => {
    spyOn(window, 'matchMedia').and.returnValue({ matches: false } as MediaQueryList);
    const service = new ThemeService();

    expect(service.theme()).toBe('light');
    service.toggle();
    expect(service.theme()).toBe('dark');
    service.toggle();
    expect(service.theme()).toBe('light');
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `ng test --watch=false --include='**/theme.service.spec.ts'` (desde `soportedesk-frontend/`)
Expected: FAIL — no se puede resolver el módulo `./theme.service`.

- [ ] **Step 3: Crear el servicio**

Crear `theme.service.ts`:

```ts
import { Injectable, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'soportedesk-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<ThemeMode>(this.resolveInitialTheme());

  constructor() {
    this.applyTheme(this.theme());
  }

  setTheme(mode: ThemeMode): void {
    this.theme.set(mode);
    this.applyTheme(mode);
  }

  toggle(): void {
    this.setTheme(this.theme() === 'dark' ? 'light' : 'dark');
  }

  private resolveInitialTheme(): ThemeMode {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  private applyTheme(mode: ThemeMode): void {
    document.documentElement.setAttribute('data-theme', mode);
    localStorage.setItem(STORAGE_KEY, mode);
  }
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `ng test --watch=false --include='**/theme.service.spec.ts'` (desde `soportedesk-frontend/`)
Expected: PASS (5 specs).

- [ ] **Step 5: Commit**

```bash
git add soportedesk-frontend/src/app/core/services/theme.service.ts soportedesk-frontend/src/app/core/services/theme.service.spec.ts
git commit -m "feat: agregar ThemeService para modo oscuro/claro"
```

---

## Task 2: Variables CSS del tema oscuro

**Files:**
- Modify: `soportedesk-frontend/src/app/core/styles/_variables.scss`
- Modify: `soportedesk-frontend/src/styles.scss`

**Interfaces:**
- Ninguna (solo CSS). Depende de que `ThemeService` (Task 1) escriba `data-theme` en `<html>` para que este bloque tenga efecto.

- [ ] **Step 1: Agregar el bloque de variables oscuras**

Al final de `_variables.scss` (después del cierre `}` del bloque `:root` existente), agregar:

```scss

:root[data-theme='dark'] {
  --color-bg: #0f1521;
  --color-surface: #171f2e;
  --color-surface-raised: #1e293b;
  --color-border: #2a3547;
  --color-border-strong: #3a4759;
  --color-text: #e8ecf4;
  --color-text-secondary: #9aa7bd;
  --color-text-muted: #6b7688;
  --color-muted: #1c2534;

  --color-primary-light: rgba(93, 135, 255, .16);
  --color-secondary-light: rgba(68, 183, 247, .16);
  --color-accent-light: rgba(93, 135, 255, .16);
  --color-accent-subtle: rgba(93, 135, 255, .10);

  --color-success-light: rgba(19, 222, 185, .14);
  --color-warning-light: rgba(255, 174, 31, .14);
  --color-danger-light: rgba(250, 137, 107, .14);
  --color-info-light: rgba(83, 155, 255, .14);

  --color-licencias-light: rgba(93, 135, 255, .14);
  --color-correos-light: rgba(135, 84, 236, .14);
  --color-usuarios-red-light: rgba(255, 174, 31, .14);
  --color-vpn-light: rgba(250, 137, 107, .14);
  --color-wifi-light: rgba(68, 183, 247, .14);
  --color-impresoras-light: rgba(124, 143, 172, .14);
  --color-equipos-light: rgba(19, 222, 185, .14);

  --shadow-sm: 0 2px 16px rgba(0, 0, 0, .35);
  --shadow-md: 0 6px 24px rgba(0, 0, 0, .45);
  --shadow-lg: 0 18px 48px rgba(0, 0, 0, .55);

  --color-green-light: rgba(19, 222, 185, .14);
  --color-yellow-light: rgba(255, 174, 31, .14);
  --color-red-light: rgba(250, 137, 107, .14);
  --color-gray-light: rgba(124, 143, 172, .14);
}
```

- [ ] **Step 2: Corregir el color fijo en `styles.scss`**

Buscar en `styles.scss` (dentro del bloque `th { ... }`):

```scss
th {
  padding: 11px 14px;
  text-align: left;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: .05em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
  background: #fbfcfe;
  border-bottom: 1px solid var(--color-border);
```

Reemplazar la línea `background: #fbfcfe;` por:

```scss
  background: var(--color-muted);
```

- [ ] **Step 3: Verificar que compila**

Run: `ng build` (desde `soportedesk-frontend/`)
Expected: build exitoso, sin errores de SCSS (los warnings de presupuesto de tamaño ya preexistentes no cuentan como fallo).

- [ ] **Step 4: Commit**

```bash
git add soportedesk-frontend/src/app/core/styles/_variables.scss soportedesk-frontend/src/styles.scss
git commit -m "feat: agregar paleta de variables para modo oscuro"
```

---

## Task 3: Activar el tema apenas arranca la app

**Files:**
- Modify: `soportedesk-frontend/src/app/app.component.ts`

**Interfaces:**
- Consumes: `ThemeService` (Task 1).

- [ ] **Step 1: Inyectar `ThemeService` como campo en `AppComponent`**

Reemplazar el contenido de `app.component.ts`:

```ts
import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
})
export class AppComponent {
  private theme = inject(ThemeService);
}
```

El campo `theme` no se usa en el template — su único propósito es forzar la creación de `ThemeService` (y por lo tanto la aplicación síncrona del atributo `data-theme`) antes de que `AppComponent` renderice nada.

- [ ] **Step 2: Correr el spec existente de `AppComponent` y verificar que sigue pasando**

Run: `ng test --watch=false --include='**/app.component.spec.ts'` (desde `soportedesk-frontend/`)
Expected: PASS (1 spec, "should create the app"). `ThemeService` no requiere ningún provider adicional en el testbed porque es `providedIn: 'root'`.

- [ ] **Step 3: Commit**

```bash
git add soportedesk-frontend/src/app/app.component.ts
git commit -m "feat: aplicar el tema guardado apenas arranca la aplicacion"
```

---

## Task 4: Interruptor "Apariencia" en Configuración

**Files:**
- Modify: `soportedesk-frontend/src/app/features/catalogos/catalogos.component.ts`
- Modify: `soportedesk-frontend/src/app/features/catalogos/catalogos.component.html`
- Modify: `soportedesk-frontend/src/app/features/catalogos/catalogos.component.scss`
- Modify: `soportedesk-frontend/src/app/features/catalogos/catalogos.component.spec.ts`

**Interfaces:**
- Consumes: `ThemeService` (Task 1), `ThemeMode` (Task 1).

- [ ] **Step 1: Escribir el test del nuevo comportamiento**

En `catalogos.component.spec.ts`, agregar el import de `ThemeService` junto a los demás imports (línea 4, después de `AuthService`):

```ts
import { ThemeService } from '../../core/services/theme.service';
```

Y agregar, dentro del `describe('CatalogosComponent', ...)` existente, después del bloque `beforeEach` (después de la línea 45 `});` que cierra el `beforeEach`), un nuevo test:

```ts

  it('setTheme delega en ThemeService y expone el tema actual', () => {
    const themeService = TestBed.inject(ThemeService);

    component.setTheme('dark');

    expect(themeService.theme()).toBe('dark');
    expect(component.theme()).toBe('dark');

    component.setTheme('light');

    expect(themeService.theme()).toBe('light');
    expect(component.theme()).toBe('light');
  });
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `ng test --watch=false --include='**/catalogos.component.spec.ts'` (desde `soportedesk-frontend/`)
Expected: FAIL — `component.setTheme` no es una función / `component.theme` no existe.

- [ ] **Step 3: Agregar `theme`/`setTheme` al componente**

En `catalogos.component.ts`, agregar el import (junto a los demás, después de la línea 5 `import { AuthService } ...`):

```ts
import { ThemeMode, ThemeService } from '../../core/services/theme.service';
```

Agregar la inyección del servicio (junto a `private authService = inject(AuthService);`, dentro de la clase `CatalogosComponent`):

```ts
  private themeService = inject(ThemeService);
```

Agregar el getter/método público (junto a los demás getters públicos, por ejemplo cerca de `get canWrite()`):

```ts
  readonly theme = this.themeService.theme;

  setTheme(mode: ThemeMode): void {
    this.themeService.setTheme(mode);
  }
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `ng test --watch=false --include='**/catalogos.component.spec.ts'` (desde `soportedesk-frontend/`)
Expected: PASS (todos los specs existentes + el nuevo).

- [ ] **Step 5: Agregar la tarjeta "Apariencia" al template**

En `catalogos.component.html`, agregar antes de `<section class="catalog-impact-map">` (línea 14 del archivo actual):

```html
<section class="appearance-card">
  <div>
    <span class="module-eyebrow">Preferencias</span>
    <h3>Apariencia</h3>
    <p>Elige como se ve el sistema en este navegador.</p>
  </div>
  <div class="theme-toggle" role="group" aria-label="Modo de color">
    <button type="button" [class.active]="theme() === 'light'" (click)="setTheme('light')">Claro</button>
    <button type="button" [class.active]="theme() === 'dark'" (click)="setTheme('dark')">Oscuro</button>
  </div>
</section>
```

- [ ] **Step 6: Agregar los estilos de la tarjeta**

En `catalogos.component.scss`, agregar al final del archivo:

```scss
.appearance-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 14px;
  padding: 14px 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);

  h3 {
    margin: 0;
    color: var(--color-text);
    font-size: 15px;
  }

  p {
    margin: 4px 0 0;
    color: var(--color-text-secondary);
    font-size: 12.5px;
  }
}

.theme-toggle {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 4px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-muted);

  button {
    min-height: 32px;
    padding: 0 14px;
    border: none;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--color-text-secondary);
    font-size: 12px;
    font-weight: 800;

    &:hover {
      color: var(--color-text);
    }

    &.active {
      background: var(--color-surface);
      color: var(--color-accent);
    }
  }
}
```

- [ ] **Step 7: Correr todos los specs de Configuración de nuevo**

Run: `ng test --watch=false --include='**/catalogos.component.spec.ts'` (desde `soportedesk-frontend/`)
Expected: PASS (el agregar HTML/SCSS no cambia la lógica, pero confirma que no se rompió nada).

- [ ] **Step 8: Commit**

```bash
git add soportedesk-frontend/src/app/features/catalogos/catalogos.component.ts soportedesk-frontend/src/app/features/catalogos/catalogos.component.html soportedesk-frontend/src/app/features/catalogos/catalogos.component.scss soportedesk-frontend/src/app/features/catalogos/catalogos.component.spec.ts
git commit -m "feat: agregar interruptor de apariencia (modo oscuro) en Configuracion"
```

---

## Task 5: Verificación final

**Files:** ninguno (solo verificación).

- [ ] **Step 1: Correr toda la suite de frontend**

Run: `ng test --watch=false` (desde `soportedesk-frontend/`)
Expected: PASS — ninguna prueba existente se rompe por el nuevo tema.

- [ ] **Step 2: Build de producción**

Run: `ng build` (desde `soportedesk-frontend/`)
Expected: build exitoso.

- [ ] **Step 3: Verificación manual en navegador**

Levantar `ng serve`, entrar a Configuración, y verificar visualmente:
- El interruptor Claro/Oscuro cambia toda la interfaz (sidebar, header, tablas, modales), no solo la pantalla de Configuración.
- Recargar la página (F5) mantiene el tema elegido (persistencia en localStorage).
- Con `localStorage` vacío (probar en una ventana de incógnito) y el sistema operativo en modo oscuro, la app arranca en oscuro.
- Revisar visualmente 2-3 pantallas de otros módulos (por ejemplo Dashboard y Usuarios de Red) en modo oscuro para confirmar que se ven bien; si algo se ve mal por un color fijo puntual, anotarlo para una iteración posterior (no se audita todo en este plan).

Este paso es manual — reportar explícitamente si no se pudo ejecutar, en vez de asumir que pasó.

- [ ] **Step 4: Commit final (si hubo ajustes de la verificación manual)**

Si la verificación manual no requirió cambios, no hay nada que commitear en este paso.
