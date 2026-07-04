# Equipos Enrichment Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an enrichment layer on top of the GLPI read-only inventory so admins can fill in código patrimonial, estado de depuración, and field overrides; normalize equipment types via catalog; and surface a health dashboard showing stale/incomplete records.

**Architecture:** Three new SQL Server tables (`equipos_enrichment`, `equipo_tipo_catalogo`, `equipos_enrichment_historial`) store local data keyed by GLPI `ComputerID`. The backend merges GLPI view + enrichment at the service layer and exposes new REST endpoints. The frontend adds a Mantenimiento section to the detail page, a Salud tab in the list, and a new Tipos de Equipo entry in the existing Catálogos component.

**Tech Stack:** Spring Boot 3, JPA (SQL Server), Angular 17 standalone components, Signals API, `AuthService.canWrite('equipos')` for conditional UI.

## Global Constraints

- Never write to GLPI MariaDB (`glpi` datasource) — it is `@Immutable` by design.
- All new JPA entities use the primary SQL Server datasource (`ssti`).
- Permissions: write endpoints require `hasRole('ADMIN') || hasAuthority('WRITE_equipos')`. `WRITE_equipos` is automatically granted when a user has `nivel = EDIT` for the `equipos` module in the `permisos` table — no changes to `Modulos.java` or `SecurityConfig.java` needed.
- Follow `@ExtendWith(MockitoExtension.class)` + AssertJ for all unit tests.
- Angular: standalone components, inject() pattern, Signals (`signal`, `computed`).
- Maven test command: `./mvnw test -pl soportedesk-backend -Dtest=<TestClass>` from repo root.
- Angular test command: `cd soportedesk-frontend && npx ng test --include=**/equipo*.spec.ts --watch=false`.
- Commit after each task.

---

### Task 1: SQL Migration

**Files:**
- Create: `docs/superpowers/migrations/2026-07-04-equipos-enrichment.sql`

**Interfaces:**
- Produces: Three tables in `ssti` SQL Server — `equipos_enrichment`, `equipo_tipo_catalogo`, `equipos_enrichment_historial`.

- [ ] **Step 1: Create migration file**

```sql
-- docs/superpowers/migrations/2026-07-04-equipos-enrichment.sql
-- Ejecutar en: ssti (SQL Server)

-- 1. Catálogo de tipos de equipo (mapeo GLPI raw → tipo normalizado)
IF OBJECT_ID(N'dbo.equipo_tipo_catalogo', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.equipo_tipo_catalogo (
        id               BIGINT IDENTITY(1,1) PRIMARY KEY,
        glpi_valor       NVARCHAR(80)  NOT NULL UNIQUE,
        tipo_normalizado NVARCHAR(80)  NOT NULL,
        activo           BIT           NOT NULL DEFAULT 1
    );
END;
GO

-- Datos iniciales
IF NOT EXISTS (SELECT 1 FROM dbo.equipo_tipo_catalogo WHERE glpi_valor = N'Desktop')
BEGIN
    INSERT INTO dbo.equipo_tipo_catalogo (glpi_valor, tipo_normalizado) VALUES
    (N'Desktop',   N'Desktop'),
    (N'PC',        N'Desktop'),
    (N'Notebook',  N'Laptop'),
    (N'Laptop',    N'Laptop'),
    (N'Tablet',    N'Tablet'),
    (N'Server',    N'Servidor'),
    (N'Servidor',  N'Servidor');
END;
GO

-- 2. Enriquecimiento por equipo (un registro por ComputerID GLPI)
IF OBJECT_ID(N'dbo.equipos_enrichment', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.equipos_enrichment (
        id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
        computer_id         BIGINT        NOT NULL UNIQUE,
        tipo_override       NVARCHAR(80)  NULL,
        fabricante_override NVARCHAR(100) NULL,
        modelo_override     NVARCHAR(100) NULL,
        codigo_patrimonial  NVARCHAR(50)  NULL,
        estado_depuracion   NVARCHAR(30)  NULL,
        observaciones       NVARCHAR(500) NULL,
        revisado_por        NVARCHAR(80)  NULL,
        fecha_revision      DATETIME      NULL
    );
END;
GO

-- 3. Historial de cambios por campo
IF OBJECT_ID(N'dbo.equipos_enrichment_historial', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.equipos_enrichment_historial (
        id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
        computer_id         BIGINT        NOT NULL,
        campo               NVARCHAR(80)  NOT NULL,
        valor_anterior      NVARCHAR(500) NULL,
        valor_nuevo         NVARCHAR(500) NULL,
        modificado_por      NVARCHAR(80)  NOT NULL,
        fecha_modificacion  DATETIME      NOT NULL DEFAULT GETDATE()
    );
    CREATE INDEX ix_historial_computer_id
        ON dbo.equipos_enrichment_historial(computer_id);
END;
GO

-- Verificación
SELECT 'equipo_tipo_catalogo' AS tabla, COUNT(*) AS filas FROM dbo.equipo_tipo_catalogo
UNION ALL
SELECT 'equipos_enrichment', COUNT(*) FROM dbo.equipos_enrichment
UNION ALL
SELECT 'equipos_enrichment_historial', COUNT(*) FROM dbo.equipos_enrichment_historial;
GO
```

- [ ] **Step 2: Run migration against ssti**

Execute the SQL file against the `ssti` SQL Server instance. Verify the output shows `equipo_tipo_catalogo` with 7 rows.

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/migrations/2026-07-04-equipos-enrichment.sql
git commit -m "feat: add SQL migration for equipos enrichment tables"
```

---

### Task 2: Backend — TipoEquipoCatalogo CRUD

**Files:**
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/TipoEquipoCatalogo.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/TipoEquipoCatalogoRepository.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/TipoEquipoCatalogoRequest.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/TipoEquipoCatalogoService.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/TipoEquipoCatalogoController.java`
- Test: `soportedesk-backend/src/test/java/com/inia/soportedesk/catalogo/TipoEquipoCatalogoServiceTest.java`

**Interfaces:**
- Produces:
  - `TipoEquipoCatalogoRepository.findByActivoTrue(): List<TipoEquipoCatalogo>`
  - `TipoEquipoCatalogoRepository.findByGlpiValorAndActivoTrue(String): Optional<TipoEquipoCatalogo>`
  - REST: `GET /api/catalogos/tipo-equipo`, `POST`, `PUT /{id}`, `DELETE /{id}`

- [ ] **Step 1: Write failing test**

```java
// soportedesk-backend/src/test/java/com/inia/soportedesk/catalogo/TipoEquipoCatalogoServiceTest.java
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
class TipoEquipoCatalogoServiceTest {

    @Mock
    private TipoEquipoCatalogoRepository repository;

    @InjectMocks
    private TipoEquipoCatalogoService service;

    private TipoEquipoCatalogo sample() {
        TipoEquipoCatalogo t = new TipoEquipoCatalogo();
        t.setId(1L);
        t.setGlpiValor("PC");
        t.setTipoNormalizado("Desktop");
        t.setActivo(true);
        return t;
    }

    @Test
    void findAll_returnsOnlyActiveEntries() {
        when(repository.findByActivoTrue()).thenReturn(List.of(sample()));
        assertThat(service.findAll()).hasSize(1);
        verify(repository).findByActivoTrue();
    }

    @Test
    void create_savesFromRequest() {
        TipoEquipoCatalogoRequest req = new TipoEquipoCatalogoRequest();
        req.setGlpiValor("Notebook");
        req.setTipoNormalizado("Laptop");
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        TipoEquipoCatalogo result = service.create(req);

        assertThat(result.getGlpiValor()).isEqualTo("Notebook");
        assertThat(result.getTipoNormalizado()).isEqualTo("Laptop");
        assertThat(result.isActivo()).isTrue();
    }

    @Test
    void delete_setsActivoFalse() {
        TipoEquipoCatalogo entity = sample();
        when(repository.findById(1L)).thenReturn(Optional.of(entity));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.delete(1L);

        assertThat(entity.isActivo()).isFalse();
        verify(repository).save(entity);
    }

    @Test
    void delete_whenNotFound_throws() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.delete(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

```
./mvnw test -pl soportedesk-backend -Dtest=TipoEquipoCatalogoServiceTest
```
Expected: compilation errors — classes don't exist yet.

- [ ] **Step 3: Implement entity**

```java
// soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/TipoEquipoCatalogo.java
package com.inia.soportedesk.catalogo;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "equipo_tipo_catalogo")
@Getter @Setter @NoArgsConstructor
public class TipoEquipoCatalogo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "glpi_valor", nullable = false, unique = true)
    private String glpiValor;

    @Column(name = "tipo_normalizado", nullable = false)
    private String tipoNormalizado;

    @Column(nullable = false)
    private boolean activo = true;
}
```

- [ ] **Step 4: Implement repository**

```java
// soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/TipoEquipoCatalogoRepository.java
package com.inia.soportedesk.catalogo;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface TipoEquipoCatalogoRepository extends JpaRepository<TipoEquipoCatalogo, Long> {
    List<TipoEquipoCatalogo> findByActivoTrue();
    Optional<TipoEquipoCatalogo> findByGlpiValorAndActivoTrue(String glpiValor);
}
```

- [ ] **Step 5: Implement request DTO**

```java
// soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/TipoEquipoCatalogoRequest.java
package com.inia.soportedesk.catalogo;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class TipoEquipoCatalogoRequest {
    @NotBlank private String glpiValor;
    @NotBlank private String tipoNormalizado;
}
```

- [ ] **Step 6: Implement service**

```java
// soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/TipoEquipoCatalogoService.java
package com.inia.soportedesk.catalogo;

