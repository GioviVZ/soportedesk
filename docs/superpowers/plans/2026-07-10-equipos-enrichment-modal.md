# Módulo Equipos — Modal de Enriquecimiento + Ubicación/Serie + Alertas Ampliadas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move equipment enrichment editing (patrimonial code, type, sede/dependencia/subdependencia override, serial override, observations) out of the equipment detail page and into a modal opened directly from the Mantenimiento queue, and widen the "incomplete" health criteria to cover the new location/serial fields.

**Architecture:** Backend adds 4 nullable columns to `equipos_enrichment` (3 FKs to the existing `catalogo` tables `sedes`/`dependencias`/`subdependencias`, 1 varchar) plus matching DTO/service/salud-calculation changes. Frontend removes the enrichment section from `EquipoDetailComponent` and adds a new standalone `EquipoEnrichmentModalComponent` (wraps the shared `<app-modal>` + `<app-ubicacion-select>`) opened from `EquiposMantenimientoComponent`'s "Ver" button.

**Tech Stack:** Spring Boot 3 / JPA / SQL Server (backend), Angular 17 standalone components + signals (frontend).

**Precedent spec:** `docs/superpowers/specs/2026-07-10-equipos-enrichment-modal-design.md` (read this if anything below is ambiguous — it is the source of truth this plan implements).

## Global Constraints

- Migration file must follow the idempotent `IF COL_LENGTH(...) IS NULL BEGIN ... END; GO` pattern already used in `docs/superpowers/migrations/2026-07-07-vpn-titular-externo.sql` — never a bare `ALTER TABLE` outside that guard.
- `tipoOverride` stays a plain `String` on the entity/DTO — only the frontend restricts it to a `<select>` of catalog values. No backend schema change for it.
- Sede/Dependencia/Subdependencia overrides are FK ids resolved server-side; the entity stores the relations (`Sede`/`Dependencia`/`Subdependencia`), never raw text.
- Historial entries for sede/dependencia/subdependencia/serie must store the **name** (or raw string for serie), never the numeric id — same readability rule the rest of the historial already follows.
- "Incompleto" criterion for every new/changed flag is **GLPI-or-override**: a field only counts as missing when both the GLPI view and the enrichment override are empty.
- `EquipoSaludResumen` / `getDashboardCompleto()` dashboard aggregation is explicitly out of scope — do not add the new flags there.
- Backend unit tests use Mockito `MockitoExtension` in **strict stubs** mode — never leave a `when(...)` stub that the code path no longer reaches (it will throw `UnnecessaryStubbingException`).

---

## File Structure

**Backend — modified:**
- `soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/enrichment/EquipoEnrichment.java` — add `sede`/`dependencia`/`subdependencia`/`numeroSerieOverride`
- `soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/enrichment/EquipoEnrichmentDto.java` — add matching id/nombre fields
- `soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/enrichment/EquipoEnrichmentService.java` — resolve FKs, record historial by name
- `soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/EquipoSaludDto.java` — add 3 new flags
- `soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/EquipoService.java` — extend `calcularSalud`/`buildSaludDto`/`getSalud`, simplify `findById`
- `soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/EquipoDetalleResponse.java` — drop `enrichment` field
- `soportedesk-backend/src/test/java/com/inia/soportedesk/equipos/enrichment/EquipoEnrichmentServiceTest.java`
- `soportedesk-backend/src/test/java/com/inia/soportedesk/equipos/EquipoServiceTest.java`

**Backend — new:**
- `docs/superpowers/migrations/2026-07-10-equipos-enrichment-ubicacion.sql`

**Frontend — modified:**
- `soportedesk-frontend/src/app/features/equipos/equipo.model.ts`
- `soportedesk-frontend/src/app/features/equipos/equipo-detail.component.ts` / `.html` / `.scss` — remove enrichment section
- `soportedesk-frontend/src/app/features/equipos/equipos-mantenimiento.component.ts` / `.html` — open modal instead of navigating

**Frontend — new:**
- `soportedesk-frontend/src/app/features/equipos/equipo-enrichment-modal.component.ts` / `.html` / `.scss`

---

### Task 1: Migration — add ubicación/serie columns to `equipos_enrichment`

**Files:**
- Create: `docs/superpowers/migrations/2026-07-10-equipos-enrichment-ubicacion.sql`

**Interfaces:**
- Produces: columns `sede_id`, `dependencia_id`, `subdependencia_id` (all `BIGINT NULL`, FK to `dbo.sedes`/`dbo.dependencias`/`dbo.subdependencias`) and `numero_serie_override` (`NVARCHAR(100) NULL`) on `dbo.equipos_enrichment`, which Task 2's JPA entity maps onto.

- [ ] **Step 1: Create the migration file**

```sql
-- Migracion: campos de ubicacion (sede/dependencia/subdependencia) y numero de serie
-- override para el enriquecimiento de equipos GLPI.
-- Ejecutar en: ssti (SQL Server)
-- Idempotente: se puede volver a ejecutar sin duplicar columnas.

IF COL_LENGTH('dbo.equipos_enrichment', 'sede_id') IS NULL
BEGIN
    ALTER TABLE dbo.equipos_enrichment ADD sede_id BIGINT NULL;
    ALTER TABLE dbo.equipos_enrichment ADD CONSTRAINT fk_equipos_enrichment_sede
        FOREIGN KEY (sede_id) REFERENCES dbo.sedes(id);
END;
GO

IF COL_LENGTH('dbo.equipos_enrichment', 'dependencia_id') IS NULL
BEGIN
    ALTER TABLE dbo.equipos_enrichment ADD dependencia_id BIGINT NULL;
    ALTER TABLE dbo.equipos_enrichment ADD CONSTRAINT fk_equipos_enrichment_dependencia
        FOREIGN KEY (dependencia_id) REFERENCES dbo.dependencias(id);
END;
GO

IF COL_LENGTH('dbo.equipos_enrichment', 'subdependencia_id') IS NULL
BEGIN
    ALTER TABLE dbo.equipos_enrichment ADD subdependencia_id BIGINT NULL;
    ALTER TABLE dbo.equipos_enrichment ADD CONSTRAINT fk_equipos_enrichment_subdependencia
        FOREIGN KEY (subdependencia_id) REFERENCES dbo.subdependencias(id);
END;
GO

IF COL_LENGTH('dbo.equipos_enrichment', 'numero_serie_override') IS NULL
BEGIN
    ALTER TABLE dbo.equipos_enrichment ADD numero_serie_override NVARCHAR(100) NULL;
END;
GO

-- Verificacion
SELECT sede_id, dependencia_id, subdependencia_id, numero_serie_override
FROM dbo.equipos_enrichment WHERE 1 = 0;
GO
```

- [ ] **Step 2: Run it against the `ssti` SQL Server database**

Per this project's convention (see `docs/ARQUITECTURA.md` §9.1), migrations are run manually via SSMS or `sqlcmd` against the `ssti` database — not automated by the app. Run the file, then confirm the four columns exist:

```sql
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'equipos_enrichment'
  AND COLUMN_NAME IN ('sede_id', 'dependencia_id', 'subdependencia_id', 'numero_serie_override');
```
Expected: 4 rows, all `IS_NULLABLE = 'YES'`.

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/migrations/2026-07-10-equipos-enrichment-ubicacion.sql
git commit -m "feat(equipos): add sede/dependencia/subdependencia/serie columns to equipos_enrichment"
```

---

### Task 2: Backend — `EquipoEnrichment`/`EquipoEnrichmentDto`/`EquipoEnrichmentService` gain ubicación + serie override

**Files:**
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/enrichment/EquipoEnrichment.java`
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/enrichment/EquipoEnrichmentDto.java`
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/enrichment/EquipoEnrichmentService.java`
- Modify: `soportedesk-backend/src/test/java/com/inia/soportedesk/equipos/enrichment/EquipoEnrichmentServiceTest.java`

