# Módulo Inventario de Equipos — Rediseño en 3 caras — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the single Inventario de Equipos page (with its client-side Inventario/Salud tab toggle) into 3 routed tabs — Inventario (read-only browse), Mantenimiento (Salud del Inventario queue, write-gated), Dashboard (new analytics) — mirroring the Impresoras/AD redesign, since Equipos shares their single flat permission model (`equipos`, not VPN's split authorities).

**Architecture:** New `EquiposShellComponent` owns the tab nav + `<router-outlet>`, gating Mantenimiento/Dashboard tabs client-side on `canWrite('equipos')` (route guards enforce it server-side too via `moduloGuard`). `EquiposListComponent` is split into two standalone components — `EquiposInventarioComponent` (KPI grid + filters + table, everything the "Inventario" tab has today) and `EquiposMantenimientoComponent` (the "Salud del inventario" tab, moved here since it's an administrative queue, not a read-only view). Unlike Impresoras, Equipos has no CRUD to gate — the only editable surface (código patrimonial, tipo override, estado, observaciones) already lives inside `EquipoDetailComponent` (`/equipos/:id`), gated by `*ngIf="auth.canWrite('equipos')"`, and stays untouched. Backend gets one new aggregation endpoint mirroring AD/VPN/Correos/Impresoras' `dashboard/completo` pattern, reusing (not duplicating) the alert-level calculation already in `EquipoService.buildSaludDto()`.

**Tech Stack:** Angular 17+ standalone components (signals), Spring Boot 3 / Spring Security `@PreAuthorize`, `ng2-charts`, existing shared components (`app-generic-table`), existing global dashboard CSS (`.module-dash-*` classes in `src/styles.scss` — no new global CSS needed).

## Global Constraints

- Follow the spec exactly: `docs/superpowers/specs/2026-07-09-modulo-equipos-tres-caras-design.md`.
- Do not change `EquipoDetailComponent`, `GET /api/equipos/kpis`, or `GET /api/equipos/salud` — they keep their current behavior, only the UI component consuming them changes.
- No writes to GLPI, no changes to `equipos_enrichment` or any enrichment endpoint.
- `WRITE_equipos` already exists as an authority (added in the 2026-07-04 enrichment migration) — no new SQL migration needed for this plan.
- `.module-dash-*` and `.badge`/`.empty-state` CSS: `.module-dash-*` is global (`src/styles.scss`), reuse as-is. `.ad-tabs`/`.ad-tabs a` and `.empty-state` are duplicated per-module (existing convention, confirmed present in `impresoras.shared.scss`) — copy verbatim into `equipos.shared.scss`.

---

## File Structure

**Backend (`soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/`):**
- Create: `EquipoFabricanteCount.java`, `EquipoDependenciaCount.java`, `EquipoSaludResumen.java`, `EquipoDashboardCompleto.java`.
- Modify: `EquipoService.java` — extract `SaludCalculo` record + `calcularSalud()` from `buildSaludDto()`, add `getDashboardCompleto()`.
- Modify: `EquipoController.java` — add `GET /dashboard/completo`.
- Modify (test): `EquipoServiceTest.java`, `EquipoControllerIT.java`.

**Frontend (`soportedesk-frontend/src/app/features/equipos/`):**
- Modify: `equipo.model.ts` — add `EquipoFabricanteCount`, `EquipoDependenciaCount`, `EquipoSaludResumen`, `EquipoDashboardCompleto`.
- Modify: `equipo.service.ts` — add `getDashboardCompleto()`.
- Rename+adapt: `equipos-list.component.scss` → `equipos.shared.scss` (prepend `.ad-tabs`/`.ad-tabs a`, append `.empty-state`; everything else unchanged).
- Create: `equipos-shell.component.ts`.
- Create: `equipos-inventario.component.ts` + `.html` (KPI grid/filters/table, extracted from `equipos-list.component.ts`/`.html`).
- Create: `equipos-mantenimiento.component.ts` + `.html` (Salud del Inventario, extracted from the same files).
- Create: `equipos-dashboard.component.ts`.
- Delete: `equipos-list.component.ts`, `equipos-list.component.html`.
- Modify: `src/app/app.routes.ts` — replace the single `equipos` route with a shell + children block. **The `equipos` parent block must be listed BEFORE `equipos/:id`** (see Task 8 — otherwise `/equipos/inventario` gets misrouted to the detail page with `id="inventario"`).

---

### Task 1: Backend — Dashboard DTOs

**Files:**
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/EquipoFabricanteCount.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/EquipoDependenciaCount.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/EquipoSaludResumen.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/EquipoDashboardCompleto.java`

- [ ] **Step 1: Create the four records**

```java
package com.inia.soportedesk.equipos;

public record EquipoFabricanteCount(String fabricante, long total) {
}
```

```java
package com.inia.soportedesk.equipos;

public record EquipoDependenciaCount(String dependencia, long total) {
}
```

```java
package com.inia.soportedesk.equipos;

public record EquipoSaludResumen(
        long rojos,
        long amarillos,
        long ok,
        long sinPatrimonial,
        long sinUsuario,
        long sinSede
) {
}
```

```java
package com.inia.soportedesk.equipos;

import java.util.List;

public record EquipoDashboardCompleto(
        long total,
        long desktopCount,
        long laptopCount,
        long otrosCount,
        long sedeCentralCount,
        long eeasCount,
        List<EquipoFabricanteCount> distribucionPorFabricante,
        List<EquipoDependenciaCount> topDependencias,
        EquipoSaludResumen salud
) {
}
```

- [ ] **Step 2: Compile**

Run: `mvn -o compile` from `soportedesk-backend/`
Expected: BUILD SUCCESS

- [ ] **Step 3: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/EquipoFabricanteCount.java soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/EquipoDependenciaCount.java soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/EquipoSaludResumen.java soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/EquipoDashboardCompleto.java
git commit -m "feat(equipos): add dashboard aggregation DTOs"
```

---

### Task 2: Backend — extract `calcularSalud()`, add `getDashboardCompleto()` + endpoint

**Files:**
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/EquipoService.java`
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/EquipoController.java`
- Modify: `soportedesk-backend/src/test/java/com/inia/soportedesk/equipos/EquipoServiceTest.java`
- Modify: `soportedesk-backend/src/test/java/com/inia/soportedesk/equipos/EquipoControllerIT.java`

**Interfaces:**
- Produces: `EquipoService.getDashboardCompleto(): EquipoDashboardCompleto` — consumed by `EquipoController` (this task) and by `EquiposDashboardComponent`/`equipo.service.ts` (Task 3, 7).

- [ ] **Step 1: Write the failing service unit tests**

Add to `EquipoServiceTest.java` (uses the existing `equipo(String tipo, String sede)` helper, then sets the extra fields each test needs — same style already used by `getSalud_rojoWhenSinEncendidoMasDe12Meses`):

```java
    @Test
    void getDashboardCompleto_aggregatesFabricanteDependenciaAndSaludCounts() {
        VwInvComputerFull e1 = equipo("Desktop", "SEDE CENTRAL");
        e1.setComputerID(1L);
        e1.setFabricanteEquipo("Dell");
        e1.setOficinaId("UTI");
        e1.setUsuarioContacto("ana");
        e1.setUltimoEncendido(LocalDateTime.now());
        e1.setUltimaActualizacion(LocalDateTime.now());

        VwInvComputerFull e2 = equipo("Laptop", "EEA ANDENES");
        e2.setComputerID(2L);
        e2.setFabricanteEquipo("HP");
        e2.setOficinaId("UTI");
        e2.setUsuarioContacto(null);
        e2.setUltimoEncendido(LocalDateTime.now().minusMonths(14));
        e2.setUltimaActualizacion(LocalDateTime.now());

        VwInvComputerFull e3 = equipo("Servidor", null);
        e3.setComputerID(3L);
        e3.setFabricanteEquipo("Dell");
        e3.setOficinaId("OGRH");
        e3.setUsuarioContacto("beto");
        e3.setUltimoEncendido(LocalDateTime.now().minusMonths(7));
        e3.setUltimaActualizacion(LocalDateTime.now());

        EquipoEnrichment enrichE1 = new EquipoEnrichment();
        enrichE1.setComputerId(1L);
        enrichE1.setCodigoPatrimonial("PAT-1");

        when(repository.findFiltered(null, null, null, null, null, null)).thenReturn(List.of(e1, e2, e3));
        when(enrichmentRepository.findByComputerIdIn(List.of(1L, 2L, 3L))).thenReturn(List.of(enrichE1));

        EquipoDashboardCompleto result = service.getDashboardCompleto();

        assertThat(result.total()).isEqualTo(3);
        assertThat(result.desktopCount()).isEqualTo(1);
        assertThat(result.laptopCount()).isEqualTo(1);
        assertThat(result.otrosCount()).isEqualTo(1);
        assertThat(result.sedeCentralCount()).isEqualTo(1);
        assertThat(result.eeasCount()).isEqualTo(2);

        assertThat(result.distribucionPorFabricante())
                .extracting(EquipoFabricanteCount::fabricante, EquipoFabricanteCount::total)
                .containsExactly(
                        org.assertj.core.groups.Tuple.tuple("Dell", 2L),
                        org.assertj.core.groups.Tuple.tuple("HP", 1L)
                );

        assertThat(result.topDependencias())
                .extracting(EquipoDependenciaCount::dependencia, EquipoDependenciaCount::total)
                .containsExactly(
                        org.assertj.core.groups.Tuple.tuple("UTI", 2L),
                        org.assertj.core.groups.Tuple.tuple("OGRH", 1L)
                );

        assertThat(result.salud().rojos()).isEqualTo(1);
        assertThat(result.salud().amarillos()).isEqualTo(1);
        assertThat(result.salud().ok()).isEqualTo(1);
        assertThat(result.salud().sinPatrimonial()).isEqualTo(2);
        assertThat(result.salud().sinUsuario()).isEqualTo(1);
        assertThat(result.salud().sinSede()).isEqualTo(1);
    }

    @Test
    void getDashboardCompleto_onException_returnsEmptyDashboard() {
        when(repository.findFiltered(null, null, null, null, null, null)).thenThrow(new RuntimeException("db down"));

        EquipoDashboardCompleto result = service.getDashboardCompleto();

        assertThat(result.total()).isEqualTo(0);
        assertThat(result.distribucionPorFabricante()).isEmpty();
        assertThat(result.topDependencias()).isEmpty();
        assertThat(result.salud().rojos()).isEqualTo(0);
    }
```

- [ ] **Step 2: Run to verify failure**

Run: `mvn -o test -Dtest=EquipoServiceTest` from `soportedesk-backend/`
Expected: FAIL (compile error — `getDashboardCompleto`/DTOs not found)

- [ ] **Step 3: Extract `calcularSalud()` and refactor `buildSaludDto()`**

In `EquipoService.java`, replace the existing `buildSaludDto` method:

```java
    private EquipoSaludDto buildSaludDto(VwInvComputerFull e, EquipoEnrichment enrichment, LocalDateTime now) {
        long sinEncendido = e.getUltimoEncendido() == null ? Long.MAX_VALUE :
                ChronoUnit.MONTHS.between(e.getUltimoEncendido(), now);
        long sinActualizacion = e.getUltimaActualizacion() == null ? Long.MAX_VALUE :
                ChronoUnit.MONTHS.between(e.getUltimaActualizacion(), now);

        String nivel;
        if (sinEncendido > 12 || sinActualizacion > 6) nivel = "ROJO";
        else if (sinEncendido > 6 || sinActualizacion > 3) nivel = "AMARILLO";
        else nivel = "OK";

        boolean sinPatrimonial = enrichment == null || enrichment.getCodigoPatrimonial() == null
                || enrichment.getCodigoPatrimonial().isBlank();
        boolean sinUsuario = e.getUsuarioContacto() == null || e.getUsuarioContacto().isBlank();
        boolean sinSede = e.getSedeNombre() == null || e.getSedeNombre().isBlank();
        String estadoDepuracion = enrichment != null ? enrichment.getEstadoDepuracion() : null;

        return new EquipoSaludDto(
                e.getComputerID(), e.getNombreEquipo(), e.getSedeNombre(), e.getTipoEquipo(),
                e.getUsuarioContacto(),
                sinEncendido == Long.MAX_VALUE ? -1L : sinEncendido,
                sinActualizacion == Long.MAX_VALUE ? -1L : sinActualizacion,
                nivel, sinPatrimonial, sinUsuario, sinSede, estadoDepuracion);
    }
```

with:

```java
    private record SaludCalculo(
            String nivel, boolean sinPatrimonial, boolean sinUsuario, boolean sinSede,
            long sinEncendidoMeses, long sinActualizacionMeses) {
    }

    private SaludCalculo calcularSalud(VwInvComputerFull e, EquipoEnrichment enrichment, LocalDateTime now) {
        long sinEncendido = e.getUltimoEncendido() == null ? Long.MAX_VALUE :
                ChronoUnit.MONTHS.between(e.getUltimoEncendido(), now);
        long sinActualizacion = e.getUltimaActualizacion() == null ? Long.MAX_VALUE :
                ChronoUnit.MONTHS.between(e.getUltimaActualizacion(), now);

        String nivel;
        if (sinEncendido > 12 || sinActualizacion > 6) nivel = "ROJO";
        else if (sinEncendido > 6 || sinActualizacion > 3) nivel = "AMARILLO";
        else nivel = "OK";

        boolean sinPatrimonial = enrichment == null || enrichment.getCodigoPatrimonial() == null
                || enrichment.getCodigoPatrimonial().isBlank();
        boolean sinUsuario = e.getUsuarioContacto() == null || e.getUsuarioContacto().isBlank();
        boolean sinSede = e.getSedeNombre() == null || e.getSedeNombre().isBlank();

        return new SaludCalculo(nivel, sinPatrimonial, sinUsuario, sinSede,
                sinEncendido == Long.MAX_VALUE ? -1L : sinEncendido,
                sinActualizacion == Long.MAX_VALUE ? -1L : sinActualizacion);
    }

    private EquipoSaludDto buildSaludDto(VwInvComputerFull e, EquipoEnrichment enrichment, LocalDateTime now) {
        SaludCalculo calculo = calcularSalud(e, enrichment, now);
        String estadoDepuracion = enrichment != null ? enrichment.getEstadoDepuracion() : null;

        return new EquipoSaludDto(
                e.getComputerID(), e.getNombreEquipo(), e.getSedeNombre(), e.getTipoEquipo(),
                e.getUsuarioContacto(),
                calculo.sinEncendidoMeses(), calculo.sinActualizacionMeses(),
                calculo.nivel(), calculo.sinPatrimonial(), calculo.sinUsuario(), calculo.sinSede(),
                estadoDepuracion);
    }
```

- [ ] **Step 4: Run the existing `getSalud` tests to confirm the refactor didn't change behavior**

Run: `mvn -o test -Dtest=EquipoServiceTest` from `soportedesk-backend/`
Expected: the 2 pre-existing `getSalud_*` tests still PASS unchanged (the 2 new dashboard tests still FAIL — DTO/method not implemented yet)

- [ ] **Step 5: Implement `getDashboardCompleto()`**

Add to `EquipoService.java`, after `getSalud()`/`buildSaludDto()`:

```java
    public EquipoDashboardCompleto getDashboardCompleto() {
        try {
            List<VwInvComputerFull> equipos = repository.findFiltered(null, null, null, null, null, null);

            long total = equipos.size();
            long desktopCount = equipos.stream().filter(e -> DESKTOP.equals(e.getTipoEquipo())).count();
            long laptopCount = equipos.stream().filter(e -> LAPTOP.equals(e.getTipoEquipo())).count();
            long otrosCount = total - desktopCount - laptopCount;
            long sedeCentralCount = equipos.stream().filter(e -> SEDE_CENTRAL.equals(e.getSedeNombre())).count();
            long eeasCount = total - sedeCentralCount;

            List<EquipoFabricanteCount> distribucionPorFabricante = equipos.stream()
                    .collect(Collectors.groupingBy(
                            e -> e.getFabricanteEquipo() == null || e.getFabricanteEquipo().isBlank()
                                    ? "Sin fabricante" : e.getFabricanteEquipo(),
                            java.util.LinkedHashMap::new,
                            Collectors.counting()))
                    .entrySet().stream()
                    .map(entry -> new EquipoFabricanteCount(entry.getKey(), entry.getValue()))
                    .sorted(java.util.Comparator.comparing(EquipoFabricanteCount::fabricante))
                    .toList();

            List<EquipoDependenciaCount> topDependencias = equipos.stream()
                    .collect(Collectors.groupingBy(
                            e -> e.getOficinaId() == null || e.getOficinaId().isBlank()
                                    ? "Sin dependencia" : e.getOficinaId(),
                            java.util.LinkedHashMap::new,
                            Collectors.counting()))
                    .entrySet().stream()
                    .sorted(java.util.Map.Entry.<String, Long>comparingByValue(java.util.Comparator.reverseOrder()))
                    .limit(10)
                    .map(entry -> new EquipoDependenciaCount(entry.getKey(), entry.getValue()))
                    .toList();

            List<Long> ids = equipos.stream().map(VwInvComputerFull::getComputerID).toList();
            Map<Long, EquipoEnrichment> enrichmentMap = enrichmentRepository.findByComputerIdIn(ids).stream()
                    .collect(Collectors.toMap(EquipoEnrichment::getComputerId, e -> e));
            LocalDateTime now = LocalDateTime.now();

            long rojos = 0, amarillos = 0, ok = 0, sinPatrimonial = 0, sinUsuario = 0, sinSede = 0;
            for (VwInvComputerFull e : equipos) {
                SaludCalculo calculo = calcularSalud(e, enrichmentMap.get(e.getComputerID()), now);
                switch (calculo.nivel()) {
                    case "ROJO" -> rojos++;
                    case "AMARILLO" -> amarillos++;
                    default -> ok++;
                }
                if (calculo.sinPatrimonial()) sinPatrimonial++;
                if (calculo.sinUsuario()) sinUsuario++;
                if (calculo.sinSede()) sinSede++;
            }

            EquipoSaludResumen salud = new EquipoSaludResumen(rojos, amarillos, ok, sinPatrimonial, sinUsuario, sinSede);

            return new EquipoDashboardCompleto(
                    total, desktopCount, laptopCount, otrosCount, sedeCentralCount, eeasCount,
                    distribucionPorFabricante, topDependencias, salud);
        } catch (Exception ex) {
            return new EquipoDashboardCompleto(0, 0, 0, 0, 0, 0, List.of(), List.of(),
                    new EquipoSaludResumen(0, 0, 0, 0, 0, 0));
        }
    }
```

- [ ] **Step 6: Run the service tests to verify they pass**

Run: `mvn -o test -Dtest=EquipoServiceTest` from `soportedesk-backend/`
Expected: PASS (all tests, including the 2 new ones)

- [ ] **Step 7: Write the failing controller integration tests**

Add to `EquipoControllerIT.java`:

```java
    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "WRITE_equipos"})
    void dashboardCompleto_withWriteAuthority_returnsOk() throws Exception {
        when(service.getDashboardCompleto()).thenReturn(new EquipoDashboardCompleto(
                10, 5, 3, 2, 6, 4, List.of(), List.of(), new EquipoSaludResumen(0, 0, 10, 0, 0, 0)));

        mockMvc.perform(get("/api/equipos/dashboard/completo"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total", is(10)));
    }

    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "READ_equipos"})
    void dashboardCompleto_withOnlyReadAuthority_returnsForbidden() throws Exception {
        mockMvc.perform(get("/api/equipos/dashboard/completo"))
                .andExpect(status().isForbidden());
    }
```

- [ ] **Step 8: Add the controller endpoint**

In `EquipoController.java`, add after `getSalud()`:

```java
    @GetMapping("/dashboard/completo")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_equipos')")
    public EquipoDashboardCompleto dashboardCompleto() {
        return service.getDashboardCompleto();
    }
```

- [ ] **Step 9: Run the full `EquipoControllerIT` + `EquipoServiceTest` classes**

Run: `mvn -o test -Dtest=EquipoControllerIT,EquipoServiceTest` from `soportedesk-backend/`
Expected: PASS (all tests)

- [ ] **Step 10: Run the full backend test suite**

Run: `mvn -o test` from `soportedesk-backend/`
Expected: BUILD SUCCESS, 0 failures

- [ ] **Step 11: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/ soportedesk-backend/src/test/java/com/inia/soportedesk/equipos/
git commit -m "feat(equipos): add GET /api/equipos/dashboard/completo endpoint"
```

---

### Task 3: Frontend — model and service additions

**Files:**
- Modify: `soportedesk-frontend/src/app/features/equipos/equipo.model.ts`
- Modify: `soportedesk-frontend/src/app/features/equipos/equipo.service.ts`

**Interfaces:**
- Produces: `EquipoDashboardCompleto` (TS interface matching the Java record 1:1) and `EquipoService.getDashboardCompleto(): Observable<EquipoDashboardCompleto>` — consumed by `EquiposDashboardComponent` (Task 7).

- [ ] **Step 1: Add model interfaces**

Append to `equipo.model.ts`:

```typescript
export interface EquipoFabricanteCount {
  fabricante: string;
  total: number;
}

export interface EquipoDependenciaCount {
  dependencia: string;
  total: number;
}

export interface EquipoSaludResumen {
  rojos: number;
  amarillos: number;
  ok: number;
  sinPatrimonial: number;
  sinUsuario: number;
  sinSede: number;
}

export interface EquipoDashboardCompleto {
  total: number;
  desktopCount: number;
  laptopCount: number;
  otrosCount: number;
  sedeCentralCount: number;
  eeasCount: number;
  distribucionPorFabricante: EquipoFabricanteCount[];
  topDependencias: EquipoDependenciaCount[];
  salud: EquipoSaludResumen;
}
```

- [ ] **Step 2: Add service method**

In `equipo.service.ts`, add `EquipoDashboardCompleto` to the existing model import and add this method (near `getSalud()`):

```typescript
  getDashboardCompleto(): Observable<EquipoDashboardCompleto> {
    return this.http.get<EquipoDashboardCompleto>(`${this.apiUrl}/dashboard/completo`);
  }
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit -p tsconfig.json` from `soportedesk-frontend/`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add soportedesk-frontend/src/app/features/equipos/equipo.model.ts soportedesk-frontend/src/app/features/equipos/equipo.service.ts
git commit -m "feat(equipos): add dashboard model and service method"
```

---

### Task 4: Frontend — `EquiposShellComponent` + `equipos.shared.scss`

**Files:**
- Rename: `equipos-list.component.scss` → `equipos.shared.scss`
- Create: `soportedesk-frontend/src/app/features/equipos/equipos-shell.component.ts`

- [ ] **Step 1: Rename the scss file**

```bash
git mv soportedesk-frontend/src/app/features/equipos/equipos-list.component.scss soportedesk-frontend/src/app/features/equipos/equipos.shared.scss
```

- [ ] **Step 2: Prepend `.ad-tabs`/`.ad-tabs a` and append `.empty-state`**

At the very top of `equipos.shared.scss`, before the existing `.equipos-page { ... }` block, add:

```scss
.ad-tabs {
  display: flex;
  gap: 4px;
  margin-top: 4px;
  border-bottom: 1px solid var(--color-border);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.ad-tabs a {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 10px 6px;
  margin-bottom: -1px;
  border-bottom: 2px solid transparent;
  color: var(--color-text-secondary);
  font-weight: 600;
  font-size: 13.5px;
  text-decoration: none;
  white-space: nowrap;
  transition: var(--transition);

  svg { flex: 0 0 auto; }

  &:hover { color: var(--color-text); }

  &.active {
    color: var(--color-accent);
    border-color: var(--color-accent);
  }
}
```

At the end of the file, add:

```scss
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
```

- [ ] **Step 3: Create `EquiposShellComponent`**

```typescript
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-equipos-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="module-page equipos-page">
      <div class="module-header">
        <div>
          <span class="module-eyebrow">Inventario</span>
          <h2>Inventario de Equipos</h2>
          <p>Inventario GLPI, usuarios responsables, ubicacion y hardware detectado.</p>
        </div>
      </div>

      <nav class="ad-tabs" aria-label="Inventario de Equipos">
        <a routerLink="inventario" routerLinkActive="active">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          Inventario
        </a>
        <a *ngIf="canWrite" routerLink="mantenimiento" routerLinkActive="active">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          Mantenimiento
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
  styleUrl: './equipos.shared.scss',
})
export class EquiposShellComponent {
  private authService = inject(AuthService);

  get canWrite(): boolean {
    return this.authService.canWrite('equipos');
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add soportedesk-frontend/src/app/features/equipos/equipos-shell.component.ts soportedesk-frontend/src/app/features/equipos/equipos.shared.scss
git commit -m "feat(equipos): add EquiposShellComponent with tab navigation"
```

---

### Task 5: Frontend — `EquiposInventarioComponent`

**Files:**
- Create: `soportedesk-frontend/src/app/features/equipos/equipos-inventario.component.ts`
- Create: `soportedesk-frontend/src/app/features/equipos/equipos-inventario.component.html`

This is the current `equipos-list.component.ts`/`.html`, keeping everything **except** `activeTab`/`setTab`, `salud`, `saludKpis`, `loadSalud()`, `onViewSalud()`, `mesesLabel()` (those move to Task 6), and dropping the outer tab-toggle header (now lives in the shell).

- [ ] **Step 1: Create the component class**

```typescript
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GenericTableComponent, TableColumn } from '../../shared/generic-table/generic-table.component';
import { EquipoKpis, EquipoResumen } from './equipo.model';
import { EquipoService } from './equipo.service';

interface EquipoTableRow extends EquipoResumen {
  usuarioLimpio: string;
  fabricanteModelo: string;
  cpuCorto: string;
  ramLabel: string;
  diskLabel: string;
}

@Component({
  selector: 'app-equipos-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule, GenericTableComponent],
  templateUrl: './equipos-inventario.component.html',
  styleUrl: './equipos.shared.scss',
})
export class EquiposInventarioComponent implements OnInit {
  private service = inject(EquipoService);
  private router = inject(Router);

  items = signal<EquipoTableRow[]>([]);
  kpis = signal<EquipoKpis | null>(null);
  sedes = signal<string[]>([]);
  tipos = signal<string[]>([]);
  dependencias = signal<string[]>([]);
  subdependencias = signal<string[]>([]);
  fabricantes = signal<string[]>([]);
  selectedSede = signal('');
  selectedTipo = signal('');
  selectedDependencia = signal('');
  selectedSubdependencia = signal('');
  selectedFabricante = signal('');
  searchTerm = signal('');

  kpiCards = computed(() => {
    const k = this.kpis();
    return [
      { label: 'Total Activos', value: k?.totalActivos ?? 0, tone: 'blue' },
      { label: 'Desktop', value: k?.desktopCount ?? 0, tone: 'indigo' },
      { label: 'Laptop', value: k?.laptopCount ?? 0, tone: 'violet' },
      { label: 'Otros', value: k?.otrosCount ?? 0, tone: 'gray' },
      { label: 'Sede Central', value: k?.sedeCentralCount ?? 0, tone: 'green' },
      { label: 'EEAs', value: k?.eeasCount ?? 0, tone: 'orange' },
    ];
  });

  columns: TableColumn[] = [
    { key: 'nombreEquipo', label: 'Equipo' },
    { key: 'usuarioLimpio', label: 'Usuario' },
    { key: 'sedeNombre', label: 'Sede' },
    { key: 'oficinaId', label: 'Dependencia' },
    { key: 'tipoEquipo', label: 'Tipo' },
    { key: 'fabricanteModelo', label: 'Fabricante / Modelo' },
    { key: 'cpuCorto', label: 'CPU' },
    { key: 'ramLabel', label: 'RAM' },
    { key: 'diskLabel', label: 'Disco' },
    { key: 'ipEquipo', label: 'IP' },
  ];

  ngOnInit(): void {
    this.loadKpis();
    this.loadSedes();
    this.loadTipos();
    this.loadDependencias();
    this.loadFabricantes();
    this.load();
  }

  load(): void {
    this.service
      .getAll({
        search: this.searchTerm(),
        sede: this.selectedSede(),
        tipo: this.selectedTipo(),
        dependencia: this.selectedDependencia(),
        subdependencia: this.selectedSubdependencia(),
        fabricante: this.selectedFabricante(),
      })
      .subscribe((data) => this.items.set(data.map((item) => this.toTableRow(item))));
  }

  onSearch(term: string): void {
    this.searchTerm.set(term);
    this.load();
  }

  onSedeChange(value: string): void {
    this.selectedSede.set(value);
    this.selectedDependencia.set('');
    this.selectedSubdependencia.set('');
    this.subdependencias.set([]);
    this.loadDependencias();
    this.load();
  }

  onTipoChange(value: string): void {
    this.selectedTipo.set(value);
    this.load();
  }

  onDependenciaChange(value: string): void {
    this.selectedDependencia.set(value);
    this.selectedSubdependencia.set('');
    this.loadSubdependencias();
    this.load();
  }

  onSubdependenciaChange(value: string): void {
    this.selectedSubdependencia.set(value);
    this.load();
  }

  onFabricanteChange(value: string): void {
    this.selectedFabricante.set(value);
    this.load();
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedSede.set('');
    this.selectedTipo.set('');
    this.selectedDependencia.set('');
    this.selectedSubdependencia.set('');
    this.selectedFabricante.set('');
    this.loadDependencias();
    this.subdependencias.set([]);
    this.load();
  }

  onView(item: EquipoTableRow): void {
    this.router.navigate(['/equipos', item.computerID]);
  }

  private loadKpis(): void {
    this.service.getKpis().subscribe((data) => this.kpis.set(data));
  }

  private loadSedes(): void {
    this.service.getSedes().subscribe((data) => this.sedes.set(data));
  }

  private loadTipos(): void {
    this.service.getTipos().subscribe((data) => this.tipos.set(data));
  }

  private loadDependencias(): void {
    this.service.getDependencias(this.selectedSede() || undefined)
      .subscribe((data) => this.dependencias.set(data));
  }

  private loadSubdependencias(): void {
    this.service.getSubdependencias(
      this.selectedSede() || undefined,
      this.selectedDependencia() || undefined
    ).subscribe((data) => this.subdependencias.set(data));
  }

  private loadFabricantes(): void {
    this.service.getFabricantes().subscribe((data) => this.fabricantes.set(data));
  }

  private toTableRow(item: EquipoResumen): EquipoTableRow {
    return {
      ...item,
      usuarioLimpio: this.stripDomain(item.usuarioContacto),
      fabricanteModelo: [item.fabricanteEquipo, item.modeloEquipo].filter(Boolean).join(' '),
      cpuCorto: this.truncate(item.cpuModelos, 30),
      ramLabel: this.gbLabel(item.ramTotalGb),
      diskLabel: this.gbLabel(item.diskTotalGb),
    };
  }

  private stripDomain(value: string | null | undefined): string {
    return (value ?? '').replace(/@INIA-RED$/i, '');
  }

  private truncate(value: string | null | undefined, max: number): string {
    const text = value ?? '';
    return text.length > max ? `${text.slice(0, max - 1)}...` : text;
  }

  private gbLabel(value: number | null | undefined): string {
    return value == null ? '' : `${value} GB`;
  }
}
```

- [ ] **Step 2: Create the template**

```html
<section class="kpi-grid">
  <article *ngFor="let card of kpiCards()" class="kpi-card" [class]="'tone-' + card.tone">
    <span>{{ card.label }}</span>
    <strong>{{ card.value }}</strong>
  </article>
</section>

<section class="filter-bar">
  <label class="mobile-search">
    <span>Buscar</span>
    <input
      type="text"
      [ngModel]="searchTerm()"
      (ngModelChange)="onSearch($event)"
      placeholder="Equipo o usuario"
    />
  </label>

  <label>
    <span>Sede</span>
    <select [ngModel]="selectedSede()" (ngModelChange)="onSedeChange($event)">
      <option value="">Todas</option>
      <option *ngFor="let sede of sedes()" [value]="sede">{{ sede }}</option>
    </select>
  </label>

  <label>
    <span>Dependencia</span>
    <select [ngModel]="selectedDependencia()" (ngModelChange)="onDependenciaChange($event)">
      <option value="">Todas</option>
      <option *ngFor="let dep of dependencias()" [value]="dep">{{ dep }}</option>
    </select>
  </label>

  <label>
    <span>Subdependencia</span>
    <select [ngModel]="selectedSubdependencia()" (ngModelChange)="onSubdependenciaChange($event)"
            [disabled]="!selectedDependencia()">
      <option value="">Todas</option>
      <option *ngFor="let sub of subdependencias()" [value]="sub">{{ sub }}</option>
    </select>
  </label>

  <label>
    <span>Tipo</span>
    <select [ngModel]="selectedTipo()" (ngModelChange)="onTipoChange($event)">
      <option value="">Todos</option>
      <option *ngFor="let tipo of tipos()" [value]="tipo">{{ tipo }}</option>
    </select>
  </label>

  <label>
    <span>Fabricante</span>
    <select [ngModel]="selectedFabricante()" (ngModelChange)="onFabricanteChange($event)">
      <option value="">Todos</option>
      <option *ngFor="let fab of fabricantes()" [value]="fab">{{ fab }}</option>
    </select>
  </label>

  <button type="button" (click)="clearFilters()">Limpiar filtros</button>
</section>

<div class="desktop-table-shell">
  <app-generic-table
    [columns]="columns"
    [data]="items()"
    [canEdit]="false"
    [canView]="true"
    [initialSearch]="searchTerm()"
    emptyMessage="Sin equipos activos registrados"
    (searchChange)="onSearch($event)"
    (view)="onView($event)"
  />
</div>

<section class="mobile-equipment-list" aria-label="Equipos">
  <article *ngFor="let item of items()" class="equipment-card">
    <div class="card-head">
      <div>
        <strong>{{ item.nombreEquipo }}</strong>
        <span>{{ item.usuarioLimpio || 'Sin usuario' }}</span>
      </div>
      <em>{{ item.tipoEquipo || 'Equipo' }}</em>
    </div>

    <dl>
      <div>
        <dt>Sede</dt>
        <dd>{{ item.sedeNombre || '-' }}</dd>
      </div>
      <div>
        <dt>Dependencia</dt>
        <dd>{{ item.oficinaId || '-' }}</dd>
      </div>
      <div>
        <dt>Subdependencia</dt>
        <dd>{{ item.unidadId || '-' }}</dd>
      </div>
      <div>
        <dt>Marca / Modelo</dt>
        <dd>{{ item.fabricanteModelo || '-' }}</dd>
      </div>
      <div>
        <dt>CPU</dt>
        <dd>{{ item.cpuCorto || '-' }}</dd>
      </div>
      <div>
        <dt>RAM</dt>
        <dd>{{ item.ramLabel || '-' }}</dd>
      </div>
      <div>
        <dt>Disco</dt>
        <dd>{{ item.diskLabel || '-' }}</dd>
      </div>
      <div>
        <dt>IP</dt>
        <dd>{{ item.ipEquipo || '-' }}</dd>
      </div>
    </dl>

    <button type="button" (click)="onView(item)">Ver detalle</button>
  </article>

  <p class="mobile-empty" *ngIf="items().length === 0">Sin equipos activos registrados</p>
</section>
```

- [ ] **Step 3: Commit**

```bash
git add soportedesk-frontend/src/app/features/equipos/equipos-inventario.component.ts soportedesk-frontend/src/app/features/equipos/equipos-inventario.component.html
git commit -m "feat(equipos): add EquiposInventarioComponent (read-only browse)"
```

---

### Task 6: Frontend — `EquiposMantenimientoComponent`

**Files:**
- Create: `soportedesk-frontend/src/app/features/equipos/equipos-mantenimiento.component.ts`
- Create: `soportedesk-frontend/src/app/features/equipos/equipos-mantenimiento.component.html`

This is the current "Salud del inventario" tab content — the alert queue admins use to decide which equipos need enrichment. Row click navigates to `/equipos/:id` (unchanged `EquipoDetailComponent`, whose Mantenimiento/Enriquecimiento section is already gated by `auth.canWrite('equipos')`).

- [ ] **Step 1: Create the component class**

```typescript
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { EquipoSaludItem } from './equipo.model';
import { EquipoService } from './equipo.service';

@Component({
  selector: 'app-equipos-mantenimiento',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './equipos-mantenimiento.component.html',
  styleUrl: './equipos.shared.scss',
})
export class EquiposMantenimientoComponent implements OnInit {
  private service = inject(EquipoService);
  private router = inject(Router);

  salud = signal<EquipoSaludItem[]>([]);

  saludKpis = computed(() => {
    const s = this.salud();
    const rojos = s.filter((x) => x.nivelAlerta === 'ROJO').length;
    const amarillos = s.filter((x) => x.nivelAlerta === 'AMARILLO').length;
    const sinPatrimonial = s.filter((x) => x.sinCodigoPatrimonial).length;
    const sinUsuario = s.filter((x) => x.sinUsuario).length;
    const sinSede = s.filter((x) => x.sinSede).length;
    return [
      { label: 'Críticos (Rojo)', value: rojos, tone: 'red' },
      { label: 'Advertencia (Amarillo)', value: amarillos, tone: 'yellow' },
      { label: 'Sin cód. patrimonial', value: sinPatrimonial, tone: 'orange' },
      { label: 'Sin usuario', value: sinUsuario, tone: 'gray' },
      { label: 'Sin sede', value: sinSede, tone: 'gray' },
    ];
  });

  ngOnInit(): void {
    this.loadSalud();
  }

  loadSalud(): void {
    this.service.getSalud().subscribe((data) => this.salud.set(data));
  }

  onViewSalud(item: EquipoSaludItem): void {
    this.router.navigate(['/equipos', item.computerID]);
  }

  mesesLabel(val: number): string {
    if (val < 0) return 'Sin dato';
    if (val === 0) return 'Este mes';
    return `${val} mes${val === 1 ? '' : 'es'}`;
  }
}
```

- [ ] **Step 2: Create the template**

```html
<section class="kpi-grid">
  <article *ngFor="let card of saludKpis()" class="kpi-card" [class]="'tone-' + card.tone">
    <span>{{ card.label }}</span>
    <strong>{{ card.value }}</strong>
  </article>
</section>

<div class="salud-table-shell" *ngIf="salud().length; else sinAlertas">
  <table class="salud-table">
    <thead>
      <tr>
        <th>Alerta</th>
        <th>Equipo</th>
        <th>Sede</th>
        <th>Tipo</th>
        <th>Usuario</th>
        <th>Sin encendido</th>
        <th>Sin actualiz.</th>
        <th>Problemas</th>
        <th>Estado dep.</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      <tr *ngFor="let s of salud()" [class]="'row-' + s.nivelAlerta.toLowerCase()">
        <td>
          <span class="nivel-badge" [class]="'nivel-' + s.nivelAlerta.toLowerCase()">
            {{ s.nivelAlerta }}
          </span>
        </td>
        <td>{{ s.nombreEquipo }}</td>
        <td>{{ s.sedeNombre || '-' }}</td>
        <td>{{ s.tipoEquipo || '-' }}</td>
        <td>{{ s.usuarioContacto || '-' }}</td>
        <td>{{ mesesLabel(s.sinEncendidoMeses) }}</td>
        <td>{{ mesesLabel(s.sinActualizacionMeses) }}</td>
        <td>
          <span class="tag-warn" *ngIf="s.sinCodigoPatrimonial">Sin patrimonial</span>
          <span class="tag-warn" *ngIf="s.sinUsuario">Sin usuario</span>
          <span class="tag-warn" *ngIf="s.sinSede">Sin sede</span>
        </td>
        <td>{{ s.estadoDepuracion || '-' }}</td>
        <td><button type="button" class="view-link" (click)="onViewSalud(s)">Ver</button></td>
      </tr>
    </tbody>
  </table>
</div>
<ng-template #sinAlertas>
  <p class="salud-ok">Todo el inventario está al día. No hay alertas.</p>
</ng-template>
```

- [ ] **Step 3: Commit**

```bash
git add soportedesk-frontend/src/app/features/equipos/equipos-mantenimiento.component.ts soportedesk-frontend/src/app/features/equipos/equipos-mantenimiento.component.html
git commit -m "feat(equipos): add EquiposMantenimientoComponent (Salud del Inventario)"
```

---

### Task 7: Frontend — `EquiposDashboardComponent`

**Files:**
- Create: `soportedesk-frontend/src/app/features/equipos/equipos-dashboard.component.ts`

Uses the existing global `.module-dash-*` classes from `src/styles.scss` (same ones `impresoras-dashboard.component.ts`/`correos-dashboard.component.ts`/etc. already use) — no new global CSS needed.

- [ ] **Step 1: Create the component**

```typescript
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ChartConfiguration, ChartData } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { EquipoService } from './equipo.service';
import { EquipoDashboardCompleto } from './equipo.model';

@Component({
  selector: 'app-equipos-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  template: `
    <div class="module-dash">
      <div class="module-dash-toolbar">
        <div class="module-dash-title">
          <strong>Panorama del inventario de equipos</strong>
          <span>Distribucion por fabricante, dependencias con mas equipos y salud general del parque.</span>
        </div>
        <div class="module-dash-actions">
          <span class="module-dash-updated" *ngIf="updatedAt">Actualizado {{ updatedAt | date:'HH:mm' }}</span>
          <button type="button" class="module-dash-refresh" (click)="load()" [disabled]="loading">
            <span class="module-dash-refresh-icon" aria-hidden="true"></span>
            {{ loading ? 'Actualizando' : 'Actualizar' }}
          </button>
        </div>
      </div>

      <div class="module-dash-notice" *ngIf="error">No se pudo cargar. Se mantiene la ultima vista disponible.</div>

      <section class="module-dash-stats" *ngIf="dashboard as d">
        <div class="module-dash-stat"><span>Total</span><strong>{{ d.total }}</strong><small>Equipos registrados</small></div>
        <div class="module-dash-stat"><span>Desktop</span><strong>{{ d.desktopCount }}</strong><small>Equipos de escritorio</small></div>
        <div class="module-dash-stat"><span>Laptop</span><strong>{{ d.laptopCount }}</strong><small>Equipos portatiles</small></div>
        <div class="module-dash-stat"><span>Otros</span><strong>{{ d.otrosCount }}</strong><small>Servidores y demas</small></div>
        <div class="module-dash-stat tone-info"><span>Sede Central</span><strong>{{ d.sedeCentralCount }}</strong><small>En sede central</small></div>
        <div class="module-dash-stat tone-info"><span>EEAs</span><strong>{{ d.eeasCount }}</strong><small>En estaciones experimentales</small></div>
      </section>

      <section class="module-dash-grid" *ngIf="dashboard as d">
        <article class="module-dash-card module-dash-chart">
          <header class="module-dash-card__header">
            <div>
              <strong>Distribucion por fabricante</strong>
              <span>{{ d.distribucionPorFabricante.length }} fabricantes registrados</span>
            </div>
          </header>
          <canvas baseChart [data]="chartData" [options]="chartOptions" [type]="'bar'"></canvas>
        </article>

        <div class="module-dash-side">
          <article class="module-dash-card">
            <header class="module-dash-card__header">
              <div>
                <strong>Resumen de salud</strong>
                <span>Participacion por nivel de alerta</span>
              </div>
            </header>
            <div class="module-dash-progress">
              <div class="module-dash-progress-row">
                <span>Criticos (Rojo)</span><strong>{{ percent(d.salud.rojos, d.total) }}%</strong>
                <div class="module-dash-track"><i [style.width.%]="percent(d.salud.rojos, d.total)"></i></div>
              </div>
              <div class="module-dash-progress-row">
                <span>Advertencia (Amarillo)</span><strong>{{ percent(d.salud.amarillos, d.total) }}%</strong>
                <div class="module-dash-track"><i [style.width.%]="percent(d.salud.amarillos, d.total)"></i></div>
              </div>
              <div class="module-dash-progress-row">
                <span>Al dia (OK)</span><strong>{{ percent(d.salud.ok, d.total) }}%</strong>
                <div class="module-dash-track"><i [style.width.%]="percent(d.salud.ok, d.total)"></i></div>
              </div>
            </div>
            <div class="module-dash-list">
              <div class="module-dash-row tone-warning"><strong>Sin codigo patrimonial</strong><small>{{ d.salud.sinPatrimonial }} equipos</small></div>
              <div class="module-dash-row tone-warning"><strong>Sin usuario</strong><small>{{ d.salud.sinUsuario }} equipos</small></div>
              <div class="module-dash-row tone-warning"><strong>Sin sede</strong><small>{{ d.salud.sinSede }} equipos</small></div>
            </div>
          </article>

          <article class="module-dash-card">
            <header class="module-dash-card__header">
              <div>
                <strong>Top dependencias</strong>
                <span>Dependencias con mas equipos registrados</span>
              </div>
              <span class="badge">{{ d.topDependencias.length }}</span>
            </header>
            <div class="module-dash-list">
              <div class="module-dash-row tone-info" *ngFor="let row of d.topDependencias">
                <strong>{{ row.dependencia }}</strong>
                <small>{{ row.total }} equipos</small>
              </div>
            </div>
            <p *ngIf="!d.topDependencias.length">Sin dependencias registradas.</p>
          </article>
        </div>
      </section>

      <section class="empty-state" *ngIf="!dashboard && !loading">
        <strong>Sin datos de dashboard</strong>
        <span>El servicio devolvio un resumen vacio o no disponible.</span>
      </section>
    </div>
  `,
  styleUrl: './equipos.shared.scss',
})
export class EquiposDashboardComponent implements OnInit {
  private service = inject(EquipoService);

  dashboard: EquipoDashboardCompleto | null = null;
  loading = false;
  error = false;
  updatedAt: Date | null = null;

  chartData: ChartData<'bar', number[], string> = {
    labels: [],
    datasets: [{ data: [], label: 'Equipos', backgroundColor: '#16a34a' }],
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
        this.updatedAt = new Date();
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

  private applyChart(dashboard: EquipoDashboardCompleto | null): void {
    const rows = dashboard?.distribucionPorFabricante ?? [];
    this.chartData = {
      labels: rows.map((row) => row.fabricante),
      datasets: [{ data: rows.map((row) => row.total), label: 'Equipos', backgroundColor: '#16a34a' }],
    };
  }

  percent(value: number, total: number): number {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  }
}
```

`#16a34a` matches `--color-equipos` (same green already used for the module's KPI tone and sidebar icon).

- [ ] **Step 2: Commit**

```bash
git add soportedesk-frontend/src/app/features/equipos/equipos-dashboard.component.ts
git commit -m "feat(equipos): add EquiposDashboardComponent"
```

---

### Task 8: Wire routes, retire the old page, full verification

**Files:**
- Modify: `soportedesk-frontend/src/app/app.routes.ts:41-52`
- Delete: `equipos-list.component.ts`, `equipos-list.component.html`

- [ ] **Step 1: Replace the equipos route block**

Replace (current lines 41-52):

```typescript
      {
        path: 'equipos/:id',
        canActivate: [moduloGuard('equipos')],
        loadComponent: () =>
          import('./features/equipos/equipo-detail.component').then((m) => m.EquipoDetailComponent),
      },
      {
        path: 'equipos',
        canActivate: [moduloGuard('equipos')],
        loadComponent: () =>
          import('./features/equipos/equipos-list.component').then((m) => m.EquiposListComponent),
      },
```

with (note the order: the `equipos` parent block comes **before** `equipos/:id` — Angular tries sibling routes in array order, so `/equipos/inventario` must resolve against the parent's children first; if `equipos/:id` were tried first it would wrongly match with `id="inventario"`. When `/equipos/123` is requested, the parent's children fail to match `"123"` literally, so Angular backtracks to try `equipos/:id` next, which matches correctly):

```typescript
      {
        path: 'equipos',
        loadComponent: () =>
          import('./features/equipos/equipos-shell.component').then((m) => m.EquiposShellComponent),
        children: [
          { path: '', redirectTo: 'inventario', pathMatch: 'full' },
          {
            path: 'inventario',
            canActivate: [moduloGuard('equipos')],
            loadComponent: () =>
              import('./features/equipos/equipos-inventario.component').then((m) => m.EquiposInventarioComponent),
          },
          {
            path: 'mantenimiento',
            canActivate: [moduloGuard('equipos', { write: true })],
            loadComponent: () =>
              import('./features/equipos/equipos-mantenimiento.component').then((m) => m.EquiposMantenimientoComponent),
          },
          {
            path: 'dashboard',
            canActivate: [moduloGuard('equipos', { write: true })],
            loadComponent: () =>
              import('./features/equipos/equipos-dashboard.component').then((m) => m.EquiposDashboardComponent),
          },
        ],
      },
      {
        path: 'equipos/:id',
        canActivate: [moduloGuard('equipos')],
        loadComponent: () =>
          import('./features/equipos/equipo-detail.component').then((m) => m.EquipoDetailComponent),
      },
```

No new guard import needed (reuses `moduloGuard`, already imported).

- [ ] **Step 2: Delete the retired files**

```bash
rm soportedesk-frontend/src/app/features/equipos/equipos-list.component.ts soportedesk-frontend/src/app/features/equipos/equipos-list.component.html
```

- [ ] **Step 3: Build to catch dangling references**

Run: `npx ng build --configuration=development` from `soportedesk-frontend/`
Expected: BUILD SUCCESS

- [ ] **Step 4: Run the full backend test suite**

Run: `mvn -o test` from `soportedesk-backend/`
Expected: BUILD SUCCESS, 0 failures

- [ ] **Step 5: Restart the dev backend and frontend, verify manually in the browser**

Confirm:
- `/equipos` redirects to `/equipos/inventario`, shows KPI grid + filters + table/mobile-list, row click opens `/equipos/:id` with no Mantenimiento section visible for a user without `WRITE_equipos`.
- `/equipos/inventario`, `/equipos/mantenimiento`, `/equipos/dashboard` all resolve to the correct component — **not** to `EquipoDetailComponent`'s "Equipo no encontrado" error (this would indicate the route ordering from Step 1 is wrong).
- `/equipos/123` (a real `ComputerID` from the inventory) still opens the ficha correctly.
- Mantenimiento and Dashboard tabs are hidden from the nav and blocked by direct URL for a user with only `READ_equipos`.
- Dashboard shows KPI row + fabricante chart + salud resumen + top dependencias with real data.

- [ ] **Step 6: Commit**

```bash
git add soportedesk-frontend/src/app/app.routes.ts
git add -u soportedesk-frontend/src/app/features/equipos/
git commit -m "feat(equipos): wire 3-tab routing, retire single-page EquiposListComponent"
```

---

## Self-Review Notes

- **Spec coverage**: §2 (rutas) → Task 8. §3 (componentes) → Tasks 4, 5, 6. §4 (backend) → Tasks 1-2. §5 (Inventario) → Task 5. §6 (Mantenimiento) → Task 6. §7 (Dashboard) → Task 7. §8 (manejo de errores) → Task 2 Step 5 (try/catch → empty DTO) + Task 7 (frontend error banner). §10 (fuera de alcance) confirmed — `EquipoDetailComponent`, `/kpis`, `/salud` untouched.
- **Placeholder scan**: none found — every step has complete, runnable code.
- **Type consistency**: `EquipoDashboardCompleto`/`EquipoFabricanteCount`/`EquipoDependenciaCount`/`EquipoSaludResumen` field names match 1:1 between the Java records (Task 1) and TS interfaces (Task 3), used identically in Task 2 (backend) and Task 7 (frontend).
- **Routing collision caught during planning**: Equipos is the only one of the 4 redesigned modules with both a per-item detail route (`/equipos/:id`) and now child routes under the same base path — Task 8 explicitly documents why the `equipos` parent block must precede `equipos/:id` in the array, and Step 5's manual verification specifically checks for this failure mode.
- **Test coverage**: no pre-existing Angular specs for `equipos-list.component.ts` to port (confirmed via repo search) — only backend tests needed updates (Task 2).
