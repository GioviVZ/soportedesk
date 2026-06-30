# Plan: Módulo Correos → fuente GestionTI_INIA

**Spec de referencia**: `docs/superpowers/specs/2026-06-30-correos-gestionti-design.md`

## Nota de implementación: datasource

En lugar de un segundo datasource Spring Boot completo (que requeriría excluir
`DataSourceAutoConfiguration`/`HibernateJpaAutoConfiguration` y dos clases de config explícitas),
se usa la convención SQL Server de tres partes vía `@Table(catalog = "GestionTI_INIA", schema = "dbo")`.
Hibernate genera `FROM GestionTI_INIA.dbo.vw_GW_Dashboard` en cada query, usando el
datasource `ssti` existente. El usuario `sa` ya tiene acceso a ambas bases en la misma instancia.
**Resultado idéntico** al segundo datasource en cuanto a datos en vivo; cero cambios a la configuración
de Spring Boot.

---

## Phase 0: Documentation Discovery (completado)

**Hallazgos clave:**

| Item | Valor |
|------|-------|
| `SoportedeskApplication.java` | `@EntityScan` + `@EnableJpaRepositories` explícitos por paquete |
| Paquetes en `@EntityScan` | auth, catalogo, usuariosred, equipos, vpn, correos, impresoras, auditoria, inventario, wifi, licencias |
| `ddl-auto` | `none` — sin validación de esquema, seguro eliminar entidades |
| Patrón `@Query` search | `LOWER(c.campo) LIKE LOWER(CONCAT('%', :search, '%'))` (ver `InventarioEquipoRepository`) |
| Patrón KPI cards frontend | `<article class="summary-card">` en inventario-equipos; `<a class="kpi-card">` en dashboard |
| `GenericTableComponent` inputs | `columns: TableColumn[]`, `data: T[]`, `canEdit: boolean`; sin `canEdit` → sin botones |
| `@EnableJpaRepositories` refs | `entityManagerFactoryRef = "entityManagerFactory"`, `transactionManagerRef = "transactionManager"` |
| Patrón servicio frontend | `inject(HttpClient)`, `HttpParams` para filtros, `Observable<T[]>` |

**Patrón de búsqueda multi-campo a copiar:**
```java
// InventarioEquipoRepository.java — copiar estructura de este @Query
@Query("""
    SELECT e FROM InventarioEquipo e
    WHERE :search IS NULL OR :search = ''
       OR LOWER(e.hostname) LIKE LOWER(CONCAT('%', :search, '%'))
       ...
    ORDER BY e.ultimoReporte DESC
""")
List<InventarioEquipo> search(String search);
```

**Patrón KPI cards a copiar (inventario-equipos):**
```html
<section class="summary-grid">
  <article class="summary-card">
    <span>Label</span>
    <strong>{{ valor }}</strong>
    <small>descripción</small>
  </article>
  <article class="summary-card success"> ... </article>
  <article class="summary-card warning"> ... </article>
</section>
```

---

## Phase 1: Backend — Entidad, Repositorio y DTOs

**Objetivo:** Registrar la entidad `VwGwDashboard` en el datasource principal vía
`@Table(catalog = "GestionTI_INIA")` y exponerla mediante repositorio + DTOs.

### Tarea 1.1 — Agregar `gestiontiinia` a `@EntityScan` en `SoportedeskApplication.java`

Archivo: `soportedesk-backend/src/main/java/com/inia/soportedesk/SoportedeskApplication.java`

Agregar `"com.inia.soportedesk.gestiontiinia"` a AMBAS anotaciones:

```java
@EntityScan(basePackages = {
    "com.inia.soportedesk.auth",
    "com.inia.soportedesk.catalogo",
    "com.inia.soportedesk.usuariosred",
    "com.inia.soportedesk.equipos",
    "com.inia.soportedesk.vpn",
    "com.inia.soportedesk.correos",
    "com.inia.soportedesk.impresoras",
    "com.inia.soportedesk.auditoria",
    "com.inia.soportedesk.inventario",
    "com.inia.soportedesk.wifi",
    "com.inia.soportedesk.licencias",
    "com.inia.soportedesk.gestiontiinia"   // ← NUEVO
})
@EnableJpaRepositories(basePackages = {
    "com.inia.soportedesk.auth",
    "com.inia.soportedesk.catalogo",
    "com.inia.soportedesk.usuariosred",
    "com.inia.soportedesk.equipos",
    "com.inia.soportedesk.vpn",
    "com.inia.soportedesk.correos",
    "com.inia.soportedesk.impresoras",
    "com.inia.soportedesk.auditoria",
    "com.inia.soportedesk.inventario",
    "com.inia.soportedesk.wifi",
    "com.inia.soportedesk.licencias",
    "com.inia.soportedesk.gestiontiinia"   // ← NUEVO
}, entityManagerFactoryRef = "entityManagerFactory", transactionManagerRef = "transactionManager")
```

