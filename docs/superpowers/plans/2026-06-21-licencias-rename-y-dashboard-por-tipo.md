# Licencias: Rename + Dashboard "Licencias por Tipo" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename every remaining "Licencias Office" label to "Licencias", and add a new "Licencias por Tipo" bar chart to the Dashboard showing total license keys grouped by `TipoLicencia`.

**Architecture:** Part A is a pure text rename across 4 frontend files (no logic change). Part B mirrors the existing "Usuarios de Red por Ubicación" dashboard chart pattern end-to-end: a new JPQL aggregation query on `LicenciaRepository`, a new `LicenciaTipoCount` record, a new `DashboardService` method and `DashboardController` endpoint, and a new standalone Angular chart component wired into `DashboardComponent`.

**Tech Stack:** Spring Boot 3.2.5 / Java 17 / Spring Data JPA (JPQL `@Query`), Angular 17+ standalone components, `ng2-charts` (`BaseChartDirective`) / Chart.js, JUnit 5 + Mockito + AssertJ, Angular `TestBed` + `HttpClientTestingModule`.

## Global Constraints

- No expiration/vencimiento field exists on `Licencia` — do not introduce one or reference it.
- The new chart shows **total claves** (`SUM(cantidad)`), not order-of-purchase row counts — this is the user's explicit choice over the simpler "count of rows" option.
- The existing KPI card for "Licencias" (count of purchase orders) does **not** change — only its label text changes (Part A), not its value or data source.
- The new chart has **no toggle** (unlike "Usuarios de Red por Ubicación", which toggles sede/dependencia) — single dataset, single dimension (`TipoLicencia`).
- Bar color for the new chart: `#3b82f6`, dataset label: `'Claves'`, `indexAxis: 'y'` (horizontal bars), ordered by `SUM(cantidad)` descending (already sorted by the query — services/components must not re-sort).
- Follow existing file/test patterns exactly: `usuarios-red-por-ubicacion-chart.component.{ts,html,scss,spec.ts}` is the template for the new chart component; `UbicacionUsuariosCount` is the template for the new `LicenciaTipoCount` record's style (plain `record`, same package `com.inia.soportedesk.dashboard`).
- No browser/UI automation is available in this environment — final visual verification is the user's responsibility, not part of any task's automated test.

---

### Task 1: Rename "Licencias Office" → "Licencias" everywhere

**Files:**
- Modify: `soportedesk-frontend/src/app/layout/sidebar/sidebar.component.ts:61`
- Modify: `soportedesk-frontend/src/app/features/dashboard/dashboard.component.ts:58`
- Modify: `soportedesk-frontend/src/app/features/licencias/licencias-list.component.html:1`
- Modify: `soportedesk-frontend/src/app/features/usuarios-sistema/usuario-sistema.model.ts:26`

**Context:** A repo-wide case-insensitive search for `licencias office|licencias de office|licencias ofim` found exactly these 4 occurrences (the approved design doc named only the first 2; the other 2 — the Licencias page's own `<h2>` title and the system-user permissions module list — were found while writing this plan and are in scope of the user's request, since the request was to rename the module everywhere it still says "Office").

**Interfaces:**
- Consumes: nothing (pure string literals).
- Produces: nothing consumed by later tasks — Task 1 is independent of Task 2/3.

- [ ] **Step 1: Confirm the exact current occurrences**

Run: `grep -rn "Licencias Office" soportedesk-frontend/src`
Expected output (4 lines):
```
soportedesk-frontend/src/app/features/dashboard/dashboard.component.ts:58:      { label: 'Licencias Office',       value: counts.licencias,    path: '/licencias',    color: '#3b82f6', bg: '#eff6ff', icon: this.svg('key') },
soportedesk-frontend/src/app/features/licencias/licencias-list.component.html:1:<h2>Licencias Office</h2>
soportedesk-frontend/src/app/features/usuarios-sistema/usuario-sistema.model.ts:26:  { key: 'licencias',    label: 'Licencias Office' },
soportedesk-frontend/src/app/layout/sidebar/sidebar.component.ts:61:      { path: '/licencias',    label: 'Licencias Office',       icon: s.bypassSecurityTrustHtml(SVG_ICONS['key']) },
```

