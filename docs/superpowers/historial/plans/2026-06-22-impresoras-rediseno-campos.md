# Rediseño de campos del módulo Impresora — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Impresora module's consumable/connection fields with the approved field set (Tipo de Impresora catalog, Serie, Código de Inventario, Código Patrimonial, Conexión USB/IP, 4-entry tóner list) across backend and frontend, per `docs/superpowers/specs/2026-06-22-impresoras-rediseno-campos-design.md`.

**Architecture:** Mirror the existing `TipoBien` catalog pattern to add a new `TipoImpresora` catalog (entity/request/repository/service/controller + frontend tab in `catalogos.component`). Then update the `Impresora` entity/DTO/service/repository to add the new fields and remove `modeloCartucho`/`modeloDrum`/`modeloFusor`, enforcing the rule that `ip` is only ever populated when `tipoConexion = "IP"`. Finally update the Angular form/list/ficha/resumen components to match, including a `valueChanges` subscription that clears `ip` when the user switches back to `USB`.

**Tech Stack:** Spring Boot 3.2.5, Java 17, Lombok, Spring Data JPA, SQL Server (prod) / H2 (tests), Angular 17+ standalone components, Jasmine/Karma.

## Global Constraints

- **H2/schema.sql known failure:** `mvn -q test -Dtest=UsuarioRepositoryTest` (and any other `@DataJpaTest`/`@SpringBootTest`) fails today with `ScriptStatementFailedException` → `org.h2.jdbc.JdbcSQLSyntaxErrorException: Error de Sintaxis en sentencia SQL` because H2 cannot parse the T-SQL `IF NOT EXISTS (SELECT name FROM sys.databases...) CREATE DATABASE ssti COLLATE...` block at the top of `schema.sql`, which Spring Boot's `SqlInitializationAutoConfiguration` always executes regardless of `ddl-auto`. This is a **pre-existing bug, out of scope**. When a task in this plan runs a `@DataJpaTest`/`*IT` test, confirm the failure matches this exact signature and move on — **never attempt to fix it**. Only plain Mockito `*ServiceTest` classes are unaffected by this bug.
- **SQL migration files are never executed by an agent.** Any `.sql` file this plan creates under `soportedesk-backend/src/main/resources/` is a manual-run artifact for a human DBA against the production SQL Server instance — write it, do not run it.
- **Out of scope:** the Ficha's "Driver" tab (`driverNombre`, `driverVersion`, `driverSo`, `driverArchivoPath`, file upload/download) is untouched by this plan — do not modify `ImpresoraDriverControllerIT.java` or the Driver tab markup.
- Maven test execution: `*Test` classes run via Surefire (`mvn test -Dtest=ClassName`); `*IT` classes run via Failsafe (`mvn verify -Dit.test=ClassName -Dsurefire.failIfNoSpecifiedTests=false -Dtest=NONE -q`).
- Backend package for the Impresora module is `com.inia.soportedesk.impresoras` (plural). The catalog package is `com.inia.soportedesk.catalogo`.

---

## Task 1: Catálogo TipoImpresora (backend + frontend)

**Files:**
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/TipoImpresora.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/TipoImpresoraRequest.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/TipoImpresoraRepository.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/TipoImpresoraService.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/TipoImpresoraController.java`
- Create: `soportedesk-backend/src/test/java/com/inia/soportedesk/catalogo/TipoImpresoraServiceTest.java`
- Modify: `soportedesk-backend/src/main/resources/schema.sql` (insert `tipos_impresora` table before the `-- IMPRESORAS` block)
- Modify: `soportedesk-frontend/src/app/core/models/catalogo.model.ts`
- Modify: `soportedesk-frontend/src/app/core/catalogos/catalogo.service.ts`
- Modify: `soportedesk-frontend/src/app/features/catalogos/catalogos.component.ts`
- Modify: `soportedesk-frontend/src/app/features/catalogos/catalogos.component.html`
- Modify: `soportedesk-frontend/src/app/features/catalogos/catalogos.component.spec.ts`

**Interfaces:**
- Produces (consumed by Task 2): `com.inia.soportedesk.catalogo.TipoImpresora` (fields: `Long id`, `String nombre`), `com.inia.soportedesk.catalogo.TipoImpresoraRepository extends JpaRepository<TipoImpresora, Long>` with `findById(Long): Optional<TipoImpresora>` (inherited).
- Produces (consumed by Task 3): frontend `TipoImpresora { id: number; nombre: string; }` interface in `catalogo.model.ts`, and `CatalogoService.getTiposImpresora(): Observable<TipoImpresora[]>` hitting `GET ${apiUrl}/tipos-impresora`.

### Backend

- [ ] **Step 1: Write the failing test**

Create `soportedesk-backend/src/test/java/com/inia/soportedesk/catalogo/TipoImpresoraServiceTest.java`:

```java
package com.inia.soportedesk.catalogo;

import com.inia.soportedesk.exception.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TipoImpresoraServiceTest {

    @Mock
    private TipoImpresoraRepository repository;

    @InjectMocks
    private TipoImpresoraService service;

    private TipoImpresora sample() {
        TipoImpresora tipo = new TipoImpresora();
        tipo.setId(1L);
        tipo.setNombre("Láser");
        return tipo;
    }

    @Test
    void findAll_withoutSearch_returnsAll() {
        when(repository.findAll()).thenReturn(List.of(sample()));

        List<TipoImpresora> result = service.findAll(null);

        assertThat(result).hasSize(1);
        verify(repository).findAll();
    }

    @Test
    void findById_whenNotFound_throwsResourceNotFoundException() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.findById(99L))
            .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void create_savesTipoImpresoraFromRequest() {
        TipoImpresoraRequest request = new TipoImpresoraRequest();
        request.setNombre("Láser");
        when(repository.save(any(TipoImpresora.class))).thenAnswer(inv -> inv.getArgument(0));

        TipoImpresora result = service.create(request);

        assertThat(result.getNombre()).isEqualTo("Láser");
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd soportedesk-backend && mvn -q test -Dtest=TipoImpresoraServiceTest`
Expected: FAIL — compile error, `TipoImpresoraService`/`TipoImpresora`/`TipoImpresoraRequest`/`TipoImpresoraRepository` do not exist.

- [ ] **Step 3: Write minimal implementation**

Create `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/TipoImpresora.java`:

```java
package com.inia.soportedesk.catalogo;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "tipos_impresora")
@Getter
@Setter
public class TipoImpresora {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nombre;
}
```

Create `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/TipoImpresoraRequest.java`:

```java
package com.inia.soportedesk.catalogo;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TipoImpresoraRequest {

    @NotBlank
    @Size(max = 100)
    private String nombre;
}
```

Create `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/TipoImpresoraRepository.java`:

```java
package com.inia.soportedesk.catalogo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TipoImpresoraRepository extends JpaRepository<TipoImpresora, Long> {

    @Query("SELECT t FROM TipoImpresora t WHERE LOWER(t.nombre) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<TipoImpresora> search(@Param("search") String search);
}
```

Create `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/TipoImpresoraService.java`:

```java
package com.inia.soportedesk.catalogo;

import com.inia.soportedesk.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TipoImpresoraService {

    private final TipoImpresoraRepository repository;

    public List<TipoImpresora> findAll(String search) {
        if (search == null || search.isBlank()) {
            return repository.findAll();
        }
        return repository.search(search);
    }

    public TipoImpresora findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tipo de impresora no encontrado: " + id));
    }

    public TipoImpresora create(TipoImpresoraRequest request) {
        TipoImpresora tipo = new TipoImpresora();
        tipo.setNombre(request.getNombre());
        return repository.save(tipo);
    }

    public TipoImpresora update(Long id, TipoImpresoraRequest request) {
        TipoImpresora tipo = findById(id);
        tipo.setNombre(request.getNombre());
        return repository.save(tipo);
    }

    public void delete(Long id) {
        repository.delete(findById(id));
    }
}
```

Create `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/TipoImpresoraController.java`:

```java
package com.inia.soportedesk.catalogo;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/catalogos/tipos-impresora")
@RequiredArgsConstructor
public class TipoImpresoraController {

    private final TipoImpresoraService service;