**Interfaces:**
- Consumes: `com.inia.soportedesk.catalogo.Sede`, `Dependencia`, `Subdependencia`, `SedeRepository`, `DependenciaRepository`, `SubdependenciaRepository` (all pre-existing, each repository extends `JpaRepository<X, Long>` so `findById(Long): Optional<X>` is inherited).
- Produces: `EquipoEnrichment.getSede()/getDependencia()/getSubdependencia()/getNumeroSerieOverride()` (used by Task 3's `calcularSalud`); `EquipoEnrichmentDto` gains `sedeId/sedeNombre/dependenciaId/dependenciaNombre/subdependenciaId/subdependenciaNombre/numeroSerieOverride` (used by the frontend modal in Task 7).

- [ ] **Step 1: Write the failing tests**

Replace `soportedesk-backend/src/test/java/com/inia/soportedesk/equipos/enrichment/EquipoEnrichmentServiceTest.java` with:

```java
package com.inia.soportedesk.equipos.enrichment;

import com.inia.soportedesk.catalogo.Dependencia;
import com.inia.soportedesk.catalogo.DependenciaRepository;
import com.inia.soportedesk.catalogo.Sede;
import com.inia.soportedesk.catalogo.SedeRepository;
import com.inia.soportedesk.catalogo.Subdependencia;
import com.inia.soportedesk.catalogo.SubdependenciaRepository;
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
    @Mock private SedeRepository sedeRepository;
    @Mock private DependenciaRepository dependenciaRepository;
    @Mock private SubdependenciaRepository subdependenciaRepository;
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

    @Test
    void save_withSedeDependenciaSubdependencia_resolvesEntitiesAndReturnsIdsAndNombres() {
        when(repository.findByComputerId(20L)).thenReturn(Optional.empty());
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Sede sede = new Sede();
        sede.setId(1L);
        sede.setNombre("SEDE CENTRAL");
        Dependencia dependencia = new Dependencia();
        dependencia.setId(2L);
        dependencia.setNombre("UTI");
        Subdependencia subdependencia = new Subdependencia();
        subdependencia.setId(3L);
        subdependencia.setNombre("Soporte");

        when(sedeRepository.findById(1L)).thenReturn(Optional.of(sede));
        when(dependenciaRepository.findById(2L)).thenReturn(Optional.of(dependencia));
        when(subdependenciaRepository.findById(3L)).thenReturn(Optional.of(subdependencia));

        EquipoEnrichmentDto dto = new EquipoEnrichmentDto();
        dto.setSedeId(1L);
        dto.setDependenciaId(2L);
        dto.setSubdependenciaId(3L);
        dto.setNumeroSerieOverride("SN-001");

        EquipoEnrichmentDto result = service.save(20L, dto, "admin");

        assertThat(result.getSedeId()).isEqualTo(1L);
        assertThat(result.getSedeNombre()).isEqualTo("SEDE CENTRAL");
        assertThat(result.getDependenciaId()).isEqualTo(2L);
        assertThat(result.getDependenciaNombre()).isEqualTo("UTI");
        assertThat(result.getSubdependenciaId()).isEqualTo(3L);
        assertThat(result.getSubdependenciaNombre()).isEqualTo("Soporte");
        assertThat(result.getNumeroSerieOverride()).isEqualTo("SN-001");
    }

    @Test
    void save_sedeChanged_recordsHistorialWithNombreNotId() {
        Sede oldSede = new Sede();
        oldSede.setId(1L);
        oldSede.setNombre("SEDE CENTRAL");
        EquipoEnrichment existing = new EquipoEnrichment();
        existing.setComputerId(21L);
        existing.setSede(oldSede);
        when(repository.findByComputerId(21L)).thenReturn(Optional.of(existing));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Sede newSede = new Sede();
        newSede.setId(2L);
        newSede.setNombre("EEA ANDENES");
        when(sedeRepository.findById(2L)).thenReturn(Optional.of(newSede));

        EquipoEnrichmentDto dto = new EquipoEnrichmentDto();
        dto.setSedeId(2L);

        service.save(21L, dto, "admin");

        ArgumentCaptor<EquipoEnrichmentHistorial> captor = ArgumentCaptor.forClass(EquipoEnrichmentHistorial.class);
        verify(historialRepository).save(captor.capture());
        EquipoEnrichmentHistorial recorded = captor.getValue();
        assertThat(recorded.getCampo()).isEqualTo("sede");
        assertThat(recorded.getValorAnterior()).isEqualTo("SEDE CENTRAL");
        assertThat(recorded.getValorNuevo()).isEqualTo("EEA ANDENES");
    }

    @Test
    void save_numeroSerieOverrideChanged_recordsHistorial() {
        EquipoEnrichment existing = new EquipoEnrichment();
        existing.setComputerId(22L);
        existing.setNumeroSerieOverride("SN-OLD");
        when(repository.findByComputerId(22L)).thenReturn(Optional.of(existing));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        EquipoEnrichmentDto dto = new EquipoEnrichmentDto();
        dto.setNumeroSerieOverride("SN-NEW");

        service.save(22L, dto, "admin");

        ArgumentCaptor<EquipoEnrichmentHistorial> captor = ArgumentCaptor.forClass(EquipoEnrichmentHistorial.class);
        verify(historialRepository).save(captor.capture());
        assertThat(captor.getValue().getCampo()).isEqualTo("numero_serie_override");
        assertThat(captor.getValue().getValorAnterior()).isEqualTo("SN-OLD");
        assertThat(captor.getValue().getValorNuevo()).isEqualTo("SN-NEW");
    }
}
```

- [ ] **Step 2: Run tests to verify they fail to compile (fields/methods don't exist yet)**

Run: `cd soportedesk-backend && mvn test -Dtest=EquipoEnrichmentServiceTest`
Expected: **compile error** — `EquipoEnrichmentDto` has no `setSedeId`/`getSedeId`/etc., `EquipoEnrichment` has no `setSede`/`getNumeroSerieOverride`, and no constructor param for `SedeRepository` etc.

- [ ] **Step 3: Add the new fields to `EquipoEnrichment`**

Modify `soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/enrichment/EquipoEnrichment.java`:

```java
package com.inia.soportedesk.equipos.enrichment;

import com.inia.soportedesk.catalogo.Dependencia;
import com.inia.soportedesk.catalogo.Sede;
import com.inia.soportedesk.catalogo.Subdependencia;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "equipos_enrichment")
@Getter
@Setter
@NoArgsConstructor
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

    @ManyToOne
    @JoinColumn(name = "sede_id")
    private Sede sede;

    @ManyToOne
    @JoinColumn(name = "dependencia_id")
    private Dependencia dependencia;

    @ManyToOne
    @JoinColumn(name = "subdependencia_id")
    private Subdependencia subdependencia;

    @Column(name = "numero_serie_override")
    private String numeroSerieOverride;

    @Column(name = "estado_depuracion")
    private String estadoDepuracion;

    private String observaciones;

    @Column(name = "revisado_por")
    private String revisadoPor;

    @Column(name = "fecha_revision")
    private LocalDateTime fechaRevision;
}
```

- [ ] **Step 4: Add the new fields to `EquipoEnrichmentDto`**

Replace `soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/enrichment/EquipoEnrichmentDto.java`:

```java
package com.inia.soportedesk.equipos.enrichment;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class EquipoEnrichmentDto {
    private String tipoOverride;
    private String fabricanteOverride;
    private String modeloOverride;
    private String codigoPatrimonial;
    private Long sedeId;
    private String sedeNombre;
    private Long dependenciaId;
    private String dependenciaNombre;
    private Long subdependenciaId;
    private String subdependenciaNombre;
    private String numeroSerieOverride;
    private String estadoDepuracion;
    private String observaciones;
    private String revisadoPor;
    private LocalDateTime fechaRevision;
}
```

- [ ] **Step 5: Update `EquipoEnrichmentService`**

Replace `soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/enrichment/EquipoEnrichmentService.java`:

```java
package com.inia.soportedesk.equipos.enrichment;

import com.inia.soportedesk.catalogo.Dependencia;
import com.inia.soportedesk.catalogo.DependenciaRepository;
import com.inia.soportedesk.catalogo.Sede;
import com.inia.soportedesk.catalogo.SedeRepository;
import com.inia.soportedesk.catalogo.Subdependencia;
import com.inia.soportedesk.catalogo.SubdependenciaRepository;
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
    private final SedeRepository sedeRepository;
    private final DependenciaRepository dependenciaRepository;
    private final SubdependenciaRepository subdependenciaRepository;

    public Optional<EquipoEnrichmentDto> findByComputerId(Long computerId) {
        return repository.findByComputerId(computerId).map(this::toDto);
    }

    public EquipoEnrichmentDto save(Long computerId, EquipoEnrichmentDto dto, String username) {
        EquipoEnrichment entity = repository.findByComputerId(computerId).orElseGet(() -> {
            EquipoEnrichment e = new EquipoEnrichment();
            e.setComputerId(computerId);
            return e;
        });

        Sede sede = dto.getSedeId() != null ? sedeRepository.findById(dto.getSedeId()).orElse(null) : null;
        Dependencia dependencia = dto.getDependenciaId() != null
                ? dependenciaRepository.findById(dto.getDependenciaId()).orElse(null) : null;
        Subdependencia subdependencia = dto.getSubdependenciaId() != null
                ? subdependenciaRepository.findById(dto.getSubdependenciaId()).orElse(null) : null;

        recordChange(computerId, "tipo_override",         entity.getTipoOverride(),         dto.getTipoOverride(),         username);
        recordChange(computerId, "fabricante_override",   entity.getFabricanteOverride(),   dto.getFabricanteOverride(),   username);
        recordChange(computerId, "modelo_override",       entity.getModeloOverride(),       dto.getModeloOverride(),       username);
        recordChange(computerId, "codigo_patrimonial",    entity.getCodigoPatrimonial(),    dto.getCodigoPatrimonial(),    username);
        recordChange(computerId, "estado_depuracion",     entity.getEstadoDepuracion(),     dto.getEstadoDepuracion(),     username);
        recordChange(computerId, "observaciones",         entity.getObservaciones(),        dto.getObservaciones(),       username);
        recordChange(computerId, "numero_serie_override", entity.getNumeroSerieOverride(),  dto.getNumeroSerieOverride(), username);
        recordChange(computerId, "sede",           nombreDe(entity.getSede()),           nombreDe(sede),           username);
        recordChange(computerId, "dependencia",    nombreDe(entity.getDependencia()),    nombreDe(dependencia),    username);
        recordChange(computerId, "subdependencia", nombreDe(entity.getSubdependencia()), nombreDe(subdependencia), username);

        entity.setTipoOverride(dto.getTipoOverride());
        entity.setFabricanteOverride(dto.getFabricanteOverride());
        entity.setModeloOverride(dto.getModeloOverride());
        entity.setCodigoPatrimonial(dto.getCodigoPatrimonial());
        entity.setEstadoDepuracion(dto.getEstadoDepuracion());
        entity.setObservaciones(dto.getObservaciones());
        entity.setNumeroSerieOverride(dto.getNumeroSerieOverride());
        entity.setSede(sede);
        entity.setDependencia(dependencia);
        entity.setSubdependencia(subdependencia);
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
        dto.setNumeroSerieOverride(entity.getNumeroSerieOverride());
        if (entity.getSede() != null) {
            dto.setSedeId(entity.getSede().getId());
            dto.setSedeNombre(entity.getSede().getNombre());
        }
        if (entity.getDependencia() != null) {
            dto.setDependenciaId(entity.getDependencia().getId());
            dto.setDependenciaNombre(entity.getDependencia().getNombre());
        }
        if (entity.getSubdependencia() != null) {
            dto.setSubdependenciaId(entity.getSubdependencia().getId());
            dto.setSubdependenciaNombre(entity.getSubdependencia().getNombre());
        }
        return dto;
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

    private String nombreDe(Sede sede) {
        return sede != null ? sede.getNombre() : null;
    }

    private String nombreDe(Dependencia dependencia) {
        return dependencia != null ? dependencia.getNombre() : null;
    }

    private String nombreDe(Subdependencia subdependencia) {
        return subdependencia != null ? subdependencia.getNombre() : null;
    }
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd soportedesk-backend && mvn test -Dtest=EquipoEnrichmentServiceTest`
Expected: `Tests run: 7, Failures: 0, Errors: 0` (BUILD SUCCESS)

- [ ] **Step 7: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/enrichment/EquipoEnrichment.java soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/enrichment/EquipoEnrichmentDto.java soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/enrichment/EquipoEnrichmentService.java soportedesk-backend/src/test/java/com/inia/soportedesk/equipos/enrichment/EquipoEnrichmentServiceTest.java
git commit -m "feat(equipos): add sede/dependencia/subdependencia/serie override to enrichment"
```

---

### Task 3: Backend — widen "incompleto" salud criteria (`EquipoSaludDto` + `EquipoService`)

**Files:**
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/EquipoSaludDto.java`
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/EquipoService.java`
- Modify: `soportedesk-backend/src/test/java/com/inia/soportedesk/equipos/EquipoServiceTest.java`

**Interfaces:**
- Consumes: `EquipoEnrichment.getSede()/getDependencia()/getSubdependencia()/getNumeroSerieOverride()` from Task 2.
- Produces: `EquipoSaludDto.sinDependencia()/sinSubdependencia()/sinNumeroSerie()` (consumed by the frontend `EquipoSaludItem` in Task 5 and by the mantenimiento table in Task 8).

- [ ] **Step 1: Write the failing tests**

Add these tests to `soportedesk-backend/src/test/java/com/inia/soportedesk/equipos/EquipoServiceTest.java` (insert after `getSalud_okEquiposExcluded_unlessDataMissing`), and **update** that existing test as shown (it must now also close the 3 new flags, otherwise it will regress once the filter is widened):

```java
    @Test
    void getSalud_okEquiposExcluded_unlessDataMissing() {
        VwInvComputerFull bueno = equipo("Desktop", "SEDE CENTRAL");
        bueno.setComputerID(6L);
        bueno.setNombreEquipo("PC-BUENA");
        bueno.setUsuarioContacto("maria");
        bueno.setUltimoEncendido(LocalDateTime.now().minusMonths(1));
        bueno.setUltimaActualizacion(LocalDateTime.now().minusMonths(1));
        bueno.setOficinaId("UTI");
        bueno.setUnidadId("Soporte");
        bueno.setNumeroserie("SN-BUENA");

        EquipoEnrichment enrich = new EquipoEnrichment();
        enrich.setComputerId(6L);
        enrich.setCodigoPatrimonial("PAT-001");

        when(repository.findFiltered(null, null, null, null, null, null)).thenReturn(List.of(bueno));
        when(enrichmentRepository.findByComputerIdIn(List.of(6L))).thenReturn(List.of(enrich));

        List<EquipoSaludDto> result = service.getSalud();

        assertThat(result).isEmpty();
    }

    @Test
    void getSalud_sinDependencia_trueWhenGlpiEmptyAndNoOverride() {
        VwInvComputerFull equipo = equipo("Desktop", "SEDE CENTRAL");
        equipo.setComputerID(40L);
        equipo.setUsuarioContacto("ana");
        equipo.setUnidadId("Soporte");
        equipo.setNumeroserie("SN-40");
        equipo.setOficinaId(null);
        equipo.setUltimoEncendido(LocalDateTime.now());
        equipo.setUltimaActualizacion(LocalDateTime.now());

        EquipoEnrichment enrich = new EquipoEnrichment();
        enrich.setComputerId(40L);
        enrich.setCodigoPatrimonial("PAT-40");

        when(repository.findFiltered(null, null, null, null, null, null)).thenReturn(List.of(equipo));
        when(enrichmentRepository.findByComputerIdIn(List.of(40L))).thenReturn(List.of(enrich));

        List<EquipoSaludDto> result = service.getSalud();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).sinDependencia()).isTrue();
    }

    @Test
    void getSalud_sinDependencia_falseWhenOverridePresent() {
        VwInvComputerFull equipo = equipo("Desktop", "SEDE CENTRAL");
        equipo.setComputerID(41L);
        equipo.setUsuarioContacto("ana");
        equipo.setUnidadId("Soporte");
        equipo.setNumeroserie("SN-41");
        equipo.setOficinaId(null);
        equipo.setUltimoEncendido(LocalDateTime.now());
        equipo.setUltimaActualizacion(LocalDateTime.now());

        Dependencia dependencia = new Dependencia();
        dependencia.setId(1L);
        dependencia.setNombre("UTI");
        EquipoEnrichment enrich = new EquipoEnrichment();
        enrich.setComputerId(41L);
        enrich.setCodigoPatrimonial("PAT-41");
        enrich.setDependencia(dependencia);

        when(repository.findFiltered(null, null, null, null, null, null)).thenReturn(List.of(equipo));
        when(enrichmentRepository.findByComputerIdIn(List.of(41L))).thenReturn(List.of(enrich));

        List<EquipoSaludDto> result = service.getSalud();

        assertThat(result).isEmpty();
    }

    @Test
    void getSalud_sinDependencia_falseWhenGlpiHasData() {
        VwInvComputerFull equipo = equipo("Desktop", "SEDE CENTRAL");
        equipo.setComputerID(42L);
        equipo.setUsuarioContacto("ana");
        equipo.setOficinaId("UTI");
        equipo.setUnidadId("Soporte");
        equipo.setNumeroserie("SN-42");
        equipo.setUltimoEncendido(LocalDateTime.now());
        equipo.setUltimaActualizacion(LocalDateTime.now());

        EquipoEnrichment enrich = new EquipoEnrichment();
        enrich.setComputerId(42L);
        enrich.setCodigoPatrimonial("PAT-42");

        when(repository.findFiltered(null, null, null, null, null, null)).thenReturn(List.of(equipo));
        when(enrichmentRepository.findByComputerIdIn(List.of(42L))).thenReturn(List.of(enrich));

        List<EquipoSaludDto> result = service.getSalud();

        assertThat(result).isEmpty();
    }

    @Test
    void getSalud_sinSubdependencia_trueWhenGlpiEmptyAndNoOverride() {
        VwInvComputerFull equipo = equipo("Desktop", "SEDE CENTRAL");
        equipo.setComputerID(43L);
        equipo.setUsuarioContacto("ana");
        equipo.setOficinaId("UTI");
        equipo.setNumeroserie("SN-43");
        equipo.setUnidadId(null);
        equipo.setUltimoEncendido(LocalDateTime.now());
        equipo.setUltimaActualizacion(LocalDateTime.now());

        EquipoEnrichment enrich = new EquipoEnrichment();
        enrich.setComputerId(43L);
        enrich.setCodigoPatrimonial("PAT-43");

        when(repository.findFiltered(null, null, null, null, null, null)).thenReturn(List.of(equipo));
        when(enrichmentRepository.findByComputerIdIn(List.of(43L))).thenReturn(List.of(enrich));

        List<EquipoSaludDto> result = service.getSalud();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).sinSubdependencia()).isTrue();
    }

    @Test
    void getSalud_sinNumeroSerie_trueWhenGlpiEmptyAndNoOverride() {
        VwInvComputerFull equipo = equipo("Desktop", "SEDE CENTRAL");
        equipo.setComputerID(44L);
        equipo.setUsuarioContacto("ana");
        equipo.setOficinaId("UTI");
        equipo.setUnidadId("Soporte");
        equipo.setNumeroserie(null);
        equipo.setUltimoEncendido(LocalDateTime.now());
        equipo.setUltimaActualizacion(LocalDateTime.now());

        EquipoEnrichment enrich = new EquipoEnrichment();
        enrich.setComputerId(44L);
        enrich.setCodigoPatrimonial("PAT-44");

        when(repository.findFiltered(null, null, null, null, null, null)).thenReturn(List.of(equipo));
        when(enrichmentRepository.findByComputerIdIn(List.of(44L))).thenReturn(List.of(enrich));

        List<EquipoSaludDto> result = service.getSalud();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).sinNumeroSerie()).isTrue();
    }

    @Test
    void getSalud_sinNumeroSerie_falseWhenOverridePresent() {
        VwInvComputerFull equipo = equipo("Desktop", "SEDE CENTRAL");
        equipo.setComputerID(45L);
        equipo.setUsuarioContacto("ana");
        equipo.setOficinaId("UTI");
        equipo.setUnidadId("Soporte");
        equipo.setNumeroserie(null);
        equipo.setUltimoEncendido(LocalDateTime.now());
        equipo.setUltimaActualizacion(LocalDateTime.now());

        EquipoEnrichment enrich = new EquipoEnrichment();
        enrich.setComputerId(45L);
        enrich.setCodigoPatrimonial("PAT-45");
        enrich.setNumeroSerieOverride("SN-OVERRIDE");

        when(repository.findFiltered(null, null, null, null, null, null)).thenReturn(List.of(equipo));
        when(enrichmentRepository.findByComputerIdIn(List.of(45L))).thenReturn(List.of(enrich));

        List<EquipoSaludDto> result = service.getSalud();

        assertThat(result).isEmpty();
    }
