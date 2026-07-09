# Módulo Impresoras — Rediseño en 3 caras — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the single Impresoras page into 3 routed tabs — Consultas (read-only browse), Administración (existing CRUD, write-gated), Dashboard (new analytics) — mirroring the AD redesign exactly, since Impresoras shares AD's single flat permission model (`impresoras`, not VPN's split authorities).

**Architecture:** New `ImpresorasShellComponent` owns the tab nav + `<router-outlet>`, gating Administración/Dashboard tabs client-side on `canWrite('impresoras')` (route guards enforce it server-side too via `moduloGuard`). A new shared `ImpresorasListViewComponent` (filters + table + mobile cards + consumibles panel) is reused by Consultas (`canManage=false`) and Administración (`canManage=true`) to avoid duplicating ~250 lines of template. `ImpresoraFichaComponent` gets a new `@Input allowActions` so Consultas can force read-only regardless of the viewer's actual permission. Backend gets one new aggregation endpoint mirroring AD/VPN/Correos' `dashboard/completo` pattern.

**Tech Stack:** Angular 17+ standalone components, Spring Boot 3 / Spring Security `@PreAuthorize`, `ng2-charts`, existing shared components (`app-generic-table`, `app-status-badge`, `app-modal`, `app-section-card`).

## Global Constraints

