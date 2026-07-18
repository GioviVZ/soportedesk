# Impresoras — Intervenciones Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a per-printer maintenance/intervention history (date + observation + one or more file attachments — photos or documents) to the Impresoras module.

**Architecture:** Two-level relational model mirroring the existing `equipos/evidencia` pattern but extended to a parent/child shape: `ImpresoraIntervencion` (date + editable observation) has 0..N `ImpresoraIntervencionAdjunto` (uploaded files, stored on the server filesystem). New Spring Boot package `impresoras.intervencion` with entities, repositories, a storage service, a service, and a REST controller under `/api/impresoras/{impresoraId}/intervenciones`. New Angular tab `'intervenciones'` inside the existing `ImpresoraFichaComponent`.

**Tech Stack:** Spring Boot 3 (Java 17), Spring Data JPA, SQL Server (T-SQL), Angular 17 standalone components, RxJS.

**Spec:** `docs/superpowers/specs/2026-07-17-impresoras-intervenciones-design.md`

## Global Constraints

- Package: `com.inia.soportedesk.impresoras.intervencion` (backend), mirrors `com.inia.soportedesk.equipos.evidencia`.
- Permissions: reuse existing `READ_impresoras` / `WRITE_impresoras` authorities, same `@PreAuthorize("hasRole('ADMIN') || hasAuthority('...')")` pattern as `ImpresoraController`.
- Allowed attachment MIME types: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (.docx), `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (.xlsx).
- Max attachment size: 15 MB per file (global `spring.servlet.multipart.max-file-size` is already 50MB in `application.yml`, so no config change needed there — only the per-file business check in the service).
- Batch attachment upload is all-or-nothing: if any file in a batch fails validation, none are saved.
- `impresora_id` is a **real FK** (`REFERENCES dbo.impresoras(id) ON DELETE CASCADE`) — `Impresora` is a table owned by SoporteDesk, unlike GLPI-derived `Equipo`.
- Entities do NOT use `@ManyToOne` JPA relations (plain `Long` id columns), matching the `EquipoEvidencia`/`EquipoEnrichment` style already used in this codebase.
- SQL migration files under `docs/superpowers/migrations/` are documentation only — they are NOT auto-applied (`spring.sql.init.mode: never`, `hibernate.ddl-auto: none`). The user runs them manually against SQL Server.
- Frontend: Angular standalone components, signals for reactive state (`signal<T>()`), `FormsModule` + `[(ngModel)]` for simple forms, `app-modal` (`soportedesk-frontend/src/app/shared/modal/modal.component.ts`) for the image viewer — same pattern as `EquipoDetailComponent`'s Evidencias section.

---

## Task 1: Entidades, repositorios y migración SQL

**Files:**
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/intervencion/ImpresoraIntervencion.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/intervencion/ImpresoraIntervencionAdjunto.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/intervencion/ImpresoraIntervencionRepository.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/intervencion/ImpresoraIntervencionAdjuntoRepository.java`
- Create: `docs/superpowers/migrations/2026-07-17-impresoras-intervenciones.sql`

**Interfaces:**
- Produces: `ImpresoraIntervencion` (fields: `id: Long`, `impresoraId: Long`, `fecha: LocalDate`, `observacion: String`, `registradoPor: String`, `fechaRegistro: LocalDateTime`, with Lombok `@Getter @Setter`).
- Produces: `ImpresoraIntervencionAdjunto` (fields: `id: Long`, `intervencionId: Long`, `archivoPath: String`, `nombreOriginal: String`, `mimeType: String`, `subidoPor: String`, `fechaSubida: LocalDateTime`, with Lombok `@Getter @Setter`).
- Produces: `ImpresoraIntervencionRepository.findByImpresoraIdOrderByFechaDesc(Long impresoraId): List<ImpresoraIntervencion>` and `findByIdAndImpresoraId(Long id, Long impresoraId): Optional<ImpresoraIntervencion>`.
- Produces: `ImpresoraIntervencionAdjuntoRepository.findByIntervencionIdOrderByFechaSubidaAsc(Long intervencionId): List<ImpresoraIntervencionAdjunto>` and `findByIdAndIntervencionId(Long id, Long intervencionId): Optional<ImpresoraIntervencionAdjunto>`.

This task has no dedicated automated test (same as `EquipoEvidencia`/`EquipoEnrichment`, which are plain JPA entities without repository tests in this codebase) — verified by compilation.

- [ ] **Step 1: Create the `ImpresoraIntervencion` entity**

```java
package com.inia.soportedesk.impresoras.intervencion;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "impresoras_intervenciones")
@Getter
@Setter
@NoArgsConstructor
public class ImpresoraIntervencion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "impresora_id", nullable = false)
    private Long impresoraId;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(nullable = false, length = 1000)
    private String observacion;

    @Column(name = "registrado_por", nullable = false)
    private String registradoPor;

    @Column(name = "fecha_registro", nullable = false)
    private LocalDateTime fechaRegistro;
}
```

- [ ] **Step 2: Create the `ImpresoraIntervencionAdjunto` entity**

```java
package com.inia.soportedesk.impresoras.intervencion;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "impresoras_intervenciones_adjuntos")
@Getter
@Setter
@NoArgsConstructor
public class ImpresoraIntervencionAdjunto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "intervencion_id", nullable = false)
    private Long intervencionId;

    @Column(name = "archivo_path", nullable = false)
    private String archivoPath;

    @Column(name = "nombre_original", nullable = false)
    private String nombreOriginal;

    @Column(name = "mime_type", nullable = false)
    private String mimeType;

    @Column(name = "subido_por", nullable = false)
    private String subidoPor;

    @Column(name = "fecha_subida", nullable = false)
    private LocalDateTime fechaSubida;
}
```

- [ ] **Step 3: Create the repositories**

```java
package com.inia.soportedesk.impresoras.intervencion;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ImpresoraIntervencionRepository extends JpaRepository<ImpresoraIntervencion, Long> {
    List<ImpresoraIntervencion> findByImpresoraIdOrderByFechaDesc(Long impresoraId);
    Optional<ImpresoraIntervencion> findByIdAndImpresoraId(Long id, Long impresoraId);
}
```

```java
package com.inia.soportedesk.impresoras.intervencion;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ImpresoraIntervencionAdjuntoRepository extends JpaRepository<ImpresoraIntervencionAdjunto, Long> {
    List<ImpresoraIntervencionAdjunto> findByIntervencionIdOrderByFechaSubidaAsc(Long intervencionId);
    Optional<ImpresoraIntervencionAdjunto> findByIdAndIntervencionId(Long id, Long intervencionId);
}
```

- [ ] **Step 4: Create the SQL migration file**

```sql
USE ssti;
GO
IF OBJECT_ID('dbo.impresoras_intervenciones', 'U') IS NULL
CREATE TABLE dbo.impresoras_intervenciones (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    impresora_id    BIGINT NOT NULL REFERENCES dbo.impresoras(id) ON DELETE CASCADE,
    fecha           DATE NOT NULL,
    observacion     NVARCHAR(1000) NOT NULL,
    registrado_por  NVARCHAR(100) NOT NULL,
    fecha_registro  DATETIME2 NOT NULL
);
GO
CREATE INDEX IX_impresoras_intervenciones_impresora_id
    ON dbo.impresoras_intervenciones(impresora_id);
GO
IF OBJECT_ID('dbo.impresoras_intervenciones_adjuntos', 'U') IS NULL
CREATE TABLE dbo.impresoras_intervenciones_adjuntos (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    intervencion_id BIGINT NOT NULL REFERENCES dbo.impresoras_intervenciones(id) ON DELETE CASCADE,
    archivo_path    NVARCHAR(300) NOT NULL,
    nombre_original NVARCHAR(255) NOT NULL,
    mime_type       NVARCHAR(100) NOT NULL,
    subido_por      NVARCHAR(100) NOT NULL,
    fecha_subida    DATETIME2 NOT NULL
);
GO
CREATE INDEX IX_impresoras_intervenciones_adjuntos_intervencion_id
    ON dbo.impresoras_intervenciones_adjuntos(intervencion_id);
GO
```

- [ ] **Step 5: Verify compilation**

Run: `cd soportedesk-backend && mvn -q compile`
Expected: `BUILD SUCCESS`, no errors.

- [ ] **Step 6: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/intervencion/ImpresoraIntervencion.java soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/intervencion/ImpresoraIntervencionAdjunto.java soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/intervencion/ImpresoraIntervencionRepository.java soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/intervencion/ImpresoraIntervencionAdjuntoRepository.java docs/superpowers/migrations/2026-07-17-impresoras-intervenciones.sql
git commit -m "feat: agregar entidades y migración de Intervenciones de Impresoras"
```

---

## Task 2: Servicio de almacenamiento de archivos

**Files:**
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/intervencion/IntervencionStorageService.java`
- Modify: `soportedesk-backend/src/main/resources/application.yml:32-34` (add `intervenciones-dir` under `uploads:`)
- Test: `soportedesk-backend/src/test/java/com/inia/soportedesk/impresoras/intervencion/IntervencionStorageServiceTest.java`

