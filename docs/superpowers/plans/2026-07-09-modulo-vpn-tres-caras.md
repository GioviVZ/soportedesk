# Módulo VPN — Rediseño en 3 caras — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the single VPN page (`vpn-list.component.ts`) into 3 routed tabs — Registros (read-only + create), Administración (existing approval workflow), Dashboard (new analytics) — mirroring the just-completed AD module redesign, plus fix an unauthorized backend endpoint.

**Architecture:** New `VpnShellComponent` owns the tab nav + `<router-outlet>`; three lazy-loaded child routes replace the single `/vpn` route. A new shared `VpnDetailComponent` (presentational, mirrors `ad-user-detail.component.ts`) is reused by both Registros (read-only) and Administración (with decision panel) to avoid duplicating the ~160-line detail template. Backend gets one new aggregation endpoint (`GET /api/vpn/dashboard/completo`, same lenient-catch pattern as `ActiveDirectoryService.obtenerDashboardCompleto()`) and one `@PreAuthorize` fix.

**Tech Stack:** Angular 17+ standalone components, Spring Boot 3 / Spring Security `@PreAuthorize`, existing shared components (`app-modal`, `app-generic-table`, `app-status-badge`, `app-section-card`, `app-vencimiento-badge`, `app-field`).

## Global Constraints

- Follow the spec exactly: `docs/superpowers/specs/2026-07-09-modulo-vpn-tres-caras-design.md`.
- Reuse global CSS (`module-page`/`module-header`/`module-eyebrow`/`module-stats`/`stat-pill`/`btn`/`card`/`badge` from `src/styles.scss` and `--color-vpn`/`--color-vpn-light` tokens from `src/app/core/styles/_variables.scss`) — no new hardcoded hex in Angular templates (Chart.js JS config hex literals matching a token's value are the established exception, same as AD's dashboard chart).
- Do not change any existing write operation's business logic (create/update/aprobar/rechazar/observar/delete) — only relocate/restyle the UI and add the two backend additions from the spec.
- Vencimiento threshold: vencido = `vence < hoy`; por vencer = `0 <= diffDias <= 30` (must match `vencimientoStatus()` in the current `vpn-list.component.ts:286-296` exactly).
- Every new/modified backend authorization change must have a passing `@WithMockUser` test proving both the allow and the deny path.

---

## File Structure

**Backend (`soportedesk-backend/src/main/java/com/inia/soportedesk/vpn/`):**
- Modify: `VpnController.java` — add `@PreAuthorize` to `/antivirus`, add `GET /dashboard/completo`.
- Modify: `VpnService.java` — add `public VpnDashboardCompleto obtenerDashboardCompleto()` + private helpers.
- Create: `VpnTipoEquipoCount.java`, `VpnVencimientoAlerta.java`, `VpnDashboardCompleto.java` (records, flat in the `vpn` package — this package has no `dto` subpackage, unlike `activedirectory`).
- Modify: `src/test/java/.../vpn/VpnControllerIT.java` — fix `patchAntivirus_withSoporteRole_returnsOk` (now must fail), add `patchAntivirus_withoutAuthority_returnsForbidden`, `patchAntivirus_withSolicitarAuthority_returnsOk`, `dashboardCompleto_withAprobarAuthority_returnsOk`, `dashboardCompleto_withoutAprobarAuthority_returnsForbidden`.
- Modify: `src/test/java/.../vpn/VpnServiceTest.java` — add `obtenerDashboardCompleto_...` tests for aggregation logic.

**Frontend (`soportedesk-frontend/src/app/features/vpn/`):**
- Modify: `vpn.model.ts` — add `VpnDashboardCompleto`, `VpnTipoEquipoCount`, `VpnVencimientoAlerta`.
- Modify: `vpn.service.ts` — add `getDashboardCompleto()`.
- Create: `vpn-detail.component.ts` (shared read/write detail view, extracted from `vpn-list.component.html:64-228`).
- Create: `vpn-shell.component.ts`.
- Create: `vpn-registros.component.ts`.
- Create: `vpn-administracion.component.ts`.
- Create: `vpn-dashboard.component.ts`.
- Create: `vpn.shared.scss` (module-specific layout not covered by global classes — mirrors `usuarios-red.shared.scss`).
- Delete: `vpn-list.component.ts`, `vpn-list.component.html`, `vpn-list.component.scss`.
- Modify: `src/app/app.routes.ts` — replace the single `vpn` route (lines 52-57) with a shell + children block.
- Create: `src/app/core/auth/vpn-admin.guard.ts` + `vpn-admin.guard.spec.ts`.

---

### Task 1: Backend security fix — `PATCH /api/vpn/{id}/antivirus`