    @GetMapping
    public List<TipoImpresora> findAll(@RequestParam(required = false) String search) {
        return service.findAll(search);
    }

    @GetMapping("/{id}")
    public TipoImpresora findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TipoImpresora> create(@Valid @RequestBody TipoImpresoraRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public TipoImpresora update(@PathVariable Long id, @Valid @RequestBody TipoImpresoraRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
```

In `soportedesk-backend/src/main/resources/schema.sql`, insert this block immediately before the `-- IMPRESORAS` comment header:

```sql
IF OBJECT_ID(N'dbo.tipos_impresora', N'U') IS NULL
CREATE TABLE dbo.tipos_impresora (
    id     BIGINT        NOT NULL IDENTITY(1,1),
    nombre NVARCHAR(100) NOT NULL,
    CONSTRAINT PK_tipos_impresora PRIMARY KEY (id),
    CONSTRAINT UQ_tipos_impresora_nombre UNIQUE (nombre)
);
GO
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd soportedesk-backend && mvn -q test -Dtest=TipoImpresoraServiceTest`
Expected: `BUILD SUCCESS`, 3 tests run, 0 failures.

- [ ] **Step 5: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/TipoImpresora.java soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/TipoImpresoraRequest.java soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/TipoImpresoraRepository.java soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/TipoImpresoraService.java soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/TipoImpresoraController.java soportedesk-backend/src/test/java/com/inia/soportedesk/catalogo/TipoImpresoraServiceTest.java soportedesk-backend/src/main/resources/schema.sql
git commit -m "feat: add TipoImpresora catalog (backend)"
```

### Frontend

**Note on existing patterns:** `CatalogosComponent` does **not** use reactive forms — it uses plain component properties (`nombreForm: string`, `parentIdForm: number | null`, `editingId: number | null`) bound via `FormsModule`'s `[(ngModel)]`. Tab switching is `setTab(tab: CatalogoTab)`, editing starts via `startEdit(id, nombre, parentId?)`, and `deleteItem(tab: CatalogoTab, id: number)` takes **both** the tab and the id (it does not read `activeTab` implicitly). The steps below follow these exact existing patterns.

- [ ] **Step 6: Write the failing test**

In `soportedesk-frontend/src/app/features/catalogos/catalogos.component.spec.ts`, extend the `flushLoadAll` helper to flush a 7th request, and add a new test immediately after the "should create a sede and reload" test:

```typescript
function flushLoadAll(sedesData: unknown[] = []): void {
  httpMock.expectOne((req) => req.url.includes('/catalogos/sedes')).flush(sedesData);
  httpMock.expectOne((req) => req.url.includes('/catalogos/dependencias')).flush([]);
  httpMock.expectOne((req) => req.url.includes('/catalogos/subdependencias')).flush([]);
  httpMock.expectOne((req) => req.url.includes('/catalogos/tipos-contrato')).flush([]);
  httpMock.expectOne((req) => req.url.includes('/catalogos/tipos-licencia')).flush([]);
  httpMock.expectOne((req) => req.url.includes('/catalogos/tipos-bien')).flush([]);
  httpMock.expectOne((req) => req.url.includes('/catalogos/tipos-impresora')).flush([]);
}
```

```typescript
it('should create a tipo de impresora and reload', () => {
  component.activeTab = 'tiposImpresora';
  component.nombreForm = 'Láser';
  component.submitSimple();

  const postReq = httpMock.expectOne((req) =>
    req.method === 'POST' && req.url.includes('/catalogos/tipos-impresora'),
  );
  postReq.flush({ id: 1, nombre: 'Láser' });

  flushLoadAll();

  expect(component.tiposImpresora.length).toBe(1);
});
```

- [ ] **Step 7: Run test to verify it fails**

Run: `cd soportedesk-frontend && ng test --watch=false --include='**/catalogos.component.spec.ts'`
Expected: FAIL — the `beforeEach`'s call to `flushLoadAll()` now expects a 7th request (`/catalogos/tipos-impresora`) that the component never makes, so every existing test in the file times out/fails on unmatched expectations; the new test also fails to compile because `CatalogoTab` doesn't include `'tiposImpresora'` yet and `component.tiposImpresora` doesn't exist.

- [ ] **Step 8: Write minimal implementation**

In `soportedesk-frontend/src/app/core/models/catalogo.model.ts`, add the `TipoImpresora` interface after `TipoBien` and before `CatalogoRequest`:

```typescript
export interface TipoImpresora {
  id: number;
  nombre: string;
}
```

In `soportedesk-frontend/src/app/core/catalogos/catalogo.service.ts`, add the `TipoImpresora` import alongside the other catalog model imports, and add these methods alongside the existing `TipoBien` methods (after `deleteTipoBien`):

```typescript
getTiposImpresora(): Observable<TipoImpresora[]> {
  return this.http.get<TipoImpresora[]>(`${this.apiUrl}/tipos-impresora`);
}

createTipoImpresora(request: CatalogoRequest): Observable<TipoImpresora> {
  return this.http.post<TipoImpresora>(`${this.apiUrl}/tipos-impresora`, request);
}

updateTipoImpresora(id: number, request: CatalogoRequest): Observable<TipoImpresora> {
  return this.http.put<TipoImpresora>(`${this.apiUrl}/tipos-impresora/${id}`, request);
}

deleteTipoImpresora(id: number): Observable<void> {
  return this.http.delete<void>(`${this.apiUrl}/tipos-impresora/${id}`);
}
```

In `soportedesk-frontend/src/app/features/catalogos/catalogos.component.ts`:

Add `TipoImpresora` to the import from `'../../core/models/catalogo.model'`, extend the `CatalogoTab` union type:

```typescript
type CatalogoTab =
  | 'sedes'
  | 'dependencias'
  | 'subdependencias'
  | 'tiposContrato'
  | 'tiposLicencia'
  | 'tiposBien'
  | 'tiposImpresora';
```

Add the array property next to `tiposBien`:

```typescript
tiposImpresora: TipoImpresora[] = [];
```

Add the load call inside `loadAll()`, after the `getTiposBien()` line:

```typescript
this.service.getTiposImpresora().subscribe((data) => (this.tiposImpresora = data));
```

In `submitSimple()`, change the `tiposBien` branch's `if`/`else if` chain by inserting a new branch immediately after it, before the `dependencias` branch:

```typescript
} else if (this.activeTab === 'tiposBien') {
  obs = this.editingId
    ? this.service.updateTipoBien(this.editingId, { nombre: this.nombreForm })
    : this.service.createTipoBien({ nombre: this.nombreForm });
} else if (this.activeTab === 'tiposImpresora') {
  obs = this.editingId
    ? this.service.updateTipoImpresora(this.editingId, { nombre: this.nombreForm })
    : this.service.createTipoImpresora({ nombre: this.nombreForm });
} else if (this.activeTab === 'dependencias') {
```

In `deleteItem(tab, id)`, the final `else` branch is currently `tiposBien`; make it explicit and add `tiposImpresora` as the new final else:

```typescript
} else if (tab === 'tiposBien') {
  obs = this.service.deleteTipoBien(id);
} else {
  obs = this.service.deleteTipoImpresora(id);
}
```

In `soportedesk-frontend/src/app/features/catalogos/catalogos.component.html`, add a new tab button after "Tipos de Bien":

```html
<button [class.active]="activeTab === 'tiposImpresora'" (click)="setTab('tiposImpresora')">Tipos de Impresora</button>
```

And add a new `<ng-container>` block calqued exactly from the "Tipos de Bien" block at the end of the file:

```html
<!-- Tipos de Impresora -->
<ng-container *ngIf="activeTab === 'tiposImpresora'">
  <table>
    <thead>
      <tr>
        <th>Nombre</th>
        <th>Acciones</th>
      </tr>
    </thead>
    <tbody>
      <tr *ngFor="let item of tiposImpresora">
        <td>{{ item.nombre }}</td>
        <td>
          <button (click)="startEdit(item.id, item.nombre)">Editar</button>
          <button class="danger" (click)="deleteItem('tiposImpresora', item.id)">Eliminar</button>
        </td>
      </tr>
    </tbody>
  </table>

  <div class="form">
    <input [(ngModel)]="nombreForm" placeholder="Nombre de tipo de impresora" />
    <button (click)="submitSimple()">{{ editingId ? 'Actualizar' : 'Agregar' }}</button>
    <button class="secondary" *ngIf="editingId" (click)="resetForm()">Cancelar</button>
  </div>
</ng-container>
```

- [ ] **Step 9: Run test to verify it passes**

Run: `cd soportedesk-frontend && ng test --watch=false --include='**/catalogos.component.spec.ts'`
Expected: `TOTAL: 4 SUCCESS` (existing 3 + 1 new test).

- [ ] **Step 10: Commit**

```bash
git add soportedesk-frontend/src/app/core/models/catalogo.model.ts soportedesk-frontend/src/app/core/catalogos/catalogo.service.ts soportedesk-frontend/src/app/features/catalogos/catalogos.component.ts soportedesk-frontend/src/app/features/catalogos/catalogos.component.html soportedesk-frontend/src/app/features/catalogos/catalogos.component.spec.ts
git commit -m "feat: add TipoImpresora catalog (frontend)"
```

---

## Task 2: Impresora — backend (entidad, request, servicio, repositorio, migración SQL)

**Files:**
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/Impresora.java`
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/ImpresoraRequest.java`
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/ImpresoraService.java`
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/ImpresoraRepository.java`
- Modify: `soportedesk-backend/src/test/java/com/inia/soportedesk/impresoras/ImpresoraServiceTest.java`
- Modify: `soportedesk-backend/src/test/java/com/inia/soportedesk/impresoras/ImpresoraControllerIT.java`
- Create: `soportedesk-backend/src/test/java/com/inia/soportedesk/impresoras/ImpresoraRepositoryTest.java`
- Create: `soportedesk-backend/src/main/resources/alter_impresoras_rediseno_campos.sql`
- Modify: `soportedesk-backend/src/main/resources/schema.sql` (IMPRESORAS block)

**Interfaces:**
- Consumes (from Task 1): `com.inia.soportedesk.catalogo.TipoImpresora`, `com.inia.soportedesk.catalogo.TipoImpresoraRepository`.
- Produces (consumed by Task 3): JSON shape of `Impresora` (read model) — `tipoImpresora: { id, nombre } | null`, `serie: string | null`, `codigoInventario: string | null`, `codigoPatrimonial: string | null`, `tipoConexion: string` (backend value space is conventionally `"USB"`/`"IP"`, but the field is a plain unconstrained `String` — no enum/Bean Validation pattern enforces it, matching `estado`'s existing treatment), `ip: string | null` on the wire (the field is nullable on the backend; Task 3's frontend `Impresora.ip` keeps its pre-existing non-nullable `string` typing unchanged, a minor existing frontend/backend type mismatch this task does not touch) — and `ImpresoraRequest` (write model) — `tipoImpresoraId: number | null`, `serie/codigoInventario/codigoPatrimonial: string`, `tipoConexion: string`, `ip: string`. `ImpresoraController`'s routes and `@PreAuthorize` annotations are unchanged by this task.

- [ ] **Step 1: Write the failing tests**

Replace the full contents of `soportedesk-backend/src/test/java/com/inia/soportedesk/impresoras/ImpresoraServiceTest.java` (this preserves all 6 existing tests with updated sample helpers, plus adds 3 new tests — 9 tests total):

```java
package com.inia.soportedesk.impresoras;

import com.inia.soportedesk.catalogo.DependenciaRepository;
import com.inia.soportedesk.catalogo.SedeRepository;
import com.inia.soportedesk.catalogo.SubdependenciaRepository;
import com.inia.soportedesk.catalogo.TipoImpresora;
import com.inia.soportedesk.catalogo.TipoImpresoraRepository;
import com.inia.soportedesk.exception.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ImpresoraServiceTest {

    @Mock
    private ImpresoraRepository repository;

    @Mock
    private SedeRepository sedeRepository;

    @Mock
    private DependenciaRepository dependenciaRepository;

    @Mock
    private SubdependenciaRepository subdependenciaRepository;

    @Mock
    private TipoImpresoraRepository tipoImpresoraRepository;

    @InjectMocks
    private ImpresoraService service;

    private ImpresoraRequest sampleRequest() {
        ImpresoraRequest request = new ImpresoraRequest();
        request.setNombre("HP LaserJet 4ta planta");
        request.setMarca("HP");
        request.setModelo("M404dn");
        request.setTipoConexion("IP");
        request.setIp("10.0.0.50");
        request.setSerie("SN-12345");
        request.setCodigoInventario("INV-001");
        request.setCodigoPatrimonial("PAT-001");
        request.setEstado("Activa");
        request.setModeloTonerNegro("TN-2380");
        return request;
    }

    private Impresora sampleImpresora(Long id) {
        Impresora imp = new Impresora();
        imp.setId(id);
        imp.setNombre("HP LaserJet 4ta planta");
        imp.setMarca("HP");
        imp.setModelo("M404dn");
        imp.setTipoConexion("IP");
        imp.setIp("10.0.0.50");
        imp.setSerie("SN-12345");
        imp.setCodigoInventario("INV-001");
        imp.setCodigoPatrimonial("PAT-001");
        imp.setEstado("Activa");
        imp.setModeloTonerNegro("TN-2380");
        return imp;
    }

    @Test
    void findAll_withoutSearch_returnsAll() {
        when(repository.findAll()).thenReturn(List.of(sampleImpresora(1L)));

        List<Impresora> result = service.findAll(null);

        assertThat(result).hasSize(1);
        verify(repository).findAll();
    }

    @Test
    void findById_whenNotFound_throwsResourceNotFoundException() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.findById(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void create_savesImpresoraWithModeloConsumibles() {
        when(repository.save(any(Impresora.class))).thenAnswer(inv -> inv.getArgument(0));

        Impresora result = service.create(sampleRequest());

        assertThat(result.getNombre()).isEqualTo("HP LaserJet 4ta planta");
        assertThat(result.getModeloTonerNegro()).isEqualTo("TN-2380");
        assertThat(result.getSerie()).isEqualTo("SN-12345");
    }

    @Test
    void create_blankModelo_storesNull() {
        ImpresoraRequest request = sampleRequest();
        request.setModeloTonerNegro("   ");
        when(repository.save(any(Impresora.class))).thenAnswer(inv -> inv.getArgument(0));

        Impresora result = service.create(request);

        assertThat(result.getModeloTonerNegro()).isNull();
    }

    @Test
    void update_preservesDriverFields() {
        Impresora existing = sampleImpresora(1L);
        existing.setDriverArchivoPath("drivers/1/driver-hp.zip");
        existing.setDriverNombre("driver-hp.zip");
        existing.setDriverVersion("1.2");
        existing.setDriverSo("Windows 10");
        when(repository.findById(1L)).thenReturn(Optional.of(existing));
        when(repository.save(any(Impresora.class))).thenAnswer(inv -> inv.getArgument(0));

        ImpresoraRequest request = sampleRequest();
        request.setModeloTonerNegro("TN-2500");

        Impresora result = service.update(1L, request);

        assertThat(result.getModeloTonerNegro()).isEqualTo("TN-2500");
        assertThat(result.getDriverArchivoPath()).isEqualTo("drivers/1/driver-hp.zip");
    }

    @Test
    void delete_removesExistingImpresora() {
        Impresora impresora = sampleImpresora(1L);
        when(repository.findById(1L)).thenReturn(Optional.of(impresora));

        service.delete(1L);

        verify(repository).delete(impresora);
    }

    @Test
    void create_withTipoConexionUsb_forcesIpNull() {
        ImpresoraRequest request = sampleRequest();
        request.setTipoConexion("USB");
        request.setIp("10.0.0.50");
        when(repository.save(any(Impresora.class))).thenAnswer(inv -> inv.getArgument(0));

        Impresora result = service.create(request);

        assertThat(result.getTipoConexion()).isEqualTo("USB");
        assertThat(result.getIp()).isNull();
    }

    @Test
    void create_withTipoConexionIp_preservesIp() {
        ImpresoraRequest request = sampleRequest();
        when(repository.save(any(Impresora.class))).thenAnswer(inv -> inv.getArgument(0));

        Impresora result = service.create(request);

        assertThat(result.getTipoConexion()).isEqualTo("IP");
        assertThat(result.getIp()).isEqualTo("10.0.0.50");
    }

    @Test
    void create_resolvesTipoImpresoraFromId() {
        ImpresoraRequest request = sampleRequest();
        request.setTipoImpresoraId(5L);
        TipoImpresora tipo = new TipoImpresora();
        tipo.setId(5L);
        tipo.setNombre("Láser");
        when(tipoImpresoraRepository.findById(5L)).thenReturn(Optional.of(tipo));
        when(repository.save(any(Impresora.class))).thenAnswer(inv -> inv.getArgument(0));

        Impresora result = service.create(request);

        assertThat(result.getTipoImpresora()).isNotNull();
        assertThat(result.getTipoImpresora().getNombre()).isEqualTo("Láser");
    }
}
```

In `soportedesk-backend/src/test/java/com/inia/soportedesk/impresoras/ImpresoraControllerIT.java`, replace the two existing sample-builder helpers (the real file's `sampleRequest()` currently calls `setModeloDrum("DR-2365")`; it does not set `modeloCartucho`) with:

```java
private ImpresoraRequest sampleRequest() {
    ImpresoraRequest request = new ImpresoraRequest();
    request.setNombre("HP LaserJet 4ta planta");
    request.setMarca("HP");
    request.setModelo("M404dn");
    request.setTipoConexion("IP");
    request.setIp("10.0.0.50");
    request.setSerie("SN-12345");
    request.setCodigoInventario("INV-001");
    request.setCodigoPatrimonial("PAT-001");
    request.setEstado("Activa");
    request.setModeloTonerNegro("TN-2380");
    return request;
}

private Impresora sampleImpresora() {
    Impresora imp = new Impresora();
    imp.setId(1L);
    imp.setNombre("HP LaserJet 4ta planta");
    imp.setMarca("HP");
    imp.setModelo("M404dn");
    imp.setTipoConexion("IP");
    imp.setIp("10.0.0.50");
    imp.setSerie("SN-12345");
    imp.setCodigoInventario("INV-001");
    imp.setCodigoPatrimonial("PAT-001");
    imp.setEstado("Activa");
    imp.setModeloTonerNegro("TN-2380");
    return imp;
}
```

Do not add new `@Test` methods to this file — its 3 existing tests (`findAll_allowsAuthenticatedUser`, `create_withAdminRole_returnsCreated`, `create_withSoporteRole_returnsForbidden`) continue to exercise the same flows with the updated fields.

Create `soportedesk-backend/src/test/java/com/inia/soportedesk/impresoras/ImpresoraRepositoryTest.java`:

```java
package com.inia.soportedesk.impresoras;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase.Replace.NONE;

@DataJpaTest
@AutoConfigureTestDatabase(replace = NONE)
class ImpresoraRepositoryTest {

    @Autowired
    private ImpresoraRepository repository;

    @Test
    void search_bySerie_returnsMatchingImpresora() {
        Impresora impresora = new Impresora();
        impresora.setNombre("HP LaserJet 4ta planta");
        impresora.setMarca("HP");
        impresora.setModelo("M404dn");
        impresora.setTipoConexion("USB");
        impresora.setEstado("Activa");
        impresora.setSerie("SN-99887");
        repository.save(impresora);

        List<Impresora> result = repository.search("SN-99887");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getSerie()).isEqualTo("SN-99887");
    }

    @Test
    void search_byCodigoInventario_returnsMatchingImpresora() {
        Impresora impresora = new Impresora();
        impresora.setNombre("Canon Oficina Central");
        impresora.setMarca("Canon");
        impresora.setModelo("LBP6230");
        impresora.setTipoConexion("USB");
        impresora.setEstado("Activa");
        impresora.setCodigoInventario("INV-7766");
        repository.save(impresora);

        List<Impresora> result = repository.search("INV-7766");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getCodigoInventario()).isEqualTo("INV-7766");
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd soportedesk-backend && mvn -q test -Dtest=ImpresoraServiceTest`
Expected: FAIL — compile errors: `setTipoConexion`, `setSerie`, `setCodigoInventario`, `setCodigoPatrimonial`, `getTipoImpresora`, `setTipoImpresoraId` don't exist yet on `Impresora`/`ImpresoraRequest`.

Run: `cd soportedesk-backend && mvn -q test -Dtest=ImpresoraRepositoryTest`
Expected: FAIL with `ScriptStatementFailedException` → `JdbcSQLSyntaxErrorException` → `IllegalStateException: ApplicationContext failure threshold (1) exceeded`. Confirm the failure matches this exact known signature (see Global Constraints) — do not attempt to fix it. This is the expected, accepted result for this file both before and after this task's implementation.

- [ ] **Step 3: Write minimal implementation**

Rewrite `soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/Impresora.java` (79 lines today; remove `modeloCartucho`/`modeloDrum`/`modeloFusor` fields, add `tipoImpresora`/`serie`/`codigoInventario`/`codigoPatrimonial`/`tipoConexion`, keep the file's existing minimalist `@Column` style — no `length` attributes anywhere in this file today):

```java
package com.inia.soportedesk.impresoras;

import com.inia.soportedesk.catalogo.Dependencia;
import com.inia.soportedesk.catalogo.Sede;
import com.inia.soportedesk.catalogo.Subdependencia;
import com.inia.soportedesk.catalogo.TipoImpresora;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "impresoras")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Impresora {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    @Column(nullable = false)
    private String marca;

    @Column(nullable = false)
    private String modelo;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "tipo_impresora_id")
    private TipoImpresora tipoImpresora;

    private String serie;

    @Column(name = "codigo_inventario")
    private String codigoInventario;

    @Column(name = "codigo_patrimonial")
    private String codigoPatrimonial;

    @Column(name = "tipo_conexion", nullable = false)
    private String tipoConexion;

    private String ip;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "sede_id")
    private Sede sede;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "dependencia_id")
    private Dependencia dependencia;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "subdependencia_id")
    private Subdependencia subdependencia;

    @Column(nullable = false)
    private String estado;

    @Column(name = "modelo_toner_negro")
    private String modeloTonerNegro;

    @Column(name = "modelo_toner_c")
    private String modeloTonerC;

    @Column(name = "modelo_toner_m")
    private String modeloTonerM;

    @Column(name = "modelo_toner_y")
    private String modeloTonerY;

    @Column(name = "driver_nombre")
    private String driverNombre;

    @Column(name = "driver_version")
    private String driverVersion;

    @Column(name = "driver_so")
    private String driverSo;

    @Column(name = "driver_archivo_path")
    private String driverArchivoPath;
}
```

Rewrite `soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/ImpresoraRequest.java` (today this file has no `@Size` on `nombre`/`marca`/`modelo` — only `@NotBlank` — keep that as-is; do not add `@Size` to the new fields either, since the spec does not call for it):

```java
package com.inia.soportedesk.impresoras;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ImpresoraRequest {

    @NotBlank
    private String nombre;

    @NotBlank
    private String marca;

    @NotBlank
    private String modelo;

    private Long tipoImpresoraId;

    private String serie;

    private String codigoInventario;

    private String codigoPatrimonial;

    @NotBlank
    private String tipoConexion;

    private String ip;
    private Long sedeId;
    private Long dependenciaId;
    private Long subdependenciaId;

    @NotBlank
    private String estado;

    @Size(max = 100)
    private String modeloTonerNegro;

    @Size(max = 100)
    private String modeloTonerC;

    @Size(max = 100)
    private String modeloTonerM;

    @Size(max = 100)
    private String modeloTonerY;
}
```

Rewrite `soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/ImpresoraService.java` (inject `TipoImpresoraRepository`, resolve `tipoImpresora` in `copyFields` the same null-safe way as `sede`/`dependencia`/`subdependencia`, copy the 3 new identification fields via `emptyToNull`, copy `tipoConexion`, and force `ip` to `null` unless `tipoConexion = "IP"`):

```java
package com.inia.soportedesk.impresoras;

import com.inia.soportedesk.catalogo.DependenciaRepository;
import com.inia.soportedesk.catalogo.SedeRepository;
import com.inia.soportedesk.catalogo.SubdependenciaRepository;
import com.inia.soportedesk.catalogo.TipoImpresoraRepository;
import com.inia.soportedesk.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ImpresoraService {

    private final ImpresoraRepository repository;
    private final SedeRepository sedeRepository;
    private final DependenciaRepository dependenciaRepository;
    private final SubdependenciaRepository subdependenciaRepository;
    private final TipoImpresoraRepository tipoImpresoraRepository;

    public List<Impresora> findAll(String search) {
        if (search == null || search.isBlank()) {
            return repository.findAll();
        }
        return repository.search(search);
    }

    public Impresora findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Impresora no encontrada: " + id));
    }

    @Transactional
    public Impresora create(ImpresoraRequest request) {
        Impresora impresora = new Impresora();
        copyFields(impresora, request);
        return repository.save(impresora);
    }

    @Transactional
    public Impresora update(Long id, ImpresoraRequest request) {
        Impresora impresora = findById(id);
        copyFields(impresora, request);
        return repository.save(impresora);
    }

    public Impresora updateDriver(Long id, String driverNombre, String driverVersion, String driverSo, String driverArchivoPath) {
        Impresora impresora = findById(id);
        impresora.setDriverNombre(driverNombre);
        impresora.setDriverVersion(driverVersion);
        impresora.setDriverSo(driverSo);
        impresora.setDriverArchivoPath(driverArchivoPath);
        return repository.save(impresora);
    }

    public void delete(Long id) {
        repository.delete(findById(id));
    }

    private void copyFields(Impresora impresora, ImpresoraRequest request) {
        impresora.setNombre(request.getNombre());
        impresora.setMarca(request.getMarca());
        impresora.setModelo(request.getModelo());
        impresora.setEstado(request.getEstado());
        impresora.setSede(request.getSedeId() != null
                ? sedeRepository.findById(request.getSedeId())
                        .orElseThrow(() -> new ResourceNotFoundException("Sede no encontrada: " + request.getSedeId()))
                : null);
        impresora.setDependencia(request.getDependenciaId() != null
                ? dependenciaRepository.findById(request.getDependenciaId())
                        .orElseThrow(() -> new ResourceNotFoundException("Dependencia no encontrada: " + request.getDependenciaId()))
                : null);
        impresora.setSubdependencia(request.getSubdependenciaId() != null
                ? subdependenciaRepository.findById(request.getSubdependenciaId())
                        .orElseThrow(() -> new ResourceNotFoundException("Subdependencia no encontrada: " + request.getSubdependenciaId()))
                : null);
        impresora.setTipoImpresora(request.getTipoImpresoraId() != null
                ? tipoImpresoraRepository.findById(request.getTipoImpresoraId())
                        .orElseThrow(() -> new ResourceNotFoundException("Tipo de impresora no encontrado: " + request.getTipoImpresoraId()))
                : null);
        impresora.setSerie(emptyToNull(request.getSerie()));
        impresora.setCodigoInventario(emptyToNull(request.getCodigoInventario()));
        impresora.setCodigoPatrimonial(emptyToNull(request.getCodigoPatrimonial()));
        impresora.setTipoConexion(request.getTipoConexion());
        impresora.setIp("IP".equals(request.getTipoConexion()) ? emptyToNull(request.getIp()) : null);
        impresora.setModeloTonerNegro(emptyToNull(request.getModeloTonerNegro()));
        impresora.setModeloTonerC(emptyToNull(request.getModeloTonerC()));
        impresora.setModeloTonerM(emptyToNull(request.getModeloTonerM()));
        impresora.setModeloTonerY(emptyToNull(request.getModeloTonerY()));
    }

    private String emptyToNull(String val) {
        return (val == null || val.isBlank()) ? null : val.trim();
    }
}
```

Rewrite `soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/ImpresoraRepository.java` (extend the existing `@Query`'s `OR` clause to also match `serie`, `codigoInventario`, and `codigoPatrimonial`):

```java
package com.inia.soportedesk.impresoras;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ImpresoraRepository extends JpaRepository<Impresora, Long> {

    @Query("SELECT i FROM Impresora i LEFT JOIN i.sede s LEFT JOIN i.dependencia d WHERE " +
           "LOWER(i.nombre) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(i.marca) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(i.modelo) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(s.nombre) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(d.nombre) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(i.serie) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(i.codigoInventario) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(i.codigoPatrimonial) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<Impresora> search(@Param("search") String search);
}
```

Create `soportedesk-backend/src/main/resources/alter_impresoras_rediseno_campos.sql`:

```sql
-- =============================================================
-- Migración: rediseño de campos del módulo Impresora — agrega
-- catálogo tipos_impresora y tipo_impresora_id / serie / codigo_inventario /
-- codigo_patrimonial / tipo_conexion a impresoras; elimina modelo_cartucho /
-- modelo_drum / modelo_fusor. La tabla impresoras está vacía en producción
-- (verificado) — no requiere backfill.
-- Ejecutar manualmente en SSMS contra el servidor 172.16.26.16, base ssti.
-- =============================================================

USE ssti;
GO

CREATE TABLE dbo.tipos_impresora (
    id     BIGINT        NOT NULL IDENTITY(1,1),
    nombre NVARCHAR(100) NOT NULL,
    CONSTRAINT PK_tipos_impresora PRIMARY KEY (id),
    CONSTRAINT UQ_tipos_impresora_nombre UNIQUE (nombre)
);
GO

ALTER TABLE dbo.impresoras ADD
    tipo_impresora_id  BIGINT        NULL,
    serie              NVARCHAR(100) NULL,
    codigo_inventario  NVARCHAR(100) NULL,
    codigo_patrimonial NVARCHAR(100) NULL,
    tipo_conexion       NVARCHAR(10)  NOT NULL CONSTRAINT DF_impresoras_tipo_conexion DEFAULT 'USB';
GO

ALTER TABLE dbo.impresoras
    DROP COLUMN modelo_cartucho, modelo_drum, modelo_fusor;
GO

ALTER TABLE dbo.impresoras ADD
    CONSTRAINT FK_impresoras_tipo_impresora FOREIGN KEY (tipo_impresora_id) REFERENCES dbo.tipos_impresora (id);
GO

-- Verificación
SELECT COUNT(*) AS filas_impresoras FROM dbo.impresoras;
GO
```

In `soportedesk-backend/src/main/resources/schema.sql`, rewrite the `-- IMPRESORAS` block (currently lines 205-236, immediately after the new `tipos_impresora` block added in Task 1 and before `-- CORREOS INSTITUCIONALES`) to match the final entity shape, preserving the file's existing column widths and the aligned `ON UPDATE NO ACTION ON DELETE NO ACTION` FK style used by every other table in this file:

```sql
-- ============================================================
-- IMPRESORAS
-- ============================================================

IF OBJECT_ID(N'dbo.impresoras', N'U') IS NULL
CREATE TABLE dbo.impresoras (
    id                  BIGINT        NOT NULL IDENTITY(1,1),
    nombre              NVARCHAR(150) NOT NULL,
    marca               NVARCHAR(80)  NOT NULL,
    modelo              NVARCHAR(100) NOT NULL,
    tipo_impresora_id   BIGINT        NULL,
    serie               NVARCHAR(100) NULL,
    codigo_inventario   NVARCHAR(100) NULL,
    codigo_patrimonial  NVARCHAR(100) NULL,
    tipo_conexion       NVARCHAR(10)  NOT NULL DEFAULT 'USB',
    ip                  NVARCHAR(45)  NULL,
    sede_id             BIGINT        NULL,
    dependencia_id      BIGINT        NULL,
    subdependencia_id   BIGINT        NULL,
    estado              NVARCHAR(30)  NOT NULL,
    modelo_toner_negro  NVARCHAR(80)  NULL,
    modelo_toner_c      NVARCHAR(80)  NULL,
    modelo_toner_m      NVARCHAR(80)  NULL,
    modelo_toner_y      NVARCHAR(80)  NULL,
    driver_nombre       NVARCHAR(200) NULL,
    driver_version      NVARCHAR(50)  NULL,
    driver_so           NVARCHAR(50)  NULL,
    driver_archivo_path NVARCHAR(500) NULL,
    CONSTRAINT PK_impresoras        PRIMARY KEY (id),
    CONSTRAINT FK_impresoras_tipo   FOREIGN KEY (tipo_impresora_id)  REFERENCES dbo.tipos_impresora (id) ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT FK_impresoras_sede   FOREIGN KEY (sede_id)           REFERENCES dbo.sedes (id)           ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT FK_impresoras_dep    FOREIGN KEY (dependencia_id)    REFERENCES dbo.dependencias (id)    ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT FK_impresoras_subdep FOREIGN KEY (subdependencia_id) REFERENCES dbo.subdependencias (id) ON UPDATE NO ACTION ON DELETE NO ACTION
);
GO
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd soportedesk-backend && mvn -q test -Dtest=ImpresoraServiceTest`
Expected: `BUILD SUCCESS`, 9 tests run, 0 failures.

Run: `cd soportedesk-backend && mvn verify -Dit.test=ImpresoraControllerIT -Dsurefire.failIfNoSpecifiedTests=false -Dtest=NONE -q`
Expected: same known H2/schema.sql failure signature as Step 2 — `ScriptStatementFailedException` → `JdbcSQLSyntaxErrorException`, final summary `Tests run: 3, Failures: 0, Errors: 3, Skipped: 0` / `BUILD FAILURE`. This is the pre-existing, accepted result for this `@SpringBootTest` class both before and after this task's implementation — confirm it is unchanged, do not attempt to fix it.

Run: `cd soportedesk-backend && mvn -q test -Dtest=ImpresoraRepositoryTest`
Expected: same known H2/schema.sql failure signature as Step 2 (`ScriptStatementFailedException` → `JdbcSQLSyntaxErrorException`) — confirm it is unchanged, do not attempt to fix it.

- [ ] **Step 5: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/Impresora.java soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/ImpresoraRequest.java soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/ImpresoraService.java soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/ImpresoraRepository.java soportedesk-backend/src/test/java/com/inia/soportedesk/impresoras/ImpresoraServiceTest.java soportedesk-backend/src/test/java/com/inia/soportedesk/impresoras/ImpresoraControllerIT.java soportedesk-backend/src/test/java/com/inia/soportedesk/impresoras/ImpresoraRepositoryTest.java soportedesk-backend/src/main/resources/alter_impresoras_rediseno_campos.sql soportedesk-backend/src/main/resources/schema.sql
git commit -m "feat: redesign Impresora fields (backend)"
```

---

## Task 3: Impresora — frontend (modelo, formulario, lista, ficha, resumen)

**Files:**
- Modify: `soportedesk-frontend/src/app/features/impresoras/impresora.model.ts`
- Modify: `soportedesk-frontend/src/app/features/impresoras/impresora-form.component.ts`
- Modify: `soportedesk-frontend/src/app/features/impresoras/impresora-form.component.html`
- Create: `soportedesk-frontend/src/app/features/impresoras/impresora-form.component.spec.ts`
- Modify: `soportedesk-frontend/src/app/features/impresoras/impresoras-list.component.ts`
- Modify: `soportedesk-frontend/src/app/features/impresoras/impresora-ficha.component.ts`
- Modify: `soportedesk-frontend/src/app/features/impresoras/impresora-ficha.component.html`
- Modify: `soportedesk-frontend/src/app/features/impresoras/impresora-ficha.component.spec.ts`
- Modify: `soportedesk-frontend/src/app/features/impresoras/impresora-resumen.component.ts`

**Interfaces:**
- Consumes (from Task 1): `CatalogoService.getTiposImpresora(): Observable<TipoImpresora[]>`, model `TipoImpresora { id: number; nombre: string; }`.
- Consumes (from Task 2): backend JSON shape for `Impresora`/`ImpresoraRequest` as defined in Task 2's Interfaces block.

Because Angular compiles the whole program together, this task's RED phase batch-writes every new/updated spec file first (so the suite fails for the *expected* reasons — missing fields/methods — rather than unrelated type errors), then the GREEN phase batch-writes every production file together.

- [ ] **Step 1: Write the failing tests (batch)**

Create `soportedesk-frontend/src/app/features/impresoras/impresora-form.component.spec.ts`. The real `ImpresoraFormComponent` already renders `<app-ubicacion-select>` (standalone, declared in its own `imports`), whose `ngOnInit` calls `CatalogoService.getSedes()` and `CatalogoService.getTiposContrato()` regardless of `showTipoContrato` — so `fixture.detectChanges()` triggers those two requests plus the new `getTiposImpresora()` call from `ImpresoraFormComponent` itself. Follow the existing `req.url.includes(...)` predicate convention used in `catalogos.component.spec.ts` rather than literal absolute URLs (the app's `environment.apiUrl` is the relative path `/api`, not an absolute `http://localhost:8080/api` origin):

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ImpresoraFormComponent } from './impresora-form.component';

describe('ImpresoraFormComponent', () => {
  let component: ImpresoraFormComponent;
  let fixture: ComponentFixture<ImpresoraFormComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImpresoraFormComponent, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ImpresoraFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    httpMock = TestBed.inject(HttpTestingController);

    httpMock.expectOne((req) => req.url.includes('/catalogos/tipos-impresora')).flush([]);
    httpMock.expectOne((req) => req.url.includes('/catalogos/sedes')).flush([]);
    httpMock.expectOne((req) => req.url.includes('/catalogos/tipos-contrato')).flush([]);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('hides the ip field when tipoConexion is USB', () => {
    component.form.patchValue({ tipoConexion: 'USB' });
    fixture.detectChanges();

    const ipInput = fixture.nativeElement.querySelector('input[formControlName="ip"]');
    expect(ipInput).toBeNull();
  });

  it('shows the ip field when tipoConexion is IP', () => {
    component.form.patchValue({ tipoConexion: 'IP' });
    fixture.detectChanges();

    const ipInput = fixture.nativeElement.querySelector('input[formControlName="ip"]');
    expect(ipInput).not.toBeNull();
  });

  it('clears ip when switching tipoConexion back to USB', () => {
    component.form.patchValue({ tipoConexion: 'IP', ip: '10.0.0.5' });

    component.form.patchValue({ tipoConexion: 'USB' });

    expect(component.form.getRawValue().ip).toBe('');
  });
});
```

In `soportedesk-frontend/src/app/features/impresoras/impresora-ficha.component.spec.ts`, rewrite the `mockImpresora` literal (lines 7-28) to match the new `Impresora` shape — remove `modeloCartucho`/`modeloDrum`/`modeloFusor`, add `tipoImpresora: { id: 1, nombre: 'Láser' }`, `serie: 'SN-001'`, `codigoInventario: 'INV-001'`, `codigoPatrimonial: 'PAT-001'`, `tipoConexion: 'IP'`:

```typescript
const mockImpresora: Impresora = {
  id: 1,
  nombre: 'Impresora Test',
  marca: 'HP',
  modelo: 'LaserJet',
  tipoImpresora: { id: 1, nombre: 'Láser' },
  serie: 'SN-001',
  codigoInventario: 'INV-001',
  codigoPatrimonial: 'PAT-001',
  tipoConexion: 'IP',
  ip: '192.168.1.100',
  sede: { id: 1, nombre: 'Sede Central' },
  dependencia: { id: 1, nombre: 'Dependencia Test' },
  subdependencia: null,
  estado: 'Activa',
  modeloTonerNegro: 'TN-2380',
  modeloTonerC: null,
  modeloTonerM: null,
  modeloTonerY: null,
  driverNombre: null,
  driverVersion: null,
  driverSo: null,
  driverArchivoPath: null,
};
```

Update the existing `hasConsumibles returns false when all models are null` test (lines 59-66) to drop the now-nonexistent fields from its override object:

```typescript
it('hasConsumibles returns false when all models are null', () => {
  component.impresora = {
    ...mockImpresora,
    modeloTonerNegro: null, modeloTonerC: null, modeloTonerM: null, modeloTonerY: null,
  };
  expect(component.hasConsumibles()).toBeFalse();
});
```

Add two new tests at the end of the file's existing `describe` block. `ip` is typed non-nullable `string` on `Impresora` (see model section above), so the USB case uses `ip: ''` rather than `ip: null`:

```typescript
it('shows the IP row when tipoConexion is IP', () => {
  component.impresora = { ...mockImpresora, tipoConexion: 'IP', ip: '10.0.0.5' };
  fixture.detectChanges();

  expect(fixture.nativeElement.textContent).toContain('10.0.0.5');
});

it('hides the IP row when tipoConexion is USB', () => {
  component.impresora = { ...mockImpresora, tipoConexion: 'USB', ip: '' };
  fixture.detectChanges();

  const ipRow = Array.from(fixture.nativeElement.querySelectorAll('.row')).find((el) =>
    (el as HTMLElement).textContent?.includes('Conexión')
  ) as HTMLElement | undefined;
  expect(ipRow?.textContent).not.toContain('—');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd soportedesk-frontend && ng test --watch=false`
Expected: FAIL — compile errors across the suite: `ImpresoraFormComponent` has no `form` control named `tipoConexion` recognized by the spec's expectations yet (template has no `tipoConexion`-gated `ip` input), and `mockImpresora`/`Impresora` type errors (`tipoImpresora`/`serie`/`codigoInventario`/`codigoPatrimonial`/`tipoConexion` not assignable, `modeloCartucho` etc. not removed yet).

- [ ] **Step 3: Write minimal implementation (batch)**

Rewrite `soportedesk-frontend/src/app/features/impresoras/impresora.model.ts` (the real file today has no imports — `sede`/`dependencia`/`subdependencia` are inline anonymous-object types; keep that style, just add the new fields and drop the 3 removed ones):

```typescript
export interface Impresora {
  id: number;
  nombre: string;
  marca: string;
  modelo: string;
  tipoImpresora: { id: number; nombre: string } | null;
  serie: string | null;
  codigoInventario: string | null;
  codigoPatrimonial: string | null;
  tipoConexion: string;
  ip: string;
  sede: { id: number; nombre: string } | null;
  dependencia: { id: number; nombre: string } | null;
  subdependencia: { id: number; nombre: string } | null;
  estado: string;
  modeloTonerNegro: string | null;
  modeloTonerC: string | null;
  modeloTonerM: string | null;
  modeloTonerY: string | null;
  driverNombre: string | null;
  driverVersion: string | null;
  driverSo: string | null;
  driverArchivoPath: string | null;
}

export interface ImpresoraRequest {
  nombre: string;
  marca: string;
  modelo: string;
  tipoImpresoraId: number | null;
  serie: string;
  codigoInventario: string;
  codigoPatrimonial: string;
  tipoConexion: string;
  ip: string;
  sedeId: number | null;
  dependenciaId: number | null;
  subdependenciaId: number | null;
  estado: string;
  modeloTonerNegro: string;
  modeloTonerC: string;
  modeloTonerM: string;
  modeloTonerY: string;
}
```

`tipoConexion` is typed as plain `string`, not a `'USB' | 'IP'` literal union — consistent with how `estado` is already untyped `string` with no enum/catalog backing it (see spec's "Manejo de errores y validación" section: this is a deliberate choice to follow the existing pattern, not an oversight). `ip` stays non-nullable `string` on both interfaces, matching the field's current type (the backend's nullability is unrelated to this pre-existing frontend typing).

Rewrite `soportedesk-frontend/src/app/features/impresoras/impresora-form.component.ts`. The current file keeps `sedeId`/`dependenciaId`/`subdependenciaId` as plain component properties wired two-way to the shared `<app-ubicacion-select>` component — it does **not** inject `CatalogoService` and has no `OnInit`. This rewrite must preserve that pattern untouched and only add a form control for `tipoImpresoraId` (with a new `CatalogoService` injection and a minimal `OnInit` just to load `tiposImpresora`), plus `serie`/`codigoInventario`/`codigoPatrimonial`/`tipoConexion` controls, while removing `modeloCartucho`/`modeloDrum`/`modeloFusor`:

```typescript
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Impresora, ImpresoraRequest } from './impresora.model';
import { ImpresoraService } from './impresora.service';
import { UbicacionSelectComponent } from '../../shared/ubicacion-select/ubicacion-select.component';
import { CatalogoService } from '../../core/catalogos/catalogo.service';
import { TipoImpresora } from '../../core/models/catalogo.model';

@Component({
  selector: 'app-impresora-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, UbicacionSelectComponent],
  templateUrl: './impresora-form.component.html',
  styleUrl: './impresora-form.component.scss',
})
export class ImpresoraFormComponent implements OnInit, OnChanges {
  private fb = inject(FormBuilder);
  private service = inject(ImpresoraService);
  private catalogoService = inject(CatalogoService);

  @Input() impresora: Impresora | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  sedeId: number | null = null;
  dependenciaId: number | null = null;
  subdependenciaId: number | null = null;
  tiposImpresora: TipoImpresora[] = [];

  form = this.fb.nonNullable.group({
    nombre:             ['', Validators.required],
    marca:              ['', Validators.required],
    modelo:             ['', Validators.required],
    tipoImpresoraId:    [null as number | null],
    serie:              [''],
    codigoInventario:   [''],
    codigoPatrimonial:  [''],
    tipoConexion:       ['USB', Validators.required],
    ip:                 [''],
    estado:             ['Activa', Validators.required],
    modeloTonerNegro:   [''],
    modeloTonerC:       [''],
    modeloTonerM:       [''],
    modeloTonerY:       [''],
  });

  constructor() {
    this.form.get('tipoConexion')!.valueChanges.subscribe((value) => {
      if (value === 'USB') {
        this.form.patchValue({ ip: '' });
      }
    });
  }

  ngOnInit(): void {
    this.catalogoService.getTiposImpresora().subscribe((data) => (this.tiposImpresora = data));
  }

  ngOnChanges(): void {
    if (this.impresora) {
      this.sedeId           = this.impresora.sede?.id ?? null;
      this.dependenciaId    = this.impresora.dependencia?.id ?? null;
      this.subdependenciaId = this.impresora.subdependencia?.id ?? null;
      this.form.patchValue({
        nombre:            this.impresora.nombre,
        marca:             this.impresora.marca,
        modelo:            this.impresora.modelo,
        tipoImpresoraId:   this.impresora.tipoImpresora?.id ?? null,
        serie:             this.impresora.serie ?? '',
        codigoInventario:  this.impresora.codigoInventario ?? '',
        codigoPatrimonial: this.impresora.codigoPatrimonial ?? '',
        tipoConexion:      this.impresora.tipoConexion,
        ip:                this.impresora.ip,
        estado:            this.impresora.estado,
        modeloTonerNegro:  this.impresora.modeloTonerNegro ?? '',
        modeloTonerC:      this.impresora.modeloTonerC     ?? '',
        modeloTonerM:      this.impresora.modeloTonerM     ?? '',
        modeloTonerY:      this.impresora.modeloTonerY     ?? '',
      });
    } else {
      this.sedeId = null;
      this.dependenciaId = null;
      this.subdependenciaId = null;
      this.form.reset({
        nombre: '', marca: '', modelo: '',
        tipoImpresoraId: null, serie: '', codigoInventario: '', codigoPatrimonial: '',
        tipoConexion: 'USB', ip: '',
        estado: 'Activa',
        modeloTonerNegro: '', modeloTonerC: '', modeloTonerM: '', modeloTonerY: '',
      });
    }
  }

  submit(): void {
    if (this.form.invalid) return;
    const request: ImpresoraRequest = {
      ...this.form.getRawValue(),
      sedeId: this.sedeId,
      dependenciaId: this.dependenciaId,
      subdependenciaId: this.subdependenciaId,
    };
    const obs = this.impresora
      ? this.service.update(this.impresora.id, request)
      : this.service.create(request);
    obs.subscribe(() => this.saved.emit());
  }
}
```

`estado`'s default is `'Activa'` (not `'Activo'`) — matches the current file's existing default exactly. `ip` is patched directly from `this.impresora.ip` with no `?? ''` fallback, matching the current file's existing convention (the field is typed non-nullable `string`).

Rewrite `soportedesk-frontend/src/app/features/impresoras/impresora-form.component.html`. The current file wraps the scalar fields in a `<div class="two-col">` block, followed by `<app-ubicacion-select [showTipoContrato]="false" [(sedeId)]="sedeId" [(dependenciaId)]="dependenciaId" [(subdependenciaId)]="subdependenciaId" />`, then an `<h4>Modelos de consumibles</h4>` section with its own `<div class="two-col">` of 7 fields (4 tóner + Cartucho/Drum/Fusor). Keep `<app-ubicacion-select>` exactly as-is; add the new fields into the first `two-col` block; drop Cartucho/Drum/Fusor from the consumibles block:

```html
<form [formGroup]="form" (ngSubmit)="submit()">
  <div class="two-col">
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
      <label>Tipo de impresora</label>
      <select formControlName="tipoImpresoraId">
        <option [ngValue]="null">— Sin tipo —</option>
        <option *ngFor="let t of tiposImpresora" [ngValue]="t.id">{{ t.nombre }}</option>
      </select>
    </div>
    <div class="field">
      <label>Serie</label>
      <input type="text" formControlName="serie" />
    </div>
    <div class="field">
      <label>Código de Inventario</label>
      <input type="text" formControlName="codigoInventario" />
    </div>
    <div class="field">
      <label>Código Patrimonial</label>
      <input type="text" formControlName="codigoPatrimonial" />
    </div>
    <div class="field">
      <label>Conexión</label>
      <select formControlName="tipoConexion">
        <option value="USB">USB</option>
        <option value="IP">IP</option>
      </select>
    </div>
    <div class="field" *ngIf="form.value.tipoConexion === 'IP'">
      <label>IP</label>
      <input type="text" formControlName="ip" />
    </div>
    <div class="field">
      <label>Estado</label>
      <select formControlName="estado">
        <option value="Activa">Activa</option>
        <option value="En mantenimiento">En mantenimiento</option>
        <option value="De baja">De baja</option>
      </select>
    </div>
  </div>

  <app-ubicacion-select
    [showTipoContrato]="false"
    [(sedeId)]="sedeId"
    [(dependenciaId)]="dependenciaId"
    [(subdependenciaId)]="subdependenciaId"
  />

  <h4>Modelos de consumibles</h4>
  <div class="two-col">
    <div class="field">
      <label>Tóner Negro</label>
      <input type="text" formControlName="modeloTonerNegro" placeholder="ej: TN-2380" />
    </div>
    <div class="field">
      <label>Tóner Cyan</label>
      <input type="text" formControlName="modeloTonerC" placeholder="ej: TN-223C" />
    </div>
    <div class="field">
      <label>Tóner Magenta</label>
      <input type="text" formControlName="modeloTonerM" placeholder="ej: TN-223M" />
    </div>
    <div class="field">
      <label>Tóner Amarillo</label>
      <input type="text" formControlName="modeloTonerY" placeholder="ej: TN-223Y" />
    </div>
  </div>

  <div class="actions">
    <button type="button" class="secondary" (click)="cancelled.emit()">Cancelar</button>
    <button type="submit" [disabled]="form.invalid">Guardar</button>
  </div>
</form>
```

In `soportedesk-frontend/src/app/features/impresoras/impresoras-list.component.ts`, the current `columns` array has 8 entries (`nombre`, `marca`, `modelo`, `ip`, `sede.nombre`, `dependencia.nombre`, `subdependencia.nombre`, `estado`) — none reference `modeloCartucho`/`modeloDrum`/`modeloFusor`, so no column removal is needed. Add two new entries after the `modelo` entry and before the `ip` entry:

```typescript
{ key: 'tipoImpresora.nombre', label: 'Tipo' },
{ key: 'serie', label: 'Serie' },
```

In `soportedesk-frontend/src/app/features/impresoras/impresora-ficha.component.ts`, rewrite `hasConsumibles()` to check only the 4 tóner fields. The current file has no null-guard (`impresora` is `@Input({ required: true })`, always defined) — keep that convention:

```typescript
hasConsumibles(): boolean {
  return !!(
    this.impresora.modeloTonerNegro ||
    this.impresora.modeloTonerC     ||
    this.impresora.modeloTonerM     ||
    this.impresora.modeloTonerY
  );
}
```

In `soportedesk-frontend/src/app/features/impresoras/impresora-ficha.component.html`, in the "Instalación" tab, the current rows are single-line `<div class="row"><span>Label</span><span>{{ impresora.field }}</span></div>` with plain (non-optional-chained) `impresora.X` access — keep that exact style. Insert these rows after the `Modelo` row and before the `IP` row, and replace the existing standalone `IP` row with the conditional version shown last:

```html
<div class="row"><span>Tipo de impresora</span><span>{{ impresora.tipoImpresora?.nombre }}</span></div>
<div class="row"><span>Serie</span><span>{{ impresora.serie }}</span></div>
<div class="row"><span>Código de Inventario</span><span>{{ impresora.codigoInventario }}</span></div>
<div class="row"><span>Código Patrimonial</span><span>{{ impresora.codigoPatrimonial }}</span></div>
<div class="row">
  <span>Conexión</span>
  <span>{{ impresora.tipoConexion }}<ng-container *ngIf="impresora.tipoConexion === 'IP'"> — {{ impresora.ip }}</ng-container></span>
</div>
```

`impresora.tipoImpresora?.nombre` keeps `?.` because `tipoImpresora` itself can be `null` (no catalog assigned) — this is the same optional-chaining pattern the current file already uses for `impresora.sede?.nombre` etc. on line 13-15. `impresora.serie`/`codigoInventario`/`codigoPatrimonial` need no `?.` since they're accessed directly off the always-defined `impresora`, same as `impresora.nombre`/`impresora.ip` today — Angular's interpolation renders `null` as an empty string, matching the existing rows' behavior for nullable fields (no `|| '—'` fallback is used anywhere in the current file, so don't introduce one here).

In the "Consumibles" tab of the same file, remove the 3 `*ngIf="impresora.modeloX"` row blocks for `modeloCartucho`/`modeloDrum`/`modeloFusor` (lines 33-41 of the current file), keeping the 4 tóner rows and the existing `*ngIf="hasConsumibles(); else noConsumibles"` / `<ng-template #noConsumibles>` structure untouched.

In `soportedesk-frontend/src/app/features/impresoras/impresora-resumen.component.ts`, reduce `CONSUMIBLE_DEFS` (currently 7 entries, lines 12-19, typed `{ key: keyof Impresora; label: string }[]`) to only the 4 tóner entries — keep the existing type annotation and label capitalization exactly as in the current file:

```typescript
const CONSUMIBLE_DEFS: { key: keyof Impresora; label: string }[] = [
  { key: 'modeloTonerNegro', label: 'Tóner Negro' },
  { key: 'modeloTonerC',     label: 'Tóner Cyan' },
  { key: 'modeloTonerM',     label: 'Tóner Magenta' },
  { key: 'modeloTonerY',     label: 'Tóner Amarillo' },
];
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd soportedesk-frontend && ng test --watch=false`
Expected: `TOTAL: 43 SUCCESS` (baseline 37 + 1 catalogos test from Task 1 + 3 new `impresora-form.component.spec.ts` tests + 2 net new `impresora-ficha.component.spec.ts` tests).

- [ ] **Step 5: Commit**

```bash
git add soportedesk-frontend/src/app/features/impresoras/impresora.model.ts soportedesk-frontend/src/app/features/impresoras/impresora-form.component.ts soportedesk-frontend/src/app/features/impresoras/impresora-form.component.html soportedesk-frontend/src/app/features/impresoras/impresora-form.component.spec.ts soportedesk-frontend/src/app/features/impresoras/impresoras-list.component.ts soportedesk-frontend/src/app/features/impresoras/impresora-ficha.component.ts soportedesk-frontend/src/app/features/impresoras/impresora-ficha.component.html soportedesk-frontend/src/app/features/impresoras/impresora-ficha.component.spec.ts soportedesk-frontend/src/app/features/impresoras/impresora-resumen.component.ts
git commit -m "feat: redesign Impresora fields (frontend)"
```