```

Add the missing import at the top of the file (needed by the new tests):

```java
import com.inia.soportedesk.catalogo.Dependencia;
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd soportedesk-backend && mvn test -Dtest=EquipoServiceTest`
Expected: compile error (`sinDependencia()`/`sinSubdependencia()`/`sinNumeroSerie()` don't exist on `EquipoSaludDto`) and/or the updated `getSalud_okEquiposExcluded_unlessDataMissing` failing once it compiles (extra flags not yet computed).

- [ ] **Step 3: Add the 3 new flags to `EquipoSaludDto`**

Replace `soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/EquipoSaludDto.java`:

```java
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
        boolean sinDependencia,
        boolean sinSubdependencia,
        boolean sinNumeroSerie,
        String estadoDepuracion
) {}
```

- [ ] **Step 4: Extend `calcularSalud`/`buildSaludDto`/`getSalud` in `EquipoService`**

In `soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/EquipoService.java`, replace the `SaludCalculo` record, `calcularSalud`, `buildSaludDto`, and the `getSalud` filter:

```java
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
                          || s.sinSede()
                          || s.sinDependencia()
                          || s.sinSubdependencia()
                          || s.sinNumeroSerie())
                .toList();
    }

    private record SaludCalculo(
            String nivel, boolean sinPatrimonial, boolean sinUsuario, boolean sinSede,
            boolean sinDependencia, boolean sinSubdependencia, boolean sinNumeroSerie,
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

        boolean sinPatrimonial = enrichment == null || blank(enrichment.getCodigoPatrimonial());
        boolean sinUsuario = blank(e.getUsuarioContacto());
        boolean sinSede = blank(e.getSedeNombre()) && (enrichment == null || enrichment.getSede() == null);
        boolean sinDependencia = blank(e.getOficinaId()) && (enrichment == null || enrichment.getDependencia() == null);
        boolean sinSubdependencia = blank(e.getUnidadId()) && (enrichment == null || enrichment.getSubdependencia() == null);
        boolean sinNumeroSerie = blank(e.getNumeroserie())
                && (enrichment == null || blank(enrichment.getNumeroSerieOverride()));

        return new SaludCalculo(nivel, sinPatrimonial, sinUsuario, sinSede,
                sinDependencia, sinSubdependencia, sinNumeroSerie,
                sinEncendido == Long.MAX_VALUE ? -1L : sinEncendido,
                sinActualizacion == Long.MAX_VALUE ? -1L : sinActualizacion);
    }

    private boolean blank(String value) {
        return value == null || value.isBlank();
    }

    private EquipoSaludDto buildSaludDto(VwInvComputerFull e, EquipoEnrichment enrichment, LocalDateTime now) {
        SaludCalculo calculo = calcularSalud(e, enrichment, now);
        String estadoDepuracion = enrichment != null ? enrichment.getEstadoDepuracion() : null;

        return new EquipoSaludDto(
                e.getComputerID(), e.getNombreEquipo(), e.getSedeNombre(), e.getTipoEquipo(),
                e.getUsuarioContacto(),
                calculo.sinEncendidoMeses(), calculo.sinActualizacionMeses(),
                calculo.nivel(), calculo.sinPatrimonial(), calculo.sinUsuario(), calculo.sinSede(),
                calculo.sinDependencia(), calculo.sinSubdependencia(), calculo.sinNumeroSerie(),
                estadoDepuracion);
    }