- Follow the spec exactly: `docs/superpowers/specs/2026-07-09-modulo-impresoras-tres-caras-design.md`.
- Reuse global CSS (already correctly used in `impresoras-list.component.scss` — this module needs the LEAST visual rework of the four redesigned so far) and `--color-impresoras`/`--color-impresoras-light` tokens.
- Do not change `ImpresoraFormComponent`, the delete-confirm modal, or any existing create/update/delete logic.
- Consumibles panel (`impresora-resumen.component.ts`) stays in Consultas unchanged.
- `ImpresoraFichaComponent`'s new `allowActions` input must be explicit (parent-controlled), not derived from `canWrite` — Consultas always passes `false` regardless of the viewer's real permission (same principle as AD's `ad-user-detail.component.ts` `showManage` input).

---

## File Structure

**Backend (`soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/`):**
- Create: `ImpresoraMarcaCount.java`, `ImpresoraSedeCount.java`, `ImpresoraConsumibleCount.java`, `ImpresoraDashboardCompleto.java`.
- Modify: `ImpresoraService.java` — add `public ImpresoraDashboardCompleto getDashboardCompleto()`.
- Modify: `ImpresoraController.java` — add `GET /dashboard/completo`.
- Modify (test): `ImpresoraServiceTest.java`, `ImpresoraControllerIT.java`.

**Frontend (`soportedesk-frontend/src/app/features/impresoras/`):**
- Modify: `impresora.model.ts` — add `ImpresoraMarcaCount`, `ImpresoraSedeCount`, `ImpresoraConsumibleCount`, `ImpresoraDashboardCompleto`.
- Modify: `impresora.service.ts` — add `getDashboardCompleto()`.
- Modify: `impresora-ficha.component.ts`/`.html` — add `@Input allowActions = true`.
- Modify: `impresora-ficha.component.spec.ts` — add coverage for `allowActions`.
- Rename+adapt: `impresoras-list.component.scss` → `impresoras.shared.scss` (append `.ad-tabs`/dashboard classes, everything else unchanged).
- Create: `impresoras-shell.component.ts`.
- Create: `impresoras-list-view.component.ts` + `.html` (extracted from `impresoras-list.component.html`, the filters/table/mobile-list/consumibles block).
- Create: `impresoras-consultas.component.ts`.
- Create: `impresoras-administracion.component.ts` (keeps the 3 stat-pills, matching AD/VPN's Administración precedent).
- Create: `impresoras-dashboard.component.ts`.
- Create: `impresoras-consultas.component.spec.ts`, `impresoras-administracion.component.spec.ts` (port the 2 tests from the retired spec).
- Delete: `impresoras-list.component.ts`, `impresoras-list.component.html`, `impresoras-list.component.scss`, `impresoras-list.component.spec.ts`.
- Modify: `src/app/app.routes.ts` — replace the single `impresoras` route with a shell + children block (reuses existing `moduloGuard`, no new guard).

---

### Task 1: Backend — Dashboard DTOs

**Files:**
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/ImpresoraMarcaCount.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/ImpresoraSedeCount.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/ImpresoraConsumibleCount.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/ImpresoraDashboardCompleto.java`

- [ ] **Step 1: Create the four records**

```java
package com.inia.soportedesk.impresoras;

public record ImpresoraMarcaCount(String marca, long total) {
}
```

```java
package com.inia.soportedesk.impresoras;

public record ImpresoraSedeCount(String sede, long total) {
}
```

```java
package com.inia.soportedesk.impresoras;

public record ImpresoraConsumibleCount(String color, String variante, String codigo, long cantidad) {
}
```

```java
package com.inia.soportedesk.impresoras;

import java.util.List;

public record ImpresoraDashboardCompleto(
        long total,
        long activas,
        long enMantenimiento,
        long deBaja,
        List<ImpresoraMarcaCount> distribucionPorMarca,
        List<ImpresoraSedeCount> distribucionPorSede,
        List<ImpresoraConsumibleCount> topConsumibles,
        long totalConsumiblesDistintos
) {
}
```

- [ ] **Step 2: Compile**

Run: `mvn -o compile` from `soportedesk-backend/`
Expected: BUILD SUCCESS

- [ ] **Step 3: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/ImpresoraMarcaCount.java soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/ImpresoraSedeCount.java soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/ImpresoraConsumibleCount.java soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/ImpresoraDashboardCompleto.java
git commit -m "feat(impresoras): add dashboard aggregation DTOs"
```

---

### Task 2: Backend — `ImpresoraService.getDashboardCompleto()` + endpoint

**Files:**
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/ImpresoraService.java`
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/ImpresoraController.java`
- Modify: `soportedesk-backend/src/test/java/com/inia/soportedesk/impresoras/ImpresoraServiceTest.java`
- Modify: `soportedesk-backend/src/test/java/com/inia/soportedesk/impresoras/ImpresoraControllerIT.java`

- [ ] **Step 1: Write the failing service unit test**

Add to `ImpresoraServiceTest.java` (reuses the file's existing `modeloImpresora()` helper for marca "HP"; add a second brand inline):

```java
    @Test
    void getDashboardCompleto_aggregatesCountsDistributionAndConsumibles() {
        com.inia.soportedesk.catalogo.MarcaImpresora canon = new com.inia.soportedesk.catalogo.MarcaImpresora();
        canon.setId(2L);
        canon.setNombre("Canon");

        ModeloImpresora modeloHp = modeloImpresora();
        modeloHp.setToners(List.of(toner(modeloHp, "Negro", "Estandar", "TN-2380")));

        ModeloImpresora modeloCanon = new ModeloImpresora();
        modeloCanon.setId(2L);
        modeloCanon.setMarca(canon);
        modeloCanon.setNombre("LBP2900");
        modeloCanon.setToners(List.of(toner(modeloCanon, "Negro", "Estandar", "TN-2380")));

        com.inia.soportedesk.catalogo.Sede central = new com.inia.soportedesk.catalogo.Sede();
        central.setId(1L);
        central.setNombre("Sede Central");

        Impresora activa1 = sampleImpresora(1L);
        activa1.setModeloImpresora(modeloHp);
        activa1.setSede(central);
        activa1.setEstado("Activa");

        Impresora activa2 = sampleImpresora(2L);
        activa2.setModeloImpresora(modeloCanon);
        activa2.setSede(central);
        activa2.setEstado("Activa");

        Impresora mantenimiento = sampleImpresora(3L);
        mantenimiento.setModeloImpresora(modeloHp);
        mantenimiento.setSede(null);
        mantenimiento.setEstado("En mantenimiento");

        Impresora deBaja = sampleImpresora(4L);
        deBaja.setModeloImpresora(modeloHp);
        deBaja.setSede(central);
        deBaja.setEstado("De baja");

        when(repository.findAll()).thenReturn(List.of(activa1, activa2, mantenimiento, deBaja));

        ImpresoraDashboardCompleto result = service.getDashboardCompleto();

        assertThat(result.total()).isEqualTo(4);
        assertThat(result.activas()).isEqualTo(2);
        assertThat(result.enMantenimiento()).isEqualTo(1);
        assertThat(result.deBaja()).isEqualTo(1);

        assertThat(result.distribucionPorMarca())
                .extracting(ImpresoraMarcaCount::marca, ImpresoraMarcaCount::total)
                .containsExactlyInAnyOrder(
                        org.assertj.core.groups.Tuple.tuple("HP", 3L),
                        org.assertj.core.groups.Tuple.tuple("Canon", 1L)
                );

        assertThat(result.distribucionPorSede())
                .extracting(ImpresoraSedeCount::sede, ImpresoraSedeCount::total)
                .containsExactlyInAnyOrder(
                        org.assertj.core.groups.Tuple.tuple("Sede Central", 3L),
                        org.assertj.core.groups.Tuple.tuple("Sin sede", 1L)
                );

        assertThat(result.totalConsumiblesDistintos()).isEqualTo(1);
        assertThat(result.topConsumibles()).hasSize(1);
        assertThat(result.topConsumibles().get(0).cantidad()).isEqualTo(4);
        assertThat(result.topConsumibles().get(0).codigo()).isEqualTo("TN-2380");
    }

    @Test
    void getDashboardCompleto_onException_returnsEmptyDashboard() {
        when(repository.findAll()).thenThrow(new RuntimeException("db down"));

        ImpresoraDashboardCompleto result = service.getDashboardCompleto();

        assertThat(result.total()).isEqualTo(0);
        assertThat(result.distribucionPorMarca()).isEmpty();
        assertThat(result.topConsumibles()).isEmpty();
    }

    private com.inia.soportedesk.catalogo.ModeloImpresoraToner toner(ModeloImpresora modelo, String color, String variante, String codigo) {
        com.inia.soportedesk.catalogo.ModeloImpresoraToner t = new com.inia.soportedesk.catalogo.ModeloImpresoraToner();
        t.setModeloImpresora(modelo);
        t.setColor(color);
        t.setVariante(variante);
        t.setCodigo(codigo);
        return t;
    }
```

- [ ] **Step 2: Run to verify failure**

Run: `mvn -o test -Dtest=ImpresoraServiceTest` from `soportedesk-backend/`
Expected: FAIL (compile error — `getDashboardCompleto`/DTOs not found)

- [ ] **Step 3: Implement `getDashboardCompleto()` in `ImpresoraService.java`**

Add after `findById()`:

```java
    @Transactional(readOnly = true)
    public ImpresoraDashboardCompleto getDashboardCompleto() {
        try {
            List<Impresora> all = repository.findAll();

            long activas = all.stream().filter(i -> "Activa".equals(i.getEstado())).count();
            long enMantenimiento = all.stream().filter(i -> "En mantenimiento".equals(i.getEstado())).count();
            long deBaja = all.stream().filter(i -> "De baja".equals(i.getEstado())).count();

            List<ImpresoraMarcaCount> distribucionPorMarca = all.stream()
                    .collect(java.util.stream.Collectors.groupingBy(
                            i -> i.getModeloImpresora().getMarca().getNombre(),
                            java.util.LinkedHashMap::new,
                            java.util.stream.Collectors.counting()))
                    .entrySet().stream()
                    .map(e -> new ImpresoraMarcaCount(e.getKey(), e.getValue()))
                    .sorted(java.util.Comparator.comparing(ImpresoraMarcaCount::marca))
                    .toList();

            List<ImpresoraSedeCount> distribucionPorSede = all.stream()
                    .collect(java.util.stream.Collectors.groupingBy(
                            i -> i.getSede() == null ? "Sin sede" : i.getSede().getNombre(),
                            java.util.LinkedHashMap::new,
                            java.util.stream.Collectors.counting()))
                    .entrySet().stream()
                    .map(e -> new ImpresoraSedeCount(e.getKey(), e.getValue()))
                    .sorted(java.util.Comparator.comparing(ImpresoraSedeCount::sede))
                    .toList();

            java.util.Map<String, Long> consumibleCounts = new java.util.LinkedHashMap<>();
            java.util.Map<String, com.inia.soportedesk.catalogo.ModeloImpresoraToner> consumibleSample = new java.util.LinkedHashMap<>();
            for (Impresora impresora : all) {
                for (com.inia.soportedesk.catalogo.ModeloImpresoraToner toner : impresora.getModeloImpresora().getToners()) {
                    String key = toner.getColor() + "|" + toner.getVariante() + "|" + toner.getCodigo();
                    consumibleCounts.merge(key, 1L, Long::sum);
                    consumibleSample.putIfAbsent(key, toner);
                }
            }
            List<ImpresoraConsumibleCount> topConsumibles = consumibleCounts.entrySet().stream()
                    .sorted(java.util.Map.Entry.<String, Long>comparingByValue(java.util.Comparator.reverseOrder()))
                    .limit(10)
                    .map(e -> {
                        com.inia.soportedesk.catalogo.ModeloImpresoraToner t = consumibleSample.get(e.getKey());
                        return new ImpresoraConsumibleCount(t.getColor(), t.getVariante(), t.getCodigo(), e.getValue());
                    })
                    .toList();

            return new ImpresoraDashboardCompleto(
                    all.size(), activas, enMantenimiento, deBaja,
                    distribucionPorMarca, distribucionPorSede,
                    topConsumibles, consumibleCounts.size()
            );
        } catch (Exception e) {
            return new ImpresoraDashboardCompleto(0, 0, 0, 0, List.of(), List.of(), List.of(), 0);
        }
    }
```

- [ ] **Step 4: Run the service tests to verify they pass**

Run: `mvn -o test -Dtest=ImpresoraServiceTest` from `soportedesk-backend/`
Expected: PASS

- [ ] **Step 5: Write the failing controller integration tests**

Add to `ImpresoraControllerIT.java`:

```java
    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "WRITE_impresoras"})
    void dashboardCompleto_withWriteAuthority_returnsOk() throws Exception {
        when(service.getDashboardCompleto()).thenReturn(new ImpresoraDashboardCompleto(
                10, 8, 1, 1, List.of(), List.of(), List.of(), 0));

        mockMvc.perform(get("/api/impresoras/dashboard/completo"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total", is(10)));
    }

    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "READ_impresoras"})
    void dashboardCompleto_withOnlyReadAuthority_returnsForbidden() throws Exception {
        mockMvc.perform(get("/api/impresoras/dashboard/completo"))
                .andExpect(status().isForbidden());
    }
```

- [ ] **Step 6: Add the controller endpoint**

In `ImpresoraController.java`, add after `findById()`:

```java
    @GetMapping("/dashboard/completo")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_impresoras')")
    public ImpresoraDashboardCompleto dashboardCompleto() {
        return service.getDashboardCompleto();
    }
```

- [ ] **Step 7: Run the full ImpresoraControllerIT + ImpresoraServiceTest classes**

Run: `mvn -o test -Dtest=ImpresoraControllerIT,ImpresoraServiceTest,ImpresoraRepositoryTest` from `soportedesk-backend/`
Expected: PASS (all tests)

- [ ] **Step 8: Run the full backend test suite**

Run: `mvn -o test` from `soportedesk-backend/`
Expected: BUILD SUCCESS, 0 failures

- [ ] **Step 9: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/ soportedesk-backend/src/test/java/com/inia/soportedesk/impresoras/
git commit -m "feat(impresoras): add GET /api/impresoras/dashboard/completo endpoint"
```

---

### Task 3: Frontend — model, service, and `ImpresoraFichaComponent.allowActions`

**Files:**
- Modify: `soportedesk-frontend/src/app/features/impresoras/impresora.model.ts`
- Modify: `soportedesk-frontend/src/app/features/impresoras/impresora.service.ts`
- Modify: `soportedesk-frontend/src/app/features/impresoras/impresora-ficha.component.ts`
- Modify: `soportedesk-frontend/src/app/features/impresoras/impresora-ficha.component.html`
- Modify: `soportedesk-frontend/src/app/features/impresoras/impresora-ficha.component.spec.ts`

- [ ] **Step 1: Add model interfaces**

Append to `impresora.model.ts`:

```typescript
export interface ImpresoraMarcaCount {
  marca: string;
  total: number;
}

export interface ImpresoraSedeCount {
  sede: string;
  total: number;
}

export interface ImpresoraConsumibleCount {
  color: string;
  variante: string;
  codigo: string;
  cantidad: number;
}

export interface ImpresoraDashboardCompleto {
  total: number;
  activas: number;
  enMantenimiento: number;
  deBaja: number;
  distribucionPorMarca: ImpresoraMarcaCount[];
  distribucionPorSede: ImpresoraSedeCount[];
  topConsumibles: ImpresoraConsumibleCount[];
  totalConsumiblesDistintos: number;
}
```

- [ ] **Step 2: Add service method**

In `impresora.service.ts`, add `ImpresoraDashboardCompleto` to the import and add:

```typescript
  getDashboardCompleto(): Observable<ImpresoraDashboardCompleto> {
    return this.http.get<ImpresoraDashboardCompleto>(`${this.apiUrl}/dashboard/completo`);
  }
```

- [ ] **Step 3: Write the failing ficha spec cases**

Add to `impresora-ficha.component.spec.ts`:

```typescript
  it('shows the edit button by default when the user can write', async () => {
    await TestBed.resetTestingModule().configureTestingModule({
      imports: [ImpresoraFichaComponent, HttpClientTestingModule],
      providers: [{ provide: AuthService, useValue: { isAdmin: () => false, canWrite: () => true } }],
    }).compileComponents();
    const writableFixture = TestBed.createComponent(ImpresoraFichaComponent);
    writableFixture.componentInstance.impresora = mockImpresora;
    writableFixture.detectChanges();

    expect(writableFixture.nativeElement.querySelector('.edit-btn')).toBeTruthy();
  });

  it('hides the edit button when allowActions is false, even if the user can write', async () => {
    await TestBed.resetTestingModule().configureTestingModule({
      imports: [ImpresoraFichaComponent, HttpClientTestingModule],
      providers: [{ provide: AuthService, useValue: { isAdmin: () => false, canWrite: () => true } }],
    }).compileComponents();
    const readOnlyFixture = TestBed.createComponent(ImpresoraFichaComponent);
    readOnlyFixture.componentInstance.impresora = mockImpresora;
    readOnlyFixture.componentInstance.allowActions = false;
    readOnlyFixture.detectChanges();

    expect(readOnlyFixture.nativeElement.querySelector('.edit-btn')).toBeFalsy();
  });
```

- [ ] **Step 4: Run to verify failure**

Run: `npx ng test --watch=false --include='**/impresora-ficha.component.spec.ts'` from `soportedesk-frontend/`
Expected: FAIL (`allowActions` property doesn't exist yet)

- [ ] **Step 5: Add the `allowActions` input**

In `impresora-ficha.component.ts`, add alongside the other `@Input`s:

```typescript
  @Input() allowActions = true;
```

In `impresora-ficha.component.html:8`, change:

```html
<button *ngIf="isAdmin" type="button" class="edit-btn" (click)="editRequested.emit(impresora)">Editar</button>
```

to:

```html
<button *ngIf="isAdmin && allowActions" type="button" class="edit-btn" (click)="editRequested.emit(impresora)">Editar</button>
```

- [ ] **Step 6: Run to verify it passes**

Run: `npx ng test --watch=false --include='**/impresora-ficha.component.spec.ts'` from `soportedesk-frontend/`
Expected: PASS (all tests)

- [ ] **Step 7: Commit**

```bash
git add soportedesk-frontend/src/app/features/impresoras/impresora.model.ts soportedesk-frontend/src/app/features/impresoras/impresora.service.ts soportedesk-frontend/src/app/features/impresoras/impresora-ficha.component.ts soportedesk-frontend/src/app/features/impresoras/impresora-ficha.component.html soportedesk-frontend/src/app/features/impresoras/impresora-ficha.component.spec.ts
git commit -m "feat(impresoras): add dashboard model/service and ficha allowActions input"
```

---

### Task 4: Frontend — `ImpresorasShellComponent` + `impresoras.shared.scss`

**Files:**
- Rename: `impresoras-list.component.scss` → `impresoras.shared.scss`
- Create: `soportedesk-frontend/src/app/features/impresoras/impresoras-shell.component.ts`

- [ ] **Step 1: Rename the scss file**

```bash
git mv soportedesk-frontend/src/app/features/impresoras/impresoras-list.component.scss soportedesk-frontend/src/app/features/impresoras/impresoras.shared.scss
```

- [ ] **Step 2: Append the `.ad-tabs` block and dashboard-specific classes**

Prepend the same `.ad-tabs`/`.ad-tabs a` block from `usuarios-red.shared.scss` (copy verbatim), and append (matching the pattern already used in `vpn.shared.scss`/`correos.shared.scss`):

```scss
.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(300px, .9fr);
  gap: 14px;
}

.chart-card { min-height: 340px; padding: 16px; }

.alert-list { display: grid; gap: 12px; align-content: start; }

.alert-card { padding: 14px; }

.alert-card header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.alert-row {
  display: grid;
  width: 100%;
  gap: 2px;
  padding: 10px 4px;
  border: none;
  border-bottom: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text);
  text-align: left;

  &:last-of-type { border-bottom: none; }
}

.empty-state {
  display: grid;
  place-items: center;
  gap: 6px;
  min-height: 180px;
  padding: 24px;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-muted);
  color: var(--color-text-secondary);
  text-align: center;

  strong { color: var(--color-text); font-size: 15px; }
  span { font-size: 12.5px; }
}