- [ ] **Step 2: Apply the 4 edits**

In `soportedesk-frontend/src/app/layout/sidebar/sidebar.component.ts:61`, change:
```typescript
      { path: '/licencias',    label: 'Licencias Office',       icon: s.bypassSecurityTrustHtml(SVG_ICONS['key']) },
```
to:
```typescript
      { path: '/licencias',    label: 'Licencias',       icon: s.bypassSecurityTrustHtml(SVG_ICONS['key']) },
```

In `soportedesk-frontend/src/app/features/dashboard/dashboard.component.ts:58`, change:
```typescript
      { label: 'Licencias Office',       value: counts.licencias,    path: '/licencias',    color: '#3b82f6', bg: '#eff6ff', icon: this.svg('key') },
```
to:
```typescript
      { label: 'Licencias',       value: counts.licencias,    path: '/licencias',    color: '#3b82f6', bg: '#eff6ff', icon: this.svg('key') },
```

In `soportedesk-frontend/src/app/features/licencias/licencias-list.component.html:1`, change:
```html
<h2>Licencias Office</h2>
```
to:
```html
<h2>Licencias</h2>
```

In `soportedesk-frontend/src/app/features/usuarios-sistema/usuario-sistema.model.ts:26`, change:
```typescript
  { key: 'licencias',    label: 'Licencias Office' },
```
to:
```typescript
  { key: 'licencias',    label: 'Licencias' },
```

- [ ] **Step 3: Verify no occurrences remain and the frontend still builds**

Run: `grep -rn "Licencias Office" soportedesk-frontend/src`
Expected output: (empty — no matches, exit code 1)

Run (from `soportedesk-frontend/`): `npx ng build`
Expected: `Application bundle generation complete.` (exit code 0). Pre-existing NG8107 optional-chaining warnings are unrelated and expected.

- [ ] **Step 4: Commit**

```bash
git add soportedesk-frontend/src/app/layout/sidebar/sidebar.component.ts soportedesk-frontend/src/app/features/dashboard/dashboard.component.ts soportedesk-frontend/src/app/features/licencias/licencias-list.component.html soportedesk-frontend/src/app/features/usuarios-sistema/usuario-sistema.model.ts
git commit -m "rename: Licencias Office -> Licencias across sidebar, dashboard, page title, and permisos list"
```

---

### Task 2: Backend — `licencias-por-tipo` aggregation endpoint

**Files:**
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/licencias/LicenciaRepository.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/dashboard/LicenciaTipoCount.java`
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/dashboard/DashboardService.java`
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/dashboard/DashboardController.java`
- Test: `soportedesk-backend/src/test/java/com/inia/soportedesk/dashboard/DashboardServiceTest.java`

**Interfaces:**
- Consumes: `Licencia.tipoLicencia` (`TipoLicencia` relation with a `nombre` field) and `Licencia.cantidad` (`Integer`) — both already exist, unchanged.
- Produces: `LicenciaRepository.sumCantidadGroupedByTipoLicencia(): List<Object[]>` (each row: `[String nombre, Long sumaCantidad]`, pre-sorted descending by sum), `LicenciaTipoCount(String nombre, long totalClaves)`, `DashboardService.licenciasPorTipo(): List<LicenciaTipoCount>`, and the `GET /api/dashboard/licencias-por-tipo` endpoint — Task 3's frontend service calls this exact path and expects this exact JSON shape (`[{"nombre": "...", "totalClaves": 0}, ...]`).

- [ ] **Step 1: Write the failing test in `DashboardServiceTest.java`**

`DashboardServiceTest` already lives in package `com.inia.soportedesk.dashboard`, the same package `LicenciaTipoCount` will be created in — no new import is needed.

Add this test method inside the `DashboardServiceTest` class, after `usuariosRedPorUbicacion_withInvalidOrNullNivel_defaultsToSede`:

```java
    @Test
    void licenciasPorTipo_sumsAndMapsRowsPreservingQueryOrder() {
        List<Object[]> rows = Arrays.<Object[]>asList(
                new Object[]{"Office", 450L},
                new Object[]{"Antivirus", 200L}
        );
        when(licenciaRepository.sumCantidadGroupedByTipoLicencia()).thenReturn(rows);

        List<LicenciaTipoCount> result = service.licenciasPorTipo();

        assertThat(result).containsExactly(
                new LicenciaTipoCount("Office", 450L),
                new LicenciaTipoCount("Antivirus", 200L)
        );
    }
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd soportedesk-backend && mvn test -Dtest=DashboardServiceTest`
Expected: compile error — `cannot find symbol: method sumCantidadGroupedByTipoLicencia()` (on `LicenciaRepository`) and/or `cannot find symbol: class LicenciaTipoCount` and `cannot find symbol: method licenciasPorTipo()` (on `DashboardService`).

- [ ] **Step 3: Create `LicenciaTipoCount.java`**

Create `soportedesk-backend/src/main/java/com/inia/soportedesk/dashboard/LicenciaTipoCount.java`:

```java
package com.inia.soportedesk.dashboard;