### Tarea 1.2 — Crear `VwGwDashboard.java`

Archivo nuevo: `src/main/java/com/inia/soportedesk/gestiontiinia/VwGwDashboard.java`

```java
package com.inia.soportedesk.gestiontiinia;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Immutable;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Immutable
@Table(name = "vw_GW_Dashboard", catalog = "GestionTI_INIA", schema = "dbo")
@Getter
@NoArgsConstructor
public class VwGwDashboard {

    @Id
    @Column(name = "Email")
    private String email;

    @Column(name = "LicenciasTotales")
    private int licenciasTotales;

    @Column(name = "LicenciasAsignadas")
    private Integer licenciasAsignadas;

    @Column(name = "LicenciasDisponibles")
    private Integer licenciasDisponibles;

    @Column(name = "Unidad")
    private String unidad;

    @Column(name = "SedeID")
    private int sedeId;

    @Column(name = "Sede")
    private String sede;

    @Column(name = "OficinaPadre")
    private String oficinaPadre;

    @Column(name = "Oficina")
    private String oficina;

    @Column(name = "Estado")
    private String estado;

    @Column(name = "Modalidad")
    private String modalidad;

    @Column(name = "EmployeeID")
    private String employeeId;

    @Column(name = "OUID")
    private int ouid;

    @Column(name = "OrgUnitPath")
    private String orgUnitPath;

    @Column(name = "NombreCompleto")
    private String nombreCompleto;

    @Column(name = "Verificacion2Pasos")
    private String verificacion2Pasos;

    @Column(name = "UltimoInicioSesion")
    private LocalDateTime ultimoInicioSesion;

    @Column(name = "EmailUsageMB")
    private BigDecimal emailUsageMB;

    @Column(name = "DriveUsageMB")
    private BigDecimal driveUsageMB;

    @Column(name = "PhotosUsageMB")
    private BigDecimal photosUsageMB;

    @Column(name = "StorageUsedMB")
    private BigDecimal storageUsedMB;

    @Column(name = "TotalUsoMB")
    private BigDecimal totalUsoMB;

    @Column(name = "Categoria")
    private String categoria;

    @Column(name = "TotalUsuariosCategoria")
    private Integer totalUsuariosCategoria;
}
```

### Tarea 1.3 — Crear `VwGwDashboardRepository.java`

Archivo nuevo: `src/main/java/com/inia/soportedesk/gestiontiinia/VwGwDashboardRepository.java`

```java
package com.inia.soportedesk.gestiontiinia;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VwGwDashboardRepository extends JpaRepository<VwGwDashboard, String> {

    @Query("""
        SELECT v FROM VwGwDashboard v
        WHERE (:search IS NULL OR :search = ''
               OR LOWER(v.email) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(v.nombreCompleto) LIKE LOWER(CONCAT('%', :search, '%')))
          AND (:sede IS NULL OR :sede = '' OR v.sede = :sede)
          AND (:estado IS NULL OR :estado = '' OR v.estado = :estado)
          AND (:modalidad IS NULL OR :modalidad = '' OR v.modalidad = :modalidad)
        ORDER BY v.sede ASC, v.nombreCompleto ASC
    """)
    List<VwGwDashboard> findFiltered(
        @Param("search") String search,
        @Param("sede") String sede,
        @Param("estado") String estado,
        @Param("modalidad") String modalidad
    );

    @Query("SELECT DISTINCT v.sede FROM VwGwDashboard v ORDER BY v.sede ASC")
    List<String> findDistinctSedes();

    @Query("""
        SELECT v FROM VwGwDashboard v
        WHERE v.categoria = :categoria
        ORDER BY v.nombreCompleto ASC
    """)
    List<VwGwDashboard> findByCategoria(@Param("categoria") String categoria);
}
```

