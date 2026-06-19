# Dashboard: Usuarios Desactivados y Gráfico por Ubicación Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the SoporteDesk INIA dashboard with a "Usuarios Desactivados" KPI card (linking to a pre-filtered Usuarios de Red list) and a toggleable bar chart (Sede/Dependencia) showing Activos vs Inactivos counts.

**Architecture:** Two new backend repository queries feed a new `DashboardService.usuariosRedPorUbicacion(nivel)` method and a new `GET /api/dashboard/usuarios-red-por-ubicacion` endpoint; the existing `/api/dashboard/counts` gains one new field. On the frontend, the existing `DashboardComponent` gains an 8th KPI card and a new standalone chart component (Chart.js via ng2-charts); `GenericTableComponent` gains an `initialSearch` input so `UsuariosRedListComponent` can pre-filter from a `?search=` query param.

**Tech Stack:** Spring Boot 3.2.5 / Java 17 / Spring Data JPA (backend), Angular 17 standalone components, Chart.js + ng2-charts (frontend).

## Global Constraints

- No additional charting library beyond `chart.js` + `ng2-charts` is introduced.
- "Desactivado" is defined as `estado IS NULL OR LOWER(estado) <> 'activo'` — never a fixed list of known "inactive" string values.
- Existing search behavior of `UsuariosRedListComponent` for terms NOT coming from a query param is unchanged.
- The chart groups by Sede by default; the toggle switches to Dependencia.
- `nivel` outside `{sede, dependencia}` (including absent/null) defaults to `sede` — never a 400 error, since it's a UI-controlled parameter, not external user input.
- Project quirk: `ng test --include=<one spec>` still type-checks and compiles **every** spec in the project (Karma limitation) — if any unrelated spec is broken, the run fails even when `--include` targets a single file. Run the full suite (`ng test --watch=false --browsers=ChromeHeadless`) to get an accurate pass/fail signal.

---

### Task 1: Backend — `usuariosRedInactivos` KPI count

**Files:**
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/usuariosred/UsuarioRedRepository.java`
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/dashboard/DashboardCounts.java`
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/dashboard/DashboardService.java`
- Test: `soportedesk-backend/src/test/java/com/inia/soportedesk/dashboard/DashboardServiceTest.java`

**Interfaces:**
- Produces: `UsuarioRedRepository.countDesactivados(): long`. `DashboardCounts` record gains a trailing `long usuariosRedInactivos` component. Both are consumed by Task 3 (frontend `DashboardCounts` model + card).

- [ ] **Step 1: Write the failing test**

Modify `soportedesk-backend/src/test/java/com/inia/soportedesk/dashboard/DashboardServiceTest.java` — update the existing test to mock and assert the new field:

```java
package com.inia.soportedesk.dashboard;