**Files:**
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/vpn/VpnController.java:75-78`
- Modify: `soportedesk-backend/src/test/java/com/inia/soportedesk/vpn/VpnControllerIT.java:256-272`

**Interfaces:**
- Produces: no new authority string — reuses existing `WRITE_solicitar-vpn` (already used by `create`/`update` in the same controller).

- [ ] **Step 1: Update the existing test to expect 403, add a positive-authority test**

Replace `patchAntivirus_withSoporteRole_returnsOk` (currently asserts `isOk()` with only `roles = "SOPORTE"`, which will break once the endpoint is secured) with two tests:

```java
    @Test
    @WithMockUser(roles = "SOPORTE")
    void patchAntivirus_withoutSolicitarAuthority_returnsForbidden() throws Exception {
        VpnAntivirusRequest req = new VpnAntivirusRequest();
        req.setTieneAntivirus(true);
        req.setVencimientoAntivirus(LocalDate.of(2026, 12, 31));

        mockMvc.perform(patch("/api/vpn/1/antivirus")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "WRITE_solicitar-vpn"})
    void patchAntivirus_withSolicitarAuthority_returnsOk() throws Exception {
        VpnAntivirusRequest req = new VpnAntivirusRequest();
        req.setTieneAntivirus(true);
        req.setVencimientoAntivirus(LocalDate.of(2026, 12, 31));

        Vpn vpn = sampleVpn();
        vpn.setTieneAntivirus(true);
        when(service.updateAntivirus(any(), any())).thenReturn(vpn);

        mockMvc.perform(patch("/api/vpn/1/antivirus")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tieneAntivirus", is(true)));
    }
```

- [ ] **Step 2: Run the tests to verify the new one fails (endpoint still unsecured)**

Run: `mvn -o test -Dtest=VpnControllerIT#patchAntivirus_withoutSolicitarAuthority_returnsForbidden` from `soportedesk-backend/`
Expected: FAIL (currently returns 200, test expects 403)

- [ ] **Step 3: Add `@PreAuthorize` to the controller method**

In `VpnController.java`, change:

```java
    @PatchMapping("/{id}/antivirus")
    public Vpn updateAntivirus(@PathVariable Long id, @RequestBody VpnAntivirusRequest request) {
        return service.updateAntivirus(id, request);
    }
```

to:

```java
    @PatchMapping("/{id}/antivirus")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_solicitar-vpn')")
    public Vpn updateAntivirus(@PathVariable Long id, @RequestBody VpnAntivirusRequest request) {
        return service.updateAntivirus(id, request);
    }
```

- [ ] **Step 4: Run the full VpnControllerIT class to verify all tests pass**

Run: `mvn -o test -Dtest=VpnControllerIT` from `soportedesk-backend/`
Expected: PASS (all tests, including the two new ones)

- [ ] **Step 5: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/vpn/VpnController.java soportedesk-backend/src/test/java/com/inia/soportedesk/vpn/VpnControllerIT.java
git commit -m "fix(vpn): require solicitar-vpn authority on PATCH /antivirus"
```

---

### Task 2: Backend — Dashboard DTOs

**Files:**
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/vpn/VpnTipoEquipoCount.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/vpn/VpnVencimientoAlerta.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/vpn/VpnDashboardCompleto.java`

**Interfaces:**
- Produces: three records consumed by `VpnService.obtenerDashboardCompleto()` (Task 3) and serialized directly by `VpnController` (Task 4).

- [ ] **Step 1: Create the three DTO records**

```java
package com.inia.soportedesk.vpn;

public record VpnTipoEquipoCount(String tipoEquipo, long total) {
}
```

```java
package com.inia.soportedesk.vpn;

import java.time.LocalDate;

public record VpnVencimientoAlerta(Long vpnId, String titular, String tipoEquipo, LocalDate vence, String detalle) {
}
```

```java
package com.inia.soportedesk.vpn;

import java.util.List;

public record VpnDashboardCompleto(
        long pendientes,
        long aprobadas,
        long rechazadas,
        long observadas,
        long total,
        List<VpnTipoEquipoCount> distribucionPorTipoEquipo,
        List<VpnVencimientoAlerta> antivirusVencidos,
        long totalAntivirusVencidos,
        List<VpnVencimientoAlerta> antivirusPorVencer,
        long totalAntivirusPorVencer
) {
}
```

- [ ] **Step 2: Compile to verify the records are valid**

Run: `mvn -o compile` from `soportedesk-backend/`
Expected: BUILD SUCCESS

- [ ] **Step 3: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/vpn/VpnTipoEquipoCount.java soportedesk-backend/src/main/java/com/inia/soportedesk/vpn/VpnVencimientoAlerta.java soportedesk-backend/src/main/java/com/inia/soportedesk/vpn/VpnDashboardCompleto.java
git commit -m "feat(vpn): add dashboard aggregation DTOs"
```

---

### Task 3: Backend — `VpnService.obtenerDashboardCompleto()`

**Files:**
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/vpn/VpnService.java`
- Modify (test): `soportedesk-backend/src/test/java/com/inia/soportedesk/vpn/VpnServiceTest.java`

**Interfaces:**
- Consumes: `VpnRepository.findAll()` (existing), `Vpn` fields `tipoEquipo`/`vence`/`titularNombreCompleto`... via `getTitularNombreCompleto()` (existing `@Transient` method), `estadoSolicitud`.
- Produces: `public VpnDashboardCompleto obtenerDashboardCompleto()` — no params, used by `VpnController` (Task 4).

- [ ] **Step 1: Write the failing unit test for the aggregation logic**

Add to `VpnServiceTest.java` (uses the existing `@Mock VpnRepository repository` and `@InjectMocks VpnService service` already in the file):

```java
    @Test
    void obtenerDashboardCompleto_aggregatesCountsAndBuckets() {
        Vpn iniaAprobado = new Vpn();
        iniaAprobado.setId(1L);
        iniaAprobado.setEstadoSolicitud("APROBADO");
        iniaAprobado.setTipoEquipo("INIA");
        iniaAprobado.setTitularTipo("AD");

        Vpn personalVencido = new Vpn();
        personalVencido.setId(2L);
        personalVencido.setEstadoSolicitud("APROBADO");
        personalVencido.setTipoEquipo("PERSONAL");
        personalVencido.setTitularTipo("EXTERNO");
        personalVencido.setTitularNombre("Ana");
        personalVencido.setTitularApellidos("Lopez");
        personalVencido.setVencimientoAntivirus(LocalDate.now().minusDays(5));

        Vpn personalPorVencer = new Vpn();
        personalPorVencer.setId(3L);
        personalPorVencer.setEstadoSolicitud("PENDIENTE");
        personalPorVencer.setTipoEquipo("PERSONAL");
        personalPorVencer.setTitularTipo("EXTERNO");
        personalPorVencer.setTitularNombre("Luis");
        personalPorVencer.setTitularApellidos("Ruiz");
        personalPorVencer.setVencimientoAntivirus(LocalDate.now().plusDays(10));

        Vpn personalVigente = new Vpn();
        personalVigente.setId(4L);
        personalVigente.setEstadoSolicitud("RECHAZADO");
        personalVigente.setTipoEquipo("PERSONAL");
        personalVigente.setTitularTipo("EXTERNO");
        personalVigente.setVencimientoAntivirus(LocalDate.now().plusDays(90));

        when(repository.findAll()).thenReturn(List.of(iniaAprobado, personalVencido, personalPorVencer, personalVigente));

        VpnDashboardCompleto result = service.obtenerDashboardCompleto();

        assertThat(result.pendientes()).isEqualTo(1);
        assertThat(result.aprobadas()).isEqualTo(2);
        assertThat(result.rechazadas()).isEqualTo(1);
        assertThat(result.observadas()).isEqualTo(0);
        assertThat(result.total()).isEqualTo(4);

        assertThat(result.distribucionPorTipoEquipo())
                .extracting(VpnTipoEquipoCount::tipoEquipo, VpnTipoEquipoCount::total)
                .containsExactlyInAnyOrder(
                        org.assertj.core.groups.Tuple.tuple("INIA", 1L),
                        org.assertj.core.groups.Tuple.tuple("PERSONAL", 3L)
                );

        assertThat(result.totalAntivirusVencidos()).isEqualTo(1);
        assertThat(result.antivirusVencidos()).extracting(VpnVencimientoAlerta::vpnId).containsExactly(2L);

        assertThat(result.totalAntivirusPorVencer()).isEqualTo(1);
        assertThat(result.antivirusPorVencer()).extracting(VpnVencimientoAlerta::vpnId).containsExactly(3L);
    }

    @Test
    void obtenerDashboardCompleto_onException_returnsEmptyDashboard() {
        when(repository.findAll()).thenThrow(new RuntimeException("db down"));

        VpnDashboardCompleto result = service.obtenerDashboardCompleto();

        assertThat(result.total()).isEqualTo(0);
        assertThat(result.distribucionPorTipoEquipo()).isEmpty();
        assertThat(result.antivirusVencidos()).isEmpty();
    }
```

- [ ] **Step 2: Run the tests to verify they fail (method doesn't exist yet)**

Run: `mvn -o test -Dtest=VpnServiceTest` from `soportedesk-backend/`
Expected: FAIL with compile error (`obtenerDashboardCompleto` / `VpnDashboardCompleto` symbol not found — expected until Step 3)

- [ ] **Step 3: Implement `obtenerDashboardCompleto()` in `VpnService.java`**

Add near `getKpis()` (after it, before `crearSolicitud`):

```java
    private static final int VENCIMIENTO_ALERTA_DIAS = 30;

    public VpnDashboardCompleto obtenerDashboardCompleto() {
        try {
            List<Vpn> all = repository.findAll();
            all.forEach(this::aplicarVence);

            long pendientes = all.stream().filter(v -> "PENDIENTE".equals(v.getEstadoSolicitud())).count();
            long aprobadas = all.stream().filter(v -> "APROBADO".equals(v.getEstadoSolicitud())).count();
            long rechazadas = all.stream().filter(v -> "RECHAZADO".equals(v.getEstadoSolicitud())).count();
            long observadas = all.stream().filter(v -> "OBSERVADO".equals(v.getEstadoSolicitud())).count();

            List<VpnTipoEquipoCount> distribucion = all.stream()
                    .collect(java.util.stream.Collectors.groupingBy(
                            v -> v.getTipoEquipo() == null ? "SIN_TIPO" : v.getTipoEquipo(),
                            java.util.LinkedHashMap::new,
                            java.util.stream.Collectors.counting()))
                    .entrySet().stream()
                    .map(e -> new VpnTipoEquipoCount(e.getKey(), e.getValue()))
                    .sorted(java.util.Comparator.comparing(VpnTipoEquipoCount::tipoEquipo))
                    .toList();

            LocalDate hoy = LocalDate.now();
            List<Vpn> vencidos = all.stream()
                    .filter(v -> v.getVence() != null && v.getVence().isBefore(hoy))
                    .sorted(java.util.Comparator.comparing(Vpn::getVence))
                    .toList();
            List<Vpn> porVencer = all.stream()
                    .filter(v -> v.getVence() != null && !v.getVence().isBefore(hoy)
                            && !v.getVence().isAfter(hoy.plusDays(VENCIMIENTO_ALERTA_DIAS)))
                    .sorted(java.util.Comparator.comparing(Vpn::getVence))
                    .toList();

            return new VpnDashboardCompleto(
                    pendientes, aprobadas, rechazadas, observadas, all.size(),
                    distribucion,
                    vencidos.stream().limit(10).map(this::toAlerta).toList(),
                    vencidos.size(),
                    porVencer.stream().limit(10).map(this::toAlerta).toList(),
                    porVencer.size()
            );
        } catch (Exception e) {
            return new VpnDashboardCompleto(0, 0, 0, 0, 0, List.of(), List.of(), 0, List.of(), 0);
        }
    }

    private VpnVencimientoAlerta toAlerta(Vpn vpn) {
        String detalle = vpn.getVence().isBefore(LocalDate.now())
                ? "Vencido el " + vpn.getVence()
                : "Vence el " + vpn.getVence();
        return new VpnVencimientoAlerta(vpn.getId(), vpn.getTitularNombreCompleto(), vpn.getTipoEquipo(), vpn.getVence(), detalle);
    }
```

Note: `aplicarVence` and `toAlerta` are private instance methods already in scope in the same class; no new imports beyond what's used inline (`java.util.stream.Collectors`, `java.util.LinkedHashMap`, `java.util.Comparator` are referenced fully-qualified above to avoid touching the existing import block — acceptable given the file's current style already mixes qualified and imported usages elsewhere).

- [ ] **Step 4: Run the tests to verify they pass**

Run: `mvn -o test -Dtest=VpnServiceTest` from `soportedesk-backend/`
Expected: PASS (all tests including the two new ones)

- [ ] **Step 5: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/vpn/VpnService.java soportedesk-backend/src/test/java/com/inia/soportedesk/vpn/VpnServiceTest.java
git commit -m "feat(vpn): add obtenerDashboardCompleto aggregation logic"
```

---

### Task 4: Backend — `GET /api/vpn/dashboard/completo` endpoint

**Files:**
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/vpn/VpnController.java`
- Modify: `soportedesk-backend/src/test/java/com/inia/soportedesk/vpn/VpnControllerIT.java`

**Interfaces:**
- Consumes: `VpnService.obtenerDashboardCompleto()` (Task 3).
- Produces: `GET /api/vpn/dashboard/completo` → `VpnDashboardCompleto` JSON, gated on `WRITE_aprobar-vpn`.

- [ ] **Step 1: Write the failing integration tests**

Add to `VpnControllerIT.java`:

```java
    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "WRITE_aprobar-vpn"})
    void dashboardCompleto_withAprobarAuthority_returnsOk() throws Exception {
        when(service.obtenerDashboardCompleto()).thenReturn(
                new VpnDashboardCompleto(1, 2, 0, 0, 3, List.of(), List.of(), 0, List.of(), 0));

        mockMvc.perform(get("/api/vpn/dashboard/completo"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total", is(3)));
    }

    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "READ_vpn"})
    void dashboardCompleto_withOnlyReadAuthority_returnsForbidden() throws Exception {
        mockMvc.perform(get("/api/vpn/dashboard/completo"))
                .andExpect(status().isForbidden());
    }
```

- [ ] **Step 2: Run to verify failure**

Run: `mvn -o test -Dtest=VpnControllerIT#dashboardCompleto_withAprobarAuthority_returnsOk` from `soportedesk-backend/`
Expected: FAIL (404, route doesn't exist yet)

- [ ] **Step 3: Add the controller endpoint**

In `VpnController.java`, add after `getKpis()`:

```java
    @GetMapping("/dashboard/completo")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_aprobar-vpn')")
    public VpnDashboardCompleto getDashboardCompleto() {
        return service.obtenerDashboardCompleto();
    }
```

- [ ] **Step 4: Run the full VpnControllerIT class**

Run: `mvn -o test -Dtest=VpnControllerIT` from `soportedesk-backend/`
Expected: PASS (all tests)

- [ ] **Step 5: Run the full backend test suite to check for regressions**

Run: `mvn -o test` from `soportedesk-backend/`
Expected: BUILD SUCCESS, 0 failures

- [ ] **Step 6: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/vpn/VpnController.java soportedesk-backend/src/test/java/com/inia/soportedesk/vpn/VpnControllerIT.java
git commit -m "feat(vpn): add GET /api/vpn/dashboard/completo endpoint"
```

---

### Task 5: Frontend — model, service, and guard

**Files:**
- Modify: `soportedesk-frontend/src/app/features/vpn/vpn.model.ts`
- Modify: `soportedesk-frontend/src/app/features/vpn/vpn.service.ts`
- Create: `soportedesk-frontend/src/app/core/auth/vpn-admin.guard.ts`
- Create: `soportedesk-frontend/src/app/core/auth/vpn-admin.guard.spec.ts`

**Interfaces:**
- Produces: `VpnDashboardCompleto`/`VpnTipoEquipoCount`/`VpnVencimientoAlerta` interfaces, `VpnService.getDashboardCompleto(): Observable<VpnDashboardCompleto>`, `vpnAdminGuard: CanActivateFn` — all consumed by Tasks 6-10.

- [ ] **Step 1: Add model interfaces**

Append to `vpn.model.ts`:

```typescript
export interface VpnTipoEquipoCount {
  tipoEquipo: string;
  total: number;
}

export interface VpnVencimientoAlerta {
  vpnId: number;
  titular: string;
  tipoEquipo: string | null;
  vence: string;
  detalle: string;
}

export interface VpnDashboardCompleto {
  pendientes: number;
  aprobadas: number;
  rechazadas: number;
  observadas: number;
  total: number;
  distribucionPorTipoEquipo: VpnTipoEquipoCount[];
  antivirusVencidos: VpnVencimientoAlerta[];
  totalAntivirusVencidos: number;
  antivirusPorVencer: VpnVencimientoAlerta[];
  totalAntivirusPorVencer: number;
}
```

- [ ] **Step 2: Add service method**

In `vpn.service.ts`, add `VpnDashboardCompleto` to the import from `./vpn.model` and add:

```typescript
  getDashboardCompleto(): Observable<VpnDashboardCompleto> {
    return this.http.get<VpnDashboardCompleto>(`${this.apiUrl}/dashboard/completo`);
  }
```

- [ ] **Step 3: Write the failing guard spec**

Create `vpn-admin.guard.spec.ts` (mirrors `modulo.guard.spec.ts` exactly):

```typescript
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { vpnAdminGuard } from './vpn-admin.guard';

describe('vpnAdminGuard', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['isAdmin', 'canWrite']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    });
  });

  it('allows access for admins', () => {
    authService.isAdmin.and.returnValue(true);
    authService.canWrite.and.returnValue(false);

    const result = TestBed.runInInjectionContext(() => vpnAdminGuard()({} as any, {} as any));

    expect(result).toBe(true);
  });

  it('allows access with solicitar-vpn write permission', () => {
    authService.isAdmin.and.returnValue(false);
    authService.canWrite.and.callFake((modulo: string) => modulo === 'solicitar-vpn');

    const result = TestBed.runInInjectionContext(() => vpnAdminGuard()({} as any, {} as any));

    expect(result).toBe(true);
  });

  it('allows access with aprobar-vpn write permission', () => {
    authService.isAdmin.and.returnValue(false);
    authService.canWrite.and.callFake((modulo: string) => modulo === 'aprobar-vpn');

    const result = TestBed.runInInjectionContext(() => vpnAdminGuard()({} as any, {} as any));

    expect(result).toBe(true);
  });

  it('redirects to dashboard without either permission', () => {
    authService.isAdmin.and.returnValue(false);
    authService.canWrite.and.returnValue(false);

    const result = TestBed.runInInjectionContext(() => vpnAdminGuard()({} as any, {} as any));

    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });
});
```

- [ ] **Step 4: Run to verify it fails (guard doesn't exist yet)**

Run: `npx ng test --watch=false --include='**/vpn-admin.guard.spec.ts'` from `soportedesk-frontend/`
Expected: FAIL (module not found)

- [ ] **Step 5: Implement the guard**

Create `vpn-admin.guard.ts`:

```typescript
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const vpnAdminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAdmin() || authService.canWrite('solicitar-vpn') || authService.canWrite('aprobar-vpn')) {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};
```

- [ ] **Step 6: Run to verify it passes**

Run: `npx ng test --watch=false --include='**/vpn-admin.guard.spec.ts'` from `soportedesk-frontend/`
Expected: PASS (4/4)

- [ ] **Step 7: Commit**

```bash
git add soportedesk-frontend/src/app/features/vpn/vpn.model.ts soportedesk-frontend/src/app/features/vpn/vpn.service.ts soportedesk-frontend/src/app/core/auth/vpn-admin.guard.ts soportedesk-frontend/src/app/core/auth/vpn-admin.guard.spec.ts
git commit -m "feat(vpn): add dashboard model/service methods and vpnAdminGuard"
```

---

### Task 6: Frontend — shared `VpnDetailComponent`

**Files:**
- Create: `soportedesk-frontend/src/app/features/vpn/vpn-detail.component.ts`
- Create: `soportedesk-frontend/src/app/features/vpn/vpn.shared.scss`

**Interfaces:**
- Consumes: `Vpn` type, `AppStatusBadge`/`AppModal` are NOT used here (this is the modal's *content*, not the modal itself — the modal wrapper stays in each parent per Task 7/8).
- Produces: `<app-vpn-detail>` with `@Input({required:true}) vpn: Vpn`, `@Input() canWriteSolicitar = false`, `@Input() showDecisionPanel = false`, `@Input() canEditCredenciales = false`, `@Output() editRequested = new EventEmitter<Vpn>()`, `@Output() deleteRequested = new EventEmitter<Vpn>()`, `@Output() aprobarRequested = new EventEmitter<Vpn>()`, `@Output() resolucionRequested = new EventEmitter<{vpn: Vpn; modo: 'RECHAZAR' | 'OBSERVAR'}>()`. Consumed by `VpnRegistrosComponent` (Task 8, `showDecisionPanel=false`) and `VpnAdministracionComponent` (Task 9, `showDecisionPanel` bound to `canWriteAprobar`).

This extracts the entire content currently inside `<app-modal title="Detalle VPN" ...>` in `vpn-list.component.html:65-228`, unchanged in substance, restyled to global tokens instead of the custom hex classes in `vpn-list.component.scss`.

- [ ] **Step 1: Create the component**

```typescript
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { VencimientoBadgeComponent } from '../../shared/vencimiento-badge/vencimiento-badge.component';
import { SectionCardComponent } from '../../shared/section-card/section-card.component';
import { Vpn } from './vpn.model';