```

Leave `getDashboardCompleto()` untouched — it calls `calcularSalud(...)` and only reads `calculo.nivel()/sinPatrimonial()/sinUsuario()/sinSede()`, all of which still exist on the widened record, so it keeps compiling with no changes.

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd soportedesk-backend && mvn test -Dtest=EquipoServiceTest`
Expected: `Tests run: 15, Failures: 0, Errors: 0` (BUILD SUCCESS)

- [ ] **Step 6: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/EquipoSaludDto.java soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/EquipoService.java soportedesk-backend/src/test/java/com/inia/soportedesk/equipos/EquipoServiceTest.java
git commit -m "feat(equipos): widen incompleto criteria with dependencia/subdependencia/serie"
```

---

### Task 4: Backend — drop `enrichment` from `EquipoDetalleResponse`

**Files:**
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/EquipoDetalleResponse.java`
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/EquipoService.java`
- Modify: `soportedesk-backend/src/test/java/com/inia/soportedesk/equipos/EquipoServiceTest.java`

**Interfaces:**
- Produces: `EquipoDetalleResponse(equipo, software, teclado, oficina, tipoEfectivo)` — 5 components instead of 6 (consumed by Task 5's `equipo.model.ts` and Task 6's `EquipoDetailComponent`).

- [ ] **Step 1: Update the existing test that stubs the now-removed call**

In `soportedesk-backend/src/test/java/com/inia/soportedesk/equipos/EquipoServiceTest.java`:
- Remove the field `@Mock private EquipoEnrichmentService enrichmentService;`
- Remove the import `import com.inia.soportedesk.equipos.enrichment.EquipoEnrichmentService;`
- In `findById_tipoOverride_winsOverGlpiAndCatalog`, remove the line `when(enrichmentService.toDto(enrichment)).thenReturn(null);`

- [ ] **Step 2: Run test to verify it fails**

Run: `cd soportedesk-backend && mvn test -Dtest=EquipoServiceTest#findById_tipoOverride_winsOverGlpiAndCatalog`
Expected: **compile error** — `EquipoService`'s constructor still requires an `EquipoEnrichmentService` argument that `@InjectMocks` can no longer resolve from the trimmed mock set, and `EquipoDetalleResponse` still has 6 components. (If it happens to compile because Mockito falls back to `null` injection, it will still pass at this stage — that's fine, the real check is Step 4.)