public record LicenciaTipoCount(String nombre, long totalClaves) {
}
```

- [ ] **Step 4: Add the aggregation query to `LicenciaRepository.java`**

In `soportedesk-backend/src/main/java/com/inia/soportedesk/licencias/LicenciaRepository.java`, add this method inside the `LicenciaRepository` interface, after the existing `search` method:

```java

    @Query("SELECT tl.nombre, SUM(l.cantidad) FROM Licencia l " +
           "JOIN l.tipoLicencia tl GROUP BY tl.nombre ORDER BY SUM(l.cantidad) DESC")
    List<Object[]> sumCantidadGroupedByTipoLicencia();
```

- [ ] **Step 5: Add `licenciasPorTipo()` to `DashboardService.java`**

In `soportedesk-backend/src/main/java/com/inia/soportedesk/dashboard/DashboardService.java`, add this method after `usuariosRedPorUbicacion`:

```java

    public List<LicenciaTipoCount> licenciasPorTipo() {
        return licenciaRepository.sumCantidadGroupedByTipoLicencia().stream()
                .map(row -> new LicenciaTipoCount((String) row[0], ((Number) row[1]).longValue()))
                .toList();
    }
```

- [ ] **Step 6: Add the endpoint to `DashboardController.java`**

In `soportedesk-backend/src/main/java/com/inia/soportedesk/dashboard/DashboardController.java`, add this method after `usuariosRedPorUbicacion`:

```java

    @GetMapping("/licencias-por-tipo")
    public List<LicenciaTipoCount> licenciasPorTipo() {
        return service.licenciasPorTipo();
    }
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `cd soportedesk-backend && mvn test -Dtest=DashboardServiceTest`
Expected: `Tests run: 5, Failures: 0, Errors: 0` (4 pre-existing tests + the new one), `BUILD SUCCESS`.

- [ ] **Step 8: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/licencias/LicenciaRepository.java soportedesk-backend/src/main/java/com/inia/soportedesk/dashboard/LicenciaTipoCount.java soportedesk-backend/src/main/java/com/inia/soportedesk/dashboard/DashboardService.java soportedesk-backend/src/main/java/com/inia/soportedesk/dashboard/DashboardController.java soportedesk-backend/src/test/java/com/inia/soportedesk/dashboard/DashboardServiceTest.java
git commit -m "feat: add GET /api/dashboard/licencias-por-tipo aggregation endpoint"
```

---

### Task 3: Frontend — "Licencias por Tipo" chart on the Dashboard

**Files:**
- Create: `soportedesk-frontend/src/app/features/dashboard/licencia-tipo-count.model.ts`
- Modify: `soportedesk-frontend/src/app/features/dashboard/dashboard.service.ts`
- Create: `soportedesk-frontend/src/app/features/dashboard/licencias-por-tipo-chart.component.ts`
- Create: `soportedesk-frontend/src/app/features/dashboard/licencias-por-tipo-chart.component.html`
- Create: `soportedesk-frontend/src/app/features/dashboard/licencias-por-tipo-chart.component.scss`
- Test: `soportedesk-frontend/src/app/features/dashboard/licencias-por-tipo-chart.component.spec.ts`
- Modify: `soportedesk-frontend/src/app/features/dashboard/dashboard.component.ts`
- Modify: `soportedesk-frontend/src/app/features/dashboard/dashboard.component.html`

**Interfaces:**
- Consumes: `GET /api/dashboard/licencias-por-tipo` from Task 2, returning JSON `[{"nombre": string, "totalClaves": number}, ...]`.
- Produces: `LicenciaTipoCount` TypeScript interface (`{ nombre: string; totalClaves: number }`), `DashboardService.getLicenciasPorTipo(): Observable<LicenciaTipoCount[]>`, `<app-licencias-por-tipo-chart>` selector mounted in `DashboardComponent`'s template — nothing later depends on this task.

- [ ] **Step 1: Write the failing test for the new chart component**

Create `soportedesk-frontend/src/app/features/dashboard/licencias-por-tipo-chart.component.spec.ts`:

```typescript
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { LicenciasPorTipoChartComponent } from './licencias-por-tipo-chart.component';