### Tarea 1.4 — Crear `CorreoKpisDto.java`

Archivo nuevo: `src/main/java/com/inia/soportedesk/correos/CorreoKpisDto.java`

```java
package com.inia.soportedesk.correos;

public record CorreoKpisDto(
    int licenciasTotales,
    int licenciasAsignadas,
    int licenciasDisponibles,
    long activasCount,
    long suspendidasCount,
    int sedeCentralCount,
    int eeasCount
) {}
```

### Verificación Phase 1

```bash
cd soportedesk-backend
./mvnw compile -q
```

Debe compilar sin errores. No se puede verificar query en tiempo de compilación (la tabla existe en runtime).

**Anti-patterns a evitar:**
- NO usar `@GeneratedValue` en `VwGwDashboard` (es una vista, sin secuencia)
- NO usar `FetchType.LAZY` en ningún campo (sin relaciones FK)
- NO agregar `@Column(nullable = false)` en campos que son nullable en el view (ver spec)

---

## Phase 2: Backend — Reescribir Service y Controller

**Objetivo:** Reemplazar el CRUD de correos por los 3 endpoints de solo lectura.

### Tarea 2.1 — Eliminar archivos obsoletos

Eliminar los siguientes archivos:
- `src/main/java/com/inia/soportedesk/correos/Correo.java`
- `src/main/java/com/inia/soportedesk/correos/CorreoRepository.java`
- `src/main/java/com/inia/soportedesk/correos/CorreoRequest.java`

> La tabla `correos` en `ssti` se deja intacta (se borrará en iteración posterior). Con
> `ddl-auto: none` Spring Boot no valida ni borra tablas al iniciar.

### Tarea 2.2 — Reescribir `CorreoService.java`

Archivo: `src/main/java/com/inia/soportedesk/correos/CorreoService.java`

```java
package com.inia.soportedesk.correos;

import com.inia.soportedesk.gestiontiinia.VwGwDashboard;
import com.inia.soportedesk.gestiontiinia.VwGwDashboardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CorreoService {

    private final VwGwDashboardRepository repository;

    @Transactional(readOnly = true)
    public List<VwGwDashboard> findAll(String search, String sede, String estado, String modalidad) {
        return repository.findFiltered(
            (search   != null && !search.isBlank())   ? search   : null,
            (sede     != null && !sede.isBlank())     ? sede     : null,
            (estado   != null && !estado.isBlank())   ? estado   : null,
            (modalidad != null && !modalidad.isBlank()) ? modalidad : null
        );
    }

    @Transactional(readOnly = true)
    public CorreoKpisDto getKpis() {
        List<VwGwDashboard> all = repository.findAll();
        if (all.isEmpty()) return new CorreoKpisDto(0, 0, 0, 0, 0, 0, 0);

        VwGwDashboard first = all.get(0);
        int licenciasTotales   = first.getLicenciasTotales();
        int licenciasAsignadas = first.getLicenciasAsignadas() != null ? first.getLicenciasAsignadas() : 0;
        int licenciasDisponibles = first.getLicenciasDisponibles() != null ? first.getLicenciasDisponibles() : 0;

        long activas     = all.stream().filter(v -> "Activo".equals(v.getEstado())).count();
        long suspendidas = all.stream().filter(v -> "Suspendido".equals(v.getEstado())).count();

        int sedeCentral = all.stream()
            .filter(v -> "Sede Central".equals(v.getCategoria()) && v.getTotalUsuariosCategoria() != null)
            .mapToInt(v -> v.getTotalUsuariosCategoria())
            .findFirst().orElse(0);

        int eeas = all.stream()
            .filter(v -> "EEAs".equals(v.getCategoria()) && v.getTotalUsuariosCategoria() != null)
            .mapToInt(v -> v.getTotalUsuariosCategoria())
            .findFirst().orElse(0);

        return new CorreoKpisDto(licenciasTotales, licenciasAsignadas, licenciasDisponibles,
                activas, suspendidas, sedeCentral, eeas);
    }

    @Transactional(readOnly = true)
    public List<String> getSedes() {
        return repository.findDistinctSedes();
    }
}
```