import com.inia.soportedesk.equipos.EquipoRepository;
import com.inia.soportedesk.correos.CorreoRepository;
import com.inia.soportedesk.impresoras.ImpresoraRepository;
import com.inia.soportedesk.licencias.LicenciaRepository;
import com.inia.soportedesk.usuariosred.UsuarioRedRepository;
import com.inia.soportedesk.vpn.VpnRepository;
import com.inia.soportedesk.wifi.WifiRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock
    private LicenciaRepository licenciaRepository;

    @Mock
    private CorreoRepository correoRepository;

    @Mock
    private UsuarioRedRepository usuarioRedRepository;

    @Mock
    private VpnRepository vpnRepository;

    @Mock
    private WifiRepository wifiRepository;

    @Mock
    private ImpresoraRepository impresoraRepository;

    @Mock
    private EquipoRepository equipoRepository;

    @InjectMocks
    private DashboardService service;

    @Test
    void getCounts_returnsCountForEachModule() {
        when(licenciaRepository.count()).thenReturn(5L);
        when(correoRepository.count()).thenReturn(12L);
        when(usuarioRedRepository.count()).thenReturn(20L);
        when(vpnRepository.count()).thenReturn(3L);
        when(wifiRepository.count()).thenReturn(4L);
        when(impresoraRepository.count()).thenReturn(7L);
        when(equipoRepository.count()).thenReturn(15L);
        when(usuarioRedRepository.countDesactivados()).thenReturn(1L);

        DashboardCounts counts = service.getCounts();

        assertThat(counts.licencias()).isEqualTo(5L);
        assertThat(counts.correos()).isEqualTo(12L);
        assertThat(counts.usuariosRed()).isEqualTo(20L);
        assertThat(counts.vpn()).isEqualTo(3L);
        assertThat(counts.wifi()).isEqualTo(4L);
        assertThat(counts.impresoras()).isEqualTo(7L);
        assertThat(counts.equipos()).isEqualTo(15L);
        assertThat(counts.usuariosRedInactivos()).isEqualTo(1L);
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run (from `soportedesk-backend/`): `mvn test -Dtest=DashboardServiceTest -q`
Expected: COMPILE ERROR — `countDesactivados()` is undefined on `UsuarioRedRepository`, and `DashboardCounts` has no `usuariosRedInactivos()` accessor.

- [ ] **Step 3: Add the repository query**

Modify `soportedesk-backend/src/main/java/com/inia/soportedesk/usuariosred/UsuarioRedRepository.java` — add this method inside the interface, after the existing `search(...)` method:

```java
    @Query("SELECT COUNT(u) FROM UsuarioRed u WHERE u.estado IS NULL OR LOWER(u.estado) <> 'activo'")
    long countDesactivados();
```

- [ ] **Step 4: Add the field to `DashboardCounts`**

Modify `soportedesk-backend/src/main/java/com/inia/soportedesk/dashboard/DashboardCounts.java`:

```java
package com.inia.soportedesk.dashboard;

public record DashboardCounts(
        long licencias,
        long correos,
        long usuariosRed,
        long vpn,
        long wifi,
        long impresoras,
        long equipos,
        long usuariosRedInactivos
) {
}
```

- [ ] **Step 5: Populate the field in `DashboardService`**

Modify `soportedesk-backend/src/main/java/com/inia/soportedesk/dashboard/DashboardService.java` — replace the body of `getCounts()`:

```java
    public DashboardCounts getCounts() {
        return new DashboardCounts(
                licenciaRepository.count(),
                correoRepository.count(),
                usuarioRedRepository.count(),
                vpnRepository.count(),
                wifiRepository.count(),
                impresoraRepository.count(),
                equipoRepository.count(),
                usuarioRedRepository.countDesactivados()
        );
    }
```

- [ ] **Step 6: Run test to verify it passes**

Run: `mvn test -Dtest=DashboardServiceTest -q`
Expected: `Tests run: 1, Failures: 0, Errors: 0`

- [ ] **Step 7: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/usuariosred/UsuarioRedRepository.java soportedesk-backend/src/main/java/com/inia/soportedesk/dashboard/DashboardCounts.java soportedesk-backend/src/main/java/com/inia/soportedesk/dashboard/DashboardService.java soportedesk-backend/src/test/java/com/inia/soportedesk/dashboard/DashboardServiceTest.java
git commit -m "feat: add usuariosRedInactivos count to dashboard"
```

---

### Task 2: Backend — `usuarios-red-por-ubicacion` endpoint

**Files:**
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/usuariosred/UsuarioRedRepository.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/dashboard/UbicacionUsuariosCount.java`
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/dashboard/DashboardService.java`
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/dashboard/DashboardController.java`
- Test: `soportedesk-backend/src/test/java/com/inia/soportedesk/dashboard/DashboardServiceTest.java`

**Interfaces:**
- Consumes: nothing from Task 1 (independent backend addition; same files but non-overlapping methods).
- Produces: `record UbicacionUsuariosCount(String nombre, long activos, long inactivos)`, `DashboardService.usuariosRedPorUbicacion(String nivel): List<UbicacionUsuariosCount>`, endpoint `GET /api/dashboard/usuarios-red-por-ubicacion?nivel=sede|dependencia`. Consumed by Task 5 (frontend chart component + service).

- [ ] **Step 1: Write the failing tests**

Append these three tests to `soportedesk-backend/src/test/java/com/inia/soportedesk/dashboard/DashboardServiceTest.java`, inside the `DashboardServiceTest` class, after `getCounts_returnsCountForEachModule`. Also add `import java.util.List;` and `import static org.mockito.Mockito.verify;` to the file's imports.

```java
    @Test
    void usuariosRedPorUbicacion_withSede_pivotsRowsIntoActivosInactivos() {
        List<Object[]> rows = List.of(
                new Object[]{"Lima", "Activo", 10L},
                new Object[]{"Lima", "Inactivo", 2L},
                new Object[]{"Cusco", "Activo", 5L}
        );
        when(usuarioRedRepository.countGroupedBySedeAndEstado()).thenReturn(rows);

        List<UbicacionUsuariosCount> result = service.usuariosRedPorUbicacion("sede");

        assertThat(result).containsExactly(
                new UbicacionUsuariosCount("Lima", 10L, 2L),
                new UbicacionUsuariosCount("Cusco", 5L, 0L)
        );
    }

    @Test
    void usuariosRedPorUbicacion_withDependencia_usesGroupedByDependenciaQuery() {
        List<Object[]> rows = List.of(new Object[]{"TI", "Activo", 8L});
        when(usuarioRedRepository.countGroupedByDependenciaAndEstado()).thenReturn(rows);

        List<UbicacionUsuariosCount> result = service.usuariosRedPorUbicacion("dependencia");

        assertThat(result).containsExactly(new UbicacionUsuariosCount("TI", 8L, 0L));
    }

    @Test
    void usuariosRedPorUbicacion_withInvalidOrNullNivel_defaultsToSede() {
        when(usuarioRedRepository.countGroupedBySedeAndEstado()).thenReturn(List.of());

        List<UbicacionUsuariosCount> result = service.usuariosRedPorUbicacion("foo");
        service.usuariosRedPorUbicacion(null);

        assertThat(result).isEmpty();
        verify(usuarioRedRepository, org.mockito.Mockito.times(2)).countGroupedBySedeAndEstado();
    }
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `mvn test -Dtest=DashboardServiceTest -q`
Expected: COMPILE ERROR — `UbicacionUsuariosCount`, `countGroupedBySedeAndEstado()`, `countGroupedByDependenciaAndEstado()`, and `usuariosRedPorUbicacion(...)` do not exist yet.

- [ ] **Step 3: Add the grouped repository queries**

Modify `soportedesk-backend/src/main/java/com/inia/soportedesk/usuariosred/UsuarioRedRepository.java` — add these two methods after `countDesactivados()`:

```java
    @Query("SELECT s.nombre, u.estado, COUNT(u) FROM UsuarioRed u JOIN u.sede s GROUP BY s.nombre, u.estado")
    List<Object[]> countGroupedBySedeAndEstado();

    @Query("SELECT d.nombre, u.estado, COUNT(u) FROM UsuarioRed u JOIN u.dependencia d GROUP BY d.nombre, u.estado")
    List<Object[]> countGroupedByDependenciaAndEstado();
```

- [ ] **Step 4: Create the `UbicacionUsuariosCount` DTO**

Create `soportedesk-backend/src/main/java/com/inia/soportedesk/dashboard/UbicacionUsuariosCount.java`:

```java
package com.inia.soportedesk.dashboard;

public record UbicacionUsuariosCount(String nombre, long activos, long inactivos) {
}
```

- [ ] **Step 5: Add the service method with pivot logic**

Modify `soportedesk-backend/src/main/java/com/inia/soportedesk/dashboard/DashboardService.java` — add these imports:

```java
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
```

Add this method and private helper after `getCounts()`, before the closing `}` of the class:

```java
    public List<UbicacionUsuariosCount> usuariosRedPorUbicacion(String nivel) {
        List<Object[]> rows = "dependencia".equalsIgnoreCase(nivel)
                ? usuarioRedRepository.countGroupedByDependenciaAndEstado()
                : usuarioRedRepository.countGroupedBySedeAndEstado();
        return pivot(rows);
    }

    private List<UbicacionUsuariosCount> pivot(List<Object[]> rows) {
        Map<String, long[]> acc = new LinkedHashMap<>();
        for (Object[] row : rows) {
            String nombre = (String) row[0];
            String estado = (String) row[1];
            long count = ((Number) row[2]).longValue();
            long[] pair = acc.computeIfAbsent(nombre, k -> new long[2]);
            if (estado != null && estado.equalsIgnoreCase("activo")) {
                pair[0] += count;
            } else {
                pair[1] += count;
            }
        }
        List<UbicacionUsuariosCount> result = new ArrayList<>();
        for (Map.Entry<String, long[]> entry : acc.entrySet()) {
            result.add(new UbicacionUsuariosCount(entry.getKey(), entry.getValue()[0], entry.getValue()[1]));
        }
        return result;
    }
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `mvn test -Dtest=DashboardServiceTest -q`
Expected: `Tests run: 4, Failures: 0, Errors: 0`