@Component({
  selector: 'app-vpn-detail',
  standalone: true,
  imports: [CommonModule, StatusBadgeComponent, VencimientoBadgeComponent, SectionCardComponent],
  template: `
    <section class="identity-band">
      <div class="identity-main">
        <span>{{ vpn.titularOrigenLabel }} / {{ vpn.tipoEquipo === 'INIA' ? 'Equipo INIA' : 'Equipo personal' }}</span>
        <h3>{{ vpn.titularNombreCompleto }}</h3>
        <span>{{ vpn.titularCargo }}<ng-container *ngIf="vpn.titularCorreo"> / {{ vpn.titularCorreo }}</ng-container></span>
      </div>
      <div class="identity-side">
        <app-status-badge [label]="vpn.estadoSolicitud" [tone]="estadoTone(vpn.estadoSolicitud)" />
        <app-vencimiento-badge [fecha]="vpn.vence" />
      </div>
    </section>

    <section class="card decision-panel" *ngIf="showDecisionPanel && vpn.estadoSolicitud === 'PENDIENTE'">
      <div>
        <strong>Decision del responsable</strong>
        <span class="muted">Revisa la solicitud y registra el resultado</span>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-primary" (click)="aprobarRequested.emit(vpn)">Aprobar</button>
        <button type="button" class="btn btn-ghost" (click)="resolucionRequested.emit({ vpn, modo: 'OBSERVAR' })">Observar</button>
        <button type="button" class="btn btn-danger" (click)="resolucionRequested.emit({ vpn, modo: 'RECHAZAR' })">Rechazar</button>
      </div>
    </section>

    <section class="module-stats">
      <div class="stat-pill"><strong>{{ vpn.vence || 'Sin fecha' }}</strong><span>Vence VPN</span></div>
      <div class="stat-pill"><strong>{{ vpn.estado || 'Sin estado' }}</strong><span>Estado acceso</span></div>
      <div class="stat-pill"><strong>{{ vpn.solicitadoPorNombre || vpn.solicitadoPor }}</strong><span>Solicitado por</span></div>
    </section>

    <div class="detail-sections">
      <app-section-card title="Solicitud">
        <svg icon xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" />
        </svg>
        <div class="detail-grid">
          <div class="detail-field" *ngIf="vpn.titularTipo === 'EXTERNO'"><span class="detail-label">Empresa</span><span class="detail-value">{{ vpn.titularEmpresa || 'No registrado' }}</span></div>
          <div class="detail-field" *ngIf="vpn.titularTipo === 'EXTERNO'"><span class="detail-label">Motivo</span><span class="detail-value">{{ vpn.titularMotivo || 'No registrado' }}</span></div>
          <div class="detail-field" *ngIf="vpn.glpiNombreEquipo"><span class="detail-label">Equipo GLPI</span><span class="detail-value">{{ vpn.glpiNombreEquipo }}<small *ngIf="vpn.glpiIpEquipo"> ({{ vpn.glpiIpEquipo }})</small></span></div>
          <div class="detail-field"><span class="detail-label">Tipo de equipo</span><span class="detail-value">{{ vpn.tipoEquipo === 'INIA' ? 'Equipo de INIA' : 'Equipo personal' }}</span></div>
        </div>
      </app-section-card>

      <app-section-card title="Validacion tecnica">
        <svg icon xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
        <div class="detail-grid">
          <div class="detail-field"><span class="detail-label">Antivirus verificado</span><span class="detail-value">{{ boolLabel(vpn.antivirusVerificado) }}</span></div>
          <div class="detail-field"><span class="detail-label">Analisis antivirus</span><span class="detail-value">{{ boolLabel(vpn.analisisAntivirusRealizado) }}</span></div>
          <div class="detail-field"><span class="detail-label">Sistema operativo</span><span class="detail-value">{{ boolLabel(vpn.sistemaOperativoActualizado) }}</span></div>
          <div class="detail-field"><span class="detail-label">Forticlient</span><span class="detail-value">{{ boolLabel(vpn.forticlientInstalado) }}</span></div>
          <div class="detail-field" *ngIf="vpn.glpiComputerId"><span class="detail-label">Host actualizado</span><span class="detail-value">{{ boolLabel(vpn.hostActualizado) }}</span></div>
        </div>
      </app-section-card>

      <app-section-card title="Antivirus y vencimiento">
        <svg icon xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
        </svg>
        <div class="detail-grid">
          <div class="detail-field"><span class="detail-label">{{ vpn.tipoEquipo === 'INIA' ? 'Antivirus institucional' : 'Antivirus personal' }}</span><span class="detail-value">{{ antivirusOrigenValor(vpn) }}</span></div>
          <div class="detail-field"><span class="detail-label">Fecha base</span><span class="detail-value">{{ fechaBaseAntivirus(vpn) }}</span></div>
        </div>
      </app-section-card>

      <app-section-card title="Resolucion" *ngIf="vpn.aprobadoPorNombre || vpn.comentarioResponsable">
        <svg icon xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <div class="detail-grid">
          <div class="detail-field" *ngIf="vpn.aprobadoPorNombre"><span class="detail-label">Responsable</span><span class="detail-value">{{ vpn.aprobadoPorNombre }}<small>{{ vpn.fechaResolucion }}</small></span></div>
          <div class="detail-field" *ngIf="vpn.comentarioResponsable"><span class="detail-label">Comentario</span><span class="detail-value">{{ vpn.comentarioResponsable }}</span></div>
        </div>
      </app-section-card>

      <app-section-card title="Credenciales VPN" *ngIf="canEditCredenciales">
        <svg icon xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <div class="detail-grid">
          <div class="detail-field"><span class="detail-label">Usuario VPN</span><span class="detail-value">{{ vpn.usuarioVpn || 'No asignado' }}</span></div>
          <div class="detail-field"><span class="detail-label">Credencial VPN</span><span class="detail-value">{{ vpn.credencialVpn || 'No asignada' }}</span></div>
        </div>
      </app-section-card>
    </div>

    <footer class="modal-actions" *ngIf="canWriteSolicitar">
      <button type="button" class="btn btn-ghost" *ngIf="vpn.estadoSolicitud !== 'APROBADO'" (click)="editRequested.emit(vpn)">Editar</button>
      <button type="button" class="btn btn-danger" (click)="deleteRequested.emit(vpn)">Eliminar</button>
    </footer>
  `,
  styleUrl: './vpn.shared.scss',
})
export class VpnDetailComponent {
  @Input({ required: true }) vpn!: Vpn;
  @Input() canWriteSolicitar = false;
  @Input() showDecisionPanel = false;
  @Input() canEditCredenciales = false;

