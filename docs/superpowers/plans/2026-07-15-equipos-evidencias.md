# Equipos — Evidencias (fotos) por equipo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an "Evidencias" section to the equipo detail page in SoporteDesk that lets users view and upload photos of an equipment item, stored entirely in SoporteDesk (no ongoing GLPI dependency), plus a one-time script to migrate the 2 photos that already exist in GLPI.

**Architecture:** New backend module `com.inia.soportedesk.equipos.evidencia` (entity + repository + DTO + a small file-storage service parallel to the existing `FileStorageService` + service + controller), a new SQL Server table `equipos_evidencias` keyed by GLPI `computer_id` (same pattern as `equipos_enrichment`), and a new "Evidencias" `section-band` in `EquipoDetailComponent` with upload/view/delete, gated by the existing `WRITE_equipos` permission. Images are always fetched as authenticated blobs (never public `<img src>` URLs), mirroring the existing printer-driver-download pattern.

**Tech Stack:** Spring Boot 3.2.5 / Java 17 / Maven (backend), Angular 17+ standalone components (frontend), SQL Server (`ddl-auto: none`, manual migration scripts), JUnit 5 + Mockito + AssertJ (backend tests), Python 3 + `requests` (one-time migration script, not part of the app).

## Global Constraints

- Backend package root: `com.inia.soportedesk` — new code goes under `com.inia.soportedesk.equipos.evidencia`.
- `spring.jpa.hibernate.ddl-auto: none` and `spring.sql.init.mode: never` in production — schema changes ship as a standalone `.sql` file the user runs manually in SSMS, never rely on Hibernate to create tables outside of tests.
- Tests use `ddl-auto: create-drop` against H2 (`src/test/resources/application.yml`) — JPA entities alone are enough for backend tests to pass; the manual SQL migration is only needed for the real SQL Server database.
- Permission checks on controllers: `@PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_equipos')")` for reads, `WRITE_equipos` for writes — copy this exact pattern from `EquipoEnrichmentController`.
- Lombok `@Getter @Setter @NoArgsConstructor` on entities/DTOs — no manual getters/setters.
- Backend test stack: JUnit 5 (`@ExtendWith(MockitoExtension.class)`, `@Mock`, `@InjectMocks`) for unit tests, `@SpringBootTest @AutoConfigureMockMvc` + `@MockBean` + `MockMvc` for controller tests, AssertJ (`assertThat`) for assertions — never JUnit4 or Hamcrest assertions (Hamcrest `is()` is only used inside `jsonPath(...)`, matching existing IT tests).
- Frontend: standalone Angular components, signals (`signal()`/`computed()`) for local state — no NgRx, no RxJS state management beyond plain `Observable.subscribe()`.
- No automated frontend tests exist for the `equipos` feature today — verification for frontend tasks is `ng build` succeeding plus manual browser verification, matching how the rest of this feature area is tested.
- Authenticated file downloads always go through `HttpClient` with `responseType: 'blob'` then `URL.createObjectURL(blob)` — never a plain `<img src="/api/...">` (the API requires a JWT the browser won't attach to a bare image request).

---

### Task 1: Data model, SQL migration, and evidence file storage

**Files:**
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/evidencia/EquipoEvidencia.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/evidencia/EquipoEvidenciaRepository.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/evidencia/EquipoEvidenciaDto.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/evidencia/EvidenciaStorageService.java`
- Create: `soportedesk-backend/src/test/java/com/inia/soportedesk/equipos/evidencia/EvidenciaStorageServiceTest.java`
- Create: `docs/superpowers/migrations/2026-07-15-equipos-evidencias.sql`
- Modify: `soportedesk-backend/src/main/resources/application.yml`
- Modify: `soportedesk-backend/src/test/resources/application.yml`

**Interfaces:**
- Produces: `EquipoEvidencia` entity (`id`, `computerId`, `archivoPath`, `nombreOriginal`, `mimeType`, `descripcion`, `subidoPor`, `fechaSubida`), `EquipoEvidenciaRepository.findByComputerIdOrderByFechaSubidaDesc(Long): List<EquipoEvidencia>`, `EquipoEvidenciaRepository.findByIdAndComputerId(Long, Long): Optional<EquipoEvidencia>`, `EquipoEvidenciaDto` (same fields minus `computerId`/`archivoPath`/`mimeType`), `EvidenciaStorageService.store(Long computerId, MultipartFile file): String`, `.load(String relativePath): Path`, `.delete(String relativePath): void`. Task 2 consumes all of these.

- [ ] **Step 1: Write the failing test for `EvidenciaStorageService`**

Create `soportedesk-backend/src/test/java/com/inia/soportedesk/equipos/evidencia/EvidenciaStorageServiceTest.java`:

```java
package com.inia.soportedesk.equipos.evidencia;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;

class EvidenciaStorageServiceTest {

    @TempDir
    Path tempDir;

    private EvidenciaStorageService service;

    @BeforeEach
    void setUp() {
        service = new EvidenciaStorageService(tempDir.toString());
    }

    @Test
    void store_savesFileUnderComputerSubfolderWithUniqueName() throws IOException {
        MockMultipartFile file = new MockMultipartFile("file", "foto.jpg", "image/jpeg", "contenido".getBytes());

        String relativePath = service.store(291L, file);

        assertThat(relativePath).startsWith("291/").endsWith(".jpg");
        Path stored = tempDir.resolve(relativePath);
        assertThat(Files.exists(stored)).isTrue();
        assertThat(Files.readString(stored)).isEqualTo("contenido");
    }

    @Test
    void store_twoFilesWithSameOriginalName_doNotOverwriteEachOther() throws IOException {
        MockMultipartFile first = new MockMultipartFile("file", "foto.jpg", "image/jpeg", "primera".getBytes());
        MockMultipartFile second = new MockMultipartFile("file", "foto.jpg", "image/jpeg", "segunda".getBytes());

        String firstPath = service.store(291L, first);
        String secondPath = service.store(291L, second);

        assertThat(firstPath).isNotEqualTo(secondPath);
        assertThat(Files.readString(tempDir.resolve(firstPath))).isEqualTo("primera");
        assertThat(Files.readString(tempDir.resolve(secondPath))).isEqualTo("segunda");
    }

    @Test
    void load_returnsPathToStoredFile() throws IOException {
        MockMultipartFile file = new MockMultipartFile("file", "foto.jpg", "image/jpeg", "contenido".getBytes());
        String relativePath = service.store(291L, file);

        Path loaded = service.load(relativePath);

        assertThat(Files.exists(loaded)).isTrue();
    }

    @Test
    void delete_removesStoredFile() throws IOException {
        MockMultipartFile file = new MockMultipartFile("file", "foto.jpg", "image/jpeg", "contenido".getBytes());
        String relativePath = service.store(291L, file);

        service.delete(relativePath);

        assertThat(Files.exists(tempDir.resolve(relativePath))).isFalse();
    }
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd soportedesk-backend && mvn test -Dtest=EvidenciaStorageServiceTest`
Expected: FAIL — compile error, `EvidenciaStorageService` does not exist yet.

- [ ] **Step 3: Create the entity, repository, and DTO**

Create `soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/evidencia/EquipoEvidencia.java`:

```java
package com.inia.soportedesk.equipos.evidencia;

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
@Table(name = "equipos_evidencias")
@Getter
@Setter
@NoArgsConstructor
public class EquipoEvidencia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "computer_id", nullable = false)
    private Long computerId;

    @Column(name = "archivo_path", nullable = false)
    private String archivoPath;

    @Column(name = "nombre_original", nullable = false)
    private String nombreOriginal;

    @Column(name = "mime_type", nullable = false)
    private String mimeType;

    private String descripcion;

    @Column(name = "subido_por", nullable = false)
    private String subidoPor;

    @Column(name = "fecha_subida", nullable = false)
    private LocalDateTime fechaSubida;
}
```

Create `soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/evidencia/EquipoEvidenciaRepository.java`:

```java
package com.inia.soportedesk.equipos.evidencia;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EquipoEvidenciaRepository extends JpaRepository<EquipoEvidencia, Long> {
    List<EquipoEvidencia> findByComputerIdOrderByFechaSubidaDesc(Long computerId);
    Optional<EquipoEvidencia> findByIdAndComputerId(Long id, Long computerId);
}
```

Create `soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/evidencia/EquipoEvidenciaDto.java`:

```java
package com.inia.soportedesk.equipos.evidencia;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class EquipoEvidenciaDto {
    private Long id;
    private String nombreOriginal;
    private String descripcion;
    private String subidoPor;
    private LocalDateTime fechaSubida;
}
```

- [ ] **Step 4: Implement `EvidenciaStorageService`**

Create `soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/evidencia/EvidenciaStorageService.java`:

```java
package com.inia.soportedesk.equipos.evidencia;

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
public class EvidenciaStorageService {