- [ ] **Step 7: Add the controller endpoint**

Modify `soportedesk-backend/src/main/java/com/inia/soportedesk/dashboard/DashboardController.java`:

```java
package com.inia.soportedesk.dashboard;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService service;

    @GetMapping("/counts")
    public DashboardCounts getCounts() {
        return service.getCounts();
    }

    @GetMapping("/usuarios-red-por-ubicacion")
    public List<UbicacionUsuariosCount> usuariosRedPorUbicacion(@RequestParam(required = false) String nivel) {
        return service.usuariosRedPorUbicacion(nivel);
    }
}
```

- [ ] **Step 8: Compile the whole backend to confirm no regressions**

Run (from `soportedesk-backend/`): `mvn -q test-compile`
Expected: clean compile, no output.

- [ ] **Step 9: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/usuariosred/UsuarioRedRepository.java soportedesk-backend/src/main/java/com/inia/soportedesk/dashboard/UbicacionUsuariosCount.java soportedesk-backend/src/main/java/com/inia/soportedesk/dashboard/DashboardService.java soportedesk-backend/src/main/java/com/inia/soportedesk/dashboard/DashboardController.java soportedesk-backend/src/test/java/com/inia/soportedesk/dashboard/DashboardServiceTest.java
git commit -m "feat: add usuarios-red-por-ubicacion dashboard endpoint"
```

---

### Task 3: Frontend — "Usuarios Desactivados" KPI card

**Files:**
- Modify: `soportedesk-frontend/src/app/features/dashboard/dashboard-counts.model.ts`
- Modify: `soportedesk-frontend/src/app/features/dashboard/dashboard.component.ts`
- Modify: `soportedesk-frontend/src/app/features/dashboard/dashboard.component.html`
- Create: `soportedesk-frontend/src/app/features/dashboard/dashboard.component.spec.ts`

**Interfaces:**
- Consumes: `DashboardCounts.usuariosRedInactivos` (Task 1, backend field name `usuariosRedInactivos` — must match exactly since it's deserialized straight from JSON).
- Produces: `DashboardCard.queryParams?: Record<string, string>`. Not consumed by any other task in this plan, but the `?search=Inactivo` query param convention is the contract Task 4 reads.

- [ ] **Step 1: Write the failing test**

Create `soportedesk-frontend/src/app/features/dashboard/dashboard.component.spec.ts`:

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter, RouterLink } from '@angular/router';
import { By } from '@angular/platform-browser';
import { DashboardComponent } from './dashboard.component';
import { DashboardCounts } from './dashboard-counts.model';

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let httpMock: HttpTestingController;

  const counts: DashboardCounts = {
    licencias: 5,
    correos: 12,
    usuariosRed: 20,
    vpn: 3,
    wifi: 4,
    impresoras: 7,
    equipos: 15,
    usuariosRedInactivos: 2,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DashboardComponent, HttpClientTestingModule],
      providers: [provideRouter([])],
    });
    fixture = TestBed.createComponent(DashboardComponent);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    httpMock.expectOne('/api/dashboard/counts').flush(counts);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('renders a card for usuarios desactivados that links to the filtered list', () => {
    const links = fixture.debugElement.queryAll(By.directive(RouterLink));
    const card = links.find((l) => l.nativeElement.textContent.includes('Usuarios Desactivados'));
    expect(card).toBeTruthy();
    expect(card!.nativeElement.textContent).toContain('2');

    const routerLink = card!.injector.get(RouterLink);
    expect(routerLink.queryParams).toEqual({ search: 'Inactivo' });
  });

  it('computes totalRegistros from the 7 record categories, excluding usuariosRedInactivos', () => {
    expect(fixture.componentInstance.totalRegistros).toBe(5 + 12 + 20 + 3 + 4 + 7 + 15);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run (from `soportedesk-frontend/`): `ng test --watch=false --browsers=ChromeHeadless`
Expected: FAIL — no card contains "Usuarios Desactivados" text yet, and `totalRegistros` is `5+12+20+3+4+7+15+0` already (current code sums `Object.values(counts)`, which today is coincidentally the same 7 fields — the test will fail once Step 4 below adds the 8th field to the model, because the unmodified component would then double count `usuariosRedInactivos`). Apply Step 3 (model) before re-running so the failure mode is the real one.

- [ ] **Step 3: Add the field to the frontend model**

Modify `soportedesk-frontend/src/app/features/dashboard/dashboard-counts.model.ts`:

```typescript
export interface DashboardCounts {
  licencias: number;
  correos: number;
  usuariosRed: number;
  vpn: number;
  wifi: number;
  impresoras: number;
  equipos: number;
  usuariosRedInactivos: number;
}
```

Re-run the test now — expected: FAIL, `totalRegistros` is double-counted (`...+15+2` instead of `...+15`), and the card is still missing.

- [ ] **Step 4: Add the icon, the card, the `queryParams` field, and fix `totalRegistros`**

Modify `soportedesk-frontend/src/app/features/dashboard/dashboard.component.ts` in full:

```typescript
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { DashboardService } from './dashboard.service';
import { DashboardCounts } from './dashboard-counts.model';

