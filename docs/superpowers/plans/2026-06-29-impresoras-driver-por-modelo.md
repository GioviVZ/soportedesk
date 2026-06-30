# Driver de impresora por modelo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move printer driver upload/download from the individual `Impresora` (physical unit) to `ModeloImpresora` (catalog model), so a driver is uploaded once per model instead of once per serial-numbered unit.

**Architecture:** Mirror the existing `Impresora` driver pattern (4 nullable string columns + `FileStorageService` + 2 multipart endpoints) onto `ModeloImpresora`, then delete the old pattern from `Impresora`. `FileStorageService` is already generic by `entityId: Long` and needs no changes — it will simply receive a model id instead of an impresora id.

**Tech Stack:** Spring Boot 3.2.5 / Java 17 (backend), Angular 17+ standalone (frontend), SQL Server (manual SSMS migration, `ddl-auto: none`).

## Global Constraints

- No real driver data exists anywhere today (`driverArchivoPath` is `NULL` on all 164 imported `impresoras` rows) — no data migration needed, only schema.
- Schema changes are never auto-run by the agent: SQL migration files are handed to the user to run manually in SSMS, per this project's established convention.
- Backend `*ControllerIT` tests (Failsafe, run via `mvn verify`) build their schema via `ddl-auto: create-drop` against H2 and never touch `schema.sql` (`sql.init.mode: never` in the test profile) — they run and pass normally. `mvn test` (Surefire: `*Test`/`*ServiceTest`) must also stay green throughout.
- Single driver file per model (no list) — same shape `Impresora` used (`driverNombre`, `driverVersion`, `driverSo`, `driverArchivoPath`).

---

### Task 1: Add driver upload/download to ModeloImpresora (backend)

**Files:**
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/ModeloImpresora.java`
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/ModeloImpresoraService.java`
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/ModeloImpresoraController.java`
- Test: `soportedesk-backend/src/test/java/com/inia/soportedesk/catalogo/ModeloImpresoraServiceTest.java`
- Test: Create `soportedesk-backend/src/test/java/com/inia/soportedesk/catalogo/ModeloImpresoraDriverControllerIT.java`

**Interfaces:**
- Produces: `ModeloImpresoraService.updateDriver(Long id, String driverNombre, String driverVersion, String driverSo, String driverArchivoPath): ModeloImpresora`
- Produces: `ModeloImpresora.getDriverNombre()/getDriverVersion()/getDriverSo()/getDriverArchivoPath()` (Lombok-generated, class already has `@Getter @Setter`)
- Consumes (existing, unchanged): `FileStorageService.store(Long entityId, MultipartFile file): String`, `FileStorageService.load(String relativePath): Path`

- [ ] **Step 1: Write the failing service test**

Open `soportedesk-backend/src/test/java/com/inia/soportedesk/catalogo/ModeloImpresoraServiceTest.java` and add this test at the end of the class, right before the closing `}`:

```java
    @Test
    void updateDriver_setsDriverFieldsAndSaves() {
        ModeloImpresora existing = new ModeloImpresora();
        existing.setId(1L);
        when(repository.findById(1L)).thenReturn(Optional.of(existing));
        when(repository.save(any(ModeloImpresora.class))).thenAnswer(inv -> inv.getArgument(0));

        ModeloImpresora result = service.updateDriver(1L, "driver-hp.zip", "1.2", "Windows 10", "1/driver-hp.zip");

        assertThat(result.getDriverNombre()).isEqualTo("driver-hp.zip");
        assertThat(result.getDriverVersion()).isEqualTo("1.2");
        assertThat(result.getDriverSo()).isEqualTo("Windows 10");
        assertThat(result.getDriverArchivoPath()).isEqualTo("1/driver-hp.zip");
        verify(repository).save(existing);
    }
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd soportedesk-backend && mvn test -Dtest=ModeloImpresoraServiceTest`
Expected: BUILD FAILURE — compile error, `cannot find symbol: method updateDriver(...)` (the method doesn't exist on `ModeloImpresoraService` yet, and `getDriverNombre()` etc. don't exist on `ModeloImpresora` yet).

- [ ] **Step 3: Add the 4 driver fields to ModeloImpresora**

In `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/ModeloImpresora.java`, add these 4 fields right after the `toners` field, before the closing `}` of the class:

```java
    @Column(name = "driver_nombre")
    private String driverNombre;

    @Column(name = "driver_version")
    private String driverVersion;

    @Column(name = "driver_so")
    private String driverSo;

    @Column(name = "driver_archivo_path")
    private String driverArchivoPath;
```

- [ ] **Step 4: Add `updateDriver` to ModeloImpresoraService**

In `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/ModeloImpresoraService.java`, add this method right after `delete(Long id)`:

```java
    public ModeloImpresora updateDriver(Long id, String driverNombre, String driverVersion, String driverSo, String driverArchivoPath) {
        ModeloImpresora modelo = findById(id);
        modelo.setDriverNombre(driverNombre);
        modelo.setDriverVersion(driverVersion);
        modelo.setDriverSo(driverSo);
        modelo.setDriverArchivoPath(driverArchivoPath);
        return repository.save(modelo);
    }
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd soportedesk-backend && mvn test -Dtest=ModeloImpresoraServiceTest`
Expected: `Tests run: 9, Failures: 0, Errors: 0` (8 existing + the 1 new test), `BUILD SUCCESS`.

- [ ] **Step 6: Write the controller IT test**

Create `soportedesk-backend/src/test/java/com/inia/soportedesk/catalogo/ModeloImpresoraDriverControllerIT.java`:

```java
package com.inia.soportedesk.catalogo;