**Interfaces:**
- Consumes: none from Task 1 directly (independent of the entities).
- Produces: `IntervencionStorageService(String intervencionesDir)` constructor; `store(Long intervencionId, MultipartFile file): String` (returns relative path `"{intervencionId}/{uuid}.ext"`); `load(String relativePath): Path`; `delete(String relativePath): void`. These three methods are consumed by `ImpresoraIntervencionService` in Task 4.

- [ ] **Step 1: Write the failing test**

```java
package com.inia.soportedesk.impresoras.intervencion;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;

class IntervencionStorageServiceTest {

    @TempDir
    Path tempDir;

    private IntervencionStorageService service;

    @BeforeEach
    void setUp() {
        service = new IntervencionStorageService(tempDir.toString());
    }

    @Test
    void store_savesFileUnderIntervencionSubfolderWithUniqueName() throws IOException {
        MockMultipartFile file = new MockMultipartFile("file", "informe.pdf", "application/pdf", "contenido".getBytes());

        String relativePath = service.store(42L, file);

        assertThat(relativePath).startsWith("42/").endsWith(".pdf");
        Path stored = tempDir.resolve(relativePath);
        assertThat(Files.exists(stored)).isTrue();
        assertThat(Files.readString(stored)).isEqualTo("contenido");
    }

    @Test
    void store_twoFilesWithSameOriginalName_doNotOverwriteEachOther() throws IOException {
        MockMultipartFile first = new MockMultipartFile("file", "foto.jpg", "image/jpeg", "primera".getBytes());
        MockMultipartFile second = new MockMultipartFile("file", "foto.jpg", "image/jpeg", "segunda".getBytes());

        String firstPath = service.store(42L, first);
        String secondPath = service.store(42L, second);

        assertThat(firstPath).isNotEqualTo(secondPath);
        assertThat(Files.readString(tempDir.resolve(firstPath))).isEqualTo("primera");
        assertThat(Files.readString(tempDir.resolve(secondPath))).isEqualTo("segunda");
    }

    @Test
    void load_returnsPathToStoredFile() throws IOException {
        MockMultipartFile file = new MockMultipartFile("file", "foto.jpg", "image/jpeg", "contenido".getBytes());
        String relativePath = service.store(42L, file);

        Path loaded = service.load(relativePath);

        assertThat(Files.exists(loaded)).isTrue();
    }

    @Test
    void delete_removesStoredFile() throws IOException {
        MockMultipartFile file = new MockMultipartFile("file", "foto.jpg", "image/jpeg", "contenido".getBytes());
        String relativePath = service.store(42L, file);

        service.delete(relativePath);

        assertThat(Files.exists(tempDir.resolve(relativePath))).isFalse();
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd soportedesk-backend && mvn -q test -Dtest=IntervencionStorageServiceTest`
Expected: FAIL — compilation error, `IntervencionStorageService` does not exist.

- [ ] **Step 3: Implement `IntervencionStorageService`**

```java
package com.inia.soportedesk.impresoras.intervencion;

import com.inia.soportedesk.common.FileStorageException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class IntervencionStorageService {

    private final Path rootDir;

    public IntervencionStorageService(@Value("${uploads.intervenciones-dir}") String intervencionesDir) {
        this.rootDir = Paths.get(intervencionesDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(rootDir);
        } catch (IOException e) {
            throw new FileStorageException("No se pudo crear el directorio de almacenamiento: " + rootDir, e);
        }
    }

    public String store(Long intervencionId, MultipartFile file) {
        String originalName = Paths.get(file.getOriginalFilename()).getFileName().toString();
        String extension = originalName.contains(".") ? originalName.substring(originalName.lastIndexOf('.')) : "";
        String uniqueName = UUID.randomUUID() + extension;
        Path targetDir = rootDir.resolve(String.valueOf(intervencionId));
        try {
            Files.createDirectories(targetDir);
            Path target = targetDir.resolve(uniqueName);
            try (var inputStream = file.getInputStream()) {
                Files.copy(inputStream, target, StandardCopyOption.REPLACE_EXISTING);
            }
            return intervencionId + "/" + uniqueName;
        } catch (IOException e) {
            throw new FileStorageException("No se pudo guardar el adjunto: " + originalName, e);
        }
    }

    public Path load(String relativePath) {
        Path file = resolveWithinRoot(relativePath);
        if (!Files.exists(file)) {
            throw new FileStorageException("Archivo no encontrado: " + relativePath);
        }
        return file;
    }

    public void delete(String relativePath) {
        Path file = resolveWithinRoot(relativePath);
        try {
            Files.deleteIfExists(file);
        } catch (IOException e) {
            throw new FileStorageException("No se pudo eliminar el adjunto: " + relativePath, e);
        }
    }

    private Path resolveWithinRoot(String relativePath) {
        Path file = rootDir.resolve(relativePath).normalize();
        if (!file.startsWith(rootDir)) {
            throw new FileStorageException("Ruta de archivo inválida: " + relativePath);
        }
        return file;
    }
}
```

- [ ] **Step 4: Add the `uploads.intervenciones-dir` property**

In `soportedesk-backend/src/main/resources/application.yml`, change:

```yaml
uploads:
  drivers-dir: uploads/drivers
  evidencias-dir: uploads/evidencias
```

to:

```yaml
uploads:
  drivers-dir: uploads/drivers
  evidencias-dir: uploads/evidencias
  intervenciones-dir: uploads/impresoras-intervenciones
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd soportedesk-backend && mvn -q test -Dtest=IntervencionStorageServiceTest`
Expected: PASS, 4 tests green.

- [ ] **Step 6: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/intervencion/IntervencionStorageService.java soportedesk-backend/src/main/resources/application.yml soportedesk-backend/src/test/java/com/inia/soportedesk/impresoras/intervencion/IntervencionStorageServiceTest.java
git commit -m "feat: agregar IntervencionStorageService para adjuntos de intervenciones"
```

---

## Task 3: DTOs, request y servicio de negocio

**Files:**
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/intervencion/ImpresoraIntervencionDto.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/intervencion/ImpresoraIntervencionAdjuntoDto.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/intervencion/ImpresoraIntervencionRequest.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/intervencion/ArchivoIntervencionAdjunto.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/intervencion/ImpresoraIntervencionService.java`
- Test: `soportedesk-backend/src/test/java/com/inia/soportedesk/impresoras/intervencion/ImpresoraIntervencionServiceTest.java`

**Interfaces:**
- Consumes: `ImpresoraIntervencion`, `ImpresoraIntervencionAdjunto`, `ImpresoraIntervencionRepository`, `ImpresoraIntervencionAdjuntoRepository` (Task 1); `IntervencionStorageService.store/load/delete` (Task 2); `com.inia.soportedesk.impresoras.ImpresoraRepository` (existing, has `existsById(Long): boolean` via `JpaRepository`); `com.inia.soportedesk.exception.ResourceNotFoundException`; `com.inia.soportedesk.common.FileStorageException`.
- Produces: `ImpresoraIntervencionService` with methods `listar(Long impresoraId): List<ImpresoraIntervencionDto>`, `crear(Long impresoraId, ImpresoraIntervencionRequest request, String username): ImpresoraIntervencionDto`, `actualizar(Long impresoraId, Long intervencionId, ImpresoraIntervencionRequest request): ImpresoraIntervencionDto`, `eliminar(Long impresoraId, Long intervencionId): void`, `subirAdjuntos(Long impresoraId, Long intervencionId, List<MultipartFile> files, String username): List<ImpresoraIntervencionAdjuntoDto>`, `eliminarAdjunto(Long impresoraId, Long intervencionId, Long adjuntoId): void`, `cargarArchivo(Long impresoraId, Long intervencionId, Long adjuntoId): ArchivoIntervencionAdjunto`. Consumed by `ImpresoraIntervencionController` in Task 4.
- Produces: `ArchivoIntervencionAdjunto` record with `path(): Path`, `mimeType(): String`, `nombreOriginal(): String`.

- [ ] **Step 1: Write the failing test**

