# VPN Solicitudes Tab (Encargados) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give VPN aprobadores a dedicated "Solicitudes" tab inside the VPN module with KPI cards (Pendientes/Aprobadas/Rechazadas/Observadas) that filter the existing table on click, reusing the equipos module's tab-toggle + kpi-grid pattern.

**Architecture:** One new backend endpoint (`GET /api/vpn/kpis`) backed by the existing `VpnRepository.countByEstadoSolicitud`. Frontend adds a tab-toggle to `vpn-list.component`, a KPI card row visible only in the new tab, and a `displayedItems` getter that the existing `<app-generic-table>` binds to instead of `items` — no new table, no new modal, no backend query per filter click (client-side filtering over already-loaded data).

**Tech Stack:** Spring Boot 3 / Java, Angular 17+ standalone components, JUnit + Mockito + MockMvc (backend), Karma/Jasmine (frontend).

## Global Constraints

- Reuse the exact CSS classes/markup already defined in `soportedesk-frontend/src/app/features/equipos/equipos-list.component.scss:1-88` and `equipos-list.component.html:1-17` (`.tab-toggle`, `.kpi-grid`, `.kpi-card`, `.tone-*`, `.alert-count`) — do not invent a parallel styling system.
- `vpn-list.component.ts` uses plain class fields/methods (not Angular signals) — stay consistent with that style; do not migrate the file to signals as part of this work.
- `*ControllerIT` tests run under Maven's `verify`/`integration-test` phase (Failsafe), not the default `test` phase (Surefire) — use `mvn verify -Dit.test=<Class>` to run one, plain `mvn test -Dtest=<Class>` only for non-`IT` unit tests.
- Full spec: `docs/superpowers/specs/2026-07-07-vpn-solicitudes-tab-encargados-design.md`.

---

## Task 1: Backend — `VpnKpisDto` + `VpnService.getKpis()` + `GET /api/vpn/kpis`

**Files:**
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/vpn/VpnKpisDto.java`
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/vpn/VpnService.java`
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/vpn/VpnController.java`
- Modify: `soportedesk-backend/src/test/java/com/inia/soportedesk/vpn/VpnServiceTest.java`
- Modify: `soportedesk-backend/src/test/java/com/inia/soportedesk/vpn/VpnControllerIT.java`

**Interfaces:**
- Consumes: `VpnRepository.countByEstadoSolicitud(String): long` (already exists, added in the prior VPN redesign — `soportedesk-backend/src/main/java/com/inia/soportedesk/vpn/VpnRepository.java`).
- Produces: `VpnKpisDto(pendientes: long, aprobadas: long, rechazadas: long, observadas: long)`, `VpnService.getKpis(): VpnKpisDto`, `GET /api/vpn/kpis` — consumed by Task 2's frontend service.

- [ ] **Step 1: Write the failing test in `VpnServiceTest.java`**

Add this test method inside the existing `VpnServiceTest` class (after `findById_whenNotFound_throwsResourceNotFoundException`):

```java
    @Test
    void getKpis_countsEachEstadoSolicitud() {
        when(repository.countByEstadoSolicitud("PENDIENTE")).thenReturn(3L);
        when(repository.countByEstadoSolicitud("APROBADO")).thenReturn(10L);
        when(repository.countByEstadoSolicitud("RECHAZADO")).thenReturn(2L);
        when(repository.countByEstadoSolicitud("OBSERVADO")).thenReturn(1L);

        VpnKpisDto result = service.getKpis();

        assertThat(result.pendientes()).isEqualTo(3L);
        assertThat(result.aprobadas()).isEqualTo(10L);
        assertThat(result.rechazadas()).isEqualTo(2L);
        assertThat(result.observadas()).isEqualTo(1L);
    }
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd soportedesk-backend && mvn test -Dtest=VpnServiceTest -q`
Expected: COMPILE FAILURE — `VpnKpisDto` doesn't exist yet and `VpnService.getKpis()` isn't defined.

- [ ] **Step 3: Create `VpnKpisDto.java`**

```java
package com.inia.soportedesk.vpn;