import com.inia.soportedesk.common.FileStorageService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class ModeloImpresoraDriverControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ModeloImpresoraService service;

    @Autowired
    private FileStorageService fileStorageService;

    private ModeloImpresora modeloConDriver(Long id, String path) {
        MarcaImpresora marca = new MarcaImpresora();
        marca.setId(1L);
        marca.setNombre("HP");

        ModeloImpresora modelo = new ModeloImpresora();
        modelo.setId(id);
        modelo.setMarca(marca);
        modelo.setNombre("M404dn");
        modelo.setDriverNombre("driver-hp.zip");
        modelo.setDriverVersion("1.2");
        modelo.setDriverSo("Windows 10");
        modelo.setDriverArchivoPath(path);
        return modelo;
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void uploadDriver_withAdminRole_storesFileAndReturnsModelo() throws Exception {
        when(service.updateDriver(eq(1L), any(), any(), any(), any()))
                .thenReturn(modeloConDriver(1L, "1/driver-hp.zip"));

        MockMultipartFile file = new MockMultipartFile("file", "driver-hp.zip", "application/zip", "contenido".getBytes());

        mockMvc.perform(multipart("/api/catalogos/modelos-impresora/1/driver")
                        .file(file)
                        .param("version", "1.2")
                        .param("so", "Windows 10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.driverArchivoPath", is("1/driver-hp.zip")));
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void uploadDriver_withoutAdminRole_returnsForbidden() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "driver-hp.zip", "application/zip", "contenido".getBytes());

        mockMvc.perform(multipart("/api/catalogos/modelos-impresora/1/driver")
                        .file(file)
                        .param("version", "1.2")
                        .param("so", "Windows 10"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void downloadDriver_anyAuthenticatedUser_returnsFileBytes() throws Exception {
        Path stored = fileStorageService.load(
                fileStorageService.store(2L, new MockMultipartFile("file", "driver-canon.zip", "application/zip", "contenido".getBytes())));

        when(service.findById(2L)).thenReturn(modeloConDriver(2L, "2/driver-canon.zip"));

        mockMvc.perform(get("/api/catalogos/modelos-impresora/2/driver"))
                .andExpect(status().isOk())
                .andExpect(content().bytes(Files.readAllBytes(stored)));
    }
}
```

- [ ] **Step 7: Add the 2 driver endpoints to ModeloImpresoraController**

Replace the full content of `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/ModeloImpresoraController.java` with:

```java
package com.inia.soportedesk.catalogo;

import com.inia.soportedesk.common.FileStorageService;
import com.inia.soportedesk.exception.ResourceNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.util.List;

@RestController
@RequestMapping("/api/catalogos/modelos-impresora")
@RequiredArgsConstructor
public class ModeloImpresoraController {

    private final ModeloImpresoraService service;
    private final FileStorageService fileStorageService;

    @GetMapping
    public List<ModeloImpresora> findAll(@RequestParam(required = false) Long marcaId,
                                          @RequestParam(required = false) String search) {
        return service.findAll(marcaId, search);
    }

    @GetMapping("/{id}")
    public ModeloImpresora findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ModeloImpresora> create(@Valid @RequestBody ModeloImpresoraRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ModeloImpresora update(@PathVariable Long id, @Valid @RequestBody ModeloImpresoraRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/driver")
    @PreAuthorize("hasRole('ADMIN')")
    public ModeloImpresora uploadDriver(@PathVariable Long id,
                                         @RequestParam("file") MultipartFile file,
                                         @RequestParam(value = "version", required = false, defaultValue = "") String version,
                                         @RequestParam(value = "so", required = false, defaultValue = "") String so) {
        String relativePath = fileStorageService.store(id, file);
        return service.updateDriver(id, file.getOriginalFilename(), version, so, relativePath);
    }

    @GetMapping("/{id}/driver")
    public ResponseEntity<Resource> downloadDriver(@PathVariable Long id) {
        ModeloImpresora modelo = service.findById(id);
        if (modelo.getDriverArchivoPath() == null) {
            throw new ResourceNotFoundException("El modelo de impresora no tiene un driver cargado: " + id);
        }
        Path filePath = fileStorageService.load(modelo.getDriverArchivoPath());
        Resource resource = new FileSystemResource(filePath);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + modelo.getDriverNombre() + "\"")
                .body(resource);
    }
}
```

- [ ] **Step 8: Compile and run the full backend unit test suite**

Run: `cd soportedesk-backend && mvn test`
Expected: `BUILD SUCCESS`, same pass count as before plus the 1 new test (no failures). `ModeloImpresoraDriverControllerIT` is a Failsafe `*IT` test and does **not** run under `mvn test` — that's expected, see Step 9.

- [ ] **Step 9: Run the new IT test**

Run: `cd soportedesk-backend && mvn verify -Dmaven.test.failure.ignore=true -Dtest=none -Dsurefire.failIfNoSpecifiedTests=false -Dit.test=ModeloImpresoraDriverControllerIT -DfailIfNoTests=false`
Expected: `Tests run: 3, Failures: 0, Errors: 0` — the test profile (`src/test/resources/application.yml`) uses `ddl-auto: create-drop` with `sql.init.mode: never`, so Hibernate builds the schema straight from the JPA entities and never touches `schema.sql`. (An earlier project note claimed `*ControllerIT` tests fail to load the `ApplicationContext` due to H2/`schema.sql` incompatibility — verified during this task that this is no longer the case, so this test is expected to actually pass.)

- [ ] **Step 10: Commit**

```bash
cd soportedesk-backend
git add src/main/java/com/inia/soportedesk/catalogo/ModeloImpresora.java \
        src/main/java/com/inia/soportedesk/catalogo/ModeloImpresoraService.java \
        src/main/java/com/inia/soportedesk/catalogo/ModeloImpresoraController.java \
        src/test/java/com/inia/soportedesk/catalogo/ModeloImpresoraServiceTest.java \
        src/test/java/com/inia/soportedesk/catalogo/ModeloImpresoraDriverControllerIT.java
git commit -m "feat: add driver upload/download to ModeloImpresora"
```

---

### Task 2: Remove driver upload/download from Impresora (backend)

**Files:**
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/Impresora.java`
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/ImpresoraService.java`
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/ImpresoraController.java`
- Modify: `soportedesk-backend/src/test/java/com/inia/soportedesk/impresoras/ImpresoraServiceTest.java`
- Delete: `soportedesk-backend/src/test/java/com/inia/soportedesk/impresoras/ImpresoraDriverControllerIT.java`

**Interfaces:**
- Removes: `ImpresoraService.updateDriver(...)`, `Impresora.getDriverNombre()/getDriverVersion()/getDriverSo()/getDriverArchivoPath()` and their setters.
- No other task depends on these — Task 1 already added the equivalent on `ModeloImpresora`.

- [ ] **Step 1: Remove the now-invalid service test**

In `soportedesk-backend/src/test/java/com/inia/soportedesk/impresoras/ImpresoraServiceTest.java`, delete this entire test method (it asserts on fields that are about to be removed):

```java
    @Test
    void update_preservesDriverFields() {
        Impresora existing = sampleImpresora(1L);
        existing.setDriverArchivoPath("drivers/1/driver-hp.zip");
        existing.setDriverNombre("driver-hp.zip");
        existing.setDriverVersion("1.2");
        existing.setDriverSo("Windows 10");
        when(repository.findById(1L)).thenReturn(Optional.of(existing));
        when(modeloImpresoraRepository.findById(1L)).thenReturn(Optional.of(modeloImpresora()));
        when(repository.save(any(Impresora.class))).thenAnswer(inv -> inv.getArgument(0));

        Impresora result = service.update(1L, sampleRequest());

        assertThat(result.getModeloImpresora().getNombre()).isEqualTo("M404dn");
        assertThat(result.getDriverArchivoPath()).isEqualTo("drivers/1/driver-hp.zip");
    }
```

- [ ] **Step 2: Delete the old driver IT test**

```bash
git rm soportedesk-backend/src/test/java/com/inia/soportedesk/impresoras/ImpresoraDriverControllerIT.java
```

- [ ] **Step 3: Remove the driver endpoints from ImpresoraController**

Replace the full content of `soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/ImpresoraController.java` with:

```java
package com.inia.soportedesk.impresoras;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/impresoras")
@RequiredArgsConstructor
public class ImpresoraController {

    private final ImpresoraService service;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_impresoras')")
    public List<Impresora> findAll(@RequestParam(required = false) String search) {
        return service.findAll(search);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_impresoras')")
    public Impresora findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_impresoras')")
    public ResponseEntity<Impresora> create(@Valid @RequestBody ImpresoraRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_impresoras')")
    public Impresora update(@PathVariable Long id, @Valid @RequestBody ImpresoraRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_impresoras')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
```

- [ ] **Step 4: Remove `updateDriver` from ImpresoraService**

In `soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/ImpresoraService.java`, delete this method:

```java
    public Impresora updateDriver(Long id, String driverNombre, String driverVersion, String driverSo, String driverArchivoPath) {
        Impresora impresora = findById(id);
        impresora.setDriverNombre(driverNombre);
        impresora.setDriverVersion(driverVersion);
        impresora.setDriverSo(driverSo);
        impresora.setDriverArchivoPath(driverArchivoPath);
        return repository.save(impresora);
    }
```

- [ ] **Step 5: Remove the 4 driver fields from Impresora**

In `soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/Impresora.java`, delete these 4 fields (the last 4 fields in the class, right before the closing `}`):

```java
    @Column(name = "driver_nombre")
    private String driverNombre;

    @Column(name = "driver_version")
    private String driverVersion;

    @Column(name = "driver_so")
    private String driverSo;

    @Column(name = "driver_archivo_path")
    private String driverArchivoPath;
```

- [ ] **Step 6: Run the full backend unit test suite**

Run: `cd soportedesk-backend && mvn test`
Expected: `BUILD SUCCESS`, one fewer test than Task 1's Step 8 count (the deleted `update_preservesDriverFields` test), no failures or compile errors.

- [ ] **Step 7: Commit**

```bash
cd soportedesk-backend
git add src/main/java/com/inia/soportedesk/impresoras/Impresora.java \
        src/main/java/com/inia/soportedesk/impresoras/ImpresoraService.java \
        src/main/java/com/inia/soportedesk/impresoras/ImpresoraController.java \
        src/test/java/com/inia/soportedesk/impresoras/ImpresoraServiceTest.java \
        src/test/java/com/inia/soportedesk/impresoras/ImpresoraDriverControllerIT.java
git commit -m "feat: remove per-unit driver upload/download from Impresora"
```

---

### Task 3: SQL migration + schema.sql

**Files:**
- Create: `soportedesk-backend/src/main/resources/alter_modelo_impresora_driver.sql`
- Modify: `soportedesk-backend/src/main/resources/schema.sql`

**Interfaces:** None (pure schema/SQL, no code dependencies on other tasks).

- [ ] **Step 1: Create the idempotent migration script**

Create `soportedesk-backend/src/main/resources/alter_modelo_impresora_driver.sql`:

```sql
-- ============================================================
-- Mueve el driver de impresora de la unidad individual al modelo.
-- Ver docs/superpowers/specs/2026-06-29-impresoras-driver-por-modelo-design.md
-- Ejecutar manualmente en SSMS. Cada paso es idempotente.
-- ============================================================

USE ssti;
GO

IF COL_LENGTH('dbo.modelos_impresora', 'driver_nombre') IS NULL
    ALTER TABLE dbo.modelos_impresora ADD driver_nombre NVARCHAR(200) NULL;
GO

IF COL_LENGTH('dbo.modelos_impresora', 'driver_version') IS NULL
    ALTER TABLE dbo.modelos_impresora ADD driver_version NVARCHAR(50) NULL;
GO

IF COL_LENGTH('dbo.modelos_impresora', 'driver_so') IS NULL
    ALTER TABLE dbo.modelos_impresora ADD driver_so NVARCHAR(50) NULL;
GO

IF COL_LENGTH('dbo.modelos_impresora', 'driver_archivo_path') IS NULL
    ALTER TABLE dbo.modelos_impresora ADD driver_archivo_path NVARCHAR(500) NULL;
GO

IF COL_LENGTH('dbo.impresoras', 'driver_nombre') IS NOT NULL
    ALTER TABLE dbo.impresoras DROP COLUMN driver_nombre, driver_version, driver_so, driver_archivo_path;
GO

-- Verificacion
SELECT
    (SELECT COUNT(*) FROM sys.columns WHERE object_id = OBJECT_ID('dbo.modelos_impresora') AND name LIKE 'driver_%') AS driver_cols_en_modelo,
    (SELECT COUNT(*) FROM sys.columns WHERE object_id = OBJECT_ID('dbo.impresoras') AND name LIKE 'driver_%') AS driver_cols_en_impresora;
GO
```

- [ ] **Step 2: Update schema.sql so the canonical definition matches**

In `soportedesk-backend/src/main/resources/schema.sql`, find the `dbo.impresoras` table definition and remove these 4 lines from it:

```sql
    driver_nombre       NVARCHAR(200) NULL,
    driver_version      NVARCHAR(50)  NULL,
    driver_so           NVARCHAR(50)  NULL,
    driver_archivo_path NVARCHAR(500) NULL,
```

Then find the `dbo.modelos_impresora` table definition:

```sql
CREATE TABLE dbo.modelos_impresora (
    id       BIGINT        NOT NULL IDENTITY(1,1),
    marca_id BIGINT        NOT NULL,
    nombre   NVARCHAR(100) NOT NULL,
    CONSTRAINT PK_modelos_impresora       PRIMARY KEY (id),
    CONSTRAINT FK_modelos_impresora_marca FOREIGN KEY (marca_id) REFERENCES dbo.marcas_impresora (id) ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT UQ_modelos_impresora_marca_nombre UNIQUE (marca_id, nombre)
);
```

and replace it with:

```sql
CREATE TABLE dbo.modelos_impresora (
    id                  BIGINT        NOT NULL IDENTITY(1,1),
    marca_id            BIGINT        NOT NULL,
    nombre              NVARCHAR(100) NOT NULL,
    driver_nombre       NVARCHAR(200) NULL,
    driver_version      NVARCHAR(50)  NULL,
    driver_so           NVARCHAR(50)  NULL,
    driver_archivo_path NVARCHAR(500) NULL,
    CONSTRAINT PK_modelos_impresora       PRIMARY KEY (id),
    CONSTRAINT FK_modelos_impresora_marca FOREIGN KEY (marca_id) REFERENCES dbo.marcas_impresora (id) ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT UQ_modelos_impresora_marca_nombre UNIQUE (marca_id, nombre)
);
```

- [ ] **Step 3: Commit**

```bash
git add soportedesk-backend/src/main/resources/alter_modelo_impresora_driver.sql \
        soportedesk-backend/src/main/resources/schema.sql
git commit -m "feat: add migration moving driver columns to modelos_impresora"
```

**Note for the user (not a plan step):** `alter_modelo_impresora_driver.sql` must be run manually in SSMS against `ssti` before the new upload/download endpoints will work against the real database — same as every other schema change in this project.

---

### Task 4: Add driver upload/download UI to Modelos de Impresora (frontend)

**Files:**
- Modify: `soportedesk-frontend/src/app/core/models/catalogo.model.ts`
- Modify: `soportedesk-frontend/src/app/core/catalogos/catalogo.service.ts`
- Modify: `soportedesk-frontend/src/app/features/catalogos/modelo-impresora-form.component.ts`
- Modify: `soportedesk-frontend/src/app/features/catalogos/modelo-impresora-form.component.html`
- Modify: `soportedesk-frontend/src/app/features/catalogos/modelo-impresora-form.component.scss`
- Modify: `soportedesk-frontend/src/app/features/catalogos/catalogos.component.html`

**Interfaces:**
- Produces (on `CatalogoService`): `uploadModeloImpresoraDriver(id: number, file: File, version = '', so = ''): Observable<ModeloImpresora>`, `downloadModeloImpresoraDriver(id: number): Observable<Blob>`
- Consumes (existing): `ModeloImpresoraFormComponent.saved` output (already wired to `catalogos.component.ts`'s `onModeloImpresoraSaved()`, which calls `loadAll()`)

- [ ] **Step 1: Add driver fields to the ModeloImpresora model**

In `soportedesk-frontend/src/app/core/models/catalogo.model.ts`, replace the `ModeloImpresora` interface with:

```typescript
export interface ModeloImpresora {
  id: number;
  nombre: string;
  marca: MarcaImpresora;
  toners: ModeloImpresoraToner[];
  driverNombre: string | null;
  driverVersion: string | null;
  driverSo: string | null;
  driverArchivoPath: string | null;
}
```

- [ ] **Step 2: Add upload/download methods to CatalogoService**

In `soportedesk-frontend/src/app/core/catalogos/catalogo.service.ts`, add these 2 methods right after `deleteModeloImpresora`, before the closing `}` of the class:

```typescript
  uploadModeloImpresoraDriver(id: number, file: File, version = '', so = ''): Observable<ModeloImpresora> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('version', version);
    formData.append('so', so);
    return this.http.post<ModeloImpresora>(`${this.apiUrl}/modelos-impresora/${id}/driver`, formData);
  }

  downloadModeloImpresoraDriver(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/modelos-impresora/${id}/driver`, { responseType: 'blob' });
  }
```

- [ ] **Step 3: Add the Driver section to ModeloImpresoraFormComponent's logic**

In `soportedesk-frontend/src/app/features/catalogos/modelo-impresora-form.component.ts`:

Add `driverVersionInput`/`driverSoInput` fields and the 2 new methods. Replace the full file content with:

```typescript
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CatalogoService } from '../../core/catalogos/catalogo.service';
import {
  MarcaImpresora,
  ModeloImpresora,
  ModeloImpresoraRequest,
  ModeloImpresoraToner,
} from '../../core/models/catalogo.model';

export const TONER_COLORES = ['Negro', 'Cyan', 'Magenta', 'Amarillo'];

@Component({
  selector: 'app-modelo-impresora-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './modelo-impresora-form.component.html',
  styleUrl: './modelo-impresora-form.component.scss',
})
export class ModeloImpresoraFormComponent implements OnChanges {
  private fb = inject(FormBuilder);
  private service = inject(CatalogoService);

  @Input() modelo: ModeloImpresora | null = null;
  @Input() marcas: MarcaImpresora[] = [];
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  readonly tonerColores = TONER_COLORES;
  marcaId: number | null = null;
  driverVersionInput = '';
  driverSoInput = '';

  form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    toners: this.fb.array([this.createTonerGroup()]),
  });

  get tonersArray() {
    return this.form.controls.toners;
  }

  ngOnChanges(): void {
    if (this.modelo) {
      this.marcaId = this.modelo.marca?.id ?? null;
      this.form.patchValue({ nombre: this.modelo.nombre });
      this.setToners(this.modelo.toners?.length ? this.modelo.toners : [this.emptyToner()]);
    } else {
      this.marcaId = null;
      this.form.reset({ nombre: '' });
      this.setToners([this.emptyToner()]);
    }
  }

  onMarcaChange(value: string): void {
    this.marcaId = value ? Number(value) : null;
  }

  addToner(): void {
    this.tonersArray.push(this.createTonerGroup());
  }

  removeToner(index: number): void {
    this.tonersArray.removeAt(index);
    if (this.tonersArray.length === 0) {
      this.addToner();
    }
  }

  submit(): void {
    if (this.form.invalid || !this.marcaId) {
      return;
    }
    const toners = this.normalizedToners();
    if (toners === null) {
      alert('Cada tóner debe tener color, variante y código.');
      return;
    }
    const raw = this.form.getRawValue();
    const request: ModeloImpresoraRequest = {
      marcaId: this.marcaId,
      nombre: raw.nombre,
      toners,
    };
    const obs = this.modelo
      ? this.service.updateModeloImpresora(this.modelo.id, request)
      : this.service.createModeloImpresora(request);
    obs.subscribe(() => {
      this.form.reset({ nombre: '' });
      this.marcaId = null;
      this.setToners([this.emptyToner()]);
      this.saved.emit();
    });
  }

  downloadDriver(): void {
    if (!this.modelo) return;
    this.service.downloadModeloImpresoraDriver(this.modelo.id).subscribe((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = this.modelo!.driverNombre ?? 'driver';
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file || !this.modelo) return;
    this.service.uploadModeloImpresoraDriver(this.modelo.id, file, this.driverVersionInput, this.driverSoInput).subscribe(() => {
      this.driverVersionInput = '';
      this.driverSoInput = '';
      this.saved.emit();
    });
  }

  private setToners(items: ModeloImpresoraToner[]): void {
    this.tonersArray.clear();
    for (const item of items.length ? items : [this.emptyToner()]) {
      this.tonersArray.push(this.createTonerGroup(item));
    }
  }

  private createTonerGroup(value?: Partial<ModeloImpresoraToner>) {
    return this.fb.nonNullable.group({
      color: [value?.color ?? ''],
      variante: [value?.variante ?? ''],
      codigo: [value?.codigo ?? ''],
    });
  }

  private normalizedToners(): ModeloImpresoraToner[] | null {
    const result: ModeloImpresoraToner[] = [];
    for (const group of this.tonersArray.controls) {
      const color = group.controls.color.value.trim();
      const variante = group.controls.variante.value.trim();
      const codigo = group.controls.codigo.value.trim();
      if (!color && !variante && !codigo) {
        continue;
      }
      if (!color || !variante || !codigo) {
        return null;
      }
      result.push({ color, variante, codigo });
    }
    return result;
  }

  private emptyToner(): ModeloImpresoraToner {
    return { color: '', variante: '', codigo: '' };
  }
}
```

(The only changes from the previous version: `driverVersionInput`/`driverSoInput` fields, and the new `downloadDriver()`/`onFileSelected()` methods. Everything else is unchanged.)

- [ ] **Step 4: Add the Driver section markup**

In `soportedesk-frontend/src/app/features/catalogos/modelo-impresora-form.component.html`, add this new `<section>` right after the closing `</section>` of `.toner-section` and before the `<div class="actions">` block:

```html
  <section class="toner-section" *ngIf="modelo">
    <div class="section-heading">
      <div>
        <h3>Driver</h3>
        <p>Un solo archivo por modelo, compartido por todas las impresoras de ese modelo.</p>
      </div>
    </div>

    <ng-container *ngIf="modelo.driverNombre; else noDriver">
      <div class="field">
        <label>Archivo cargado</label>
        <span>{{ modelo.driverNombre }} — {{ modelo.driverVersion || 'sin versión' }} ({{ modelo.driverSo || 'S.O. no especificado' }})</span>
      </div>
      <button type="button" class="secondary compact" (click)="downloadDriver()">Descargar driver</button>
    </ng-container>
    <ng-template #noDriver>
      <p>No hay driver cargado para este modelo.</p>
    </ng-template>

    <div class="form-grid">
      <div class="field">
        <label>Versión</label>
        <input type="text" [(ngModel)]="driverVersionInput" placeholder="ej: 1.2.3" />
      </div>
      <div class="field">
        <label>Sistema operativo</label>
        <input type="text" [(ngModel)]="driverSoInput" placeholder="ej: Windows 10 / 11" />
      </div>
    </div>
    <input type="file" (change)="onFileSelected($event)" />
  </section>