```java
package com.inia.soportedesk.impresoras.intervencion;

import com.inia.soportedesk.common.FileStorageException;
import com.inia.soportedesk.exception.ResourceNotFoundException;
import com.inia.soportedesk.impresoras.ImpresoraRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ImpresoraIntervencionServiceTest {

    @Mock private ImpresoraIntervencionRepository repository;
    @Mock private ImpresoraIntervencionAdjuntoRepository adjuntoRepository;
    @Mock private ImpresoraRepository impresoraRepository;
    @Mock private IntervencionStorageService storageService;
    @InjectMocks private ImpresoraIntervencionService service;

    private ImpresoraIntervencionRequest request(String fecha, String observacion) {
        ImpresoraIntervencionRequest req = new ImpresoraIntervencionRequest();
        req.setFecha(LocalDate.parse(fecha));
        req.setObservacion(observacion);
        return req;
    }

    @Test
    void crear_impresoraExists_savesAndReturnsDto() {
        when(impresoraRepository.existsById(7L)).thenReturn(true);
        when(repository.save(any())).thenAnswer(inv -> {
            ImpresoraIntervencion e = inv.getArgument(0);
            e.setId(1L);
            return e;
        });
        when(adjuntoRepository.findByIntervencionIdOrderByFechaSubidaAsc(1L)).thenReturn(List.of());

        ImpresoraIntervencionDto result = service.crear(7L, request("2026-07-17", "Cambio de fusor"), "gvivanco");

        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getObservacion()).isEqualTo("Cambio de fusor");
        assertThat(result.getRegistradoPor()).isEqualTo("gvivanco");
        assertThat(result.getAdjuntos()).isEmpty();
    }

    @Test
    void crear_impresoraNotFound_throwsResourceNotFoundException() {
        when(impresoraRepository.existsById(999L)).thenReturn(false);

        assertThatThrownBy(() -> service.crear(999L, request("2026-07-17", "obs"), "gvivanco"))
                .isInstanceOf(ResourceNotFoundException.class);

        verifyNoInteractions(repository);
    }

    @Test
    void actualizar_belongsToImpresora_updatesFechaAndObservacion() {
        ImpresoraIntervencion existing = new ImpresoraIntervencion();
        existing.setId(1L);
        existing.setImpresoraId(7L);
        existing.setFecha(LocalDate.parse("2026-07-01"));
        existing.setObservacion("Original");
        when(repository.findByIdAndImpresoraId(1L, 7L)).thenReturn(Optional.of(existing));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(adjuntoRepository.findByIntervencionIdOrderByFechaSubidaAsc(1L)).thenReturn(List.of());

        ImpresoraIntervencionDto result = service.actualizar(7L, 1L, request("2026-07-17", "Corregida"));

        assertThat(result.getFecha()).isEqualTo(LocalDate.parse("2026-07-17"));
        assertThat(result.getObservacion()).isEqualTo("Corregida");
    }

    @Test
    void eliminar_belongsToImpresora_deletesAttachmentFilesAndRow() {
        ImpresoraIntervencion existing = new ImpresoraIntervencion();
        existing.setId(1L);
        existing.setImpresoraId(7L);
        when(repository.findByIdAndImpresoraId(1L, 7L)).thenReturn(Optional.of(existing));
        ImpresoraIntervencionAdjunto adj1 = new ImpresoraIntervencionAdjunto();
        adj1.setArchivoPath("1/a.jpg");
        ImpresoraIntervencionAdjunto adj2 = new ImpresoraIntervencionAdjunto();
        adj2.setArchivoPath("1/b.pdf");
        when(adjuntoRepository.findByIntervencionIdOrderByFechaSubidaAsc(1L)).thenReturn(List.of(adj1, adj2));

        service.eliminar(7L, 1L);

        verify(storageService).delete("1/a.jpg");
        verify(storageService).delete("1/b.pdf");
        verify(repository).delete(existing);
    }

    @Test
    void eliminar_notBelongingToImpresora_throwsResourceNotFoundException() {
        when(repository.findByIdAndImpresoraId(1L, 999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.eliminar(999L, 1L))
                .isInstanceOf(ResourceNotFoundException.class);

        verifyNoInteractions(storageService);
    }

    @Test
    void subirAdjuntos_allValid_savesAllAndReturnsDtos() {
        ImpresoraIntervencion existing = new ImpresoraIntervencion();
        existing.setId(1L);
        existing.setImpresoraId(7L);
        when(repository.findByIdAndImpresoraId(1L, 7L)).thenReturn(Optional.of(existing));
        MockMultipartFile foto = new MockMultipartFile("files", "foto.jpg", "image/jpeg", new byte[]{1});
        MockMultipartFile pdf = new MockMultipartFile("files", "informe.pdf", "application/pdf", new byte[]{2});
        when(storageService.store(1L, foto)).thenReturn("1/uuid1.jpg");
        when(storageService.store(1L, pdf)).thenReturn("1/uuid2.pdf");
        when(adjuntoRepository.save(any())).thenAnswer(inv -> {
            ImpresoraIntervencionAdjunto a = inv.getArgument(0);
            a.setId(a.getArchivoPath().equals("1/uuid1.jpg") ? 10L : 11L);
            return a;
        });

        List<ImpresoraIntervencionAdjuntoDto> result = service.subirAdjuntos(7L, 1L, List.of(foto, pdf), "gvivanco");

        assertThat(result).hasSize(2);
        assertThat(result).extracting(ImpresoraIntervencionAdjuntoDto::getNombreOriginal)
                .containsExactly("foto.jpg", "informe.pdf");
    }

    @Test
    void subirAdjuntos_oneInvalidMimeType_throwsAndSavesNone() {
        ImpresoraIntervencion existing = new ImpresoraIntervencion();
        existing.setId(1L);
        existing.setImpresoraId(7L);
        when(repository.findByIdAndImpresoraId(1L, 7L)).thenReturn(Optional.of(existing));
        MockMultipartFile foto = new MockMultipartFile("files", "foto.jpg", "image/jpeg", new byte[]{1});
        MockMultipartFile exe = new MockMultipartFile("files", "virus.exe", "application/x-msdownload", new byte[]{2});

        assertThatThrownBy(() -> service.subirAdjuntos(7L, 1L, List.of(foto, exe), "gvivanco"))
                .isInstanceOf(FileStorageException.class);

        verifyNoInteractions(storageService);
        verifyNoInteractions(adjuntoRepository);
    }

    @Test
    void eliminarAdjunto_belongsToIntervencion_deletesFileAndRow() {
        ImpresoraIntervencion existing = new ImpresoraIntervencion();
        existing.setId(1L);
        existing.setImpresoraId(7L);
        when(repository.findByIdAndImpresoraId(1L, 7L)).thenReturn(Optional.of(existing));
        ImpresoraIntervencionAdjunto adjunto = new ImpresoraIntervencionAdjunto();
        adjunto.setId(10L);
        adjunto.setArchivoPath("1/uuid1.jpg");
        when(adjuntoRepository.findByIdAndIntervencionId(10L, 1L)).thenReturn(Optional.of(adjunto));

        service.eliminarAdjunto(7L, 1L, 10L);

        verify(storageService).delete("1/uuid1.jpg");
        verify(adjuntoRepository).delete(adjunto);
    }

    @Test
    void listar_ordersByFechaDescending_includesAdjuntos() {
        ImpresoraIntervencion older = new ImpresoraIntervencion();
        older.setId(1L);
        older.setFecha(LocalDate.parse("2026-07-01"));
        older.setObservacion("vieja");
        ImpresoraIntervencion newer = new ImpresoraIntervencion();
        newer.setId(2L);
        newer.setFecha(LocalDate.parse("2026-07-17"));
        newer.setObservacion("nueva");
        when(repository.findByImpresoraIdOrderByFechaDesc(7L)).thenReturn(List.of(newer, older));
        when(adjuntoRepository.findByIntervencionIdOrderByFechaSubidaAsc(any())).thenReturn(List.of());

        List<ImpresoraIntervencionDto> result = service.listar(7L);

        assertThat(result).extracting(ImpresoraIntervencionDto::getObservacion)
                .containsExactly("nueva", "vieja");
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd soportedesk-backend && mvn -q test -Dtest=ImpresoraIntervencionServiceTest`
Expected: FAIL — compilation errors, none of the DTOs/service exist yet.

- [ ] **Step 3: Implement the DTOs, request and record**

```java
package com.inia.soportedesk.impresoras.intervencion;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class ImpresoraIntervencionDto {
    private Long id;
    private LocalDate fecha;
    private String observacion;
    private String registradoPor;
    private LocalDateTime fechaRegistro;
    private List<ImpresoraIntervencionAdjuntoDto> adjuntos;
}
```

```java
package com.inia.soportedesk.impresoras.intervencion;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class ImpresoraIntervencionAdjuntoDto {
    private Long id;
    private String nombreOriginal;
    private String mimeType;
    private String subidoPor;
    private LocalDateTime fechaSubida;
}
```

```java
package com.inia.soportedesk.impresoras.intervencion;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class ImpresoraIntervencionRequest {

    @NotNull
    private LocalDate fecha;

    @NotBlank
    @Size(max = 1000)
    private String observacion;
}
```

```java
package com.inia.soportedesk.impresoras.intervencion;

import java.nio.file.Path;

public record ArchivoIntervencionAdjunto(Path path, String mimeType, String nombreOriginal) {
}
```

- [ ] **Step 4: Implement `ImpresoraIntervencionService`**

