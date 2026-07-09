# Módulo Correos — Rediseño en 2 caras — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the single read-only Correos page into 2 routed tabs — Consultas (filters/table/export/detail, everything today minus KPIs) and Dashboard (KPIs + distribution + 2FA + inactivity, new) — mirroring the AD/VPN redesigns but simpler: no write operations exist in this module, so no Administración tab and no new guard (both tabs use the existing `moduloGuard('correos')`).

**Architecture:** New `CorreosShellComponent` owns the tab nav + `<router-outlet>`; two lazy routes replace the single `/correos` route. Backend gets one new aggregation endpoint (`GET /api/correos/dashboard/completo`) reusing `VwGwDashboardRepository.findAll()`, same lenient-catch pattern as AD/VPN.

**Tech Stack:** Angular 17+ standalone components, Spring Boot 3 / Spring Security `@PreAuthorize`, `ng2-charts`, existing global CSS system + `vpn.shared.scss`/`usuarios-red.shared.scss` as the template for `correos.shared.scss`.

## Global Constraints

- Follow the spec exactly: `docs/superpowers/specs/2026-07-09-modulo-correos-dos-caras-design.md`.
- Reuse global CSS classes (`module-page`/`module-header`/`stat-pill`/`btn`/`card`/`badge`) and the `--color-correos`/`--color-correos-light` tokens already in `_variables.scss`.
- Do not change `findAll`/`getKpis`/`getSedes`/`getDependencias`/`getSubdependencias` logic — only add the new aggregation method/endpoint and relocate UI.
- `VwGwDashboard` has no setters — test fixtures must use `ReflectionTestUtils.setField` (see existing `CorreoServiceTest.java`/`CorreoControllerIT.java`).
- Inactivity threshold: 30 days without `ultimoInicioSesion` (or null), matching the existing `sinUso30Dias` filter semantics exactly.

---

## File Structure

**Backend (`soportedesk-backend/src/main/java/com/inia/soportedesk/correos/`):**
- Modify: `CorreoController.java` — add `GET /dashboard/completo`.
- Modify: `CorreoService.java` — add `public CorreoDashboardCompleto getDashboardCompleto()`.
- Create: `CorreoDependenciaCount.java`, `CorreoInactividadAlerta.java`, `CorreoDashboardCompleto.java`.
- Modify (test): `CorreoServiceTest.java`, `CorreoControllerIT.java`.