```

This uses `[(ngModel)]`, which `FormsModule` provides — Step 3 already added `FormsModule` to this component's imports, so no further wiring is needed here.

- [ ] **Step 5: Add a Driver column to the Modelos de Impresora table**

In `soportedesk-frontend/src/app/features/catalogos/catalogos.component.html`, in the "Modelos de Impresora" section, change the table header from:

```html
      <tr>
        <th>Marca</th>
        <th>Modelo</th>
        <th>Tóner</th>
        <th>Acciones</th>
      </tr>
```

to:

```html
      <tr>
        <th>Marca</th>
        <th>Modelo</th>
        <th>Tóner</th>
        <th>Driver</th>
        <th>Acciones</th>
      </tr>
```

and the row template from:

```html
      <tr *ngFor="let item of modelosImpresora">
        <td>{{ item.marca.nombre }}</td>
        <td>{{ item.nombre }}</td>
        <td>
          <div *ngFor="let toner of item.toners">{{ toner.color }} · {{ toner.variante }} — {{ toner.codigo }}</div>
        </td>
        <td>
          <button (click)="onEditModeloImpresora(item)">Editar</button>
          <button class="danger" (click)="deleteModeloImpresora(item.id)">Eliminar</button>
        </td>
      </tr>
```

to:

```html
      <tr *ngFor="let item of modelosImpresora">
        <td>{{ item.marca.nombre }}</td>
        <td>{{ item.nombre }}</td>
        <td>
          <div *ngFor="let toner of item.toners">{{ toner.color }} · {{ toner.variante }} — {{ toner.codigo }}</div>
        </td>
        <td>{{ item.driverNombre || '—' }}</td>
        <td>
          <button (click)="onEditModeloImpresora(item)">Editar</button>
          <button class="danger" (click)="deleteModeloImpresora(item.id)">Eliminar</button>
        </td>
      </tr>