```java
package com.inia.soportedesk.impresoras.intervencion;

import com.inia.soportedesk.common.FileStorageException;
import com.inia.soportedesk.exception.ResourceNotFoundException;
import com.inia.soportedesk.impresoras.ImpresoraRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ImpresoraIntervencionService {

    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp",
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    private static final long MAX_FILE_SIZE_BYTES = 15L * 1024 * 1024;

    private final ImpresoraIntervencionRepository repository;
    private final ImpresoraIntervencionAdjuntoRepository adjuntoRepository;
    private final ImpresoraRepository impresoraRepository;
    private final IntervencionStorageService storageService;

    public List<ImpresoraIntervencionDto> listar(Long impresoraId) {
        return repository.findByImpresoraIdOrderByFechaDesc(impresoraId).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public ImpresoraIntervencionDto crear(Long impresoraId, ImpresoraIntervencionRequest request, String username) {
        if (!impresoraRepository.existsById(impresoraId)) {
            throw new ResourceNotFoundException("Impresora no encontrada: " + impresoraId);
        }
        ImpresoraIntervencion entity = new ImpresoraIntervencion();
        entity.setImpresoraId(impresoraId);
        entity.setFecha(request.getFecha());
        entity.setObservacion(request.getObservacion());
        entity.setRegistradoPor(username);
        entity.setFechaRegistro(LocalDateTime.now());
        return toDto(repository.save(entity));
    }

    @Transactional
    public ImpresoraIntervencionDto actualizar(Long impresoraId, Long intervencionId, ImpresoraIntervencionRequest request) {
        ImpresoraIntervencion entity = obtener(impresoraId, intervencionId);
        entity.setFecha(request.getFecha());
        entity.setObservacion(request.getObservacion());
        return toDto(repository.save(entity));
    }

    @Transactional
    public void eliminar(Long impresoraId, Long intervencionId) {
        ImpresoraIntervencion entity = obtener(impresoraId, intervencionId);
        adjuntoRepository.findByIntervencionIdOrderByFechaSubidaAsc(intervencionId)
                .forEach(adjunto -> storageService.delete(adjunto.getArchivoPath()));
        repository.delete(entity);
    }

    @Transactional
    public List<ImpresoraIntervencionAdjuntoDto> subirAdjuntos(Long impresoraId, Long intervencionId,
                                                                 List<MultipartFile> files, String username) {
        obtener(impresoraId, intervencionId);
        files.forEach(this::validar);

        List<ImpresoraIntervencionAdjuntoDto> resultado = new ArrayList<>();
        for (MultipartFile file : files) {
            String relativePath = storageService.store(intervencionId, file);
            ImpresoraIntervencionAdjunto adjunto = new ImpresoraIntervencionAdjunto();
            adjunto.setIntervencionId(intervencionId);
            adjunto.setArchivoPath(relativePath);
            adjunto.setNombreOriginal(file.getOriginalFilename());
            adjunto.setMimeType(file.getContentType());
            adjunto.setSubidoPor(username);
            adjunto.setFechaSubida(LocalDateTime.now());
            resultado.add(toAdjuntoDto(adjuntoRepository.save(adjunto)));
        }
        return resultado;
    }

    @Transactional
    public void eliminarAdjunto(Long impresoraId, Long intervencionId, Long adjuntoId) {
        obtener(impresoraId, intervencionId);
        ImpresoraIntervencionAdjunto adjunto = adjuntoRepository.findByIdAndIntervencionId(adjuntoId, intervencionId)
                .orElseThrow(() -> new ResourceNotFoundException("Adjunto no encontrado: " + adjuntoId));
        storageService.delete(adjunto.getArchivoPath());
        adjuntoRepository.delete(adjunto);
    }

    public ArchivoIntervencionAdjunto cargarArchivo(Long impresoraId, Long intervencionId, Long adjuntoId) {
        obtener(impresoraId, intervencionId);
        ImpresoraIntervencionAdjunto adjunto = adjuntoRepository.findByIdAndIntervencionId(adjuntoId, intervencionId)
                .orElseThrow(() -> new ResourceNotFoundException("Adjunto no encontrado: " + adjuntoId));
        Path path = storageService.load(adjunto.getArchivoPath());
        return new ArchivoIntervencionAdjunto(path, adjunto.getMimeType(), adjunto.getNombreOriginal());
    }

    private void validar(MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType)) {
            throw new FileStorageException("Tipo de archivo no permitido: " + file.getOriginalFilename());
        }
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new FileStorageException("El archivo supera el tamaño máximo permitido (15 MB): " + file.getOriginalFilename());
        }
    }

    private ImpresoraIntervencion obtener(Long impresoraId, Long intervencionId) {
        return repository.findByIdAndImpresoraId(intervencionId, impresoraId)
                .orElseThrow(() -> new ResourceNotFoundException("Intervención no encontrada: " + intervencionId));
    }

    private ImpresoraIntervencionDto toDto(ImpresoraIntervencion entity) {
        ImpresoraIntervencionDto dto = new ImpresoraIntervencionDto();
        dto.setId(entity.getId());
        dto.setFecha(entity.getFecha());
        dto.setObservacion(entity.getObservacion());
        dto.setRegistradoPor(entity.getRegistradoPor());
        dto.setFechaRegistro(entity.getFechaRegistro());
        dto.setAdjuntos(adjuntoRepository.findByIntervencionIdOrderByFechaSubidaAsc(entity.getId()).stream()
                .map(this::toAdjuntoDto)
                .toList());
        return dto;
    }

    private ImpresoraIntervencionAdjuntoDto toAdjuntoDto(ImpresoraIntervencionAdjunto entity) {
        ImpresoraIntervencionAdjuntoDto dto = new ImpresoraIntervencionAdjuntoDto();
        dto.setId(entity.getId());
        dto.setNombreOriginal(entity.getNombreOriginal());
        dto.setMimeType(entity.getMimeType());
        dto.setSubidoPor(entity.getSubidoPor());
        dto.setFechaSubida(entity.getFechaSubida());
        return dto;
    }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd soportedesk-backend && mvn -q test -Dtest=ImpresoraIntervencionServiceTest`
Expected: PASS, 9 tests green.

- [ ] **Step 6: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/intervencion/ImpresoraIntervencionDto.java soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/intervencion/ImpresoraIntervencionAdjuntoDto.java soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/intervencion/ImpresoraIntervencionRequest.java soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/intervencion/ArchivoIntervencionAdjunto.java soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/intervencion/ImpresoraIntervencionService.java soportedesk-backend/src/test/java/com/inia/soportedesk/impresoras/intervencion/ImpresoraIntervencionServiceTest.java
git commit -m "feat: agregar ImpresoraIntervencionService con DTOs y validacion de adjuntos"
```

---

## Task 4: Controlador REST

**Files:**
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/intervencion/ImpresoraIntervencionController.java`
- Test: `soportedesk-backend/src/test/java/com/inia/soportedesk/impresoras/intervencion/ImpresoraIntervencionControllerIT.java`

**Interfaces:**
- Consumes: `ImpresoraIntervencionService` (Task 3) — all its public methods.
- Produces: REST endpoints under `/api/impresoras/{impresoraId}/intervenciones` (see spec §4 table). No later task consumes this directly (frontend calls it over HTTP in Task 6).

- [ ] **Step 1: Write the failing test**

```java
package com.inia.soportedesk.impresoras.intervencion;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ImpresoraIntervencionControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ImpresoraIntervencionService service;

    private ImpresoraIntervencionDto dto(Long id, String observacion) {
        ImpresoraIntervencionDto d = new ImpresoraIntervencionDto();
        d.setId(id);
        d.setFecha(LocalDate.parse("2026-07-17"));
        d.setObservacion(observacion);
        d.setRegistradoPor("admin");
        d.setFechaRegistro(LocalDateTime.now());
        d.setAdjuntos(List.of());
        return d;
    }

    @Test
    @WithMockUser(authorities = "READ_impresoras")
    void listar_withReadPermission_returnsList() throws Exception {
        when(service.listar(7L)).thenReturn(List.of(dto(1L, "Cambio de fusor")));

        mockMvc.perform(get("/api/impresoras/7/intervenciones"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].observacion", is("Cambio de fusor")));
    }

    @Test
    @WithMockUser(username = "tecnico1", authorities = "WRITE_impresoras")
    void crear_withWritePermission_returnsCreated() throws Exception {
        when(service.crear(eq(7L), any(), eq("tecnico1"))).thenReturn(dto(1L, "Cambio de fusor"));

        mockMvc.perform(post("/api/impresoras/7/intervenciones")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fecha\":\"2026-07-17\",\"observacion\":\"Cambio de fusor\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.observacion", is("Cambio de fusor")));
    }

    @Test
    @WithMockUser(authorities = "READ_impresoras")
    void crear_withoutWritePermission_returnsForbidden() throws Exception {
        mockMvc.perform(post("/api/impresoras/7/intervenciones")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fecha\":\"2026-07-17\",\"observacion\":\"obs\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "WRITE_impresoras")
    void actualizar_withWritePermission_returnsUpdatedDto() throws Exception {
        when(service.actualizar(eq(7L), eq(1L), any())).thenReturn(dto(1L, "Corregida"));

        mockMvc.perform(put("/api/impresoras/7/intervenciones/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fecha\":\"2026-07-17\",\"observacion\":\"Corregida\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.observacion", is("Corregida")));
    }

    @Test
    @WithMockUser(authorities = "WRITE_impresoras")
    void eliminar_withWritePermission_returnsNoContent() throws Exception {
        mockMvc.perform(delete("/api/impresoras/7/intervenciones/1"))
                .andExpect(status().isNoContent());

        verify(service).eliminar(7L, 1L);
    }

    @Test
    @WithMockUser(username = "tecnico1", authorities = "WRITE_impresoras")
    void subirAdjuntos_withWritePermission_returnsCreatedList() throws Exception {
        ImpresoraIntervencionAdjuntoDto adjDto = new ImpresoraIntervencionAdjuntoDto();
        adjDto.setId(10L);
        adjDto.setNombreOriginal("foto.jpg");
        adjDto.setMimeType("image/jpeg");
        adjDto.setSubidoPor("tecnico1");
        adjDto.setFechaSubida(LocalDateTime.now());
        when(service.subirAdjuntos(eq(7L), eq(1L), any(), eq("tecnico1"))).thenReturn(List.of(adjDto));

        MockMultipartFile file = new MockMultipartFile("files", "foto.jpg", "image/jpeg", "contenido".getBytes());

        mockMvc.perform(multipart("/api/impresoras/7/intervenciones/1/adjuntos").file(file))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$[0].nombreOriginal", is("foto.jpg")));
    }

    @Test
    @WithMockUser(authorities = "WRITE_impresoras")
    void eliminarAdjunto_withWritePermission_returnsNoContent() throws Exception {
        mockMvc.perform(delete("/api/impresoras/7/intervenciones/1/adjuntos/10"))
                .andExpect(status().isNoContent());

        verify(service).eliminarAdjunto(7L, 1L, 10L);
    }

    @Test
    @WithMockUser(authorities = "READ_impresoras")
    void eliminarAdjunto_withoutWritePermission_returnsForbidden() throws Exception {
        mockMvc.perform(delete("/api/impresoras/7/intervenciones/1/adjuntos/10"))
                .andExpect(status().isForbidden());
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd soportedesk-backend && mvn -q test -Dtest=ImpresoraIntervencionControllerIT`
Expected: FAIL — compilation error, `ImpresoraIntervencionController` does not exist.

