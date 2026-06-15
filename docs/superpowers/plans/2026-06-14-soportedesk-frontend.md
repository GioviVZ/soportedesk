# SoporteDesk INIA Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Angular 17+ standalone-component frontend for SoporteDesk INIA, consuming the Spring Boot REST API (see `docs/superpowers/plans/2026-06-14-soportedesk-backend.md`): JWT login, dashboard, the 7 functional modules (licencias, correos, usuarios de red, vpn, wifi, equipos, impresoras), and catalog administration (sedes/dependencias/subdependencias/tipos de contrato), replicating the look of `maquetasoportedesk-inia.jsx`.

**Architecture:** Angular 17+ standalone components (no NgModules), `provideRouter`/`provideHttpClient` in `app.config.ts`. `core/` holds auth + shared models, `layout/` holds the sidebar/header shell, `shared/` holds reusable UI pieces (generic table, modal, badges), `features/` holds one folder per module (list component + form/modal component + HTTP service). Cascading catalog selects (Sede → Dependencia → Subdependencia) are shared between the Correos and Usuarios de Red forms via a small reusable component.

**Tech Stack:** Angular 17+ (standalone components, `inject()`), TypeScript, SCSS, RxJS, Angular `HttpClient` with a functional `jwtInterceptor`, Jasmine/Karma (default Angular test runner) for `generic-table` and `vencimiento-badge`.

---

## Reference: project location

All frontend code lives in `soportedesk-frontend/` at the repository root
(`c:\SistemadeSoporteTecnicoINIA\soportedesk-frontend`). The backend API
(see backend plan) runs at `http://localhost:8080`, frontend dev server at
`http://localhost:4200` via `ng serve` with a proxy to avoid CORS issues
during development.

## Reference: color palette (from `maquetasoportedesk-inia.jsx`)

The mockup defines a `C` constants object with these colors. They are ported
to SCSS variables in Task 1 and used throughout:

```js
const C = {
  green: "#2e7d32",
  greenDark: "#1b5e20",
  greenLight: "#e8f5e9",
  yellow: "#fbc02d",
  yellowLight: "#fff8e1",
  red: "#c62828",
  redLight: "#ffebee",
  gray: "#757575",
  grayLight: "#f5f5f5",
  border: "#e0e0e0",
  text: "#212121",
  white: "#ffffff",
};
```

## Reference: common conventions used across feature modules

- Each feature module under `src/app/features/<modulo>/` has:
  - `<modulo>.model.ts` — TypeScript interface for the entity (and its
    `*Request` shape for create/update, when they differ).
  - `<modulo>.service.ts` — injectable HTTP service with `getAll(search?)`,
    `getById(id)`, `create(request)`, `update(id, request)`,
    `delete(id)`, calling `/api/<modulo>`.
  - `<modulo>-list.component.ts` (+ `.html`, `.scss`) — standalone component
    rendering `GenericTableComponent`, wiring Ver/Agregar/Editar/Eliminar to
    a `<modulo>-form.component`.
  - `<modulo>-form.component.ts` (+ `.html`, `.scss`) — standalone component
    rendered inside `ModalComponent`, with a reactive form for create/edit.
- All HTTP services use `inject(HttpClient)` and return `Observable<T>` /
  `Observable<T[]>`.
- All list/form components are `standalone: true` and import only what they
  use (`CommonModule`, `ReactiveFormsModule`, shared components).
- Route paths match the sidebar `MODULES` from the mockup:
  `/dashboard`, `/licencias`, `/correos`, `/usuarios-red`, `/vpn`, `/wifi`,
  `/impresoras`, `/equipos`, `/catalogos`.
- All feature routes are lazy-loaded via `loadComponent` and protected by
  `authGuard`.

---

## Task 1: Project setup, routing shell, and global styles

**Files:**
- Create: `soportedesk-frontend/` (via Angular CLI)
- Create: `soportedesk-frontend/src/styles.scss`
- Create: `soportedesk-frontend/src/app/core/styles/_variables.scss`
- Create: `soportedesk-frontend/src/environments/environment.ts`
- Create: `soportedesk-frontend/src/environments/environment.development.ts`
- Create: `soportedesk-frontend/proxy.conf.json`
- Modify: `soportedesk-frontend/angular.json`
- Modify: `soportedesk-frontend/src/app/app.config.ts`
- Modify: `soportedesk-frontend/src/app/app.routes.ts`
- Modify: `soportedesk-frontend/src/app/app.component.ts`
- Modify: `soportedesk-frontend/src/app/app.component.html`

- [ ] **Step 1: Generate the Angular project**

Run (from `c:\SistemadeSoporteTecnicoINIA`):

```bash
npx -y @angular/cli@17 new soportedesk-frontend --routing --style=scss --skip-tests=false --standalone
```

When prompted, accept defaults. This creates
`soportedesk-frontend/` with a standalone `AppComponent`, `app.routes.ts`,
and `app.config.ts`.

- [ ] **Step 2: Create SCSS color variables**

Create `soportedesk-frontend/src/app/core/styles/_variables.scss`:

```scss
:root {
  --color-green: #2e7d32;
  --color-green-dark: #1b5e20;
  --color-green-light: #e8f5e9;
  --color-yellow: #fbc02d;
  --color-yellow-light: #fff8e1;
  --color-red: #c62828;
  --color-red-light: #ffebee;
  --color-gray: #757575;
  --color-gray-light: #f5f5f5;
  --color-border: #e0e0e0;
  --color-text: #212121;
  --color-white: #ffffff;
}
```

- [ ] **Step 3: Set up global styles**

Replace the contents of `soportedesk-frontend/src/styles.scss`:

```scss
@import './app/core/styles/variables';

* {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  font-family: 'Segoe UI', Roboto, Arial, sans-serif;
  color: var(--color-text);
  background-color: var(--color-gray-light);
}

button {
  cursor: pointer;
  font-family: inherit;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  border-bottom: 1px solid var(--color-border);
  padding: 8px 12px;
  text-align: left;
  font-size: 14px;
}

th {
  background-color: var(--color-green-light);
  color: var(--color-green-dark);
  font-weight: 600;
}
```

- [ ] **Step 4: Configure environments**

Create `soportedesk-frontend/src/environments/environment.ts`:

```typescript
export const environment = {
  production: true,
  apiUrl: '/api',
};
```

Create `soportedesk-frontend/src/environments/environment.development.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: '/api',
};
```

- [ ] **Step 5: Configure dev proxy to the backend**

Create `soportedesk-frontend/proxy.conf.json`:

```json
{
  "/api": {
    "target": "http://localhost:8080",
    "secure": false,
    "changeOrigin": true
  }
}
```

In `soportedesk-frontend/angular.json`, under
`projects.soportedesk-frontend.architect.serve.options`, add:

```json
"proxyConfig": "proxy.conf.json"
```

- [ ] **Step 6: Set up empty routes and base app shell**

Replace `soportedesk-frontend/src/app/app.routes.ts`:

```typescript
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
];
```

Replace `soportedesk-frontend/src/app/app.component.ts`:

```typescript
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
})
export class AppComponent {}
```

Replace `soportedesk-frontend/src/app/app.component.html`:

```html
<router-outlet />
```

- [ ] **Step 7: Verify the app builds and serves**

Run: `cd soportedesk-frontend && npm run build`
Expected: build completes with no errors (`Application bundle generation complete`).

- [ ] **Step 8: Commit**

```bash
git add soportedesk-frontend
git commit -m "chore: scaffold Angular frontend project with proxy and global styles"
```

---

## Task 2: Auth core — models, AuthService, guard, interceptor, login page

**Files:**
- Create: `soportedesk-frontend/src/app/core/models/auth.model.ts`
- Create: `soportedesk-frontend/src/app/core/auth/auth.service.ts`
- Create: `soportedesk-frontend/src/app/core/auth/auth.service.spec.ts`
- Create: `soportedesk-frontend/src/app/core/auth/auth.guard.ts`
- Create: `soportedesk-frontend/src/app/core/auth/jwt.interceptor.ts`
- Create: `soportedesk-frontend/src/app/features/auth/login/login.component.ts`
- Create: `soportedesk-frontend/src/app/features/auth/login/login.component.html`
- Create: `soportedesk-frontend/src/app/features/auth/login/login.component.scss`
- Modify: `soportedesk-frontend/src/app/app.config.ts`
- Modify: `soportedesk-frontend/src/app/app.routes.ts`

- [ ] **Step 1: Create auth models**

Create `soportedesk-frontend/src/app/core/models/auth.model.ts`:

```typescript
export type Rol = 'ADMIN' | 'SOPORTE';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  username: string;
  nombre: string;
  rol: Rol;
}
```

- [ ] **Step 2: Write failing test for `AuthService`**

Create `soportedesk-frontend/src/app/core/auth/auth.service.spec.ts`:

```typescript
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { AuthResponse } from '../models/auth.model';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const response: AuthResponse = {
    token: 'fake-jwt-token',
    username: 'admin',
    nombre: 'Administrador',
    rol: 'ADMIN',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('login stores token and role in localStorage', () => {
    service.login({ username: 'admin', password: 'admin123' }).subscribe();

    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush(response);

    expect(localStorage.getItem('token')).toBe('fake-jwt-token');
    expect(localStorage.getItem('rol')).toBe('ADMIN');
    expect(service.isLoggedIn()).toBe(true);
    expect(service.isAdmin()).toBe(true);
  });

  it('logout clears stored session', () => {
    localStorage.setItem('token', 'fake-jwt-token');
    localStorage.setItem('rol', 'ADMIN');

    service.logout();

    expect(localStorage.getItem('token')).toBeNull();
    expect(service.isLoggedIn()).toBe(false);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd soportedesk-frontend && npm test -- --watch=false --include='**/auth.service.spec.ts'`
Expected: FAIL — `AuthService` does not exist.

- [ ] **Step 4: Implement `AuthService`**

Create `soportedesk-frontend/src/app/core/auth/auth.service.ts`:

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, Rol } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, request).pipe(
      tap((response) => {
        localStorage.setItem('token', response.token);
        localStorage.setItem('rol', response.rol);
        localStorage.setItem('username', response.username);
        localStorage.setItem('nombre', response.nombre);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    localStorage.removeItem('username');
    localStorage.removeItem('nombre');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getRole(): Rol | null {
    return localStorage.getItem('rol') as Rol | null;
  }

  getNombre(): string | null {
    return localStorage.getItem('nombre');
  }

  isLoggedIn(): boolean {
    return this.getToken() !== null;
  }

  isAdmin(): boolean {
    return this.getRole() === 'ADMIN';
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd soportedesk-frontend && npm test -- --watch=false --include='**/auth.service.spec.ts'`
Expected: PASS (2 specs).

- [ ] **Step 6: Create `authGuard`**

Create `soportedesk-frontend/src/app/core/auth/auth.guard.ts`:

```typescript
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};
```

- [ ] **Step 7: Create `jwtInterceptor`**

Create `soportedesk-frontend/src/app/core/auth/jwt.interceptor.ts`:

```typescript
import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error) => {
      if (error.status === 401) {
        authService.logout();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
```

- [ ] **Step 8: Register interceptor in `app.config.ts`**

Modify `soportedesk-frontend/src/app/app.config.ts` to provide
`HttpClient` with the interceptor. The generated file already exports
`appConfig: ApplicationConfig` with `providers: [...]`; add
`provideHttpClient(withInterceptors([jwtInterceptor]))` and
`provideAnimations()` is not required. Resulting file:

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { jwtInterceptor } from './core/auth/jwt.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([jwtInterceptor])),
  ],
};
```

- [ ] **Step 9: Create the login page**

Create `soportedesk-frontend/src/app/features/auth/login/login.component.ts`:

```typescript
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  errorMessage = '';

  form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    this.errorMessage = '';
    this.authService.login(this.form.getRawValue()).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: () => (this.errorMessage = 'Usuario o contraseña incorrectos'),
    });
  }
}
```

Create `soportedesk-frontend/src/app/features/auth/login/login.component.html`:

```html
<div class="login-page">
  <form class="login-card" [formGroup]="form" (ngSubmit)="submit()">
    <h1>SoporteDesk INIA</h1>
    <p class="subtitle">Ingreso al panel de soporte técnico</p>

    <label for="username">Usuario</label>
    <input id="username" type="text" formControlName="username" />

    <label for="password">Contraseña</label>
    <input id="password" type="password" formControlName="password" />

    <p class="error" *ngIf="errorMessage">{{ errorMessage }}</p>

    <button type="submit" [disabled]="form.invalid">Ingresar</button>
  </form>
</div>
```

Create `soportedesk-frontend/src/app/features/auth/login/login.component.scss`:

```scss
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: var(--color-green-light);
}

.login-card {
  background: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 32px;
  width: 320px;
  display: flex;
  flex-direction: column;
  gap: 8px;

  h1 {
    color: var(--color-green-dark);
    margin: 0 0 4px;
    font-size: 20px;
  }

  .subtitle {
    margin: 0 0 16px;
    color: var(--color-gray);
    font-size: 13px;
  }

  label {
    font-size: 13px;
    font-weight: 600;
  }

  input {
    padding: 8px;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    margin-bottom: 8px;
  }

  .error {
    color: var(--color-red);
    font-size: 13px;
  }

  button {
    background-color: var(--color-green);
    color: var(--color-white);
    border: none;
    border-radius: 4px;
    padding: 10px;
    font-weight: 600;

    &:disabled {
      background-color: var(--color-gray);
    }
  }
}
```

- [ ] **Step 10: Add `/login` route**

Replace `soportedesk-frontend/src/app/app.routes.ts`:

```typescript
import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
];
```

- [ ] **Step 11: Run full test suite**

Run: `cd soportedesk-frontend && npm test -- --watch=false`
Expected: all specs pass (build-generated specs + `auth.service.spec.ts`).

- [ ] **Step 12: Commit**

```bash
git add soportedesk-frontend/src/app/core soportedesk-frontend/src/app/features/auth soportedesk-frontend/src/app/app.config.ts soportedesk-frontend/src/app/app.routes.ts
git commit -m "feat: add JWT auth core (service, guard, interceptor) and login page"
```

---

## Task 3: App shell — sidebar, header, and layout routing

**Files:**
- Create: `soportedesk-frontend/src/app/layout/sidebar/sidebar.component.ts`
- Create: `soportedesk-frontend/src/app/layout/sidebar/sidebar.component.html`
- Create: `soportedesk-frontend/src/app/layout/sidebar/sidebar.component.scss`
- Create: `soportedesk-frontend/src/app/layout/header/header.component.ts`
- Create: `soportedesk-frontend/src/app/layout/header/header.component.html`
- Create: `soportedesk-frontend/src/app/layout/header/header.component.scss`
- Create: `soportedesk-frontend/src/app/layout/shell/shell.component.ts`
- Create: `soportedesk-frontend/src/app/layout/shell/shell.component.html`
- Create: `soportedesk-frontend/src/app/layout/shell/shell.component.scss`
- Modify: `soportedesk-frontend/src/app/app.routes.ts`

The sidebar mirrors the `MODULES` list from `maquetasoportedesk-inia.jsx`:
Dashboard, Licencias Office, Correos Institucionales, Usuarios de Red/AD,
VPN, Claves WiFi, Impresoras, Equipos Asignados, plus a "Catálogos" entry
visible only to `ADMIN` (linking to Task 15's catalog admin screens).

- [ ] **Step 1: Create the sidebar component**

Create `soportedesk-frontend/src/app/layout/sidebar/sidebar.component.ts`:

```typescript
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  adminOnly?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  private authService = inject(AuthService);

  collapsed = false;

  readonly navItems: NavItem[] = [
    { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { path: '/licencias', label: 'Licencias Office', icon: '🔑' },
    { path: '/correos', label: 'Correos Institucionales', icon: '✉️' },
    { path: '/usuarios-red', label: 'Usuarios de Red/AD', icon: '👤' },
    { path: '/vpn', label: 'VPN', icon: '🔒' },
    { path: '/wifi', label: 'Claves WiFi', icon: '📶' },
    { path: '/impresoras', label: 'Impresoras', icon: '🖨️' },
    { path: '/equipos', label: 'Equipos Asignados', icon: '💻' },
    { path: '/catalogos', label: 'Catálogos', icon: '🗂️', adminOnly: true },
  ];

  get visibleItems(): NavItem[] {
    return this.navItems.filter((item) => !item.adminOnly || this.authService.isAdmin());
  }

  toggleCollapsed(): void {
    this.collapsed = !this.collapsed;
  }
}
```

- [ ] **Step 2: Create sidebar template**

Create `soportedesk-frontend/src/app/layout/sidebar/sidebar.component.html`:

```html
<aside class="sidebar" [class.collapsed]="collapsed">
  <button class="toggle" (click)="toggleCollapsed()">
    {{ collapsed ? '»' : '«' }}
  </button>
  <nav>
    <a
      *ngFor="let item of visibleItems"
      [routerLink]="item.path"
      routerLinkActive="active"
      class="nav-item"
    >
      <span class="icon">{{ item.icon }}</span>
      <span class="label" *ngIf="!collapsed">{{ item.label }}</span>
    </a>
  </nav>
</aside>
```

- [ ] **Step 3: Create sidebar styles**

Create `soportedesk-frontend/src/app/layout/sidebar/sidebar.component.scss`:

```scss
.sidebar {
  width: 240px;
  background-color: var(--color-green-dark);
  color: var(--color-white);
  display: flex;
  flex-direction: column;
  transition: width 0.2s ease;
  flex-shrink: 0;

  &.collapsed {
    width: 56px;
  }
}

.toggle {
  background: none;
  border: none;
  color: var(--color-white);
  padding: 12px;
  text-align: right;
  font-size: 16px;
}

nav {
  display: flex;
  flex-direction: column;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  color: var(--color-white);
  text-decoration: none;
  font-size: 14px;

  &:hover {
    background-color: var(--color-green);
  }

  &.active {
    background-color: var(--color-green);
    font-weight: 600;
  }
}

.icon {
  font-size: 18px;
}
```

- [ ] **Step 4: Create the header component**

Create `soportedesk-frontend/src/app/layout/header/header.component.ts`:

```typescript
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  get nombre(): string {
    return this.authService.getNombre() ?? '';
  }

  get rol(): string {
    return this.authService.getRole() ?? '';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
```

- [ ] **Step 5: Create header template and styles**

Create `soportedesk-frontend/src/app/layout/header/header.component.html`:

```html
<header class="header">
  <h1>SoporteDesk INIA</h1>
  <div class="user-info">
    <span class="nombre">{{ nombre }}</span>
    <span class="rol">{{ rol }}</span>
    <button (click)="logout()">Cerrar sesión</button>
  </div>
</header>
```

Create `soportedesk-frontend/src/app/layout/header/header.component.scss`:

```scss
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background-color: var(--color-white);
  border-bottom: 1px solid var(--color-border);

  h1 {
    margin: 0;
    font-size: 18px;
    color: var(--color-green-dark);
  }
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;

  .rol {
    background-color: var(--color-green-light);
    color: var(--color-green-dark);
    border-radius: 12px;
    padding: 2px 10px;
    font-weight: 600;
  }

  button {
    background-color: var(--color-red);
    color: var(--color-white);
    border: none;
    border-radius: 4px;
    padding: 6px 12px;
    font-size: 13px;
  }
}
```

- [ ] **Step 6: Create the shell component**

Create `soportedesk-frontend/src/app/layout/shell/shell.component.ts`:

```typescript
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {}
```

Create `soportedesk-frontend/src/app/layout/shell/shell.component.html`:

```html
<div class="shell">
  <app-sidebar />
  <div class="content">
    <app-header />
    <main>
      <router-outlet />
    </main>
  </div>
</div>
```

Create `soportedesk-frontend/src/app/layout/shell/shell.component.scss`:

```scss
.shell {
  display: flex;
  min-height: 100vh;
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

main {
  padding: 24px;
  flex: 1;
}
```

- [ ] **Step 7: Wire the shell into routing**

Replace `soportedesk-frontend/src/app/app.routes.ts`. Every feature route
added in later tasks nests under the `ShellComponent` route's `children`
array, guarded by `authGuard`:

```typescript
import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { ShellComponent } from './layout/shell/shell.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
];
```

- [ ] **Step 8: Run full test suite**

Run: `cd soportedesk-frontend && npm test -- --watch=false`
Expected: all specs pass.

- [ ] **Step 9: Commit**

```bash
git add soportedesk-frontend/src/app/layout soportedesk-frontend/src/app/app.routes.ts
git commit -m "feat: add app shell with sidebar and header"
```

---

## Task 4: Shared UI atoms — Badge, VencimientoBadge, Modal, Field, SectionTitle, InfoRow

**Files:**
- Create: `soportedesk-frontend/src/app/shared/badge/badge.component.ts`
- Create: `soportedesk-frontend/src/app/shared/badge/badge.component.html`
- Create: `soportedesk-frontend/src/app/shared/badge/badge.component.scss`
- Create: `soportedesk-frontend/src/app/shared/vencimiento-badge/vencimiento-badge.component.ts`
- Create: `soportedesk-frontend/src/app/shared/vencimiento-badge/vencimiento-badge.component.html`
- Create: `soportedesk-frontend/src/app/shared/vencimiento-badge/vencimiento-badge.component.scss`
- Create: `soportedesk-frontend/src/app/shared/vencimiento-badge/vencimiento-badge.component.spec.ts`
- Create: `soportedesk-frontend/src/app/shared/modal/modal.component.ts`
- Create: `soportedesk-frontend/src/app/shared/modal/modal.component.html`
- Create: `soportedesk-frontend/src/app/shared/modal/modal.component.scss`
- Create: `soportedesk-frontend/src/app/shared/field/field.component.ts`
- Create: `soportedesk-frontend/src/app/shared/field/field.component.html`
- Create: `soportedesk-frontend/src/app/shared/field/field.component.scss`
- Create: `soportedesk-frontend/src/app/shared/section-title/section-title.component.ts`
- Create: `soportedesk-frontend/src/app/shared/section-title/section-title.component.html`
- Create: `soportedesk-frontend/src/app/shared/section-title/section-title.component.scss`
- Create: `soportedesk-frontend/src/app/shared/info-row/info-row.component.ts`
- Create: `soportedesk-frontend/src/app/shared/info-row/info-row.component.html`
- Create: `soportedesk-frontend/src/app/shared/info-row/info-row.component.scss`

`VencimientoBadgeComponent` implements the rule from spec section 3.4:
fecha in the past → red "Vencido"; fecha within the next 30 days → yellow
"Por vencer"; otherwise nothing is rendered. It is used by the Correos,
Usuarios de Red, and VPN list/form components in later tasks.

- [ ] **Step 1: Create `BadgeComponent`**

Create `soportedesk-frontend/src/app/shared/badge/badge.component.ts`:

```typescript
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeColor = 'green' | 'yellow' | 'red' | 'gray';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './badge.component.html',
  styleUrl: './badge.component.scss',
})
export class BadgeComponent {
  @Input({ required: true }) text!: string;
  @Input() color: BadgeColor = 'gray';
}
```

Create `soportedesk-frontend/src/app/shared/badge/badge.component.html`:

```html
<span class="badge" [class]="'badge--' + color">{{ text }}</span>
```

Create `soportedesk-frontend/src/app/shared/badge/badge.component.scss`:

```scss
.badge {
  display: inline-block;
  border-radius: 12px;
  padding: 2px 10px;
  font-size: 12px;
  font-weight: 600;

  &--green {
    background-color: var(--color-green-light);
    color: var(--color-green-dark);
  }

  &--yellow {
    background-color: var(--color-yellow-light);
    color: #8a6d00;
  }

  &--red {
    background-color: var(--color-red-light);
    color: var(--color-red);
  }

  &--gray {
    background-color: var(--color-gray-light);
    color: var(--color-gray);
  }
}
```

- [ ] **Step 2: Write failing test for `VencimientoBadgeComponent`**

Create `soportedesk-frontend/src/app/shared/vencimiento-badge/vencimiento-badge.component.spec.ts`:

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VencimientoBadgeComponent } from './vencimiento-badge.component';

function isoDateOffset(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().substring(0, 10);
}

describe('VencimientoBadgeComponent', () => {
  let fixture: ComponentFixture<VencimientoBadgeComponent>;
  let component: VencimientoBadgeComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [VencimientoBadgeComponent],
    });
    fixture = TestBed.createComponent(VencimientoBadgeComponent);
    component = fixture.componentInstance;
  });

  it('shows "Vencido" when fecha is in the past', () => {
    component.fecha = isoDateOffset(-5);
    fixture.detectChanges();

    expect(component.status).toBe('vencido');
    expect(fixture.nativeElement.textContent).toContain('Vencido');
  });

  it('shows "Por vencer" when fecha is within 30 days', () => {
    component.fecha = isoDateOffset(10);
    fixture.detectChanges();

    expect(component.status).toBe('por-vencer');
    expect(fixture.nativeElement.textContent).toContain('Por vencer');
  });

  it('shows nothing when fecha is more than 30 days away', () => {
    component.fecha = isoDateOffset(60);
    fixture.detectChanges();

    expect(component.status).toBeNull();
    expect(fixture.nativeElement.textContent.trim()).toBe('');
  });

  it('shows nothing when fecha is null', () => {
    component.fecha = null;
    fixture.detectChanges();

    expect(component.status).toBeNull();
    expect(fixture.nativeElement.textContent.trim()).toBe('');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd soportedesk-frontend && npm test -- --watch=false --include='**/vencimiento-badge.component.spec.ts'`
Expected: FAIL — `VencimientoBadgeComponent` does not exist.

- [ ] **Step 4: Implement `VencimientoBadgeComponent`**

Create `soportedesk-frontend/src/app/shared/vencimiento-badge/vencimiento-badge.component.ts`:

```typescript
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BadgeComponent } from '../badge/badge.component';

export type VencimientoStatus = 'vencido' | 'por-vencer' | null;

const DIAS_POR_VENCER = 30;

@Component({
  selector: 'app-vencimiento-badge',
  standalone: true,
  imports: [CommonModule, BadgeComponent],
  templateUrl: './vencimiento-badge.component.html',
  styleUrl: './vencimiento-badge.component.scss',
})
export class VencimientoBadgeComponent {
  @Input() fecha: string | null = null;

  get status(): VencimientoStatus {
    if (!this.fecha) {
      return null;
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const fechaFin = new Date(this.fecha);
    fechaFin.setHours(0, 0, 0, 0);

    const diffDias = (fechaFin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDias < 0) {
      return 'vencido';
    }
    if (diffDias <= DIAS_POR_VENCER) {
      return 'por-vencer';
    }
    return null;
  }
}
```

Create `soportedesk-frontend/src/app/shared/vencimiento-badge/vencimiento-badge.component.html`:

```html
<app-badge *ngIf="status === 'vencido'" text="Vencido" color="red" />
<app-badge *ngIf="status === 'por-vencer'" text="Por vencer" color="yellow" />
```

Create `soportedesk-frontend/src/app/shared/vencimiento-badge/vencimiento-badge.component.scss`:

```scss
:host {
  display: inline-block;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd soportedesk-frontend && npm test -- --watch=false --include='**/vencimiento-badge.component.spec.ts'`
Expected: PASS (4 specs).

- [ ] **Step 6: Create `ModalComponent`**

Create `soportedesk-frontend/src/app/shared/modal/modal.component.ts`:

```typescript
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss',
})
export class ModalComponent {
  @Input({ required: true }) title!: string;
  @Input() open = false;
  @Output() closed = new EventEmitter<void>();

  close(): void {
    this.closed.emit();
  }
}
```

Create `soportedesk-frontend/src/app/shared/modal/modal.component.html`:

```html
<div class="overlay" *ngIf="open" (click)="close()">
  <div class="dialog" (click)="$event.stopPropagation()">
    <header>
      <h2>{{ title }}</h2>
      <button class="close" (click)="close()">×</button>
    </header>
    <div class="body">
      <ng-content />
    </div>
  </div>
</div>
```

Create `soportedesk-frontend/src/app/shared/modal/modal.component.scss`:

```scss
.overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background-color: var(--color-white);
  border-radius: 8px;
  width: 480px;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
}

header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid var(--color-border);

  h2 {
    margin: 0;
    font-size: 16px;
    color: var(--color-green-dark);
  }

  .close {
    background: none;
    border: none;
    font-size: 20px;
    line-height: 1;
  }
}

.body {
  padding: 16px;
}
```

- [ ] **Step 7: Create `FieldComponent`**

Create `soportedesk-frontend/src/app/shared/field/field.component.ts`:

```typescript
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-field',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './field.component.html',
  styleUrl: './field.component.scss',
})
export class FieldComponent {
  @Input({ required: true }) label!: string;
}
```

Create `soportedesk-frontend/src/app/shared/field/field.component.html`:

```html
<div class="field">
  <label>{{ label }}</label>
  <div class="control">
    <ng-content />
  </div>