```

- [ ] **Step 6: Build the frontend to verify no compile errors**

Run: `cd soportedesk-frontend && ng build`
Expected: build completes (`Application bundle generation complete`), no TypeScript errors. Warnings about bundle size are pre-existing and fine.

- [ ] **Step 7: Run the frontend test suite**

Run: `cd soportedesk-frontend && ng test --watch=false`
Expected: all existing suites still pass (no test currently covers `ModeloImpresoraFormComponent` directly, so no new failures are expected here; `catalogos.component.spec.ts` should be unaffected since it doesn't assert on the Driver column).

- [ ] **Step 8: Commit**

```bash
cd soportedesk-frontend
git add src/app/core/models/catalogo.model.ts \
        src/app/core/catalogos/catalogo.service.ts \
        src/app/features/catalogos/modelo-impresora-form.component.ts \
        src/app/features/catalogos/modelo-impresora-form.component.html \
        src/app/features/catalogos/catalogos.component.html
git commit -m "feat: add driver upload/download to Modelos de Impresora UI"
```

---

### Task 5: Remove driver tab from Impresora ficha (frontend)

**Files:**
- Modify: `soportedesk-frontend/src/app/features/impresoras/impresora.model.ts`
- Modify: `soportedesk-frontend/src/app/features/impresoras/impresora.service.ts`
- Modify: `soportedesk-frontend/src/app/features/impresoras/impresora-ficha.component.ts`
- Modify: `soportedesk-frontend/src/app/features/impresoras/impresora-ficha.component.html`
- Modify: `soportedesk-frontend/src/app/features/impresoras/impresora-ficha.component.spec.ts`
- Modify: `soportedesk-frontend/src/app/features/impresoras/impresoras-list.component.ts`
- Modify: `soportedesk-frontend/src/app/features/impresoras/impresoras-list.component.html`

**Depends on:** Task 4 must run first — Step 5's rewritten spec mock puts `driverNombre`/`driverVersion`/`driverSo`/`driverArchivoPath` on the nested `modeloImpresora` object, which only compiles once Task 4 Step 1 has added those fields to the `ModeloImpresora` interface.

**Interfaces:** Removes `ImpresoraFichaComponent`'s `@Output() driverUpdated`. No other component outside this feature folder consumes it.

- [ ] **Step 1: Remove driver fields from the Impresora model**

In `soportedesk-frontend/src/app/features/impresoras/impresora.model.ts`, remove these 4 lines from the `Impresora` interface:

```typescript
  driverNombre: string | null;
  driverVersion: string | null;
  driverSo: string | null;
  driverArchivoPath: string | null;