- [ ] **Step 3: Implement `ImpresoraIntervencionController`**

```java
package com.inia.soportedesk.impresoras.intervencion;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/impresoras/{impresoraId}/intervenciones")
@RequiredArgsConstructor
public class ImpresoraIntervencionController {

    private final ImpresoraIntervencionService service;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_impresoras')")
    public List<ImpresoraIntervencionDto> listar(@PathVariable Long impresoraId) {
        return service.listar(impresoraId);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_impresoras')")
    public ResponseEntity<ImpresoraIntervencionDto> crear(@PathVariable Long impresoraId,
                                                            @Valid @RequestBody ImpresoraIntervencionRequest request,
                                                            Authentication auth) {
        ImpresoraIntervencionDto dto = service.crear(impresoraId, request, auth.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    @PutMapping("/{intervencionId}")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_impresoras')")
    public ImpresoraIntervencionDto actualizar(@PathVariable Long impresoraId,
                                                @PathVariable Long intervencionId,
                                                @Valid @RequestBody ImpresoraIntervencionRequest request) {
        return service.actualizar(impresoraId, intervencionId, request);
    }

    @DeleteMapping("/{intervencionId}")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_impresoras')")
    public ResponseEntity<Void> eliminar(@PathVariable Long impresoraId, @PathVariable Long intervencionId) {
        service.eliminar(impresoraId, intervencionId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{intervencionId}/adjuntos")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_impresoras')")
    public ResponseEntity<List<ImpresoraIntervencionAdjuntoDto>> subirAdjuntos(@PathVariable Long impresoraId,
                                                                                 @PathVariable Long intervencionId,
                                                                                 @RequestParam("files") List<MultipartFile> files,
                                                                                 Authentication auth) {
        List<ImpresoraIntervencionAdjuntoDto> dtos = service.subirAdjuntos(impresoraId, intervencionId, files, auth.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(dtos);
    }

    @GetMapping("/{intervencionId}/adjuntos/{adjuntoId}/archivo")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_impresoras')")
    public ResponseEntity<Resource> descargar(@PathVariable Long impresoraId,
                                               @PathVariable Long intervencionId,
                                               @PathVariable Long adjuntoId) {
        ArchivoIntervencionAdjunto archivo = service.cargarArchivo(impresoraId, intervencionId, adjuntoId);
        Resource resource = new FileSystemResource(archivo.path());
        boolean previewable = archivo.mimeType().startsWith("image/") || archivo.mimeType().equals("application/pdf");
        String disposition = (previewable ? "inline" : "attachment") + "; filename=\"" + archivo.nombreOriginal() + "\"";
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(archivo.mimeType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition)
                .body(resource);
    }

    @DeleteMapping("/{intervencionId}/adjuntos/{adjuntoId}")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_impresoras')")
    public ResponseEntity<Void> eliminarAdjunto(@PathVariable Long impresoraId,
                                                 @PathVariable Long intervencionId,
                                                 @PathVariable Long adjuntoId) {
        service.eliminarAdjunto(impresoraId, intervencionId, adjuntoId);
        return ResponseEntity.noContent().build();
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd soportedesk-backend && mvn -q test -Dtest=ImpresoraIntervencionControllerIT`
Expected: PASS, 8 tests green.

- [ ] **Step 5: Run the full backend test suite**

Run: `cd soportedesk-backend && mvn -q verify`
Expected: `BUILD SUCCESS`, no regressions in other modules.

- [ ] **Step 6: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/intervencion/ImpresoraIntervencionController.java soportedesk-backend/src/test/java/com/inia/soportedesk/impresoras/intervencion/ImpresoraIntervencionControllerIT.java
git commit -m "feat: agregar ImpresoraIntervencionController"
```

---

## Task 5: Modelo y servicio Angular

**Files:**
- Modify: `soportedesk-frontend/src/app/features/impresoras/impresora.model.ts`
- Modify: `soportedesk-frontend/src/app/features/impresoras/impresora.service.ts`

**Interfaces:**
- Consumes: nothing backend-specific beyond the REST contract from Task 4 (same JSON shape as `ImpresoraIntervencionDto`/`ImpresoraIntervencionAdjuntoDto`).
- Produces: TS interfaces `ImpresoraIntervencion`, `ImpresoraIntervencionAdjunto`, `ImpresoraIntervencionRequest`; `ImpresoraService` methods `getIntervenciones`, `crearIntervencion`, `actualizarIntervencion`, `eliminarIntervencion`, `subirAdjuntos`, `descargarAdjunto`, `eliminarAdjunto`. Consumed by `ImpresoraFichaComponent` in Task 6.

No dedicated test file for `ImpresoraService` in this codebase (same as `EquipoService`) — verified via TypeScript compilation, then exercised indirectly by the component spec in Task 6.

- [ ] **Step 1: Add the new interfaces to `impresora.model.ts`**

Append at the end of `soportedesk-frontend/src/app/features/impresoras/impresora.model.ts`:

```typescript
export interface ImpresoraIntervencionAdjunto {
  id: number;
  nombreOriginal: string;
  mimeType: string;
  subidoPor: string;
  fechaSubida: string;
}

export interface ImpresoraIntervencion {
  id: number;
  fecha: string;
  observacion: string;
  registradoPor: string;
  fechaRegistro: string;
  adjuntos: ImpresoraIntervencionAdjunto[];
}