.notice {
  padding: 11px 14px;
  border-radius: var(--radius-md);
  background: var(--color-info-light);
  color: var(--color-info);
  font-size: 13px;
  font-weight: 600;

  &.error {
    background: var(--color-danger-light);
    color: var(--color-danger);
  }
}

@media (max-width: 900px) {
  .dashboard-grid { grid-template-columns: 1fr; }
}
```

- [ ] **Step 3: Create `ImpresorasShellComponent`**

```typescript
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-impresoras-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="module-page impresoras-page">
      <div class="module-header">
        <div>
          <span class="module-eyebrow">Inventario fisico</span>
          <h2>Impresoras</h2>
          <p>Ficha tecnica, ubicacion, conexion, estado y consumibles de cada equipo.</p>
        </div>
      </div>

      <nav class="ad-tabs" aria-label="Impresoras">
        <a routerLink="consultas" routerLinkActive="active">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          Consultas
        </a>
        <a *ngIf="canWrite" routerLink="administracion" routerLinkActive="active">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          Administracion
        </a>
        <a *ngIf="canWrite" routerLink="dashboard" routerLinkActive="active">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          Dashboard
        </a>
      </nav>

      <router-outlet />
    </div>
  `,
  styleUrl: './impresoras.shared.scss',
})
export class ImpresorasShellComponent {
  private authService = inject(AuthService);

  get canWrite(): boolean {
    return this.authService.canWrite('impresoras');
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add soportedesk-frontend/src/app/features/impresoras/impresoras-shell.component.ts soportedesk-frontend/src/app/features/impresoras/impresoras.shared.scss
git commit -m "feat(impresoras): add ImpresorasShellComponent with tab navigation"
```