```

- [ ] **Step 2: Remove driver methods from ImpresoraService**

In `soportedesk-frontend/src/app/features/impresoras/impresora.service.ts`, remove these 2 methods:

```typescript
  uploadDriver(id: number, file: File, version = '', so = ''): Observable<Impresora> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('version', version);
    formData.append('so', so);
    return this.http.post<Impresora>(`${this.apiUrl}/${id}/driver`, formData);
  }

  downloadDriver(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/driver`, { responseType: 'blob' });
  }
```

- [ ] **Step 3: Remove the Driver tab markup**

In `soportedesk-frontend/src/app/features/impresoras/impresora-ficha.component.html`, remove the `<button>` for the driver tab from the `.tabs` block — change:

```html
  <div class="tabs">
    <button [class.active]="activeTab === 'instalacion'" (click)="setTab('instalacion')">Instalación</button>
    <button [class.active]="activeTab === 'consumibles'" (click)="setTab('consumibles')">Consumibles</button>
    <button [class.active]="activeTab === 'driver'" (click)="setTab('driver')">Driver</button>
  </div>
```

to:

```html
  <div class="tabs">
    <button [class.active]="activeTab === 'instalacion'" (click)="setTab('instalacion')">Instalación</button>
    <button [class.active]="activeTab === 'consumibles'" (click)="setTab('consumibles')">Consumibles</button>
  </div>
```

Then remove the entire `<div class="content" *ngIf="activeTab === 'driver'">...</div>` block (from `<div class="content" *ngIf="activeTab === 'driver'">` through its matching closing `</div>`, the last top-level block before the final `</div>` that closes `.ficha`).

- [ ] **Step 4: Remove driver logic from ImpresoraFichaComponent**

Replace the full content of `soportedesk-frontend/src/app/features/impresoras/impresora-ficha.component.ts` with:

```typescript
import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';
import { Impresora, impresoraEstadoTone } from './impresora.model';
import { ModeloImpresoraToner } from '../../core/models/catalogo.model';
import { SectionCardComponent } from '../../shared/section-card/section-card.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';

type FichaTab = 'instalacion' | 'consumibles';

@Component({
  selector: 'app-impresora-ficha',
  standalone: true,
  imports: [CommonModule, SectionCardComponent, StatusBadgeComponent],
  templateUrl: './impresora-ficha.component.html',
  styleUrl: './impresora-ficha.component.scss',
})
export class ImpresoraFichaComponent {
  private authService = inject(AuthService);

  @Input({ required: true }) impresora!: Impresora;

  activeTab: FichaTab = 'instalacion';
  readonly impresoraEstadoTone = impresoraEstadoTone;

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

  setTab(tab: FichaTab): void {
    this.activeTab = tab;
  }
}
```

(Removed: `EventEmitter`/`Output` import and `driverUpdated` output, `ImpresoraService` import and injection, `FormsModule` import, `driverVersionInput`/`driverSoInput`, `downloadDriver()`, `onFileSelected()`.)

- [ ] **Step 5: Update the ficha component's spec**

Replace the full content of `soportedesk-frontend/src/app/features/impresoras/impresora-ficha.component.spec.ts` with:

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ImpresoraFichaComponent } from './impresora-ficha.component';
import { AuthService } from '../../core/auth/auth.service';
import { Impresora } from './impresora.model';