**Frontend (`soportedesk-frontend/src/app/features/correos/`):**
- Modify: `correo.model.ts` — add `CorreoDependenciaCount`, `CorreoInactividadAlerta`, `CorreoDashboardCompleto`.
- Modify: `correo.service.ts` — add `getDashboardCompleto()`.
- Rename+adapt: `correos-list.component.scss` → `correos.shared.scss` (strip the `.summary-grid` rules that move to the dashboard's own inline styles; keep everything else).
- Create: `correos-shell.component.ts`.
- Create: `correos-consultas.component.ts` (ports `correos-list.component.ts`/`.html` minus the KPI block).
- Create: `correos-dashboard.component.ts`.
- Delete: `correos-list.component.ts`, `correos-list.component.html`, `correos-list.component.scss`.
- Modify: `src/app/app.routes.ts` — replace the single `correos` route with a shell + children block (no new guard needed).

---

### Task 1: Backend — Dashboard DTOs

**Files:**
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/correos/CorreoDependenciaCount.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/correos/CorreoInactividadAlerta.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/correos/CorreoDashboardCompleto.java`

- [ ] **Step 1: Create the three records**

```java
package com.inia.soportedesk.correos;

public record CorreoDependenciaCount(String dependencia, long total) {
}
```

```java
package com.inia.soportedesk.correos;

public record CorreoInactividadAlerta(String email, String nombreCompleto, String detalle) {
}
```

```java
package com.inia.soportedesk.correos;

import java.util.List;

public record CorreoDashboardCompleto(
        CorreoKpisDto kpis,
        List<CorreoDependenciaCount> distribucionPorDependencia,
        long cuentasCon2FA,
        long totalCuentas,
        double porcentaje2FA,
        List<CorreoInactividadAlerta> sinUso,
        long totalSinUso
) {
}
```

- [ ] **Step 2: Compile**

Run: `mvn -o compile` from `soportedesk-backend/`
Expected: BUILD SUCCESS

- [ ] **Step 3: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/correos/CorreoDependenciaCount.java soportedesk-backend/src/main/java/com/inia/soportedesk/correos/CorreoInactividadAlerta.java soportedesk-backend/src/main/java/com/inia/soportedesk/correos/CorreoDashboardCompleto.java
git commit -m "feat(correos): add dashboard aggregation DTOs"
```

---

### Task 2: Backend — `CorreoService.getDashboardCompleto()` + endpoint

**Files:**
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/correos/CorreoService.java`
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/correos/CorreoController.java`
- Modify: `soportedesk-backend/src/test/java/com/inia/soportedesk/correos/CorreoServiceTest.java`
- Modify: `soportedesk-backend/src/test/java/com/inia/soportedesk/correos/CorreoControllerIT.java`

- [ ] **Step 1: Write the failing service unit tests**

Add to `CorreoServiceTest.java`:

```java
    @Test
    void getDashboardCompleto_aggregatesDistribution2FAAndInactivity() {
        VwGwDashboard activoOti = dashboard("a@inia.gob.pe", "Activo", "Sede Central", 10);
        ReflectionTestUtils.setField(activoOti, "oficinaPadre", "OTI");
        ReflectionTestUtils.setField(activoOti, "verificacion2Pasos", "Enrolado");
        ReflectionTestUtils.setField(activoOti, "ultimoInicioSesion", java.time.LocalDateTime.now());

        VwGwDashboard inactivoDga = dashboard("b@inia.gob.pe", "Activo", "EEAs", 20);
        ReflectionTestUtils.setField(inactivoDga, "oficinaPadre", "DGA");
        ReflectionTestUtils.setField(inactivoDga, "verificacion2Pasos", "No Enrolado");
        ReflectionTestUtils.setField(inactivoDga, "nombreCompleto", "Beto Gomez");
        ReflectionTestUtils.setField(inactivoDga, "ultimoInicioSesion", java.time.LocalDateTime.now().minusDays(90));

        VwGwDashboard sinAcceso = dashboard("c@inia.gob.pe", "Activo", "EEAs", 20);
        ReflectionTestUtils.setField(sinAcceso, "oficinaPadre", "DGA");
        ReflectionTestUtils.setField(sinAcceso, "verificacion2Pasos", "No Enrolado");
        ReflectionTestUtils.setField(sinAcceso, "nombreCompleto", "Cami Ruiz");
        ReflectionTestUtils.setField(sinAcceso, "ultimoInicioSesion", null);

        when(repository.findAll()).thenReturn(List.of(activoOti, inactivoDga, sinAcceso));

        CorreoDashboardCompleto result = service.getDashboardCompleto();

        assertThat(result.distribucionPorDependencia())
                .extracting(CorreoDependenciaCount::dependencia, CorreoDependenciaCount::total)
                .containsExactlyInAnyOrder(
                        org.assertj.core.groups.Tuple.tuple("OTI", 1L),
                        org.assertj.core.groups.Tuple.tuple("DGA", 2L)
                );

        assertThat(result.totalCuentas()).isEqualTo(3);
        assertThat(result.cuentasCon2FA()).isEqualTo(1);
        assertThat(result.porcentaje2FA()).isCloseTo(33.33, org.assertj.core.data.Offset.offset(0.1));

        assertThat(result.totalSinUso()).isEqualTo(2);
        assertThat(result.sinUso()).extracting(CorreoInactividadAlerta::email).containsExactly("c@inia.gob.pe", "b@inia.gob.pe");
    }

    @Test
    void getDashboardCompleto_onException_returnsEmptyDashboard() {
        when(repository.findAll()).thenThrow(new RuntimeException("db down"));

        CorreoDashboardCompleto result = service.getDashboardCompleto();

        assertThat(result.totalCuentas()).isEqualTo(0);
        assertThat(result.distribucionPorDependencia()).isEmpty();
        assertThat(result.sinUso()).isEmpty();
    }
```

- [ ] **Step 2: Run to verify failure**

Run: `mvn -o test -Dtest=CorreoServiceTest` from `soportedesk-backend/`
Expected: FAIL (compile error — `getDashboardCompleto`/`CorreoDashboardCompleto` not found)

- [ ] **Step 3: Implement `getDashboardCompleto()` in `CorreoService.java`**

Add after `getKpis()`:

```java
    private static final int INACTIVIDAD_DIAS = 30;

    @Transactional(readOnly = true)
    public CorreoDashboardCompleto getDashboardCompleto() {
        try {
            List<VwGwDashboard> all = repository.findAll();
            CorreoKpisDto kpis = getKpis();

            List<CorreoDependenciaCount> distribucion = all.stream()
                    .collect(java.util.stream.Collectors.groupingBy(
                            v -> v.getOficinaPadre() == null || v.getOficinaPadre().isBlank() ? "Sin dependencia" : v.getOficinaPadre(),
                            java.util.LinkedHashMap::new,
                            java.util.stream.Collectors.counting()))
                    .entrySet().stream()
                    .map(e -> new CorreoDependenciaCount(e.getKey(), e.getValue()))
                    .sorted(java.util.Comparator.comparing(CorreoDependenciaCount::dependencia))
                    .toList();

            long con2FA = all.stream().filter(v -> "Enrolado".equals(v.getVerificacion2Pasos())).count();
            double porcentaje = all.isEmpty() ? 0.0 : (con2FA * 100.0) / all.size();

            LocalDateTime umbral = LocalDateTime.now().minusDays(INACTIVIDAD_DIAS);
            List<VwGwDashboard> sinUso = all.stream()
                    .filter(v -> v.getUltimoInicioSesion() == null || v.getUltimoInicioSesion().isBefore(umbral))
                    .sorted(java.util.Comparator.comparing(
                            VwGwDashboard::getUltimoInicioSesion,
                            java.util.Comparator.nullsFirst(java.util.Comparator.naturalOrder())))
                    .toList();

            return new CorreoDashboardCompleto(
                    kpis,
                    distribucion,
                    con2FA, all.size(), porcentaje,
                    sinUso.stream().limit(10).map(this::toAlerta).toList(),
                    sinUso.size()
            );
        } catch (Exception e) {
            return new CorreoDashboardCompleto(
                    new CorreoKpisDto(0, 0, 0, 0, 0, 0, 0), List.of(), 0, 0, 0.0, List.of(), 0);
        }
    }

    private CorreoInactividadAlerta toAlerta(VwGwDashboard v) {
        String detalle = v.getUltimoInicioSesion() == null
                ? "Sin acceso registrado"
                : "Sin acceso desde " + v.getUltimoInicioSesion().toLocalDate();
        return new CorreoInactividadAlerta(v.getEmail(), v.getNombreCompleto(), detalle);
    }
```

- [ ] **Step 4: Run the service tests to verify they pass**

Run: `mvn -o test -Dtest=CorreoServiceTest` from `soportedesk-backend/`
Expected: PASS

- [ ] **Step 5: Write the failing controller integration tests**

Add to `CorreoControllerIT.java`:

```java
    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "READ_correos"})
    void dashboardCompleto_withReadAuthority_returnsOk() throws Exception {
        when(service.getDashboardCompleto()).thenReturn(new CorreoDashboardCompleto(
                new CorreoKpisDto(1200, 1069, 131, 1069, 131, 500, 700),
                List.of(), 800, 1200, 66.6, List.of(), 0));

        mockMvc.perform(get("/api/correos/dashboard/completo"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalCuentas", is(1200)));
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void dashboardCompleto_withoutReadAuthority_returnsForbidden() throws Exception {
        mockMvc.perform(get("/api/correos/dashboard/completo"))
                .andExpect(status().isForbidden());
    }
```

- [ ] **Step 6: Add the controller endpoint**

In `CorreoController.java`, add after `kpis()`:

```java
    @GetMapping("/dashboard/completo")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_correos')")
    public CorreoDashboardCompleto dashboardCompleto() {
        return service.getDashboardCompleto();
    }
```

- [ ] **Step 7: Run the full CorreoControllerIT + CorreoServiceTest classes**

Run: `mvn -o test -Dtest=CorreoControllerIT,CorreoServiceTest` from `soportedesk-backend/`
Expected: PASS (all tests)

- [ ] **Step 8: Run the full backend test suite**

Run: `mvn -o test` from `soportedesk-backend/`
Expected: BUILD SUCCESS, 0 failures

- [ ] **Step 9: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/correos/ soportedesk-backend/src/test/java/com/inia/soportedesk/correos/
git commit -m "feat(correos): add GET /api/correos/dashboard/completo endpoint"
```

---

### Task 3: Frontend — model and service

**Files:**
- Modify: `soportedesk-frontend/src/app/features/correos/correo.model.ts`
- Modify: `soportedesk-frontend/src/app/features/correos/correo.service.ts`

- [ ] **Step 1: Add model interfaces**

Append to `correo.model.ts`:

```typescript
export interface CorreoDependenciaCount {
  dependencia: string;
  total: number;
}

export interface CorreoInactividadAlerta {
  email: string;
  nombreCompleto: string | null;
  detalle: string;
}

export interface CorreoDashboardCompleto {
  kpis: CorreoKpis;
  distribucionPorDependencia: CorreoDependenciaCount[];
  cuentasCon2FA: number;
  totalCuentas: number;
  porcentaje2FA: number;
  sinUso: CorreoInactividadAlerta[];
  totalSinUso: number;
}
```

- [ ] **Step 2: Add service method**

In `correo.service.ts`, add `CorreoDashboardCompleto` to the import and add:

```typescript
  getDashboardCompleto(): Observable<CorreoDashboardCompleto> {
    return this.http.get<CorreoDashboardCompleto>(`${this.apiUrl}/dashboard/completo`);
  }
```

- [ ] **Step 3: Commit**

```bash
git add soportedesk-frontend/src/app/features/correos/correo.model.ts soportedesk-frontend/src/app/features/correos/correo.service.ts
git commit -m "feat(correos): add dashboard model/service method"
```

---

### Task 4: Frontend — `CorreosShellComponent` + `correos.shared.scss`

**Files:**
- Create: `soportedesk-frontend/src/app/features/correos/correos-shell.component.ts`
- Rename: `correos-list.component.scss` → `correos.shared.scss`, strip the `.summary-grid`/`.summary-card` rules (they move inline into the dashboard component, mirroring how AD/VPN kept `.module-stats`/`.stat-pill` global instead of a bespoke KPI-card class)

**Interfaces:**
- Produces: `<app-correos-shell>` routed as parent of `consultas`/`dashboard` (Task 6).

- [ ] **Step 1: Copy `correos-list.component.scss` to `correos.shared.scss`**

```bash
cp soportedesk-frontend/src/app/features/correos/correos-list.component.scss soportedesk-frontend/src/app/features/correos/correos.shared.scss
```

- [ ] **Step 2: Remove the `.summary-grid`/`.summary-card` block from `correos.shared.scss`**

Find and delete the `.summary-grid { ... }` and `.summary-card { ... }` rule blocks (including their `&.success`/`&.warning`/`&.info` nested modifiers) — these are replaced by the global `.module-stats`/`.stat-pill` classes used inline in the Dashboard component (Task 7), matching the AD/VPN precedent of not carrying a bespoke KPI-card class into the redesign.

- [ ] **Step 3: Add the `.ad-tabs` block and dashboard-specific classes to `correos.shared.scss`**

Prepend the same `.ad-tabs`/`.ad-tabs a` block used in `vpn.shared.scss` (copy verbatim), and append:

```scss
.correos-page {
  --color-accent: var(--color-correos);
  --color-accent-hover: #7c3aed;
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

  &:last-of-type { border-bottom: none; }
}

.stat-highlight {
  padding: 16px;
  text-align: center;

  strong { display: block; font-size: 32px; color: var(--color-accent); }
  span { color: var(--color-text-secondary); font-size: 12.5px; }
}

@media (max-width: 900px) {
  .dashboard-grid { grid-template-columns: 1fr; }
}
```

Note: `.correos-page` already exists near the top of the original file with `--color-accent-hover: #7c3aed` (confirmed in the current source) — do not duplicate the rule, just confirm it's retained after the copy.

- [ ] **Step 4: Create `CorreosShellComponent`**

```typescript
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-correos-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="module-page correos-page">
      <div class="module-header">
        <div>
          <span class="module-eyebrow">Cuentas institucionales</span>
          <h2>Correos Institucionales</h2>
          <p>Licencias, estado de cuentas y uso de Google Workspace desde GestionTI.</p>
        </div>
      </div>

      <nav class="ad-tabs" aria-label="Correos">
        <a routerLink="consultas" routerLinkActive="active">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          Consultas
        </a>
        <a routerLink="dashboard" routerLinkActive="active">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          Dashboard
        </a>
      </nav>

      <router-outlet />
    </div>
  `,
  styleUrl: './correos.shared.scss',
})
export class CorreosShellComponent {}
```

No `AuthService` needed — both tabs share the same `READ_correos` audience, unlike AD/VPN shells which conditionally hide tabs.

- [ ] **Step 5: Commit**

```bash
git add soportedesk-frontend/src/app/features/correos/correos-shell.component.ts soportedesk-frontend/src/app/features/correos/correos.shared.scss
git commit -m "feat(correos): add CorreosShellComponent with tab navigation"
```

---

### Task 5: Frontend — `CorreosConsultasComponent`

**Files:**
- Create: `soportedesk-frontend/src/app/features/correos/correos-consultas.component.ts`
- Create: `soportedesk-frontend/src/app/features/correos/correos-consultas.component.html`

Ports `correos-list.component.ts`/`.html` verbatim (all filter/table/mobile-list/export/detail-modal logic, unchanged), only removing the `.summary-grid` KPI block from the template and the `kpis`/`this.service.getKpis()` call from the component class (KPIs live only in Dashboard now).

- [ ] **Step 1: Create the component class**

```typescript
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../shared/modal/modal.component';
import { Correo, CorreoFiltros } from './correo.model';
import { CorreoService } from './correo.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-correos-consultas',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './correos-consultas.component.html',
  styleUrl: './correos.shared.scss',
})
export class CorreosConsultasComponent implements OnInit {
  private service = inject(CorreoService);