describe('LicenciasPorTipoChartComponent', () => {
  let httpMock: HttpTestingController;
  let component: LicenciasPorTipoChartComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    httpMock = TestBed.inject(HttpTestingController);
    component = TestBed.runInInjectionContext(() => new LicenciasPorTipoChartComponent());
  });

  afterEach(() => httpMock.verify());

  it('requests licencias-por-tipo data on init and populates the chart', () => {
    component.ngOnInit();

    const req = httpMock.expectOne((r) => r.url.endsWith('/licencias-por-tipo'));
    req.flush([
      { nombre: 'Office', totalClaves: 450 },
      { nombre: 'Antivirus', totalClaves: 200 },
    ]);

    expect(component.chartData.labels).toEqual(['Office', 'Antivirus']);
    expect(component.chartData.datasets[0].data).toEqual([450, 200]);
  });

  it('flags an error when the request fails, without throwing', () => {
    component.ngOnInit();

    httpMock
      .expectOne((r) => r.url.endsWith('/licencias-por-tipo'))
      .flush('error', { status: 500, statusText: 'Server Error' });

    expect(component.error).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd soportedesk-frontend && npx ng test --watch=false --include='**/licencias-por-tipo-chart.component.spec.ts'`
Expected: FAIL — `Cannot find module './licencias-por-tipo-chart.component'`.

- [ ] **Step 3: Create the model**

Create `soportedesk-frontend/src/app/features/dashboard/licencia-tipo-count.model.ts`:

```typescript
export interface LicenciaTipoCount {
  nombre: string;
  totalClaves: number;
}
```

- [ ] **Step 4: Add the service method**

In `soportedesk-frontend/src/app/features/dashboard/dashboard.service.ts`, add this import alongside the existing model import:

```typescript
import { LicenciaTipoCount } from './licencia-tipo-count.model';
```

Add this method inside the `DashboardService` class, after `getUsuariosRedPorUbicacion`:

```typescript

  getLicenciasPorTipo(): Observable<LicenciaTipoCount[]> {
    return this.http.get<LicenciaTipoCount[]>(`${this.apiUrl}/licencias-por-tipo`);
  }
```

- [ ] **Step 5: Create the chart component**

Create `soportedesk-frontend/src/app/features/dashboard/licencias-por-tipo-chart.component.ts`:

```typescript
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartConfiguration, ChartData } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { DashboardService } from './dashboard.service';
import { LicenciaTipoCount } from './licencia-tipo-count.model';

@Component({
  selector: 'app-licencias-por-tipo-chart',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './licencias-por-tipo-chart.component.html',
  styleUrl: './licencias-por-tipo-chart.component.scss',
})
export class LicenciasPorTipoChartComponent implements OnInit {
  private dashboardService = inject(DashboardService);

  error = false;

  chartData: ChartData<'bar', number[], string> = {
    labels: [],
    datasets: [{ data: [], label: 'Claves', backgroundColor: '#3b82f6' }],
  };

  chartOptions: ChartConfiguration<'bar'>['options'] = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { x: { beginAtZero: true } },
  };

  ngOnInit(): void {
    this.dashboardService.getLicenciasPorTipo().subscribe({
      next: (rows) => this.applyData(rows),
      error: () => (this.error = true),
    });
  }

  private applyData(rows: LicenciaTipoCount[]): void {
    this.chartData = {
      labels: rows.map((r) => r.nombre),
      datasets: [{ data: rows.map((r) => r.totalClaves), label: 'Claves', backgroundColor: '#3b82f6' }],
    };
  }
}
```

- [ ] **Step 6: Create the template**

Create `soportedesk-frontend/src/app/features/dashboard/licencias-por-tipo-chart.component.html`:

```html
<div class="chart-card">
  <div class="chart-header">
    <h3>Licencias por Tipo</h3>
  </div>

  <div class="chart-body" *ngIf="!error">
    <canvas baseChart [data]="chartData" [options]="chartOptions" type="bar"></canvas>
  </div>
  <p class="chart-error" *ngIf="error">No se pudo cargar el gráfico</p>