</div>
```

Create `soportedesk-frontend/src/app/shared/field/field.component.scss`:

```scss
.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;

  label {
    font-size: 12px;
    font-weight: 600;
    color: var(--color-gray);
    text-transform: uppercase;
  }

  .control {
    font-size: 14px;
  }
}
```

- [ ] **Step 8: Create `SectionTitleComponent`**

Create `soportedesk-frontend/src/app/shared/section-title/section-title.component.ts`:

```typescript
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-section-title',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './section-title.component.html',
  styleUrl: './section-title.component.scss',
})
export class SectionTitleComponent {
  @Input({ required: true }) text!: string;
}
```

Create `soportedesk-frontend/src/app/shared/section-title/section-title.component.html`:

```html
<h3 class="section-title">{{ text }}</h3>
```

Create `soportedesk-frontend/src/app/shared/section-title/section-title.component.scss`:

```scss
.section-title {
  color: var(--color-green-dark);
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 2px solid var(--color-green-light);
  padding-bottom: 4px;
  margin: 16px 0 12px;
}
```

- [ ] **Step 9: Create `InfoRowComponent`**

Create `soportedesk-frontend/src/app/shared/info-row/info-row.component.ts`:

```typescript
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-info-row',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './info-row.component.html',
  styleUrl: './info-row.component.scss',
})
export class InfoRowComponent {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) value!: string | number | null;
}
```

Create `soportedesk-frontend/src/app/shared/info-row/info-row.component.html`:

```html
<div class="info-row">
  <span class="label">{{ label }}</span>
  <span class="value">{{ value ?? '—' }}</span>
</div>
```

Create `soportedesk-frontend/src/app/shared/info-row/info-row.component.scss`:

```scss
.info-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px solid var(--color-border);
  font-size: 14px;

  .label {
    color: var(--color-gray);
  }

  .value {
    font-weight: 600;
  }
}
```

- [ ] **Step 10: Run full test suite**

Run: `cd soportedesk-frontend && npm test -- --watch=false`
Expected: all specs pass.

- [ ] **Step 11: Commit**

```bash
git add soportedesk-frontend/src/app/shared/badge soportedesk-frontend/src/app/shared/vencimiento-badge soportedesk-frontend/src/app/shared/modal soportedesk-frontend/src/app/shared/field soportedesk-frontend/src/app/shared/section-title soportedesk-frontend/src/app/shared/info-row
git commit -m "feat: add shared UI atoms (badge, vencimiento-badge, modal, field, section-title, info-row)"
```

---

## Task 5: Shared GenericTableComponent

**Files:**
- Create: `soportedesk-frontend/src/app/shared/generic-table/generic-table.component.ts`
- Create: `soportedesk-frontend/src/app/shared/generic-table/generic-table.component.html`
- Create: `soportedesk-frontend/src/app/shared/generic-table/generic-table.component.scss`
- Create: `soportedesk-frontend/src/app/shared/generic-table/generic-table.component.spec.ts`

`GenericTableComponent` is the equivalent of the mockup's `Tabla` component:
it renders a search box, an "Agregar" button (visible only when `canEdit` is
true), a data table with configurable columns (supporting dot-notation keys
for nested objects like `sede.nombre`), and Ver/Editar/Eliminar actions. An
optional `extraCellTemplate` (passed via content projection with
`#extraCell`) renders an extra trailing column — used by Correos, Usuarios
de Red, and VPN list components in later tasks to show the
`VencimientoBadgeComponent`.

- [ ] **Step 1: Write failing test for `GenericTableComponent`**

Create `soportedesk-frontend/src/app/shared/generic-table/generic-table.component.spec.ts`:

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GenericTableComponent } from './generic-table.component';

describe('GenericTableComponent', () => {
  let fixture: ComponentFixture<GenericTableComponent>;
  let component: GenericTableComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [GenericTableComponent],
    });
    fixture = TestBed.createComponent(GenericTableComponent);
    component = fixture.componentInstance;
    component.columns = [
      { key: 'nombre', label: 'Nombre' },
      { key: 'sede.nombre', label: 'Sede' },
    ];
    component.data = [
      { id: 1, nombre: 'Juan Pérez', sede: { nombre: 'Lima' } },
      { id: 2, nombre: 'Ana Gómez', sede: { nombre: 'Cusco' } },
    ];
  });

  it('renders one row per data item with nested column values', () => {
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('Juan Pérez');
    expect(rows[0].textContent).toContain('Lima');
    expect(rows[1].textContent).toContain('Ana Gómez');
    expect(rows[1].textContent).toContain('Cusco');
  });

  it('emits delete with the row when the Eliminar button is clicked', () => {
    component.canEdit = true;
    fixture.detectChanges();

    let deleted: unknown;
    component.delete.subscribe((row) => (deleted = row));

    const buttons: NodeListOf<HTMLButtonElement> =
      fixture.nativeElement.querySelectorAll('tbody tr:first-child .actions button');
    const deleteButton = Array.from(buttons).find((b) => b.textContent?.trim() === 'Eliminar');
    deleteButton!.click();

    expect(deleted).toEqual(component.data[0]);
  });

  it('shows "Sin registros" when data is empty', () => {
    component.data = [];
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Sin registros');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd soportedesk-frontend && npm test -- --watch=false --include='**/generic-table.component.spec.ts'`
Expected: FAIL — `GenericTableComponent` does not exist.

- [ ] **Step 3: Implement `GenericTableComponent`**

Create `soportedesk-frontend/src/app/shared/generic-table/generic-table.component.ts`:

```typescript
import { Component, ContentChild, EventEmitter, Input, Output, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TableColumn {
  key: string;
  label: string;
}

@Component({
  selector: 'app-generic-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './generic-table.component.html',
  styleUrl: './generic-table.component.scss',
})
export class GenericTableComponent<T = Record<string, unknown>> {
  @Input({ required: true }) columns: TableColumn[] = [];
  @Input({ required: true }) data: T[] = [];
  @Input() canEdit = false;
  @Input() extraColumnLabel: string | null = null;

  @Output() searchChange = new EventEmitter<string>();
  @Output() add = new EventEmitter<void>();
  @Output() view = new EventEmitter<T>();
  @Output() edit = new EventEmitter<T>();
  @Output() delete = new EventEmitter<T>();

  @ContentChild('extraCell') extraCellTemplate?: TemplateRef<{ $implicit: T }>;

  getValue(row: T, key: string): unknown {
    return key.split('.').reduce<unknown>((value, part) => {
      if (value && typeof value === 'object') {
        return (value as Record<string, unknown>)[part];
      }
      return undefined;
    }, row);
  }

  onSearch(value: string): void {
    this.searchChange.emit(value);
  }
}
```

- [ ] **Step 4: Create the table template**

Create `soportedesk-frontend/src/app/shared/generic-table/generic-table.component.html`:

```html
<div class="table-toolbar">
  <input type="text" placeholder="Buscar..." (input)="onSearch($any($event.target).value)" />
  <button *ngIf="canEdit" class="add-btn" (click)="add.emit()">Agregar</button>
</div>

<table>
  <thead>
    <tr>
      <th *ngFor="let col of columns">{{ col.label }}</th>
      <th *ngIf="extraColumnLabel">{{ extraColumnLabel }}</th>
      <th>Acciones</th>
    </tr>
  </thead>
  <tbody>
    <tr *ngFor="let row of data">
      <td *ngFor="let col of columns">{{ getValue(row, col.key) }}</td>
      <td *ngIf="extraColumnLabel">
        <ng-container *ngTemplateOutlet="extraCellTemplate ?? null; context: { $implicit: row }" />
      </td>
      <td class="actions">
        <button (click)="view.emit(row)">Ver</button>
        <button *ngIf="canEdit" (click)="edit.emit(row)">Editar</button>
        <button *ngIf="canEdit" (click)="delete.emit(row)">Eliminar</button>
      </td>
    </tr>
    <tr *ngIf="data.length === 0">
      <td [attr.colspan]="columns.length + (extraColumnLabel ? 2 : 1)" class="empty">
        Sin registros
      </td>
    </tr>
  </tbody>
</table>
```

- [ ] **Step 5: Create the table styles**

Create `soportedesk-frontend/src/app/shared/generic-table/generic-table.component.scss`:

```scss
.table-toolbar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;

  input {
    padding: 8px;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    width: 240px;
  }

  .add-btn {
    background-color: var(--color-green);
    color: var(--color-white);
    border: none;
    border-radius: 4px;
    padding: 8px 16px;
    font-weight: 600;
  }
}

.actions {
  display: flex;
  gap: 6px;

  button {
    border: 1px solid var(--color-border);
    background-color: var(--color-white);
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 12px;

    &:hover {
      background-color: var(--color-green-light);
    }
  }
}

.empty {
  text-align: center;
  color: var(--color-gray);
  padding: 16px;
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd soportedesk-frontend && npm test -- --watch=false --include='**/generic-table.component.spec.ts'`
Expected: PASS (3 specs).

- [ ] **Step 7: Commit**

```bash
git add soportedesk-frontend/src/app/shared/generic-table
git commit -m "feat: add shared GenericTableComponent"
```

---

## Task 6: Catalog models, CatalogoService, and cascading UbicacionSelect

**Files:**
- Create: `soportedesk-frontend/src/app/core/models/catalogo.model.ts`
- Create: `soportedesk-frontend/src/app/core/catalogos/catalogo.service.ts`
- Create: `soportedesk-frontend/src/app/shared/ubicacion-select/ubicacion-select.component.ts`
- Create: `soportedesk-frontend/src/app/shared/ubicacion-select/ubicacion-select.component.html`
- Create: `soportedesk-frontend/src/app/shared/ubicacion-select/ubicacion-select.component.scss`

`CatalogoService` wraps `/api/catalogos/*` (read for any authenticated user,
write for `ADMIN` — used later by the Task 15 catalog admin screens).
`UbicacionSelectComponent` renders the Sede → Dependencia → Subdependencia
cascading selects plus the Tipo de Contrato select, used by the Correos
(Task 12) and Usuarios de Red (Task 13) forms.

- [ ] **Step 1: Create catalog models**

Create `soportedesk-frontend/src/app/core/models/catalogo.model.ts`:

```typescript
export interface Sede {
  id: number;
  nombre: string;
}

export interface Dependencia {
  id: number;
  nombre: string;
  sede: Sede;
}

export interface Subdependencia {
  id: number;
  nombre: string;
  dependencia: Dependencia;
}

export interface TipoContrato {
  id: number;
  nombre: string;
}

export interface CatalogoRequest {
  nombre: string;
}

export interface DependenciaRequest {
  nombre: string;
  sedeId: number;
}

export interface SubdependenciaRequest {
  nombre: string;
  dependenciaId: number;
}
```

- [ ] **Step 2: Implement `CatalogoService`**

Create `soportedesk-frontend/src/app/core/catalogos/catalogo.service.ts`:

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CatalogoRequest,
  Dependencia,
  DependenciaRequest,
  Sede,
  Subdependencia,
  SubdependenciaRequest,
  TipoContrato,
} from '../models/catalogo.model';

@Injectable({ providedIn: 'root' })
export class CatalogoService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/catalogos`;

  getSedes(): Observable<Sede[]> {
    return this.http.get<Sede[]>(`${this.apiUrl}/sedes`);
  }

  createSede(request: CatalogoRequest): Observable<Sede> {
    return this.http.post<Sede>(`${this.apiUrl}/sedes`, request);
  }

  updateSede(id: number, request: CatalogoRequest): Observable<Sede> {
    return this.http.put<Sede>(`${this.apiUrl}/sedes/${id}`, request);
  }

  deleteSede(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/sedes/${id}`);
  }

  getDependencias(sedeId?: number): Observable<Dependencia[]> {
    let params = new HttpParams();
    if (sedeId) {
      params = params.set('sedeId', sedeId);
    }
    return this.http.get<Dependencia[]>(`${this.apiUrl}/dependencias`, { params });
  }

  createDependencia(request: DependenciaRequest): Observable<Dependencia> {
    return this.http.post<Dependencia>(`${this.apiUrl}/dependencias`, request);
  }

  updateDependencia(id: number, request: DependenciaRequest): Observable<Dependencia> {
    return this.http.put<Dependencia>(`${this.apiUrl}/dependencias/${id}`, request);
  }

  deleteDependencia(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/dependencias/${id}`);
  }

  getSubdependencias(dependenciaId?: number): Observable<Subdependencia[]> {
    let params = new HttpParams();
    if (dependenciaId) {
      params = params.set('dependenciaId', dependenciaId);
    }
    return this.http.get<Subdependencia[]>(`${this.apiUrl}/subdependencias`, { params });
  }

  createSubdependencia(request: SubdependenciaRequest): Observable<Subdependencia> {
    return this.http.post<Subdependencia>(`${this.apiUrl}/subdependencias`, request);
  }

  updateSubdependencia(id: number, request: SubdependenciaRequest): Observable<Subdependencia> {
    return this.http.put<Subdependencia>(`${this.apiUrl}/subdependencias/${id}`, request);
  }

  deleteSubdependencia(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/subdependencias/${id}`);
  }

  getTiposContrato(): Observable<TipoContrato[]> {
    return this.http.get<TipoContrato[]>(`${this.apiUrl}/tipos-contrato`);
  }

  createTipoContrato(request: CatalogoRequest): Observable<TipoContrato> {
    return this.http.post<TipoContrato>(`${this.apiUrl}/tipos-contrato`, request);
  }

  updateTipoContrato(id: number, request: CatalogoRequest): Observable<TipoContrato> {
    return this.http.put<TipoContrato>(`${this.apiUrl}/tipos-contrato/${id}`, request);
  }

  deleteTipoContrato(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/tipos-contrato/${id}`);
  }
}
```

- [ ] **Step 3: Implement `UbicacionSelectComponent`**

Create `soportedesk-frontend/src/app/shared/ubicacion-select/ubicacion-select.component.ts`.
It exposes `sedeId`, `dependenciaId`, `subdependenciaId`, `tipoContratoId` as
two-way-bindable `@Input()`/`@Output()` pairs (Angular's `[(x)]` banana-in-box
syntax, backed by `xChange` outputs), so a parent reactive form can do
`[(sedeId)]="form.controls.sedeId.value"`-style wiring by listening to the
change events and calling `form.patchValue(...)`.

```typescript
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CatalogoService } from '../../core/catalogos/catalogo.service';
import { Dependencia, Sede, Subdependencia, TipoContrato } from '../../core/models/catalogo.model';

@Component({
  selector: 'app-ubicacion-select',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ubicacion-select.component.html',
  styleUrl: './ubicacion-select.component.scss',
})
export class UbicacionSelectComponent implements OnInit, OnChanges {
  private catalogoService = inject(CatalogoService);

  @Input() sedeId: number | null = null;
  @Input() dependenciaId: number | null = null;
  @Input() subdependenciaId: number | null = null;
  @Input() tipoContratoId: number | null = null;

  @Output() sedeIdChange = new EventEmitter<number | null>();
  @Output() dependenciaIdChange = new EventEmitter<number | null>();
  @Output() subdependenciaIdChange = new EventEmitter<number | null>();
  @Output() tipoContratoIdChange = new EventEmitter<number | null>();

  sedes: Sede[] = [];
  dependencias: Dependencia[] = [];
  subdependencias: Subdependencia[] = [];
  tiposContrato: TipoContrato[] = [];

  ngOnInit(): void {
    this.catalogoService.getSedes().subscribe((sedes) => (this.sedes = sedes));
    this.catalogoService.getTiposContrato().subscribe((tipos) => (this.tiposContrato = tipos));
    if (this.sedeId) {
      this.loadDependencias(this.sedeId);
    }
    if (this.dependenciaId) {
      this.loadSubdependencias(this.dependenciaId);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['sedeId'] && !changes['sedeId'].firstChange) {
      this.loadDependencias(this.sedeId);
    }
    if (changes['dependenciaId'] && !changes['dependenciaId'].firstChange) {
      this.loadSubdependencias(this.dependenciaId);
    }
  }

  onSedeChange(value: string): void {
    const sedeId = value ? Number(value) : null;
    this.sedeId = sedeId;
    this.dependenciaId = null;
    this.subdependenciaId = null;
    this.dependencias = [];
    this.subdependencias = [];
    this.sedeIdChange.emit(sedeId);
    this.dependenciaIdChange.emit(null);
    this.subdependenciaIdChange.emit(null);
    if (sedeId) {
      this.loadDependencias(sedeId);
    }
  }

  onDependenciaChange(value: string): void {
    const dependenciaId = value ? Number(value) : null;
    this.dependenciaId = dependenciaId;
    this.subdependenciaId = null;
    this.subdependencias = [];
    this.dependenciaIdChange.emit(dependenciaId);
    this.subdependenciaIdChange.emit(null);
    if (dependenciaId) {
      this.loadSubdependencias(dependenciaId);
    }
  }

  onSubdependenciaChange(value: string): void {
    const subdependenciaId = value ? Number(value) : null;
    this.subdependenciaId = subdependenciaId;
    this.subdependenciaIdChange.emit(subdependenciaId);
  }

  onTipoContratoChange(value: string): void {
    const tipoContratoId = value ? Number(value) : null;
    this.tipoContratoId = tipoContratoId;
    this.tipoContratoIdChange.emit(tipoContratoId);
  }

  private loadDependencias(sedeId: number | null): void {
    if (!sedeId) {
      this.dependencias = [];
      return;
    }
    this.catalogoService.getDependencias(sedeId).subscribe((dependencias) => (this.dependencias = dependencias));
  }

  private loadSubdependencias(dependenciaId: number | null): void {
    if (!dependenciaId) {
      this.subdependencias = [];
      return;
    }
    this.catalogoService
      .getSubdependencias(dependenciaId)
      .subscribe((subdependencias) => (this.subdependencias = subdependencias));
  }
}
```

- [ ] **Step 4: Create the template**

Create `soportedesk-frontend/src/app/shared/ubicacion-select/ubicacion-select.component.html`:

```html
<div class="ubicacion-select">
  <div class="field">
    <label>Sede</label>
    <select [ngModel]="sedeId" (change)="onSedeChange($any($event.target).value)" name="sede">
      <option [ngValue]="null">Seleccione...</option>
      <option *ngFor="let sede of sedes" [ngValue]="sede.id">{{ sede.nombre }}</option>
    </select>
  </div>

  <div class="field">
    <label>Dependencia</label>
    <select
      [ngModel]="dependenciaId"
      (change)="onDependenciaChange($any($event.target).value)"
      name="dependencia"
      [disabled]="!sedeId"
    >
      <option [ngValue]="null">Seleccione...</option>
      <option *ngFor="let dependencia of dependencias" [ngValue]="dependencia.id">
        {{ dependencia.nombre }}
      </option>
    </select>
  </div>

  <div class="field">
    <label>Subdependencia</label>
    <select
      [ngModel]="subdependenciaId"
      (change)="onSubdependenciaChange($any($event.target).value)"
      name="subdependencia"
      [disabled]="!dependenciaId"
    >
      <option [ngValue]="null">Seleccione...</option>
      <option *ngFor="let subdependencia of subdependencias" [ngValue]="subdependencia.id">
        {{ subdependencia.nombre }}
      </option>
    </select>
  </div>

  <div class="field">
    <label>Tipo de Contrato</label>
    <select [ngModel]="tipoContratoId" (change)="onTipoContratoChange($any($event.target).value)" name="tipoContrato">
      <option [ngValue]="null">Seleccione...</option>
      <option *ngFor="let tipo of tiposContrato" [ngValue]="tipo.id">{{ tipo.nombre }}</option>
    </select>
  </div>
</div>
```

Add `FormsModule` to the component's `imports` array (for `[ngModel]` /
`[ngValue]` bindings used in single-binding mode here):