  items: Correo[] = [];
  sedes: string[] = [];
  dependencias: string[] = [];
  subdependencias: string[] = [];

  filtros: CorreoFiltros = {};
  searchTerm = '';
  selectedSede = '';
  selectedDependencia = '';
  selectedSubdependencia = '';
  selectedEstado = '';
  selectedModalidad = '';
  sinUso30Dias = false;
  selectedCorreo: Correo | null = null;

  readonly estadoOpciones = ['Activo', 'Suspendido'];
  readonly modalidadOpciones = ['CAP', 'CAS', 'EXTERNO', 'GENERICO', 'PRACTICANTE'];

  ngOnInit(): void {
    this.service.getSedes().subscribe((sedes) => (this.sedes = sedes));
    this.service.getDependencias().subscribe((dependencias) => (this.dependencias = dependencias));
    this.service.getSubdependencias().subscribe((subdependencias) => (this.subdependencias = subdependencias));
    this.load();
  }

  load(): void {
    this.filtros = {
      search: this.searchTerm || undefined,
      sede: this.selectedSede || undefined,
      dependencia: this.selectedDependencia || undefined,
      subdependencia: this.selectedSubdependencia || undefined,
      estado: this.selectedEstado || undefined,
      modalidad: this.selectedModalidad || undefined,
      sinUso30Dias: this.sinUso30Dias || undefined,
    };
    this.service.getAll(this.filtros).subscribe((data) => (this.items = data));
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    this.load();
  }