---

### Task 5: Frontend — shared `ImpresorasListViewComponent`

**Files:**
- Create: `soportedesk-frontend/src/app/features/impresoras/impresoras-list-view.component.ts`
- Create: `soportedesk-frontend/src/app/features/impresoras/impresoras-list-view.component.html`

**Interfaces:**
- Consumes: `Impresora[]` passed as `@Input items`.
- Produces: `<app-impresoras-list-view>` with `@Input({required:true}) items: Impresora[]`, `@Input canManage = false`, `@Output view/add/edit/delete` events (mirrors `GenericTableComponent`'s event names for consistency). Consumed by Task 6 (Consultas, `canManage=false`) and Task 7 (Administración, `canManage=true`).

This extracts `impresoras-list.component.html`'s filter panel, consumibles toggle, desktop table, and mobile workspace (everything between the `module-header` close and the modals) into a standalone component, plus the filtering/derived-list logic from `impresoras-list.component.ts` (`filteredItems`, `sedes`/`dependencias`/.../`modelos` getters, `clearFilters`, `onSedeFilterChange`/etc., `exportExcel`, `printerLocation`/`printerIdentifier`/`printerConnection`, `onSearch`/`onMobileSearch`).

- [ ] **Step 1: Create the component class**

```typescript
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GenericTableComponent, TableColumn } from '../../shared/generic-table/generic-table.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { ImpresoraResumenComponent } from './impresora-resumen.component';
import { Impresora, impresoraEstadoTone } from './impresora.model';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-impresoras-list-view',
  standalone: true,
  imports: [CommonModule, FormsModule, GenericTableComponent, StatusBadgeComponent, ImpresoraResumenComponent],
  templateUrl: './impresoras-list-view.component.html',
  styleUrl: './impresoras.shared.scss',
})
export class ImpresorasListViewComponent {
  @Input({ required: true }) items: Impresora[] = [];
  @Input() canManage = false;

  @Output() view = new EventEmitter<Impresora>();
  @Output() add = new EventEmitter<void>();
  @Output() edit = new EventEmitter<Impresora>();
  @Output() delete = new EventEmitter<Impresora>();

  columns: TableColumn[] = [
    { key: 'modeloImpresora.marca.nombre', label: 'Marca' },
    { key: 'modeloImpresora.nombre', label: 'Modelo' },
    { key: 'tipoImpresora.nombre', label: 'Tipo' },
    { key: 'serie', label: 'Serie' },
    { key: 'ip', label: 'IP' },
    { key: 'dependencia.nombre', label: 'Dependencia' },
  ];
  readonly impresoraEstadoTone = impresoraEstadoTone;

  showConsumibles = false;
  searchTerm = '';
  mobileSearchTerm = '';
  filters = {
    sede: '',
    dependencia: '',
    subdependencia: '',
    ip: '',
    marca: '',
    modelo: '',
  };

  onSearch(term: string): void {
    this.searchTerm = term;
    this.mobileSearchTerm = term;
  }

  onMobileSearch(term: string): void {
    this.searchTerm = term;
    this.mobileSearchTerm = term;
  }

  get filteredItems(): Impresora[] {
    const search = this.normalize(this.searchTerm);
    const ip = this.normalize(this.filters.ip);

    return this.items.filter((item) => {
      const exactFilters =
        (!this.filters.sede || item.sede?.nombre === this.filters.sede) &&
        (!this.filters.dependencia || item.dependencia?.nombre === this.filters.dependencia) &&
        (!this.filters.subdependencia || item.subdependencia?.nombre === this.filters.subdependencia) &&
        (!this.filters.marca || item.modeloImpresora.marca.nombre === this.filters.marca) &&
        (!this.filters.modelo || item.modeloImpresora.nombre === this.filters.modelo);

      if (!exactFilters) {
        return false;
      }

      if (ip && !this.normalize(item.ip).includes(ip)) {
        return false;
      }

      if (!search) {
        return true;
      }

      return this.normalize([
        item.modeloImpresora.marca.nombre,
        item.modeloImpresora.nombre,
        item.tipoImpresora?.nombre,
        item.serie,
        item.codigoInventario,
        item.codigoPatrimonial,
        item.ip,
        item.sede?.nombre,
        item.dependencia?.nombre,
        item.subdependencia?.nombre,
        item.estado,
      ].filter(Boolean).join(' ')).includes(search);
    });
  }

  get sedes(): string[] {
    return this.unique(this.items.map((item) => item.sede?.nombre));
  }

  get dependencias(): string[] {
    return this.unique(this.items
      .filter((item) => !this.filters.sede || item.sede?.nombre === this.filters.sede)
      .map((item) => item.dependencia?.nombre));
  }

  get subdependencias(): string[] {
    return this.unique(this.items
      .filter((item) => !this.filters.dependencia || item.dependencia?.nombre === this.filters.dependencia)
      .map((item) => item.subdependencia?.nombre));
  }

  get marcas(): string[] {
    return this.unique(this.items.map((item) => item.modeloImpresora.marca.nombre));
  }

  get modelos(): string[] {
    return this.unique(this.items
      .filter((item) => !this.filters.marca || item.modeloImpresora.marca.nombre === this.filters.marca)
      .map((item) => item.modeloImpresora.nombre));
  }

  get hasActiveFilters(): boolean {
    return Boolean(
      this.searchTerm ||
      this.filters.sede ||
      this.filters.dependencia ||
      this.filters.subdependencia ||
      this.filters.ip ||
      this.filters.marca ||
      this.filters.modelo
    );
  }

  onSedeFilterChange(): void {
    this.filters.dependencia = '';
    this.filters.subdependencia = '';
  }

  onDependenciaFilterChange(): void {
    this.filters.subdependencia = '';
  }

  onMarcaFilterChange(): void {
    this.filters.modelo = '';
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.mobileSearchTerm = '';
    this.filters = {
      sede: '',
      dependencia: '',
      subdependencia: '',
      ip: '',
      marca: '',
      modelo: '',
    };
  }

  toggleConsumibles(): void {
    this.showConsumibles = !this.showConsumibles;
  }

  exportExcel(): void {
    const rows = this.filteredItems.map((item) => ({
      Marca: item.modeloImpresora.marca.nombre,
      Modelo: item.modeloImpresora.nombre,
      Tipo: item.tipoImpresora?.nombre ?? '',
      Serie: item.serie ?? '',
      'Codigo de Inventario': item.codigoInventario ?? '',
      'Codigo Patrimonial': item.codigoPatrimonial ?? '',
      Conexion: item.tipoConexion,
      IP: item.ip ?? '',
      Sede: item.sede?.nombre ?? '',
      Dependencia: item.dependencia?.nombre ?? '',
      Subdependencia: item.subdependencia?.nombre ?? '',
      Estado: item.estado,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet['!cols'] = [
      { wch: 18 }, { wch: 26 }, { wch: 30 }, { wch: 18 }, { wch: 22 }, { wch: 22 },
      { wch: 12 }, { wch: 16 }, { wch: 18 }, { wch: 34 }, { wch: 34 }, { wch: 18 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Impresoras');
    XLSX.writeFile(workbook, `impresoras-${this.exportDate()}.xlsx`);
  }

  printerLocation(item: Impresora): string {
    return [
      item.dependencia?.nombre,
      item.subdependencia?.nombre,
    ].filter(Boolean).join(' / ') || item.sede?.nombre || 'Sin ubicacion';
  }

  printerIdentifier(item: Impresora): string {
    return item.serie || item.codigoInventario || item.codigoPatrimonial || 'Sin identificador';
  }

  printerConnection(item: Impresora): string {
    return item.tipoConexion === 'IP' && item.ip ? `IP ${item.ip}` : item.tipoConexion;
  }

  private unique(values: Array<string | null | undefined>): string[] {
    return [...new Set(values.filter((value): value is string => Boolean(value)))]
      .sort((a, b) => a.localeCompare(b));
  }

  private normalize(value: string | null | undefined): string {
    return (value ?? '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .trim();
  }

  private exportDate(): string {
    const date = new Date();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
```

- [ ] **Step 2: Create the template**

Copy the filter-panel/consumibles/desktop-table/mobile-workspace block from `impresoras-list.component.html` (everything from `<section class="printer-filter-panel">` through the closing `</div>` that matched `mobile-printer-workspace`), replacing:
- `[canEdit]="canWrite"` → `[canEdit]="canManage"` on `app-generic-table`
- `(add)="onAdd()"` → `(add)="add.emit()"`
- `(view)="onView($event)"` → `(view)="view.emit($event)"`
- `(edit)="onEdit($event)"` → `(edit)="edit.emit($event)"`
- `(delete)="onDelete($event)"` → `(delete)="delete.emit($event)"`
- `*ngIf="canWrite" type="button" class="mobile-add-btn" (click)="onAdd()"` → `*ngIf="canManage" ... (click)="add.emit()"`
- mobile card actions `*ngIf="canWrite" ... (click)="onEdit(item)"` / `onDelete(item)` → `*ngIf="canManage" ... (click)="edit.emit(item)"` / `delete.emit(item)`
- `(click)="onView(item)"` → `(click)="view.emit(item)"`
- `[data]="filteredItems"` stays as `[data]="filteredItems"` (the getter defined in Step 1)
- `[canAdd]` on `app-generic-table`: add `[canAdd]="canManage"` explicitly (today it defaults from `canEdit` via `showAddButton`, keep behavior identical by setting both to `canManage`)

- [ ] **Step 3: Commit**

```bash
git add soportedesk-frontend/src/app/features/impresoras/impresoras-list-view.component.ts soportedesk-frontend/src/app/features/impresoras/impresoras-list-view.component.html
git commit -m "feat(impresoras): add shared ImpresorasListViewComponent"
```

---

### Task 6: Frontend — `ImpresorasConsultasComponent`

**Files:**
- Create: `soportedesk-frontend/src/app/features/impresoras/impresoras-consultas.component.ts`
- Create: `soportedesk-frontend/src/app/features/impresoras/impresoras-consultas.component.spec.ts`

- [ ] **Step 1: Write the failing spec (ported from the retired `impresoras-list.component.spec.ts`)**

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ImpresoraService } from './impresora.service';
import { ImpresorasConsultasComponent } from './impresoras-consultas.component';