interface DashboardCard {
  label: string;
  value: number;
  path: string;
  color: string;
  bg: string;
  icon: SafeHtml;
  queryParams?: Record<string, string>;
}

const ICONS: Record<string, string> = {
  key:     `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="15.5" r="5.5"/><path d="M21 2l-9.6 9.6"/><path d="M15.5 7.5l3 3L22 7l-3-3"/></svg>`,
  mail:    `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
  users:   `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  lock:    `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  wifi:    `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>`,
  printer: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>`,
  monitor: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
  userX:   `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="17" y1="8" x2="22" y2="13"/><line x1="22" y1="8" x2="17" y2="13"/></svg>`,
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private sanitizer = inject(DomSanitizer);

  cards: DashboardCard[] = [];
  totalRegistros = 0;

  ngOnInit(): void {
    this.dashboardService.getCounts().subscribe(counts => {
      this.cards = this.toCards(counts);
      this.totalRegistros = counts.licencias + counts.correos + counts.usuariosRed + counts.vpn
        + counts.wifi + counts.impresoras + counts.equipos;
    });
  }

  private svg(key: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(ICONS[key]);
  }

  private toCards(counts: DashboardCounts): DashboardCard[] {
    return [
      { label: 'Licencias Office',       value: counts.licencias,    path: '/licencias',    color: '#3b82f6', bg: '#eff6ff', icon: this.svg('key') },
      { label: 'Correos Institucionales',value: counts.correos,      path: '/correos',      color: '#8b5cf6', bg: '#f5f3ff', icon: this.svg('mail') },
      { label: 'Usuarios de Red/AD',     value: counts.usuariosRed,  path: '/usuarios-red', color: '#f97316', bg: '#fff7ed', icon: this.svg('users') },
      { label: 'VPN',                    value: counts.vpn,          path: '/vpn',          color: '#ef4444', bg: '#fef2f2', icon: this.svg('lock') },
      { label: 'Claves WiFi',            value: counts.wifi,         path: '/wifi',         color: '#06b6d4', bg: '#ecfeff', icon: this.svg('wifi') },
      { label: 'Impresoras',             value: counts.impresoras,   path: '/impresoras',   color: '#64748b', bg: '#f8fafc', icon: this.svg('printer') },
      { label: 'Equipos Asignados',      value: counts.equipos,      path: '/equipos',      color: '#16a34a', bg: '#f0fdf4', icon: this.svg('monitor') },
      { label: 'Usuarios Desactivados',  value: counts.usuariosRedInactivos, path: '/usuarios-red', color: '#d97706', bg: '#fffbeb', icon: this.svg('userX'), queryParams: { search: 'Inactivo' } },
    ];
  }
}
```

- [ ] **Step 5: Bind `queryParams` in the template**

Modify `soportedesk-frontend/src/app/features/dashboard/dashboard.component.html` — change the anchor's opening tag:

```html
    <a class="kpi-card" *ngFor="let card of cards" [routerLink]="card.path" [queryParams]="card.queryParams" [style.--card-color]="card.color" [style.--card-bg]="card.bg">