const mockImpresora: Impresora = {
  id: 1,
  modeloImpresora: {
    id: 1,
    nombre: 'LaserJet',
    marca: { id: 1, nombre: 'HP' },
    toners: [{ id: 1, color: 'Negro', variante: 'Estándar', codigo: 'TN-2380' }],
    driverNombre: null,
    driverVersion: null,
    driverSo: null,
    driverArchivoPath: null,
  },
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
};

describe('ImpresoraFichaComponent', () => {
  let component: ImpresoraFichaComponent;
  let fixture: ComponentFixture<ImpresoraFichaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImpresoraFichaComponent, HttpClientTestingModule],
      providers: [{ provide: AuthService, useValue: { isAdmin: () => false, canWrite: () => false } }],
    }).compileComponents();

    fixture = TestBed.createComponent(ImpresoraFichaComponent);
    component = fixture.componentInstance;
    component.impresora = mockImpresora;
    fixture.detectChanges();
  });

  it('should default to instalacion tab', () => {
    expect(component.activeTab).toBe('instalacion');
  });

  it('should switch to consumibles tab', () => {
    component.setTab('consumibles');
    expect(component.activeTab).toBe('consumibles');
  });

  it('tonersPorColor groups toners by color', () => {
    expect(component.tonersPorColor).toEqual([
      { color: 'Negro', variantes: [{ id: 1, color: 'Negro', variante: 'Estándar', codigo: 'TN-2380' }] },
    ]);
  });

  it('tonersPorColor returns empty array when modelo has no toners', () => {
    component.impresora = {
      ...mockImpresora,
      modeloImpresora: { ...mockImpresora.modeloImpresora, toners: [] },
    };
    expect(component.tonersPorColor).toEqual([]);
  });

  it('shows the IP row when tipoConexion is IP', () => {
    component.impresora = { ...mockImpresora, tipoConexion: 'IP', ip: '10.0.0.5' };
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('10.0.0.5');
  });

  it('hides the IP row when tipoConexion is USB', () => {
    component.impresora = { ...mockImpresora, tipoConexion: 'USB', ip: '' };
    fixture.detectChanges();

    const conexionField = Array.from(fixture.nativeElement.querySelectorAll('.detail-field')).find((el) =>
      (el as HTMLElement).querySelector('.detail-label')?.textContent?.trim() === 'Conexión'
    ) as HTMLElement | undefined;
    expect(conexionField?.querySelector('.detail-value')?.textContent).not.toContain('—');
  });
});
```

(Removed: `driverNombre`/`driverVersion`/`driverSo`/`driverArchivoPath` from `mockImpresora` itself — they now live on `modeloImpresora` per Task 4's model change, added there instead — and the `'should show upload section for admin'` test, which tested the now-deleted driver tab.)

- [ ] **Step 6: Remove the driverUpdated wiring from ImpresorasListComponent**

In `soportedesk-frontend/src/app/features/impresoras/impresoras-list.component.ts`, remove this method:

```typescript
  onDriverUpdated(updated: Impresora): void {
    const index = this.items.findIndex((i) => i.id === updated.id);
    if (index !== -1) {
      this.items = [...this.items.slice(0, index), updated, ...this.items.slice(index + 1)];
    }
    if (this.viewing?.id === updated.id) {
      this.viewing = updated;
    }
  }