- [ ] **Step 3: Simplify `EquipoDetalleResponse`**

Replace `soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/EquipoDetalleResponse.java`:

```java
package com.inia.soportedesk.equipos;

import com.inia.soportedesk.glpi.GlpiComputerOficina;
import com.inia.soportedesk.glpi.GlpiTeclado;
import com.inia.soportedesk.glpi.SoftwareRow;
import com.inia.soportedesk.glpi.VwInvComputerFull;

import java.util.List;

public record EquipoDetalleResponse(
        VwInvComputerFull equipo,
        List<SoftwareRow> software,
        GlpiTeclado teclado,
        GlpiComputerOficina oficina,
        String tipoEfectivo
) {}
```

- [ ] **Step 4: Update `EquipoService.findById` and drop the unused `enrichmentService` dependency**

In `soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/EquipoService.java`:
- Remove the field `private final EquipoEnrichmentService enrichmentService;` and its import `com.inia.soportedesk.equipos.enrichment.EquipoEnrichmentService`.
- Replace `findById`:

```java
    public EquipoDetalleResponse findById(Long id) {
        VwInvComputerFull equipo = repository.findById(id)
                .filter(e -> e.getEliminado() == null || e.getEliminado() == 0)
                .orElseThrow(() -> new ResourceNotFoundException("Equipo no encontrado: " + id));

        EquipoEnrichment enrichment = enrichmentRepository.findByComputerId(id).orElse(null);
        String tipoEfectivo = resolveTipo(equipo.getTipoEquipo(), enrichment);

        return new EquipoDetalleResponse(
                equipo,
                repository.findSoftwareByComputerId(id),
                tecladoRepository.findByItemsId(id).orElse(null),
                oficinaRepository.findByItemsId(id).orElse(null),
                tipoEfectivo);
    }
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd soportedesk-backend && mvn test -Dtest=EquipoServiceTest`
Expected: `Tests run: 15, Failures: 0, Errors: 0` (BUILD SUCCESS)

- [ ] **Step 6: Run the full backend suite**

Run: `cd soportedesk-backend && mvn test`
Expected: BUILD SUCCESS, no other test references `EquipoDetalleResponse.enrichment()` or the removed constructor arg (confirms `EquipoEnrichmentController`/`EquipoController` don't touch this record shape directly).

- [ ] **Step 7: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/EquipoDetalleResponse.java soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/EquipoService.java soportedesk-backend/src/test/java/com/inia/soportedesk/equipos/EquipoServiceTest.java
git commit -m "refactor(equipos): drop enrichment from EquipoDetalleResponse"
```

---

### Task 5: Frontend — update `equipo.model.ts`

**Files:**
- Modify: `soportedesk-frontend/src/app/features/equipos/equipo.model.ts`

**Interfaces:**
- Produces: updated `EquipoEnrichmentDto`, `EquipoSaludItem`, `EquipoDetalleResponse` interfaces consumed by Tasks 6-8.

- [ ] **Step 1: Update the interfaces**

In `soportedesk-frontend/src/app/features/equipos/equipo.model.ts`, replace `EquipoEnrichmentDto`:

```typescript
export interface EquipoEnrichmentDto {
  tipoOverride: string | null;
  fabricanteOverride: string | null;
  modeloOverride: string | null;
  codigoPatrimonial: string | null;
  sedeId: number | null;
  sedeNombre: string | null;
  dependenciaId: number | null;
  dependenciaNombre: string | null;
  subdependenciaId: number | null;
  subdependenciaNombre: string | null;
  numeroSerieOverride: string | null;
  estadoDepuracion: string | null;
  observaciones: string | null;
  revisadoPor: string | null;
  fechaRevision: string | null;
}
```

Replace `EquipoSaludItem`:

```typescript
export interface EquipoSaludItem {
  computerID: number;
  nombreEquipo: string;
  sedeNombre: string | null;
  tipoEquipo: string | null;
  usuarioContacto: string | null;
  sinEncendidoMeses: number;
  sinActualizacionMeses: number;
  nivelAlerta: 'ROJO' | 'AMARILLO' | 'OK';
  sinCodigoPatrimonial: boolean;
  sinUsuario: boolean;
  sinSede: boolean;
  sinDependencia: boolean;
  sinSubdependencia: boolean;
  sinNumeroSerie: boolean;
  estadoDepuracion: string | null;
}
```

Replace `EquipoDetalleResponse` (drop `enrichment`):

```typescript
export interface EquipoDetalleResponse {
  equipo: EquipoDetalle;
  software: EquipoSoftware[];
  teclado: EquipoTeclado | null;
  oficina: EquipoOficina | null;
  tipoEfectivo: string | null;
}
```

- [ ] **Step 2: Type-check (expect errors — consumers not updated yet)**

Run: `cd soportedesk-frontend && npx tsc --noEmit -p tsconfig.json`
Expected: errors in `equipo-detail.component.ts` (still reads `response.enrichment`, still references the old `EquipoEnrichmentDto` shape). This is expected until Task 6.

- [ ] **Step 3: Commit**

```bash
git add soportedesk-frontend/src/app/features/equipos/equipo.model.ts
git commit -m "feat(equipos): extend EquipoEnrichmentDto/EquipoSaludItem, drop response.enrichment"
```

---

### Task 6: Frontend — remove the enrichment section from `EquipoDetailComponent`

**Files:**
- Modify: `soportedesk-frontend/src/app/features/equipos/equipo-detail.component.ts`
- Modify: `soportedesk-frontend/src/app/features/equipos/equipo-detail.component.html`
- Modify: `soportedesk-frontend/src/app/features/equipos/equipo-detail.component.scss`

**Interfaces:**
- Consumes: the trimmed `EquipoDetalleResponse` from Task 5 (no more `.enrichment`).

- [ ] **Step 1: Trim `equipo-detail.component.ts`**

Replace the full file with:

```typescript
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EquipoDetalle, EquipoOficina, EquipoSoftware, EquipoTeclado } from './equipo.model';
import { EquipoService } from './equipo.service';