```typescript
import { FormsModule } from '@angular/forms';
// ...
@Component({
  // ...
  imports: [CommonModule, FormsModule],
  // ...
})
```

- [ ] **Step 5: Create the styles**

Create `soportedesk-frontend/src/app/shared/ubicacion-select/ubicacion-select.component.scss`:

```scss
.ubicacion-select {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;

  label {
    font-size: 12px;
    font-weight: 600;
    color: var(--color-gray);
  }

  select {
    padding: 8px;
    border: 1px solid var(--color-border);
    border-radius: 4px;
  }
}
```

- [ ] **Step 6: Run full test suite**

Run: `cd soportedesk-frontend && npm test -- --watch=false`
Expected: all specs pass (no new specs added in this task).

- [ ] **Step 7: Commit**

```bash
git add soportedesk-frontend/src/app/core/models/catalogo.model.ts soportedesk-frontend/src/app/core/catalogos soportedesk-frontend/src/app/shared/ubicacion-select
git commit -m "feat: add catalog models, CatalogoService, and cascading UbicacionSelect"
```

---

## Task 7: Dashboard feature

**Files:**
- Create: `soportedesk-frontend/src/app/features/dashboard/dashboard-counts.model.ts`
- Create: `soportedesk-frontend/src/app/features/dashboard/dashboard.service.ts`
- Create: `soportedesk-frontend/src/app/features/dashboard/dashboard.component.ts`
- Create: `soportedesk-frontend/src/app/features/dashboard/dashboard.component.html`
- Create: `soportedesk-frontend/src/app/features/dashboard/dashboard.component.scss`
- Modify: `soportedesk-frontend/src/app/app.routes.ts`

- [ ] **Step 1: Create the dashboard model**

Create `soportedesk-frontend/src/app/features/dashboard/dashboard-counts.model.ts`:

```typescript
export interface DashboardCounts {
  licencias: number;
  correos: number;
  usuariosRed: number;
  vpn: number;
  wifi: number;
  impresoras: number;
  equipos: number;
}
```

- [ ] **Step 2: Create `DashboardService`**

Create `soportedesk-frontend/src/app/features/dashboard/dashboard.service.ts`:

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DashboardCounts } from './dashboard-counts.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/dashboard`;

  getCounts(): Observable<DashboardCounts> {
    return this.http.get<DashboardCounts>(`${this.apiUrl}/counts`);
  }
}
```

- [ ] **Step 3: Create the dashboard component**

Create `soportedesk-frontend/src/app/features/dashboard/dashboard.component.ts`:

```typescript
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService } from './dashboard.service';
import { DashboardCounts } from './dashboard-counts.model';

interface DashboardCard {
  label: string;
  value: number;
  path: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);

  cards: DashboardCard[] = [];

  ngOnInit(): void {
    this.dashboardService.getCounts().subscribe((counts) => {
      this.cards = this.toCards(counts);
    });
  }

  private toCards(counts: DashboardCounts): DashboardCard[] {
    return [
      { label: 'Licencias Office', value: counts.licencias, path: '/licencias' },
      { label: 'Correos Institucionales', value: counts.correos, path: '/correos' },
      { label: 'Usuarios de Red/AD', value: counts.usuariosRed, path: '/usuarios-red' },
      { label: 'VPN', value: counts.vpn, path: '/vpn' },
      { label: 'Claves WiFi', value: counts.wifi, path: '/wifi' },
      { label: 'Impresoras', value: counts.impresoras, path: '/impresoras' },
      { label: 'Equipos Asignados', value: counts.equipos, path: '/equipos' },
    ];
  }
}
```

- [ ] **Step 4: Create the dashboard template and styles**

Create `soportedesk-frontend/src/app/features/dashboard/dashboard.component.html`:

```html
<h2>Panel de control</h2>
<div class="cards">
  <a class="card" *ngFor="let card of cards" [routerLink]="card.path">
    <span class="value">{{ card.value }}</span>
    <span class="label">{{ card.label }}</span>
  </a>
</div>
```

Create `soportedesk-frontend/src/app/features/dashboard/dashboard.component.scss`:

```scss
h2 {
  color: var(--color-green-dark);
  margin-top: 0;
}

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
}

.card {
  background-color: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-decoration: none;
  color: var(--color-text);

  &:hover {
    border-color: var(--color-green);
  }

  .value {
    font-size: 28px;
    font-weight: 700;
    color: var(--color-green-dark);
  }

  .label {
    font-size: 13px;
    color: var(--color-gray);
  }
}
```

- [ ] **Step 5: Register the `/dashboard` route**

Modify `soportedesk-frontend/src/app/app.routes.ts`: add a child route under
the `ShellComponent` route's `children` array, alongside the redirect:

```typescript
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
```

- [ ] **Step 6: Run full test suite**

Run: `cd soportedesk-frontend && npm test -- --watch=false`
Expected: all specs pass.

- [ ] **Step 7: Commit**

```bash
git add soportedesk-frontend/src/app/features/dashboard soportedesk-frontend/src/app/app.routes.ts
git commit -m "feat: add dashboard feature with module count cards"
```

---

## Task 8: Licencias Office feature (list, view, create/edit form)

**Files:**
- Create: `soportedesk-frontend/src/app/features/licencias/licencia.model.ts`
- Create: `soportedesk-frontend/src/app/features/licencias/licencia.service.ts`
- Create: `soportedesk-frontend/src/app/features/licencias/licencias-list.component.ts`
- Create: `soportedesk-frontend/src/app/features/licencias/licencias-list.component.html`
- Create: `soportedesk-frontend/src/app/features/licencias/licencias-list.component.scss`
- Create: `soportedesk-frontend/src/app/features/licencias/licencia-form.component.ts`
- Create: `soportedesk-frontend/src/app/features/licencias/licencia-form.component.html`
- Create: `soportedesk-frontend/src/app/features/licencias/licencia-form.component.scss`
- Modify: `soportedesk-frontend/src/app/app.routes.ts`

This task establishes the list+form pattern reused (with different fields)
by Wifi (Task 9), Equipos (Task 10), and VPN (Task 11): a list component
combining `GenericTableComponent` with a "Ver" modal (read-only `FieldComponent`
rows) and a create/edit modal hosting a reactive-form component.

- [ ] **Step 1: Create the Licencia model**

Create `soportedesk-frontend/src/app/features/licencias/licencia.model.ts`:

```typescript
export interface Licencia {
  id: number;
  cantidad: number;
  licencia: string;
  correo: string;
  clave: string;
  ordenCompra: string;
  anio: string;
}

export type LicenciaRequest = Omit<Licencia, 'id'>;
```

- [ ] **Step 2: Create `LicenciaService`**

Create `soportedesk-frontend/src/app/features/licencias/licencia.service.ts`:

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Licencia, LicenciaRequest } from './licencia.model';

@Injectable({ providedIn: 'root' })
export class LicenciaService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/licencias`;

  getAll(search?: string): Observable<Licencia[]> {
    let params = new HttpParams();
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<Licencia[]>(this.apiUrl, { params });
  }

  getById(id: number): Observable<Licencia> {
    return this.http.get<Licencia>(`${this.apiUrl}/${id}`);
  }

  create(request: LicenciaRequest): Observable<Licencia> {
    return this.http.post<Licencia>(this.apiUrl, request);
  }

  update(id: number, request: LicenciaRequest): Observable<Licencia> {
    return this.http.put<Licencia>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
```

- [ ] **Step 3: Create `LicenciaFormComponent`**

Create `soportedesk-frontend/src/app/features/licencias/licencia-form.component.ts`:

```typescript
import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Licencia } from './licencia.model';
import { LicenciaService } from './licencia.service';

@Component({
  selector: 'app-licencia-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './licencia-form.component.html',
  styleUrl: './licencia-form.component.scss',
})
export class LicenciaFormComponent implements OnChanges {
  private fb = inject(FormBuilder);
  private service = inject(LicenciaService);

  @Input() licencia: Licencia | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  form = this.fb.nonNullable.group({
    cantidad: [1, [Validators.required, Validators.min(1)]],
    licencia: ['', Validators.required],
    correo: ['', [Validators.required, Validators.email]],
    clave: ['', Validators.required],
    ordenCompra: ['', Validators.required],
    anio: ['', Validators.required],
  });

  ngOnChanges(): void {
    if (this.licencia) {
      this.form.patchValue(this.licencia);
    } else {
      this.form.reset({ cantidad: 1, licencia: '', correo: '', clave: '', ordenCompra: '', anio: '' });
    }
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }
    const request = this.form.getRawValue();
    const obs = this.licencia
      ? this.service.update(this.licencia.id, request)
      : this.service.create(request);
    obs.subscribe(() => this.saved.emit());
  }
}
```

- [ ] **Step 4: Create the form template and styles**

Create `soportedesk-frontend/src/app/features/licencias/licencia-form.component.html`:

```html
<form [formGroup]="form" (ngSubmit)="submit()">
  <div class="field">
    <label>Cantidad</label>
    <input type="number" formControlName="cantidad" min="1" />
  </div>
  <div class="field">
    <label>Licencia</label>
    <input type="text" formControlName="licencia" />
  </div>
  <div class="field">
    <label>Correo</label>
    <input type="email" formControlName="correo" />
  </div>
  <div class="field">
    <label>Clave</label>
    <input type="text" formControlName="clave" />
  </div>
  <div class="field">
    <label>Orden de Compra</label>
    <input type="text" formControlName="ordenCompra" />
  </div>
  <div class="field">
    <label>Año</label>
    <input type="text" formControlName="anio" />
  </div>

  <div class="actions">
    <button type="button" class="secondary" (click)="cancelled.emit()">Cancelar</button>
    <button type="submit" [disabled]="form.invalid">Guardar</button>
  </div>
</form>
```

Create `soportedesk-frontend/src/app/features/licencias/licencia-form.component.scss`:

```scss
.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;

  label {
    font-size: 12px;
    font-weight: 600;
    color: var(--color-gray);
  }

  input {
    padding: 8px;
    border: 1px solid var(--color-border);
    border-radius: 4px;
  }
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;

  button {
    border: none;
    border-radius: 4px;
    padding: 8px 16px;
    font-weight: 600;
    background-color: var(--color-green);
    color: var(--color-white);

    &:disabled {
      background-color: var(--color-gray);
    }

    &.secondary {
      background-color: var(--color-gray-light);
      color: var(--color-text);
    }
  }
}
```

- [ ] **Step 5: Create `LicenciasListComponent`**

Create `soportedesk-frontend/src/app/features/licencias/licencias-list.component.ts`:

```typescript
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';
import { GenericTableComponent, TableColumn } from '../../shared/generic-table/generic-table.component';
import { ModalComponent } from '../../shared/modal/modal.component';
import { FieldComponent } from '../../shared/field/field.component';
import { LicenciaFormComponent } from './licencia-form.component';
import { Licencia } from './licencia.model';
import { LicenciaService } from './licencia.service';

@Component({
  selector: 'app-licencias-list',
  standalone: true,
  imports: [CommonModule, GenericTableComponent, ModalComponent, FieldComponent, LicenciaFormComponent],
  templateUrl: './licencias-list.component.html',
  styleUrl: './licencias-list.component.scss',
})
export class LicenciasListComponent implements OnInit {
  private service = inject(LicenciaService);
  private authService = inject(AuthService);

  licencias: Licencia[] = [];
  columns: TableColumn[] = [
    { key: 'cantidad', label: 'Cantidad' },
    { key: 'licencia', label: 'Licencia' },
    { key: 'correo', label: 'Correo' },
    { key: 'clave', label: 'Clave' },
    { key: 'ordenCompra', label: 'Orden de Compra' },
    { key: 'anio', label: 'Año' },
  ];

  viewing: Licencia | null = null;
  editing: Licencia | null = null;
  formOpen = false;

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  ngOnInit(): void {
    this.load();
  }

  load(search?: string): void {
    this.service.getAll(search).subscribe((data) => (this.licencias = data));
  }

  onSearch(term: string): void {
    this.load(term);
  }

  onView(licencia: Licencia): void {
    this.viewing = licencia;
  }

  closeView(): void {
    this.viewing = null;
  }

  onAdd(): void {
    this.editing = null;
    this.formOpen = true;
  }

  onEdit(licencia: Licencia): void {
    this.editing = licencia;
    this.formOpen = true;
  }

  closeForm(): void {
    this.formOpen = false;
  }

  onDelete(licencia: Licencia): void {
    if (!confirm(`¿Eliminar la licencia "${licencia.licencia}"?`)) {
      return;
    }
    this.service.delete(licencia.id).subscribe(() => this.load());
  }

  onSaved(): void {
    this.formOpen = false;
    this.load();
  }
}
```

- [ ] **Step 6: Create the list template and styles**

Create `soportedesk-frontend/src/app/features/licencias/licencias-list.component.html`:

```html
<h2>Licencias Office</h2>