```

- [ ] **Step 7: Remove the driverUpdated binding from the list template**

In `soportedesk-frontend/src/app/features/impresoras/impresoras-list.component.html`, change:

```html
<app-modal title="Ficha tecnica" [open]="viewing !== null" (closed)="closeView()">
  <app-impresora-ficha
    *ngIf="viewing"
    [impresora]="viewing"
    (driverUpdated)="onDriverUpdated($event)"
  />
</app-modal>
```

to:

```html
<app-modal title="Ficha tecnica" [open]="viewing !== null" (closed)="closeView()">
  <app-impresora-ficha *ngIf="viewing" [impresora]="viewing" />
</app-modal>
```

- [ ] **Step 8: Build and test the frontend**

Run: `cd soportedesk-frontend && ng build`
Expected: build completes with no TypeScript errors.

Run: `cd soportedesk-frontend && ng test --watch=false`
Expected: all suites pass, including the updated `impresora-ficha.component.spec.ts` (6 tests, down from 7 — the admin-upload-section test was removed).

- [ ] **Step 9: Commit**

```bash
cd soportedesk-frontend
git add src/app/features/impresoras/impresora.model.ts \
        src/app/features/impresoras/impresora.service.ts \
        src/app/features/impresoras/impresora-ficha.component.ts \
        src/app/features/impresoras/impresora-ficha.component.html \
        src/app/features/impresoras/impresora-ficha.component.spec.ts \
        src/app/features/impresoras/impresoras-list.component.ts \
        src/app/features/impresoras/impresoras-list.component.html