public record VpnKpisDto(
        long pendientes,
        long aprobadas,
        long rechazadas,
        long observadas
) {
}
```

- [ ] **Step 4: Add `getKpis()` to `VpnService.java`**

Add this public method anywhere among the other public methods (e.g., right after `findAll`):

```java
    public VpnKpisDto getKpis() {
        return new VpnKpisDto(
                repository.countByEstadoSolicitud("PENDIENTE"),
                repository.countByEstadoSolicitud("APROBADO"),
                repository.countByEstadoSolicitud("RECHAZADO"),
                repository.countByEstadoSolicitud("OBSERVADO")
        );
    }
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd soportedesk-backend && mvn test -Dtest=VpnServiceTest -q`
Expected: PASS (this will still show a compile error from `VpnController.java` referencing nothing new yet — no, `VpnController.java` is untouched until Step 6, so this should compile and pass cleanly)

- [ ] **Step 6: Add the endpoint to `VpnController.java`**

Add this method inside the `VpnController` class, right after the existing `findById` method:

```java
    @GetMapping("/kpis")
    @PreAuthorize(CAN_VIEW)
    public VpnKpisDto getKpis() {
        return service.getKpis();
    }
```

(`CAN_VIEW` is the existing `private static final String CAN_VIEW = "hasRole('ADMIN') || hasAnyAuthority('READ_vpn','WRITE_vpn','READ_solicitar-vpn','WRITE_solicitar-vpn','READ_aprobar-vpn','WRITE_aprobar-vpn')";` constant already declared in this file — reuse it, don't redeclare.)

- [ ] **Step 7: Write the authorization test in `VpnControllerIT.java`**

Add these two test methods inside the existing `VpnControllerIT` class (near `findAll_withReadAuthority_allowsUser`):

```java
    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "READ_vpn"})
    void getKpis_withReadAuthority_returnsOk() throws Exception {
        when(service.getKpis()).thenReturn(new VpnKpisDto(3, 10, 2, 1));

        mockMvc.perform(get("/api/vpn/kpis"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pendientes", is(3)))
                .andExpect(jsonPath("$.aprobadas", is(10)));
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void getKpis_withoutAnyReadAuthority_returnsForbidden() throws Exception {
        mockMvc.perform(get("/api/vpn/kpis"))
                .andExpect(status().isForbidden());
    }
```

- [ ] **Step 8: Run the IT test to verify it passes**

Run: `cd soportedesk-backend && mvn verify -Dit.test=VpnControllerIT -q`
Expected: PASS

- [ ] **Step 9: Run the full backend suite**

Run: `cd soportedesk-backend && mvn verify -q`
Expected: BUILD SUCCESS

- [ ] **Step 10: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/vpn/VpnKpisDto.java \
        soportedesk-backend/src/main/java/com/inia/soportedesk/vpn/VpnService.java \
        soportedesk-backend/src/main/java/com/inia/soportedesk/vpn/VpnController.java \
        soportedesk-backend/src/test/java/com/inia/soportedesk/vpn/VpnServiceTest.java \
        soportedesk-backend/src/test/java/com/inia/soportedesk/vpn/VpnControllerIT.java
git commit -m "feat(vpn): add GET /api/vpn/kpis for solicitud counts by estado"
```

---

## Task 2: Frontend — `VpnKpis` model + service method

**Files:**
- Modify: `soportedesk-frontend/src/app/features/vpn/vpn.model.ts`
- Modify: `soportedesk-frontend/src/app/features/vpn/vpn.service.ts`

**Interfaces:**
- Consumes: `GET /api/vpn/kpis` (Task 1).
- Produces: `VpnKpis` interface (`pendientes/aprobadas/rechazadas/observadas: number`), `VpnService.getKpis(): Observable<VpnKpis>` — consumed by Task 3's `vpn-list.component.ts`.

There's no dedicated `.spec.ts` for `vpn.model.ts`/`vpn.service.ts` in this codebase — verified by TypeScript compilation and Task 3's usage.

- [ ] **Step 1: Add the interface to `vpn.model.ts`**

Append at the end of the file:

```typescript
export interface VpnKpis {
  pendientes: number;
  aprobadas: number;
  rechazadas: number;
  observadas: number;
}
```

- [ ] **Step 2: Add the method to `vpn.service.ts`**

Add this method inside the `VpnService` class, after `getAll`:

```typescript
  getKpis(): Observable<VpnKpis> {
    return this.http.get<VpnKpis>(`${this.apiUrl}/kpis`);
  }
```

Add `VpnKpis` to the existing import from `./vpn.model` at the top of the file (it currently imports `Vpn, VpnAntivirusRequest, VpnAprobarRequest, VpnResolucionRequest, VpnSolicitudRequest` — add `VpnKpis` to that list).

- [ ] **Step 3: Compile-check**

Run: `cd soportedesk-frontend && npx tsc --noEmit -p tsconfig.app.json`
Expected: no errors (nothing calls `getKpis()` yet, but the method itself must type-check).

- [ ] **Step 4: Commit**

```bash
git add soportedesk-frontend/src/app/features/vpn/vpn.model.ts \
        soportedesk-frontend/src/app/features/vpn/vpn.service.ts
git commit -m "feat(vpn): add VpnKpis model and VpnService.getKpis()"
```

---

## Task 3: Frontend — tab-toggle, KPI cards, and click-to-filter in `vpn-list.component`

**Files:**
- Modify: `soportedesk-frontend/src/app/features/vpn/vpn-list.component.ts`
- Modify: `soportedesk-frontend/src/app/features/vpn/vpn-list.component.html`
- Modify: `soportedesk-frontend/src/app/features/vpn/vpn-list.component.scss`

**Interfaces:**
- Consumes: `VpnService.getKpis()` (Task 2), `VpnKpis` (Task 2).
- Produces: `activeTab: 'todas' | 'solicitudes'`, `kpis: VpnKpis | null`, `solicitudFiltro: EstadoSolicitud | null`, `displayedItems: Vpn[]` (getter), `kpiCards: {label, value, estado, tone}[]` (getter), `setTab(tab)`, `setFiltro(estado)` — this is the final task, nothing downstream depends on these names.

No dedicated `.spec.ts` exists for `vpn-list.component` — verified via `ng build` (Angular's strict template type-checking) plus the manual check in Step 6.

- [ ] **Step 1: Add the tab/KPI/filter state and logic to `vpn-list.component.ts`**

Add this type alias right after the existing `const EDITABLE_STATES = new Set(['PENDIENTE', 'OBSERVADO']);` line:

```typescript
type VpnTab = 'todas' | 'solicitudes';
type EstadoSolicitud = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'OBSERVADO';
```

Add `VpnKpis` to the existing `import { Vpn } from './vpn.model';` line (change it to `import { Vpn, VpnKpis } from './vpn.model';`).

Inside the `VpnListComponent` class, add these fields right after `items: Vpn[] = [];`:

```typescript
  activeTab: VpnTab = 'todas';
  kpis: VpnKpis | null = null;
  solicitudFiltro: EstadoSolicitud | null = null;
```

Add these getters right after the existing `canEditCredenciales` getter:

```typescript
  get displayedItems(): Vpn[] {
    if (this.activeTab !== 'solicitudes' || !this.solicitudFiltro) return this.items;
    return this.items.filter((v) => v.estadoSolicitud === this.solicitudFiltro);
  }

  get kpiCards(): { label: string; value: number; estado: EstadoSolicitud; tone: string }[] {
    const k = this.kpis;
    return [
      { label: 'Pendientes', value: k?.pendientes ?? 0, estado: 'PENDIENTE', tone: 'orange' },
      { label: 'Aprobadas', value: k?.aprobadas ?? 0, estado: 'APROBADO', tone: 'green' },
      { label: 'Rechazadas', value: k?.rechazadas ?? 0, estado: 'RECHAZADO', tone: 'red' },
      { label: 'Observadas', value: k?.observadas ?? 0, estado: 'OBSERVADO', tone: 'yellow' },
    ];
  }
```

Change `ngOnInit` from:

```typescript
  ngOnInit(): void {
    this.load();
  }
```

to:

```typescript
  ngOnInit(): void {
    this.load();
    this.loadKpis();
  }
```

Add these two methods right after `onSearch`:

```typescript
  setTab(tab: VpnTab): void {
    this.activeTab = tab;
  }

  setFiltro(estado: EstadoSolicitud): void {
    this.solicitudFiltro = this.solicitudFiltro === estado ? null : estado;
  }

  loadKpis(): void {
    this.service.getKpis().subscribe((data) => (this.kpis = data));
  }
```

Update `onSaved`, `onAprobarSaved`, and `onResolucionSaved` to also refresh the KPI counts — change each from:

```typescript
  onSaved(): void {
    this.formOpen = false;
    this.load();
  }
```
```typescript
  onAprobarSaved(): void {
    this.aprobarOpen = false;
    this.load();
  }
```
```typescript
  onResolucionSaved(): void {
    this.resolucionOpen = false;
    this.load();
  }
```

to:

```typescript
  onSaved(): void {
    this.formOpen = false;
    this.load();
    this.loadKpis();
  }
```
```typescript
  onAprobarSaved(): void {
    this.aprobarOpen = false;
    this.load();
    this.loadKpis();
  }
```
```typescript
  onResolucionSaved(): void {
    this.resolucionOpen = false;
    this.load();
    this.loadKpis();
  }
```

- [ ] **Step 2: Add the tab-toggle and KPI cards to `vpn-list.component.html`**

The current file starts with:

```html
<div class="module-page vpn-page">
  <div class="module-header">
    <div>
      <span class="module-eyebrow">Acceso remoto</span>
      <h2>VPN</h2>
      <p>Solicitudes, verificaciones de seguridad y credenciales de acceso remoto.</p>
    </div>
  </div>

  <app-generic-table
    [columns]="columns"
    [data]="items"
    [canEdit]="canWriteSolicitar"
```

Replace it with (adds the tab-toggle inside `.module-header`, a KPI card section right after it, and changes `[data]="items"` to `[data]="displayedItems"`):

```html
<div class="module-page vpn-page">
  <div class="module-header">
    <div>
      <span class="module-eyebrow">Acceso remoto</span>
      <h2>VPN</h2>
      <p>Solicitudes, verificaciones de seguridad y credenciales de acceso remoto.</p>
    </div>
    <div class="tab-toggle" *ngIf="canWriteAprobar">
      <button type="button" [class.active]="activeTab === 'todas'" (click)="setTab('todas')">
        Todas
      </button>
      <button type="button" [class.active]="activeTab === 'solicitudes'"
        (click)="setTab('solicitudes')"
        [class.has-alert]="(kpis?.pendientes ?? 0) > 0">
        Solicitudes
        <span class="alert-count" *ngIf="(kpis?.pendientes ?? 0) > 0">{{ kpis?.pendientes }}</span>
      </button>
    </div>
  </div>

  <section class="kpi-grid" *ngIf="activeTab === 'solicitudes'">
    <article *ngFor="let card of kpiCards" class="kpi-card" [class]="'tone-' + card.tone"
      [class.kpi-card--active]="solicitudFiltro === card.estado"
      (click)="setFiltro(card.estado)">
      <span>{{ card.label }}</span>
      <strong>{{ card.value }}</strong>
    </article>
  </section>

  <app-generic-table
    [columns]="columns"
    [data]="displayedItems"
    [canEdit]="canWriteSolicitar"
```

Leave everything else in the file (the rest of `<app-generic-table>`, the `ng-template #extraCell`, and all the `<app-modal>` blocks below) exactly as-is.

- [ ] **Step 3: Add the KPI/tab styles to `vpn-list.component.scss`**

The current file is:

```scss
.vpn-page {
  --color-accent: var(--color-vpn);
  --color-accent-hover: #dc2626;
}

.badge-estado {
  ...
}
```

Insert this block right after the `.vpn-page { ... }` rule and before `.badge-estado`:

```scss
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

.kpi-card {
  border: 1px solid #e2e8f0;
  border-left: 4px solid var(--tone);
  border-radius: 8px;
  padding: 14px 16px;
  background: #fff;
  cursor: pointer;
}

.kpi-card span {
  display: block;
  color: #64748b;
  font-size: 0.82rem;
  margin-bottom: 8px;
}

.kpi-card strong {
  color: #0f172a;
  font-size: 1.55rem;
}

.kpi-card--active {
  outline: 2px solid var(--tone);
  outline-offset: -1px;
}

.tone-orange { --tone: #f97316; }
.tone-green { --tone: #16a34a; }
.tone-red { --tone: #dc2626; }
.tone-yellow { --tone: #d97706; }

.tab-toggle {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-shrink: 0;
}

.tab-toggle button {
  position: relative;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 8px 14px;
  background: #f8fafc;
  color: #475569;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 7px;
}

.tab-toggle button.active {
  background: var(--color-accent, #16a34a);
  color: #fff;
  border-color: transparent;
}

.tab-toggle button.has-alert:not(.active) {
  border-color: #fbbf24;
}

.alert-count {
  background: #dc2626;
  color: #fff;
  border-radius: 999px;
  padding: 1px 7px;
  font-size: 0.75rem;
  font-weight: 800;
}
```

No extra `.module-header` layout rule is needed here: that selector is already styled globally (flex, `justify-content: space-between`, `flex-wrap: wrap`) and every other module using the tab-toggle pattern (e.g. `equipos-list.component.scss`) relies on the same global rule without a local override — do the same.

- [ ] **Step 4: Compile-check**

Run: `cd soportedesk-frontend && npx tsc --noEmit -p tsconfig.app.json`
Expected: no errors.

- [ ] **Step 5: Build to catch template errors**

Run: `cd soportedesk-frontend && npx ng build 2>&1 | grep -iE "error|Application bundle"`
Expected: `Application bundle generation complete.` with no `error` lines.

- [ ] **Step 6: Manual verification**

With both backend and frontend running (see Task 4), log in as a user with `aprobar-vpn` (or ADMIN), open `/vpn`, and confirm:
1. The "Todas"/"Solicitudes" tab-toggle appears in the module header.
2. "Solicitudes" shows a red badge with the pending count if there are any pending solicitudes.
3. Clicking "Solicitudes" reveals 4 KPI cards (Pendientes/Aprobadas/Rechazadas/Observadas) with correct counts, and the table below still shows all rows (no filter active yet).
4. Clicking the "Pendientes" card filters the table to only `PENDIENTE` rows; clicking it again removes the filter.
5. Approving/rejecting/observing a solicitud (via the existing detail-modal actions) updates the KPI counts and the tab badge without a page reload.
6. Logging in as a user without `aprobar-vpn` (and not ADMIN) shows no tab-toggle at all — just the table, as before.

Report which of these six checks you observed and what you saw — don't claim this task complete without having actually looked.

- [ ] **Step 7: Commit**

```bash
git add soportedesk-frontend/src/app/features/vpn/vpn-list.component.ts \
        soportedesk-frontend/src/app/features/vpn/vpn-list.component.html \
        soportedesk-frontend/src/app/features/vpn/vpn-list.component.scss
git commit -m "feat(vpn): add Solicitudes tab with KPI cards and click-to-filter for aprobadores"
```

---

## Task 4: Full verification pass

**Files:** none (verification only)

- [ ] **Step 1: Run the full backend test suite**

Run: `cd soportedesk-backend && mvn verify -q`
Expected: BUILD SUCCESS.

- [ ] **Step 2: Run the full frontend test suite**

Run: `cd soportedesk-frontend && npx ng test --watch=false --browsers=ChromeHeadless`
Expected: all existing specs still PASS (no new specs were added in this plan — verify nothing regressed).

- [ ] **Step 3: Build the frontend**

Run: `cd soportedesk-frontend && npx ng build`
Expected: `Application bundle generation complete.` with no errors.

- [ ] **Step 4: Restart both dev servers and confirm the manual check from Task 3 Step 6 still holds**

If the backend jar or `ng serve` process from the previous VPN feature work is still running, restart both so they pick up this task's changes (kill the process on the port, rebuild/repackage, relaunch), then repeat Task 3 Step 6's six-point manual check and report results.