  @Output() editRequested = new EventEmitter<Vpn>();
  @Output() deleteRequested = new EventEmitter<Vpn>();
  @Output() aprobarRequested = new EventEmitter<Vpn>();
  @Output() resolucionRequested = new EventEmitter<{ vpn: Vpn; modo: 'RECHAZAR' | 'OBSERVAR' }>();

  estadoTone(estado: string): 'success' | 'warning' | 'danger' | 'neutral' {
    if (estado === 'APROBADO') return 'success';
    if (estado === 'RECHAZADO') return 'danger';
    if (estado === 'OBSERVADO') return 'warning';
    return 'neutral';
  }

  boolLabel(value: boolean | null | undefined): string {
    if (value === null || value === undefined) return 'No registrado';
    return value ? 'Si' : 'No';
  }

  antivirusOrigenValor(vpn: Vpn): string {
    if (vpn.tipoEquipo === 'INIA') return 'Configuracion institucional';
    return vpn.vencimientoAntivirus ? 'Registrado en la solicitud' : 'Sin fecha registrada';
  }

  fechaBaseAntivirus(vpn: Vpn): string {
    if (vpn.tipoEquipo === 'INIA') return vpn.vence || 'Sin fecha institucional';
    return vpn.vencimientoAntivirus || 'Sin fecha registrada';
  }
}
```

- [ ] **Step 2: Create `vpn.shared.scss`**

```scss
.vpn-page {
  --color-accent: var(--color-vpn);
  --color-accent-hover: #b91c1c;
}