</div>
```

- [ ] **Step 7: Create the stylesheet**

Create `soportedesk-frontend/src/app/features/dashboard/licencias-por-tipo-chart.component.scss`:

```scss
.chart-card {
  margin-top: 24px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 20px;
  box-shadow: var(--shadow-sm);
}

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;

  h3 {
    font-size: 15px;
    font-weight: 700;
    margin: 0;
    color: var(--color-text);
  }
}

.chart-body {
  height: 360px;
}

.chart-error {
  margin: 0;
  padding: 32px 0;
  text-align: center;
  color: var(--color-text-muted);
  font-size: 13px;
}
```

- [ ] **Step 8: Run the test to verify it passes**

Run: `cd soportedesk-frontend && npx ng test --watch=false --include='**/licencias-por-tipo-chart.component.spec.ts'`
Expected: `TOTAL: 2 SUCCESS`.

- [ ] **Step 9: Wire the chart into the Dashboard**

In `soportedesk-frontend/src/app/features/dashboard/dashboard.component.ts`, add this import after the existing `UsuariosRedPorUbicacionChartComponent` import:

```typescript
import { LicenciasPorTipoChartComponent } from './licencias-por-tipo-chart.component';
```

Update the `@Component` decorator's `imports` array from:
```typescript
  imports: [CommonModule, RouterLink, UsuariosRedPorUbicacionChartComponent],
```
to:
```typescript
  imports: [CommonModule, RouterLink, UsuariosRedPorUbicacionChartComponent, LicenciasPorTipoChartComponent],
```

In `soportedesk-frontend/src/app/features/dashboard/dashboard.component.html`, change:
```html
  <app-usuarios-red-por-ubicacion-chart />
```
to:
```html
  <app-usuarios-red-por-ubicacion-chart />

  <app-licencias-por-tipo-chart />
```

- [ ] **Step 10: Run the full frontend test suite and build**

Run: `cd soportedesk-frontend && npx ng test --watch=false`
Expected: all suites pass, including `DashboardComponent` and the new `LicenciasPorTipoChartComponent` specs — `0 failed`.

Run: `npx ng build`
Expected: `Application bundle generation complete.` (exit code 0).

- [ ] **Step 11: Commit**

```bash
git add soportedesk-frontend/src/app/features/dashboard/licencia-tipo-count.model.ts soportedesk-frontend/src/app/features/dashboard/dashboard.service.ts soportedesk-frontend/src/app/features/dashboard/licencias-por-tipo-chart.component.ts soportedesk-frontend/src/app/features/dashboard/licencias-por-tipo-chart.component.html soportedesk-frontend/src/app/features/dashboard/licencias-por-tipo-chart.component.scss soportedesk-frontend/src/app/features/dashboard/licencias-por-tipo-chart.component.spec.ts soportedesk-frontend/src/app/features/dashboard/dashboard.component.ts soportedesk-frontend/src/app/features/dashboard/dashboard.component.html
git commit -m "feat: add Licencias por Tipo chart to the dashboard"
```