### Tarea 2.3 — Reescribir `CorreoController.java`

Archivo: `src/main/java/com/inia/soportedesk/correos/CorreoController.java`

```java
package com.inia.soportedesk.correos;

import com.inia.soportedesk.gestiontiinia.VwGwDashboard;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/correos")
@RequiredArgsConstructor
public class CorreoController {

    private final CorreoService service;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_correos')")
    public List<VwGwDashboard> findAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String sede,
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) String modalidad) {
        return service.findAll(search, sede, estado, modalidad);
    }

    @GetMapping("/kpis")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_correos')")
    public CorreoKpisDto kpis() {
        return service.getKpis();
    }

    @GetMapping("/sedes")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_correos')")
    public List<String> sedes() {
        return service.getSedes();
    }
}
```

### Verificación Phase 2

```bash
./mvnw verify -q
```

Buscar en la salida:
- `BUILD SUCCESS`
- Sin errores `ClassNotFoundException` o `NoSuchBeanDefinitionException`
- Sin errores `Table 'ssti.vw_GW_Dashboard' doesn't exist` (la tabla es en GestionTI_INIA, no ssti)

Probar manualmente (con el backend corriendo):
```bash
curl -s http://localhost:8080/api/correos/kpis -H "Authorization: Bearer <token>" | python -m json.tool
curl -s "http://localhost:8080/api/correos?estado=Activo" -H "Authorization: Bearer <token>" | python -m json.tool
curl -s http://localhost:8080/api/correos/sedes -H "Authorization: Bearer <token>"
```

Esperar:
- `/kpis` → JSON con `licenciasTotales: 1200`, `activasCount: 1069`, `suspendidasCount: 131`
- `/correos?estado=Activo` → array con 1069 elementos
- `/correos/sedes` → lista de strings con nombres de sedes

**Anti-patterns a evitar:**
- NO agregar POST/PUT/DELETE al controller
- NO usar `repository.count()` para `activasCount` (no hay método; usar `findAll()` + stream)
- NO eliminar la tabla `correos` de ssti en esta fase

---

## Phase 3: Frontend — Modelo y Servicio

**Objetivo:** Reemplazar el model y service de correos con los tipos y llamadas de la nueva fuente.

### Tarea 3.1 — Reescribir `correo.model.ts`

Archivo: `soportedesk-frontend/src/app/features/correos/correo.model.ts`

```typescript
export interface Correo {
  email: string;
  nombreCompleto: string | null;
  sede: string;
  oficinaPadre: string;
  oficina: string;
  modalidad: string;
  estado: string;
  verificacion2Pasos: string;
  ultimoInicioSesion: string | null;
  emailUsageMB: number | null;
  driveUsageMB: number | null;
  storageUsedMB: number | null;
  totalUsoMB: number | null;
  employeeId: string | null;
}

export interface CorreoKpis {
  licenciasTotales: number;
  licenciasAsignadas: number;
  licenciasDisponibles: number;
  activasCount: number;
  suspendidasCount: number;
  sedeCentralCount: number;
  eeasCount: number;
}

export interface CorreoFiltros {
  search?: string;
  sede?: string;
  estado?: string;
  modalidad?: string;
}
```

### Tarea 3.2 — Reescribir `correo.service.ts`

Archivo: `soportedesk-frontend/src/app/features/correos/correo.service.ts`

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Correo, CorreoFiltros, CorreoKpis } from './correo.model';