<app-generic-table
  [columns]="columns"
  [data]="licencias"
  [canEdit]="isAdmin"
  (searchChange)="onSearch($event)"
  (add)="onAdd()"
  (view)="onView($event)"
  (edit)="onEdit($event)"
  (delete)="onDelete($event)"
/>

<app-modal title="Detalle de licencia" [open]="viewing !== null" (closed)="closeView()">
  <ng-container *ngIf="viewing">
    <app-field label="Cantidad">{{ viewing.cantidad }}</app-field>
    <app-field label="Licencia">{{ viewing.licencia }}</app-field>
    <app-field label="Correo">{{ viewing.correo }}</app-field>
    <app-field label="Clave">{{ viewing.clave }}</app-field>
    <app-field label="Orden de Compra">{{ viewing.ordenCompra }}</app-field>
    <app-field label="Año">{{ viewing.anio }}</app-field>
  </ng-container>
</app-modal>

<app-modal
  [title]="editing ? 'Editar licencia' : 'Agregar licencia'"
  [open]="formOpen"
  (closed)="closeForm()"
>
  <app-licencia-form [licencia]="editing" (saved)="onSaved()" (cancelled)="closeForm()" />
</app-modal>
```

Create `soportedesk-frontend/src/app/features/licencias/licencias-list.component.scss`:

```scss
h2 {
  color: var(--color-green-dark);
  margin-top: 0;
}
```

- [ ] **Step 7: Register the `/licencias` route**

Modify `soportedesk-frontend/src/app/app.routes.ts`: add to the
`ShellComponent` route's `children` array:

```typescript
      {
        path: 'licencias',
        loadComponent: () =>
          import('./features/licencias/licencias-list.component').then((m) => m.LicenciasListComponent),
      },
```

- [ ] **Step 8: Run full test suite**

Run: `cd soportedesk-frontend && npm test -- --watch=false`
Expected: all specs pass.

- [ ] **Step 9: Commit**

```bash
git add soportedesk-frontend/src/app/features/licencias soportedesk-frontend/src/app/app.routes.ts
git commit -m "feat: add Licencias Office feature"
```

---

## Task 9: Claves WiFi feature

**Files:**
- Create: `soportedesk-frontend/src/app/features/wifi/wifi.model.ts`
- Create: `soportedesk-frontend/src/app/features/wifi/wifi.service.ts`
- Create: `soportedesk-frontend/src/app/features/wifi/wifi-list.component.ts`
- Create: `soportedesk-frontend/src/app/features/wifi/wifi-list.component.html`
- Create: `soportedesk-frontend/src/app/features/wifi/wifi-list.component.scss`
- Create: `soportedesk-frontend/src/app/features/wifi/wifi-form.component.ts`
- Create: `soportedesk-frontend/src/app/features/wifi/wifi-form.component.html`
- Create: `soportedesk-frontend/src/app/features/wifi/wifi-form.component.scss`
- Modify: `soportedesk-frontend/src/app/app.routes.ts`

Mirrors the Licencias list+form pattern from Task 8, with the `wifi` entity
fields from the backend (`id, ssid, clave, ubicacion, tipo, estado`).

- [ ] **Step 1: Create the Wifi model**

Create `soportedesk-frontend/src/app/features/wifi/wifi.model.ts`:

```typescript
export interface Wifi {
  id: number;
  ssid: string;
  clave: string;
  ubicacion: string;
  tipo: string;
  estado: string;
}

export type WifiRequest = Omit<Wifi, 'id'>;
```

- [ ] **Step 2: Create `WifiService`**

Create `soportedesk-frontend/src/app/features/wifi/wifi.service.ts`:

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Wifi, WifiRequest } from './wifi.model';

@Injectable({ providedIn: 'root' })
export class WifiService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/wifi`;

  getAll(search?: string): Observable<Wifi[]> {
    let params = new HttpParams();
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<Wifi[]>(this.apiUrl, { params });
  }

  getById(id: number): Observable<Wifi> {
    return this.http.get<Wifi>(`${this.apiUrl}/${id}`);
  }

  create(request: WifiRequest): Observable<Wifi> {
    return this.http.post<Wifi>(this.apiUrl, request);
  }

  update(id: number, request: WifiRequest): Observable<Wifi> {
    return this.http.put<Wifi>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
```

- [ ] **Step 3: Create `WifiFormComponent`**

Create `soportedesk-frontend/src/app/features/wifi/wifi-form.component.ts`:

```typescript
import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Wifi } from './wifi.model';
import { WifiService } from './wifi.service';

@Component({
  selector: 'app-wifi-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './wifi-form.component.html',
  styleUrl: './wifi-form.component.scss',
})
export class WifiFormComponent implements OnChanges {
  private fb = inject(FormBuilder);
  private service = inject(WifiService);

  @Input() wifi: Wifi | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  form = this.fb.nonNullable.group({
    ssid: ['', Validators.required],
    clave: ['', Validators.required],
    ubicacion: ['', Validators.required],
    tipo: ['', Validators.required],
    estado: ['Activa', Validators.required],
  });

  ngOnChanges(): void {
    if (this.wifi) {
      this.form.patchValue(this.wifi);
    } else {
      this.form.reset({ ssid: '', clave: '', ubicacion: '', tipo: '', estado: 'Activa' });
    }
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }
    const request = this.form.getRawValue();
    const obs = this.wifi
      ? this.service.update(this.wifi.id, request)
      : this.service.create(request);
    obs.subscribe(() => this.saved.emit());
  }
}
```

- [ ] **Step 4: Create the form template and styles**

Create `soportedesk-frontend/src/app/features/wifi/wifi-form.component.html`:

```html
<form [formGroup]="form" (ngSubmit)="submit()">
  <div class="field">
    <label>SSID</label>
    <input type="text" formControlName="ssid" />
  </div>
  <div class="field">
    <label>Clave</label>
    <input type="text" formControlName="clave" />
  </div>
  <div class="field">
    <label>Ubicación</label>
    <input type="text" formControlName="ubicacion" />
  </div>
  <div class="field">
    <label>Tipo</label>
    <input type="text" formControlName="tipo" />
  </div>
  <div class="field">
    <label>Estado</label>
    <select formControlName="estado">
      <option value="Activa">Activa</option>
      <option value="Inactiva">Inactiva</option>
    </select>
  </div>

  <div class="actions">
    <button type="button" class="secondary" (click)="cancelled.emit()">Cancelar</button>
    <button type="submit" [disabled]="form.invalid">Guardar</button>
  </div>
</form>
```

Create `soportedesk-frontend/src/app/features/wifi/wifi-form.component.scss`:

```scss
.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;

  label {
    font-size: 12px;
    font-weight: 600;
    color: var(--color-gray);
  }

  input, select {
    padding: 8px;
    border: 1px solid var(--color-border);
    border-radius: 4px;
  }
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;

  button {
    border: none;
    border-radius: 4px;
    padding: 8px 16px;
    font-weight: 600;
    background-color: var(--color-green);
    color: var(--color-white);

    &:disabled {
      background-color: var(--color-gray);
    }

    &.secondary {
      background-color: var(--color-gray-light);
      color: var(--color-text);
    }
  }
}
```

- [ ] **Step 5: Create `WifiListComponent`**

Create `soportedesk-frontend/src/app/features/wifi/wifi-list.component.ts`:

```typescript
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';
import { GenericTableComponent, TableColumn } from '../../shared/generic-table/generic-table.component';
import { ModalComponent } from '../../shared/modal/modal.component';
import { FieldComponent } from '../../shared/field/field.component';
import { WifiFormComponent } from './wifi-form.component';
import { Wifi } from './wifi.model';
import { WifiService } from './wifi.service';

@Component({
  selector: 'app-wifi-list',
  standalone: true,
  imports: [CommonModule, GenericTableComponent, ModalComponent, FieldComponent, WifiFormComponent],
  templateUrl: './wifi-list.component.html',
  styleUrl: './wifi-list.component.scss',
})
export class WifiListComponent implements OnInit {
  private service = inject(WifiService);
  private authService = inject(AuthService);

  items: Wifi[] = [];
  columns: TableColumn[] = [
    { key: 'ssid', label: 'SSID' },
    { key: 'clave', label: 'Clave' },
    { key: 'ubicacion', label: 'Ubicación' },
    { key: 'tipo', label: 'Tipo' },
    { key: 'estado', label: 'Estado' },
  ];

  viewing: Wifi | null = null;
  editing: Wifi | null = null;
  formOpen = false;

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  ngOnInit(): void {
    this.load();
  }

  load(search?: string): void {
    this.service.getAll(search).subscribe((data) => (this.items = data));
  }

  onSearch(term: string): void {
    this.load(term);
  }

  onView(item: Wifi): void {
    this.viewing = item;
  }

  closeView(): void {
    this.viewing = null;
  }

  onAdd(): void {
    this.editing = null;
    this.formOpen = true;
  }

  onEdit(item: Wifi): void {
    this.editing = item;
    this.formOpen = true;
  }

  closeForm(): void {
    this.formOpen = false;
  }

  onDelete(item: Wifi): void {
    if (!confirm(`¿Eliminar la red "${item.ssid}"?`)) {
      return;
    }
    this.service.delete(item.id).subscribe(() => this.load());
  }

  onSaved(): void {
    this.formOpen = false;
    this.load();
  }
}
```

- [ ] **Step 6: Create the list template and styles**

Create `soportedesk-frontend/src/app/features/wifi/wifi-list.component.html`:

```html
<h2>Claves WiFi</h2>

<app-generic-table
  [columns]="columns"
  [data]="items"
  [canEdit]="isAdmin"
  (searchChange)="onSearch($event)"
  (add)="onAdd()"
  (view)="onView($event)"
  (edit)="onEdit($event)"
  (delete)="onDelete($event)"
/>

<app-modal title="Detalle de red WiFi" [open]="viewing !== null" (closed)="closeView()">
  <ng-container *ngIf="viewing">
    <app-field label="SSID">{{ viewing.ssid }}</app-field>
    <app-field label="Clave">{{ viewing.clave }}</app-field>
    <app-field label="Ubicación">{{ viewing.ubicacion }}</app-field>
    <app-field label="Tipo">{{ viewing.tipo }}</app-field>
    <app-field label="Estado">{{ viewing.estado }}</app-field>
  </ng-container>
</app-modal>

<app-modal
  [title]="editing ? 'Editar red WiFi' : 'Agregar red WiFi'"
  [open]="formOpen"
  (closed)="closeForm()"
>
  <app-wifi-form [wifi]="editing" (saved)="onSaved()" (cancelled)="closeForm()" />
</app-modal>
```

Create `soportedesk-frontend/src/app/features/wifi/wifi-list.component.scss`:

```scss
h2 {
  color: var(--color-green-dark);
  margin-top: 0;
}
```

- [ ] **Step 7: Register the `/wifi` route**

Modify `soportedesk-frontend/src/app/app.routes.ts`: add to the
`ShellComponent` route's `children` array:

```typescript
      {
        path: 'wifi',
        loadComponent: () =>
          import('./features/wifi/wifi-list.component').then((m) => m.WifiListComponent),
      },
```

- [ ] **Step 8: Run full test suite**

Run: `cd soportedesk-frontend && npm test -- --watch=false`
Expected: all specs pass.

- [ ] **Step 9: Commit**

```bash
git add soportedesk-frontend/src/app/features/wifi soportedesk-frontend/src/app/app.routes.ts
git commit -m "feat: add Claves WiFi feature"
```

---

## Task 10: Equipos Asignados feature

**Files:**
- Create: `soportedesk-frontend/src/app/features/equipos/equipo.model.ts`
- Create: `soportedesk-frontend/src/app/features/equipos/equipo.service.ts`
- Create: `soportedesk-frontend/src/app/features/equipos/equipos-list.component.ts`
- Create: `soportedesk-frontend/src/app/features/equipos/equipos-list.component.html`
- Create: `soportedesk-frontend/src/app/features/equipos/equipos-list.component.scss`
- Create: `soportedesk-frontend/src/app/features/equipos/equipo-form.component.ts`
- Create: `soportedesk-frontend/src/app/features/equipos/equipo-form.component.html`
- Create: `soportedesk-frontend/src/app/features/equipos/equipo-form.component.scss`
- Modify: `soportedesk-frontend/src/app/app.routes.ts`

Mirrors the Licencias list+form pattern from Task 8, with the `equipos`
entity fields from the backend
(`id, codigo, tipo, marca, modelo, usuario, area, asignado, estado`), where
`asignado` is an ISO date string (`yyyy-MM-dd`).

- [ ] **Step 1: Create the Equipo model**

Create `soportedesk-frontend/src/app/features/equipos/equipo.model.ts`:

```typescript
export interface Equipo {
  id: number;
  codigo: string;
  tipo: string;
  marca: string;
  modelo: string;
  usuario: string;
  area: string;
  asignado: string;
  estado: string;
}

export type EquipoRequest = Omit<Equipo, 'id'>;
```

- [ ] **Step 2: Create `EquipoService`**

Create `soportedesk-frontend/src/app/features/equipos/equipo.service.ts`:

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Equipo, EquipoRequest } from './equipo.model';

@Injectable({ providedIn: 'root' })
export class EquipoService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/equipos`;

  getAll(search?: string): Observable<Equipo[]> {
    let params = new HttpParams();
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<Equipo[]>(this.apiUrl, { params });
  }

  getById(id: number): Observable<Equipo> {
    return this.http.get<Equipo>(`${this.apiUrl}/${id}`);
  }

  create(request: EquipoRequest): Observable<Equipo> {
    return this.http.post<Equipo>(this.apiUrl, request);
  }

  update(id: number, request: EquipoRequest): Observable<Equipo> {
    return this.http.put<Equipo>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
```

- [ ] **Step 3: Create `EquipoFormComponent`**

Create `soportedesk-frontend/src/app/features/equipos/equipo-form.component.ts`:

```typescript
import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Equipo } from './equipo.model';
import { EquipoService } from './equipo.service';

@Component({
  selector: 'app-equipo-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './equipo-form.component.html',
  styleUrl: './equipo-form.component.scss',
})
export class EquipoFormComponent implements OnChanges {
  private fb = inject(FormBuilder);
  private service = inject(EquipoService);

  @Input() equipo: Equipo | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  form = this.fb.nonNullable.group({
    codigo: ['', Validators.required],
    tipo: ['', Validators.required],
    marca: ['', Validators.required],
    modelo: ['', Validators.required],
    usuario: ['', Validators.required],
    area: ['', Validators.required],
    asignado: ['', Validators.required],
    estado: ['Activo', Validators.required],
  });

  ngOnChanges(): void {
    if (this.equipo) {
      this.form.patchValue(this.equipo);
    } else {
      this.form.reset({
        codigo: '',
        tipo: '',
        marca: '',
        modelo: '',
        usuario: '',
        area: '',
        asignado: '',
        estado: 'Activo',
      });
    }
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }
    const request = this.form.getRawValue();
    const obs = this.equipo
      ? this.service.update(this.equipo.id, request)
      : this.service.create(request);
    obs.subscribe(() => this.saved.emit());
  }
}
```

- [ ] **Step 4: Create the form template and styles**

Create `soportedesk-frontend/src/app/features/equipos/equipo-form.component.html`:

```html
<form [formGroup]="form" (ngSubmit)="submit()">
  <div class="field">
    <label>Código</label>
    <input type="text" formControlName="codigo" />
  </div>
  <div class="field">
    <label>Tipo</label>
    <input type="text" formControlName="tipo" />
  </div>
  <div class="field">
    <label>Marca</label>
    <input type="text" formControlName="marca" />
  </div>
  <div class="field">
    <label>Modelo</label>
    <input type="text" formControlName="modelo" />
  </div>
  <div class="field">
    <label>Usuario</label>
    <input type="text" formControlName="usuario" />
  </div>
  <div class="field">
    <label>Área</label>
    <input type="text" formControlName="area" />
  </div>
  <div class="field">
    <label>Fecha de asignación</label>
    <input type="date" formControlName="asignado" />
  </div>
  <div class="field">
    <label>Estado</label>
    <select formControlName="estado">
      <option value="Activo">Activo</option>
      <option value="En reparación">En reparación</option>
      <option value="De baja">De baja</option>
    </select>
  </div>

  <div class="actions">
    <button type="button" class="secondary" (click)="cancelled.emit()">Cancelar</button>
    <button type="submit" [disabled]="form.invalid">Guardar</button>
  </div>
</form>
```

Create `soportedesk-frontend/src/app/features/equipos/equipo-form.component.scss`:

```scss
.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;

  label {
    font-size: 12px;
    font-weight: 600;
    color: var(--color-gray);
  }

  input, select {
    padding: 8px;
    border: 1px solid var(--color-border);
    border-radius: 4px;
  }
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;

  button {
    border: none;
    border-radius: 4px;
    padding: 8px 16px;
    font-weight: 600;
    background-color: var(--color-green);
    color: var(--color-white);

    &:disabled {
      background-color: var(--color-gray);
    }

    &.secondary {
      background-color: var(--color-gray-light);
      color: var(--color-text);
    }
  }
}
```

- [ ] **Step 5: Create `EquiposListComponent`**

Create `soportedesk-frontend/src/app/features/equipos/equipos-list.component.ts`:

```typescript
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';
import { GenericTableComponent, TableColumn } from '../../shared/generic-table/generic-table.component';
import { ModalComponent } from '../../shared/modal/modal.component';
import { FieldComponent } from '../../shared/field/field.component';
import { EquipoFormComponent } from './equipo-form.component';
import { Equipo } from './equipo.model';
import { EquipoService } from './equipo.service';

@Component({
  selector: 'app-equipos-list',
  standalone: true,
  imports: [CommonModule, GenericTableComponent, ModalComponent, FieldComponent, EquipoFormComponent],
  templateUrl: './equipos-list.component.html',
  styleUrl: './equipos-list.component.scss',
})
export class EquiposListComponent implements OnInit {
  private service = inject(EquipoService);
  private authService = inject(AuthService);

  items: Equipo[] = [];
  columns: TableColumn[] = [
    { key: 'codigo', label: 'Código' },
    { key: 'tipo', label: 'Tipo' },
    { key: 'marca', label: 'Marca' },
    { key: 'modelo', label: 'Modelo' },
    { key: 'usuario', label: 'Usuario' },
    { key: 'area', label: 'Área' },
    { key: 'asignado', label: 'Asignado' },
    { key: 'estado', label: 'Estado' },
  ];

  viewing: Equipo | null = null;
  editing: Equipo | null = null;
  formOpen = false;

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  ngOnInit(): void {
    this.load();
  }

  load(search?: string): void {
    this.service.getAll(search).subscribe((data) => (this.items = data));
  }

  onSearch(term: string): void {
    this.load(term);
  }

  onView(item: Equipo): void {
    this.viewing = item;
  }

  closeView(): void {
    this.viewing = null;
  }

  onAdd(): void {
    this.editing = null;
    this.formOpen = true;
  }

  onEdit(item: Equipo): void {
    this.editing = item;
    this.formOpen = true;
  }

  closeForm(): void {
    this.formOpen = false;
  }

  onDelete(item: Equipo): void {
    if (!confirm(`¿Eliminar el equipo "${item.codigo}"?`)) {
      return;
    }
    this.service.delete(item.id).subscribe(() => this.load());
  }

  onSaved(): void {
    this.formOpen = false;
    this.load();
  }
}
```

- [ ] **Step 6: Create the list template and styles**

Create `soportedesk-frontend/src/app/features/equipos/equipos-list.component.html`:

```html
<h2>Equipos Asignados</h2>

<app-generic-table
  [columns]="columns"
  [data]="items"
  [canEdit]="isAdmin"
  (searchChange)="onSearch($event)"
  (add)="onAdd()"
  (view)="onView($event)"
  (edit)="onEdit($event)"
  (delete)="onDelete($event)"
/>

<app-modal title="Detalle de equipo" [open]="viewing !== null" (closed)="closeView()">
  <ng-container *ngIf="viewing">
    <app-field label="Código">{{ viewing.codigo }}</app-field>
    <app-field label="Tipo">{{ viewing.tipo }}</app-field>
    <app-field label="Marca">{{ viewing.marca }}</app-field>
    <app-field label="Modelo">{{ viewing.modelo }}</app-field>
    <app-field label="Usuario">{{ viewing.usuario }}</app-field>
    <app-field label="Área">{{ viewing.area }}</app-field>
    <app-field label="Fecha de asignación">{{ viewing.asignado }}</app-field>
    <app-field label="Estado">{{ viewing.estado }}</app-field>
  </ng-container>