```

- [ ] **Step 6: Run test to verify it passes**

Run: `ng test --watch=false --browsers=ChromeHeadless`
Expected: all specs pass, including the 2 new `DashboardComponent` tests.

- [ ] **Step 7: Commit**

```bash
git add soportedesk-frontend/src/app/features/dashboard/dashboard-counts.model.ts soportedesk-frontend/src/app/features/dashboard/dashboard.component.ts soportedesk-frontend/src/app/features/dashboard/dashboard.component.html soportedesk-frontend/src/app/features/dashboard/dashboard.component.spec.ts
git commit -m "feat: add usuarios desactivados KPI card to dashboard"
```

---

### Task 4: Frontend — Pre-filtered Usuarios de Red list

**Files:**
- Modify: `soportedesk-frontend/src/app/shared/generic-table/generic-table.component.ts`
- Modify: `soportedesk-frontend/src/app/shared/generic-table/generic-table.component.html`
- Modify: `soportedesk-frontend/src/app/shared/generic-table/generic-table.component.spec.ts`
- Modify: `soportedesk-frontend/src/app/features/usuarios-red/usuarios-red-list.component.ts`
- Modify: `soportedesk-frontend/src/app/features/usuarios-red/usuarios-red-list.component.html`
- Create: `soportedesk-frontend/src/app/features/usuarios-red/usuarios-red-list.component.spec.ts`

**Interfaces:**
- Consumes: the `?search=Inactivo` query-param convention established by Task 3's card (this task works for any `search` value, the card is just the first caller).
- Produces: `GenericTableComponent.initialSearch: string` input (`@Input() initialSearch = ''`), consumed only within this task by `UsuariosRedListComponent`. No other task depends on this.

- [ ] **Step 1: Write the failing test for `GenericTableComponent`**

Modify `soportedesk-frontend/src/app/shared/generic-table/generic-table.component.spec.ts` — add this test as a new `it(...)` inside the existing `describe('GenericTableComponent', ...)` block, after the `'shows "Sin registros"...'` test:

```typescript
  it('initializes searchTerm from initialSearch and reflects it in the input value', () => {
    component.initialSearch = 'Inactivo';
    fixture.detectChanges();

    expect(component.searchTerm).toBe('Inactivo');
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    expect(input.value).toBe('Inactivo');
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run (from `soportedesk-frontend/`): `ng test --watch=false --browsers=ChromeHeadless`
Expected: FAIL — `Property 'initialSearch' does not exist on type 'GenericTableComponent<any>'`.

- [ ] **Step 3: Add `initialSearch` to `GenericTableComponent`**

Modify `soportedesk-frontend/src/app/shared/generic-table/generic-table.component.ts` in full:

```typescript
import { Component, ContentChild, EventEmitter, Input, OnInit, Output, TemplateRef } from '@angular/core';
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class GenericTableComponent<T = any> implements OnInit {
  @Input({ required: true }) columns: TableColumn[] = [];
  @Input({ required: true }) data: T[] = [];
  @Input() canEdit = false;
  @Input() extraColumnLabel: string | null = null;
  @Input() initialSearch = '';

  @Output() searchChange = new EventEmitter<string>();
  @Output() add = new EventEmitter<void>();
  @Output() view = new EventEmitter<T>();
  @Output() edit = new EventEmitter<T>();
  @Output() delete = new EventEmitter<T>();

  @ContentChild('extraCell') extraCellTemplate?: TemplateRef<{ $implicit: T }>;

  searchTerm = '';
  private searchTimeout?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.searchTerm = this.initialSearch;
  }

  getValue(row: T, key: string): unknown {
    return key.split('.').reduce<unknown>((value, part) => {
      if (value && typeof value === 'object') {
        return (value as Record<string, unknown>)[part];
      }
      return undefined;
    }, row);
  }

  onSearch(value: string): void {
    this.searchTerm = value;
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.searchChange.emit(value), 300);
  }
}
```

- [ ] **Step 4: Reflect `searchTerm` in the search input's value**

Modify `soportedesk-frontend/src/app/shared/generic-table/generic-table.component.html` — change the search input line:

```html
      <input type="text" placeholder="Buscar..." [value]="searchTerm" (input)="onSearch($any($event.target).value)" />
```

- [ ] **Step 5: Run test to verify it passes**

Run: `ng test --watch=false --browsers=ChromeHeadless`
Expected: all specs pass, including the new `GenericTableComponent` test.

- [ ] **Step 6: Write the failing test for `UsuariosRedListComponent`**

Create `soportedesk-frontend/src/app/features/usuarios-red/usuarios-red-list.component.spec.ts`:

```typescript
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { UsuariosRedListComponent } from './usuarios-red-list.component';
import { AuthService } from '../../core/auth/auth.service';

describe('UsuariosRedListComponent', () => {
  let httpMock: HttpTestingController;

  function createComponent(queryParams: Record<string, string>): UsuariosRedListComponent {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: AuthService, useValue: { canWrite: () => true } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap(queryParams) } },
        },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    return TestBed.runInInjectionContext(() => new UsuariosRedListComponent());
  }

  afterEach(() => httpMock.verify());

  it('reads the search query param and pre-filters the list', () => {
    const component = createComponent({ search: 'Inactivo' });

    component.ngOnInit();

    expect(component.initialSearch).toBe('Inactivo');
    const req = httpMock.expectOne(
      (r) => r.url === '/api/usuarios-red' && r.params.get('search') === 'Inactivo',
    );
    req.flush([]);
  });

  it('loads without a filter when there is no search query param', () => {
    const component = createComponent({});

    component.ngOnInit();

    expect(component.initialSearch).toBe('');
    const req = httpMock.expectOne((r) => r.url === '/api/usuarios-red');
    expect(req.request.params.has('search')).toBe(false);
    req.flush([]);
  });
});
```

- [ ] **Step 7: Run test to verify it fails**

Run: `ng test --watch=false --browsers=ChromeHeadless`
Expected: FAIL — `Property 'initialSearch' does not exist on type 'UsuariosRedListComponent'`.

- [ ] **Step 8: Read the query param in `UsuariosRedListComponent`**

Modify `soportedesk-frontend/src/app/features/usuarios-red/usuarios-red-list.component.ts` in full:

```typescript
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
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
  private route = inject(ActivatedRoute);

  items: UsuarioRed[] = [];
  columns: TableColumn[] = [
    { key: 'usuario', label: 'Usuario' },
    { key: 'nombre', label: 'Nombre' },
    { key: 'apellidos', label: 'Apellidos' },
    { key: 'grupo', label: 'Grupo' },
    { key: 'unidadOrganizativa', label: 'Unidad Organizativa' },
    { key: 'ultimoLogin', label: 'Último Login' },
    { key: 'sede.nombre', label: 'Sede' },
    { key: 'dependencia.nombre', label: 'Dependencia' },
    { key: 'subdependencia.nombre', label: 'Subdependencia' },
    { key: 'tipoContrato.nombre', label: 'Tipo Contrato' },
    { key: 'numeroContrato', label: 'N° Contrato' },
    { key: 'fechaCreacion', label: 'Fecha Creación' },
    { key: 'fechaFinContrato', label: 'Fin Contrato' },
    { key: 'estado', label: 'Estado' },
  ];

  viewing: UsuarioRed | null = null;
  editing: UsuarioRed | null = null;
  formOpen = false;
  initialSearch = '';

  get canWrite(): boolean {
    return this.authService.canWrite('usuarios-red');
  }

  ngOnInit(): void {
    const search = this.route.snapshot.queryParamMap.get('search');
    if (search) {
      this.initialSearch = search;
      this.load(search);
    } else {
      this.load();
    }
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
    if (!confirm(`¿Eliminar el usuario "${item.usuario}"?`)) return;
    this.service.delete(item.id).subscribe(() => this.load());
  }

  onSaved(): void {
    this.formOpen = false;
    this.load();
  }
}
```

- [ ] **Step 9: Pass `initialSearch` to the table**

Modify `soportedesk-frontend/src/app/features/usuarios-red/usuarios-red-list.component.html` — change the `<app-generic-table>` opening tag:

```html
<app-generic-table
  [columns]="columns"
  [data]="items"
  [canEdit]="canWrite"
  [initialSearch]="initialSearch"
  extraColumnLabel="Vencimiento"
  (searchChange)="onSearch($event)"
  (add)="onAdd()"
  (view)="onView($event)"
  (edit)="onEdit($event)"
  (delete)="onDelete($event)"
>
```

- [ ] **Step 10: Run test to verify it passes**

Run: `ng test --watch=false --browsers=ChromeHeadless`
Expected: all specs pass, including the 2 new `UsuariosRedListComponent` tests.

- [ ] **Step 11: Commit**

```bash
git add soportedesk-frontend/src/app/shared/generic-table/generic-table.component.ts soportedesk-frontend/src/app/shared/generic-table/generic-table.component.html soportedesk-frontend/src/app/shared/generic-table/generic-table.component.spec.ts soportedesk-frontend/src/app/features/usuarios-red/usuarios-red-list.component.ts soportedesk-frontend/src/app/features/usuarios-red/usuarios-red-list.component.html soportedesk-frontend/src/app/features/usuarios-red/usuarios-red-list.component.spec.ts
git commit -m "feat: pre-filter usuarios de red list from dashboard query param"
```

---

### Task 5: Frontend — Gráfico por ubicación (Chart.js)

**Files:**
- Modify: `soportedesk-frontend/package.json` (via `npm install`)
- Modify: `soportedesk-frontend/src/app/app.config.ts`
- Create: `soportedesk-frontend/src/app/features/dashboard/ubicacion-usuarios-count.model.ts`
- Modify: `soportedesk-frontend/src/app/features/dashboard/dashboard.service.ts`
- Create: `soportedesk-frontend/src/app/features/dashboard/usuarios-red-por-ubicacion-chart.component.ts`
- Create: `soportedesk-frontend/src/app/features/dashboard/usuarios-red-por-ubicacion-chart.component.html`
- Create: `soportedesk-frontend/src/app/features/dashboard/usuarios-red-por-ubicacion-chart.component.scss`
- Create: `soportedesk-frontend/src/app/features/dashboard/usuarios-red-por-ubicacion-chart.component.spec.ts`
- Modify: `soportedesk-frontend/src/app/features/dashboard/dashboard.component.ts`
- Modify: `soportedesk-frontend/src/app/features/dashboard/dashboard.component.html`

**Interfaces:**
- Consumes: `GET /api/dashboard/usuarios-red-por-ubicacion?nivel=` (Task 2's endpoint, response shape `{ nombre: string, activos: number, inactivos: number }[]`).
- Produces: `UsuariosRedPorUbicacionChartComponent` (standalone, selector `app-usuarios-red-por-ubicacion-chart`), consumed only by `DashboardComponent` in this same task.

- [ ] **Step 1: Install the new dependencies**

Run (from `soportedesk-frontend/`): `npm install chart.js ng2-charts`
Expected: `package.json` and `package-lock.json` gain `chart.js` and `ng2-charts` entries; install completes without errors.

- [ ] **Step 2: Register the chart providers globally**

Modify `soportedesk-frontend/src/app/app.config.ts`:

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

import { routes } from './app.routes';
import { jwtInterceptor } from './core/auth/jwt.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([jwtInterceptor])),
    provideCharts(withDefaultRegisterables()),
  ],
};
```

- [ ] **Step 3: Add the frontend model**

Create `soportedesk-frontend/src/app/features/dashboard/ubicacion-usuarios-count.model.ts`:

```typescript
export interface UbicacionUsuariosCount {
  nombre: string;
  activos: number;
  inactivos: number;
}
```

- [ ] **Step 4: Add the service method**

Modify `soportedesk-frontend/src/app/features/dashboard/dashboard.service.ts`:

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DashboardCounts } from './dashboard-counts.model';
import { UbicacionUsuariosCount } from './ubicacion-usuarios-count.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/dashboard`;

  getCounts(): Observable<DashboardCounts> {
    return this.http.get<DashboardCounts>(`${this.apiUrl}/counts`);
  }

  getUsuariosRedPorUbicacion(nivel: 'sede' | 'dependencia'): Observable<UbicacionUsuariosCount[]> {
    return this.http.get<UbicacionUsuariosCount[]>(`${this.apiUrl}/usuarios-red-por-ubicacion`, {
      params: { nivel },
    });
  }
}
```

- [ ] **Step 5: Write the failing test for the chart component**

Create `soportedesk-frontend/src/app/features/dashboard/usuarios-red-por-ubicacion-chart.component.spec.ts`. This test deliberately constructs the component class via DI (`TestBed.runInInjectionContext`) instead of rendering its template, so it never touches the real `<canvas>`/Chart.js rendering path — it only exercises the HTTP + toggle logic:

```typescript
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UsuariosRedPorUbicacionChartComponent } from './usuarios-red-por-ubicacion-chart.component';