export interface ImpresoraIntervencionRequest {
  fecha: string;
  observacion: string;
}
```

- [ ] **Step 2: Add the new methods to `impresora.service.ts`**

In `soportedesk-frontend/src/app/features/impresoras/impresora.service.ts`, update the import at the top:

```typescript
import { Impresora, ImpresoraDashboardCompleto, ImpresoraIntervencion, ImpresoraIntervencionAdjunto, ImpresoraIntervencionRequest, ImpresoraRequest } from './impresora.model';
```

Then append these methods inside the `ImpresoraService` class, before the closing brace:

```typescript
  getIntervenciones(impresoraId: number): Observable<ImpresoraIntervencion[]> {
    return this.http.get<ImpresoraIntervencion[]>(`${this.apiUrl}/${impresoraId}/intervenciones`);
  }

  crearIntervencion(impresoraId: number, request: ImpresoraIntervencionRequest): Observable<ImpresoraIntervencion> {
    return this.http.post<ImpresoraIntervencion>(`${this.apiUrl}/${impresoraId}/intervenciones`, request);
  }

  actualizarIntervencion(impresoraId: number, intervencionId: number, request: ImpresoraIntervencionRequest): Observable<ImpresoraIntervencion> {
    return this.http.put<ImpresoraIntervencion>(`${this.apiUrl}/${impresoraId}/intervenciones/${intervencionId}`, request);
  }

  eliminarIntervencion(impresoraId: number, intervencionId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${impresoraId}/intervenciones/${intervencionId}`);
  }

  subirAdjuntos(impresoraId: number, intervencionId: number, files: File[]): Observable<ImpresoraIntervencionAdjunto[]> {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    return this.http.post<ImpresoraIntervencionAdjunto[]>(
      `${this.apiUrl}/${impresoraId}/intervenciones/${intervencionId}/adjuntos`, formData);
  }

  descargarAdjunto(impresoraId: number, intervencionId: number, adjuntoId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${impresoraId}/intervenciones/${intervencionId}/adjuntos/${adjuntoId}/archivo`, { responseType: 'blob' });
  }

  eliminarAdjunto(impresoraId: number, intervencionId: number, adjuntoId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${impresoraId}/intervenciones/${intervencionId}/adjuntos/${adjuntoId}`);
  }
```

- [ ] **Step 3: Verify TypeScript compiles clean**

Run: `cd soportedesk-frontend && npx tsc --noEmit -p tsconfig.app.json`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add soportedesk-frontend/src/app/features/impresoras/impresora.model.ts soportedesk-frontend/src/app/features/impresoras/impresora.service.ts
git commit -m "feat: agregar modelo y servicio Angular para Intervenciones de Impresoras"
```

---

## Task 6: Tab "Intervenciones" en `ImpresoraFichaComponent`

**Files:**
- Modify: `soportedesk-frontend/src/app/features/impresoras/impresora-ficha.component.ts`
- Modify: `soportedesk-frontend/src/app/features/impresoras/impresora-ficha.component.html`
- Modify: `soportedesk-frontend/src/app/features/impresoras/impresora-ficha.component.scss`
- Modify: `soportedesk-frontend/src/app/features/impresoras/impresora-ficha.component.spec.ts`

**Interfaces:**
- Consumes: `ImpresoraService.getIntervenciones/crearIntervencion/actualizarIntervencion/eliminarIntervencion/subirAdjuntos/descargarAdjunto/eliminarAdjunto` (Task 5); `ImpresoraIntervencion`, `ImpresoraIntervencionAdjunto` (Task 5); `ModalComponent` (existing, `soportedesk-frontend/src/app/shared/modal/modal.component.ts`, inputs `title: string`, `open: boolean`, output `closed`).
- Produces: nothing consumed by later tasks — this is the final task.

- [ ] **Step 1: Write the failing tests**

Add these tests to the end of `describe('ImpresoraFichaComponent', ...)` in `soportedesk-frontend/src/app/features/impresoras/impresora-ficha.component.spec.ts`, right before the final closing `});` of the file. Also add `HttpTestingController` wiring — replace the two `beforeEach`/`TestBed` blocks that use `HttpClientTestingModule` is already imported, so only new imports and a helper are needed. At the top of the file, add:

```typescript
import { HttpTestingController } from '@angular/common/http/testing';
import { ImpresoraIntervencion } from './impresora.model';
```

Then add this block at the end of the file, before the final `});`:

```typescript
describe('ImpresoraFichaComponent — Intervenciones', () => {
  let component: ImpresoraFichaComponent;
  let fixture: ComponentFixture<ImpresoraFichaComponent>;
  let httpMock: HttpTestingController;

  const mockIntervencion: ImpresoraIntervencion = {
    id: 1,
    fecha: '2026-07-17',
    observacion: 'Cambio de fusor',
    registradoPor: 'tecnico1',
    fechaRegistro: '2026-07-17T10:00:00',
    adjuntos: [],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImpresoraFichaComponent, HttpClientTestingModule],
      providers: [{ provide: AuthService, useValue: { isAdmin: () => false, canWrite: () => true } }],
    }).compileComponents();

    fixture = TestBed.createComponent(ImpresoraFichaComponent);
    component = fixture.componentInstance;
    component.impresora = mockImpresora;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads intervenciones on init', () => {
    const req = httpMock.expectOne((r) => r.url.endsWith('/impresoras/1/intervenciones') && r.method === 'GET');
    req.flush([mockIntervencion]);

    expect(component.intervenciones().length).toBe(1);
    expect(component.intervenciones()[0].observacion).toBe('Cambio de fusor');
  });

  it('creates a new intervencion and prepends it to the list', () => {
    httpMock.expectOne((r) => r.url.endsWith('/impresoras/1/intervenciones') && r.method === 'GET').flush([]);

    component.nuevaFecha = '2026-07-17';
    component.nuevaObservacion = 'Limpieza general';
    component.crearIntervencion();

    const req = httpMock.expectOne((r) => r.url.endsWith('/impresoras/1/intervenciones') && r.method === 'POST');
    expect(req.request.body).toEqual({ fecha: '2026-07-17', observacion: 'Limpieza general' });
    req.flush({ ...mockIntervencion, id: 2, observacion: 'Limpieza general' });

    expect(component.intervenciones()[0].observacion).toBe('Limpieza general');
    expect(component.nuevaObservacion).toBe('');
  });

  it('removes an intervencion from the list after deletion', () => {
    httpMock.expectOne((r) => r.url.endsWith('/impresoras/1/intervenciones') && r.method === 'GET').flush([mockIntervencion]);
    spyOn(window, 'confirm').and.returnValue(true);

    component.eliminarIntervencion(component.intervenciones()[0]);

    const req = httpMock.expectOne((r) => r.url.endsWith('/impresoras/1/intervenciones/1') && r.method === 'DELETE');
    req.flush(null);

    expect(component.intervenciones().length).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd soportedesk-frontend && npx ng test --watch=false --include='**/impresora-ficha.component.spec.ts'`
Expected: FAIL — `component.intervenciones` is not a function / `crearIntervencion` is not a function (the component doesn't have these members yet).

- [ ] **Step 3: Update `impresora-ficha.component.ts`**

Replace the full file content:

```typescript
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { CatalogoService } from '../../core/catalogos/catalogo.service';
import { Impresora, ImpresoraIntervencion, ImpresoraIntervencionAdjunto, impresoraEstadoTone } from './impresora.model';
import { ImpresoraService } from './impresora.service';
import { ModeloImpresoraToner } from '../../core/models/catalogo.model';
import { ModalComponent } from '../../shared/modal/modal.component';
import { SectionCardComponent } from '../../shared/section-card/section-card.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';

type FichaTab = 'instalacion' | 'consumibles' | 'driver' | 'intervenciones';

interface AdjuntoView extends ImpresoraIntervencionAdjunto {
  previewUrl: string | null;
}

interface IntervencionView extends Omit<ImpresoraIntervencion, 'adjuntos'> {
  adjuntos: AdjuntoView[];
}

@Component({
  selector: 'app-impresora-ficha',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, SectionCardComponent, StatusBadgeComponent],
  templateUrl: './impresora-ficha.component.html',
  styleUrl: './impresora-ficha.component.scss',
})
export class ImpresoraFichaComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private catalogoService = inject(CatalogoService);
  private impresoraService = inject(ImpresoraService);

  @Input({ required: true }) impresora!: Impresora;
  @Input() allowActions = true;
  @Output() editRequested = new EventEmitter<Impresora>();

  activeTab: FichaTab = 'instalacion';
  readonly impresoraEstadoTone = impresoraEstadoTone;

  intervenciones = signal<IntervencionView[]>([]);
  errorIntervencion = signal<string | null>(null);
  guardandoIntervencion = signal(false);
  visorUrl = signal<string | null>(null);
  nuevaFecha = '';
  nuevaObservacion = '';
  editando: IntervencionView | null = null;
  editFecha = '';
  editObservacion = '';

  get isAdmin(): boolean {
    return this.authService.canWrite('impresoras');
  }

  get tonersPorColor(): { color: string; variantes: ModeloImpresoraToner[] }[] {
    const grupos = new Map<string, ModeloImpresoraToner[]>();
    for (const toner of this.impresora.modeloImpresora?.toners ?? []) {
      const lista = grupos.get(toner.color) ?? [];
      lista.push(toner);
      grupos.set(toner.color, lista);
    }
    return Array.from(grupos.entries()).map(([color, variantes]) => ({ color, variantes }));
  }

  ngOnInit(): void {
    this.loadIntervenciones();
  }

  ngOnDestroy(): void {
    this.intervenciones().forEach((i) => i.adjuntos.forEach((a) => { if (a.previewUrl) URL.revokeObjectURL(a.previewUrl); }));
    const visor = this.visorUrl();
    if (visor) URL.revokeObjectURL(visor);
  }

  setTab(tab: FichaTab): void {
    this.activeTab = tab;
  }

  downloadDriver(): void {
    const modeloId = this.impresora.modeloImpresora.id;
    this.catalogoService.downloadModeloImpresoraDriver(modeloId).subscribe((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = this.impresora.modeloImpresora.driverNombre ?? 'driver';
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  loadIntervenciones(): void {
    this.impresoraService.getIntervenciones(this.impresora.id).subscribe((items) => {
      const views: IntervencionView[] = items.map((item) => ({
        ...item,
        adjuntos: item.adjuntos.map((a) => ({ ...a, previewUrl: null })),
      }));
      this.intervenciones.set(views);
      views.forEach((view) => view.adjuntos.forEach((adjunto) => this.cargarPreview(view.id, adjunto)));
    });
  }

  crearIntervencion(): void {
    if (!this.nuevaFecha || !this.nuevaObservacion.trim()) return;
    this.guardandoIntervencion.set(true);
    this.errorIntervencion.set(null);
    this.impresoraService.crearIntervencion(this.impresora.id, { fecha: this.nuevaFecha, observacion: this.nuevaObservacion.trim() })
      .subscribe({
        next: (nueva) => {
          this.guardandoIntervencion.set(false);
          this.nuevaFecha = '';
          this.nuevaObservacion = '';
          const view: IntervencionView = { ...nueva, adjuntos: [] };
          this.intervenciones.set([view, ...this.intervenciones()]);
        },
        error: (err) => {
          this.guardandoIntervencion.set(false);
          this.errorIntervencion.set(err?.error?.message || 'No se pudo registrar la intervención.');
        },
      });
  }

  iniciarEdicion(intervencion: IntervencionView): void {
    this.editando = intervencion;
    this.editFecha = intervencion.fecha;
    this.editObservacion = intervencion.observacion;
  }

  cancelarEdicion(): void {
    this.editando = null;
  }

  guardarEdicion(): void {
    if (!this.editando || !this.editFecha || !this.editObservacion.trim()) return;
    const intervencionId = this.editando.id;
    this.impresoraService.actualizarIntervencion(this.impresora.id, intervencionId, {
      fecha: this.editFecha,
      observacion: this.editObservacion.trim(),
    }).subscribe((actualizada) => {
      this.intervenciones.set(this.intervenciones().map((i) =>
        i.id === intervencionId ? { ...i, fecha: actualizada.fecha, observacion: actualizada.observacion } : i
      ));
      this.editando = null;
    });
  }

  eliminarIntervencion(intervencion: IntervencionView): void {
    if (!confirm(`¿Eliminar la intervención del ${intervencion.fecha}?`)) return;
    intervencion.adjuntos.forEach((a) => { if (a.previewUrl) URL.revokeObjectURL(a.previewUrl); });
    this.impresoraService.eliminarIntervencion(this.impresora.id, intervencion.id).subscribe(() => {
      this.intervenciones.set(this.intervenciones().filter((i) => i.id !== intervencion.id));
    });
  }

  onAdjuntosSelected(event: Event, intervencionId: number): void {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    if (!files.length) return;

    this.errorIntervencion.set(null);
    this.impresoraService.subirAdjuntos(this.impresora.id, intervencionId, files).subscribe({
      next: (nuevosAdjuntos) => {
        input.value = '';
        const views: AdjuntoView[] = nuevosAdjuntos.map((a) => ({ ...a, previewUrl: null }));
        this.intervenciones.set(this.intervenciones().map((i) =>
          i.id === intervencionId ? { ...i, adjuntos: [...i.adjuntos, ...views] } : i
        ));
        views.forEach((adjunto) => this.cargarPreview(intervencionId, adjunto));
      },
      error: (err) => {
        this.errorIntervencion.set(err?.error?.message || 'No se pudo subir el/los archivo(s).');
        input.value = '';
      },
    });
  }

  eliminarAdjunto(intervencionId: number, adjunto: AdjuntoView): void {
    if (!confirm(`¿Eliminar el adjunto "${adjunto.nombreOriginal}"?`)) return;
    this.impresoraService.eliminarAdjunto(this.impresora.id, intervencionId, adjunto.id).subscribe(() => {
      if (adjunto.previewUrl) URL.revokeObjectURL(adjunto.previewUrl);
      this.intervenciones.set(this.intervenciones().map((i) =>
        i.id === intervencionId ? { ...i, adjuntos: i.adjuntos.filter((a) => a.id !== adjunto.id) } : i
      ));
    });
  }

  abrirAdjunto(intervencionId: number, adjunto: AdjuntoView): void {
    if (adjunto.mimeType.startsWith('image/')) {
      if (adjunto.previewUrl) this.visorUrl.set(adjunto.previewUrl);
      return;
    }
    this.impresoraService.descargarAdjunto(this.impresora.id, intervencionId, adjunto.id).subscribe((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = adjunto.nombreOriginal;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  cerrarVisor(): void {
    this.visorUrl.set(null);
  }

  private cargarPreview(intervencionId: number, adjunto: AdjuntoView): void {
    if (!adjunto.mimeType.startsWith('image/')) return;
    this.impresoraService.descargarAdjunto(this.impresora.id, intervencionId, adjunto.id).subscribe((blob) => {
      adjunto.previewUrl = URL.createObjectURL(blob);
      this.intervenciones.set([...this.intervenciones()]);
    });
  }
}
```

- [ ] **Step 4: Replace `impresora-ficha.component.html` with its full new content**

Replace the entire file content (adds the new tab button, the new tab content block, and the viewer modal at the end):

```html
<div class="ficha">
  <div class="ficha-toolbar">
  <div class="tabs">
    <button type="button" [class.active]="activeTab === 'instalacion'" (click)="setTab('instalacion')">Instalación</button>
    <button type="button" [class.active]="activeTab === 'consumibles'" (click)="setTab('consumibles')">Consumibles</button>
    <button type="button" [class.active]="activeTab === 'driver'" (click)="setTab('driver')">Driver</button>
    <button type="button" [class.active]="activeTab === 'intervenciones'" (click)="setTab('intervenciones')">Intervenciones</button>
  </div>
  <button *ngIf="isAdmin && allowActions" type="button" class="edit-btn" (click)="editRequested.emit(impresora)">Editar</button>
  </div>

  <div class="content" *ngIf="activeTab === 'instalacion'">
    <app-section-card title="Identificación">
      <svg icon xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M4 7h16" />
        <path d="M7 3h10v4H7z" />
        <path d="M6 14h12v7H6z" />
      </svg>

      <div class="detail-grid">
        <div class="detail-field">
          <span class="detail-label">Marca / Modelo</span>
          <span class="detail-value">{{ impresora.modeloImpresora.marca.nombre }} {{ impresora.modeloImpresora.nombre }}</span>
        </div>
        <div class="detail-field">
          <span class="detail-label">Tipo de impresora</span>
          <span class="detail-value">{{ impresora.tipoImpresora?.nombre || '—' }}</span>
        </div>
        <div class="detail-field">
          <span class="detail-label">Serie</span>
          <span class="detail-value">{{ impresora.serie || '—' }}</span>
        </div>
        <div class="detail-field">
          <span class="detail-label">Código de Inventario</span>
          <span class="detail-value">{{ impresora.codigoInventario || '—' }}</span>
        </div>
        <div class="detail-field">
          <span class="detail-label">Código Patrimonial</span>
          <span class="detail-value">{{ impresora.codigoPatrimonial || '—' }}</span>
        </div>
        <div class="detail-field">
          <span class="detail-label">Estado</span>
          <span class="detail-value">
            <app-status-badge [label]="impresora.estado" [tone]="impresoraEstadoTone(impresora.estado)" />
          </span>
        </div>
      </div>
    </app-section-card>

    <app-section-card title="Referencia">
      <svg icon xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M4 4h16v16H4z" />
        <path d="M8 8h8" />
        <path d="M8 12h8" />
        <path d="M8 16h5" />
      </svg>

      <p class="reference-note">{{ impresora.referencia || 'Sin referencia registrada.' }}</p>
    </app-section-card>

    <app-section-card title="Conexión y ubicación">
      <svg icon xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 21s7-4.35 7-11a7 7 0 1 0-14 0c0 6.65 7 11 7 11z" />
        <circle cx="12" cy="10" r="2" />
      </svg>

      <div class="detail-grid">
        <div class="detail-field">
          <span class="detail-label">Conexión</span>
          <span class="detail-value">
            {{ impresora.tipoConexion }}<ng-container *ngIf="impresora.tipoConexion === 'IP'"> — <code>{{ impresora.ip }}</code></ng-container>
          </span>
        </div>
        <div class="detail-field">
          <span class="detail-label">Sede</span>
          <span class="detail-value">{{ impresora.sede?.nombre || '—' }}</span>
        </div>
        <div class="detail-field">
          <span class="detail-label">Dependencia</span>
          <span class="detail-value">{{ impresora.dependencia?.nombre || '—' }}</span>
        </div>
        <div class="detail-field">
          <span class="detail-label">Subdependencia</span>
          <span class="detail-value">{{ impresora.subdependencia?.nombre || '—' }}</span>
        </div>
      </div>
    </app-section-card>
  </div>

  <div class="content" *ngIf="activeTab === 'consumibles'">
    <app-section-card title="Consumibles">
      <svg icon xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M4 7h16v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </svg>

      <ng-container *ngIf="tonersPorColor.length; else noConsumibles">
        <div class="consumibles-grid">
          <div class="consumible-card" *ngFor="let grupo of tonersPorColor">
            <span>{{ grupo.color }}</span>
            <div class="toner-variante" *ngFor="let variante of grupo.variantes">
              <strong>{{ variante.variante }}</strong> — {{ variante.codigo }}
            </div>
          </div>
        </div>
      </ng-container>
      <ng-template #noConsumibles>
        <p class="empty-message">Sin modelos de consumibles registrados.</p>
      </ng-template>
    </app-section-card>
  </div>

  <div class="content" *ngIf="activeTab === 'driver'">
    <app-section-card title="Driver del modelo">
      <svg icon xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <path d="M7 10l5 5 5-5" />
        <path d="M12 15V3" />
      </svg>

      <ng-container *ngIf="impresora.modeloImpresora.driverNombre; else noDriver">
        <div class="detail-grid">
          <div class="detail-field">
            <span class="detail-label">Nombre</span>
            <span class="detail-value">{{ impresora.modeloImpresora.driverNombre }}</span>
          </div>
          <div class="detail-field">
            <span class="detail-label">Versión</span>
            <span class="detail-value">{{ impresora.modeloImpresora.driverVersion || '—' }}</span>
          </div>
          <div class="detail-field">
            <span class="detail-label">S.O.</span>
            <span class="detail-value">{{ impresora.modeloImpresora.driverSo || '—' }}</span>
          </div>
        </div>
        <button type="button" class="download-btn" (click)="downloadDriver()">Descargar driver</button>
      </ng-container>
      <ng-template #noDriver>
        <p class="empty-message">El modelo {{ impresora.modeloImpresora.marca.nombre }} {{ impresora.modeloImpresora.nombre }} no tiene driver cargado.</p>
      </ng-template>
    </app-section-card>
  </div>

  <div class="content" *ngIf="activeTab === 'intervenciones'">
    <app-section-card title="Intervenciones">
      <svg icon xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>

      <div class="intervencion-nueva" *ngIf="isAdmin">
        <input type="date" [(ngModel)]="nuevaFecha" [ngModelOptions]="{standalone: true}" />
        <input type="text" placeholder="Observación" [(ngModel)]="nuevaObservacion" [ngModelOptions]="{standalone: true}" />
        <button type="button" class="btn btn-primary" [disabled]="guardandoIntervencion()" (click)="crearIntervencion()">
          {{ guardandoIntervencion() ? 'Guardando...' : 'Nueva intervención' }}
        </button>
      </div>
      <p class="intervencion-error" *ngIf="errorIntervencion()">{{ errorIntervencion() }}</p>

      <div class="intervencion-list" *ngIf="intervenciones().length; else sinIntervenciones">
        <div class="intervencion-card" *ngFor="let it of intervenciones()">
          <ng-container *ngIf="editando?.id === it.id; else vistaIntervencion">
            <div class="intervencion-edit">
              <input type="date" [(ngModel)]="editFecha" [ngModelOptions]="{standalone: true}" />
              <input type="text" [(ngModel)]="editObservacion" [ngModelOptions]="{standalone: true}" />
              <button type="button" class="btn btn-primary" (click)="guardarEdicion()">Guardar</button>
              <button type="button" class="btn btn-ghost" (click)="cancelarEdicion()">Cancelar</button>
            </div>
          </ng-container>
          <ng-template #vistaIntervencion>
            <div class="intervencion-header">
              <div>
                <strong>{{ it.observacion }}</strong>
                <span>{{ it.fecha }} · {{ it.registradoPor }}</span>
              </div>
              <div class="intervencion-actions" *ngIf="isAdmin">
                <button type="button" class="btn btn-icon" (click)="iniciarEdicion(it)" aria-label="Editar intervención">✎</button>
                <button type="button" class="btn btn-icon" (click)="eliminarIntervencion(it)" aria-label="Eliminar intervención">✕</button>
              </div>
            </div>
          </ng-template>

          <div class="intervencion-adjuntos" *ngIf="it.adjuntos.length">
            <div class="adjunto-card" *ngFor="let adj of it.adjuntos">
              <button type="button" class="adjunto-thumb" (click)="abrirAdjunto(it.id, adj)">
                <img *ngIf="adj.mimeType.startsWith('image/') && adj.previewUrl" [src]="adj.previewUrl" [alt]="adj.nombreOriginal" />
                <span *ngIf="adj.mimeType.startsWith('image/') && !adj.previewUrl" class="adjunto-thumb-loading">Cargando…</span>
                <span *ngIf="!adj.mimeType.startsWith('image/')" class="adjunto-file-icon">{{ adj.mimeType === 'application/pdf' ? 'PDF' : 'DOC' }}</span>
              </button>
              <div class="adjunto-meta">
                <strong>{{ adj.nombreOriginal }}</strong>
                <span>{{ adj.subidoPor }}</span>
              </div>
              <button type="button" class="btn btn-icon adjunto-delete" *ngIf="isAdmin" (click)="eliminarAdjunto(it.id, adj)" aria-label="Eliminar adjunto">✕</button>
            </div>
          </div>

          <label class="btn btn-secondary adjunto-upload-btn" *ngIf="isAdmin">
            Agregar adjuntos
            <input type="file" multiple accept="image/jpeg,image/png,image/webp,application/pdf,.docx,.xlsx" (change)="onAdjuntosSelected($event, it.id)" hidden />
          </label>
        </div>
      </div>
      <ng-template #sinIntervenciones><p class="empty-message">Sin intervenciones registradas para esta impresora.</p></ng-template>
    </app-section-card>
  </div>
</div>

<app-modal title="Adjunto" [open]="visorUrl() !== null" (closed)="cerrarVisor()">
  <img *ngIf="visorUrl()" [src]="visorUrl()" class="intervencion-visor-img" alt="Adjunto ampliado" />
</app-modal>
```

- [ ] **Step 5: Add SCSS styles**

Append to the end of `soportedesk-frontend/src/app/features/impresoras/impresora-ficha.component.scss`:

```scss
.intervencion-nueva {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  margin-bottom: 14px;

  input[type="text"], input[type="date"] {
    padding: 8px 12px;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    background: var(--color-surface);
    color: var(--color-text);
  }
  input[type="text"] { flex: 1 1 220px; min-width: 0; }
}

.intervencion-error {
  margin: 0 0 14px;
  color: var(--color-danger);
  font-size: .85rem;
}

.intervencion-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.intervencion-card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 12px;
  background: var(--color-muted);
}

.intervencion-header {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;

  strong { display: block; color: var(--color-text); }
  span { color: var(--color-text-secondary); font-size: .8rem; }
}

.intervencion-actions {
  display: flex;
  gap: 4px;
  flex: 0 0 auto;
}

.intervencion-edit {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 10px;

  input[type="text"] { flex: 1 1 220px; min-width: 0; padding: 6px 10px; border: 1px solid var(--color-border); border-radius: 6px; }
  input[type="date"] { padding: 6px 10px; border: 1px solid var(--color-border); border-radius: 6px; }
}

.intervencion-adjuntos {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
  margin-bottom: 10px;
}

.adjunto-card {
  position: relative;
  display: grid;
  gap: 4px;
}

.adjunto-thumb {
  display: grid;
  place-items: center;
  width: 100%;
  aspect-ratio: 4 / 3;
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: 9px;
  background: var(--color-surface);
  overflow: hidden;
  cursor: pointer;

  img { width: 100%; height: 100%; object-fit: cover; }
}

.adjunto-thumb-loading {
  color: var(--color-text-secondary);
  font-size: .7rem;
}

.adjunto-file-icon {
  font-size: .75rem;
  font-weight: 800;
  color: var(--color-text-secondary);
}

.adjunto-meta {
  display: grid;
  gap: 2px;
  font-size: .72rem;

  strong { color: var(--color-text); overflow-wrap: anywhere; }
  span { color: var(--color-text-secondary); }
}

.adjunto-delete {
  position: absolute;
  top: 4px;
  right: 4px;
  background: var(--color-surface);
}

.adjunto-upload-btn {
  cursor: pointer;
  display: inline-block;
}

.intervencion-visor-img {
  display: block;
  max-width: 100%;
  max-height: 75vh;
  margin: 0 auto;
  border-radius: 9px;
}
```

- [ ] **Step 6: Update the existing spec's `beforeEach` blocks to flush the new HTTP call**

The existing tests in `impresora-ficha.component.spec.ts` call `fixture.detectChanges()` right after `component.impresora = mockImpresora`, which now triggers `ngOnInit` → `loadIntervenciones()` → an HTTP GET. Without `HttpTestingController` in those blocks, `HttpClientTestingModule` queues the request harmlessly (no assertion needed) — existing tests keep passing unmodified, since `HttpClientTestingModule` doesn't fail on unflushed requests unless `httpMock.verify()` is called in that describe block. No changes needed to the pre-existing tests or their two `TestBed.resetTestingModule()` blocks.

- [ ] **Step 7: Run tests to verify they pass**

Run: `cd soportedesk-frontend && npx ng test --watch=false --include='**/impresora-ficha.component.spec.ts'`
Expected: PASS, all tests green (original + 3 new ones).

- [ ] **Step 8: Verify TypeScript compiles clean**

Run: `cd soportedesk-frontend && npx tsc --noEmit -p tsconfig.app.json`
Expected: no errors.

- [ ] **Step 9: Commit**

```bash
git add soportedesk-frontend/src/app/features/impresoras/impresora-ficha.component.ts soportedesk-frontend/src/app/features/impresoras/impresora-ficha.component.html soportedesk-frontend/src/app/features/impresoras/impresora-ficha.component.scss soportedesk-frontend/src/app/features/impresoras/impresora-ficha.component.spec.ts
git commit -m "feat: agregar tab Intervenciones a la ficha de impresora"
```

---

## Post-implementation: pasos manuales del usuario

Estos pasos NO están automatizados por este plan — quedan para el usuario, siguiendo el mismo criterio que las migraciones anteriores del proyecto:

1. Ejecutar `docs/superpowers/migrations/2026-07-17-impresoras-intervenciones.sql` contra la base de datos SQL Server (`ssti`).
2. Verificar manualmente en el navegador: abrir la ficha de una impresora, ir a la pestaña "Intervenciones", crear una intervención, subir 2-3 adjuntos de tipos distintos (imagen + PDF), editarla, eliminar un adjunto, eliminar la intervención completa, y confirmar que un usuario sin `WRITE_impresoras` no ve los botones de escritura (checklist de la sección 7 del spec).