</app-modal>

<app-modal
  [title]="editing ? 'Editar equipo' : 'Agregar equipo'"
  [open]="formOpen"
  (closed)="closeForm()"
>
  <app-equipo-form [equipo]="editing" (saved)="onSaved()" (cancelled)="closeForm()" />
</app-modal>
```

Create `soportedesk-frontend/src/app/features/equipos/equipos-list.component.scss`:

```scss
h2 {
  color: var(--color-green-dark);
  margin-top: 0;
}
```

- [ ] **Step 7: Register the `/equipos` route**

Modify `soportedesk-frontend/src/app/app.routes.ts`: add to the
`ShellComponent` route's `children` array:

```typescript
      {
        path: 'equipos',
        loadComponent: () =>
          import('./features/equipos/equipos-list.component').then((m) => m.EquiposListComponent),
      },
```

- [ ] **Step 8: Run full test suite**

Run: `cd soportedesk-frontend && npm test -- --watch=false`
Expected: all specs pass.

- [ ] **Step 9: Commit**

```bash
git add soportedesk-frontend/src/app/features/equipos soportedesk-frontend/src/app/app.routes.ts
git commit -m "feat: add Equipos Asignados feature"
```

---

## Task 11: VPN feature

**Files:**
- Create: `soportedesk-frontend/src/app/features/vpn/vpn.model.ts`
- Create: `soportedesk-frontend/src/app/features/vpn/vpn.service.ts`
- Create: `soportedesk-frontend/src/app/features/vpn/vpn-list.component.ts`
- Create: `soportedesk-frontend/src/app/features/vpn/vpn-list.component.html`
- Create: `soportedesk-frontend/src/app/features/vpn/vpn-list.component.scss`
- Create: `soportedesk-frontend/src/app/features/vpn/vpn-form.component.ts`
- Create: `soportedesk-frontend/src/app/features/vpn/vpn-form.component.html`
- Create: `soportedesk-frontend/src/app/features/vpn/vpn-form.component.scss`
- Modify: `soportedesk-frontend/src/app/app.routes.ts`

Mirrors the Equipos pattern (Task 10), with fields
`id, usuario, nombre, tipo, ipAsignada, vence, estado`. The list additionally
shows an "Vencimiento" column rendered with `VencimientoBadgeComponent` bound
to `vence`, via `GenericTableComponent`'s `extraColumnLabel` +
`#extraCell` content projection (see Task 5).

- [ ] **Step 1: Create the Vpn model**

Create `soportedesk-frontend/src/app/features/vpn/vpn.model.ts`:

```typescript
export interface Vpn {
  id: number;
  usuario: string;
  nombre: string;
  tipo: string;
  ipAsignada: string;
  vence: string | null;
  estado: string;
}

export type VpnRequest = Omit<Vpn, 'id'>;
```

- [ ] **Step 2: Create `VpnService`**

Create `soportedesk-frontend/src/app/features/vpn/vpn.service.ts`:

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Vpn, VpnRequest } from './vpn.model';

@Injectable({ providedIn: 'root' })
export class VpnService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/vpn`;

  getAll(search?: string): Observable<Vpn[]> {
    let params = new HttpParams();
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<Vpn[]>(this.apiUrl, { params });
  }

  getById(id: number): Observable<Vpn> {
    return this.http.get<Vpn>(`${this.apiUrl}/${id}`);
  }

  create(request: VpnRequest): Observable<Vpn> {
    return this.http.post<Vpn>(this.apiUrl, request);
  }

  update(id: number, request: VpnRequest): Observable<Vpn> {
    return this.http.put<Vpn>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
```

- [ ] **Step 3: Create `VpnFormComponent`**

Create `soportedesk-frontend/src/app/features/vpn/vpn-form.component.ts`:

```typescript
import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Vpn } from './vpn.model';
import { VpnService } from './vpn.service';

@Component({
  selector: 'app-vpn-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './vpn-form.component.html',
  styleUrl: './vpn-form.component.scss',
})
export class VpnFormComponent implements OnChanges {
  private fb = inject(FormBuilder);
  private service = inject(VpnService);

  @Input() vpn: Vpn | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  form = this.fb.nonNullable.group({
    usuario: ['', Validators.required],
    nombre: ['', Validators.required],
    tipo: ['', Validators.required],
    ipAsignada: ['', Validators.required],
    vence: [''],
    estado: ['Activo', Validators.required],
  });

  ngOnChanges(): void {
    if (this.vpn) {
      this.form.patchValue({
        usuario: this.vpn.usuario,
        nombre: this.vpn.nombre,
        tipo: this.vpn.tipo,
        ipAsignada: this.vpn.ipAsignada,
        vence: this.vpn.vence ?? '',
        estado: this.vpn.estado,
      });
    } else {
      this.form.reset({
        usuario: '',
        nombre: '',
        tipo: '',
        ipAsignada: '',
        vence: '',
        estado: 'Activo',
      });
    }
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }
    const raw = this.form.getRawValue();
    const request = { ...raw, vence: raw.vence || null };
    const obs = this.vpn
      ? this.service.update(this.vpn.id, request)
      : this.service.create(request);
    obs.subscribe(() => this.saved.emit());
  }
}
```

- [ ] **Step 4: Create the form template and styles**

Create `soportedesk-frontend/src/app/features/vpn/vpn-form.component.html`:

```html
<form [formGroup]="form" (ngSubmit)="submit()">
  <div class="field">
    <label>Usuario</label>
    <input type="text" formControlName="usuario" />
  </div>
  <div class="field">
    <label>Nombre</label>
    <input type="text" formControlName="nombre" />
  </div>
  <div class="field">
    <label>Tipo</label>
    <input type="text" formControlName="tipo" />
  </div>
  <div class="field">
    <label>IP asignada</label>
    <input type="text" formControlName="ipAsignada" />
  </div>
  <div class="field">
    <label>Vence</label>
    <input type="date" formControlName="vence" />
  </div>
  <div class="field">
    <label>Estado</label>
    <select formControlName="estado">
      <option value="Activo">Activo</option>
      <option value="Inactivo">Inactivo</option>
    </select>
  </div>

  <div class="actions">
    <button type="button" class="secondary" (click)="cancelled.emit()">Cancelar</button>
    <button type="submit" [disabled]="form.invalid">Guardar</button>
  </div>
</form>
```

Create `soportedesk-frontend/src/app/features/vpn/vpn-form.component.scss`:

```scss
.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;

  label {
    font-size: 12px;
    font-weight: 600;
    color: var(--color-gray);
  }

  input, select {
    padding: 8px;
    border: 1px solid var(--color-border);
    border-radius: 4px;
  }
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;

  button {
    border: none;
    border-radius: 4px;
    padding: 8px 16px;
    font-weight: 600;
    background-color: var(--color-green);
    color: var(--color-white);

    &:disabled {
      background-color: var(--color-gray);
    }

    &.secondary {
      background-color: var(--color-gray-light);
      color: var(--color-text);
    }
  }
}
```

- [ ] **Step 5: Create `VpnListComponent`**

Create `soportedesk-frontend/src/app/features/vpn/vpn-list.component.ts`:

```typescript
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';
import { GenericTableComponent, TableColumn } from '../../shared/generic-table/generic-table.component';
import { ModalComponent } from '../../shared/modal/modal.component';
import { FieldComponent } from '../../shared/field/field.component';
import { VencimientoBadgeComponent } from '../../shared/vencimiento-badge/vencimiento-badge.component';
import { VpnFormComponent } from './vpn-form.component';
import { Vpn } from './vpn.model';
import { VpnService } from './vpn.service';

@Component({
  selector: 'app-vpn-list',
  standalone: true,
  imports: [
    CommonModule,
    GenericTableComponent,
    ModalComponent,
    FieldComponent,
    VencimientoBadgeComponent,
    VpnFormComponent,
  ],
  templateUrl: './vpn-list.component.html',
  styleUrl: './vpn-list.component.scss',
})
export class VpnListComponent implements OnInit {
  private service = inject(VpnService);
  private authService = inject(AuthService);

  items: Vpn[] = [];
  columns: TableColumn[] = [
    { key: 'usuario', label: 'Usuario' },
    { key: 'nombre', label: 'Nombre' },
    { key: 'tipo', label: 'Tipo' },
    { key: 'ipAsignada', label: 'IP asignada' },
    { key: 'vence', label: 'Vence' },
    { key: 'estado', label: 'Estado' },
  ];

  viewing: Vpn | null = null;
  editing: Vpn | null = null;
  formOpen = false;

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  ngOnInit(): void {
    this.load();
  }

  load(search?: string): void {
    this.service.getAll(search).subscribe((data) => (this.items = data));
  }

  onSearch(term: string): void {
    this.load(term);
  }

  onView(item: Vpn): void {
    this.viewing = item;
  }

  closeView(): void {
    this.viewing = null;
  }

  onAdd(): void {
    this.editing = null;
    this.formOpen = true;
  }

  onEdit(item: Vpn): void {
    this.editing = item;
    this.formOpen = true;
  }

  closeForm(): void {
    this.formOpen = false;
  }

  onDelete(item: Vpn): void {
    if (!confirm(`¿Eliminar el registro VPN de "${item.usuario}"?`)) {
      return;
    }
    this.service.delete(item.id).subscribe(() => this.load());
  }

  onSaved(): void {
    this.formOpen = false;
    this.load();
  }
}
```

- [ ] **Step 6: Create the list template and styles**

Create `soportedesk-frontend/src/app/features/vpn/vpn-list.component.html`:

```html
<h2>VPN</h2>

<app-generic-table
  [columns]="columns"
  [data]="items"
  [canEdit]="isAdmin"
  extraColumnLabel="Vencimiento"
  (searchChange)="onSearch($event)"
  (add)="onAdd()"
  (view)="onView($event)"
  (edit)="onEdit($event)"
  (delete)="onDelete($event)"
>
  <ng-template #extraCell let-row>
    <app-vencimiento-badge [fecha]="row.vence" />
  </ng-template>
</app-generic-table>

<app-modal title="Detalle VPN" [open]="viewing !== null" (closed)="closeView()">
  <ng-container *ngIf="viewing">
    <app-field label="Usuario">{{ viewing.usuario }}</app-field>
    <app-field label="Nombre">{{ viewing.nombre }}</app-field>
    <app-field label="Tipo">{{ viewing.tipo }}</app-field>
    <app-field label="IP asignada">{{ viewing.ipAsignada }}</app-field>
    <app-field label="Vence">{{ viewing.vence }}</app-field>
    <app-field label="Estado">{{ viewing.estado }}</app-field>
  </ng-container>
</app-modal>

<app-modal
  [title]="editing ? 'Editar VPN' : 'Agregar VPN'"
  [open]="formOpen"
  (closed)="closeForm()"
>
  <app-vpn-form [vpn]="editing" (saved)="onSaved()" (cancelled)="closeForm()" />
</app-modal>
```

Create `soportedesk-frontend/src/app/features/vpn/vpn-list.component.scss`:

```scss
h2 {
  color: var(--color-green-dark);
  margin-top: 0;
}
```

- [ ] **Step 7: Register the `/vpn` route**

Modify `soportedesk-frontend/src/app/app.routes.ts`: add to the
`ShellComponent` route's `children` array:

```typescript
      {
        path: 'vpn',
        loadComponent: () =>
          import('./features/vpn/vpn-list.component').then((m) => m.VpnListComponent),
      },
```

- [ ] **Step 8: Run full test suite**

Run: `cd soportedesk-frontend && npm test -- --watch=false`
Expected: all specs pass.

- [ ] **Step 9: Commit**

```bash
git add soportedesk-frontend/src/app/features/vpn soportedesk-frontend/src/app/app.routes.ts
git commit -m "feat: add VPN feature with vencimiento badge"
```

---

## Task 12: Correos institucionales feature

**Files:**
- Create: `soportedesk-frontend/src/app/features/correos/correo.model.ts`
- Create: `soportedesk-frontend/src/app/features/correos/correo.service.ts`
- Create: `soportedesk-frontend/src/app/features/correos/correos-list.component.ts`
- Create: `soportedesk-frontend/src/app/features/correos/correos-list.component.html`
- Create: `soportedesk-frontend/src/app/features/correos/correos-list.component.scss`
- Create: `soportedesk-frontend/src/app/features/correos/correo-form.component.ts`
- Create: `soportedesk-frontend/src/app/features/correos/correo-form.component.html`
- Create: `soportedesk-frontend/src/app/features/correos/correo-form.component.scss`
- Modify: `soportedesk-frontend/src/app/app.routes.ts`

Backend entity has 4 catalog FKs (`sede`, `dependencia`, `subdependencia`,
`tipoContrato`) returned as nested objects, plus `fechaFinContrato` and
`creado`. The form uses `UbicacionSelectComponent` (Task 6) for the cascading
selects, and the list shows a "Vencimiento" column via
`VencimientoBadgeComponent` bound to `fechaFinContrato` (same pattern as
Task 11).

- [ ] **Step 1: Create the Correo model**

Create `soportedesk-frontend/src/app/features/correos/correo.model.ts`:

```typescript
import { Sede, Dependencia, Subdependencia, TipoContrato } from '../../core/models/catalogo.model';

export interface Correo {
  id: number;
  usuario: string;
  nombre: string;
  correo: string;
  estado: string;
  sede: Sede;
  dependencia: Dependencia;
  subdependencia: Subdependencia;
  tipoContrato: TipoContrato;
  fechaFinContrato: string | null;
  creado: string;
}

export interface CorreoRequest {
  usuario: string;
  nombre: string;
  correo: string;
  estado: string;
  sedeId: number;
  dependenciaId: number;
  subdependenciaId: number;
  tipoContratoId: number;
  fechaFinContrato: string | null;
  creado: string;
}
```

- [ ] **Step 2: Create `CorreoService`**

Create `soportedesk-frontend/src/app/features/correos/correo.service.ts`:

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Correo, CorreoRequest } from './correo.model';

@Injectable({ providedIn: 'root' })
export class CorreoService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/correos`;

  getAll(search?: string): Observable<Correo[]> {
    let params = new HttpParams();
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<Correo[]>(this.apiUrl, { params });
  }

  getById(id: number): Observable<Correo> {
    return this.http.get<Correo>(`${this.apiUrl}/${id}`);
  }

  create(request: CorreoRequest): Observable<Correo> {
    return this.http.post<Correo>(this.apiUrl, request);
  }

  update(id: number, request: CorreoRequest): Observable<Correo> {
    return this.http.put<Correo>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
```

- [ ] **Step 3: Create `CorreoFormComponent`**

Create `soportedesk-frontend/src/app/features/correos/correo-form.component.ts`:

```typescript
import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UbicacionSelectComponent } from '../../shared/ubicacion-select/ubicacion-select.component';
import { Correo } from './correo.model';
import { CorreoService } from './correo.service';

@Component({
  selector: 'app-correo-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, UbicacionSelectComponent],
  templateUrl: './correo-form.component.html',
  styleUrl: './correo-form.component.scss',
})
export class CorreoFormComponent implements OnChanges {
  private fb = inject(FormBuilder);
  private service = inject(CorreoService);

  @Input() correo: Correo | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  form = this.fb.nonNullable.group({
    usuario: ['', Validators.required],
    nombre: ['', Validators.required],
    correo: ['', [Validators.required, Validators.email]],
    estado: ['Activo', Validators.required],
    fechaFinContrato: [''],
    creado: ['', Validators.required],
  });

  sedeId: number | null = null;
  dependenciaId: number | null = null;
  subdependenciaId: number | null = null;
  tipoContratoId: number | null = null;

  ngOnChanges(): void {
    if (this.correo) {
      this.form.patchValue({
        usuario: this.correo.usuario,
        nombre: this.correo.nombre,
        correo: this.correo.correo,
        estado: this.correo.estado,
        fechaFinContrato: this.correo.fechaFinContrato ?? '',
        creado: this.correo.creado,
      });
      this.sedeId = this.correo.sede.id;
      this.dependenciaId = this.correo.dependencia.id;
      this.subdependenciaId = this.correo.subdependencia.id;
      this.tipoContratoId = this.correo.tipoContrato.id;
    } else {
      this.form.reset({
        usuario: '',
        nombre: '',
        correo: '',
        estado: 'Activo',
        fechaFinContrato: '',
        creado: '',
      });
      this.sedeId = null;
      this.dependenciaId = null;
      this.subdependenciaId = null;
      this.tipoContratoId = null;
    }
  }

  submit(): void {
    if (
      this.form.invalid ||
      this.sedeId === null ||
      this.dependenciaId === null ||
      this.subdependenciaId === null ||
      this.tipoContratoId === null
    ) {
      return;
    }
    const raw = this.form.getRawValue();
    const request = {
      ...raw,
      fechaFinContrato: raw.fechaFinContrato || null,
      sedeId: this.sedeId,
      dependenciaId: this.dependenciaId,
      subdependenciaId: this.subdependenciaId,
      tipoContratoId: this.tipoContratoId,
    };
    const obs = this.correo
      ? this.service.update(this.correo.id, request)
      : this.service.create(request);
    obs.subscribe(() => this.saved.emit());
  }
}
```

- [ ] **Step 4: Create the form template and styles**

Create `soportedesk-frontend/src/app/features/correos/correo-form.component.html`:

```html
<form [formGroup]="form" (ngSubmit)="submit()">
  <div class="field">
    <label>Usuario</label>
    <input type="text" formControlName="usuario" />
  </div>
  <div class="field">
    <label>Nombre</label>
    <input type="text" formControlName="nombre" />
  </div>
  <div class="field">
    <label>Correo</label>
    <input type="email" formControlName="correo" />
  </div>
  <div class="field">
    <label>Estado</label>
    <select formControlName="estado">
      <option value="Activo">Activo</option>
      <option value="Inactivo">Inactivo</option>
    </select>
  </div>
  <div class="field">
    <label>Fecha de creación</label>
    <input type="date" formControlName="creado" />
  </div>
  <div class="field">
    <label>Fin de contrato</label>
    <input type="date" formControlName="fechaFinContrato" />
  </div>

  <app-ubicacion-select
    [(sedeId)]="sedeId"
    [(dependenciaId)]="dependenciaId"
    [(subdependenciaId)]="subdependenciaId"
    [(tipoContratoId)]="tipoContratoId"
  />

  <div class="actions">
    <button type="button" class="secondary" (click)="cancelled.emit()">Cancelar</button>
    <button
      type="submit"
      [disabled]="form.invalid || !sedeId || !dependenciaId || !subdependenciaId || !tipoContratoId"
    >
      Guardar
    </button>
  </div>
</form>
```

Create `soportedesk-frontend/src/app/features/correos/correo-form.component.scss`:

```scss
.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;

  label {
    font-size: 12px;
    font-weight: 600;
    color: var(--color-gray);
  }

  input, select {
    padding: 8px;
    border: 1px solid var(--color-border);
    border-radius: 4px;
  }
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;

  button {
    border: none;
    border-radius: 4px;
    padding: 8px 16px;
    font-weight: 600;
    background-color: var(--color-green);
    color: var(--color-white);

    &:disabled {
      background-color: var(--color-gray);
    }

    &.secondary {
      background-color: var(--color-gray-light);
      color: var(--color-text);
    }
  }
}
```

- [ ] **Step 5: Create `CorreosListComponent`**

Create `soportedesk-frontend/src/app/features/correos/correos-list.component.ts`:

```typescript
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';
import { GenericTableComponent, TableColumn } from '../../shared/generic-table/generic-table.component';
import { ModalComponent } from '../../shared/modal/modal.component';
import { FieldComponent } from '../../shared/field/field.component';
import { VencimientoBadgeComponent } from '../../shared/vencimiento-badge/vencimiento-badge.component';
import { CorreoFormComponent } from './correo-form.component';
import { Correo } from './correo.model';
import { CorreoService } from './correo.service';

@Component({
  selector: 'app-correos-list',
  standalone: true,
  imports: [
    CommonModule,
    GenericTableComponent,
    ModalComponent,
    FieldComponent,
    VencimientoBadgeComponent,
    CorreoFormComponent,
  ],
  templateUrl: './correos-list.component.html',
  styleUrl: './correos-list.component.scss',
})
export class CorreosListComponent implements OnInit {
  private service = inject(CorreoService);
  private authService = inject(AuthService);

  items: Correo[] = [];
  columns: TableColumn[] = [
    { key: 'usuario', label: 'Usuario' },
    { key: 'nombre', label: 'Nombre' },
    { key: 'correo', label: 'Correo' },
    { key: 'sede.nombre', label: 'Sede' },
    { key: 'dependencia.nombre', label: 'Dependencia' },
    { key: 'subdependencia.nombre', label: 'Subdependencia' },
    { key: 'tipoContrato.nombre', label: 'Tipo de contrato' },
    { key: 'fechaFinContrato', label: 'Fin de contrato' },
    { key: 'estado', label: 'Estado' },
  ];

  viewing: Correo | null = null;
  editing: Correo | null = null;
  formOpen = false;

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  ngOnInit(): void {
    this.load();
  }

  load(search?: string): void {
    this.service.getAll(search).subscribe((data) => (this.items = data));
  }

  onSearch(term: string): void {
    this.load(term);
  }

  onView(item: Correo): void {
    this.viewing = item;
  }

  closeView(): void {
    this.viewing = null;
  }

  onAdd(): void {
    this.editing = null;
    this.formOpen = true;
  }

  onEdit(item: Correo): void {
    this.editing = item;
    this.formOpen = true;
  }

  closeForm(): void {
    this.formOpen = false;
  }

  onDelete(item: Correo): void {
    if (!confirm(`¿Eliminar el correo de "${item.nombre}"?`)) {
      return;
    }
    this.service.delete(item.id).subscribe(() => this.load());
  }

  onSaved(): void {
    this.formOpen = false;
    this.load();
  }
}
```

- [ ] **Step 6: Create the list template and styles**

Create `soportedesk-frontend/src/app/features/correos/correos-list.component.html`:

```html
<h2>Correos Institucionales</h2>

<app-generic-table
  [columns]="columns"
  [data]="items"
  [canEdit]="isAdmin"
  extraColumnLabel="Vencimiento"
  (searchChange)="onSearch($event)"
  (add)="onAdd()"
  (view)="onView($event)"
  (edit)="onEdit($event)"
  (delete)="onDelete($event)"
>
  <ng-template #extraCell let-row>
    <app-vencimiento-badge [fecha]="row.fechaFinContrato" />
  </ng-template>
</app-generic-table>

<app-modal title="Detalle de correo" [open]="viewing !== null" (closed)="closeView()">
  <ng-container *ngIf="viewing">
    <app-field label="Usuario">{{ viewing.usuario }}</app-field>
    <app-field label="Nombre">{{ viewing.nombre }}</app-field>
    <app-field label="Correo">{{ viewing.correo }}</app-field>
    <app-field label="Sede">{{ viewing.sede.nombre }}</app-field>
    <app-field label="Dependencia">{{ viewing.dependencia.nombre }}</app-field>
    <app-field label="Subdependencia">{{ viewing.subdependencia.nombre }}</app-field>
    <app-field label="Tipo de contrato">{{ viewing.tipoContrato.nombre }}</app-field>
    <app-field label="Fin de contrato">{{ viewing.fechaFinContrato }}</app-field>
    <app-field label="Creado">{{ viewing.creado }}</app-field>
    <app-field label="Estado">{{ viewing.estado }}</app-field>
  </ng-container>
</app-modal>

<app-modal
  [title]="editing ? 'Editar correo' : 'Agregar correo'"
  [open]="formOpen"
  (closed)="closeForm()"
>
  <app-correo-form [correo]="editing" (saved)="onSaved()" (cancelled)="closeForm()" />
</app-modal>
```

Create `soportedesk-frontend/src/app/features/correos/correos-list.component.scss`:

```scss
h2 {
  color: var(--color-green-dark);
  margin-top: 0;
}
```

- [ ] **Step 7: Register the `/correos` route**

Modify `soportedesk-frontend/src/app/app.routes.ts`: add to the
`ShellComponent` route's `children` array:

```typescript
      {
        path: 'correos',
        loadComponent: () =>
          import('./features/correos/correos-list.component').then((m) => m.CorreosListComponent),
      },
```

- [ ] **Step 8: Run full test suite**

Run: `cd soportedesk-frontend && npm test -- --watch=false`
Expected: all specs pass.

- [ ] **Step 9: Commit**

```bash
git add soportedesk-frontend/src/app/features/correos soportedesk-frontend/src/app/app.routes.ts
git commit -m "feat: add Correos Institucionales feature"
```

---

## Task 13: Usuarios de Red/AD feature

**Files:**
- Create: `soportedesk-frontend/src/app/features/usuarios-red/usuario-red.model.ts`
- Create: `soportedesk-frontend/src/app/features/usuarios-red/usuario-red.service.ts`
- Create: `soportedesk-frontend/src/app/features/usuarios-red/usuarios-red-list.component.ts`
- Create: `soportedesk-frontend/src/app/features/usuarios-red/usuarios-red-list.component.html`
- Create: `soportedesk-frontend/src/app/features/usuarios-red/usuarios-red-list.component.scss`
- Create: `soportedesk-frontend/src/app/features/usuarios-red/usuario-red-form.component.ts`
- Create: `soportedesk-frontend/src/app/features/usuarios-red/usuario-red-form.component.html`
- Create: `soportedesk-frontend/src/app/features/usuarios-red/usuario-red-form.component.scss`
- Modify: `soportedesk-frontend/src/app/app.routes.ts`

Mirrors the Correos pattern (Task 12) with the `usuarios_red` entity fields
(`id, usuario, nombre, grupo, ultimoLogin, estado` + 4 catalog FKs +
`fechaFinContrato`). `ultimoLogin` is a read-only `LocalDateTime` from the
backend (displayed, not editable in the form). The list shows a
"Vencimiento" column via `VencimientoBadgeComponent` bound to
`fechaFinContrato`.

- [ ] **Step 1: Create the UsuarioRed model**

Create `soportedesk-frontend/src/app/features/usuarios-red/usuario-red.model.ts`:

```typescript
import { Sede, Dependencia, Subdependencia, TipoContrato } from '../../core/models/catalogo.model';

export interface UsuarioRed {
  id: number;
  usuario: string;
  nombre: string;
  grupo: string;
  ultimoLogin: string | null;
  estado: string;
  sede: Sede;
  dependencia: Dependencia;
  subdependencia: Subdependencia;
  tipoContrato: TipoContrato;
  fechaFinContrato: string | null;
}

export interface UsuarioRedRequest {
  usuario: string;
  nombre: string;
  grupo: string;
  estado: string;
  sedeId: number;
  dependenciaId: number;
  subdependenciaId: number;
  tipoContratoId: number;
  fechaFinContrato: string | null;
}
```

- [ ] **Step 2: Create `UsuarioRedService`**

Create `soportedesk-frontend/src/app/features/usuarios-red/usuario-red.service.ts`:

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UsuarioRed, UsuarioRedRequest } from './usuario-red.model';

@Injectable({ providedIn: 'root' })
export class UsuarioRedService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/usuarios-red`;

  getAll(search?: string): Observable<UsuarioRed[]> {
    let params = new HttpParams();
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<UsuarioRed[]>(this.apiUrl, { params });
  }

  getById(id: number): Observable<UsuarioRed> {
    return this.http.get<UsuarioRed>(`${this.apiUrl}/${id}`);
  }

  create(request: UsuarioRedRequest): Observable<UsuarioRed> {
    return this.http.post<UsuarioRed>(this.apiUrl, request);
  }

  update(id: number, request: UsuarioRedRequest): Observable<UsuarioRed> {
    return this.http.put<UsuarioRed>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
```

- [ ] **Step 3: Create `UsuarioRedFormComponent`**

Create `soportedesk-frontend/src/app/features/usuarios-red/usuario-red-form.component.ts`:

```typescript
import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UbicacionSelectComponent } from '../../shared/ubicacion-select/ubicacion-select.component';
import { UsuarioRed } from './usuario-red.model';
import { UsuarioRedService } from './usuario-red.service';

@Component({
  selector: 'app-usuario-red-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, UbicacionSelectComponent],
  templateUrl: './usuario-red-form.component.html',
  styleUrl: './usuario-red-form.component.scss',
})
export class UsuarioRedFormComponent implements OnChanges {
  private fb = inject(FormBuilder);
  private service = inject(UsuarioRedService);

  @Input() usuarioRed: UsuarioRed | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  form = this.fb.nonNullable.group({
    usuario: ['', Validators.required],
    nombre: ['', Validators.required],
    grupo: ['', Validators.required],
    estado: ['Activo', Validators.required],
    fechaFinContrato: [''],
  });

  sedeId: number | null = null;
  dependenciaId: number | null = null;
  subdependenciaId: number | null = null;
  tipoContratoId: number | null = null;

  ngOnChanges(): void {
    if (this.usuarioRed) {
      this.form.patchValue({
        usuario: this.usuarioRed.usuario,
        nombre: this.usuarioRed.nombre,
        grupo: this.usuarioRed.grupo,
        estado: this.usuarioRed.estado,
        fechaFinContrato: this.usuarioRed.fechaFinContrato ?? '',
      });
      this.sedeId = this.usuarioRed.sede.id;
      this.dependenciaId = this.usuarioRed.dependencia.id;
      this.subdependenciaId = this.usuarioRed.subdependencia.id;
      this.tipoContratoId = this.usuarioRed.tipoContrato.id;
    } else {
      this.form.reset({
        usuario: '',
        nombre: '',
        grupo: '',
        estado: 'Activo',
        fechaFinContrato: '',
      });
      this.sedeId = null;
      this.dependenciaId = null;
      this.subdependenciaId = null;
      this.tipoContratoId = null;
    }
  }

  submit(): void {
    if (
      this.form.invalid ||
      this.sedeId === null ||
      this.dependenciaId === null ||
      this.subdependenciaId === null ||
      this.tipoContratoId === null
    ) {
      return;
    }
    const raw = this.form.getRawValue();
    const request = {
      ...raw,
      fechaFinContrato: raw.fechaFinContrato || null,
      sedeId: this.sedeId,
      dependenciaId: this.dependenciaId,
      subdependenciaId: this.subdependenciaId,
      tipoContratoId: this.tipoContratoId,
    };
    const obs = this.usuarioRed
      ? this.service.update(this.usuarioRed.id, request)
      : this.service.create(request);
    obs.subscribe(() => this.saved.emit());
  }
}
```

- [ ] **Step 4: Create the form template and styles**

Create `soportedesk-frontend/src/app/features/usuarios-red/usuario-red-form.component.html`:

```html
<form [formGroup]="form" (ngSubmit)="submit()">
  <div class="field">
    <label>Usuario</label>
    <input type="text" formControlName="usuario" />
  </div>
  <div class="field">
    <label>Nombre</label>
    <input type="text" formControlName="nombre" />
  </div>
  <div class="field">
    <label>Grupo</label>
    <input type="text" formControlName="grupo" />
  </div>
  <div class="field">
    <label>Estado</label>
    <select formControlName="estado">
      <option value="Activo">Activo</option>
      <option value="Inactivo">Inactivo</option>
    </select>
  </div>
  <div class="field">
    <label>Fin de contrato</label>
    <input type="date" formControlName="fechaFinContrato" />
  </div>

  <app-ubicacion-select
    [(sedeId)]="sedeId"
    [(dependenciaId)]="dependenciaId"
    [(subdependenciaId)]="subdependenciaId"
    [(tipoContratoId)]="tipoContratoId"
  />

  <div class="actions">
    <button type="button" class="secondary" (click)="cancelled.emit()">Cancelar</button>
    <button
      type="submit"
      [disabled]="form.invalid || !sedeId || !dependenciaId || !subdependenciaId || !tipoContratoId"
    >
      Guardar
    </button>
  </div>
</form>
```

Create `soportedesk-frontend/src/app/features/usuarios-red/usuario-red-form.component.scss`:

```scss
.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;

  label {
    font-size: 12px;
    font-weight: 600;
    color: var(--color-gray);
  }

  input, select {
    padding: 8px;
    border: 1px solid var(--color-border);
    border-radius: 4px;
  }
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;

  button {
    border: none;
    border-radius: 4px;
    padding: 8px 16px;
    font-weight: 600;
    background-color: var(--color-green);
    color: var(--color-white);

    &:disabled {
      background-color: var(--color-gray);
    }

    &.secondary {
      background-color: var(--color-gray-light);
      color: var(--color-text);
    }
  }
}
```

- [ ] **Step 5: Create `UsuariosRedListComponent`**

Create `soportedesk-frontend/src/app/features/usuarios-red/usuarios-red-list.component.ts`:

```typescript
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';
import { GenericTableComponent, TableColumn } from '../../shared/generic-table/generic-table.component';
import { ModalComponent } from '../../shared/modal/modal.component';
import { FieldComponent } from '../../shared/field/field.component';
import { VencimientoBadgeComponent } from '../../shared/vencimiento-badge/vencimiento-badge.component';
import { UsuarioRedFormComponent } from './usuario-red-form.component';
import { UsuarioRed } from './usuario-red.model';
import { UsuarioRedService } from './usuario-red.service';

@Component({
  selector: 'app-usuarios-red-list',
  standalone: true,
  imports: [
    CommonModule,
    GenericTableComponent,
    ModalComponent,
    FieldComponent,
    VencimientoBadgeComponent,
    UsuarioRedFormComponent,
  ],
  templateUrl: './usuarios-red-list.component.html',
  styleUrl: './usuarios-red-list.component.scss',
})
export class UsuariosRedListComponent implements OnInit {
  private service = inject(UsuarioRedService);
  private authService = inject(AuthService);

  items: UsuarioRed[] = [];
  columns: TableColumn[] = [
    { key: 'usuario', label: 'Usuario' },
    { key: 'nombre', label: 'Nombre' },
    { key: 'grupo', label: 'Grupo' },
    { key: 'ultimoLogin', label: 'Último login' },
    { key: 'sede.nombre', label: 'Sede' },
    { key: 'dependencia.nombre', label: 'Dependencia' },
    { key: 'subdependencia.nombre', label: 'Subdependencia' },
    { key: 'tipoContrato.nombre', label: 'Tipo de contrato' },
    { key: 'fechaFinContrato', label: 'Fin de contrato' },
    { key: 'estado', label: 'Estado' },
  ];

  viewing: UsuarioRed | null = null;
  editing: UsuarioRed | null = null;
  formOpen = false;

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  ngOnInit(): void {
    this.load();
  }

  load(search?: string): void {
    this.service.getAll(search).subscribe((data) => (this.items = data));
  }

  onSearch(term: string): void {
    this.load(term);
  }

  onView(item: UsuarioRed): void {
    this.viewing = item;
  }

  closeView(): void {
    this.viewing = null;
  }

  onAdd(): void {
    this.editing = null;
    this.formOpen = true;
  }

  onEdit(item: UsuarioRed): void {
    this.editing = item;
    this.formOpen = true;
  }

  closeForm(): void {
    this.formOpen = false;
  }

  onDelete(item: UsuarioRed): void {
    if (!confirm(`¿Eliminar el usuario de red "${item.usuario}"?`)) {
      return;
    }
    this.service.delete(item.id).subscribe(() => this.load());
  }

  onSaved(): void {
    this.formOpen = false;
    this.load();
  }
}
```

- [ ] **Step 6: Create the list template and styles**

Create `soportedesk-frontend/src/app/features/usuarios-red/usuarios-red-list.component.html`:

```html
<h2>Usuarios de Red/AD</h2>

<app-generic-table
  [columns]="columns"
  [data]="items"
  [canEdit]="isAdmin"
  extraColumnLabel="Vencimiento"
  (searchChange)="onSearch($event)"
  (add)="onAdd()"
  (view)="onView($event)"
  (edit)="onEdit($event)"
  (delete)="onDelete($event)"
>
  <ng-template #extraCell let-row>
    <app-vencimiento-badge [fecha]="row.fechaFinContrato" />
  </ng-template>
</app-generic-table>

<app-modal title="Detalle de usuario de red" [open]="viewing !== null" (closed)="closeView()">
  <ng-container *ngIf="viewing">
    <app-field label="Usuario">{{ viewing.usuario }}</app-field>
    <app-field label="Nombre">{{ viewing.nombre }}</app-field>
    <app-field label="Grupo">{{ viewing.grupo }}</app-field>
    <app-field label="Último login">{{ viewing.ultimoLogin }}</app-field>
    <app-field label="Sede">{{ viewing.sede.nombre }}</app-field>
    <app-field label="Dependencia">{{ viewing.dependencia.nombre }}</app-field>
    <app-field label="Subdependencia">{{ viewing.subdependencia.nombre }}</app-field>
    <app-field label="Tipo de contrato">{{ viewing.tipoContrato.nombre }}</app-field>
    <app-field label="Fin de contrato">{{ viewing.fechaFinContrato }}</app-field>
    <app-field label="Estado">{{ viewing.estado }}</app-field>
  </ng-container>
</app-modal>

<app-modal
  [title]="editing ? 'Editar usuario de red' : 'Agregar usuario de red'"
  [open]="formOpen"
  (closed)="closeForm()"
>
  <app-usuario-red-form
    [usuarioRed]="editing"
    (saved)="onSaved()"
    (cancelled)="closeForm()"
  />
</app-modal>
```

Create `soportedesk-frontend/src/app/features/usuarios-red/usuarios-red-list.component.scss`:

```scss
h2 {
  color: var(--color-green-dark);
  margin-top: 0;
}
```

- [ ] **Step 7: Register the `/usuarios-red` route**

Modify `soportedesk-frontend/src/app/app.routes.ts`: add to the
`ShellComponent` route's `children` array:

```typescript
      {
        path: 'usuarios-red',
        loadComponent: () =>
          import('./features/usuarios-red/usuarios-red-list.component').then(
            (m) => m.UsuariosRedListComponent
          ),
      },
```

- [ ] **Step 8: Run full test suite**

Run: `cd soportedesk-frontend && npm test -- --watch=false`
Expected: all specs pass.

- [ ] **Step 9: Commit**

```bash
git add soportedesk-frontend/src/app/features/usuarios-red soportedesk-frontend/src/app/app.routes.ts
git commit -m "feat: add Usuarios de Red/AD feature"
```

---

## Task 14: Impresoras feature (ficha técnica + driver upload/download)

**Files:**
- Create: `soportedesk-frontend/src/app/features/impresoras/impresora.model.ts`
- Create: `soportedesk-frontend/src/app/features/impresoras/impresora.service.ts`
- Create: `soportedesk-frontend/src/app/features/impresoras/impresoras-list.component.ts`
- Create: `soportedesk-frontend/src/app/features/impresoras/impresoras-list.component.html`
- Create: `soportedesk-frontend/src/app/features/impresoras/impresoras-list.component.scss`
- Create: `soportedesk-frontend/src/app/features/impresoras/impresora-form.component.ts`
- Create: `soportedesk-frontend/src/app/features/impresoras/impresora-form.component.html`
- Create: `soportedesk-frontend/src/app/features/impresoras/impresora-form.component.scss`
- Create: `soportedesk-frontend/src/app/features/impresoras/impresora-ficha.component.ts`
- Create: `soportedesk-frontend/src/app/features/impresoras/impresora-ficha.component.html`
- Create: `soportedesk-frontend/src/app/features/impresoras/impresora-ficha.component.scss`
- Modify: `soportedesk-frontend/src/app/app.routes.ts`

The "Ver" action opens a "ficha técnica" modal (`ImpresoraFichaComponent`)
with three tabs: Instalación (nombre/marca/modelo/ip/piso/area/estado),
Consumibles (toner/cartucho/drum/fusor percentages), and Driver
(driverNombre/driverVersion/driverSo + download link + upload form, upload
hidden for non-admins). The "Agregar"/"Editar" actions use
`ImpresoraFormComponent` for the basic fields and consumibles (driver fields
are managed separately via the ficha's Driver tab).

- [ ] **Step 1: Create the Impresora model**

Create `soportedesk-frontend/src/app/features/impresoras/impresora.model.ts`:

```typescript
export interface Impresora {
  id: number;
  nombre: string;
  marca: string;
  modelo: string;
  ip: string;
  piso: string;
  area: string;
  estado: string;
  tonerNegro: number;
  tonerC: number;
  tonerM: number;
  tonerY: number;
  cartucho: number;
  drum: number;
  fusor: number;
  driverNombre: string | null;
  driverVersion: string | null;
  driverSo: string | null;
  driverArchivoPath: string | null;
}

export interface ImpresoraRequest {
  nombre: string;
  marca: string;
  modelo: string;
  ip: string;
  piso: string;
  area: string;
  estado: string;
  tonerNegro: number;
  tonerC: number;
  tonerM: number;
  tonerY: number;
  cartucho: number;
  drum: number;
  fusor: number;
}
```

- [ ] **Step 2: Create `ImpresoraService`**

Create `soportedesk-frontend/src/app/features/impresoras/impresora.service.ts`:

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Impresora, ImpresoraRequest } from './impresora.model';