git commit -m "feat: remove per-unit driver tab from Impresora ficha"
```

---

### Task 6: Move driver CSS from impresora-ficha to modelo-impresora-form

**Files:**
- Modify: `soportedesk-frontend/src/app/features/impresoras/impresora-ficha.component.scss`
- Modify: `soportedesk-frontend/src/app/features/catalogos/modelo-impresora-form.component.scss`

**Depends on:** Task 5 must run first — it removes the HTML markup that used the `.download-btn`/`.upload-fields`/`.upload-field` classes this task deletes. Running this task earlier wouldn't break anything (it's CSS-only) but would leave the still-present Driver tab unstyled in the interim.

**Interfaces:** None — pure styling cleanup, no behavior change.

- [ ] **Step 1: Remove the now-unused driver-specific styles from impresora-ficha**

In `soportedesk-frontend/src/app/features/impresoras/impresora-ficha.component.scss`, remove these 3 rule blocks (the `.download-btn`, `.upload-fields`, and `.upload-field` selectors are only used by the deleted Driver tab markup):

```scss
.download-btn {
  margin-top: 12px;
  padding: 8px 16px;
  background-color: var(--color-accent);
  color: var(--color-white);
  border: none;
  border-radius: var(--radius-sm);
  font-weight: 700;
  cursor: pointer;
}
```

```scss
.upload-fields {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.upload-field {
  display: flex;
  flex-direction: column;
  gap: 4px;

  label {
    font-size: 12px;
    font-weight: 700;
    color: var(--color-text-secondary);
  }

  input {
    width: 100%;
    padding: 8px 10px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    font-size: 13px;
  }
}
```

Keep `.empty-message` — it's still used by the "Sin modelos de consumibles registrados." message in the Consumibles tab.

- [ ] **Step 2: Verify modelo-impresora-form.component.scss already covers the new markup**

No changes needed here: Task 4's Driver section markup reuses the existing `.toner-section`, `.section-heading`, `.field`, `.form-grid`, and `button.secondary.compact` classes already defined in `soportedesk-frontend/src/app/features/catalogos/modelo-impresora-form.component.scss` — no new selectors were introduced. Confirm by opening the file and checking these classes are present (they are, from the original toner section).

- [ ] **Step 3: Build the frontend and do a visual check**

Run: `cd soportedesk-frontend && ng build`
Expected: build completes with no errors (removing unused SCSS never breaks a build, but confirms no stray reference was missed).

- [ ] **Step 4: Commit**

```bash
cd soportedesk-frontend
git add src/app/features/impresoras/impresora-ficha.component.scss
git commit -m "style: drop unused driver upload styles from impresora-ficha"
```

---

## Final Verification

- [ ] Run `cd soportedesk-backend && mvn test` — expect `BUILD SUCCESS`, full suite green.
- [ ] Run `cd soportedesk-frontend && ng build` — expect success, no new TypeScript errors.
- [ ] Run `cd soportedesk-frontend && ng test --watch=false` — expect all suites green.
- [ ] Confirm no remaining references: `grep -rn "driverNombre\|driverVersion\|driverSo\|driverArchivoPath" soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras soportedesk-frontend/src/app/features/impresoras` should return nothing.
- [ ] Tell the user to run `alter_modelo_impresora_driver.sql` in SSMS against `ssti`, then restart the backend (`mvn spring-boot:run`).
- [ ] Manual smoke test once the migration has run: open Catálogos > Modelos de Impresora, edit an existing model, upload a driver file, confirm it appears in the table's Driver column and downloads correctly.