@Injectable({ providedIn: 'root' })
export class CorreoService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/correos`;

  getAll(filtros: CorreoFiltros = {}): Observable<Correo[]> {
    let params = new HttpParams();
    if (filtros.search)    params = params.set('search',    filtros.search);
    if (filtros.sede)      params = params.set('sede',      filtros.sede);
    if (filtros.estado)    params = params.set('estado',    filtros.estado);
    if (filtros.modalidad) params = params.set('modalidad', filtros.modalidad);
    return this.http.get<Correo[]>(this.apiUrl, { params });
  }

  getKpis(): Observable<CorreoKpis> {
    return this.http.get<CorreoKpis>(`${this.apiUrl}/kpis`);
  }

  getSedes(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/sedes`);
  }
}
```

### Verificación Phase 3

```bash
cd soportedesk-frontend
npx tsc --noEmit
```

No debe haber errores TypeScript. Si algo en el componente viejo sigue importando `CorreoRequest` o
las propiedades antiguas (`usuario`, `nombre`, `apellidos`) fallará aquí — es la señal para pasar
a Phase 4.

---

## Phase 4: Frontend — Reescritura del Componente Lista

**Objetivo:** Eliminar el form y reescribir el componente con KPI cards, filtros y tabla de solo lectura.

### Tarea 4.1 — Eliminar archivos de formulario

Eliminar:
- `soportedesk-frontend/src/app/features/correos/correo-form.component.ts`
- `soportedesk-frontend/src/app/features/correos/correo-form.component.html`

### Tarea 4.2 — Reescribir `correos-list.component.ts`

Archivo: `soportedesk-frontend/src/app/features/correos/correos-list.component.ts`

```typescript
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GenericTableComponent, TableColumn } from '../../shared/generic-table/generic-table.component';
import { Correo, CorreoFiltros, CorreoKpis } from './correo.model';
import { CorreoService } from './correo.service';

@Component({
  selector: 'app-correos-list',
  standalone: true,
  imports: [CommonModule, FormsModule, GenericTableComponent],
  templateUrl: './correos-list.component.html',
  styleUrl: './correos-list.component.scss',
})
export class CorreosListComponent implements OnInit {
  private service = inject(CorreoService);

  items: Correo[] = [];
  kpis: CorreoKpis | null = null;
  sedes: string[] = [];

  filtros: CorreoFiltros = {};
  searchTerm = '';
  selectedSede = '';
  selectedEstado = '';
  selectedModalidad = '';

  readonly estadoOpciones = ['Activo', 'Suspendido'];
  readonly modalidadOpciones = ['CAP', 'CAS', 'EXTERNO', 'GENERICO', 'PRACTICANTE'];

  columns: TableColumn[] = [
    { key: 'email',             label: 'Email' },
    { key: 'nombreCompleto',    label: 'Nombre Completo' },
    { key: 'sede',              label: 'Sede' },
    { key: 'oficinaPadre',      label: 'Dependencia' },
    { key: 'oficina',           label: 'Subdependencia' },
    { key: 'modalidad',         label: 'Modalidad' },
    { key: 'estado',            label: 'Estado' },
    { key: 'verificacion2Pasos', label: '2FA' },
    { key: 'ultimoInicioSesion', label: 'Último Acceso' },
  ];

  ngOnInit(): void {
    this.service.getKpis().subscribe(k => this.kpis = k);
    this.service.getSedes().subscribe(s => this.sedes = s);
    this.load();
  }

  load(): void {
    this.service.getAll({
      search:    this.searchTerm    || undefined,
      sede:      this.selectedSede  || undefined,
      estado:    this.selectedEstado || undefined,
      modalidad: this.selectedModalidad || undefined,
    }).subscribe(data => this.items = data);
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    this.load();
  }

  onFiltroChange(): void {
    this.load();
  }