@Injectable({ providedIn: 'root' })
export class ImpresoraService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/impresoras`;

  getAll(search?: string): Observable<Impresora[]> {
    let params = new HttpParams();
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<Impresora[]>(this.apiUrl, { params });
  }

  getById(id: number): Observable<Impresora> {
    return this.http.get<Impresora>(`${this.apiUrl}/${id}`);
  }

  create(request: ImpresoraRequest): Observable<Impresora> {
    return this.http.post<Impresora>(this.apiUrl, request);
  }

  update(id: number, request: ImpresoraRequest): Observable<Impresora> {
    return this.http.put<Impresora>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  uploadDriver(id: number, file: File): Observable<Impresora> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<Impresora>(`${this.apiUrl}/${id}/driver`, formData);
  }

  downloadDriver(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/driver`, { responseType: 'blob' });
  }
}
```

- [ ] **Step 3: Create `ImpresoraFormComponent`**

Create `soportedesk-frontend/src/app/features/impresoras/impresora-form.component.ts`:

```typescript
import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Impresora } from './impresora.model';
import { ImpresoraService } from './impresora.service';

@Component({
  selector: 'app-impresora-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './impresora-form.component.html',
  styleUrl: './impresora-form.component.scss',
})
export class ImpresoraFormComponent implements OnChanges {
  private fb = inject(FormBuilder);
  private service = inject(ImpresoraService);

  @Input() impresora: Impresora | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    marca: ['', Validators.required],
    modelo: ['', Validators.required],
    ip: ['', Validators.required],
    piso: ['', Validators.required],
    area: ['', Validators.required],
    estado: ['Activa', Validators.required],
    tonerNegro: [100, [Validators.required, Validators.min(0), Validators.max(100)]],
    tonerC: [100, [Validators.required, Validators.min(0), Validators.max(100)]],
    tonerM: [100, [Validators.required, Validators.min(0), Validators.max(100)]],
    tonerY: [100, [Validators.required, Validators.min(0), Validators.max(100)]],
    cartucho: [100, [Validators.required, Validators.min(0), Validators.max(100)]],
    drum: [100, [Validators.required, Validators.min(0), Validators.max(100)]],
    fusor: [100, [Validators.required, Validators.min(0), Validators.max(100)]],
  });

  ngOnChanges(): void {
    if (this.impresora) {
      this.form.patchValue(this.impresora);
    } else {
      this.form.reset({
        nombre: '',
        marca: '',
        modelo: '',
        ip: '',
        piso: '',
        area: '',
        estado: 'Activa',
        tonerNegro: 100,
        tonerC: 100,
        tonerM: 100,
        tonerY: 100,
        cartucho: 100,
        drum: 100,
        fusor: 100,
      });
    }
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }
    const request = this.form.getRawValue();
    const obs = this.impresora
      ? this.service.update(this.impresora.id, request)
      : this.service.create(request);
    obs.subscribe(() => this.saved.emit());
  }
}
```

- [ ] **Step 4: Create the form template and styles**

Create `soportedesk-frontend/src/app/features/impresoras/impresora-form.component.html`:

```html
<form [formGroup]="form" (ngSubmit)="submit()">
  <div class="field">
    <label>Nombre</label>
    <input type="text" formControlName="nombre" />
  </div>
  <div class="field">
    <label>Marca</label>
    <input type="text" formControlName="marca" />
  </div>
  <div class="field">
    <label>Modelo</label>
    <input type="text" formControlName="modelo" />
  </div>
  <div class="field">
    <label>IP</label>
    <input type="text" formControlName="ip" />
  </div>
  <div class="field">
    <label>Piso</label>
    <input type="text" formControlName="piso" />
  </div>
  <div class="field">
    <label>Área</label>
    <input type="text" formControlName="area" />
  </div>
  <div class="field">
    <label>Estado</label>
    <select formControlName="estado">
      <option value="Activa">Activa</option>
      <option value="Inactiva">Inactiva</option>
      <option value="En mantenimiento">En mantenimiento</option>
    </select>
  </div>

  <div class="grid">
    <div class="field">
      <label>Tóner negro (%)</label>
      <input type="number" min="0" max="100" formControlName="tonerNegro" />
    </div>
    <div class="field">
      <label>Tóner cian (%)</label>
      <input type="number" min="0" max="100" formControlName="tonerC" />
    </div>
    <div class="field">
      <label>Tóner magenta (%)</label>
      <input type="number" min="0" max="100" formControlName="tonerM" />
    </div>
    <div class="field">
      <label>Tóner amarillo (%)</label>
      <input type="number" min="0" max="100" formControlName="tonerY" />
    </div>
    <div class="field">
      <label>Cartucho (%)</label>
      <input type="number" min="0" max="100" formControlName="cartucho" />
    </div>
    <div class="field">
      <label>Drum (%)</label>
      <input type="number" min="0" max="100" formControlName="drum" />
    </div>
    <div class="field">
      <label>Fusor (%)</label>
      <input type="number" min="0" max="100" formControlName="fusor" />
    </div>
  </div>

  <div class="actions">
    <button type="button" class="secondary" (click)="cancelled.emit()">Cancelar</button>
    <button type="submit" [disabled]="form.invalid">Guardar</button>
  </div>
</form>
```

Create `soportedesk-frontend/src/app/features/impresoras/impresora-form.component.scss`:

```scss
.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;

  label {
    font-size: 12px;
    font-weight: 600;
    color: var(--color-gray);
  }

  input, select {
    padding: 8px;
    border: 1px solid var(--color-border);
    border-radius: 4px;
  }
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0 12px;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;

  button {
    border: none;
    border-radius: 4px;
    padding: 8px 16px;
    font-weight: 600;
    background-color: var(--color-green);
    color: var(--color-white);

    &:disabled {
      background-color: var(--color-gray);
    }

    &.secondary {
      background-color: var(--color-gray-light);
      color: var(--color-text);
    }
  }
}
```

- [ ] **Step 5: Create `ImpresoraFichaComponent` (ficha técnica with tabs)**

Create `soportedesk-frontend/src/app/features/impresoras/impresora-ficha.component.spec.ts`:

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ImpresoraFichaComponent } from './impresora-ficha.component';
import { Impresora } from './impresora.model';

describe('ImpresoraFichaComponent', () => {
  let fixture: ComponentFixture<ImpresoraFichaComponent>;
  let component: ImpresoraFichaComponent;

  const impresora: Impresora = {
    id: 1,
    nombre: 'HP LaserJet',
    marca: 'HP',
    modelo: 'M404',
    ip: '10.0.0.5',
    piso: '2',
    area: 'TI',
    estado: 'Activa',
    tonerNegro: 80,
    tonerC: 70,
    tonerM: 60,
    tonerY: 50,
    cartucho: 90,
    drum: 100,
    fusor: 100,
    driverNombre: 'HP Universal',
    driverVersion: '6.9',
    driverSo: 'Windows 11',
    driverArchivoPath: '1/driver.zip',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImpresoraFichaComponent, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ImpresoraFichaComponent);
    component = fixture.componentInstance;
    component.impresora = impresora;
    component.isAdmin = false;
    fixture.detectChanges();
  });

  it('defaults to the Instalación tab', () => {
    expect(component.activeTab).toBe('instalacion');
  });

  it('switches to the Consumibles tab', () => {
    component.setTab('consumibles');
    fixture.detectChanges();

    expect(component.activeTab).toBe('consumibles');
  });

  it('switches to the Driver tab and shows driver info', () => {
    component.setTab('driver');
    fixture.detectChanges();

    expect(component.activeTab).toBe('driver');
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('HP Universal');
  });
});
```

Create `soportedesk-frontend/src/app/features/impresoras/impresora-ficha.component.ts`:

```typescript
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Impresora } from './impresora.model';
import { ImpresoraService } from './impresora.service';

export type FichaTab = 'instalacion' | 'consumibles' | 'driver';

@Component({
  selector: 'app-impresora-ficha',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './impresora-ficha.component.html',
  styleUrl: './impresora-ficha.component.scss',
})
export class ImpresoraFichaComponent {
  private service = inject(ImpresoraService);

  @Input({ required: true }) impresora!: Impresora;
  @Input() isAdmin = false;
  @Output() driverUpdated = new EventEmitter<Impresora>();

  activeTab: FichaTab = 'instalacion';

  setTab(tab: FichaTab): void {
    this.activeTab = tab;
  }

  downloadDriver(): void {
    this.service.downloadDriver(this.impresora.id).subscribe((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = this.impresora.driverNombre ?? 'driver';
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    this.service.uploadDriver(this.impresora.id, file).subscribe((updated) => {
      this.impresora = updated;
      this.driverUpdated.emit(updated);
    });
  }
}
```

- [ ] **Step 6: Create the ficha template and styles**

Create `soportedesk-frontend/src/app/features/impresoras/impresora-ficha.component.html`:

```html
<div class="tabs">
  <button
    type="button"
    [class.active]="activeTab === 'instalacion'"
    (click)="setTab('instalacion')"
  >
    Instalación
  </button>
  <button
    type="button"
    [class.active]="activeTab === 'consumibles'"
    (click)="setTab('consumibles')"
  >
    Consumibles
  </button>
  <button type="button" [class.active]="activeTab === 'driver'" (click)="setTab('driver')">
    Driver
  </button>
</div>

<div class="tab-content" *ngIf="activeTab === 'instalacion'">
  <div class="row"><span>Nombre</span><strong>{{ impresora.nombre }}</strong></div>
  <div class="row"><span>Marca</span><strong>{{ impresora.marca }}</strong></div>
  <div class="row"><span>Modelo</span><strong>{{ impresora.modelo }}</strong></div>
  <div class="row"><span>IP</span><strong>{{ impresora.ip }}</strong></div>
  <div class="row"><span>Piso</span><strong>{{ impresora.piso }}</strong></div>
  <div class="row"><span>Área</span><strong>{{ impresora.area }}</strong></div>
  <div class="row"><span>Estado</span><strong>{{ impresora.estado }}</strong></div>
</div>

<div class="tab-content" *ngIf="activeTab === 'consumibles'">
  <div class="row"><span>Tóner negro</span><strong>{{ impresora.tonerNegro }}%</strong></div>
  <div class="row"><span>Tóner cian</span><strong>{{ impresora.tonerC }}%</strong></div>
  <div class="row"><span>Tóner magenta</span><strong>{{ impresora.tonerM }}%</strong></div>
  <div class="row"><span>Tóner amarillo</span><strong>{{ impresora.tonerY }}%</strong></div>
  <div class="row"><span>Cartucho</span><strong>{{ impresora.cartucho }}%</strong></div>
  <div class="row"><span>Drum</span><strong>{{ impresora.drum }}%</strong></div>
  <div class="row"><span>Fusor</span><strong>{{ impresora.fusor }}%</strong></div>
</div>

<div class="tab-content" *ngIf="activeTab === 'driver'">
  <div class="row"><span>Nombre</span><strong>{{ impresora.driverNombre ?? 'Sin driver' }}</strong></div>
  <div class="row"><span>Versión</span><strong>{{ impresora.driverVersion ?? '-' }}</strong></div>
  <div class="row"><span>Sistema operativo</span><strong>{{ impresora.driverSo ?? '-' }}</strong></div>

  <button type="button" *ngIf="impresora.driverArchivoPath" (click)="downloadDriver()">
    Descargar driver
  </button>

  <div class="upload" *ngIf="isAdmin">
    <label>Subir nuevo driver</label>
    <input type="file" (change)="onFileSelected($event)" />
  </div>
</div>
```

Create `soportedesk-frontend/src/app/features/impresoras/impresora-ficha.component.scss`:

```scss
.tabs {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 12px;

  button {
    border: none;
    background: none;
    padding: 8px 16px;
    cursor: pointer;
    font-weight: 600;
    color: var(--color-gray);

    &.active {
      color: var(--color-green-dark);
      border-bottom: 2px solid var(--color-green);
    }
  }
}

.row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px solid var(--color-border);
}

.upload {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;

  label {
    font-size: 12px;
    font-weight: 600;
    color: var(--color-gray);
  }
}
```

- [ ] **Step 7: Run the ficha spec**

Run: `cd soportedesk-frontend && npm test -- --watch=false --include='**/impresora-ficha.component.spec.ts'`
Expected: all 3 specs pass.

- [ ] **Step 8: Create `ImpresorasListComponent`**

Create `soportedesk-frontend/src/app/features/impresoras/impresoras-list.component.ts`:

```typescript
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';
import { GenericTableComponent, TableColumn } from '../../shared/generic-table/generic-table.component';
import { ModalComponent } from '../../shared/modal/modal.component';
import { ImpresoraFormComponent } from './impresora-form.component';
import { ImpresoraFichaComponent } from './impresora-ficha.component';
import { Impresora } from './impresora.model';
import { ImpresoraService } from './impresora.service';

@Component({
  selector: 'app-impresoras-list',
  standalone: true,
  imports: [CommonModule, GenericTableComponent, ModalComponent, ImpresoraFormComponent, ImpresoraFichaComponent],
  templateUrl: './impresoras-list.component.html',
  styleUrl: './impresoras-list.component.scss',
})
export class ImpresorasListComponent implements OnInit {
  private service = inject(ImpresoraService);
  private authService = inject(AuthService);

  items: Impresora[] = [];
  columns: TableColumn[] = [
    { key: 'nombre', label: 'Nombre' },
    { key: 'marca', label: 'Marca' },
    { key: 'modelo', label: 'Modelo' },
    { key: 'ip', label: 'IP' },
    { key: 'piso', label: 'Piso' },
    { key: 'area', label: 'Área' },
    { key: 'estado', label: 'Estado' },
  ];

  viewing: Impresora | null = null;
  editing: Impresora | null = null;
  formOpen = false;

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  ngOnInit(): void {
    this.load();
  }

  load(search?: string): void {
    this.service.getAll(search).subscribe((data) => (this.items = data));
  }

  onSearch(term: string): void {
    this.load(term);
  }

  onView(item: Impresora): void {
    this.viewing = item;
  }

  closeView(): void {
    this.viewing = null;
  }

  onAdd(): void {
    this.editing = null;
    this.formOpen = true;
  }

  onEdit(item: Impresora): void {
    this.editing = item;
    this.formOpen = true;
  }

  closeForm(): void {
    this.formOpen = false;
  }

  onDelete(item: Impresora): void {
    if (!confirm(`¿Eliminar la impresora "${item.nombre}"?`)) {
      return;
    }
    this.service.delete(item.id).subscribe(() => this.load());
  }

  onSaved(): void {
    this.formOpen = false;
    this.load();
  }

  onDriverUpdated(updated: Impresora): void {
    this.items = this.items.map((item) => (item.id === updated.id ? updated : item));
  }
}
```

- [ ] **Step 9: Create the list template and styles**

Create `soportedesk-frontend/src/app/features/impresoras/impresoras-list.component.html`:

```html
<h2>Impresoras</h2>

<app-generic-table
  [columns]="columns"
  [data]="items"
  [canEdit]="isAdmin"
  (searchChange)="onSearch($event)"
  (add)="onAdd()"
  (view)="onView($event)"
  (edit)="onEdit($event)"
  (delete)="onDelete($event)"
/>

<app-modal title="Ficha técnica" [open]="viewing !== null" (closed)="closeView()">
  <app-impresora-ficha
    *ngIf="viewing"
    [impresora]="viewing"
    [isAdmin]="isAdmin"
    (driverUpdated)="onDriverUpdated($event)"
  />
</app-modal>

<app-modal
  [title]="editing ? 'Editar impresora' : 'Agregar impresora'"
  [open]="formOpen"
  (closed)="closeForm()"
>
  <app-impresora-form [impresora]="editing" (saved)="onSaved()" (cancelled)="closeForm()" />
</app-modal>
```

Create `soportedesk-frontend/src/app/features/impresoras/impresoras-list.component.scss`:

```scss
h2 {
  color: var(--color-green-dark);
  margin-top: 0;
}
```

- [ ] **Step 10: Register the `/impresoras` route**

Modify `soportedesk-frontend/src/app/app.routes.ts`: add to the
`ShellComponent` route's `children` array:

```typescript
      {
        path: 'impresoras',
        loadComponent: () =>
          import('./features/impresoras/impresoras-list.component').then(
            (m) => m.ImpresorasListComponent
          ),
      },
```

- [ ] **Step 11: Run full test suite**

Run: `cd soportedesk-frontend && npm test -- --watch=false`
Expected: all specs pass.

- [ ] **Step 12: Commit**

```bash
git add soportedesk-frontend/src/app/features/impresoras soportedesk-frontend/src/app/app.routes.ts
git commit -m "feat: add Impresoras feature with ficha tecnica and driver upload/download"
```

---

## Task 15: Catálogos admin feature

**Files:**
- Create: `soportedesk-frontend/src/app/features/catalogos/catalogos.component.spec.ts`
- Create: `soportedesk-frontend/src/app/features/catalogos/catalogos.component.ts`
- Create: `soportedesk-frontend/src/app/features/catalogos/catalogos.component.html`
- Create: `soportedesk-frontend/src/app/features/catalogos/catalogos.component.scss`
- Modify: `soportedesk-frontend/src/app/app.routes.ts`

Admin-only CRUD UI for `sedes`, `dependencias`, `subdependencias`, and
`tipos-contrato` using the `CatalogoService` from Task 6. A single
tabbed component handles all four catalogs: each tab shows a simple table
(nombre + parent name where applicable) with Editar/Eliminar actions, plus an
inline add/edit form (name input, and a parent `<select>` for
dependencias/subdependencias).

- [ ] **Step 1: Write the component spec**

Create `soportedesk-frontend/src/app/features/catalogos/catalogos.component.spec.ts`:

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CatalogosComponent } from './catalogos.component';
import { environment } from '../../../environments/environment';

describe('CatalogosComponent', () => {
  let fixture: ComponentFixture<CatalogosComponent>;
  let component: CatalogosComponent;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CatalogosComponent, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(CatalogosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    httpMock = TestBed.inject(HttpTestingController);
    httpMock.expectOne(`${environment.apiUrl}/catalogos/sedes`).flush([{ id: 1, nombre: 'Lima' }]);
    httpMock
      .expectOne(`${environment.apiUrl}/catalogos/tipos-contrato`)
      .flush([{ id: 1, nombre: 'CAS' }]);
    httpMock
      .expectOne(`${environment.apiUrl}/catalogos/dependencias`)
      .flush([{ id: 1, nombre: 'Informática', sede: { id: 1, nombre: 'Lima' } }]);
    httpMock
      .expectOne(`${environment.apiUrl}/catalogos/subdependencias`)
      .flush([
        {
          id: 1,
          nombre: 'Soporte',
          dependencia: { id: 1, nombre: 'Informática', sede: { id: 1, nombre: 'Lima' } },
        },
      ]);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('defaults to the sedes tab and loads sedes', () => {
    expect(component.activeTab).toBe('sedes');
    expect(component.sedes.length).toBe(1);
  });

  it('switches to the dependencias tab', () => {
    component.setTab('dependencias');
    fixture.detectChanges();

    expect(component.activeTab).toBe('dependencias');
    expect(component.dependencias.length).toBe(1);
  });

  it('creates a new sede and reloads the list', () => {
    component.setTab('sedes');
    component.nombreForm = 'Cusco';
    component.submitSimple();

    const req = httpMock.expectOne(`${environment.apiUrl}/catalogos/sedes`);
    expect(req.request.method).toBe('POST');
    req.flush({ id: 2, nombre: 'Cusco' });

    httpMock.expectOne(`${environment.apiUrl}/catalogos/sedes`).flush([
      { id: 1, nombre: 'Lima' },
      { id: 2, nombre: 'Cusco' },
    ]);

    expect(component.sedes.length).toBe(2);
  });
});
```

- [ ] **Step 2: Run the spec to verify it fails**

Run: `cd soportedesk-frontend && npm test -- --watch=false --include='**/catalogos.component.spec.ts'`
Expected: FAIL — `CatalogosComponent` does not exist yet.

- [ ] **Step 3: Create `CatalogosComponent`**

Create `soportedesk-frontend/src/app/features/catalogos/catalogos.component.ts`:

```typescript
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CatalogoService } from '../../core/catalogos/catalogo.service';
import {
  Dependencia,
  Sede,
  Subdependencia,
  TipoContrato,
} from '../../core/models/catalogo.model';