describe('ImpresorasConsultasComponent', () => {
  let fixture: ComponentFixture<ImpresorasConsultasComponent>;
  let component: ImpresorasConsultasComponent;
  let service: jasmine.SpyObj<ImpresoraService>;

  beforeEach(async () => {
    service = jasmine.createSpyObj<ImpresoraService>('ImpresoraService', ['getAll']);
    service.getAll.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [ImpresorasConsultasComponent],
      providers: [{ provide: ImpresoraService, useValue: service }],
    }).compileComponents();

    fixture = TestBed.createComponent(ImpresorasConsultasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads the printer list on init', () => {
    expect(service.getAll).toHaveBeenCalledTimes(1);
  });

  it('never allows management actions', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-impresora-form')).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx ng test --watch=false --include='**/impresoras-consultas.component.spec.ts'` from `soportedesk-frontend/`
Expected: FAIL (component doesn't exist yet)

- [ ] **Step 3: Create the component**

```typescript
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../../shared/modal/modal.component';
import { ImpresoraFichaComponent } from './impresora-ficha.component';
import { ImpresorasListViewComponent } from './impresoras-list-view.component';
import { Impresora } from './impresora.model';
import { ImpresoraService } from './impresora.service';

@Component({
  selector: 'app-impresoras-consultas',
  standalone: true,
  imports: [CommonModule, ModalComponent, ImpresoraFichaComponent, ImpresorasListViewComponent],
  template: `
    <app-impresoras-list-view [items]="items" [canManage]="false" (view)="onView($event)" />

    <app-modal title="Ficha tecnica" [open]="viewing !== null" (closed)="closeView()">
      <app-impresora-ficha *ngIf="viewing" [impresora]="viewing" [allowActions]="false" />
    </app-modal>
  `,
  styleUrl: './impresoras.shared.scss',
})
export class ImpresorasConsultasComponent implements OnInit {
  private service = inject(ImpresoraService);

  items: Impresora[] = [];
  viewing: Impresora | null = null;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.service.getAll().subscribe((data) => (this.items = data));
  }

  onView(item: Impresora): void {
    this.viewing = item;
  }

  closeView(): void {
    this.viewing = null;
  }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx ng test --watch=false --include='**/impresoras-consultas.component.spec.ts'` from `soportedesk-frontend/`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add soportedesk-frontend/src/app/features/impresoras/impresoras-consultas.component.ts soportedesk-frontend/src/app/features/impresoras/impresoras-consultas.component.spec.ts
git commit -m "feat(impresoras): add ImpresorasConsultasComponent (read-only browse)"
```

---

### Task 7: Frontend — `ImpresorasAdministracionComponent`

**Files:**
- Create: `soportedesk-frontend/src/app/features/impresoras/impresoras-administracion.component.ts`
- Create: `soportedesk-frontend/src/app/features/impresoras/impresoras-administracion.component.spec.ts`

- [ ] **Step 1: Write the failing spec**

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ImpresoraService } from './impresora.service';
import { ImpresorasAdministracionComponent } from './impresoras-administracion.component';

describe('ImpresorasAdministracionComponent', () => {
  let fixture: ComponentFixture<ImpresorasAdministracionComponent>;
  let component: ImpresorasAdministracionComponent;
  let service: jasmine.SpyObj<ImpresoraService>;

  beforeEach(async () => {
    service = jasmine.createSpyObj<ImpresoraService>('ImpresoraService', ['getAll', 'delete']);
    service.getAll.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [ImpresorasAdministracionComponent],
      providers: [{ provide: ImpresoraService, useValue: service }],
    }).compileComponents();

    fixture = TestBed.createComponent(ImpresorasAdministracionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads the printer list on init', () => {
    expect(service.getAll).toHaveBeenCalledTimes(1);
  });

  it('opens the add form when onAdd is called', () => {
    component.onAdd();
    expect(component.formOpen).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx ng test --watch=false --include='**/impresoras-administracion.component.spec.ts'` from `soportedesk-frontend/`
Expected: FAIL (component doesn't exist yet)

- [ ] **Step 3: Create the component**

```typescript
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../../shared/modal/modal.component';
import { ImpresoraFichaComponent } from './impresora-ficha.component';
import { ImpresoraFormComponent } from './impresora-form.component';
import { ImpresorasListViewComponent } from './impresoras-list-view.component';
import { Impresora } from './impresora.model';
import { ImpresoraService } from './impresora.service';

@Component({
  selector: 'app-impresoras-administracion',
  standalone: true,
  imports: [CommonModule, ModalComponent, ImpresoraFichaComponent, ImpresoraFormComponent, ImpresorasListViewComponent],
  template: `
    <section class="module-stats">
      <div class="stat-pill"><strong>{{ items.length }}</strong><span>Total</span></div>
      <div class="stat-pill"><strong>{{ activas }}</strong><span>Activas</span></div>
      <div class="stat-pill"><strong>{{ enMantenimiento }}</strong><span>Mant.</span></div>
    </section>

    <app-impresoras-list-view
      [items]="items"
      [canManage]="true"
      (view)="onView($event)"
      (add)="onAdd()"
      (edit)="onEdit($event)"
      (delete)="onDelete($event)"
    />

    <app-modal title="Ficha tecnica" [open]="viewing !== null" (closed)="closeView()">
      <app-impresora-ficha *ngIf="viewing" [impresora]="viewing" (editRequested)="onEdit($event)" />
    </app-modal>

    <app-modal
      [title]="editing ? 'Editar impresora' : 'Agregar impresora'"
      [open]="formOpen"
      size="wide"
      (closed)="closeForm()"
    >
      <app-impresora-form *ngIf="formOpen" [impresora]="editing" (saved)="onSaved()" (cancelled)="closeForm()" />
    </app-modal>

    <app-modal title="Confirmar eliminacion" [open]="deleting !== null" (closed)="closeDelete()">
      <div class="delete-confirm" *ngIf="deleting as item">
        <div>
          <strong>{{ item.modeloImpresora.marca.nombre }} {{ item.modeloImpresora.nombre }}</strong>
          <span>{{ item.serie || item.codigoInventario || item.codigoPatrimonial || 'Sin identificador' }}</span>
        </div>
        <p>Esta accion eliminara el registro de la impresora. Confirma solo si estas seguro.</p>
        <div class="delete-actions">
          <button type="button" class="secondary" (click)="closeDelete()">Cancelar</button>
          <button type="button" class="danger" (click)="confirmDelete()">Si, eliminar</button>
        </div>
      </div>
    </app-modal>
  `,
  styleUrl: './impresoras.shared.scss',
})
export class ImpresorasAdministracionComponent implements OnInit {
  private service = inject(ImpresoraService);

  items: Impresora[] = [];
  viewing: Impresora | null = null;
  editing: Impresora | null = null;
  deleting: Impresora | null = null;
  formOpen = false;

  get activas(): number {
    return this.items.filter((item) => item.estado?.toLowerCase() === 'activa').length;
  }

  get enMantenimiento(): number {
    return this.items.filter((item) => item.estado?.toLowerCase().includes('mantenimiento')).length;
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.service.getAll().subscribe((data) => (this.items = data));
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
    this.viewing = null;
    this.editing = item;
    this.formOpen = true;
  }

  closeForm(): void {
    this.formOpen = false;
  }

  onDelete(item: Impresora): void {
    this.deleting = item;
  }

  closeDelete(): void {
    this.deleting = null;
  }

  confirmDelete(): void {
    if (!this.deleting) return;
    this.service.delete(this.deleting.id).subscribe(() => {
      this.deleting = null;
      this.load();
    });
  }

  onSaved(): void {
    this.formOpen = false;
    this.load();
  }
}
```

Note: unlike the retired `ImpresorasListComponent`, `onAdd`/`onEdit`/`onDelete` no longer need the internal `if (!this.canWrite) return;` guard — the whole Administración tab is only reachable via `moduloGuard('impresoras', { write: true })`, so reaching this component already implies write access (same simplification AD's `UsuariosRedAdministracionComponent` made).

- [ ] **Step 4: Run to verify it passes**

Run: `npx ng test --watch=false --include='**/impresoras-administracion.component.spec.ts'` from `soportedesk-frontend/`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add soportedesk-frontend/src/app/features/impresoras/impresoras-administracion.component.ts soportedesk-frontend/src/app/features/impresoras/impresoras-administracion.component.spec.ts
git commit -m "feat(impresoras): add ImpresorasAdministracionComponent (CRUD workflow)"
```

---

### Task 8: Frontend — `ImpresorasDashboardComponent`

**Files:**
- Create: `soportedesk-frontend/src/app/features/impresoras/impresoras-dashboard.component.ts`

- [ ] **Step 1: Create the component**

```typescript
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ChartConfiguration, ChartData } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { ImpresoraService } from './impresora.service';
import { ImpresoraDashboardCompleto } from './impresora.model';

@Component({
  selector: 'app-impresoras-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  template: `
    <div class="dashboard-toolbar">
      <p>Distribucion por marca, por sede y consumibles mas demandados de la flota.</p>
      <button type="button" class="btn btn-ghost" (click)="load()" [disabled]="loading">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </svg>
        {{ loading ? 'Cargando...' : 'Actualizar' }}
      </button>
    </div>

    <div class="notice error" *ngIf="error">No se pudo cargar. Intenta nuevamente.</div>

    <section class="module-stats" *ngIf="dashboard as d">
      <div class="stat-pill"><strong>{{ d.total }}</strong><span>Total</span></div>
      <div class="stat-pill"><strong>{{ d.activas }}</strong><span>Activas</span></div>
      <div class="stat-pill"><strong>{{ d.enMantenimiento }}</strong><span>Mant.</span></div>
      <div class="stat-pill"><strong>{{ d.deBaja }}</strong><span>De baja</span></div>
    </section>

    <section class="dashboard-grid" *ngIf="dashboard as d">
      <article class="card chart-card">
        <header>
          <strong>Distribucion por marca</strong>
          <span class="muted">{{ d.distribucionPorMarca.length }} marcas</span>
        </header>
        <canvas baseChart [data]="chartData" [options]="chartOptions" [type]="'bar'"></canvas>
      </article>

      <div class="alert-list">
        <article class="card alert-card">
          <header>
            <strong>Distribucion por sede</strong>
            <span class="badge badge-info">{{ d.distribucionPorSede.length }}</span>
          </header>
          <div class="alert-row" *ngFor="let row of d.distribucionPorSede">
            <strong>{{ row.sede }}</strong>
            <small class="muted">{{ row.total }} impresoras</small>
          </div>
        </article>

        <article class="card alert-card">
          <header>
            <strong>Top 10 consumibles mas demandados</strong>
            <span class="badge badge-warning">{{ d.totalConsumiblesDistintos }}</span>
          </header>
          <div class="alert-row" *ngFor="let row of d.topConsumibles">
            <strong>Toner {{ row.color }} - {{ row.variante }}</strong>
            <small class="muted">{{ row.codigo }} - {{ row.cantidad }} impresoras</small>
          </div>
          <p class="muted" *ngIf="!d.topConsumibles.length">Sin registros criticos.</p>
        </article>
      </div>
    </section>

    <section class="empty-state" *ngIf="!dashboard && !loading">
      <strong>Sin datos de dashboard</strong>
      <span>El servicio devolvio un resumen vacio o no disponible.</span>
    </section>
  `,
  styles: [`
    .dashboard-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-top: -6px;
    }
    .dashboard-toolbar p {
      margin: 0;
      color: var(--color-text-secondary);
      font-size: 13px;
    }
  `],
  styleUrl: './impresoras.shared.scss',
})
export class ImpresorasDashboardComponent implements OnInit {
  private service = inject(ImpresoraService);

  dashboard: ImpresoraDashboardCompleto | null = null;
  loading = false;
  error = false;

  chartData: ChartData<'bar', number[], string> = {
    labels: [],
    datasets: [{ data: [], label: 'Impresoras', backgroundColor: '#64748b' }],
  };

  chartOptions: ChartConfiguration<'bar'>['options'] = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, boxHeight: 10, usePointStyle: true } } },
    scales: {
      x: { beginAtZero: true, grid: { color: '#e2e8f0' }, ticks: { precision: 0 } },
      y: { grid: { display: false } },
    },
  };

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = false;
    this.service.getDashboardCompleto().subscribe({
      next: (dashboard) => {
        this.loading = false;
        this.dashboard = dashboard;
        this.applyChart(dashboard);
      },
      error: () => {
        this.loading = false;
        this.error = true;
        this.dashboard = null;
        this.applyChart(null);
      },
    });
  }

  private applyChart(dashboard: ImpresoraDashboardCompleto | null): void {
    const rows = dashboard?.distribucionPorMarca ?? [];
    this.chartData = {
      labels: rows.map((row) => row.marca),
      datasets: [{ data: rows.map((row) => row.total), label: 'Impresoras', backgroundColor: '#64748b' }],
    };
  }
}
```

`#64748b` matches `--color-impresoras` from `_variables.scss:42` — same established Chart.js-literal exception as the other dashboards.

- [ ] **Step 2: Commit**

```bash
git add soportedesk-frontend/src/app/features/impresoras/impresoras-dashboard.component.ts
git commit -m "feat(impresoras): add ImpresorasDashboardComponent"
```

---

### Task 9: Wire routes, retire the old page, full verification

**Files:**
- Modify: `soportedesk-frontend/src/app/app.routes.ts` (impresoras block, ~lines 133-140)
- Delete: `impresoras-list.component.ts`, `impresoras-list.component.html`, `impresoras-list.component.spec.ts`

- [ ] **Step 1: Replace the impresoras route block**

Replace:

```typescript
      {
        path: 'impresoras',
        canActivate: [moduloGuard('impresoras')],
        loadComponent: () =>
          import('./features/impresoras/impresoras-list.component').then(
            (m) => m.ImpresorasListComponent,
          ),
      },
```

with:

```typescript
      {
        path: 'impresoras',
        loadComponent: () =>
          import('./features/impresoras/impresoras-shell.component').then((m) => m.ImpresorasShellComponent),
        children: [
          { path: '', redirectTo: 'consultas', pathMatch: 'full' },
          {
            path: 'consultas',
            canActivate: [moduloGuard('impresoras')],
            loadComponent: () =>
              import('./features/impresoras/impresoras-consultas.component').then((m) => m.ImpresorasConsultasComponent),
          },
          {
            path: 'administracion',
            canActivate: [moduloGuard('impresoras', { write: true })],
            loadComponent: () =>
              import('./features/impresoras/impresoras-administracion.component').then((m) => m.ImpresorasAdministracionComponent),
          },
          {
            path: 'dashboard',
            canActivate: [moduloGuard('impresoras', { write: true })],
            loadComponent: () =>
              import('./features/impresoras/impresoras-dashboard.component').then((m) => m.ImpresorasDashboardComponent),
          },
        ],
      },
```

No new guard import needed (reuses `moduloGuard`, already imported).

- [ ] **Step 2: Delete the retired files**

```bash
rm soportedesk-frontend/src/app/features/impresoras/impresoras-list.component.ts soportedesk-frontend/src/app/features/impresoras/impresoras-list.component.html soportedesk-frontend/src/app/features/impresoras/impresoras-list.component.spec.ts
```

- [ ] **Step 3: Build to catch dangling references**

Run: `npx ng build --configuration=development` from `soportedesk-frontend/`
Expected: BUILD SUCCESS

- [ ] **Step 4: Run the full frontend test suite**

Run: `npx ng test --watch=false --browsers=ChromeHeadless` from `soportedesk-frontend/`
Expected: net +4 passing vs. the pre-existing baseline (2 new specs replacing the retired 2-test spec = net 0 there, plus 2 new ficha `allowActions` tests = +2, wait — recompute at execution time by diffing against the last known-good count); the 7 pre-existing unrelated failures remain untouched.

- [ ] **Step 5: Run the full backend test suite**

Run: `mvn -o test` from `soportedesk-backend/`
Expected: BUILD SUCCESS, 0 failures

- [ ] **Step 6: Restart the dev backend and manually verify in the browser**

Same restart procedure as AD/VPN/Correos this session (recompile, kill the running process, relaunch with `AD_BIND_PASSWORD` injected via the User-scope env var so the new route is loaded). Confirm:
- `/impresoras/consultas` shows filters + table/mobile-list + consumibles toggle + ficha with no Editar button, no Agregar button, no stat-pills.
- `/impresoras/administracion` shows the 3 stat-pills + filters/table + Agregar/Editar/Eliminar, only reachable with `WRITE_impresoras`.
- `/impresoras/dashboard` shows 4 KPI pills + marca chart + sede list + top-10 consumibles, only reachable with `WRITE_impresoras`.

- [ ] **Step 7: Commit**

```bash
git add soportedesk-frontend/src/app/app.routes.ts
git add -u soportedesk-frontend/src/app/features/impresoras/
git commit -m "feat(impresoras): wire 3-tab routing, retire single-page ImpresorasListComponent"
```

---

## Self-Review Notes

- **Spec coverage**: §2 (rutas) → Task 9. §3 (componentes compartidos) → Tasks 3, 5. §4 (backend) → Tasks 1-2. §5 (Consultas) → Task 6. §6 (Administración, incluye stat-pills) → Task 7. §7 (Dashboard) → Task 8. §8 (manejo de errores) → Task 2 Step 3 (try/catch → empty DTO) + Task 8 (frontend error banner). §10 (fuera de alcance) confirmed — `ImpresoraFormComponent`/delete modal untouched.
- **Type consistency**: `ImpresoraDashboardCompleto`/`ImpresoraMarcaCount`/`ImpresoraSedeCount`/`ImpresoraConsumibleCount` field names match 1:1 between Java records (Task 1) and TS interfaces (Task 3), used identically in Task 2 (backend) and Task 8 (frontend).
- **Test coverage carried forward**: the 2 tests in the retired `impresoras-list.component.spec.ts` are re-homed into Task 6 (load-on-init, no form in read-only view) and Task 7 (load-on-init, onAdd opens form) rather than silently dropped.