  onFiltroChange(): void {
    this.load();
  }

  onDependenciaChange(): void {
    this.selectedSubdependencia = '';
    this.service
      .getSubdependencias(this.selectedDependencia || undefined)
      .subscribe((subdependencias) => (this.subdependencias = subdependencias));
    this.load();
  }

  clearFiltros(): void {
    this.selectedSede = '';
    this.selectedDependencia = '';
    this.selectedSubdependencia = '';
    this.selectedEstado = '';
    this.selectedModalidad = '';
    this.sinUso30Dias = false;
    this.searchTerm = '';
    this.service.getSubdependencias().subscribe((subdependencias) => (this.subdependencias = subdependencias));
    this.load();
  }

  openDetail(item: Correo): void {
    this.selectedCorreo = item;
  }

  closeDetail(): void {
    this.selectedCorreo = null;
  }

  exportExcel(): void {
    const rows = this.items.map((item) => ({
      Correo: item.email ?? '',
      'Nombre Completo': item.nombreCompleto ?? item.employeeId ?? '',
      Sede: item.sede ?? '',
      Dependencia: item.oficinaPadre ?? '',
      Subdependencia: item.oficina ?? '',
      Modalidad: item.modalidad ?? '',
      Estado: item.estado ?? '',
      'Doble Autenticación': item.verificacion2Pasos ?? '',
      'Ultimo acceso': item.ultimoInicioSesion ?? '',
      'Uso Email (MB)': this.roundMb(item.emailUsageMB),
      'Uso Drive (MB)': this.roundMb(item.driveUsageMB),
      'Almacenamiento (MB)': this.roundMb(item.storageUsedMB),
      'Uso Total (MB)': this.roundMb(item.totalUsoMB),
      'Uso Total': this.formatStorage(item.totalUsoMB),
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet['!cols'] = [
      { wch: 34 }, { wch: 38 }, { wch: 20 }, { wch: 42 }, { wch: 42 }, { wch: 16 }, { wch: 14 },
      { wch: 20 }, { wch: 22 }, { wch: 16 }, { wch: 16 }, { wch: 20 }, { wch: 16 }, { wch: 16 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Correos');
    XLSX.writeFile(workbook, `correos-${this.exportDate()}.xlsx`);
  }

  formatStorage(value: number | null): string {
    if (value === null || value === undefined) return 'Sin dato';
    if (value >= 1024) return `${(value / 1024).toFixed(2)} GB`;
    return `${value.toFixed(2)} MB`;
  }

  statusClass(value: string | null): string {
    return value === 'Activo' ? 'success' : value === 'Suspendido' ? 'warning' : 'neutral';
  }

  twoFactorClass(value: string | null): string {
    return value === 'Enrolado' ? 'success' : value === 'No Enrolado' ? 'warning' : 'neutral';
  }

  hasActiveFilters(): boolean {
    return Boolean(
      this.searchTerm || this.selectedSede || this.selectedDependencia || this.selectedSubdependencia ||
        this.selectedEstado || this.selectedModalidad || this.sinUso30Dias
    );
  }

  private roundMb(value: number | null): number | '' {
    if (value === null || value === undefined) return '';
    return Math.round(value * 100) / 100;
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

Copy the existing `correos-list.component.html` to `correos-consultas.component.html`, then delete the `<section class="summary-grid" *ngIf="kpis"> ... </section>` block (lines 10-41 of the current file) and the leading `<div class="module-page correos-page"><div class="module-header">...</div>` wrapper (lines 1-8) since the shell now owns the page header — the file should start directly at `<div class="filtros-bar">` and end with the closing `</div>` that previously matched the outer `.module-page` wrapper removed at the top (replace it with a plain top-level `<div>` around the `filtros-bar`+`results-panel` content, or drop the wrapper entirely since `.filtros-bar` and `.results-panel` don't require one). The `<app-modal title="Detalle de cuenta" ...>` block at the end stays as-is (it's already a sibling of the wrapper, not nested inside it).

- [ ] **Step 3: Commit**

```bash
git add soportedesk-frontend/src/app/features/correos/correos-consultas.component.ts soportedesk-frontend/src/app/features/correos/correos-consultas.component.html
git commit -m "feat(correos): add CorreosConsultasComponent (read-only browse)"
```

---

### Task 6: Frontend — `CorreosDashboardComponent`

**Files:**
- Create: `soportedesk-frontend/src/app/features/correos/correos-dashboard.component.ts`

Mirrors `vpn-dashboard.component.ts`/`usuarios-red-dashboard.component.ts` structure.

- [ ] **Step 1: Create the component**

```typescript
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ChartConfiguration, ChartData } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { CorreoService } from './correo.service';
import { CorreoDashboardCompleto } from './correo.model';

@Component({
  selector: 'app-correos-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  template: `
    <div class="dashboard-toolbar">
      <p>Licencias, distribucion por dependencia y cuentas que requieren seguimiento.</p>
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
      <div class="stat-pill"><strong>{{ d.kpis.licenciasTotales }}</strong><span>Licencias Totales</span></div>
      <div class="stat-pill"><strong>{{ d.kpis.activasCount }}</strong><span>Activas</span></div>
      <div class="stat-pill"><strong>{{ d.kpis.suspendidasCount }}</strong><span>Suspendidas</span></div>
      <div class="stat-pill"><strong>{{ d.kpis.licenciasDisponibles }}</strong><span>Disponibles</span></div>
      <div class="stat-pill"><strong>{{ d.kpis.sedeCentralCount }}</strong><span>Sede Central</span></div>
      <div class="stat-pill"><strong>{{ d.kpis.eeasCount }}</strong><span>EEAs</span></div>
    </section>

    <section class="dashboard-grid" *ngIf="dashboard as d">
      <article class="card chart-card">
        <header>
          <strong>Distribucion por dependencia</strong>
          <span class="muted">{{ d.distribucionPorDependencia.length }} dependencias</span>
        </header>
        <canvas baseChart [data]="chartData" [options]="chartOptions" [type]="'bar'"></canvas>
      </article>

      <div class="alert-list">
        <article class="card stat-highlight">
          <strong>{{ d.porcentaje2FA.toFixed(1) }}%</strong>
          <span>{{ d.cuentasCon2FA }} de {{ d.totalCuentas }} cuentas con verificacion en 2 pasos</span>
        </article>

        <article class="card alert-card">
          <header>
            <strong>Cuentas sin uso 30+ dias</strong>
            <span class="badge badge-warning">{{ d.totalSinUso }}</span>
          </header>
          <div class="alert-row" *ngFor="let row of d.sinUso">
            <strong>{{ row.nombreCompleto || row.email }}</strong>
            <small class="muted">{{ row.detalle }}</small>
          </div>
          <p class="muted" *ngIf="!d.sinUso.length">Sin registros criticos.</p>
          <p class="muted" *ngIf="d.totalSinUso > d.sinUso.length">+{{ d.totalSinUso - d.sinUso.length }} mas</p>
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
  styleUrl: './correos.shared.scss',
})
export class CorreosDashboardComponent implements OnInit {
  private service = inject(CorreoService);

  dashboard: CorreoDashboardCompleto | null = null;
  loading = false;
  error = false;

  chartData: ChartData<'bar', number[], string> = {
    labels: [],
    datasets: [{ data: [], label: 'Cuentas', backgroundColor: '#8b5cf6' }],
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

  private applyChart(dashboard: CorreoDashboardCompleto | null): void {
    const rows = dashboard?.distribucionPorDependencia ?? [];
    this.chartData = {
      labels: rows.map((row) => row.dependencia),
      datasets: [{ data: rows.map((row) => row.total), label: 'Cuentas', backgroundColor: '#8b5cf6' }],
    };
  }
}
```

`#8b5cf6` matches `--color-correos` from `_variables.scss:34` — same established Chart.js-literal exception as AD/VPN dashboards.

- [ ] **Step 2: Commit**

```bash
git add soportedesk-frontend/src/app/features/correos/correos-dashboard.component.ts
git commit -m "feat(correos): add CorreosDashboardComponent"
```

---

### Task 7: Wire routes, retire the old page, full verification

**Files:**
- Modify: `soportedesk-frontend/src/app/app.routes.ts` (correos block, ~lines 79-84)
- Delete: `correos-list.component.ts`, `correos-list.component.html`, `correos-list.component.scss`

- [ ] **Step 1: Replace the correos route block**

Replace:

```typescript
      {
        path: 'correos',
        canActivate: [moduloGuard('correos')],
        loadComponent: () =>
          import('./features/correos/correos-list.component').then((m) => m.CorreosListComponent),
      },
```

with:

```typescript
      {
        path: 'correos',
        loadComponent: () =>
          import('./features/correos/correos-shell.component').then((m) => m.CorreosShellComponent),
        children: [
          { path: '', redirectTo: 'consultas', pathMatch: 'full' },
          {
            path: 'consultas',
            canActivate: [moduloGuard('correos')],
            loadComponent: () =>
              import('./features/correos/correos-consultas.component').then((m) => m.CorreosConsultasComponent),
          },
          {
            path: 'dashboard',
            canActivate: [moduloGuard('correos')],
            loadComponent: () =>
              import('./features/correos/correos-dashboard.component').then((m) => m.CorreosDashboardComponent),
          },
        ],
      },
```

No new guard import needed (both children reuse `moduloGuard`, already imported).

- [ ] **Step 2: Delete the retired files**

```bash
rm soportedesk-frontend/src/app/features/correos/correos-list.component.ts soportedesk-frontend/src/app/features/correos/correos-list.component.html soportedesk-frontend/src/app/features/correos/correos-list.component.scss
```

- [ ] **Step 3: Build to catch dangling references**

Run: `npx ng build --configuration=development` from `soportedesk-frontend/`
Expected: BUILD SUCCESS

- [ ] **Step 4: Run the full frontend test suite**

Run: `npx ng test --watch=false --browsers=ChromeHeadless` from `soportedesk-frontend/`
Expected: same pass/fail counts as before this task (no `correos-list.component` spec existed, so no test count change from this module; the 7 pre-existing unrelated failures remain out of scope)

- [ ] **Step 5: Run the full backend test suite**

Run: `mvn -o test` from `soportedesk-backend/`
Expected: BUILD SUCCESS, 0 failures

- [ ] **Step 6: Restart the dev backend and manually verify in the browser**

Same restart procedure as AD/VPN this session (recompile, kill the running process, relaunch with `AD_BIND_PASSWORD` correctly injected via the User-scope env var — even though Correos doesn't touch LDAP, the same process-restart discipline applies so the new `/dashboard/completo` route is loaded). Confirm:
- `/correos/consultas` shows filters + table/list + export + detail modal, no KPI cards.
- `/correos/dashboard` shows 6 KPI pills + distribution chart + 2FA stat + inactivity list.

- [ ] **Step 7: Commit**

```bash
git add soportedesk-frontend/src/app/app.routes.ts
git add -u soportedesk-frontend/src/app/features/correos/
git commit -m "feat(correos): wire 2-tab routing, retire single-page CorreosListComponent"
```

---

## Self-Review Notes

- **Spec coverage**: §2 (rutas) → Task 7. §3 (endpoint) → Tasks 1-2. §4 (Consultas) → Task 5. §5 (Dashboard) → Task 6. §6 (manejo de errores) → Task 2 Step 3 (try/catch → empty DTO) + Task 6 (frontend error banner). §8 (fuera de alcance) confirmed — no guard added, no write ops touched.
- **Type consistency**: `CorreoDashboardCompleto`/`CorreoDependenciaCount`/`CorreoInactividadAlerta` field names match 1:1 between Java records (Task 1) and TS interfaces (Task 3), used identically in Task 2 (backend) and Task 6 (frontend).
- **No new guard**: confirmed both tabs reuse `moduloGuard('correos')` — this module has no write authority to gate against, so `vpnAdminGuard`-style logic doesn't apply here.