  clearFiltros(): void {
    this.selectedSede = '';
    this.selectedEstado = '';
    this.selectedModalidad = '';
    this.searchTerm = '';
    this.load();
  }
}
```

### Tarea 4.3 — Reescribir `correos-list.component.html`

Archivo: `soportedesk-frontend/src/app/features/correos/correos-list.component.html`

```html
<div class="correos-page">

  <!-- KPI Cards -->
  <section class="summary-grid" *ngIf="kpis">
    <article class="summary-card">
      <span>Licencias Totales</span>
      <strong>{{ kpis.licenciasTotales }}</strong>
      <small>Google Workspace</small>
    </article>
    <article class="summary-card success">
      <span>Activas</span>
      <strong>{{ kpis.activasCount }}</strong>
      <small>cuentas activas</small>
    </article>
    <article class="summary-card warning">
      <span>Suspendidas</span>
      <strong>{{ kpis.suspendidasCount }}</strong>
      <small>cuentas suspendidas</small>
    </article>
    <article class="summary-card">
      <span>Disponibles</span>
      <strong>{{ kpis.licenciasDisponibles }}</strong>
      <small>licencias sin asignar</small>
    </article>
    <article class="summary-card info">
      <span>Sede Central</span>
      <strong>{{ kpis.sedeCentralCount }}</strong>
      <small>usuarios</small>
    </article>
    <article class="summary-card info">
      <span>EEAs</span>
      <strong>{{ kpis.eeasCount }}</strong>
      <small>usuarios</small>
    </article>
  </section>

  <!-- Filtros -->
  <div class="filtros-bar">
    <select [(ngModel)]="selectedSede" (ngModelChange)="onFiltroChange()">
      <option value="">Todas las sedes</option>
      <option *ngFor="let s of sedes" [value]="s">{{ s }}</option>
    </select>

    <select [(ngModel)]="selectedEstado" (ngModelChange)="onFiltroChange()">
      <option value="">Todos los estados</option>
      <option *ngFor="let e of estadoOpciones" [value]="e">{{ e }}</option>
    </select>

    <select [(ngModel)]="selectedModalidad" (ngModelChange)="onFiltroChange()">
      <option value="">Todas las modalidades</option>
      <option *ngFor="let m of modalidadOpciones" [value]="m">{{ m }}</option>
    </select>

    <button class="secondary" (click)="clearFiltros()">Limpiar</button>
  </div>

  <!-- Tabla -->
  <app-generic-table
    [columns]="columns"
    [data]="items"
    [canEdit]="false"
    (searchChange)="onSearch($event)"
  />

</div>
```

### Tarea 4.4 — Reescribir `correos-list.component.scss`

Copiar el bloque `.summary-grid` / `.summary-card` del archivo
`inventario-equipos.component.scss` (ya tiene los estilos de cards). Agregar:

```scss
.correos-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.5rem;
}

.filtros-bar {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  align-items: center;

  select {
    padding: 0.45rem 0.75rem;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: var(--surface);
    color: var(--text);
    font-size: 0.875rem;
    min-width: 160px;
  }

  button.secondary {
    padding: 0.45rem 1rem;
    background: transparent;
    border: 1px solid var(--border);
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.875rem;
    color: var(--text-muted);

    &:hover { background: var(--surface-hover); }
  }
}
```

### Verificación Phase 4

```bash
cd soportedesk-frontend
npx ng build --configuration development 2>&1 | tail -20
```

Debe terminar con `✔ Browser application bundle generation complete.` sin errores `TS` ni
`error NG`.

Si hay errores `NullInjectorError: CorreoFormComponent`, verificar que se eliminó de todos
los `imports: []` en el componente.

---

## Phase 5: Verificación Final

### Backend

```bash
cd soportedesk-backend
./mvnw verify -q
```

`BUILD SUCCESS` — todos los tests pasan.

Si falla `ModulosTest` por cambio en permisos: los permisos de correos no cambian en esta
iteración (el permiso `correos` sigue existiendo, solo se elimina el uso de `WRITE_correos`).

### Frontend

```bash
cd soportedesk-frontend
npx ng build --configuration production 2>&1 | tail -5
```

### Test en browser

1. Arrancar backend: `./mvnw spring-boot:run`
2. Arrancar frontend: `npx ng serve`
3. Navegar a `http://localhost:4200/correos`
4. Verificar:
   - [ ] 6 cards KPI visibles con valores numéricos reales
   - [ ] Dropdown Sede cargado dinámicamente (≥20 opciones)
   - [ ] Dropdown Estado: Activo/Suspendido
   - [ ] Dropdown Modalidad: CAP/CAS/EXTERNO/GENERICO/PRACTICANTE
   - [ ] Tabla muestra columnas: Email, Nombre Completo, Sede, Dependencia, Subdependencia, Modalidad, Estado, 2FA, Último Acceso
   - [ ] Filtrar por Estado=Suspendido → tabla muestra 131 filas
   - [ ] Buscador por texto libre filtra sobre email/nombre
   - [ ] Botón "Limpiar" resetea todos los filtros
   - [ ] NO existen botones Agregar/Editar/Eliminar
   - [ ] Card "Activas" muestra 1069, "Suspendidas" muestra 131

### Checklist anti-regresión

```bash
# Verificar que ningún endpoint de escritura quedó expuesto
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8080/api/correos \
  -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{}'
# Debe retornar 405 (Method Not Allowed)
```