.identity-band {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 16px 18px;
  border-radius: var(--radius-lg);
  background: var(--color-primary);
  color: #fff;
}

.identity-main {
  display: grid;
  gap: 3px;
  min-width: 0;

  h3 { margin: 0; color: #fff; font-size: 19px; }
  span { color: #cbd5e1; font-size: 12.5px; overflow-wrap: anywhere; }
}

.identity-side {
  display: flex;
  align-items: center;
  gap: 8px;
}

.decision-panel {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 14px 16px;

  strong { display: block; color: var(--color-text); font-size: 13.5px; }
}

.detail-sections {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 10px 14px;
}

.detail-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.detail-label {
  color: var(--color-text-secondary);
  font-size: 11px;
  font-weight: 700;
}

.detail-value {
  overflow-wrap: anywhere;
  color: var(--color-text);
  font-size: 14px;
  font-weight: 600;

  small { display: block; color: var(--color-text-muted); font-weight: 500; }
}

.muted {
  color: var(--color-text-secondary);
  font-size: 12.5px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

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
  cursor: pointer;

  &:hover { background: var(--color-muted); }
  &:last-of-type { border-bottom: none; }
}

@media (max-width: 900px) {
  .detail-sections, .dashboard-grid { grid-template-columns: 1fr; }
  .identity-band { flex-direction: column; align-items: flex-start; }
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npx ng build --configuration=development` from `soportedesk-frontend/`
Expected: BUILD SUCCESS (this component isn't wired to a route yet, but Angular's AOT compiler still type-checks it since it's a standalone component reachable via TS project references — if it's not picked up, defer this check to Task 8/9 where it's actually imported)

- [ ] **Step 4: Commit**

```bash
git add soportedesk-frontend/src/app/features/vpn/vpn-detail.component.ts soportedesk-frontend/src/app/features/vpn/vpn.shared.scss
git commit -m "feat(vpn): add shared VpnDetailComponent"
```

---

### Task 7: Frontend — `VpnShellComponent`

**Files:**
- Create: `soportedesk-frontend/src/app/features/vpn/vpn-shell.component.ts`

**Interfaces:**
- Consumes: `AuthService.canWrite('solicitar-vpn')`, `AuthService.canWrite('aprobar-vpn')`.
- Produces: `<app-vpn-shell>` routed via `app.routes.ts` (Task 10) as the parent of `registros`/`administracion`/`dashboard`.

- [ ] **Step 1: Create the component**

```typescript
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-vpn-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="module-page vpn-page">
      <div class="module-header">
        <div>
          <span class="module-eyebrow">Acceso remoto</span>
          <h2>VPN</h2>
          <p>Solicitudes, verificaciones de seguridad y credenciales de acceso remoto.</p>
        </div>
      </div>

      <nav class="ad-tabs" aria-label="VPN">
        <a routerLink="registros" routerLinkActive="active">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" />
          </svg>
          Registros
        </a>
        <a *ngIf="canAdmin" routerLink="administracion" routerLinkActive="active">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          Administracion
        </a>
        <a *ngIf="canDashboard" routerLink="dashboard" routerLinkActive="active">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          Dashboard
        </a>
      </nav>

      <router-outlet />
    </div>
  `,
  styleUrl: './vpn.shared.scss',
})
export class VpnShellComponent {
  private authService = inject(AuthService);

  get canAdmin(): boolean {
    return this.authService.isAdmin() || this.authService.canWrite('solicitar-vpn') || this.authService.canWrite('aprobar-vpn');
  }

  get canDashboard(): boolean {
    return this.authService.isAdmin() || this.authService.canWrite('aprobar-vpn');
  }
}
```

Note: `.ad-tabs` class is the tab-bar CSS already defined in `usuarios-red.shared.scss` (`.ad-tabs`/`.ad-tabs a`/`.ad-tabs a.active`) — reusing the class name here means it must be duplicated into `vpn.shared.scss` too (styles are component-scoped per `styleUrl`, not shared across feature folders). Add the same `.ad-tabs` block from `soportedesk-frontend/src/app/features/usuarios-red/usuarios-red.shared.scss` (top of file) into `vpn.shared.scss` verbatim before this task's build step.

- [ ] **Step 2: Add the `.ad-tabs` block to `vpn.shared.scss`**

Prepend to `vpn.shared.scss` (before `.vpn-page`):

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

- [ ] **Step 3: Commit**

```bash
git add soportedesk-frontend/src/app/features/vpn/vpn-shell.component.ts soportedesk-frontend/src/app/features/vpn/vpn.shared.scss
git commit -m "feat(vpn): add VpnShellComponent with tab navigation"
```

---

### Task 8: Frontend — `VpnRegistrosComponent`

**Files:**
- Create: `soportedesk-frontend/src/app/features/vpn/vpn-registros.component.ts`

**Interfaces:**
- Consumes: `VpnService.getAll`/`getById`/`delete`, `VpnDetailComponent` (Task 6), `VpnFormComponent` (existing, unchanged), `GenericTableComponent` (existing shared).
- Produces: routed component for `/vpn/registros`.

Ports `vpn-list.component.ts`'s read path (`items`, `load`, `onSearch`, table columns) plus create/edit/delete (gated `canWriteSolicitar`), dropping the KPI cards and decision panel entirely (those live in Administración, Task 9).

- [ ] **Step 1: Create the component**

```typescript
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { GenericTableComponent, TableColumn } from '../../shared/generic-table/generic-table.component';
import { ModalComponent } from '../../shared/modal/modal.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { VencimientoBadgeComponent } from '../../shared/vencimiento-badge/vencimiento-badge.component';
import { VpnFormComponent } from './vpn-form.component';
import { VpnDetailComponent } from './vpn-detail.component';
import { Vpn } from './vpn.model';
import { VpnService } from './vpn.service';

const EDITABLE_STATES = new Set(['PENDIENTE', 'OBSERVADO']);

@Component({
  selector: 'app-vpn-registros',
  standalone: true,
  imports: [CommonModule, GenericTableComponent, ModalComponent, StatusBadgeComponent, VencimientoBadgeComponent, VpnFormComponent, VpnDetailComponent],
  template: `
    <app-generic-table
      [columns]="columns"
      [data]="items"
      [canAdd]="canWriteSolicitar"
      [canEdit]="false"
      extraColumnLabel="Vence VPN"
      (searchChange)="onSearch($event)"
      (add)="onAdd()"
      (view)="onView($event)"
    >
      <ng-template #extraCell let-row>
        <app-status-badge [label]="row.estadoSolicitud" [tone]="estadoTone(row.estadoSolicitud)" />
        <app-vencimiento-badge [fecha]="row.vence" />
      </ng-template>
    </app-generic-table>

    <app-modal title="Detalle VPN" size="wide" [open]="viewing !== null" (closed)="closeView()">
      <app-vpn-detail
        *ngIf="viewing as v"
        [vpn]="v"
        [canWriteSolicitar]="canWriteSolicitar"
        [canEditCredenciales]="false"
        [showDecisionPanel]="false"
        (editRequested)="editFromDetail($event)"
        (deleteRequested)="deleteFromDetail($event)"
      />
    </app-modal>

    <app-modal
      [title]="editing ? 'Editar solicitud VPN' : 'Nueva solicitud VPN'"
      [open]="formOpen"
      (closed)="closeForm()"
    >
      <app-vpn-form [vpn]="editing" (saved)="onSaved()" (cancelled)="closeForm()" />
    </app-modal>
  `,
  styleUrl: './vpn.shared.scss',
})
export class VpnRegistrosComponent implements OnInit {
  private service = inject(VpnService);
  private authService = inject(AuthService);

  items: Vpn[] = [];
  viewing: Vpn | null = null;
  editing: Vpn | null = null;
  formOpen = false;

  columns: TableColumn[] = [
    { key: 'titularNombreCompleto', label: 'Nombre' },
    { key: 'titularOrigenLabel', label: 'Origen' },
    { key: 'estadoSolicitud', label: 'Estado solicitud' },
    { key: 'estado', label: 'Estado' },
  ];

  get canWriteSolicitar(): boolean {
    return this.authService.isAdmin() || this.authService.canWrite('solicitar-vpn');
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
    if (!EDITABLE_STATES.has(item.estadoSolicitud)) {
      alert('Esta solicitud ya fue resuelta y no se puede editar.');
      return;
    }
    this.editing = item;
    this.formOpen = true;
  }

  editFromDetail(item: Vpn): void {
    this.viewing = null;
    this.onEdit(item);
  }

  closeForm(): void {
    this.formOpen = false;
  }

  onDelete(item: Vpn): void {
    const nombre = item.usuarioRed?.nombre ?? item.id;
    if (!confirm(`¿Eliminar el registro VPN de "${nombre}"?`)) return;
    this.service.delete(item.id).subscribe(() => this.load());
  }

  deleteFromDetail(item: Vpn): void {
    this.viewing = null;
    this.onDelete(item);
  }

  onSaved(): void {
    this.formOpen = false;
    this.load();
  }

  estadoTone(estado: string): 'success' | 'warning' | 'danger' | 'neutral' {
    if (estado === 'APROBADO') return 'success';
    if (estado === 'RECHAZADO') return 'danger';
    if (estado === 'OBSERVADO') return 'warning';
    return 'neutral';
  }
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx ng build --configuration=development` from `soportedesk-frontend/`
Expected: BUILD SUCCESS (still unrouted, but reachable by the TS compiler through direct imports if any exist yet — otherwise this verification effectively happens once Task 10 wires the route; run it anyway to catch template/type errors early via `ng build`'s whole-project AOT pass)

- [ ] **Step 3: Commit**

```bash
git add soportedesk-frontend/src/app/features/vpn/vpn-registros.component.ts
git commit -m "feat(vpn): add VpnRegistrosComponent (read-only browse + nueva solicitud)"
```

---

### Task 9: Frontend — `VpnAdministracionComponent`

**Files:**
- Create: `soportedesk-frontend/src/app/features/vpn/vpn-administracion.component.ts`

**Interfaces:**
- Consumes: `VpnService` (all existing write methods), `VpnDetailComponent` (Task 6), `VpnAntivirusFormComponent`/`VpnAprobarFormComponent`/`VpnResolucionFormComponent` (existing, unchanged).
- Produces: routed component for `/vpn/administracion`.

Ports the KPI cards + full approval workflow from `vpn-list.component.ts`/`.html` (the `'solicitudes'` tab content), restyled with `stat-pill` instead of custom `.kpi-card`.

- [ ] **Step 1: Create the component**

```typescript
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { GenericTableComponent, TableColumn } from '../../shared/generic-table/generic-table.component';
import { ModalComponent } from '../../shared/modal/modal.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { VencimientoBadgeComponent } from '../../shared/vencimiento-badge/vencimiento-badge.component';
import { VpnAntivirusFormComponent } from './vpn-antivirus-form.component';
import { VpnAprobarFormComponent } from './vpn-aprobar-form.component';
import { VpnResolucionFormComponent } from './vpn-resolucion-form.component';
import { VpnDetailComponent } from './vpn-detail.component';
import { Vpn, VpnKpis } from './vpn.model';
import { VpnService } from './vpn.service';

type EstadoSolicitud = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'OBSERVADO';

@Component({
  selector: 'app-vpn-administracion',
  standalone: true,
  imports: [
    CommonModule, GenericTableComponent, ModalComponent, StatusBadgeComponent, VencimientoBadgeComponent,
    VpnAntivirusFormComponent, VpnAprobarFormComponent, VpnResolucionFormComponent, VpnDetailComponent,
  ],
  template: `
    <section class="module-stats">
      <div class="stat-pill" *ngFor="let card of kpiCards" [class.tone-danger]="card.estado === 'PENDIENTE' && card.value > 0">
        <strong>{{ card.value }}</strong>
        <span>{{ card.label }}</span>
      </div>
    </section>

    <app-generic-table
      [columns]="columns"
      [data]="items"
      [canAdd]="false"
      [canEdit]="false"
      extraColumnLabel="Vence VPN"
      (searchChange)="onSearch($event)"
      (view)="onView($event)"
    >
      <ng-template #extraCell let-row>
        <app-status-badge [label]="row.estadoSolicitud" [tone]="estadoTone(row.estadoSolicitud)" />
        <app-vencimiento-badge [fecha]="row.vence" />
      </ng-template>
    </app-generic-table>

    <app-modal title="Detalle VPN" size="wide" [open]="viewing !== null" (closed)="closeView()">
      <app-vpn-detail
        *ngIf="viewing as v"
        [vpn]="v"
        [canWriteSolicitar]="canWriteSolicitar"
        [canEditCredenciales]="canEditCredenciales"
        [showDecisionPanel]="canWriteAprobar"
        (aprobarRequested)="openAprobar($event)"
        (resolucionRequested)="openResolucion($event.vpn, $event.modo)"
      />
    </app-modal>

    <app-modal title="Antivirus" [open]="antivirusOpen" (closed)="closeAntivirus()">
      <app-vpn-antivirus-form [vpn]="antivirusEditing" (saved)="onAntivirusSaved()" (cancelled)="closeAntivirus()" />
    </app-modal>

    <app-modal title="Aprobar solicitud VPN" [open]="aprobarOpen" (closed)="closeAprobar()">
      <app-vpn-aprobar-form [vpn]="aprobarEditing" (saved)="onAprobarSaved()" (cancelled)="closeAprobar()" />
    </app-modal>

    <app-modal [title]="resolucionModo === 'RECHAZAR' ? 'Rechazar solicitud VPN' : 'Observar solicitud VPN'" [open]="resolucionOpen" (closed)="closeResolucion()">
      <app-vpn-resolucion-form [vpn]="resolucionEditing" [modo]="resolucionModo" (saved)="onResolucionSaved()" (cancelled)="closeResolucion()" />
    </app-modal>
  `,
  styleUrl: './vpn.shared.scss',
})
export class VpnAdministracionComponent implements OnInit {
  private service = inject(VpnService);
  private authService = inject(AuthService);

  items: Vpn[] = [];
  kpis: VpnKpis | null = null;
  viewing: Vpn | null = null;

  antivirusEditing: Vpn | null = null;
  antivirusOpen = false;
  aprobarEditing: Vpn | null = null;
  aprobarOpen = false;
  resolucionEditing: Vpn | null = null;
  resolucionModo: 'RECHAZAR' | 'OBSERVAR' = 'RECHAZAR';
  resolucionOpen = false;

  columns: TableColumn[] = [
    { key: 'titularNombreCompleto', label: 'Nombre' },
    { key: 'titularOrigenLabel', label: 'Origen' },
    { key: 'estadoSolicitud', label: 'Estado solicitud' },
    { key: 'estado', label: 'Estado' },
  ];

  get canWriteSolicitar(): boolean {
    return this.authService.isAdmin() || this.authService.canWrite('solicitar-vpn');
  }

  get canWriteAprobar(): boolean {
    return this.authService.isAdmin() || this.authService.canWrite('aprobar-vpn');
  }

  get canEditCredenciales(): boolean {
    if (this.authService.isAdmin() || this.authService.canWrite('credenciales-vpn')) return true;
    return this.viewing?.solicitadoPor === this.authService.getUsername();
  }

  get kpiCards(): { label: string; value: number; estado: EstadoSolicitud }[] {
    const k = this.kpis;
    return [
      { label: 'Pendientes', value: k?.pendientes ?? 0, estado: 'PENDIENTE' },
      { label: 'Aprobadas', value: k?.aprobadas ?? 0, estado: 'APROBADO' },
      { label: 'Rechazadas', value: k?.rechazadas ?? 0, estado: 'RECHAZADO' },
      { label: 'Observadas', value: k?.observadas ?? 0, estado: 'OBSERVADO' },
    ];
  }

  ngOnInit(): void {
    this.load();
    this.loadKpis();
  }

  load(search?: string): void {
    this.service.getAll(search).subscribe((data) => (this.items = data));
  }

  onSearch(term: string): void {
    this.load(term);
  }

  loadKpis(): void {
    this.service.getKpis().subscribe((data) => (this.kpis = data));
  }

  onView(item: Vpn): void {
    this.viewing = item;
  }

  closeView(): void {
    this.viewing = null;
  }

  openAntivirus(item: Vpn): void {
    this.viewing = null;
    this.antivirusEditing = item;
    this.antivirusOpen = true;
  }

  closeAntivirus(): void {
    this.antivirusOpen = false;
  }

  onAntivirusSaved(): void {
    this.antivirusOpen = false;
    this.load();
  }

  openAprobar(item: Vpn): void {
    this.viewing = null;
    this.aprobarEditing = item;
    this.aprobarOpen = true;
  }

  closeAprobar(): void {
    this.aprobarOpen = false;
  }

  onAprobarSaved(): void {
    this.aprobarOpen = false;
    this.load();
    this.loadKpis();
  }

  openResolucion(item: Vpn, modo: 'RECHAZAR' | 'OBSERVAR'): void {
    this.viewing = null;
    this.resolucionEditing = item;
    this.resolucionModo = modo;
    this.resolucionOpen = true;
  }

  closeResolucion(): void {
    this.resolucionOpen = false;
  }

  onResolucionSaved(): void {
    this.resolucionOpen = false;
    this.load();
    this.loadKpis();
  }

  estadoTone(estado: string): 'success' | 'warning' | 'danger' | 'neutral' {
    if (estado === 'APROBADO') return 'success';
    if (estado === 'RECHAZADO') return 'danger';
    if (estado === 'OBSERVADO') return 'warning';
    return 'neutral';
  }
}
```

Add `.stat-pill.tone-danger strong { color: var(--color-danger); }` to `vpn.shared.scss` (same one-liner used in AD's `ad-kpis.component.ts`).

- [ ] **Step 2: Add the tone-danger rule to `vpn.shared.scss`**

Append:

```scss
.stat-pill.tone-danger strong { color: var(--color-danger); }
```

- [ ] **Step 3: Commit**

```bash
git add soportedesk-frontend/src/app/features/vpn/vpn-administracion.component.ts soportedesk-frontend/src/app/features/vpn/vpn.shared.scss
git commit -m "feat(vpn): add VpnAdministracionComponent (approval workflow)"
```

---

### Task 10: Frontend — `VpnDashboardComponent`

**Files:**
- Create: `soportedesk-frontend/src/app/features/vpn/vpn-dashboard.component.ts`

**Interfaces:**
- Consumes: `VpnService.getDashboardCompleto()` (Task 5), `VpnDashboardCompleto` model (Task 5).
- Produces: routed component for `/vpn/dashboard`. Mirrors `usuarios-red-dashboard.component.ts` structure exactly (KPI row + bar chart + 2 alert cards instead of AD's 3).

- [ ] **Step 1: Create the component**

```typescript
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ChartConfiguration, ChartData } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { VpnService } from './vpn.service';
import { VpnDashboardCompleto } from './vpn.model';

@Component({
  selector: 'app-vpn-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  template: `
    <div class="dashboard-toolbar">
      <p>Distribucion de solicitudes por tipo de equipo y antivirus por vencer.</p>
      <button type="button" class="btn btn-ghost" (click)="load()" [disabled]="loading">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </svg>
        {{ loading ? 'Cargando...' : 'Actualizar' }}
      </button>
    </div>

    <div class="notice error" *ngIf="error">No se pudo cargar. Intenta nuevamente.</div>

    <section class="module-stats" *ngIf="dashboard">
      <div class="stat-pill"><strong>{{ dashboard.pendientes }}</strong><span>Pendientes</span></div>
      <div class="stat-pill"><strong>{{ dashboard.aprobadas }}</strong><span>Aprobadas</span></div>
      <div class="stat-pill"><strong>{{ dashboard.rechazadas }}</strong><span>Rechazadas</span></div>
      <div class="stat-pill"><strong>{{ dashboard.observadas }}</strong><span>Observadas</span></div>
      <div class="stat-pill"><strong>{{ dashboard.total }}</strong><span>Total</span></div>
    </section>

    <section class="dashboard-grid" *ngIf="dashboard">
      <article class="card chart-card">
        <header>
          <strong>Distribucion por tipo de equipo</strong>
          <span class="muted">{{ dashboard.distribucionPorTipoEquipo.length }} tipos</span>
        </header>
        <canvas baseChart [data]="chartData" [options]="chartOptions" [type]="'bar'"></canvas>
      </article>

      <div class="alert-list">
        <ng-container *ngTemplateOutlet="alertCard; context: {
          title: 'Antivirus vencidos',
          total: dashboard.totalAntivirusVencidos,
          rows: dashboard.antivirusVencidos
        }" />
        <ng-container *ngTemplateOutlet="alertCard; context: {
          title: 'Antivirus por vencer',
          total: dashboard.totalAntivirusPorVencer,
          rows: dashboard.antivirusPorVencer
        }" />
      </div>
    </section>

    <section class="empty-state" *ngIf="!dashboard && !loading">
      <strong>Sin datos de dashboard</strong>
      <span>El servicio devolvio un resumen vacio o no disponible.</span>
    </section>

    <ng-template #alertCard let-title="title" let-total="total" let-rows="rows">
      <article class="card alert-card">
        <header>
          <strong>{{ title }}</strong>
          <span class="badge badge-warning">{{ total }}</span>
        </header>
        <button class="alert-row" type="button" *ngFor="let row of rows" (click)="goToRegistros(row.vpnId)">
          <strong>{{ row.titular }}</strong>
          <small class="muted">{{ row.detalle }}</small>
        </button>
        <p class="muted" *ngIf="!rows.length">Sin registros criticos.</p>
        <p class="muted" *ngIf="total > rows.length">+{{ total - rows.length }} mas</p>
      </article>
    </ng-template>
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
  styleUrl: './vpn.shared.scss',
})
export class VpnDashboardComponent implements OnInit {
  private service = inject(VpnService);
  private router = inject(Router);

  dashboard: VpnDashboardCompleto | null = null;
  loading = false;
  error = false;

  chartData: ChartData<'bar', number[], string> = {
    labels: [],
    datasets: [{ data: [], label: 'Solicitudes', backgroundColor: '#ef4444' }],
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

  goToRegistros(vpnId: number): void {
    this.router.navigate(['/vpn/registros'], { queryParams: { id: vpnId } });
  }

  private applyChart(dashboard: VpnDashboardCompleto | null): void {
    const rows = dashboard?.distribucionPorTipoEquipo ?? [];
    this.chartData = {
      labels: rows.map((row) => row.tipoEquipo),
      datasets: [{ data: rows.map((row) => row.total), label: 'Solicitudes', backgroundColor: '#ef4444' }],
    };
  }
}
```

`#ef4444` matches `--color-vpn` from `_variables.scss:38` — same established exception as AD's chart (Chart.js JS config can't consume CSS custom properties).

- [ ] **Step 2: Commit**

```bash
git add soportedesk-frontend/src/app/features/vpn/vpn-dashboard.component.ts
git commit -m "feat(vpn): add VpnDashboardComponent"
```

---

### Task 11: Wire routes, retire the old page, full verification

**Files:**
- Modify: `soportedesk-frontend/src/app/app.routes.ts:52-57`
- Delete: `soportedesk-frontend/src/app/features/vpn/vpn-list.component.ts`, `vpn-list.component.html`, `vpn-list.component.scss`

**Interfaces:**
- Consumes: `VpnShellComponent` (Task 7), `VpnRegistrosComponent` (Task 8), `VpnAdministracionComponent` (Task 9), `VpnDashboardComponent` (Task 10), `vpnAdminGuard` (Task 5), `moduloGuard` (existing).

- [ ] **Step 1: Replace the VPN route block**

In `app.routes.ts`, replace:

```typescript
      {
        path: 'vpn',
        canActivate: [moduloGuard('vpn')],
        loadComponent: () =>
          import('./features/vpn/vpn-list.component').then((m) => m.VpnListComponent),
      },
```

with:

```typescript
      {
        path: 'vpn',
        loadComponent: () =>
          import('./features/vpn/vpn-shell.component').then((m) => m.VpnShellComponent),
        children: [
          { path: '', redirectTo: 'registros', pathMatch: 'full' },
          {
            path: 'registros',
            canActivate: [moduloGuard('vpn')],
            loadComponent: () =>
              import('./features/vpn/vpn-registros.component').then((m) => m.VpnRegistrosComponent),
          },
          {
            path: 'administracion',
            canActivate: [vpnAdminGuard],
            loadComponent: () =>
              import('./features/vpn/vpn-administracion.component').then((m) => m.VpnAdministracionComponent),
          },
          {
            path: 'dashboard',
            canActivate: [moduloGuard('aprobar-vpn', { write: true })],
            loadComponent: () =>
              import('./features/vpn/vpn-dashboard.component').then((m) => m.VpnDashboardComponent),
          },
        ],
      },
```

Add the import at the top of `app.routes.ts` alongside the existing `moduloGuard` import:

```typescript
import { vpnAdminGuard } from './core/auth/vpn-admin.guard';
```

- [ ] **Step 2: Delete the retired files**

```bash
rm soportedesk-frontend/src/app/features/vpn/vpn-list.component.ts soportedesk-frontend/src/app/features/vpn/vpn-list.component.html soportedesk-frontend/src/app/features/vpn/vpn-list.component.scss
```

- [ ] **Step 3: Build to catch any dangling references**

Run: `npx ng build --configuration=development` from `soportedesk-frontend/`
Expected: BUILD SUCCESS, no errors referencing `VpnListComponent` or deleted files

- [ ] **Step 4: Run the full frontend test suite**

Run: `npx ng test --watch=false --browsers=ChromeHeadless` from `soportedesk-frontend/`
Expected: same pass count as before this plan started, plus the new `vpn-admin.guard.spec.ts` passing (4 more passes, 0 new failures — the 7 pre-existing unrelated failures in `dashboard.component.spec.ts`/`catalogos.component.spec.ts` are out of scope)

- [ ] **Step 5: Run the full backend test suite**

Run: `mvn -o test` from `soportedesk-backend/`
Expected: BUILD SUCCESS, 0 failures

- [ ] **Step 6: Restart the dev backend with the AD_BIND_PASSWORD env var correctly injected and manually verify in the browser**

The backend must be restarted for the new `/api/vpn/dashboard/completo` route and the `/antivirus` auth fix to take effect (same lesson learned earlier this session — the running process must be recompiled *and* restarted, and must inherit `AD_BIND_PASSWORD`/relevant env vars from the correct scope). Confirm:
- `/vpn/registros` loads and lists all VPN records, "Nueva solicitud" button visible only with `solicitar-vpn`.
- `/vpn/administracion` shows KPI pills + approval workflow, only reachable with `solicitar-vpn` or `aprobar-vpn`.
- `/vpn/dashboard` shows KPIs + chart + 2 alert cards, only reachable with `aprobar-vpn`.
- `PATCH /api/vpn/{id}/antivirus` now returns 403 for a user without `solicitar-vpn`.

- [ ] **Step 7: Commit**

```bash
git add soportedesk-frontend/src/app/app.routes.ts
git add -u soportedesk-frontend/src/app/features/vpn/
git commit -m "feat(vpn): wire 3-tab routing, retire single-page VpnListComponent"
```

---

## Self-Review Notes

- **Spec coverage**: §2 (rutas/guards) → Tasks 5, 7, 11. §3.1 (security fix) → Task 1. §3.2 (dashboard endpoint) → Tasks 2-4. §4 (Registros) → Task 8. §5 (Administración) → Task 9. §6 (Dashboard) → Task 10. §7 (manejo de errores) → Task 3 Step 3 (`try/catch` → empty DTO) and Task 10 (frontend error banner). §9 (fuera de alcance: wiring del antivirus button) — intentionally not a task, confirmed out of scope.
- **Type consistency**: `VpnDashboardCompleto`/`VpnTipoEquipoCount`/`VpnVencimientoAlerta` field names match 1:1 between the Java records (Task 2) and the TypeScript interfaces (Task 5) and are used identically in Task 3 (backend) and Task 10 (frontend).
- **`estadoTone` duplication**: this small helper (4-line switch) is duplicated across `VpnDetailComponent`, `VpnRegistrosComponent`, and `VpnAdministracionComponent` rather than extracted to a shared util — consistent with how AD's redesign kept small per-component helpers rather than introducing a new shared utils file; acceptable per YAGNI, revisit only if a 4th consumer appears.