interface MonitorRow {
  nombre: string;
  modelo: string;
  fabricante: string;
  serial: string;
}

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

  equipo = signal<EquipoDetalle | null>(null);
  software = signal<EquipoSoftware[]>([]);
  teclado = signal<EquipoTeclado | null>(null);
  oficina = signal<EquipoOficina | null>(null);
  tipoEfectivo = signal<string | null>(null);
  softwareFilter = signal('');

  private equipoId = 0;

  monitores = computed(() => this.parseMonitores(this.equipo()));
  filteredSoftware = computed(() => {
    const term = this.softwareFilter().trim().toLowerCase();
    if (!term) return this.software();
    return this.software().filter((row) => row.software?.toLowerCase().includes(term));
  });

  ngOnInit(): void {
    this.equipoId = Number(this.route.snapshot.paramMap.get('id'));
    this.service.getDetalle(this.equipoId).subscribe((response) => {
      this.equipo.set(response.equipo);
      this.software.set(response.software ?? []);
      this.teclado.set(response.teclado);
      this.oficina.set(response.oficina);
      this.tipoEfectivo.set(response.tipoEfectivo);
    });
  }

  back(): void {
    this.router.navigate(['/equipos']);
  }

  stripDomain(value: string | null | undefined): string {
    return (value ?? '').replace(/@INIA-RED$/i, '');
  }

  gbLabel(value: number | null | undefined): string {
    return value == null ? '-' : `${value} GB`;
  }

  empty(value: unknown): string {
    return value == null || value === '' ? '-' : String(value);
  }

  private static readonly INVENTORY_JUNK_VALUES = new Set([
    '0000000000',
    'no asset information',
    'chassis asset tag',
    'default string',
    'to be filled by o.e.m.',
  ]);

  inventoryLabel(value: string | null | undefined): string {
    if (value == null || value.trim() === '') return '-';
    return EquipoDetailComponent.INVENTORY_JUNK_VALUES.has(value.trim().toLowerCase()) ? '-' : value;
  }

  formatDate(iso: string | null | undefined): string {
    if (!iso) return '-';
    return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  private parseMonitores(equipo: EquipoDetalle | null): MonitorRow[] {
    if (!equipo || !equipo.monCantidad) return [];
    const nombres = this.splitPipe(equipo.monNombres);
    const modelos = this.splitPipe(equipo.monModelos);
    const fabricantes = this.splitPipe(equipo.monFabricantes);
    const seriales = this.splitPipe(equipo.monSeriales);
    const count = Math.max(equipo.monCantidad, nombres.length, modelos.length, fabricantes.length, seriales.length);
    return Array.from({ length: count }, (_, i) => ({
      nombre: nombres[i] ?? '-',
      modelo: modelos[i] ?? '-',
      fabricante: fabricantes[i] ?? '-',
      serial: seriales[i] ?? '-',
    }));
  }

  private splitPipe(value: string | null | undefined): string[] {
    return (value ?? '').split('|').map((p) => p.trim()).filter(Boolean);
  }
}
```

- [ ] **Step 2: Remove the "Mantenimiento / Enriquecimiento" section from the template**

In `soportedesk-frontend/src/app/features/equipos/equipo-detail.component.html`, delete the entire block:

```html
  <section class="section-band mantenimiento-section">
    <h3>Mantenimiento / Enriquecimiento</h3>
    ...
  </section>
```

(everything from `<section class="section-band mantenimiento-section">` through its closing `</section>`, i.e. the current lines 71-155). Leave every other section (Asignacion, Hardware, Monitores, Teclado, Software instalado) and the header's `type-badge` untouched.

- [ ] **Step 3: Remove the now-unused CSS**

In `soportedesk-frontend/src/app/features/equipos/equipo-detail.component.scss`, delete these rule blocks (keep `.simple-table`, `table`, `th, td` — still used by Monitores/Software tables):

```scss
.mantenimiento-section input,
.mantenimiento-section select,
.mantenimiento-section textarea {
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 7px 10px;
  font-size: 0.9rem;
  background: #f8fafc;
  box-sizing: border-box;
  color: #0f172a;
}

.mantenimiento-section textarea {
  resize: vertical;
}

.obs-cell {
  grid-column: 1 / -1;
}

.enrichment-meta {
  margin-top: 10px;
  font-size: 0.82rem;
  color: #64748b;
}

.enrichment-actions {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 14px;
}

.save-btn {
  background: var(--color-accent, #4f46e5);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 9px 20px;
  font-weight: 700;
  cursor: pointer;
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: default;
}

.save-ok {
  color: #166534;
  font-weight: 600;
  font-size: 0.87rem;
}

.historial-section {
  margin-top: 20px;
  border-top: 1px dashed #e2e8f0;
  padding-top: 14px;
}

.historial-section h4 {
  margin: 0 0 10px;
  font-size: 0.9rem;
  color: #475569;
}
```

- [ ] **Step 4: Type-check**

Run: `cd soportedesk-frontend && npx tsc --noEmit -p tsconfig.json`
Expected: no errors referencing `equipo-detail.component.ts` (errors may remain in `equipos-mantenimiento.component.ts` until Task 8 — that's expected).

- [ ] **Step 5: Commit**

```bash
git add soportedesk-frontend/src/app/features/equipos/equipo-detail.component.ts soportedesk-frontend/src/app/features/equipos/equipo-detail.component.html soportedesk-frontend/src/app/features/equipos/equipo-detail.component.scss
git commit -m "refactor(equipos): remove enrichment section from equipo detail page"
```

---

### Task 7: Frontend — new `EquipoEnrichmentModalComponent`

**Files:**
- Create: `soportedesk-frontend/src/app/features/equipos/equipo-enrichment-modal.component.ts`
- Create: `soportedesk-frontend/src/app/features/equipos/equipo-enrichment-modal.component.html`
- Create: `soportedesk-frontend/src/app/features/equipos/equipo-enrichment-modal.component.scss`

**Interfaces:**
- Consumes: `ModalComponent` (`../../shared/modal/modal.component`, inputs `title`/`open`/`size`, output `closed`), `UbicacionSelectComponent` (`../../shared/ubicacion-select/ubicacion-select.component`, inputs `sedeId`/`dependenciaId`/`subdependenciaId`/`showTipoContrato`, outputs `sedeIdChange`/`dependenciaIdChange`/`subdependenciaIdChange`), `CatalogoService.getTiposEquipo()`, `EquipoService.getEnrichment/saveEnrichment/getHistorial` (all pre-existing, unchanged signatures), `EquipoEnrichmentDto`/`HistorialItem` from Task 5's `equipo.model.ts`.
- Produces: `EquipoEnrichmentModalComponent` with `@Input({required:true}) open/computerId/nombreEquipo` and `@Output() closed/saved` — consumed by Task 8's `EquiposMantenimientoComponent`.

- [ ] **Step 1: Create the component class**

```typescript
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ModalComponent } from '../../shared/modal/modal.component';
import { UbicacionSelectComponent } from '../../shared/ubicacion-select/ubicacion-select.component';
import { CatalogoService } from '../../core/catalogos/catalogo.service';
import { EquipoService } from './equipo.service';
import { EquipoEnrichmentDto, HistorialItem } from './equipo.model';