import com.inia.soportedesk.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TipoEquipoCatalogoService {

    private final TipoEquipoCatalogoRepository repository;

    public List<TipoEquipoCatalogo> findAll() {
        return repository.findByActivoTrue();
    }

    public TipoEquipoCatalogo create(TipoEquipoCatalogoRequest request) {
        TipoEquipoCatalogo entity = new TipoEquipoCatalogo();
        entity.setGlpiValor(request.getGlpiValor().trim());
        entity.setTipoNormalizado(request.getTipoNormalizado().trim());
        return repository.save(entity);
    }

    public TipoEquipoCatalogo update(Long id, TipoEquipoCatalogoRequest request) {
        TipoEquipoCatalogo entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tipo de equipo no encontrado: " + id));
        entity.setGlpiValor(request.getGlpiValor().trim());
        entity.setTipoNormalizado(request.getTipoNormalizado().trim());
        return repository.save(entity);
    }

    public void delete(Long id) {
        TipoEquipoCatalogo entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tipo de equipo no encontrado: " + id));
        entity.setActivo(false);
        repository.save(entity);
    }
}
```

- [ ] **Step 7: Implement controller**

```java
// soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/TipoEquipoCatalogoController.java
package com.inia.soportedesk.catalogo;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/catalogos/tipo-equipo")
@RequiredArgsConstructor
public class TipoEquipoCatalogoController {

    private final TipoEquipoCatalogoService service;