describe('UsuariosRedPorUbicacionChartComponent', () => {
  let httpMock: HttpTestingController;
  let component: UsuariosRedPorUbicacionChartComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    httpMock = TestBed.inject(HttpTestingController);
    component = TestBed.runInInjectionContext(() => new UsuariosRedPorUbicacionChartComponent());
  });

  afterEach(() => httpMock.verify());

  it('requests sede-level data on init', () => {
    component.ngOnInit();

    const req = httpMock.expectOne(
      (r) => r.url.endsWith('/usuarios-red-por-ubicacion') && r.params.get('nivel') === 'sede',
    );
    req.flush([{ nombre: 'Lima', activos: 10, inactivos: 2 }]);

    expect(component.chartData.labels).toEqual(['Lima']);
  });

  it('requests dependencia-level data when the toggle changes', () => {
    component.ngOnInit();
    httpMock.expectOne((r) => r.params.get('nivel') === 'sede').flush([]);

    component.setNivel('dependencia');

    const req = httpMock.expectOne((r) => r.params.get('nivel') === 'dependencia');
    req.flush([{ nombre: 'TI', activos: 8, inactivos: 0 }]);

    expect(component.chartData.labels).toEqual(['TI']);
  });

  it('flags an error when the request fails, without throwing', () => {
    component.ngOnInit();

    httpMock
      .expectOne((r) => r.params.get('nivel') === 'sede')
      .flush('error', { status: 500, statusText: 'Server Error' });

    expect(component.error).toBe(true);
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `ng test --watch=false --browsers=ChromeHeadless`
Expected: FAIL — cannot find module `./usuarios-red-por-ubicacion-chart.component`.

- [ ] **Step 7: Create the chart component**

Create `soportedesk-frontend/src/app/features/dashboard/usuarios-red-por-ubicacion-chart.component.ts`:

```typescript
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartConfiguration, ChartData } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { DashboardService } from './dashboard.service';
import { UbicacionUsuariosCount } from './ubicacion-usuarios-count.model';

type Nivel = 'sede' | 'dependencia';

@Component({
  selector: 'app-usuarios-red-por-ubicacion-chart',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './usuarios-red-por-ubicacion-chart.component.html',
  styleUrl: './usuarios-red-por-ubicacion-chart.component.scss',
})
export class UsuariosRedPorUbicacionChartComponent implements OnInit {
  private dashboardService = inject(DashboardService);

  nivel: Nivel = 'sede';
  error = false;

  chartData: ChartData<'bar', number[], string> = {
    labels: [],
    datasets: [
      { data: [], label: 'Activos', backgroundColor: '#16a34a' },
      { data: [], label: 'Inactivos', backgroundColor: '#ef4444' },
    ],
  };

  chartOptions: ChartConfiguration<'bar'>['options'] = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    scales: { x: { beginAtZero: true } },
  };

  ngOnInit(): void {
    this.load();
  }

  setNivel(nivel: Nivel): void {
    if (this.nivel === nivel) return;
    this.nivel = nivel;
    this.load();
  }

  private load(): void {
    this.error = false;
    this.dashboardService.getUsuariosRedPorUbicacion(this.nivel).subscribe({
      next: (rows) => this.applyData(rows),
      error: () => (this.error = true),
    });
  }

  private applyData(rows: UbicacionUsuariosCount[]): void {
    this.chartData = {
      labels: rows.map((r) => r.nombre),
      datasets: [
        { data: rows.map((r) => r.activos), label: 'Activos', backgroundColor: '#16a34a' },
        { data: rows.map((r) => r.inactivos), label: 'Inactivos', backgroundColor: '#ef4444' },
      ],
    };
  }
}
```

- [ ] **Step 8: Create the chart component template**

Create `soportedesk-frontend/src/app/features/dashboard/usuarios-red-por-ubicacion-chart.component.html`:

```html
<div class="chart-card">
  <div class="chart-header">
    <h3>Usuarios de Red por Ubicación</h3>
    <div class="toggle-group">
      <button [class.active]="nivel === 'sede'" (click)="setNivel('sede')">Por Sede</button>
      <button [class.active]="nivel === 'dependencia'" (click)="setNivel('dependencia')">Por Dependencia</button>
    </div>
  </div>

  <div class="chart-body" *ngIf="!error">
    <canvas baseChart [data]="chartData" [options]="chartOptions" type="bar"></canvas>
  </div>
  <p class="chart-error" *ngIf="error">No se pudo cargar el gráfico</p>
</div>
```

- [ ] **Step 9: Create the chart component styles**

Create `soportedesk-frontend/src/app/features/dashboard/usuarios-red-por-ubicacion-chart.component.scss`:

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

.toggle-group {
  display: flex;
  gap: 4px;
  background: var(--color-bg);
  border-radius: var(--radius-md);
  padding: 4px;

  button {
    border: none;
    background: transparent;
    padding: 6px 12px;
    border-radius: var(--radius-md);
    font-size: 12.5px;
    font-weight: 600;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: background var(--transition), color var(--transition);

    &.active {
      background: var(--color-surface);
      color: var(--color-accent);
      box-shadow: var(--shadow-sm);
    }
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

- [ ] **Step 10: Run test to verify it passes**

Run: `ng test --watch=false --browsers=ChromeHeadless`
Expected: all specs pass, including the 3 new `UsuariosRedPorUbicacionChartComponent` tests.

- [ ] **Step 11: Mount the chart in the dashboard**

Modify `soportedesk-frontend/src/app/features/dashboard/dashboard.component.ts` — add the import and register it in `imports`:

```typescript
import { UsuariosRedPorUbicacionChartComponent } from './usuarios-red-por-ubicacion-chart.component';
```

```typescript
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, UsuariosRedPorUbicacionChartComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
```

Modify `soportedesk-frontend/src/app/features/dashboard/dashboard.component.html` — add the chart below the cards grid, just before the closing `</div>` of `.dashboard`:

```html
  </div>

  <app-usuarios-red-por-ubicacion-chart />
</div>
```

(This replaces the file's last two lines — the `</div>` that closes `.cards-grid` followed by the `</div>` that closes `.dashboard` — with the three lines above.)

- [ ] **Step 12: Run the full frontend suite and build**

Run: `ng test --watch=false --browsers=ChromeHeadless`
Expected: all specs pass (including the existing `DashboardComponent` specs from Task 3 — they still pass since `provideRouter([])` in that spec doesn't need the new chart's HTTP call mocked, because `HttpClientTestingModule` only requires `httpMock.verify()` for *that test's own* requests; the chart component will fire its own `getUsuariosRedPorUbicacion` call when `DashboardComponent`'s `fixture.detectChanges()` renders it — flush it too).

If `DashboardComponent`'s spec from Task 3 now fails with "Expected no open requests" from `httpMock.verify()`, modify `soportedesk-frontend/src/app/features/dashboard/dashboard.component.spec.ts`'s `beforeEach` to also flush the chart's request, by adding this line right after the existing `httpMock.expectOne('/api/dashboard/counts').flush(counts);` / `fixture.detectChanges();` pair:

```typescript
    httpMock.expectOne((r) => r.url.endsWith('/usuarios-red-por-ubicacion')).flush([]);
```

Run: `ng build`
Expected: production build succeeds with no errors.

- [ ] **Step 13: Commit**

```bash
git add soportedesk-frontend/package.json soportedesk-frontend/package-lock.json soportedesk-frontend/src/app/app.config.ts soportedesk-frontend/src/app/features/dashboard/
git commit -m "feat: add usuarios de red por ubicacion chart to dashboard"
```