@Component({
  selector: 'app-equipo-enrichment-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, UbicacionSelectComponent],
  templateUrl: './equipo-enrichment-modal.component.html',
  styleUrl: './equipo-enrichment-modal.component.scss',
})
export class EquipoEnrichmentModalComponent implements OnChanges {
  private service = inject(EquipoService);
  private catalogoService = inject(CatalogoService);
  private router = inject(Router);

  @Input({ required: true }) open = false;
  @Input({ required: true }) computerId!: number;
  @Input({ required: true }) nombreEquipo!: string;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  tiposEquipo = signal<string[]>([]);
  historial = signal<HistorialItem[]>([]);
  saving = signal(false);
  saveSuccess = signal(false);

  form: EquipoEnrichmentDto = this.emptyForm();

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['open'] || changes['computerId']) && this.open) {
      this.load();
    }
  }

  updateField(field: keyof EquipoEnrichmentDto, value: string): void {
    this.form = { ...this.form, [field]: value || null };
  }

  onSedeChange(sedeId: number | null): void {
    this.form = { ...this.form, sedeId };
  }

  onDependenciaChange(dependenciaId: number | null): void {
    this.form = { ...this.form, dependenciaId };
  }

  onSubdependenciaChange(subdependenciaId: number | null): void {
    this.form = { ...this.form, subdependenciaId };
  }

  save(): void {
    this.saving.set(true);
    this.saveSuccess.set(false);
    this.service.saveEnrichment(this.computerId, this.form).subscribe({
      next: (saved) => {
        this.form = saved;
        this.service.getHistorial(this.computerId).subscribe((h) => this.historial.set(h));
        this.saving.set(false);
        this.saveSuccess.set(true);
        this.saved.emit();
      },
      error: () => this.saving.set(false),
    });
  }

  close(): void {
    this.closed.emit();
  }

  verFicha(): void {
    this.router.navigate(['/equipos', this.computerId]);
  }

  empty(value: unknown): string {
    return value == null || value === '' ? '-' : String(value);
  }

  formatDate(iso: string | null | undefined): string {
    if (!iso) return '-';
    return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  private load(): void {
    this.form = this.emptyForm();
    this.saveSuccess.set(false);
    this.service.getEnrichment(this.computerId).subscribe((dto) => {
      if (dto) this.form = dto;
    });
    this.service.getHistorial(this.computerId).subscribe((h) => this.historial.set(h));
    this.catalogoService.getTiposEquipo().subscribe({
      next: (tipos) => this.tiposEquipo.set(Array.from(new Set(tipos.map((t) => t.tipoNormalizado)))),
      error: () => this.tiposEquipo.set([]),
    });
  }

  private emptyForm(): EquipoEnrichmentDto {
    return {
      tipoOverride: null,
      fabricanteOverride: null,
      modeloOverride: null,
      codigoPatrimonial: null,
      sedeId: null,
      sedeNombre: null,
      dependenciaId: null,
      dependenciaNombre: null,
      subdependenciaId: null,
      subdependenciaNombre: null,
      numeroSerieOverride: null,
      estadoDepuracion: null,
      observaciones: null,
      revisadoPor: null,
      fechaRevision: null,
    };
  }
}
```

- [ ] **Step 2: Create the template**

```html
<app-modal [title]="nombreEquipo" [open]="open" size="wide" (closed)="close()">
  <ng-container *ngIf="open">
    <div class="info-grid">
      <div>
        <span>Código patrimonial</span>
        <input
          type="text"
          [value]="form.codigoPatrimonial ?? ''"
          (change)="updateField('codigoPatrimonial', $any($event.target).value)"
          placeholder="Ej. PAT-2024-001"
        />
      </div>
      <div>
        <span>Tipo</span>
        <select [value]="form.tipoOverride ?? ''" (change)="updateField('tipoOverride', $any($event.target).value)">
          <option value="">-- Sin tipo --</option>
          <option *ngFor="let tipo of tiposEquipo()" [value]="tipo">{{ tipo }}</option>
        </select>
      </div>
      <div>
        <span>Fabricante (override)</span>
        <input
          type="text"
          [value]="form.fabricanteOverride ?? ''"
          (change)="updateField('fabricanteOverride', $any($event.target).value)"
          placeholder="Ej. Dell"
        />
      </div>
      <div>
        <span>Modelo (override)</span>
        <input
          type="text"
          [value]="form.modeloOverride ?? ''"
          (change)="updateField('modeloOverride', $any($event.target).value)"
          placeholder="Ej. OptiPlex 7090"
        />
      </div>
      <div>
        <span>Número de serie (override)</span>
        <input
          type="text"
          [value]="form.numeroSerieOverride ?? ''"
          (change)="updateField('numeroSerieOverride', $any($event.target).value)"
          placeholder="Ej. SN-12345"
        />
      </div>
      <div>
        <span>Estado depuración</span>
        <select [value]="form.estadoDepuracion ?? ''" (change)="updateField('estadoDepuracion', $any($event.target).value)">
          <option value="">-- Sin estado --</option>
          <option value="PENDIENTE">Pendiente</option>
          <option value="EN_REVISION">En revisión</option>
          <option value="DEPURADO">Depurado</option>
          <option value="ACTIVO">Activo</option>
        </select>
      </div>
      <div class="obs-cell">
        <span>Observaciones</span>
        <textarea
          rows="3"
          [value]="form.observaciones ?? ''"
          (change)="updateField('observaciones', $any($event.target).value)"
          placeholder="Notas internas..."
        ></textarea>
      </div>
    </div>

    <div class="ubicacion-cell">
      <span>Ubicación (override)</span>
      <app-ubicacion-select
        [showTipoContrato]="false"
        [sedeId]="form.sedeId"
        [dependenciaId]="form.dependenciaId"
        [subdependenciaId]="form.subdependenciaId"
        (sedeIdChange)="onSedeChange($event)"
        (dependenciaIdChange)="onDependenciaChange($event)"
        (subdependenciaIdChange)="onSubdependenciaChange($event)"
      />
    </div>

    <div class="enrichment-meta" *ngIf="form.revisadoPor">
      Última revisión por <strong>{{ form.revisadoPor }}</strong> el {{ formatDate(form.fechaRevision) }}
    </div>

    <div class="enrichment-actions">
      <button type="button" class="save-btn" (click)="save()" [disabled]="saving()">
        {{ saving() ? 'Guardando...' : 'Guardar cambios' }}
      </button>
      <span class="save-ok" *ngIf="saveSuccess()">Guardado correctamente</span>
      <button type="button" class="ver-ficha-btn" (click)="verFicha()">Ver ficha completa</button>
    </div>

    <div class="historial-section" *ngIf="historial().length">
      <h4>Historial de cambios</h4>
      <div class="simple-table">
        <table>
          <thead>
            <tr><th>Campo</th><th>Anterior</th><th>Nuevo</th><th>Por</th><th>Fecha</th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let h of historial()">
              <td>{{ h.campo }}</td>
              <td>{{ empty(h.valorAnterior) }}</td>
              <td>{{ empty(h.valorNuevo) }}</td>
              <td>{{ h.modificadoPor }}</td>
              <td>{{ formatDate(h.fechaModificacion) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </ng-container>
</app-modal>
```

- [ ] **Step 3: Create the stylesheet**

```scss
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.info-grid div,
.ubicacion-cell {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  background: #fff;
}

.ubicacion-cell {
  margin-top: 12px;
}

.info-grid span,
.ubicacion-cell > span {
  display: block;
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 700;
  margin-bottom: 5px;
}

.info-grid input,
.info-grid select,
.info-grid textarea {
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 7px 10px;
  font-size: 0.9rem;
  background: #f8fafc;
  box-sizing: border-box;
  color: #0f172a;
}

.info-grid textarea {
  resize: vertical;
}

.obs-cell {
  grid-column: 1 / -1;
}

.enrichment-meta {
  margin-top: 10px;
  font-size: 0.82rem;
  color: #64748b;
}

.enrichment-actions {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 14px;
  flex-wrap: wrap;
}

.save-btn {
  background: var(--color-equipos, #4f46e5);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 9px 20px;
  font-weight: 700;
  cursor: pointer;
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: default;
}

.save-ok {
  color: #166534;
  font-weight: 600;
  font-size: 0.87rem;
}

.ver-ficha-btn {
  margin-left: auto;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 8px 14px;
  background: #fff;
  color: #334155;
  font-weight: 600;
  cursor: pointer;
}

.historial-section {
  margin-top: 20px;
  border-top: 1px dashed #e2e8f0;
  padding-top: 14px;
}

.historial-section h4 {
  margin: 0 0 10px;
  font-size: 0.9rem;
  color: #475569;
}

.simple-table {
  overflow-x: auto;
  max-width: 100%;
}

table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border: 1px solid #e2e8f0;
  table-layout: fixed;
}

th,
td {
  padding: 10px 12px;
  border-bottom: 1px solid #e2e8f0;
  text-align: left;
  overflow-wrap: anywhere;
}

th {
  color: #475569;
  font-size: 0.78rem;
  text-transform: uppercase;
}
```

- [ ] **Step 4: Type-check**

Run: `cd soportedesk-frontend && npx tsc --noEmit -p tsconfig.json`
Expected: no new errors from `equipo-enrichment-modal.component.ts` (errors in `equipos-mantenimiento.component.ts` are still expected until Task 8 wires it in).

- [ ] **Step 5: Commit**

```bash
git add soportedesk-frontend/src/app/features/equipos/equipo-enrichment-modal.component.ts soportedesk-frontend/src/app/features/equipos/equipo-enrichment-modal.component.html soportedesk-frontend/src/app/features/equipos/equipo-enrichment-modal.component.scss
git commit -m "feat(equipos): add EquipoEnrichmentModalComponent"
```

---

### Task 8: Frontend — wire the modal into `EquiposMantenimientoComponent`

**Files:**
- Modify: `soportedesk-frontend/src/app/features/equipos/equipos-mantenimiento.component.ts`
- Modify: `soportedesk-frontend/src/app/features/equipos/equipos-mantenimiento.component.html`

**Interfaces:**
- Consumes: `EquipoEnrichmentModalComponent` (Task 7, inputs `open/computerId/nombreEquipo`, outputs `closed/saved`), `EquipoSaludItem.sinDependencia/sinSubdependencia/sinNumeroSerie` (Task 5).

- [ ] **Step 1: Replace the component class**

```typescript
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EquipoSaludItem } from './equipo.model';
import { EquipoService } from './equipo.service';
import { EquipoEnrichmentModalComponent } from './equipo-enrichment-modal.component';

@Component({
  selector: 'app-equipos-mantenimiento',
  standalone: true,
  imports: [CommonModule, EquipoEnrichmentModalComponent],
  templateUrl: './equipos-mantenimiento.component.html',
  styleUrl: './equipos.shared.scss',
})
export class EquiposMantenimientoComponent implements OnInit {
  private service = inject(EquipoService);

  salud = signal<EquipoSaludItem[]>([]);
  modalOpen = signal(false);
  selectedComputerId = signal(0);
  selectedNombreEquipo = signal('');

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

  abrirModal(item: EquipoSaludItem): void {
    this.selectedComputerId.set(item.computerID);
    this.selectedNombreEquipo.set(item.nombreEquipo);
    this.modalOpen.set(true);
  }

  cerrarModal(): void {
    this.modalOpen.set(false);
  }

  onGuardado(): void {
    this.loadSalud();
  }

  mesesLabel(val: number): string {
    if (val < 0) return 'Sin dato';
    if (val === 0) return 'Este mes';
    return `${val} mes${val === 1 ? '' : 'es'}`;
  }
}
```

- [ ] **Step 2: Update the template**

Replace `soportedesk-frontend/src/app/features/equipos/equipos-mantenimiento.component.html`:

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
          <span class="tag-warn" *ngIf="s.sinDependencia">Sin dependencia</span>
          <span class="tag-warn" *ngIf="s.sinSubdependencia">Sin subdependencia</span>
          <span class="tag-warn" *ngIf="s.sinNumeroSerie">Sin nro. serie</span>
        </td>
        <td>{{ s.estadoDepuracion || '-' }}</td>
        <td><button type="button" class="view-link" (click)="abrirModal(s)">Ver</button></td>
      </tr>
    </tbody>
  </table>
</div>
<ng-template #sinAlertas>
  <p class="salud-ok">Todo el inventario está al día. No hay alertas.</p>
</ng-template>

<app-equipo-enrichment-modal
  [open]="modalOpen()"
  [computerId]="selectedComputerId()"
  [nombreEquipo]="selectedNombreEquipo()"
  (closed)="cerrarModal()"
  (saved)="onGuardado()"
/>
```

- [ ] **Step 3: Type-check the whole frontend**

Run: `cd soportedesk-frontend && npx tsc --noEmit -p tsconfig.json`
Expected: no errors.

- [ ] **Step 4: Build the frontend**

Run: `cd soportedesk-frontend && npm run build`
Expected: `Application bundle generation complete` (BUILD SUCCESS), no errors or unused-import warnings for the equipos feature.

- [ ] **Step 5: Commit**

```bash
git add soportedesk-frontend/src/app/features/equipos/equipos-mantenimiento.component.ts soportedesk-frontend/src/app/features/equipos/equipos-mantenimiento.component.html
git commit -m "feat(equipos): open enrichment modal from mantenimiento queue instead of navigating"
```

---

### Task 9: Full verification pass

**Files:** none (verification only).

- [ ] **Step 1: Run the full backend test suite**

Run: `cd soportedesk-backend && mvn test`
Expected: BUILD SUCCESS, 0 failures.

- [ ] **Step 2: Build the backend**

Run: `cd soportedesk-backend && mvn -DskipTests package`
Expected: BUILD SUCCESS.

- [ ] **Step 3: Build the frontend**

Run: `cd soportedesk-frontend && npm run build`
Expected: BUILD SUCCESS.

- [ ] **Step 4: Manual browser walkthrough (per spec §10 — no existing frontend specs to migrate, so this replaces automated frontend tests)**

With both apps running (backend + `ng serve`):
1. Navigate to `/equipos/mantenimiento`. Confirm the table shows the 3 new "Sin dependencia/Sin subdependencia/Sin nro. serie" tags where applicable.
2. Click "Ver" on a row — confirm the modal opens (does **not** navigate away from the filtered Mantenimiento table) and is pre-filled with the equipo's current enrichment (or blank if none).
3. Set a Tipo from the dropdown, fill Código patrimonial, Número de serie, and pick Sede → Dependencia → Subdependencia via the cascading selects. Click "Guardar cambios". Confirm "Guardado correctamente" appears and the historial table below updates.
4. Close the modal. Confirm the Mantenimiento table reloaded (`loadSalud()` ran) — if the equipo is now fully complete, it disappears from the alerts list.
5. Reopen the modal for the same equipo — confirm the previously-saved values (including sede/dependencia/subdependencia and número de serie) are still there.
6. Click "Ver ficha completa" — confirm it navigates to `/equipos/:id` and that the ficha **no longer shows** any "Mantenimiento / Enriquecimiento" section (only Asignación/Hardware/Monitores/Teclado/Software), while the type badge in the header still reflects the tipo override.
7. Navigate to `/equipos/dashboard` — confirm the KPI/dashboard counts (sinPatrimonial/sinUsuario/sinSede) are unchanged (out of scope per spec §11).

- [ ] **Step 5: Report results to the user**

Summarize pass/fail for each of the above 4 steps; do not claim the feature works until all manual walkthrough steps have been observed directly (per verification-before-completion practice).

---

## Execution Handoff

Two execution options:

1. **Subagent-Driven (recommended)** — dispatch a fresh subagent per task above, review between tasks, fast iteration.
2. **Inline Execution** — execute tasks in this session using `executing-plans`, batch execution with checkpoints.