    @GetMapping
    public List<TipoEquipoCatalogo> findAll() {
        return service.findAll();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TipoEquipoCatalogo> create(@Valid @RequestBody TipoEquipoCatalogoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public TipoEquipoCatalogo update(@PathVariable Long id, @Valid @RequestBody TipoEquipoCatalogoRequest request) {
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

- [ ] **Step 8: Run tests**

```
./mvnw test -pl soportedesk-backend -Dtest=TipoEquipoCatalogoServiceTest
```
Expected: 4 tests pass.

- [ ] **Step 9: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/TipoEquipoCatalogo.java \
        soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/TipoEquipoCatalogoRepository.java \
        soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/TipoEquipoCatalogoRequest.java \
        soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/TipoEquipoCatalogoService.java \
        soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/TipoEquipoCatalogoController.java \
        soportedesk-backend/src/test/java/com/inia/soportedesk/catalogo/TipoEquipoCatalogoServiceTest.java
git commit -m "feat: add TipoEquipoCatalogo CRUD (catalog for normalizing GLPI equipment types)"
```

---

### Task 3: Backend — EquipoEnrichment data layer

**Files:**
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/enrichment/EquipoEnrichment.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/enrichment/EquipoEnrichmentHistorial.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/enrichment/EquipoEnrichmentRepository.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/enrichment/EquipoEnrichmentHistorialRepository.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/enrichment/EquipoEnrichmentDto.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/enrichment/HistorialItemDto.java`

**Interfaces:**
- Produces:
  - `EquipoEnrichmentRepository.findByComputerId(Long): Optional<EquipoEnrichment>`
  - `EquipoEnrichmentRepository.findByComputerIdIn(Collection<Long>): List<EquipoEnrichment>`
  - `EquipoEnrichmentHistorialRepository.findByComputerIdOrderByFechaModificacionDesc(Long): List<EquipoEnrichmentHistorial>`
  - `EquipoEnrichmentDto` record with fields: `tipoOverride, fabricanteOverride, modeloOverride, codigoPatrimonial, estadoDepuracion, observaciones, revisadoPor, fechaRevision`
  - `HistorialItemDto` record with fields: `campo, valorAnterior, valorNuevo, modificadoPor, fechaModificacion`

- [ ] **Step 1: Implement EquipoEnrichment entity**

```java
// soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/enrichment/EquipoEnrichment.java
package com.inia.soportedesk.equipos.enrichment;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "equipos_enrichment")
@Getter @Setter @NoArgsConstructor
public class EquipoEnrichment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "computer_id", nullable = false, unique = true)
    private Long computerId;

    @Column(name = "tipo_override")
    private String tipoOverride;

    @Column(name = "fabricante_override")
    private String fabricanteOverride;

    @Column(name = "modelo_override")
    private String modeloOverride;

    @Column(name = "codigo_patrimonial")
    private String codigoPatrimonial;

    @Column(name = "estado_depuracion")
    private String estadoDepuracion;

    private String observaciones;

    @Column(name = "revisado_por")
    private String revisadoPor;

    @Column(name = "fecha_revision")
    private LocalDateTime fechaRevision;
}
```

- [ ] **Step 2: Implement EquipoEnrichmentHistorial entity**

```java
// soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/enrichment/EquipoEnrichmentHistorial.java
package com.inia.soportedesk.equipos.enrichment;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "equipos_enrichment_historial")
@Getter @Setter @NoArgsConstructor
public class EquipoEnrichmentHistorial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "computer_id", nullable = false)
    private Long computerId;

    @Column(nullable = false)
    private String campo;

    @Column(name = "valor_anterior")
    private String valorAnterior;

    @Column(name = "valor_nuevo")
    private String valorNuevo;

    @Column(name = "modificado_por", nullable = false)
    private String modificadoPor;

    @Column(name = "fecha_modificacion", nullable = false)
    private LocalDateTime fechaModificacion;
}
```

- [ ] **Step 3: Implement repositories**

```java
// soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/enrichment/EquipoEnrichmentRepository.java
package com.inia.soportedesk.equipos.enrichment;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface EquipoEnrichmentRepository extends JpaRepository<EquipoEnrichment, Long> {
    Optional<EquipoEnrichment> findByComputerId(Long computerId);
    List<EquipoEnrichment> findByComputerIdIn(Collection<Long> computerIds);
}
```

```java
// soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/enrichment/EquipoEnrichmentHistorialRepository.java
package com.inia.soportedesk.equipos.enrichment;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EquipoEnrichmentHistorialRepository extends JpaRepository<EquipoEnrichmentHistorial, Long> {
    List<EquipoEnrichmentHistorial> findByComputerIdOrderByFechaModificacionDesc(Long computerId);
}
```

- [ ] **Step 4: Implement DTOs**

```java
// soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/enrichment/EquipoEnrichmentDto.java
package com.inia.soportedesk.equipos.enrichment;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class EquipoEnrichmentDto {
    private String tipoOverride;
    private String fabricanteOverride;
    private String modeloOverride;
    private String codigoPatrimonial;
    private String estadoDepuracion;
    private String observaciones;
    private String revisadoPor;
    private LocalDateTime fechaRevision;
}
```

```java
// soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/enrichment/HistorialItemDto.java
package com.inia.soportedesk.equipos.enrichment;

import java.time.LocalDateTime;

public record HistorialItemDto(
        String campo,
        String valorAnterior,
        String valorNuevo,
        String modificadoPor,
        LocalDateTime fechaModificacion
) {}
```

- [ ] **Step 5: Verify compilation**

```
./mvnw compile -pl soportedesk-backend -q
```
Expected: BUILD SUCCESS.

- [ ] **Step 6: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/enrichment/
git commit -m "feat: add EquipoEnrichment data layer (entities, repositories, DTOs)"
```

---

### Task 4: Backend — EquipoEnrichmentService

**Files:**
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/enrichment/EquipoEnrichmentService.java`
- Test: `soportedesk-backend/src/test/java/com/inia/soportedesk/equipos/enrichment/EquipoEnrichmentServiceTest.java`

**Interfaces:**
- Consumes: `EquipoEnrichmentRepository`, `EquipoEnrichmentHistorialRepository`, `EquipoEnrichmentDto`, `HistorialItemDto`
- Produces:
  - `EquipoEnrichmentService.findByComputerId(Long): Optional<EquipoEnrichmentDto>`
  - `EquipoEnrichmentService.save(Long computerId, EquipoEnrichmentDto dto, String username): EquipoEnrichmentDto`
  - `EquipoEnrichmentService.getHistorial(Long computerId): List<HistorialItemDto>`

- [ ] **Step 1: Write failing test**

```java
// soportedesk-backend/src/test/java/com/inia/soportedesk/equipos/enrichment/EquipoEnrichmentServiceTest.java
package com.inia.soportedesk.equipos.enrichment;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EquipoEnrichmentServiceTest {

    @Mock private EquipoEnrichmentRepository repository;
    @Mock private EquipoEnrichmentHistorialRepository historialRepository;
    @InjectMocks private EquipoEnrichmentService service;

    @Test
    void save_newRecord_createsEntityWithComputerId() {
        when(repository.findByComputerId(42L)).thenReturn(Optional.empty());
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        EquipoEnrichmentDto dto = new EquipoEnrichmentDto();
        dto.setCodigoPatrimonial("PAT-001");
        dto.setEstadoDepuracion("ACTIVO");

        EquipoEnrichmentDto result = service.save(42L, dto, "admin");

        assertThat(result.getCodigoPatrimonial()).isEqualTo("PAT-001");
        assertThat(result.getRevisadoPor()).isEqualTo("admin");
        assertThat(result.getFechaRevision()).isNotNull();
    }

    @Test
    void save_changedField_recordsHistorialEntry() {
        EquipoEnrichment existing = new EquipoEnrichment();
        existing.setComputerId(10L);
        existing.setCodigoPatrimonial("PAT-OLD");
        when(repository.findByComputerId(10L)).thenReturn(Optional.of(existing));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        EquipoEnrichmentDto dto = new EquipoEnrichmentDto();
        dto.setCodigoPatrimonial("PAT-NEW");

        service.save(10L, dto, "gvivanco");

        ArgumentCaptor<EquipoEnrichmentHistorial> captor = ArgumentCaptor.forClass(EquipoEnrichmentHistorial.class);
        verify(historialRepository).save(captor.capture());
        EquipoEnrichmentHistorial recorded = captor.getValue();
        assertThat(recorded.getCampo()).isEqualTo("codigo_patrimonial");
        assertThat(recorded.getValorAnterior()).isEqualTo("PAT-OLD");
        assertThat(recorded.getValorNuevo()).isEqualTo("PAT-NEW");
        assertThat(recorded.getModificadoPor()).isEqualTo("gvivanco");
    }

    @Test
    void save_unchangedField_doesNotRecordHistorial() {
        EquipoEnrichment existing = new EquipoEnrichment();
        existing.setComputerId(10L);
        existing.setCodigoPatrimonial("PAT-SAME");
        when(repository.findByComputerId(10L)).thenReturn(Optional.of(existing));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        EquipoEnrichmentDto dto = new EquipoEnrichmentDto();
        dto.setCodigoPatrimonial("PAT-SAME");

        service.save(10L, dto, "admin");

        verify(historialRepository, never()).save(any());
    }

    @Test
    void getHistorial_mapsToDto() {
        EquipoEnrichmentHistorial h = new EquipoEnrichmentHistorial();
        h.setCampo("estado_depuracion");
        h.setValorAnterior(null);
        h.setValorNuevo("ACTIVO");
        h.setModificadoPor("admin");
        h.setFechaModificacion(java.time.LocalDateTime.now());
        when(historialRepository.findByComputerIdOrderByFechaModificacionDesc(5L)).thenReturn(List.of(h));

        List<HistorialItemDto> result = service.getHistorial(5L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).campo()).isEqualTo("estado_depuracion");
    }
}
```

- [ ] **Step 2: Run test to verify failure**

```
./mvnw test -pl soportedesk-backend -Dtest=EquipoEnrichmentServiceTest
```
Expected: compilation error — `EquipoEnrichmentService` does not exist.

- [ ] **Step 3: Implement service**

```java
// soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/enrichment/EquipoEnrichmentService.java
package com.inia.soportedesk.equipos.enrichment;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class EquipoEnrichmentService {

    private final EquipoEnrichmentRepository repository;
    private final EquipoEnrichmentHistorialRepository historialRepository;

    public Optional<EquipoEnrichmentDto> findByComputerId(Long computerId) {
        return repository.findByComputerId(computerId).map(this::toDto);
    }

    public EquipoEnrichmentDto save(Long computerId, EquipoEnrichmentDto dto, String username) {
        EquipoEnrichment entity = repository.findByComputerId(computerId).orElseGet(() -> {
            EquipoEnrichment e = new EquipoEnrichment();
            e.setComputerId(computerId);
            return e;
        });

        recordChange(computerId, "tipo_override",       entity.getTipoOverride(),       dto.getTipoOverride(),       username);
        recordChange(computerId, "fabricante_override", entity.getFabricanteOverride(), dto.getFabricanteOverride(), username);
        recordChange(computerId, "modelo_override",     entity.getModeloOverride(),     dto.getModeloOverride(),     username);
        recordChange(computerId, "codigo_patrimonial",  entity.getCodigoPatrimonial(),  dto.getCodigoPatrimonial(),  username);
        recordChange(computerId, "estado_depuracion",   entity.getEstadoDepuracion(),   dto.getEstadoDepuracion(),   username);
        recordChange(computerId, "observaciones",       entity.getObservaciones(),      dto.getObservaciones(),      username);

        entity.setTipoOverride(dto.getTipoOverride());
        entity.setFabricanteOverride(dto.getFabricanteOverride());
        entity.setModeloOverride(dto.getModeloOverride());
        entity.setCodigoPatrimonial(dto.getCodigoPatrimonial());
        entity.setEstadoDepuracion(dto.getEstadoDepuracion());
        entity.setObservaciones(dto.getObservaciones());
        entity.setRevisadoPor(username);
        entity.setFechaRevision(LocalDateTime.now());

        return toDto(repository.save(entity));
    }

    public List<HistorialItemDto> getHistorial(Long computerId) {
        return historialRepository.findByComputerIdOrderByFechaModificacionDesc(computerId)
                .stream()
                .map(h -> new HistorialItemDto(
                        h.getCampo(), h.getValorAnterior(), h.getValorNuevo(),
                        h.getModificadoPor(), h.getFechaModificacion()))
                .toList();
    }

    private void recordChange(Long computerId, String campo, String anterior, String nuevo, String username) {
        if (!Objects.equals(anterior, nuevo)) {
            EquipoEnrichmentHistorial h = new EquipoEnrichmentHistorial();
            h.setComputerId(computerId);
            h.setCampo(campo);
            h.setValorAnterior(anterior);
            h.setValorNuevo(nuevo);
            h.setModificadoPor(username);
            h.setFechaModificacion(LocalDateTime.now());
            historialRepository.save(h);
        }
    }

    public EquipoEnrichmentDto toDto(EquipoEnrichment entity) {
        EquipoEnrichmentDto dto = new EquipoEnrichmentDto();
        dto.setTipoOverride(entity.getTipoOverride());
        dto.setFabricanteOverride(entity.getFabricanteOverride());
        dto.setModeloOverride(entity.getModeloOverride());
        dto.setCodigoPatrimonial(entity.getCodigoPatrimonial());
        dto.setEstadoDepuracion(entity.getEstadoDepuracion());
        dto.setObservaciones(entity.getObservaciones());
        dto.setRevisadoPor(entity.getRevisadoPor());
        dto.setFechaRevision(entity.getFechaRevision());
        return dto;
    }
}
```

- [ ] **Step 4: Run tests**

```
./mvnw test -pl soportedesk-backend -Dtest=EquipoEnrichmentServiceTest
```
Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/enrichment/EquipoEnrichmentService.java \
        soportedesk-backend/src/test/java/com/inia/soportedesk/equipos/enrichment/EquipoEnrichmentServiceTest.java
git commit -m "feat: add EquipoEnrichmentService with upsert and per-field audit trail"
```

---

### Task 5: Backend — EquipoEnrichmentController

**Files:**
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/enrichment/EquipoEnrichmentController.java`

**Interfaces:**
- Consumes: `EquipoEnrichmentService.findByComputerId`, `save`, `getHistorial`; Spring `Authentication`
- Produces:
  - `GET /api/equipos/{id}/enrichment` → `200 EquipoEnrichmentDto` or `204 No Content`
  - `PUT /api/equipos/{id}/enrichment` → `200 EquipoEnrichmentDto` (requires `WRITE_equipos`)
  - `GET /api/equipos/{id}/historial` → `200 List<HistorialItemDto>`

- [ ] **Step 1: Implement controller**

```java
// soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/enrichment/EquipoEnrichmentController.java
package com.inia.soportedesk.equipos.enrichment;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/equipos")
@RequiredArgsConstructor
public class EquipoEnrichmentController {

    private final EquipoEnrichmentService service;

    @GetMapping("/{id}/enrichment")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_equipos')")
    public ResponseEntity<EquipoEnrichmentDto> getEnrichment(@PathVariable Long id) {
        return service.findByComputerId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @PutMapping("/{id}/enrichment")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_equipos')")
    public EquipoEnrichmentDto saveEnrichment(@PathVariable Long id,
                                               @RequestBody EquipoEnrichmentDto dto,
                                               Authentication auth) {
        return service.save(id, dto, auth.getName());
    }

    @GetMapping("/{id}/historial")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_equipos')")
    public List<HistorialItemDto> getHistorial(@PathVariable Long id) {
        return service.getHistorial(id);
    }
}
```

- [ ] **Step 2: Verify compilation**

```
./mvnw compile -pl soportedesk-backend -q
```
Expected: BUILD SUCCESS.

- [ ] **Step 3: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/enrichment/EquipoEnrichmentController.java
git commit -m "feat: add EquipoEnrichmentController (GET/PUT enrichment, GET historial)"
```

---

### Task 6: Backend — Tipo efectivo + Salud endpoint

**Files:**
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/EquipoSaludDto.java`
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/EquipoDetalleResponse.java`
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/EquipoService.java`
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/EquipoController.java`
- Modify: `soportedesk-backend/src/test/java/com/inia/soportedesk/equipos/EquipoServiceTest.java`
- Modify: `soportedesk-backend/src/test/java/com/inia/soportedesk/equipos/EquipoControllerIT.java`

**Interfaces:**
- Consumes: `EquipoEnrichmentService`, `TipoEquipoCatalogoRepository`, `EquipoEnrichmentRepository`
- Produces:
  - `EquipoService.findById(Long)` now returns `EquipoDetalleResponse` with `tipoEfectivo` and `enrichment` fields
  - `EquipoService.getSalud()` returns `List<EquipoSaludDto>`
  - `GET /api/equipos/salud` → `List<EquipoSaludDto>`

- [ ] **Step 1: Create EquipoSaludDto**

```java
// soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/EquipoSaludDto.java
package com.inia.soportedesk.equipos;

public record EquipoSaludDto(
        Long computerID,
        String nombreEquipo,
        String sedeNombre,
        String tipoEquipo,
        String usuarioContacto,
        Long sinEncendidoMeses,
        Long sinActualizacionMeses,
        String nivelAlerta,
        boolean sinCodigoPatrimonial,
        boolean sinUsuario,
        boolean sinSede,
        String estadoDepuracion
) {}
```

- [ ] **Step 2: Update EquipoDetalleResponse record**

Replace the entire file:

```java
// soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/EquipoDetalleResponse.java
package com.inia.soportedesk.equipos;

import com.inia.soportedesk.equipos.enrichment.EquipoEnrichmentDto;
import com.inia.soportedesk.glpi.GlpiTeclado;
import com.inia.soportedesk.glpi.SoftwareRow;
import com.inia.soportedesk.glpi.VwInvComputerFull;

import java.util.List;

public record EquipoDetalleResponse(
        VwInvComputerFull equipo,
        List<SoftwareRow> software,
        GlpiTeclado teclado,
        String tipoEfectivo,
        EquipoEnrichmentDto enrichment
) {}
```

- [ ] **Step 3: Add tests for tipo efectivo and salud to EquipoServiceTest**

Add these test methods to the existing `EquipoServiceTest` class (add the new `@Mock` fields and imports too):

```java
// Add to EquipoServiceTest.java — new imports:
import com.inia.soportedesk.catalogo.TipoEquipoCatalogo;
import com.inia.soportedesk.catalogo.TipoEquipoCatalogoRepository;
import com.inia.soportedesk.equipos.enrichment.EquipoEnrichment;
import com.inia.soportedesk.equipos.enrichment.EquipoEnrichmentRepository;
import com.inia.soportedesk.equipos.enrichment.EquipoEnrichmentService;
import java.time.LocalDateTime;
import java.util.Optional;

// Add to class body — new @Mock fields:
@Mock private TipoEquipoCatalogoRepository catalogoRepository;
@Mock private EquipoEnrichmentRepository enrichmentRepository;
@Mock private EquipoEnrichmentService enrichmentService;

// New test methods:
@Test
void findById_noEnrichmentNoMapping_returnsGlpiTypeAsEffective() {
    VwInvComputerFull e = equipo("Desktop", "SEDE CENTRAL");
    e.setComputerID(1L);
    when(repository.findById(1L)).thenReturn(Optional.of(e));
    when(repository.findSoftwareByComputerId(1L)).thenReturn(List.of());
    when(tecladoRepository.findByItemsId(1L)).thenReturn(Optional.empty());
    when(enrichmentRepository.findByComputerId(1L)).thenReturn(Optional.empty());
    when(catalogoRepository.findByGlpiValorAndActivoTrue("Desktop")).thenReturn(Optional.empty());

    EquipoDetalleResponse result = service.findById(1L);

    assertThat(result.tipoEfectivo()).isEqualTo("Desktop");
}

@Test
void findById_catalogoMappingExists_returnsNormalizedType() {
    VwInvComputerFull e = equipo("PC", "SEDE CENTRAL");
    e.setComputerID(2L);
    when(repository.findById(2L)).thenReturn(Optional.of(e));
    when(repository.findSoftwareByComputerId(2L)).thenReturn(List.of());
    when(tecladoRepository.findByItemsId(2L)).thenReturn(Optional.empty());
    when(enrichmentRepository.findByComputerId(2L)).thenReturn(Optional.empty());
    TipoEquipoCatalogo mapping = new TipoEquipoCatalogo();
    mapping.setTipoNormalizado("Desktop");
    when(catalogoRepository.findByGlpiValorAndActivoTrue("PC")).thenReturn(Optional.of(mapping));

    EquipoDetalleResponse result = service.findById(2L);

    assertThat(result.tipoEfectivo()).isEqualTo("Desktop");
}

@Test
void findById_overrideSetInEnrichment_overrideTakesPrecedence() {
    VwInvComputerFull e = equipo("PC", "SEDE CENTRAL");
    e.setComputerID(3L);
    when(repository.findById(3L)).thenReturn(Optional.of(e));
    when(repository.findSoftwareByComputerId(3L)).thenReturn(List.of());
    when(tecladoRepository.findByItemsId(3L)).thenReturn(Optional.empty());
    EquipoEnrichment enrichment = new EquipoEnrichment();
    enrichment.setTipoOverride("All-in-One");
    when(enrichmentRepository.findByComputerId(3L)).thenReturn(Optional.of(enrichment));
    when(enrichmentService.toDto(enrichment)).thenReturn(new com.inia.soportedesk.equipos.enrichment.EquipoEnrichmentDto());

    EquipoDetalleResponse result = service.findById(3L);

    assertThat(result.tipoEfectivo()).isEqualTo("All-in-One");
}
```

- [ ] **Step 4: Run failing tests**

```
./mvnw test -pl soportedesk-backend -Dtest=EquipoServiceTest
```
Expected: compilation error — `EquipoService` constructor mismatch (missing new dependencies).

- [ ] **Step 5: Rewrite EquipoService**

Replace the entire file:

```java
// soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/EquipoService.java
package com.inia.soportedesk.equipos;

import com.inia.soportedesk.catalogo.TipoEquipoCatalogo;
import com.inia.soportedesk.catalogo.TipoEquipoCatalogoRepository;
import com.inia.soportedesk.equipos.enrichment.EquipoEnrichment;
import com.inia.soportedesk.equipos.enrichment.EquipoEnrichmentDto;
import com.inia.soportedesk.equipos.enrichment.EquipoEnrichmentRepository;
import com.inia.soportedesk.equipos.enrichment.EquipoEnrichmentService;
import com.inia.soportedesk.exception.ResourceNotFoundException;
import com.inia.soportedesk.glpi.VwInvComputerFull;
import com.inia.soportedesk.glpi.VwInvComputerFullRepository;
import com.inia.soportedesk.glpi.GlpiTecladoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EquipoService {

    private static final String DESKTOP = "Desktop";
    private static final String LAPTOP = "Laptop";
    private static final String SEDE_CENTRAL = "SEDE CENTRAL";

    private final VwInvComputerFullRepository repository;
    private final GlpiTecladoRepository tecladoRepository;
    private final TipoEquipoCatalogoRepository catalogoRepository;
    private final EquipoEnrichmentRepository enrichmentRepository;
    private final EquipoEnrichmentService enrichmentService;

    public List<VwInvComputerFull> findAll(String search, String sede, String tipo,
                                            String dependencia, String subdependencia, String fabricante) {
        return repository.findFiltered(
                blankToNull(search), blankToNull(sede), blankToNull(tipo),
                blankToNull(dependencia), blankToNull(subdependencia), blankToNull(fabricante));
    }

    public EquipoKpisDto getKpis() {
        List<VwInvComputerFull> equipos = repository.findFiltered(null, null, null, null, null, null);
        long totalActivos = equipos.size();
        long desktopCount = equipos.stream().filter(e -> DESKTOP.equals(e.getTipoEquipo())).count();
        long laptopCount = equipos.stream().filter(e -> LAPTOP.equals(e.getTipoEquipo())).count();
        long otrosCount = totalActivos - desktopCount - laptopCount;
        long sedeCentralCount = equipos.stream().filter(e -> SEDE_CENTRAL.equals(e.getSedeNombre())).count();
        long eeasCount = totalActivos - sedeCentralCount;
        return new EquipoKpisDto(totalActivos, desktopCount, laptopCount, otrosCount, sedeCentralCount, eeasCount);
    }

    public List<String> findSedes() { return repository.findDistinctSedes(); }
    public List<String> findTipos() { return repository.findDistinctTipos(); }
    public List<String> findDependencias(String sede) { return repository.findDistinctDependencias(blankToNull(sede)); }
    public List<String> findSubdependencias(String sede, String dep) { return repository.findDistinctSubdependencias(blankToNull(sede), blankToNull(dep)); }
    public List<String> findFabricantes() { return repository.findDistinctFabricantes(); }

    public EquipoDetalleResponse findById(Long id) {
        VwInvComputerFull equipo = repository.findById(id)
                .filter(e -> e.getEliminado() == null || e.getEliminado() == 0)
                .orElseThrow(() -> new ResourceNotFoundException("Equipo no encontrado: " + id));

        EquipoEnrichment enrichment = enrichmentRepository.findByComputerId(id).orElse(null);
        String tipoEfectivo = resolveTipo(equipo.getTipoEquipo(), enrichment);
        EquipoEnrichmentDto enrichmentDto = enrichment != null ? enrichmentService.toDto(enrichment) : null;

        return new EquipoDetalleResponse(
                equipo,
                repository.findSoftwareByComputerId(id),
                tecladoRepository.findByItemsId(id).orElse(null),
                tipoEfectivo,
                enrichmentDto);
    }

    public List<EquipoSaludDto> getSalud() {
        List<VwInvComputerFull> all = repository.findFiltered(null, null, null, null, null, null);
        List<Long> ids = all.stream().map(VwInvComputerFull::getComputerID).toList();
        Map<Long, EquipoEnrichment> enrichmentMap = enrichmentRepository.findByComputerIdIn(ids).stream()
                .collect(Collectors.toMap(EquipoEnrichment::getComputerId, e -> e));
        LocalDateTime now = LocalDateTime.now();
        return all.stream()
                .map(e -> buildSaludDto(e, enrichmentMap.get(e.getComputerID()), now))
                .filter(s -> !s.nivelAlerta().equals("OK")
                          || s.sinCodigoPatrimonial()
                          || s.sinUsuario()
                          || s.sinSede())
                .toList();
    }

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

    private String resolveTipo(String glpiTipo, EquipoEnrichment enrichment) {
        if (enrichment != null && enrichment.getTipoOverride() != null) {
            return enrichment.getTipoOverride();
        }
        if (glpiTipo != null) {
            return catalogoRepository.findByGlpiValorAndActivoTrue(glpiTipo)
                    .map(TipoEquipoCatalogo::getTipoNormalizado)
                    .orElse(glpiTipo);
        }
        return glpiTipo;
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }
}
```

- [ ] **Step 6: Fix EquipoControllerIT — stale mock for findAll**

In `EquipoControllerIT.java`, update the stub from 3-arg to 6-arg signature:

```java
// Replace this line:
when(service.findAll(null, null, null)).thenReturn(List.of(equipo));
// With:
when(service.findAll(null, null, null, null, null, null)).thenReturn(List.of(equipo));
```

- [ ] **Step 7: Add salud endpoint to EquipoController**

In `EquipoController.java`, add after the `findFabricantes` endpoint:

```java
@GetMapping("/salud")
@PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_equipos')")
public List<EquipoSaludDto> getSalud() {
    return service.getSalud();
}
```

Also add import `import java.util.List;` if not already present.

- [ ] **Step 8: Run all equipo tests**

```
./mvnw test -pl soportedesk-backend -Dtest="EquipoServiceTest,EquipoControllerIT"
```
Expected: all tests pass.

- [ ] **Step 9: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/EquipoSaludDto.java \
        soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/EquipoDetalleResponse.java \
        soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/EquipoService.java \
        soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/EquipoController.java \
        soportedesk-backend/src/test/java/com/inia/soportedesk/equipos/EquipoServiceTest.java \
        soportedesk-backend/src/test/java/com/inia/soportedesk/equipos/EquipoControllerIT.java
git commit -m "feat: add tipo efectivo logic and salud endpoint to EquipoService"
```

---

### Task 7: Frontend — Models + Service

**Files:**
- Modify: `soportedesk-frontend/src/app/features/equipos/equipo.model.ts`
- Modify: `soportedesk-frontend/src/app/features/equipos/equipo.service.ts`
- Modify: `soportedesk-frontend/src/app/core/models/catalogo.model.ts`
- Modify: `soportedesk-frontend/src/app/core/catalogos/catalogo.service.ts`

**Interfaces:**
- Produces:
  - `EquipoEnrichmentDto`, `HistorialItemDto`, `EquipoSaludDto` interfaces in `equipo.model.ts`
  - `EquipoDetalleResponse` updated to include `tipoEfectivo: string` and `enrichment: EquipoEnrichmentDto | null`
  - `EquipoService.getEnrichment(id)`, `saveEnrichment(id, dto)`, `getHistorial(id)`, `getSalud()`
  - `TipoEquipoCatalogo` interface in `catalogo.model.ts`
  - `CatalogoService` methods for tipo-equipo CRUD

- [ ] **Step 1: Update equipo.model.ts**

Add these interfaces at the end of the file (after existing interfaces):

```typescript
export interface EquipoEnrichmentDto {
  tipoOverride: string | null;
  fabricanteOverride: string | null;
  modeloOverride: string | null;
  codigoPatrimonial: string | null;
  estadoDepuracion: string | null;
  observaciones: string | null;
  revisadoPor: string | null;
  fechaRevision: string | null;
}

export interface HistorialItemDto {
  campo: string;
  valorAnterior: string | null;
  valorNuevo: string | null;
  modificadoPor: string;
  fechaModificacion: string;
}

export interface EquipoSaludDto {
  computerID: number;
  nombreEquipo: string;
  sedeNombre: string | null;
  tipoEquipo: string | null;
  usuarioContacto: string | null;
  sinEncendidoMeses: number;
  sinActualizacionMeses: number;
  nivelAlerta: 'OK' | 'AMARILLO' | 'ROJO';
  sinCodigoPatrimonial: boolean;
  sinUsuario: boolean;
  sinSede: boolean;
  estadoDepuracion: string | null;
}
```

Also update the `EquipoDetalleResponse` interface — replace the existing definition:

```typescript
export interface EquipoDetalleResponse {
  equipo: EquipoDetalle;
  software: EquipoSoftware[];
  teclado: EquipoTeclado | null;
  tipoEfectivo: string;
  enrichment: EquipoEnrichmentDto | null;
}
```

- [ ] **Step 2: Update equipo.service.ts**

Add these four methods to `EquipoService` class:

```typescript
getEnrichment(id: number): Observable<EquipoEnrichmentDto | null> {
  return this.http.get<EquipoEnrichmentDto>(`${this.apiUrl}/${id}/enrichment`).pipe(
    catchError((err) => err.status === 204 ? of(null) : throwError(() => err))
  );
}

saveEnrichment(id: number, dto: EquipoEnrichmentDto): Observable<EquipoEnrichmentDto> {
  return this.http.put<EquipoEnrichmentDto>(`${this.apiUrl}/${id}/enrichment`, dto);
}

getHistorial(id: number): Observable<HistorialItemDto[]> {
  return this.http.get<HistorialItemDto[]>(`${this.apiUrl}/${id}/historial`);
}

getSalud(): Observable<EquipoSaludDto[]> {
  return this.http.get<EquipoSaludDto[]>(`${this.apiUrl}/salud`);
}
```

Add these imports to the top of `equipo.service.ts`:

```typescript
import { catchError, of, throwError } from 'rxjs';
import { EquipoEnrichmentDto, EquipoSaludDto, HistorialItemDto } from './equipo.model';
```

Update the existing `EquipoResumen`, `EquipoDetalle`, etc. imports line to remove `EquipoDetalleResponse` from its own import (it's now updated in the model).

- [ ] **Step 3: Add TipoEquipoCatalogo to catalogo.model.ts**

Append to the end of `soportedesk-frontend/src/app/core/models/catalogo.model.ts`:

```typescript
export interface TipoEquipoCatalogo {
  id: number;
  glpiValor: string;
  tipoNormalizado: string;
  activo: boolean;
}

export interface TipoEquipoCatalogoRequest {
  glpiValor: string;
  tipoNormalizado: string;
}
```

- [ ] **Step 4: Add tipo-equipo methods to CatalogoService**

Append these methods to `CatalogoService` in `catalogo.service.ts`:

```typescript
getTiposEquipo(): Observable<TipoEquipoCatalogo[]> {
  return this.http.get<TipoEquipoCatalogo[]>(`${this.apiUrl}/tipo-equipo`);
}

createTipoEquipo(request: TipoEquipoCatalogoRequest): Observable<TipoEquipoCatalogo> {
  return this.http.post<TipoEquipoCatalogo>(`${this.apiUrl}/tipo-equipo`, request);
}

updateTipoEquipo(id: number, request: TipoEquipoCatalogoRequest): Observable<TipoEquipoCatalogo> {
  return this.http.put<TipoEquipoCatalogo>(`${this.apiUrl}/tipo-equipo/${id}`, request);
}

deleteTipoEquipo(id: number): Observable<void> {
  return this.http.delete<void>(`${this.apiUrl}/tipo-equipo/${id}`);
}
```

Add the `TipoEquipoCatalogo, TipoEquipoCatalogoRequest` imports to the import line in `catalogo.service.ts`.

- [ ] **Step 5: Commit**

```bash
git add soportedesk-frontend/src/app/features/equipos/equipo.model.ts \
        soportedesk-frontend/src/app/features/equipos/equipo.service.ts \
        soportedesk-frontend/src/app/core/models/catalogo.model.ts \
        soportedesk-frontend/src/app/core/catalogos/catalogo.service.ts
git commit -m "feat: add enrichment/salud models and service methods to Angular frontend"
```

---

### Task 8: Frontend — Detail page: Mantenimiento section

**Files:**
- Modify: `soportedesk-frontend/src/app/features/equipos/equipo-detail.component.ts`
- Modify: `soportedesk-frontend/src/app/features/equipos/equipo-detail.component.html`
- Modify: `soportedesk-frontend/src/app/features/equipos/equipo-detail.component.scss`

**Interfaces:**
- Consumes: `EquipoService.getEnrichment`, `saveEnrichment`, `getHistorial`; `AuthService.canWrite('equipos')`
- Produces: Mantenimiento section visible to users with WRITE permission; historial list below the form.

- [ ] **Step 1: Update equipo-detail.component.ts**

Replace the entire file:

```typescript
// soportedesk-frontend/src/app/features/equipos/equipo-detail.component.ts
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { EquipoDetalle, EquipoEnrichmentDto, EquipoSoftware, EquipoTeclado, HistorialItemDto } from './equipo.model';
import { EquipoService } from './equipo.service';

interface MonitorRow { nombre: string; modelo: string; fabricante: string; serial: string; }

@Component({
  selector: 'app-equipo-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './equipo-detail.component.html',
  styleUrl: './equipo-detail.component.scss',
})
export class EquipoDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(EquipoService);
  private authService = inject(AuthService);

  private computerId = 0;

  equipo = signal<EquipoDetalle | null>(null);
  tipoEfectivo = signal<string | null>(null);
  software = signal<EquipoSoftware[]>([]);
  teclado = signal<EquipoTeclado | null>(null);
  enrichment = signal<EquipoEnrichmentDto | null>(null);
  historial = signal<HistorialItemDto[]>([]);
  softwareFilter = signal('');
  saving = signal(false);
  saveSuccess = signal(false);

  canEdit = this.authService.canWrite('equipos');

  form: EquipoEnrichmentDto = {
    tipoOverride: null, fabricanteOverride: null, modeloOverride: null,
    codigoPatrimonial: null, estadoDepuracion: null, observaciones: null,
    revisadoPor: null, fechaRevision: null,
  };

  estadoOptions = ['ACTIVO', 'EN_REVISION', 'BAJA', 'EXTRAVIADO'];

  monitores = computed(() => this.parseMonitores(this.equipo()));
  filteredSoftware = computed(() => {
    const term = this.softwareFilter().trim().toLowerCase();
    if (!term) return this.software();
    return this.software().filter((row) => row.software?.toLowerCase().includes(term));
  });

  ngOnInit(): void {
    this.computerId = Number(this.route.snapshot.paramMap.get('id'));
    this.service.getDetalle(this.computerId).subscribe((response) => {
      this.equipo.set(response.equipo);
      this.tipoEfectivo.set(response.tipoEfectivo);
      this.software.set(response.software ?? []);
      this.teclado.set(response.teclado);
      if (response.enrichment) {
        this.enrichment.set(response.enrichment);
        this.form = { ...response.enrichment };
      }
    });
    if (this.canEdit) {
      this.service.getHistorial(this.computerId).subscribe((h) => this.historial.set(h));
    }
  }

  saveEnrichment(): void {
    this.saving.set(true);
    this.service.saveEnrichment(this.computerId, this.form).subscribe({
      next: (saved) => {
        this.enrichment.set(saved);
        this.form = { ...saved };
        this.saving.set(false);
        this.saveSuccess.set(true);
        setTimeout(() => this.saveSuccess.set(false), 2500);
        this.service.getHistorial(this.computerId).subscribe((h) => this.historial.set(h));
      },
      error: () => this.saving.set(false),
    });
  }

  back(): void { this.router.navigate(['/equipos']); }

  stripDomain(value: string | null | undefined): string {
    return (value ?? '').replace(/@INIA-RED$/i, '');
  }

  gbLabel(value: number | null | undefined): string {
    return value == null ? '-' : `${value} GB`;
  }

  empty(value: unknown): string {
    return value == null || value === '' ? '-' : String(value);
  }

  private parseMonitores(equipo: EquipoDetalle | null): MonitorRow[] {
    if (!equipo || !equipo.monCantidad) return [];
    const nombres = this.splitPipe(equipo.monNombres);
    const modelos = this.splitPipe(equipo.monModelos);
    const fabricantes = this.splitPipe(equipo.monFabricantes);
    const seriales = this.splitPipe(equipo.monSeriales);
    const count = Math.max(equipo.monCantidad, nombres.length, modelos.length, fabricantes.length, seriales.length);
    return Array.from({ length: count }, (_, i) => ({
      nombre: nombres[i] ?? '-', modelo: modelos[i] ?? '-',
      fabricante: fabricantes[i] ?? '-', serial: seriales[i] ?? '-',
    }));
  }

  private splitPipe(value: string | null | undefined): string[] {
    return (value ?? '').split('|').map((p) => p.trim()).filter(Boolean);
  }
}
```

- [ ] **Step 2: Add Mantenimiento section to equipo-detail.component.html**

Append this block before the closing `</div>` of the root element:

```html
  <!-- Mantenimiento — visible only for users with WRITE_equipos or ADMIN -->
  <ng-container *ngIf="canEdit">
    <section class="section-band mantenimiento-section">
      <h3>Mantenimiento</h3>

      <p class="tipo-efectivo-info">
        Tipo efectivo: <strong>{{ tipoEfectivo() || equipo()?.tipoEquipo || '-' }}</strong>
        <span class="glpi-raw" *ngIf="equipo()?.tipoEquipo !== tipoEfectivo()">
          (GLPI: {{ equipo()?.tipoEquipo }})
        </span>
      </p>

      <div class="info-grid form-grid">
        <label>
          <span>Tipo override</span>
          <input type="text" [(ngModel)]="form.tipoOverride" placeholder="Dejar vacío para usar catálogo" />
        </label>
        <label>
          <span>Código patrimonial</span>
          <input type="text" [(ngModel)]="form.codigoPatrimonial" />
        </label>
        <label>
          <span>Estado depuración</span>
          <select [(ngModel)]="form.estadoDepuracion">
            <option [ngValue]="null">Sin definir</option>
            <option *ngFor="let opt of estadoOptions" [value]="opt">{{ opt }}</option>
          </select>
        </label>
        <label>
          <span>Fabricante override</span>
          <input type="text" [(ngModel)]="form.fabricanteOverride" />
        </label>
        <label>
          <span>Modelo override</span>
          <input type="text" [(ngModel)]="form.modeloOverride" />
        </label>
        <label class="full-width">
          <span>Observaciones</span>
          <textarea [(ngModel)]="form.observaciones" rows="2"></textarea>
        </label>
      </div>

      <div class="form-actions">
        <span class="save-ok" *ngIf="saveSuccess()">Guardado correctamente</span>
        <button type="button" (click)="saveEnrichment()" [disabled]="saving()">
          {{ saving() ? 'Guardando...' : 'Guardar cambios' }}
        </button>
        <small *ngIf="enrichment()?.revisadoPor">
          Última revisión: {{ enrichment()?.revisadoPor }} — {{ enrichment()?.fechaRevision | date:'dd/MM/yyyy HH:mm' }}
        </small>
      </div>
    </section>

    <section class="section-band" *ngIf="historial().length > 0">
      <h3>Historial de cambios</h3>
      <div class="simple-table">
        <table>
          <thead>
            <tr><th>Fecha</th><th>Usuario</th><th>Campo</th><th>Anterior</th><th>Nuevo</th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let h of historial()">
              <td>{{ h.fechaModificacion | date:'dd/MM/yy HH:mm' }}</td>
              <td>{{ h.modificadoPor }}</td>
              <td>{{ h.campo }}</td>
              <td>{{ h.valorAnterior || '-' }}</td>
              <td>{{ h.valorNuevo || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </ng-container>
```

- [ ] **Step 3: Add styles to equipo-detail.component.scss**

Append at the end:

```scss
.mantenimiento-section {
  border-top: 2px solid var(--color-accent, #3b82f6);

  .tipo-efectivo-info {
    margin-bottom: 1rem;
    font-size: 0.9rem;
    .glpi-raw { color: var(--color-muted, #6b7280); margin-left: 0.5rem; }
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 0.75rem;
    label { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.85rem; }
    input, select, textarea {
      padding: 0.4rem 0.5rem;
      border: 1px solid var(--color-border, #d1d5db);
      border-radius: 4px;
      font-size: 0.9rem;
    }
    .full-width { grid-column: 1 / -1; }
  }

  .form-actions {
    margin-top: 1rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
    button { padding: 0.4rem 1.2rem; cursor: pointer; }
    button:disabled { opacity: 0.6; cursor: default; }
    .save-ok { color: #16a34a; font-size: 0.85rem; font-weight: 600; }
    small { color: var(--color-muted, #6b7280); font-size: 0.78rem; }
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add soportedesk-frontend/src/app/features/equipos/equipo-detail.component.ts \
        soportedesk-frontend/src/app/features/equipos/equipo-detail.component.html \
        soportedesk-frontend/src/app/features/equipos/equipo-detail.component.scss
git commit -m "feat: add Mantenimiento section to equipo detail (enrichment form + historial)"
```

---

### Task 9: Frontend — List page: Salud tab + alert badge

**Files:**
- Modify: `soportedesk-frontend/src/app/features/equipos/equipos-list.component.ts`
- Modify: `soportedesk-frontend/src/app/features/equipos/equipos-list.component.html`
- Modify: `soportedesk-frontend/src/app/features/equipos/equipos-list.component.scss`

**Interfaces:**
- Consumes: `EquipoService.getSalud()`, `EquipoSaludDto`
- Produces: Tab toggle between "Inventario" and "Salud"; alert badge dot in each row of the main list; health table in Salud tab.

- [ ] **Step 1: Update equipos-list.component.ts**

Add the following signals and method to the existing `EquiposListComponent` class. Add imports first:

```typescript
import { EquipoKpis, EquipoResumen, EquipoSaludDto } from './equipo.model';
```

Add these new members to the class body (after existing signals):

```typescript
activeTab = signal<'inventario' | 'salud'>('inventario');
saludItems = signal<EquipoSaludDto[]>([]);
saludLoaded = signal(false);

saludMap = computed(() => {
  const map = new Map<number, EquipoSaludDto>();
  this.saludItems().forEach((s) => map.set(s.computerID, s));
  return map;
});

saludKpis = computed(() => {
  const items = this.saludItems();
  return {
    rojos: items.filter((s) => s.nivelAlerta === 'ROJO').length,
    amarillos: items.filter((s) => s.nivelAlerta === 'AMARILLO').length,
    sinPatrimonial: items.filter((s) => s.sinCodigoPatrimonial).length,
    sinUsuario: items.filter((s) => s.sinUsuario).length,
  };
});

alertBadge(item: EquipoTableRow): 'OK' | 'AMARILLO' | 'ROJO' {
  return this.saludMap().get(item.computerID)?.nivelAlerta ?? 'OK';
}
```

Add to `ngOnInit()` (alongside the existing parallel calls):

```typescript
this.loadSalud();
```

Add new method:

```typescript
private loadSalud(): void {
  this.service.getSalud().subscribe((data) => {
    this.saludItems.set(data);
    this.saludLoaded.set(true);
  });
}

setTab(tab: 'inventario' | 'salud'): void {
  this.activeTab.set(tab);
}
```

- [ ] **Step 2: Update equipos-list.component.html**

Replace the section starting from `<section class="kpi-grid">` and add the tab toggle. Insert after the `<div class="module-header">` block and before `<section class="kpi-grid">`:

```html
  <div class="tab-bar">
    <button [class.active]="activeTab() === 'inventario'" (click)="setTab('inventario')">
      Inventario
    </button>
    <button [class.active]="activeTab() === 'salud'" (click)="setTab('salud')">
      Salud del inventario
      <span class="badge-rojo" *ngIf="saludKpis().rojos > 0">{{ saludKpis().rojos }}</span>
    </button>
  </div>
```

Wrap the existing content (from `<section class="kpi-grid">` to end of `<section class="mobile-equipment-list">`) with:

```html
<ng-container *ngIf="activeTab() === 'inventario'">
  <!-- existing kpi-grid, filter-bar, desktop-table-shell, mobile-equipment-list content -->
</ng-container>
```

In the existing table columns definition, add badge rendering by updating the `GenericTable` — add a `badgeKey` column or, simpler, add the badge info as a computed column in `toTableRow`. Add `alertBadgeLabel` to `EquipoTableRow`:

In `toTableRow`, add:
```typescript
alertBadgeLabel: this.alertBadge({ ...item, usuarioLimpio: '', fabricanteModelo: '', cpuCorto: '', ramLabel: '', diskLabel: '' } as EquipoTableRow),
```

Actually simpler — use the signal directly in the template. In the `<article *ngFor>` in the mobile list, add:

```html
<span class="alert-badge" [class]="'badge-' + alertBadge(item).toLowerCase()"></span>
```

After the tab bar, add the Salud tab content:

```html
<ng-container *ngIf="activeTab() === 'salud'">
  <section class="kpi-grid">
    <article class="kpi-card tone-red">
      <span>Sin encender &gt;12m</span>
      <strong>{{ saludKpis().rojos }}</strong>
    </article>
    <article class="kpi-card tone-yellow">
      <span>Alerta amarilla</span>
      <strong>{{ saludKpis().amarillos }}</strong>
    </article>
    <article class="kpi-card tone-gray">
      <span>Sin patrimonial</span>
      <strong>{{ saludKpis().sinPatrimonial }}</strong>
    </article>
    <article class="kpi-card tone-gray">
      <span>Sin usuario</span>
      <strong>{{ saludKpis().sinUsuario }}</strong>
    </article>
  </section>

  <div class="desktop-table-shell">
    <table class="salud-table">
      <thead>
        <tr>
          <th>Alerta</th><th>Equipo</th><th>Sede</th><th>Tipo</th>
          <th>Sin encender (meses)</th><th>Sin actualizar (meses)</th>
          <th>Sin patrimonial</th><th>Sin usuario</th><th>Estado</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let s of saludItems()" [class]="'row-' + s.nivelAlerta.toLowerCase()">
          <td><span class="alert-dot" [class]="'dot-' + s.nivelAlerta.toLowerCase()"></span></td>
          <td>
            <button class="link-btn" (click)="router.navigate(['/equipos', s.computerID])">
              {{ s.nombreEquipo }}
            </button>
          </td>
          <td>{{ s.sedeNombre || '-' }}</td>
          <td>{{ s.tipoEquipo || '-' }}</td>
          <td>{{ s.sinEncendidoMeses < 0 ? 'Nunca' : s.sinEncendidoMeses }}</td>
          <td>{{ s.sinActualizacionMeses < 0 ? 'N/D' : s.sinActualizacionMeses }}</td>
          <td>{{ s.sinCodigoPatrimonial ? 'Sí' : 'No' }}</td>
          <td>{{ s.sinUsuario ? 'Sí' : 'No' }}</td>
          <td>{{ s.estadoDepuracion || '-' }}</td>
        </tr>
        <tr *ngIf="saludItems().length === 0 && saludLoaded()">
          <td colspan="9" class="empty-cell">Sin registros con alertas activas</td>
        </tr>
      </tbody>
    </table>
  </div>
</ng-container>
```

Make the `router` field public in `equipos-list.component.ts` (change `private router` to `router`).

- [ ] **Step 3: Add Salud tab styles to equipos-list.component.scss**

Append at the end:

```scss
.tab-bar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  button {
    padding: 0.4rem 1rem;
    border: 1px solid var(--color-border, #d1d5db);
    border-radius: 6px;
    background: transparent;
    cursor: pointer;
    position: relative;
    &.active { background: var(--color-accent, #3b82f6); color: #fff; border-color: transparent; }
    .badge-rojo {
      display: inline-block;
      background: #ef4444;
      color: #fff;
      border-radius: 9999px;
      font-size: 0.7rem;
      padding: 0 0.4rem;
      margin-left: 0.4rem;
      font-weight: 700;
    }
  }
}

.alert-dot {
  display: inline-block;
  width: 10px; height: 10px;
  border-radius: 50%;
  &.dot-rojo    { background: #ef4444; }
  &.dot-amarillo { background: #f59e0b; }
  &.dot-ok      { background: #22c55e; }
}

.salud-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
  th, td { padding: 0.4rem 0.6rem; border-bottom: 1px solid var(--color-border, #e5e7eb); text-align: left; }
  .row-rojo    { background: #fef2f2; }
  .row-amarillo { background: #fffbeb; }
  .link-btn { background: none; border: none; cursor: pointer; color: var(--color-accent, #3b82f6); text-decoration: underline; padding: 0; }
  .empty-cell { text-align: center; color: var(--color-muted, #6b7280); padding: 2rem; }
}

.tone-yellow { --card-accent: #f59e0b; }
.tone-red    { --card-accent: #ef4444; }
```

- [ ] **Step 4: Commit**

```bash
git add soportedesk-frontend/src/app/features/equipos/equipos-list.component.ts \
        soportedesk-frontend/src/app/features/equipos/equipos-list.component.html \
        soportedesk-frontend/src/app/features/equipos/equipos-list.component.scss
git commit -m "feat: add Salud del Inventario tab and alert badges to equipos list"
```

---

### Task 10: Frontend — Catálogos: Tipos de Equipo tab

**Files:**
- Modify: `soportedesk-frontend/src/app/features/catalogos/catalogos.component.ts`
- Modify: `soportedesk-frontend/src/app/features/catalogos/catalogos.component.html`

**Interfaces:**
- Consumes: `CatalogoService.getTiposEquipo`, `createTipoEquipo`, `updateTipoEquipo`, `deleteTipoEquipo`; `TipoEquipoCatalogo`, `TipoEquipoCatalogoRequest`

- [ ] **Step 1: Update catalogos.component.ts**

Add `'tiposEquipo'` to the `CatalogoTab` union type:

```typescript
type CatalogoTab = 'sedes' | ... | 'modelosImpresora' | 'tiposEquipo';
```

Add data + form state properties to the class body (alongside the existing list properties):

```typescript
tiposEquipo: TipoEquipoCatalogo[] = [];
tipoEquipoForm = { glpiValor: '', tipoNormalizado: '' };
editingTipoEquipoId: number | null = null;
tipoEquipoFormOpen = false;
```

In `loadAll()`, add:

```typescript
this.service.getTiposEquipo().subscribe((data) => (this.tiposEquipo = data));
```

In `tabLabel()` labels record, add:

```typescript
tiposEquipo: 'Tipo de equipo GLPI',
```

Add these methods to the class:

```typescript
startAddTipoEquipo(): void {
  this.editingTipoEquipoId = null;
  this.tipoEquipoForm = { glpiValor: '', tipoNormalizado: '' };
  this.tipoEquipoFormOpen = true;
}

startEditTipoEquipo(item: TipoEquipoCatalogo): void {
  this.editingTipoEquipoId = item.id;
  this.tipoEquipoForm = { glpiValor: item.glpiValor, tipoNormalizado: item.tipoNormalizado };
  this.tipoEquipoFormOpen = true;
}

submitTipoEquipo(): void {
  if (!this.tipoEquipoForm.glpiValor.trim() || !this.tipoEquipoForm.tipoNormalizado.trim()) return;
  const obs = this.editingTipoEquipoId
    ? this.service.updateTipoEquipo(this.editingTipoEquipoId, this.tipoEquipoForm)
    : this.service.createTipoEquipo(this.tipoEquipoForm);
  obs.subscribe(() => {
    this.tipoEquipoFormOpen = false;
    this.loadAll();
  });
}

deleteTipoEquipo(id: number, glpiValor: string): void {
  this.pendingDelete = { tab: 'tiposEquipo', id, title: glpiValor };
}
```

Add `TipoEquipoCatalogo, TipoEquipoCatalogoRequest` to the imports from `catalogo.model`.

Update `deleteItem` to handle `tiposEquipo`:

```typescript
} else if (tab === 'tiposEquipo') {
  obs = this.service.deleteTipoEquipo(id);
}
```

- [ ] **Step 2: Add Tipos de Equipo tab to catalogos.component.html**

Add tab button alongside the existing buttons:

```html
<button [class.active]="activeTab === 'tiposEquipo'" (click)="setTab('tiposEquipo')">Tipos de Equipo GLPI</button>
```

Add the tab content block (alongside the other `<ng-container *ngIf>` blocks):

```html
<!-- Tipos de Equipo GLPI -->
<ng-container *ngIf="activeTab === 'tiposEquipo'">
  <div class="catalog-toolbar">
    <div><span>Gestionando</span><strong>Tipos de Equipo GLPI</strong></div>
    <button type="button" (click)="startAddTipoEquipo()">Agregar</button>
  </div>

  <table>
    <thead>
      <tr><th>Valor GLPI</th><th>Tipo Normalizado</th><th>Activo</th><th>Acciones</th></tr>
    </thead>
    <tbody>
      <tr *ngFor="let item of tiposEquipo">
        <td>{{ item.glpiValor }}</td>
        <td>{{ item.tipoNormalizado }}</td>
        <td>{{ item.activo ? 'Sí' : 'No' }}</td>
        <td>
          <button (click)="startEditTipoEquipo(item)">Editar</button>
          <button class="danger" (click)="deleteTipoEquipo(item.id, item.glpiValor)">Desactivar</button>
        </td>
      </tr>
    </tbody>
  </table>

  <div class="form" *ngIf="tipoEquipoFormOpen">
    <input [(ngModel)]="tipoEquipoForm.glpiValor" placeholder="Valor GLPI (ej: PC)" />
    <input [(ngModel)]="tipoEquipoForm.tipoNormalizado" placeholder="Tipo normalizado (ej: Desktop)" />
    <button (click)="submitTipoEquipo()">{{ editingTipoEquipoId ? 'Actualizar' : 'Agregar' }}</button>
    <button class="secondary" (click)="tipoEquipoFormOpen = false">Cancelar</button>
  </div>
</ng-container>
```

- [ ] **Step 3: Commit**

```bash
git add soportedesk-frontend/src/app/features/catalogos/catalogos.component.ts \
        soportedesk-frontend/src/app/features/catalogos/catalogos.component.html
git commit -m "feat: add Tipos de Equipo GLPI tab to Catálogos (catalog normalization CRUD)"
```

---

## Self-Review

### Spec coverage check

| Spec requirement | Task |
|---|---|
| 3 new SQL tables | Task 1 |
| Catálogo tipo-equipo CRUD (backend) | Task 2 |
| Tipo efectivo: override → catálogo → raw | Task 6 |
| EquipoEnrichment upsert with per-field historial | Tasks 3–4 |
| GET/PUT enrichment + GET historial endpoints | Task 5 |
| Salud endpoint with all 4 criteria | Task 6 |
| WRITE_equipos authorization on write endpoints | Tasks 5, 6 |
| Frontend: EquipoEnrichmentDto, EquipoSaludDto, HistorialItemDto | Task 7 |
| Detail page: Mantenimiento section (form + historial) | Task 8 |
| List page: Salud tab + alert badges | Task 9 |
| Catálogos: Tipos de Equipo tab | Task 10 |
| GLPI BD never written | Enforced by `@Immutable` — no changes to GLPI datasource |

### Type consistency check

- `EquipoDetalleResponse` record: `(VwInvComputerFull, List<SoftwareRow>, GlpiTeclado, String tipoEfectivo, EquipoEnrichmentDto)` — matches Task 6 construction and Task 7 frontend model.
- `EquipoEnrichmentService.toDto` is `public` — used by both `EquipoEnrichmentController` (via `findByComputerId`) and `EquipoService.findById`. ✓
- `EquipoEnrichmentRepository.findByComputerIdIn` uses `Collection<Long>` — compatible with `List<Long>` input in `getSalud`. ✓
- `EquipoSaludDto` fields match between Task 6 record and Task 7 TypeScript interface. ✓
- `CatalogoTab` union in Task 10 includes `'tiposEquipo'` — `deleteItem` switch handles it. ✓