    private final Path rootDir;

    public EvidenciaStorageService(@Value("${uploads.evidencias-dir}") String evidenciasDir) {
        this.rootDir = Paths.get(evidenciasDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(rootDir);
        } catch (IOException e) {
            throw new FileStorageException("No se pudo crear el directorio de almacenamiento: " + rootDir, e);
        }
    }

    public String store(Long computerId, MultipartFile file) {
        String originalName = Paths.get(file.getOriginalFilename()).getFileName().toString();
        String extension = originalName.contains(".") ? originalName.substring(originalName.lastIndexOf('.')) : "";
        String uniqueName = UUID.randomUUID() + extension;
        Path targetDir = rootDir.resolve(String.valueOf(computerId));
        try {
            Files.createDirectories(targetDir);
            Path target = targetDir.resolve(uniqueName);
            try (var inputStream = file.getInputStream()) {
                Files.copy(inputStream, target, StandardCopyOption.REPLACE_EXISTING);
            }
            return computerId + "/" + uniqueName;
        } catch (IOException e) {
            throw new FileStorageException("No se pudo guardar la evidencia: " + originalName, e);
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
            throw new FileStorageException("No se pudo eliminar la evidencia: " + relativePath, e);
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

- [ ] **Step 5: Add the config property in both `application.yml` files**

In `soportedesk-backend/src/main/resources/application.yml`, find the existing `uploads:` block (around line 32-33) and add the new key so it reads:

```yaml
uploads:
  drivers-dir: uploads/drivers
  evidencias-dir: uploads/evidencias
```

In `soportedesk-backend/src/test/resources/application.yml`, find the existing `uploads:` block (around line 25-26) and add the new key so it reads:

```yaml
uploads:
  drivers-dir: build/test-uploads/drivers
  evidencias-dir: build/test-uploads/evidencias
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `cd soportedesk-backend && mvn test -Dtest=EvidenciaStorageServiceTest`
Expected: PASS — 4 tests green.

- [ ] **Step 7: Write the SQL migration file**

Create `docs/superpowers/migrations/2026-07-15-equipos-evidencias.sql`:

```sql
USE ssti;
GO
IF OBJECT_ID('dbo.equipos_evidencias', 'U') IS NULL
CREATE TABLE dbo.equipos_evidencias (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    computer_id     BIGINT NOT NULL,
    archivo_path    NVARCHAR(300) NOT NULL,
    nombre_original NVARCHAR(255) NOT NULL,
    mime_type       NVARCHAR(100) NOT NULL,
    descripcion     NVARCHAR(500) NULL,
    subido_por      NVARCHAR(100) NOT NULL,
    fecha_subida    DATETIME2 NOT NULL
);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_equipos_evidencias_computer_id')
CREATE INDEX IX_equipos_evidencias_computer_id ON dbo.equipos_evidencias(computer_id);
GO
```

This file is not run automatically — note it for the user to run manually in SSMS against the `ssti` database before this feature is used against real data (same pattern as every other migration in `docs/superpowers/migrations/`). Tests do not depend on it (H2 builds the schema from the JPA entity).

- [ ] **Step 8: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/evidencia/EquipoEvidencia.java \
        soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/evidencia/EquipoEvidenciaRepository.java \
        soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/evidencia/EquipoEvidenciaDto.java \
        soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/evidencia/EvidenciaStorageService.java \
        soportedesk-backend/src/test/java/com/inia/soportedesk/equipos/evidencia/EvidenciaStorageServiceTest.java \
        soportedesk-backend/src/main/resources/application.yml \
        soportedesk-backend/src/test/resources/application.yml \
        docs/superpowers/migrations/2026-07-15-equipos-evidencias.sql
git commit -m "feat: agregar modelo de datos y storage de archivos para Evidencias de equipo"
```

---

### Task 2: `EquipoEvidenciaService` — business logic

**Files:**
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/evidencia/ArchivoEvidencia.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/evidencia/EquipoEvidenciaService.java`
- Create: `soportedesk-backend/src/test/java/com/inia/soportedesk/equipos/evidencia/EquipoEvidenciaServiceTest.java`

**Interfaces:**
- Consumes: `EquipoEvidenciaRepository` and `EvidenciaStorageService` from Task 1 (exact signatures above), `com.inia.soportedesk.common.FileStorageException` (constructor `FileStorageException(String message)`, maps to HTTP 400 via the existing `GlobalExceptionHandler`), `com.inia.soportedesk.exception.ResourceNotFoundException` (constructor `ResourceNotFoundException(String message)`, maps to HTTP 404).
- Produces: `ArchivoEvidencia` record (`Path path, String mimeType, String nombreOriginal`), `EquipoEvidenciaService.listar(Long computerId): List<EquipoEvidenciaDto>`, `.subir(Long computerId, MultipartFile file, String descripcion, String username): EquipoEvidenciaDto`, `.eliminar(Long computerId, Long evidenciaId): void`, `.cargarArchivo(Long computerId, Long evidenciaId): ArchivoEvidencia`. Task 3 consumes all four methods and `ArchivoEvidencia`.

- [ ] **Step 1: Write the failing tests**

Create `soportedesk-backend/src/test/java/com/inia/soportedesk/equipos/evidencia/EquipoEvidenciaServiceTest.java`:

```java
package com.inia.soportedesk.equipos.evidencia;

import com.inia.soportedesk.common.FileStorageException;
import com.inia.soportedesk.exception.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

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
class EquipoEvidenciaServiceTest {

    @Mock private EquipoEvidenciaRepository repository;
    @Mock private EvidenciaStorageService storageService;
    @InjectMocks private EquipoEvidenciaService service;

    @Test
    void subir_validImage_savesAndReturnsDto() {
        MockMultipartFile file = new MockMultipartFile("file", "foto.jpg", "image/jpeg", new byte[]{1, 2, 3});
        when(storageService.store(291L, file)).thenReturn("291/uuid.jpg");
        when(repository.save(any())).thenAnswer(inv -> {
            EquipoEvidencia e = inv.getArgument(0);
            e.setId(5L);
            return e;
        });

        EquipoEvidenciaDto result = service.subir(291L, file, "Etiqueta de serie", "gvivanco");

        assertThat(result.getId()).isEqualTo(5L);
        assertThat(result.getNombreOriginal()).isEqualTo("foto.jpg");
        assertThat(result.getDescripcion()).isEqualTo("Etiqueta de serie");
        assertThat(result.getSubidoPor()).isEqualTo("gvivanco");
    }

    @Test
    void subir_invalidMimeType_throwsFileStorageException() {
        MockMultipartFile file = new MockMultipartFile("file", "documento.pdf", "application/pdf", new byte[]{1, 2, 3});

        assertThatThrownBy(() -> service.subir(291L, file, null, "gvivanco"))
                .isInstanceOf(FileStorageException.class)
                .hasMessageContaining("JPG, PNG o WEBP");

        verifyNoInteractions(storageService);
    }

    @Test
    void subir_fileTooLarge_throwsFileStorageException() {
        byte[] tooLarge = new byte[9 * 1024 * 1024];
        MockMultipartFile file = new MockMultipartFile("file", "foto.jpg", "image/jpeg", tooLarge);

        assertThatThrownBy(() -> service.subir(291L, file, null, "gvivanco"))
                .isInstanceOf(FileStorageException.class)
                .hasMessageContaining("8 MB");

        verifyNoInteractions(storageService);
    }

    @Test
    void eliminar_belongsToComputer_deletesFileAndRow() {
        EquipoEvidencia entity = new EquipoEvidencia();
        entity.setId(5L);
        entity.setComputerId(291L);
        entity.setArchivoPath("291/uuid.jpg");
        when(repository.findByIdAndComputerId(5L, 291L)).thenReturn(Optional.of(entity));

        service.eliminar(291L, 5L);

        verify(storageService).delete("291/uuid.jpg");
        verify(repository).delete(entity);
    }

    @Test
    void eliminar_notBelongingToComputer_throwsResourceNotFoundException() {
        when(repository.findByIdAndComputerId(5L, 999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.eliminar(999L, 5L))
                .isInstanceOf(ResourceNotFoundException.class);

        verifyNoInteractions(storageService);
    }

    @Test
    void listar_ordersByFechaSubidaDescending() {
        EquipoEvidencia older = new EquipoEvidencia();
        older.setId(1L);
        older.setNombreOriginal("vieja.jpg");
        older.setFechaSubida(LocalDateTime.now().minusDays(1));
        EquipoEvidencia newer = new EquipoEvidencia();
        newer.setId(2L);
        newer.setNombreOriginal("nueva.jpg");
        newer.setFechaSubida(LocalDateTime.now());
        when(repository.findByComputerIdOrderByFechaSubidaDesc(291L)).thenReturn(List.of(newer, older));

        List<EquipoEvidenciaDto> result = service.listar(291L);

        assertThat(result).extracting(EquipoEvidenciaDto::getNombreOriginal)
                .containsExactly("nueva.jpg", "vieja.jpg");
    }
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd soportedesk-backend && mvn test -Dtest=EquipoEvidenciaServiceTest`
Expected: FAIL — compile error, `EquipoEvidenciaService` does not exist yet.

- [ ] **Step 3: Create the `ArchivoEvidencia` record**

Create `soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/evidencia/ArchivoEvidencia.java`:

```java
package com.inia.soportedesk.equipos.evidencia;

import java.nio.file.Path;

public record ArchivoEvidencia(Path path, String mimeType, String nombreOriginal) {
}
```

- [ ] **Step 4: Implement `EquipoEvidenciaService`**

Create `soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/evidencia/EquipoEvidenciaService.java`:

```java
package com.inia.soportedesk.equipos.evidencia;

import com.inia.soportedesk.common.FileStorageException;
import com.inia.soportedesk.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class EquipoEvidenciaService {

    private static final Set<String> ALLOWED_MIME_TYPES = Set.of("image/jpeg", "image/png", "image/webp");
    private static final long MAX_FILE_SIZE_BYTES = 8L * 1024 * 1024;

    private final EquipoEvidenciaRepository repository;
    private final EvidenciaStorageService storageService;

    public List<EquipoEvidenciaDto> listar(Long computerId) {
        return repository.findByComputerIdOrderByFechaSubidaDesc(computerId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    public EquipoEvidenciaDto subir(Long computerId, MultipartFile file, String descripcion, String username) {
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType)) {
            throw new FileStorageException("Solo se aceptan imágenes JPG, PNG o WEBP.");
        }
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new FileStorageException("La imagen supera el tamaño máximo permitido (8 MB).");
        }

        String relativePath = storageService.store(computerId, file);

        EquipoEvidencia entity = new EquipoEvidencia();
        entity.setComputerId(computerId);
        entity.setArchivoPath(relativePath);
        entity.setNombreOriginal(file.getOriginalFilename());
        entity.setMimeType(contentType);
        entity.setDescripcion(descripcion);
        entity.setSubidoPor(username);
        entity.setFechaSubida(LocalDateTime.now());

        return toDto(repository.save(entity));
    }

    public void eliminar(Long computerId, Long evidenciaId) {
        EquipoEvidencia entity = repository.findByIdAndComputerId(evidenciaId, computerId)
                .orElseThrow(() -> new ResourceNotFoundException("Evidencia no encontrada: " + evidenciaId));
        storageService.delete(entity.getArchivoPath());
        repository.delete(entity);
    }

    public ArchivoEvidencia cargarArchivo(Long computerId, Long evidenciaId) {
        EquipoEvidencia entity = repository.findByIdAndComputerId(evidenciaId, computerId)
                .orElseThrow(() -> new ResourceNotFoundException("Evidencia no encontrada: " + evidenciaId));
        Path path = storageService.load(entity.getArchivoPath());
        return new ArchivoEvidencia(path, entity.getMimeType(), entity.getNombreOriginal());
    }

    private EquipoEvidenciaDto toDto(EquipoEvidencia entity) {
        EquipoEvidenciaDto dto = new EquipoEvidenciaDto();
        dto.setId(entity.getId());
        dto.setNombreOriginal(entity.getNombreOriginal());
        dto.setDescripcion(entity.getDescripcion());
        dto.setSubidoPor(entity.getSubidoPor());
        dto.setFechaSubida(entity.getFechaSubida());
        return dto;
    }
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `cd soportedesk-backend && mvn test -Dtest=EquipoEvidenciaServiceTest`
Expected: PASS — 6 tests green.

- [ ] **Step 6: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/evidencia/ArchivoEvidencia.java \
        soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/evidencia/EquipoEvidenciaService.java \
        soportedesk-backend/src/test/java/com/inia/soportedesk/equipos/evidencia/EquipoEvidenciaServiceTest.java
git commit -m "feat: agregar EquipoEvidenciaService con validacion de tipo/tamano de imagen"
```

---

### Task 3: `EquipoEvidenciaController` — REST endpoints

**Files:**
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/evidencia/EquipoEvidenciaController.java`
- Create: `soportedesk-backend/src/test/java/com/inia/soportedesk/equipos/evidencia/EquipoEvidenciaControllerIT.java`

**Interfaces:**
- Consumes: `EquipoEvidenciaService` from Task 2 (exact method signatures above).
- Produces: `GET /api/equipos/{computerId}/evidencias`, `POST /api/equipos/{computerId}/evidencias` (multipart, fields `file` + optional `descripcion`), `GET /api/equipos/{computerId}/evidencias/{evidenciaId}/archivo`, `DELETE /api/equipos/{computerId}/evidencias/{evidenciaId}`. Task 5 (frontend) consumes these four HTTP routes exactly as written.

- [ ] **Step 1: Write the failing tests**

Create `soportedesk-backend/src/test/java/com/inia/soportedesk/equipos/evidencia/EquipoEvidenciaControllerIT.java`:

```java
package com.inia.soportedesk.equipos.evidencia;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class EquipoEvidenciaControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private EquipoEvidenciaService service;

    private EquipoEvidenciaDto dto(Long id, String nombre) {
        EquipoEvidenciaDto d = new EquipoEvidenciaDto();
        d.setId(id);
        d.setNombreOriginal(nombre);
        d.setSubidoPor("admin");
        d.setFechaSubida(LocalDateTime.now());
        return d;
    }

    @Test
    @WithMockUser(authorities = "READ_equipos")
    void listar_withReadPermission_returnsList() throws Exception {
        when(service.listar(291L)).thenReturn(List.of(dto(1L, "foto.jpg")));

        mockMvc.perform(get("/api/equipos/291/evidencias"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].nombreOriginal", is("foto.jpg")));
    }

    @Test
    @WithMockUser(username = "tecnico1", authorities = "WRITE_equipos")
    void subir_withWritePermission_storesAndReturnsCreated() throws Exception {
        when(service.subir(eq(291L), any(), eq("Etiqueta"), eq("tecnico1"))).thenReturn(dto(1L, "foto.jpg"));

        MockMultipartFile file = new MockMultipartFile("file", "foto.jpg", "image/jpeg", "contenido".getBytes());

        mockMvc.perform(multipart("/api/equipos/291/evidencias")
                        .file(file)
                        .param("descripcion", "Etiqueta"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nombreOriginal", is("foto.jpg")));
    }

    @Test
    @WithMockUser(authorities = "READ_equipos")
    void subir_withoutWritePermission_returnsForbidden() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "foto.jpg", "image/jpeg", "contenido".getBytes());

        mockMvc.perform(multipart("/api/equipos/291/evidencias").file(file))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "WRITE_equipos")
    void eliminar_withWritePermission_returnsNoContent() throws Exception {
        mockMvc.perform(delete("/api/equipos/291/evidencias/1"))
                .andExpect(status().isNoContent());

        verify(service).eliminar(291L, 1L);
    }

    @Test
    @WithMockUser(authorities = "READ_equipos")
    void eliminar_withoutWritePermission_returnsForbidden() throws Exception {
        mockMvc.perform(delete("/api/equipos/291/evidencias/1"))
                .andExpect(status().isForbidden());
    }
}
```

- [ ] **Step 2: Run the tests to verify they fail**

`*ControllerIT` classes run under Failsafe (`mvn verify`), not Surefire (`mvn test`) — `mvn test` silently skips this file entirely. Use:

Run: `cd soportedesk-backend && mvn verify -Dmaven.test.failure.ignore=true -Dtest=none -Dsurefire.failIfNoSpecifiedTests=false -Dit.test=EquipoEvidenciaControllerIT -DfailIfNoTests=false`
Expected: FAIL — compile error, `EquipoEvidenciaController` does not exist yet. Check `target/failsafe-reports/*.txt` if the console output is unclear.

- [ ] **Step 3: Implement `EquipoEvidenciaController`**

Create `soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/evidencia/EquipoEvidenciaController.java`:

```java
package com.inia.soportedesk.equipos.evidencia;

import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/equipos/{computerId}/evidencias")
@RequiredArgsConstructor
public class EquipoEvidenciaController {

    private final EquipoEvidenciaService service;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_equipos')")
    public List<EquipoEvidenciaDto> listar(@PathVariable Long computerId) {
        return service.listar(computerId);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_equipos')")
    public ResponseEntity<EquipoEvidenciaDto> subir(@PathVariable Long computerId,
                                                      @RequestParam("file") MultipartFile file,
                                                      @RequestParam(value = "descripcion", required = false) String descripcion,
                                                      Authentication auth) {
        EquipoEvidenciaDto dto = service.subir(computerId, file, descripcion, auth.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    @GetMapping("/{evidenciaId}/archivo")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_equipos')")
    public ResponseEntity<Resource> descargar(@PathVariable Long computerId, @PathVariable Long evidenciaId) {
        ArchivoEvidencia archivo = service.cargarArchivo(computerId, evidenciaId);
        Resource resource = new FileSystemResource(archivo.path());
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(archivo.mimeType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + archivo.nombreOriginal() + "\"")
                .body(resource);
    }

    @DeleteMapping("/{evidenciaId}")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_equipos')")
    public ResponseEntity<Void> eliminar(@PathVariable Long computerId, @PathVariable Long evidenciaId) {
        service.eliminar(computerId, evidenciaId);
        return ResponseEntity.noContent().build();
    }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd soportedesk-backend && mvn verify -Dmaven.test.failure.ignore=true -Dtest=none -Dsurefire.failIfNoSpecifiedTests=false -Dit.test=EquipoEvidenciaControllerIT -DfailIfNoTests=false`
Expected: PASS — 5 tests green in `target/failsafe-reports/`.

- [ ] **Step 5: Run the full backend test suite to confirm no regressions**

Run: `cd soportedesk-backend && mvn test`
Expected: PASS, 0 failures (the historical H2/schema.sql `*RepositoryTest` incompatibility no longer applies to this codebase — see `docs/superpowers/specs/` history — so a clean 0-failure run is the correct bar here, not a tolerated pre-existing failure count).

- [ ] **Step 6: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/equipos/evidencia/EquipoEvidenciaController.java \
        soportedesk-backend/src/test/java/com/inia/soportedesk/equipos/evidencia/EquipoEvidenciaControllerIT.java
git commit -m "feat: agregar endpoints REST para Evidencias de equipo"
```

---

### Task 4: Frontend model and service methods

**Files:**
- Modify: `soportedesk-frontend/src/app/features/equipos/equipo.model.ts`
- Modify: `soportedesk-frontend/src/app/features/equipos/equipo.service.ts`

**Interfaces:**
- Consumes: the four REST routes from Task 3.
- Produces: `EquipoEvidencia` TypeScript interface, `EquipoService.getEvidencias(computerId: number): Observable<EquipoEvidencia[]>`, `.subirEvidencia(computerId: number, file: File, descripcion: string): Observable<EquipoEvidencia>`, `.descargarEvidencia(computerId: number, evidenciaId: number): Observable<Blob>`, `.eliminarEvidencia(computerId: number, evidenciaId: number): Observable<void>`. Task 5 consumes all four methods and the interface.

- [ ] **Step 1: Add the `EquipoEvidencia` interface**

In `soportedesk-frontend/src/app/features/equipos/equipo.model.ts`, add at the end of the file:

```typescript
export interface EquipoEvidencia {
  id: number;
  nombreOriginal: string;
  descripcion: string | null;
  subidoPor: string;
  fechaSubida: string;
}
```

- [ ] **Step 2: Add the service methods**

In `soportedesk-frontend/src/app/features/equipos/equipo.service.ts`, update the import line at the top:

```typescript
import { Equipo, EquipoDashboardCompleto, EquipoDetalleResponse, EquipoEnrichmentDto, EquipoEvidencia, EquipoKpis, EquipoResumen, EquipoSaludItem, HistorialItem } from './equipo.model';
```

Then add these four methods at the end of the `EquipoService` class, right before the closing `}`:

```typescript
  getEvidencias(computerId: number): Observable<EquipoEvidencia[]> {
    return this.http.get<EquipoEvidencia[]>(`${this.apiUrl}/${computerId}/evidencias`);
  }

  subirEvidencia(computerId: number, file: File, descripcion: string): Observable<EquipoEvidencia> {
    const formData = new FormData();
    formData.append('file', file);
    if (descripcion) formData.append('descripcion', descripcion);
    return this.http.post<EquipoEvidencia>(`${this.apiUrl}/${computerId}/evidencias`, formData);
  }

  descargarEvidencia(computerId: number, evidenciaId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${computerId}/evidencias/${evidenciaId}/archivo`, { responseType: 'blob' });
  }

  eliminarEvidencia(computerId: number, evidenciaId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${computerId}/evidencias/${evidenciaId}`);
  }
```

- [ ] **Step 3: Verify the frontend still compiles**

Run: `cd soportedesk-frontend && npx tsc --noEmit -p tsconfig.json`
Expected: no new TypeScript errors (pre-existing unrelated errors, if any, stay unchanged).

- [ ] **Step 4: Commit**

```bash
git add soportedesk-frontend/src/app/features/equipos/equipo.model.ts \
        soportedesk-frontend/src/app/features/equipos/equipo.service.ts
git commit -m "feat: agregar modelo y metodos de servicio para Evidencias de equipo"
```

---

### Task 5: Frontend UI — "Evidencias" section in `EquipoDetailComponent`

**Files:**
- Modify: `soportedesk-frontend/src/app/features/equipos/equipo-detail.component.ts`
- Modify: `soportedesk-frontend/src/app/features/equipos/equipo-detail.component.html`
- Modify: `soportedesk-frontend/src/app/features/equipos/equipo-detail.component.scss`

**Interfaces:**
- Consumes: `EquipoService.getEvidencias/subirEvidencia/descargarEvidencia/eliminarEvidencia` and `EquipoEvidencia` from Task 4; `ModalComponent` (`../../shared/modal/modal.component`, inputs `title: string`, `open: boolean`, `size?: 'default' | 'wide'`, output `closed`); `AuthService` (`../../core/auth/auth.service`, method `canWrite(module: string): boolean`).
- Produces: nothing consumed by later tasks — this is the last code task.

- [ ] **Step 1: Update the component class**

Open `soportedesk-frontend/src/app/features/equipos/equipo-detail.component.ts`. Replace the full file with:

```typescript
import { Component, Input, OnInit, OnDestroy, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EquipoDetalle, EquipoEvidencia, EquipoOficina, EquipoSoftware, EquipoTeclado } from './equipo.model';
import { EquipoService } from './equipo.service';
import { ModalComponent } from '../../shared/modal/modal.component';
import { AuthService } from '../../core/auth/auth.service';

interface MonitorRow {
  nombre: string;
  modelo: string;
  fabricante: string;
  serial: string;
}

interface EvidenciaView extends EquipoEvidencia {
  previewUrl: string | null;
}

@Component({
  selector: 'app-equipo-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './equipo-detail.component.html',
  styleUrl: './equipo-detail.component.scss',
})
export class EquipoDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(EquipoService);
  private authService = inject(AuthService);

  @Input() id: number | null = null;
  @Input() embedded = false;

  equipo = signal<EquipoDetalle | null>(null);
  software = signal<EquipoSoftware[]>([]);
  teclado = signal<EquipoTeclado | null>(null);
  oficina = signal<EquipoOficina | null>(null);
  tipoEfectivo = signal<string | null>(null);
  softwareFilter = signal('');

  evidencias = signal<EvidenciaView[]>([]);
  subiendoEvidencia = signal(false);
  errorEvidencia = signal<string | null>(null);
  visorUrl = signal<string | null>(null);
  descripcionEvidencia = '';

  private equipoId = 0;

  monitores = computed(() => this.parseMonitores(this.equipo()));
  filteredSoftware = computed(() => {
    const term = this.softwareFilter().trim().toLowerCase();
    if (!term) return this.software();
    return this.software().filter((row) => row.software?.toLowerCase().includes(term));
  });

  get canWrite(): boolean {
    return this.authService.canWrite('equipos');
  }

  ngOnInit(): void {
    this.equipoId = this.id ?? Number(this.route.snapshot.paramMap.get('id'));
    this.service.getDetalle(this.equipoId).subscribe((response) => {
      this.equipo.set(response.equipo);
      this.software.set(response.software ?? []);
      this.teclado.set(response.teclado);
      this.oficina.set(response.oficina);
      this.tipoEfectivo.set(response.tipoEfectivo);
    });
    this.loadEvidencias();
  }

  ngOnDestroy(): void {
    this.evidencias().forEach((e) => { if (e.previewUrl) URL.revokeObjectURL(e.previewUrl); });
    const visor = this.visorUrl();
    if (visor) URL.revokeObjectURL(visor);
  }

  loadEvidencias(): void {
    this.service.getEvidencias(this.equipoId).subscribe((items) => {
      const views: EvidenciaView[] = items.map((item) => ({ ...item, previewUrl: null }));
      this.evidencias.set(views);
      views.forEach((view) => {
        this.service.descargarEvidencia(this.equipoId, view.id).subscribe((blob) => {
          view.previewUrl = URL.createObjectURL(blob);
          this.evidencias.set([...this.evidencias()]);
        });
      });
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.subiendoEvidencia.set(true);
    this.errorEvidencia.set(null);
    this.service.subirEvidencia(this.equipoId, file, this.descripcionEvidencia).subscribe({
      next: (nueva) => {
        this.subiendoEvidencia.set(false);
        this.descripcionEvidencia = '';
        input.value = '';
        const view: EvidenciaView = { ...nueva, previewUrl: null };
        this.evidencias.set([view, ...this.evidencias()]);
        this.service.descargarEvidencia(this.equipoId, nueva.id).subscribe((blob) => {
          view.previewUrl = URL.createObjectURL(blob);
          this.evidencias.set([...this.evidencias()]);
        });
      },
      error: (err) => {
        this.subiendoEvidencia.set(false);
        this.errorEvidencia.set(err?.error?.message || 'No se pudo subir la evidencia.');
        input.value = '';
      },
    });
  }

  verEvidencia(url: string | null): void {
    if (url) this.visorUrl.set(url);
  }

  cerrarVisor(): void {
    this.visorUrl.set(null);
  }

  eliminarEvidencia(evidencia: EvidenciaView): void {
    if (!confirm(`¿Eliminar la evidencia "${evidencia.nombreOriginal}"?`)) return;
    this.service.eliminarEvidencia(this.equipoId, evidencia.id).subscribe(() => {
      if (evidencia.previewUrl) URL.revokeObjectURL(evidencia.previewUrl);
      this.evidencias.set(this.evidencias().filter((e) => e.id !== evidencia.id));
    });
  }

  back(): void {
    if (this.embedded) return;
    this.router.navigate(['/equipos']);
  }

  stripDomain(value: string | null | undefined): string {
    return (value ?? '').replace(/@INIA-RED$/i, '');
  }

  gbLabel(value: number | null | undefined): string {
    return value == null ? '-' : `${value} GB`;
  }

  frequencyLabel(value: number | null | undefined): string {
    return value == null ? '-' : `${value} MHz`;
  }

  mhzLabel(value: string | null | undefined): string {
    if (!value?.trim()) return '-';
    return /mhz/i.test(value) ? value : `${value} MHz`;
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

  dateOnly(iso: string | null | undefined): string {
    if (!iso) return '-';
    const [year, month, day] = iso.slice(0, 10).split('-');
    return year && month && day ? `${day}/${month}/${year}` : iso;
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

- [ ] **Step 2: Add the "Evidencias" section to the template**

Open `soportedesk-frontend/src/app/features/equipos/equipo-detail.component.html`. Insert this new `<section>` and the viewer `<app-modal>` right before the final closing `</div>` of the file (i.e., immediately after the "Software instalado" `</section>` that ends the current file, at line 121-122):

```html
  <section class="section-band">
    <div class="section-title"><span>10</span><div><h3>Evidencias <small>{{ evidencias().length }}</small></h3><p>Fotos del equipo guardadas en SoporteDesk.</p></div></div>

    <div class="evidencia-upload" *ngIf="canWrite">
      <input type="text" placeholder="Descripción (opcional)" [(ngModel)]="descripcionEvidencia" [ngModelOptions]="{standalone: true}" />
      <label class="btn btn-primary evidencia-upload-btn">
        {{ subiendoEvidencia() ? 'Subiendo...' : 'Subir foto' }}
        <input type="file" accept="image/jpeg,image/png,image/webp" (change)="onFileSelected($event)" [disabled]="subiendoEvidencia()" hidden />
      </label>
    </div>
    <p class="evidencia-error" *ngIf="errorEvidencia()">{{ errorEvidencia() }}</p>

    <div class="evidencia-grid" *ngIf="evidencias().length; else sinEvidencias">
      <div class="evidencia-card" *ngFor="let ev of evidencias()">
        <button type="button" class="evidencia-thumb" (click)="verEvidencia(ev.previewUrl)" [disabled]="!ev.previewUrl">
          <img *ngIf="ev.previewUrl" [src]="ev.previewUrl" [alt]="ev.nombreOriginal" />
          <span *ngIf="!ev.previewUrl" class="evidencia-thumb-loading">Cargando…</span>
        </button>
        <div class="evidencia-meta">
          <strong>{{ ev.descripcion || ev.nombreOriginal }}</strong>
          <span>{{ ev.subidoPor }} · {{ formatDate(ev.fechaSubida) }}</span>
        </div>
        <button type="button" class="btn btn-icon evidencia-delete" *ngIf="canWrite" (click)="eliminarEvidencia(ev)" aria-label="Eliminar evidencia">✕</button>
      </div>
    </div>
    <ng-template #sinEvidencias><p class="empty-state">Sin evidencias registradas para este equipo.</p></ng-template>
  </section>

  <app-modal title="Evidencia" [open]="visorUrl() !== null" (closed)="cerrarVisor()">
    <img *ngIf="visorUrl()" [src]="visorUrl()" class="evidencia-visor-img" alt="Evidencia ampliada" />
  </app-modal>
```

The `<app-modal>` element goes as a sibling right after the `</div>` that closes `.equipo-detail-page` (i.e., it is NOT inside the `*ngIf="equipo() as item"` div, same placement rule the rest of this app's modals follow — `<app-modal>` always sits outside the page's own conditional root so it isn't torn down when `equipo()` briefly re-evaluates).

- [ ] **Step 3: Add the styles**

Open `soportedesk-frontend/src/app/features/equipos/equipo-detail.component.scss` and append at the end of the file:

```scss
.evidencia-upload {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  margin-bottom: 14px;

  input[type="text"] {
    flex: 1 1 220px;
    min-width: 0;
    padding: 8px 12px;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    background: var(--color-surface);
    color: var(--color-text);
  }
}

.evidencia-upload-btn {
  cursor: pointer;
}

.evidencia-error {
  margin: 0 0 14px;
  color: var(--color-danger);
  font-size: .85rem;
}

.evidencia-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 14px;
}

.evidencia-card {
  position: relative;
  display: grid;
  gap: 6px;
}

.evidencia-thumb {
  display: grid;
  place-items: center;
  width: 100%;
  aspect-ratio: 4 / 3;
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: 9px;
  background: var(--color-muted);
  overflow: hidden;
  cursor: pointer;

  img { width: 100%; height: 100%; object-fit: cover; }
}

.evidencia-thumb-loading {
  color: var(--color-text-secondary);
  font-size: .75rem;
}

.evidencia-meta {
  display: grid;
  gap: 2px;
  font-size: .78rem;

  strong { color: var(--color-text); overflow-wrap: anywhere; }
  span { color: var(--color-text-secondary); }
}

.evidencia-delete {
  position: absolute;
  top: 6px;
  right: 6px;
  background: var(--color-surface);
}

.evidencia-visor-img {
  display: block;
  max-width: 100%;
  max-height: 75vh;
  margin: 0 auto;
  border-radius: 9px;
}
```

- [ ] **Step 4: Verify the frontend builds**

Run: `cd soportedesk-frontend && npx ng build`
Expected: `Application bundle generation complete` with no new errors (pre-existing SCSS budget warnings are fine, matching the rest of this codebase).

- [ ] **Step 5: Manual verification**

With both backend (`mvn spring-boot:run`) and frontend (`ng serve`) running, and after Task 1's `docs/superpowers/migrations/2026-07-15-equipos-evidencias.sql` has been run against the real SQL Server database:

1. Open a computer's detail page in `/equipos/:id` (any real GLPI `computerID`).
2. Confirm the new "Evidencias" section renders at the bottom with "Sin evidencias registradas para este equipo."
3. As a user with `WRITE_equipos` (or ADMIN), type a description, pick a `.jpg`/`.png` file, click "Subir foto" — confirm a thumbnail appears.
4. Click the thumbnail — confirm it opens full-size in the modal.
5. Click the "✕" on the thumbnail — confirm the `confirm()` dialog appears, accept it, confirm the thumbnail disappears.
6. Log in as a user WITHOUT `WRITE_equipos` — confirm the upload control and the "✕" delete buttons are not rendered, but existing evidencias (if any) still display.
7. Try uploading a `.pdf` — confirm the error message from the backend ("Solo se aceptan imágenes JPG, PNG o WEBP.") shows without crashing the page.

- [ ] **Step 6: Commit**

```bash
git add soportedesk-frontend/src/app/features/equipos/equipo-detail.component.ts \
        soportedesk-frontend/src/app/features/equipos/equipo-detail.component.html \
        soportedesk-frontend/src/app/features/equipos/equipo-detail.component.scss
git commit -m "feat: agregar seccion Evidencias a la ficha de equipo"
```

---

### Task 6: One-time migration of the 2 existing GLPI photos

**Files:**
- Create (in the scratchpad, NOT in the repo): `glpi_evidencias_migration.py`

**Interfaces:**
- Consumes: `POST /api/equipos/{computerId}/evidencias` from Task 3 (already deployed and running locally), GLPI REST API v1 (`https://glpi.inia.gob.pe/api.php/v1`).
- Produces: nothing — this is a one-off data migration, not app code. Do not commit this script.

- [ ] **Step 1: Confirm the backend is running with today's code**

Run: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/api/equipos/291`
Expected: `200` (or `401` if unauthenticated — either confirms the server is up; a connection error means the backend needs to be started/restarted first with `mvn spring-boot:run`).

- [ ] **Step 2: Write the migration script**

Create the script at the scratchpad path (not inside the git repo):

```python
import requests

GLPI_BASE = "https://glpi.inia.gob.pe/api.php/v1"
GLPI_TOKEN = "Ksx2tjPucgHQCgMhcClcRJVrsnSPPG41nZJ9jc4W"
SOPORTEDESK_BASE = "http://localhost:8080/api"
SOPORTEDESK_USER = "admin"
SOPORTEDESK_PASS = "admin"
COMPUTER_ID = 291
DOC_IDS = [1058, 1059]

# 1. Open a GLPI API session using the personal token
glpi_resp = requests.get(f"{GLPI_BASE}/initSession", headers={"Authorization": f"user_token {GLPI_TOKEN}"})
glpi_resp.raise_for_status()
session_token = glpi_resp.json()["session_token"]
glpi_headers = {"Session-Token": session_token}

# 2. Log in to SoporteDesk as admin
sd_resp = requests.post(f"{SOPORTEDESK_BASE}/auth/login", json={"username": SOPORTEDESK_USER, "password": SOPORTEDESK_PASS})
sd_resp.raise_for_status()
sd_token = sd_resp.json()["token"]
sd_headers = {"Authorization": f"Bearer {sd_token}"}

for doc_id in DOC_IDS:
    # 3. Download the image bytes from GLPI
    doc_resp = requests.get(f"{GLPI_BASE}/Document/{doc_id}",
                             headers={**glpi_headers, "Accept": "application/octet-stream"})
    doc_resp.raise_for_status()
    content_type = doc_resp.headers.get("Content-Type", "image/jpeg")
    filename = f"glpi-{doc_id}.jpg"

    # 4. Upload it to SoporteDesk as a new Evidencia
    files = {"file": (filename, doc_resp.content, content_type)}
    data = {"descripcion": f"Migrado de GLPI (docid={doc_id})"}
    up_resp = requests.post(f"{SOPORTEDESK_BASE}/equipos/{COMPUTER_ID}/evidencias",
                             headers=sd_headers, files=files, data=data)
    up_resp.raise_for_status()
    print(f"docid={doc_id} -> evidencia id={up_resp.json()['id']}")

# 5. Close the GLPI session — the token is not needed again after this
requests.get(f"{GLPI_BASE}/killSession", headers=glpi_headers)
print("done")
```

- [ ] **Step 3: Run it**

Run: `python3 glpi_evidencias_migration.py`
Expected output:
```
docid=1058 -> evidencia id=1
docid=1059 -> evidencia id=2
done
```

If `requests` is not installed: `pip install requests` first, then re-run.

- [ ] **Step 4: Verify in SoporteDesk**

Run: `curl -s http://localhost:8080/api/equipos/291/evidencias -H "Authorization: Bearer <token from step 2>"`
Expected: a JSON array with 2 items, `nombreOriginal` `glpi-1058.jpg` and `glpi-1059.jpg`.

Then open `/equipos/291` in the browser and confirm both photos render as thumbnails in the new "Evidencias" section.

- [ ] **Step 5: Delete the script**

```bash
rm glpi_evidencias_migration.py
```

This script must not be committed to the repository (same rule as every other one-off data-migration script in this project's history — see `docs/superpowers/specs/2026-07-15-equipos-evidencias-design.md` §6).