export type CatalogoTab = 'sedes' | 'dependencias' | 'subdependencias' | 'tipos-contrato';

@Component({
  selector: 'app-catalogos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './catalogos.component.html',
  styleUrl: './catalogos.component.scss',
})
export class CatalogosComponent implements OnInit {
  private service = inject(CatalogoService);

  activeTab: CatalogoTab = 'sedes';

  sedes: Sede[] = [];
  dependencias: Dependencia[] = [];
  subdependencias: Subdependencia[] = [];
  tiposContrato: TipoContrato[] = [];

  editingId: number | null = null;
  nombreForm = '';
  parentIdForm: number | null = null;

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.service.getSedes().subscribe((data) => (this.sedes = data));
    this.service.getTiposContrato().subscribe((data) => (this.tiposContrato = data));
    this.service.getDependencias().subscribe((data) => (this.dependencias = data));
    this.service.getSubdependencias().subscribe((data) => (this.subdependencias = data));
  }

  setTab(tab: CatalogoTab): void {
    this.activeTab = tab;
    this.resetForm();
  }

  resetForm(): void {
    this.editingId = null;
    this.nombreForm = '';
    this.parentIdForm = null;
  }

  edit(id: number, nombre: string, parentId: number | null = null): void {
    this.editingId = id;
    this.nombreForm = nombre;
    this.parentIdForm = parentId;
  }

  submitSimple(): void {
    if (!this.nombreForm.trim()) {
      return;
    }
    const request = { nombre: this.nombreForm.trim() };

    if (this.activeTab === 'sedes') {
      const obs = this.editingId
        ? this.service.updateSede(this.editingId, request)
        : this.service.createSede(request);
      obs.subscribe(() => {
        this.service.getSedes().subscribe((data) => (this.sedes = data));
        this.resetForm();
      });
    } else if (this.activeTab === 'tipos-contrato') {
      const obs = this.editingId
        ? this.service.updateTipoContrato(this.editingId, request)
        : this.service.createTipoContrato(request);
      obs.subscribe(() => {
        this.service.getTiposContrato().subscribe((data) => (this.tiposContrato = data));
        this.resetForm();
      });
    } else if (this.activeTab === 'dependencias') {
      if (this.parentIdForm === null) {
        return;
      }
      const depRequest = { nombre: this.nombreForm.trim(), sedeId: this.parentIdForm };
      const obs = this.editingId
        ? this.service.updateDependencia(this.editingId, depRequest)
        : this.service.createDependencia(depRequest);
      obs.subscribe(() => {
        this.service.getDependencias().subscribe((data) => (this.dependencias = data));
        this.resetForm();
      });
    } else {
      if (this.parentIdForm === null) {
        return;
      }
      const subRequest = { nombre: this.nombreForm.trim(), dependenciaId: this.parentIdForm };
      const obs = this.editingId
        ? this.service.updateSubdependencia(this.editingId, subRequest)
        : this.service.createSubdependencia(subRequest);
      obs.subscribe(() => {
        this.service.getSubdependencias().subscribe((data) => (this.subdependencias = data));
        this.resetForm();
      });
    }
  }

  deleteSede(item: Sede): void {
    if (!confirm(`¿Eliminar la sede "${item.nombre}"?`)) {
      return;
    }
    this.service.deleteSede(item.id).subscribe(() => {
      this.service.getSedes().subscribe((data) => (this.sedes = data));
    });
  }

  deleteDependencia(item: Dependencia): void {
    if (!confirm(`¿Eliminar la dependencia "${item.nombre}"?`)) {
      return;
    }
    this.service.deleteDependencia(item.id).subscribe(() => {
      this.service.getDependencias().subscribe((data) => (this.dependencias = data));
    });
  }

  deleteSubdependencia(item: Subdependencia): void {
    if (!confirm(`¿Eliminar la subdependencia "${item.nombre}"?`)) {
      return;
    }
    this.service.deleteSubdependencia(item.id).subscribe(() => {
      this.service.getSubdependencias().subscribe((data) => (this.subdependencias = data));
    });
  }

  deleteTipoContrato(item: TipoContrato): void {
    if (!confirm(`¿Eliminar el tipo de contrato "${item.nombre}"?`)) {
      return;
    }
    this.service.deleteTipoContrato(item.id).subscribe(() => {
      this.service.getTiposContrato().subscribe((data) => (this.tiposContrato = data));
    });
  }
}
```

- [ ] **Step 4: Create the template and styles**

Create `soportedesk-frontend/src/app/features/catalogos/catalogos.component.html`:

```html
<h2>Catálogos</h2>

<div class="tabs">
  <button type="button" [class.active]="activeTab === 'sedes'" (click)="setTab('sedes')">Sedes</button>
  <button type="button" [class.active]="activeTab === 'dependencias'" (click)="setTab('dependencias')">Dependencias</button>
  <button type="button" [class.active]="activeTab === 'subdependencias'" (click)="setTab('subdependencias')">Subdependencias</button>
  <button type="button" [class.active]="activeTab === 'tipos-contrato'" (click)="setTab('tipos-contrato')">Tipos de Contrato</button>
</div>

<div class="content">
  <table *ngIf="activeTab === 'sedes'">
    <thead><tr><th>Nombre</th><th></th></tr></thead>
    <tbody>
      <tr *ngFor="let item of sedes">
        <td>{{ item.nombre }}</td>
        <td class="actions">
          <button type="button" (click)="edit(item.id, item.nombre)">Editar</button>
          <button type="button" class="danger" (click)="deleteSede(item)">Eliminar</button>
        </td>
      </tr>
      <tr *ngIf="sedes.length === 0"><td colspan="2">Sin registros</td></tr>
    </tbody>
  </table>

  <table *ngIf="activeTab === 'dependencias'">
    <thead><tr><th>Nombre</th><th>Sede</th><th></th></tr></thead>
    <tbody>
      <tr *ngFor="let item of dependencias">
        <td>{{ item.nombre }}</td>
        <td>{{ item.sede.nombre }}</td>
        <td class="actions">
          <button type="button" (click)="edit(item.id, item.nombre, item.sede.id)">Editar</button>
          <button type="button" class="danger" (click)="deleteDependencia(item)">Eliminar</button>
        </td>
      </tr>
      <tr *ngIf="dependencias.length === 0"><td colspan="3">Sin registros</td></tr>
    </tbody>
  </table>

  <table *ngIf="activeTab === 'subdependencias'">
    <thead><tr><th>Nombre</th><th>Dependencia</th><th></th></tr></thead>
    <tbody>
      <tr *ngFor="let item of subdependencias">
        <td>{{ item.nombre }}</td>
        <td>{{ item.dependencia.nombre }}</td>
        <td class="actions">
          <button type="button" (click)="edit(item.id, item.nombre, item.dependencia.id)">Editar</button>
          <button type="button" class="danger" (click)="deleteSubdependencia(item)">Eliminar</button>
        </td>
      </tr>
      <tr *ngIf="subdependencias.length === 0"><td colspan="3">Sin registros</td></tr>
    </tbody>
  </table>

  <table *ngIf="activeTab === 'tipos-contrato'">
    <thead><tr><th>Nombre</th><th></th></tr></thead>
    <tbody>
      <tr *ngFor="let item of tiposContrato">
        <td>{{ item.nombre }}</td>
        <td class="actions">
          <button type="button" (click)="edit(item.id, item.nombre)">Editar</button>
          <button type="button" class="danger" (click)="deleteTipoContrato(item)">Eliminar</button>
        </td>
      </tr>
      <tr *ngIf="tiposContrato.length === 0"><td colspan="2">Sin registros</td></tr>
    </tbody>
  </table>

  <form class="add-form" (ngSubmit)="submitSimple()">
    <div class="field">
      <label>Nombre</label>
      <input type="text" name="nombre" [(ngModel)]="nombreForm" required />
    </div>

    <div class="field" *ngIf="activeTab === 'dependencias'">
      <label>Sede</label>
      <select name="sedeId" [(ngModel)]="parentIdForm">
        <option [ngValue]="null">Seleccione...</option>
        <option *ngFor="let sede of sedes" [ngValue]="sede.id">{{ sede.nombre }}</option>
      </select>
    </div>

    <div class="field" *ngIf="activeTab === 'subdependencias'">
      <label>Dependencia</label>
      <select name="dependenciaId" [(ngModel)]="parentIdForm">
        <option [ngValue]="null">Seleccione...</option>
        <option *ngFor="let dep of dependencias" [ngValue]="dep.id">{{ dep.nombre }}</option>
      </select>
    </div>

    <div class="actions">
      <button type="button" *ngIf="editingId !== null" class="secondary" (click)="resetForm()">Cancelar</button>
      <button type="submit">{{ editingId !== null ? 'Guardar cambios' : 'Agregar' }}</button>
    </div>
  </form>
</div>
```

Create `soportedesk-frontend/src/app/features/catalogos/catalogos.component.scss`:

```scss
h2 {
  color: var(--color-green-dark);
  margin-top: 0;
}

.tabs {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 12px;

  button {
    border: none;
    background: none;
    padding: 8px 16px;
    cursor: pointer;
    font-weight: 600;
    color: var(--color-gray);

    &.active {
      color: var(--color-green-dark);
      border-bottom: 2px solid var(--color-green);
    }
  }
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 16px;

  th, td {
    text-align: left;
    padding: 8px;
    border-bottom: 1px solid var(--color-border);
  }

  .actions {
    display: flex;
    gap: 8px;
  }
}

.add-form {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  flex-wrap: wrap;

  .field {
    display: flex;
    flex-direction: column;
    gap: 4px;

    label {
      font-size: 12px;
      font-weight: 600;
      color: var(--color-gray);
    }

    input, select {
      padding: 8px;
      border: 1px solid var(--color-border);
      border-radius: 4px;
    }
  }

  button {
    border: none;
    border-radius: 4px;
    padding: 8px 16px;
    font-weight: 600;
    background-color: var(--color-green);
    color: var(--color-white);

    &.secondary {
      background-color: var(--color-gray-light);
      color: var(--color-text);
    }

    &.danger {
      background-color: var(--color-red);
    }
  }
}

button.danger {
  border: none;
  border-radius: 4px;
  padding: 6px 10px;
  font-weight: 600;
  background-color: var(--color-red);
  color: var(--color-white);
  cursor: pointer;
}
```

- [ ] **Step 5: Run the spec to verify it passes**

Run: `cd soportedesk-frontend && npm test -- --watch=false --include='**/catalogos.component.spec.ts'`
Expected: PASS (3 specs).

- [ ] **Step 6: Register the `/catalogos` route**

Modify `soportedesk-frontend/src/app/app.routes.ts`: add to the
`ShellComponent` route's `children` array:

```typescript
      {
        path: 'catalogos',
        loadComponent: () =>
          import('./features/catalogos/catalogos.component').then((m) => m.CatalogosComponent),
      },
```

- [ ] **Step 7: Run full test suite**

Run: `cd soportedesk-frontend && npm test -- --watch=false`
Expected: all specs pass.

- [ ] **Step 8: Commit**

```bash
git add soportedesk-frontend/src/app/features/catalogos soportedesk-frontend/src/app/app.routes.ts
git commit -m "feat: add catalog administration feature"
```

---

## Task 16: `*ifAdmin` directive and final routing polish

**Files:**
- Create: `soportedesk-frontend/src/app/core/auth/if-admin.directive.spec.ts`
- Create: `soportedesk-frontend/src/app/core/auth/if-admin.directive.ts`
- Modify: `soportedesk-frontend/src/app/layout/sidebar/sidebar.component.ts`
- Modify: `soportedesk-frontend/src/app/layout/sidebar/sidebar.component.html`
- Modify: `soportedesk-frontend/src/app/features/impresoras/impresora-ficha.component.ts`
- Modify: `soportedesk-frontend/src/app/features/impresoras/impresora-ficha.component.html`
- Modify: `soportedesk-frontend/src/app/app.routes.ts`

Per spec section 5.3, a `*ifAdmin` structural directive (analogous to
`*ngIf`, backed by `AuthService.isAdmin()`) hides admin-only UI for the
`SOPORTE` role. This task adds that directive and applies it to the two
places where it's the natural fit: the sidebar's "Catálogos" link and the
ficha técnica's "Subir nuevo driver" section (both currently gated with
`*ngIf="isAdmin"`/`visibleItems` getters from Tasks 3 and 14). The
`GenericTableComponent`'s `[canEdit]="isAdmin"` bindings used throughout
Tasks 8-15 are left as-is — `canEdit` is a component `@Input` (a boolean
flag consumed internally to hide Agregar/Editar/Eliminar buttons), not a
template region to hide, so a structural directive doesn't apply there. This
step also adds the catch-all redirect to `app.routes.ts` so unknown paths
fall back to `/dashboard`.

- [ ] **Step 1: Write the directive spec**

Create `soportedesk-frontend/src/app/core/auth/if-admin.directive.spec.ts`:

```typescript
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IfAdminDirective } from './if-admin.directive';
import { AuthService } from './auth.service';

@Component({
  standalone: true,
  imports: [IfAdminDirective],
  template: `<div *ifAdmin class="admin-only">Solo admin</div>`,
})
class HostComponent {}

describe('IfAdminDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  function setup(isAdmin: boolean): void {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['isAdmin']);
    authServiceSpy.isAdmin.and.returnValue(isAdmin);

    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [{ provide: AuthService, useValue: authServiceSpy }],
    });

    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  }

  it('renders the content when the user is admin', () => {
    setup(true);

    expect(fixture.nativeElement.querySelector('.admin-only')).toBeTruthy();
  });

  it('does not render the content when the user is not admin', () => {
    setup(false);

    expect(fixture.nativeElement.querySelector('.admin-only')).toBeFalsy();
  });
});
```

- [ ] **Step 2: Run the spec to verify it fails**

Run: `cd soportedesk-frontend && npm test -- --watch=false --include='**/if-admin.directive.spec.ts'`
Expected: FAIL — `IfAdminDirective` does not exist yet.

- [ ] **Step 3: Implement `IfAdminDirective`**

Create `soportedesk-frontend/src/app/core/auth/if-admin.directive.ts`:

```typescript
import { Directive, OnInit, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import { AuthService } from './auth.service';

@Directive({
  selector: '[ifAdmin]',
  standalone: true,
})
export class IfAdminDirective implements OnInit {
  private templateRef = inject(TemplateRef<unknown>);
  private viewContainer = inject(ViewContainerRef);
  private authService = inject(AuthService);

  ngOnInit(): void {
    if (this.authService.isAdmin()) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }
}
```

- [ ] **Step 4: Run the spec to verify it passes**

Run: `cd soportedesk-frontend && npm test -- --watch=false --include='**/if-admin.directive.spec.ts'`
Expected: PASS (2 specs).

- [ ] **Step 5: Apply the directive to the sidebar's "Catálogos" link**

Modify `soportedesk-frontend/src/app/layout/sidebar/sidebar.component.ts`:
add `IfAdminDirective` to the `imports` array and remove the `visibleItems`
getter and the now-unused `AuthService` injection (the directive now controls
visibility directly in the template). Remove:

```typescript
  private authService = inject(AuthService);
```

and:

```typescript
  get visibleItems(): NavItem[] {
    return this.navItems.filter((item) => !item.adminOnly || this.authService.isAdmin());
  }
```

leaving `navItems` as a plain `readonly` field, and add `IfAdminDirective` to
`imports`:

```typescript
  imports: [CommonModule, RouterLink, RouterLinkActive, IfAdminDirective],
```

with the import statement (and remove the now-unused `AuthService` import):

```typescript
import { IfAdminDirective } from '../../core/auth/if-admin.directive';
```

Modify `soportedesk-frontend/src/app/layout/sidebar/sidebar.component.html`:
iterate over `navItems` directly, rendering non-admin items normally and
admin-only items inside `*ifAdmin`. Change:

```html
<a
  *ngFor="let item of visibleItems"
  [routerLink]="item.path"
  routerLinkActive="active"
  class="nav-item"
>
  <span class="icon">{{ item.icon }}</span>
  <span class="label" *ngIf="!collapsed">{{ item.label }}</span>
</a>
```

to:

```html
<ng-container *ngFor="let item of navItems">
  <a
    *ngIf="!item.adminOnly"
    [routerLink]="item.path"
    routerLinkActive="active"
    class="nav-item"
  >
    <span class="icon">{{ item.icon }}</span>
    <span class="label" *ngIf="!collapsed">{{ item.label }}</span>
  </a>
  <a *ifAdmin [routerLink]="item.path" routerLinkActive="active" class="nav-item">
    <span class="icon">{{ item.icon }}</span>
    <span class="label" *ngIf="!collapsed">{{ item.label }}</span>
  </a>
</ng-container>
```

(only one of the two `<a>` tags renders per item, since `adminOnly` is
`true` only for "Catálogos").

- [ ] **Step 6: Apply the directive to the impresora ficha's driver upload section**

Modify `soportedesk-frontend/src/app/features/impresoras/impresora-ficha.component.ts`:
add `IfAdminDirective` to `imports` and remove the `@Input() isAdmin`
property (the directive now reads the role directly from `AuthService`):

```typescript
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IfAdminDirective } from '../../core/auth/if-admin.directive';
import { Impresora } from './impresora.model';
import { ImpresoraService } from './impresora.service';

export type FichaTab = 'instalacion' | 'consumibles' | 'driver';

@Component({
  selector: 'app-impresora-ficha',
  standalone: true,
  imports: [CommonModule, IfAdminDirective],
  templateUrl: './impresora-ficha.component.html',
  styleUrl: './impresora-ficha.component.scss',
})
export class ImpresoraFichaComponent {
  private service = inject(ImpresoraService);

  @Input({ required: true }) impresora!: Impresora;
  @Output() driverUpdated = new EventEmitter<Impresora>();

  activeTab: FichaTab = 'instalacion';

  setTab(tab: FichaTab): void {
    this.activeTab = tab;
  }

  downloadDriver(): void {
    this.service.downloadDriver(this.impresora.id).subscribe((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = this.impresora.driverNombre ?? 'driver';
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    this.service.uploadDriver(this.impresora.id, file).subscribe((updated) => {
      this.impresora = updated;
      this.driverUpdated.emit(updated);
    });
  }
}
```

Modify `soportedesk-frontend/src/app/features/impresoras/impresora-ficha.component.html`:
replace `<div class="upload" *ngIf="isAdmin">` with `<div class="upload" *ifAdmin>`.

Modify `soportedesk-frontend/src/app/features/impresoras/impresora-ficha.component.spec.ts`
(from Task 14): remove the `component.isAdmin = false;` line from the
`beforeEach`, and provide a stub `AuthService` so `IfAdminDirective` doesn't
throw. Add to the `TestBed.configureTestingModule` call:

```typescript
import { AuthService } from '../../core/auth/auth.service';

  await TestBed.configureTestingModule({
    imports: [ImpresoraFichaComponent, HttpClientTestingModule],
    providers: [{ provide: AuthService, useValue: { isAdmin: () => false } }],
  }).compileComponents();
```

Modify `soportedesk-frontend/src/app/features/impresoras/impresoras-list.component.html`
(from Task 14): remove the `[isAdmin]="isAdmin"` binding from
`<app-impresora-ficha>` since the `@Input` no longer exists:

```html
<app-impresora-ficha
  *ngIf="viewing"
  [impresora]="viewing"
  (driverUpdated)="onDriverUpdated($event)"
/>
```

- [ ] **Step 7: Add a catch-all redirect route**

Modify `soportedesk-frontend/src/app/app.routes.ts`: add as the last entry
in the top-level `routes` array (after the `ShellComponent` route and the
`/login` route):

```typescript
  {
    path: '**',
    redirectTo: 'dashboard',
  },
```

- [ ] **Step 8: Run full test suite**

Run: `cd soportedesk-frontend && npm test -- --watch=false`
Expected: all specs pass.

- [ ] **Step 9: Commit**

```bash
git add soportedesk-frontend/src/app/core/auth/if-admin.directive.ts soportedesk-frontend/src/app/core/auth/if-admin.directive.spec.ts soportedesk-frontend/src/app/layout/sidebar soportedesk-frontend/src/app/features/impresoras soportedesk-frontend/src/app/app.routes.ts
git commit -m "feat: add ifAdmin directive and catch-all route"
```
