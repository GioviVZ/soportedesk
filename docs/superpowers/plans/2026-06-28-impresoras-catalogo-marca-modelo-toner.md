# Catálogo Marca → Modelo → Tóner para Impresoras — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar los campos de texto libre `marca`/`modelo`/tóner en `Impresora` por catálogos administrados (`MarcaImpresora` → `ModeloImpresora` → tóner), de forma que registrar una impresora consista en elegir un modelo ya catalogado y el tóner quede determinado automáticamente, sin tipeo libre.

**Architecture:** Dos catálogos nuevos jerárquicos en el módulo `catalogo` (mismo patrón que `Sede`→`Dependencia`), con `ModeloImpresora` teniendo una lista hija `ModeloImpresoraToner` (mismo patrón `@OneToMany(cascade=ALL, orphanRemoval=true)` que `Licencia`→`LicenciaActivacion`). `Impresora` pierde `marca`/`modelo`/4 campos de tóner y gana una FK obligatoria `modeloImpresora`. Frontend: nuevas pestañas en `/catalogos`, selects en cascada Marca→Modelo en el form de Impresora, tóner de solo lectura derivado del catálogo.

**Tech Stack:** Spring Boot 3.2.5 / Java 17 / Spring Data JPA / SQL Server (T-SQL) — Angular 17+ standalone / Reactive Forms.

**Spec:** `docs/superpowers/specs/2026-06-28-impresoras-catalogo-marca-modelo-toner-design.md`

## Global Constraints

- `spring.jpa.hibernate.ddl-auto: none` y `spring.sql.init.mode: never` en `application.yml` — todo cambio de esquema va en `schema.sql` (para BDs nuevas) **y** en un script `alter_*.sql` standalone (para la BD existente, que el usuario corre manualmente en SSMS contra `172.16.26.16`/`ssti`).
- La tabla `dbo.impresoras` está vacía o casi vacía en el entorno actual — el `ALTER ... ADD modelo_impresora_id BIGINT NOT NULL` no lleva backfill; si falla por una fila existente, el usuario debe limpiarla a mano antes de correr el script.
- Los tests `*ControllerIT` (incluyendo `ImpresoraControllerIT`, `ImpresoraDriverControllerIT`, `ImpresoraRepositoryTest`) tienen una falla preexistente y documentada de infraestructura (H2 no soporta la sintaxis T-SQL de `schema.sql`). Esto es anterior a este plan y **no se arregla aquí** — los pasos que tocan estos archivos deben dejarlos compilando y lógicamente correctos, pero no se espera que `mvn test` los reporte en verde.
- Todo archivo Java nuevo sigue el patrón Lombok (`@Getter`/`@Setter`/`@RequiredArgsConstructor`) ya usado en `catalogo`/`licencias` — no introducir builders ni records.
- Frontend: standalone components, Reactive Forms donde ya se usa Reactive Forms (forms de feature), `ngModel` donde ya se usa (tabla simple de Catálogos). No introducir NgRx ni otras librerías de estado.

---

## Task 1: Esquema de base de datos — `marcas_impresora`, `modelos_impresora`, `modelo_impresora_toners`

**Files:**
- Modify: `soportedesk-backend/src/main/resources/schema.sql:89-97` (después del bloque `tipos_impresora`)
- Modify: `soportedesk-backend/src/main/resources/schema.sql:237-266` (tabla `impresoras`)
- Create: `soportedesk-backend/src/main/resources/alter_impresoras_catalogo_marca_modelo.sql`

**Interfaces:**
- Produces: tablas `dbo.marcas_impresora(id, nombre)`, `dbo.modelos_impresora(id, marca_id, nombre)`, `dbo.modelo_impresora_toners(id, modelo_impresora_id, color, variante, codigo)`; columna `dbo.impresoras.modelo_impresora_id BIGINT NOT NULL` (FK a `modelos_impresora`); columnas `marca`, `modelo`, `modelo_toner_negro/c/m/y` eliminadas de `dbo.impresoras`. Todas las tareas de backend posteriores asumen este esquema.

- [ ] **Step 1: Insertar las 3 tablas nuevas en `schema.sql` después del bloque `tipos_impresora`**

Abrir `soportedesk-backend/src/main/resources/schema.sql` y ubicar el bloque que termina así (líneas ~89-97):

```sql
IF OBJECT_ID(N'dbo.tipos_impresora', N'U') IS NULL
CREATE TABLE dbo.tipos_impresora (
    id     BIGINT        NOT NULL IDENTITY(1,1),
    nombre NVARCHAR(100) NOT NULL,
    CONSTRAINT PK_tipos_impresora        PRIMARY KEY (id),
    CONSTRAINT UQ_tipos_impresora_nombre UNIQUE      (nombre)
);
GO

IF OBJECT_ID(N'dbo.dependencias', N'U') IS NULL
CREATE TABLE dbo.dependencias (
```

Insertar el siguiente bloque entre el `GO` de `tipos_impresora` y el comentario/`CREATE TABLE` de `dependencias`:

```sql
IF OBJECT_ID(N'dbo.marcas_impresora', N'U') IS NULL
CREATE TABLE dbo.marcas_impresora (
    id     BIGINT        NOT NULL IDENTITY(1,1),
    nombre NVARCHAR(100) NOT NULL,
    CONSTRAINT PK_marcas_impresora        PRIMARY KEY (id),
    CONSTRAINT UQ_marcas_impresora_nombre UNIQUE      (nombre)
);
GO

IF OBJECT_ID(N'dbo.modelos_impresora', N'U') IS NULL
CREATE TABLE dbo.modelos_impresora (
    id       BIGINT        NOT NULL IDENTITY(1,1),
    marca_id BIGINT        NOT NULL,
    nombre   NVARCHAR(100) NOT NULL,
    CONSTRAINT PK_modelos_impresora       PRIMARY KEY (id),
    CONSTRAINT FK_modelos_impresora_marca FOREIGN KEY (marca_id) REFERENCES dbo.marcas_impresora (id) ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT UQ_modelos_impresora_marca_nombre UNIQUE (marca_id, nombre)
);
GO

IF OBJECT_ID(N'dbo.modelo_impresora_toners', N'U') IS NULL
CREATE TABLE dbo.modelo_impresora_toners (
    id                  BIGINT        NOT NULL IDENTITY(1,1),
    modelo_impresora_id BIGINT        NOT NULL,
    color               NVARCHAR(20)  NOT NULL,
    variante            NVARCHAR(50)  NOT NULL,
    codigo              NVARCHAR(80)  NOT NULL,
    CONSTRAINT PK_modelo_impresora_toners PRIMARY KEY (id),
    CONSTRAINT FK_modelo_impresora_toners_modelo FOREIGN KEY (modelo_impresora_id)
        REFERENCES dbo.modelos_impresora (id) ON DELETE CASCADE,
    CONSTRAINT UQ_modelo_impresora_toners UNIQUE (modelo_impresora_id, color, variante)
);
GO
```

- [ ] **Step 2: Reemplazar la tabla `impresoras` en `schema.sql`**

Ubicar el bloque (líneas ~237-266):

```sql
IF OBJECT_ID(N'dbo.impresoras', N'U') IS NULL
CREATE TABLE dbo.impresoras (
    id                  BIGINT        NOT NULL IDENTITY(1,1),
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

Reemplazarlo por:

```sql
IF OBJECT_ID(N'dbo.impresoras', N'U') IS NULL
CREATE TABLE dbo.impresoras (
    id                  BIGINT        NOT NULL IDENTITY(1,1),
    modelo_impresora_id BIGINT        NOT NULL,
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
    driver_nombre       NVARCHAR(200) NULL,
    driver_version      NVARCHAR(50)  NULL,
    driver_so           NVARCHAR(50)  NULL,
    driver_archivo_path NVARCHAR(500) NULL,
    CONSTRAINT PK_impresoras        PRIMARY KEY (id),
    CONSTRAINT FK_impresoras_modelo FOREIGN KEY (modelo_impresora_id) REFERENCES dbo.modelos_impresora (id) ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT FK_impresoras_tipo   FOREIGN KEY (tipo_impresora_id)  REFERENCES dbo.tipos_impresora (id) ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT FK_impresoras_sede   FOREIGN KEY (sede_id)           REFERENCES dbo.sedes (id)           ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT FK_impresoras_dep    FOREIGN KEY (dependencia_id)    REFERENCES dbo.dependencias (id)    ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT FK_impresoras_subdep FOREIGN KEY (subdependencia_id) REFERENCES dbo.subdependencias (id) ON UPDATE NO ACTION ON DELETE NO ACTION
);
GO
```

- [ ] **Step 3: Crear el script de migración standalone**

Crear `soportedesk-backend/src/main/resources/alter_impresoras_catalogo_marca_modelo.sql`:

```sql
-- ============================================================
-- Catalogo Marca -> Modelo -> Toner de Impresoras
-- Ejecutar manualmente en SSMS antes de desplegar el backend actualizado.
-- Pre-requisito: la tabla dbo.impresoras debe estar vacia (o sin filas que
-- vayan a violar el NOT NULL de modelo_impresora_id agregado al final).
-- ============================================================

IF OBJECT_ID(N'dbo.marcas_impresora', N'U') IS NULL
CREATE TABLE dbo.marcas_impresora (
    id     BIGINT        NOT NULL IDENTITY(1,1),
    nombre NVARCHAR(100) NOT NULL,
    CONSTRAINT PK_marcas_impresora        PRIMARY KEY (id),
    CONSTRAINT UQ_marcas_impresora_nombre UNIQUE      (nombre)
);
GO

IF OBJECT_ID(N'dbo.modelos_impresora', N'U') IS NULL
CREATE TABLE dbo.modelos_impresora (
    id       BIGINT        NOT NULL IDENTITY(1,1),
    marca_id BIGINT        NOT NULL,
    nombre   NVARCHAR(100) NOT NULL,
    CONSTRAINT PK_modelos_impresora       PRIMARY KEY (id),
    CONSTRAINT FK_modelos_impresora_marca FOREIGN KEY (marca_id) REFERENCES dbo.marcas_impresora (id) ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT UQ_modelos_impresora_marca_nombre UNIQUE (marca_id, nombre)
);
GO

IF OBJECT_ID(N'dbo.modelo_impresora_toners', N'U') IS NULL
CREATE TABLE dbo.modelo_impresora_toners (
    id                  BIGINT        NOT NULL IDENTITY(1,1),
    modelo_impresora_id BIGINT        NOT NULL,
    color               NVARCHAR(20)  NOT NULL,
    variante            NVARCHAR(50)  NOT NULL,
    codigo              NVARCHAR(80)  NOT NULL,
    CONSTRAINT PK_modelo_impresora_toners PRIMARY KEY (id),
    CONSTRAINT FK_modelo_impresora_toners_modelo FOREIGN KEY (modelo_impresora_id)
        REFERENCES dbo.modelos_impresora (id) ON DELETE CASCADE,
    CONSTRAINT UQ_modelo_impresora_toners UNIQUE (modelo_impresora_id, color, variante)
);
GO

ALTER TABLE dbo.impresoras DROP COLUMN marca, modelo, modelo_toner_negro, modelo_toner_c, modelo_toner_m, modelo_toner_y;
GO

ALTER TABLE dbo.impresoras ADD modelo_impresora_id BIGINT NOT NULL
    CONSTRAINT FK_impresoras_modelo FOREIGN KEY REFERENCES dbo.modelos_impresora (id);
GO
```

- [ ] **Step 4: Commit**

```bash
git add soportedesk-backend/src/main/resources/schema.sql soportedesk-backend/src/main/resources/alter_impresoras_catalogo_marca_modelo.sql
git commit -m "feat: add marcas_impresora/modelos_impresora/modelo_impresora_toners schema"
```

---

## Task 2: Catálogo backend `MarcaImpresora`

**Files:**
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/MarcaImpresora.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/MarcaImpresoraRequest.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/MarcaImpresoraRepository.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/MarcaImpresoraService.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/MarcaImpresoraController.java`
- Test: `soportedesk-backend/src/test/java/com/inia/soportedesk/catalogo/MarcaImpresoraServiceTest.java`

**Interfaces:**
- Consumes: nada (catálogo plano, calco exacto de `TipoImpresora`/`TipoImpresoraRepository`/`TipoImpresoraService`/`TipoImpresoraRequest`/`TipoImpresoraController`).
- Produces: `MarcaImpresoraService.findAll(String search)`, `.findById(Long id)`, `.create(MarcaImpresoraRequest)`, `.update(Long, MarcaImpresoraRequest)`, `.delete(Long)`; endpoints `GET/POST/PUT/DELETE /api/catalogos/marcas-impresora{,/{id}}`. `ModeloImpresora` (Task 3) usará `MarcaImpresoraRepository` para resolver `marcaId`.

- [ ] **Step 1: Escribir el test que falla**

Crear `soportedesk-backend/src/test/java/com/inia/soportedesk/catalogo/MarcaImpresoraServiceTest.java`:

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
class MarcaImpresoraServiceTest {

    @Mock
    private MarcaImpresoraRepository repository;

    @InjectMocks
    private MarcaImpresoraService service;

    private MarcaImpresora sample() {
        MarcaImpresora marca = new MarcaImpresora();
        marca.setId(1L);
        marca.setNombre("HP");
        return marca;
    }

    @Test
    void findAll_withoutSearch_returnsAll() {
        when(repository.findAll()).thenReturn(List.of(sample()));

        List<MarcaImpresora> result = service.findAll(null);

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
    void create_savesMarcaImpresoraFromRequest() {
        MarcaImpresoraRequest request = new MarcaImpresoraRequest();
        request.setNombre("HP");
        when(repository.save(any(MarcaImpresora.class))).thenAnswer(inv -> inv.getArgument(0));

        MarcaImpresora result = service.create(request);

        assertThat(result.getNombre()).isEqualTo("HP");
    }
}
```

- [ ] **Step 2: Correr el test y confirmar que falla por falta de las clases**

Run: `cd soportedesk-backend && mvn test -Dtest=MarcaImpresoraServiceTest`
Expected: FAIL — compile error, `MarcaImpresora`/`MarcaImpresoraRequest`/`MarcaImpresoraRepository`/`MarcaImpresoraService` no existen.

- [ ] **Step 3: Crear la entidad**

Crear `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/MarcaImpresora.java`:

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
@Table(name = "marcas_impresora")
@Getter
@Setter
public class MarcaImpresora {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nombre;
}
```

- [ ] **Step 4: Crear el DTO de request**

Crear `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/MarcaImpresoraRequest.java`:

```java
package com.inia.soportedesk.catalogo;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MarcaImpresoraRequest {

    @NotBlank
    @Size(max = 100)
    private String nombre;
}
```

- [ ] **Step 5: Crear el repositorio**

Crear `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/MarcaImpresoraRepository.java`:

```java
package com.inia.soportedesk.catalogo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MarcaImpresoraRepository extends JpaRepository<MarcaImpresora, Long> {

    @Query("SELECT m FROM MarcaImpresora m WHERE LOWER(m.nombre) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<MarcaImpresora> search(@Param("search") String search);
}
```

- [ ] **Step 6: Crear el service**

Crear `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/MarcaImpresoraService.java`:

```java
package com.inia.soportedesk.catalogo;

import com.inia.soportedesk.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MarcaImpresoraService {

    private final MarcaImpresoraRepository repository;

    public List<MarcaImpresora> findAll(String search) {
        if (search == null || search.isBlank()) {
            return repository.findAll();
        }
        return repository.search(search);
    }

    public MarcaImpresora findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Marca de impresora no encontrada: " + id));
    }

    public MarcaImpresora create(MarcaImpresoraRequest request) {
        MarcaImpresora marca = new MarcaImpresora();
        marca.setNombre(request.getNombre());
        return repository.save(marca);
    }

    public MarcaImpresora update(Long id, MarcaImpresoraRequest request) {
        MarcaImpresora marca = findById(id);
        marca.setNombre(request.getNombre());
        return repository.save(marca);
    }

    public void delete(Long id) {
        repository.delete(findById(id));
    }
}
```

- [ ] **Step 7: Correr el test y confirmar que pasa**

Run: `cd soportedesk-backend && mvn test -Dtest=MarcaImpresoraServiceTest`
Expected: PASS — 3/3 tests green.

- [ ] **Step 8: Crear el controller**

Crear `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/MarcaImpresoraController.java`:

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
@RequestMapping("/api/catalogos/marcas-impresora")
@RequiredArgsConstructor
public class MarcaImpresoraController {

    private final MarcaImpresoraService service;

    @GetMapping
    public List<MarcaImpresora> findAll(@RequestParam(required = false) String search) {
        return service.findAll(search);
    }

    @GetMapping("/{id}")
    public MarcaImpresora findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MarcaImpresora> create(@Valid @RequestBody MarcaImpresoraRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public MarcaImpresora update(@PathVariable Long id, @Valid @RequestBody MarcaImpresoraRequest request) {
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

- [ ] **Step 9: Compilar todo el módulo**

Run: `cd soportedesk-backend && mvn compile`
Expected: BUILD SUCCESS.

- [ ] **Step 10: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/MarcaImpresora*.java soportedesk-backend/src/test/java/com/inia/soportedesk/catalogo/MarcaImpresoraServiceTest.java
git commit -m "feat: add MarcaImpresora catalog (entity, service, controller)"
```

---

## Task 3: Catálogo backend `ModeloImpresora` + `ModeloImpresoraToner`

**Files:**
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/ModeloImpresora.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/ModeloImpresoraToner.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/ModeloImpresoraRequest.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/ModeloImpresoraRepository.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/ModeloImpresoraService.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/ModeloImpresoraController.java`
- Test: `soportedesk-backend/src/test/java/com/inia/soportedesk/catalogo/ModeloImpresoraServiceTest.java`

**Interfaces:**
- Consumes: `MarcaImpresoraRepository` (Task 2) para resolver `marcaId`.
- Produces: `ModeloImpresoraService.findAll(Long marcaId, String search)`, `.findById(Long)`, `.create(ModeloImpresoraRequest)`, `.update(Long, ModeloImpresoraRequest)`, `.delete(Long)`; entidad `ModeloImpresora{id, marca, nombre, toners: List<ModeloImpresoraToner>}`; endpoints `GET/POST/PUT/DELETE /api/catalogos/modelos-impresora{,/{id}}` con filtro `?marcaId=`. Task 4 (`Impresora`) consume `ModeloImpresoraRepository.findById(Long)`.

- [ ] **Step 1: Escribir el test que falla**

Crear `soportedesk-backend/src/test/java/com/inia/soportedesk/catalogo/ModeloImpresoraServiceTest.java`:

```java
package com.inia.soportedesk.catalogo;

import com.inia.soportedesk.exception.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ModeloImpresoraServiceTest {

    @Mock
    private ModeloImpresoraRepository repository;

    @Mock
    private MarcaImpresoraRepository marcaImpresoraRepository;

    @InjectMocks
    private ModeloImpresoraService service;

    private MarcaImpresora marca() {
        MarcaImpresora marca = new MarcaImpresora();
        marca.setId(1L);
        marca.setNombre("HP");
        return marca;
    }

    private ModeloImpresoraRequest sampleRequest() {
        ModeloImpresoraRequest request = new ModeloImpresoraRequest();
        request.setMarcaId(1L);
        request.setNombre("M404dn");
        ModeloImpresoraRequest.TonerRequest toner = new ModeloImpresoraRequest.TonerRequest();
        toner.setColor("Negro");
        toner.setVariante("Estándar");
        toner.setCodigo("CF259A");
        request.setToners(new ArrayList<>(List.of(toner)));
        return request;
    }

    @Test
    void findAll_withoutFilters_returnsAll() {
        when(repository.findAll()).thenReturn(List.of(new ModeloImpresora()));

        List<ModeloImpresora> result = service.findAll(null, null);

        assertThat(result).hasSize(1);
        verify(repository).findAll();
    }

    @Test
    void findAll_withMarcaId_usesFindByMarcaId() {
        when(repository.findByMarcaId(1L)).thenReturn(List.of(new ModeloImpresora()));

        List<ModeloImpresora> result = service.findAll(1L, null);

        assertThat(result).hasSize(1);
        verify(repository).findByMarcaId(1L);
    }

    @Test
    void findById_whenNotFound_throwsResourceNotFoundException() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.findById(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void create_savesModeloImpresoraWithToners() {
        when(marcaImpresoraRepository.findById(1L)).thenReturn(Optional.of(marca()));
        when(repository.save(any(ModeloImpresora.class))).thenAnswer(inv -> inv.getArgument(0));

        ModeloImpresora result = service.create(sampleRequest());

        assertThat(result.getNombre()).isEqualTo("M404dn");
        assertThat(result.getMarca().getNombre()).isEqualTo("HP");
        assertThat(result.getToners()).hasSize(1);
        assertThat(result.getToners().get(0).getCodigo()).isEqualTo("CF259A");
    }

    @Test
    void create_withUnknownMarcaId_throwsResourceNotFoundException() {
        when(marcaImpresoraRepository.findById(99L)).thenReturn(Optional.empty());

        ModeloImpresoraRequest request = sampleRequest();
        request.setMarcaId(99L);

        assertThatThrownBy(() -> service.create(request))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void create_withPartiallyFilledToner_throwsIllegalArgumentException() {
        when(marcaImpresoraRepository.findById(1L)).thenReturn(Optional.of(marca()));

        ModeloImpresoraRequest request = sampleRequest();
        request.getToners().get(0).setCodigo(null);

        assertThatThrownBy(() -> service.create(request))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void create_withoutToners_succeeds() {
        when(marcaImpresoraRepository.findById(1L)).thenReturn(Optional.of(marca()));
        when(repository.save(any(ModeloImpresora.class))).thenAnswer(inv -> inv.getArgument(0));

        ModeloImpresoraRequest request = sampleRequest();
        request.setToners(new ArrayList<>());

        ModeloImpresora result = service.create(request);

        assertThat(result.getToners()).isEmpty();
    }

    @Test
    void update_replacesExistingToners() {
        ModeloImpresora existing = new ModeloImpresora();
        existing.setId(1L);
        existing.setMarca(marca());
        existing.setNombre("M404dn");
        ModeloImpresoraToner oldToner = new ModeloImpresoraToner();
        oldToner.setModeloImpresora(existing);
        oldToner.setColor("Negro");
        oldToner.setVariante("Estándar");
        oldToner.setCodigo("OLD-CODE");
        existing.getToners().add(oldToner);

        when(repository.findById(1L)).thenReturn(Optional.of(existing));
        when(marcaImpresoraRepository.findById(1L)).thenReturn(Optional.of(marca()));
        when(repository.save(any(ModeloImpresora.class))).thenAnswer(inv -> inv.getArgument(0));

        ModeloImpresora result = service.update(1L, sampleRequest());

        assertThat(result.getToners()).hasSize(1);
        assertThat(result.getToners().get(0).getCodigo()).isEqualTo("CF259A");
    }

    @Test
    void delete_removesExistingModeloImpresora() {
        ModeloImpresora existing = new ModeloImpresora();
        existing.setId(1L);
        when(repository.findById(1L)).thenReturn(Optional.of(existing));

        service.delete(1L);

        verify(repository).delete(existing);
    }
}
```

- [ ] **Step 2: Correr el test y confirmar que falla por falta de las clases**

Run: `cd soportedesk-backend && mvn test -Dtest=ModeloImpresoraServiceTest`
Expected: FAIL — compile error, las clases `ModeloImpresora*` no existen todavía.

- [ ] **Step 3: Crear la entidad hija `ModeloImpresoraToner`**

Crear `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/ModeloImpresoraToner.java`:

```java
package com.inia.soportedesk.catalogo;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "modelo_impresora_toners")
@Getter
@Setter
@NoArgsConstructor
public class ModeloImpresoraToner {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "modelo_impresora_id", nullable = false)
    private ModeloImpresora modeloImpresora;

    @Column(nullable = false, length = 20)
    private String color;

    @Column(nullable = false, length = 50)
    private String variante;

    @Column(nullable = false, length = 80)
    private String codigo;
}
```

- [ ] **Step 4: Crear la entidad padre `ModeloImpresora`**

Crear `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/ModeloImpresora.java`:

```java
package com.inia.soportedesk.catalogo;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "modelos_impresora")
@Getter
@Setter
@NoArgsConstructor
public class ModeloImpresora {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "marca_id", nullable = false)
    private MarcaImpresora marca;

    @Column(nullable = false, length = 100)
    private String nombre;

    @OneToMany(mappedBy = "modeloImpresora", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("id ASC")
    private List<ModeloImpresoraToner> toners = new ArrayList<>();
}
```

- [ ] **Step 5: Crear el DTO de request**

Crear `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/ModeloImpresoraRequest.java`:

```java
package com.inia.soportedesk.catalogo;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class ModeloImpresoraRequest {

    @NotNull
    private Long marcaId;

    @NotBlank
    @Size(max = 100)
    private String nombre;

    private List<TonerRequest> toners = new ArrayList<>();

    @Getter
    @Setter
    public static class TonerRequest {
        @Size(max = 20)
        private String color;

        @Size(max = 50)
        private String variante;

        @Size(max = 80)
        private String codigo;
    }
}
```

- [ ] **Step 6: Crear el repositorio**

Crear `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/ModeloImpresoraRepository.java`:

```java
package com.inia.soportedesk.catalogo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ModeloImpresoraRepository extends JpaRepository<ModeloImpresora, Long> {

    List<ModeloImpresora> findByMarcaId(Long marcaId);

    @Query("SELECT m FROM ModeloImpresora m WHERE " +
           "LOWER(m.nombre) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(m.marca.nombre) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<ModeloImpresora> search(@Param("search") String search);

    @Query("SELECT m FROM ModeloImpresora m WHERE m.marca.id = :marcaId AND (" +
           "LOWER(m.nombre) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(m.marca.nombre) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<ModeloImpresora> searchByMarcaId(@Param("marcaId") Long marcaId, @Param("search") String search);
}
```

- [ ] **Step 7: Crear el service**

Crear `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/ModeloImpresoraService.java`:

```java
package com.inia.soportedesk.catalogo;

import com.inia.soportedesk.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ModeloImpresoraService {

    private final ModeloImpresoraRepository repository;
    private final MarcaImpresoraRepository marcaImpresoraRepository;

    public List<ModeloImpresora> findAll(Long marcaId, String search) {
        boolean hasSearch = search != null && !search.isBlank();

        if (marcaId != null && hasSearch) {
            return repository.searchByMarcaId(marcaId, search);
        }
        if (marcaId != null) {
            return repository.findByMarcaId(marcaId);
        }
        if (hasSearch) {
            return repository.search(search);
        }
        return repository.findAll();
    }

    public ModeloImpresora findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Modelo de impresora no encontrado: " + id));
    }

    @Transactional
    public ModeloImpresora create(ModeloImpresoraRequest request) {
        ModeloImpresora modelo = new ModeloImpresora();
        copyFields(modelo, request);
        return repository.save(modelo);
    }

    @Transactional
    public ModeloImpresora update(Long id, ModeloImpresoraRequest request) {
        ModeloImpresora modelo = findById(id);
        copyFields(modelo, request);
        return repository.save(modelo);
    }

    public void delete(Long id) {
        repository.delete(findById(id));
    }

    private void copyFields(ModeloImpresora modelo, ModeloImpresoraRequest request) {
        MarcaImpresora marca = marcaImpresoraRepository.findById(request.getMarcaId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Marca de impresora no encontrada: " + request.getMarcaId()));

        modelo.setMarca(marca);
        modelo.setNombre(request.getNombre());

        modelo.getToners().clear();
        for (ModeloImpresoraRequest.TonerRequest item : normalizedToners(request)) {
            ModeloImpresoraToner toner = new ModeloImpresoraToner();
            toner.setModeloImpresora(modelo);
            toner.setColor(item.getColor().trim());
            toner.setVariante(item.getVariante().trim());
            toner.setCodigo(item.getCodigo().trim());
            modelo.getToners().add(toner);
        }
    }

    private List<ModeloImpresoraRequest.TonerRequest> normalizedToners(ModeloImpresoraRequest request) {
        List<ModeloImpresoraRequest.TonerRequest> normalized = new ArrayList<>();
        if (request.getToners() == null) {
            return normalized;
        }
        for (ModeloImpresoraRequest.TonerRequest item : request.getToners()) {
            boolean hasColor = item != null && hasText(item.getColor());
            boolean hasVariante = item != null && hasText(item.getVariante());
            boolean hasCodigo = item != null && hasText(item.getCodigo());
            if (!hasColor && !hasVariante && !hasCodigo) {
                continue;
            }
            if (!hasColor || !hasVariante || !hasCodigo) {
                throw new IllegalArgumentException("Cada tóner debe tener color, variante y código.");
            }
            normalized.add(item);
        }
        return normalized;
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
```

- [ ] **Step 8: Correr el test y confirmar que pasa**

Run: `cd soportedesk-backend && mvn test -Dtest=ModeloImpresoraServiceTest`
Expected: PASS — 8/8 tests green.

- [ ] **Step 9: Crear el controller**

Crear `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/ModeloImpresoraController.java`:

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
@RequestMapping("/api/catalogos/modelos-impresora")
@RequiredArgsConstructor
public class ModeloImpresoraController {

    private final ModeloImpresoraService service;

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
}
```

- [ ] **Step 10: Compilar todo el módulo**

Run: `cd soportedesk-backend && mvn compile`
Expected: BUILD SUCCESS.

- [ ] **Step 11: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/ModeloImpresora*.java soportedesk-backend/src/test/java/com/inia/soportedesk/catalogo/ModeloImpresoraServiceTest.java
git commit -m "feat: add ModeloImpresora + ModeloImpresoraToner catalog"
```

---

## Task 4: Migrar `Impresora` a `modeloImpresora` (FK) — entidad, DTO, service, repository y tests existentes

**Files:**
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/Impresora.java`
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/ImpresoraRequest.java`
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/ImpresoraService.java`
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/ImpresoraRepository.java`
- Modify: `soportedesk-backend/src/test/java/com/inia/soportedesk/impresoras/ImpresoraServiceTest.java`
- Modify: `soportedesk-backend/src/test/java/com/inia/soportedesk/impresoras/ImpresoraRepositoryTest.java`
- Modify: `soportedesk-backend/src/test/java/com/inia/soportedesk/impresoras/ImpresoraControllerIT.java`
- Modify: `soportedesk-backend/src/test/java/com/inia/soportedesk/impresoras/ImpresoraDriverControllerIT.java`

**Interfaces:**
- Consumes: `ModeloImpresoraRepository` (Task 3).
- Produces: `Impresora.getModeloImpresora()/.setModeloImpresora(ModeloImpresora)` (reemplaza `getMarca/getModelo/getModeloTonerNegro/C/M/Y`); `ImpresoraRequest.getModeloImpresoraId()/.setModeloImpresoraId(Long)`. Las tareas de frontend (8-12) consumen el JSON resultante: `impresora.modeloImpresora.marca.nombre`, `impresora.modeloImpresora.nombre`, `impresora.modeloImpresora.toners[]`.

- [ ] **Step 1: Escribir el test de repositorio que falla (búsqueda por marca/modelo vía catálogo)**

Reemplazar el contenido completo de `soportedesk-backend/src/test/java/com/inia/soportedesk/impresoras/ImpresoraRepositoryTest.java`:

```java
package com.inia.soportedesk.impresoras;

import com.inia.soportedesk.catalogo.MarcaImpresora;
import com.inia.soportedesk.catalogo.MarcaImpresoraRepository;
import com.inia.soportedesk.catalogo.ModeloImpresora;
import com.inia.soportedesk.catalogo.ModeloImpresoraRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class ImpresoraRepositoryTest {

    @Autowired
    private ImpresoraRepository repository;

    @Autowired
    private MarcaImpresoraRepository marcaImpresoraRepository;

    @Autowired
    private ModeloImpresoraRepository modeloImpresoraRepository;

    private ModeloImpresora modeloImpresora(String marcaNombre, String modeloNombre) {
        MarcaImpresora marca = new MarcaImpresora();
        marca.setNombre(marcaNombre);
        marca = marcaImpresoraRepository.save(marca);

        ModeloImpresora modelo = new ModeloImpresora();
        modelo.setMarca(marca);
        modelo.setNombre(modeloNombre);
        return modeloImpresoraRepository.save(modelo);
    }

    @Test
    void search_bySerie_returnsMatchingImpresora() {
        Impresora impresora = new Impresora();
        impresora.setModeloImpresora(modeloImpresora("HP", "M404dn"));
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
        impresora.setModeloImpresora(modeloImpresora("Canon", "LBP6230"));
        impresora.setTipoConexion("USB");
        impresora.setEstado("Activa");
        impresora.setCodigoInventario("INV-7766");
        repository.save(impresora);

        List<Impresora> result = repository.search("INV-7766");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getCodigoInventario()).isEqualTo("INV-7766");
    }

    @Test
    void search_byModeloNombre_returnsMatchingImpresora() {
        Impresora impresora = new Impresora();
        impresora.setModeloImpresora(modeloImpresora("Epson", "L3250"));
        impresora.setTipoConexion("USB");
        impresora.setEstado("Activa");
        repository.save(impresora);

        List<Impresora> result = repository.search("L3250");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getModeloImpresora().getNombre()).isEqualTo("L3250");
    }

    @Test
    void search_byMarcaNombre_returnsMatchingImpresora() {
        Impresora impresora = new Impresora();
        impresora.setModeloImpresora(modeloImpresora("Brother", "HL-L2350DW"));
        impresora.setTipoConexion("USB");
        impresora.setEstado("Activa");
        repository.save(impresora);

        List<Impresora> result = repository.search("Brother");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getModeloImpresora().getMarca().getNombre()).isEqualTo("Brother");
    }
}
```

- [ ] **Step 2: Confirmar que el test falla por compilación (la entidad todavía no tiene `modeloImpresora`)**

Run: `cd soportedesk-backend && mvn test-compile`
Expected: FAIL — `Impresora` no tiene los métodos `setModeloImpresora`/`getModeloImpresora`.

- [ ] **Step 3: Modificar la entidad `Impresora`**

En `soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/Impresora.java`, el import actual es:

```java
import com.inia.soportedesk.catalogo.Dependencia;
import com.inia.soportedesk.catalogo.Sede;
import com.inia.soportedesk.catalogo.Subdependencia;
import com.inia.soportedesk.catalogo.TipoImpresora;
```

Reemplazarlo por:

```java
import com.inia.soportedesk.catalogo.Dependencia;
import com.inia.soportedesk.catalogo.ModeloImpresora;
import com.inia.soportedesk.catalogo.Sede;
import com.inia.soportedesk.catalogo.Subdependencia;
import com.inia.soportedesk.catalogo.TipoImpresora;
```

Reemplazar este bloque (los campos `marca`/`modelo`):

```java
    @Column(nullable = false)
    private String marca;

    @Column(nullable = false)
    private String modelo;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "tipo_impresora_id")
    private TipoImpresora tipoImpresora;
```

por:

```java
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "modelo_impresora_id", nullable = false)
    private ModeloImpresora modeloImpresora;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "tipo_impresora_id")
    private TipoImpresora tipoImpresora;
```

Y eliminar estos 4 campos (los últimos antes de los campos `driver*`):

```java
    @Column(name = "modelo_toner_negro")
    private String modeloTonerNegro;

    @Column(name = "modelo_toner_c")
    private String modeloTonerC;

    @Column(name = "modelo_toner_m")
    private String modeloTonerM;

    @Column(name = "modelo_toner_y")
    private String modeloTonerY;

```

(dejar el campo `estado` seguido directamente por los 4 campos `driver*` sin cambios).

- [ ] **Step 4: Modificar `ImpresoraRequest`**

En `soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/ImpresoraRequest.java`, reemplazar:

```java
    @NotBlank
    private String marca;

    @NotBlank
    private String modelo;

    private Long tipoImpresoraId;
```

por:

```java
    @NotNull
    private Long modeloImpresoraId;

    private Long tipoImpresoraId;
```

Agregar el import `jakarta.validation.constraints.NotNull;` junto a los imports existentes (`NotBlank`, `Size`).

Eliminar estos 4 campos del final de la clase:

```java
    @Size(max = 100)
    private String modeloTonerNegro;

    @Size(max = 100)
    private String modeloTonerC;

    @Size(max = 100)
    private String modeloTonerM;

    @Size(max = 100)
    private String modeloTonerY;
```

- [ ] **Step 5: Modificar `ImpresoraService`**

En `soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/ImpresoraService.java`, agregar el import:

```java
import com.inia.soportedesk.catalogo.ModeloImpresoraRepository;
```

Agregar el campo al final del bloque de repositorios inyectados:

```java
    private final ModeloImpresoraRepository modeloImpresoraRepository;
```

(queda como el sexto `private final ... Repository` campo, después de `tipoImpresoraRepository`).

En `copyFields()`, reemplazar:

```java
        impresora.setMarca(request.getMarca());
        impresora.setModelo(request.getModelo());
        impresora.setEstado(request.getEstado());
```

por:

```java
        impresora.setModeloImpresora(modeloImpresoraRepository.findById(request.getModeloImpresoraId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Modelo de impresora no encontrado: " + request.getModeloImpresoraId())));
        impresora.setEstado(request.getEstado());
```

Y eliminar estas 4 líneas al final de `copyFields()`:

```java
        impresora.setModeloTonerNegro(emptyToNull(request.getModeloTonerNegro()));
        impresora.setModeloTonerC(emptyToNull(request.getModeloTonerC()));
        impresora.setModeloTonerM(emptyToNull(request.getModeloTonerM()));
        impresora.setModeloTonerY(emptyToNull(request.getModeloTonerY()));
```

- [ ] **Step 6: Modificar `ImpresoraRepository`**

Reemplazar el contenido completo de `soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/ImpresoraRepository.java`:

```java
package com.inia.soportedesk.impresoras;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ImpresoraRepository extends JpaRepository<Impresora, Long> {

    @Query("SELECT i FROM Impresora i " +
           "LEFT JOIN i.modeloImpresora mi LEFT JOIN mi.marca ma " +
           "LEFT JOIN i.sede s LEFT JOIN i.dependencia d WHERE " +
           "LOWER(ma.nombre) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(mi.nombre) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(s.nombre) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(d.nombre) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(i.serie) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(i.codigoInventario) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(i.codigoPatrimonial) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<Impresora> search(@Param("search") String search);
}
```

- [ ] **Step 7: Correr `ImpresoraRepositoryTest` y confirmar que pasa**

Run: `cd soportedesk-backend && mvn test -Dtest=ImpresoraRepositoryTest`
Expected: PASS — 4/4 tests green.

- [ ] **Step 8: Reescribir `ImpresoraServiceTest`**

Reemplazar el contenido completo de `soportedesk-backend/src/test/java/com/inia/soportedesk/impresoras/ImpresoraServiceTest.java`:

```java
package com.inia.soportedesk.impresoras;

import com.inia.soportedesk.catalogo.DependenciaRepository;
import com.inia.soportedesk.catalogo.MarcaImpresora;
import com.inia.soportedesk.catalogo.ModeloImpresora;
import com.inia.soportedesk.catalogo.ModeloImpresoraRepository;
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

    @Mock
    private ModeloImpresoraRepository modeloImpresoraRepository;

    @InjectMocks
    private ImpresoraService service;

    private ModeloImpresora modeloImpresora() {
        MarcaImpresora marca = new MarcaImpresora();
        marca.setId(1L);
        marca.setNombre("HP");

        ModeloImpresora modelo = new ModeloImpresora();
        modelo.setId(1L);
        modelo.setMarca(marca);
        modelo.setNombre("M404dn");
        return modelo;
    }

    private ImpresoraRequest sampleRequest() {
        ImpresoraRequest request = new ImpresoraRequest();
        request.setModeloImpresoraId(1L);
        request.setTipoConexion("IP");
        request.setIp("10.0.0.50");
        request.setSerie("SN-12345");
        request.setCodigoInventario("INV-001");
        request.setCodigoPatrimonial("PAT-001");
        request.setEstado("Activa");
        return request;
    }

    private Impresora sampleImpresora(Long id) {
        Impresora imp = new Impresora();
        imp.setId(id);
        imp.setModeloImpresora(modeloImpresora());
        imp.setTipoConexion("IP");
        imp.setIp("10.0.0.50");
        imp.setSerie("SN-12345");
        imp.setCodigoInventario("INV-001");
        imp.setCodigoPatrimonial("PAT-001");
        imp.setEstado("Activa");
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
    void create_savesImpresoraWithModeloImpresora() {
        when(modeloImpresoraRepository.findById(1L)).thenReturn(Optional.of(modeloImpresora()));
        when(repository.save(any(Impresora.class))).thenAnswer(inv -> inv.getArgument(0));

        Impresora result = service.create(sampleRequest());

        assertThat(result.getModeloImpresora().getNombre()).isEqualTo("M404dn");
        assertThat(result.getModeloImpresora().getMarca().getNombre()).isEqualTo("HP");
        assertThat(result.getSerie()).isEqualTo("SN-12345");
    }

    @Test
    void create_withUnknownModeloImpresoraId_throwsResourceNotFoundException() {
        when(modeloImpresoraRepository.findById(99L)).thenReturn(Optional.empty());

        ImpresoraRequest request = sampleRequest();
        request.setModeloImpresoraId(99L);

        assertThatThrownBy(() -> service.create(request))
                .isInstanceOf(ResourceNotFoundException.class);
    }

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

    @Test
    void delete_removesExistingImpresora() {
        Impresora impresora = sampleImpresora(1L);
        when(repository.findById(1L)).thenReturn(Optional.of(impresora));

        service.delete(1L);

        verify(repository).delete(impresora);
    }

    @Test
    void create_withTipoConexionUsb_forcesIpNull() {
        when(modeloImpresoraRepository.findById(1L)).thenReturn(Optional.of(modeloImpresora()));
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
        when(modeloImpresoraRepository.findById(1L)).thenReturn(Optional.of(modeloImpresora()));
        when(repository.save(any(Impresora.class))).thenAnswer(inv -> inv.getArgument(0));

        Impresora result = service.create(sampleRequest());

        assertThat(result.getTipoConexion()).isEqualTo("IP");
        assertThat(result.getIp()).isEqualTo("10.0.0.50");
    }

    @Test
    void create_resolvesTipoImpresoraFromId() {
        when(modeloImpresoraRepository.findById(1L)).thenReturn(Optional.of(modeloImpresora()));
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

- [ ] **Step 9: Correr `ImpresoraServiceTest` y confirmar que pasa**

Run: `cd soportedesk-backend && mvn test -Dtest=ImpresoraServiceTest`
Expected: PASS — 9/9 tests green.

- [ ] **Step 10: Reescribir `ImpresoraControllerIT`**

Reemplazar el contenido completo de `soportedesk-backend/src/test/java/com/inia/soportedesk/impresoras/ImpresoraControllerIT.java`:

```java
package com.inia.soportedesk.impresoras;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.inia.soportedesk.catalogo.MarcaImpresora;
import com.inia.soportedesk.catalogo.ModeloImpresora;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class ImpresoraControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ImpresoraService service;

    private ImpresoraRequest sampleRequest() {
        ImpresoraRequest request = new ImpresoraRequest();
        request.setModeloImpresoraId(1L);
        request.setTipoConexion("IP");
        request.setIp("10.0.0.50");
        request.setSerie("SN-12345");
        request.setCodigoInventario("INV-001");
        request.setCodigoPatrimonial("PAT-001");
        request.setEstado("Activa");
        return request;
    }

    private Impresora sampleImpresora() {
        MarcaImpresora marca = new MarcaImpresora();
        marca.setId(1L);
        marca.setNombre("HP");

        ModeloImpresora modelo = new ModeloImpresora();
        modelo.setId(1L);
        modelo.setMarca(marca);
        modelo.setNombre("M404dn");

        Impresora imp = new Impresora();
        imp.setId(1L);
        imp.setModeloImpresora(modelo);
        imp.setTipoConexion("IP");
        imp.setIp("10.0.0.50");
        imp.setSerie("SN-12345");
        imp.setCodigoInventario("INV-001");
        imp.setCodigoPatrimonial("PAT-001");
        imp.setEstado("Activa");
        return imp;
    }

    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "READ_impresoras"})
    void findAll_withReadAuthority_allowsUser() throws Exception {
        when(service.findAll(null)).thenReturn(List.of(sampleImpresora()));

        mockMvc.perform(get("/api/impresoras"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].modeloImpresora.marca.nombre", is("HP")))
                .andExpect(jsonPath("$[0].modeloImpresora.nombre", is("M404dn")));
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void findAll_withoutReadAuthority_returnsForbidden() throws Exception {
        mockMvc.perform(get("/api/impresoras"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void create_withAdminRole_returnsCreated() throws Exception {
        when(service.create(any())).thenReturn(sampleImpresora());

        mockMvc.perform(post("/api/impresoras")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.modeloImpresora.marca.nombre", is("HP")))
                .andExpect(jsonPath("$.modeloImpresora.nombre", is("M404dn")));
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void create_withSoporteRole_returnsForbidden() throws Exception {
        mockMvc.perform(post("/api/impresoras")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isForbidden());
    }
}
```

- [ ] **Step 11: Actualizar el helper de `ImpresoraDriverControllerIT`**

En `soportedesk-backend/src/test/java/com/inia/soportedesk/impresoras/ImpresoraDriverControllerIT.java`, agregar los imports:

```java
import com.inia.soportedesk.catalogo.MarcaImpresora;
import com.inia.soportedesk.catalogo.ModeloImpresora;
```

(junto a `com.inia.soportedesk.common.FileStorageService`, antes de los imports de JUnit).

Reemplazar el método `impresoraConDriver`:

```java
    private Impresora impresoraConDriver(Long id, String path) {
        Impresora imp = new Impresora();
        imp.setId(id);
        imp.setMarca("HP");
        imp.setModelo("M404dn");
        imp.setEstado("Activa");
        imp.setDriverNombre("driver-hp.zip");
        imp.setDriverVersion("1.2");
        imp.setDriverSo("Windows 10");
        imp.setDriverArchivoPath(path);
        return imp;
    }
```

por:

```java
    private Impresora impresoraConDriver(Long id, String path) {
        MarcaImpresora marca = new MarcaImpresora();
        marca.setId(1L);
        marca.setNombre("HP");

        ModeloImpresora modelo = new ModeloImpresora();
        modelo.setId(1L);
        modelo.setMarca(marca);
        modelo.setNombre("M404dn");

        Impresora imp = new Impresora();
        imp.setId(id);
        imp.setModeloImpresora(modelo);
        imp.setEstado("Activa");
        imp.setDriverNombre("driver-hp.zip");
        imp.setDriverVersion("1.2");
        imp.setDriverSo("Windows 10");
        imp.setDriverArchivoPath(path);
        return imp;
    }
```

- [ ] **Step 12: Compilar todo (`mvn test-compile`) y correr la suite completa**

Run: `cd soportedesk-backend && mvn test`
Expected: compila sin errores; `ImpresoraServiceTest`, `ImpresoraRepositoryTest`, `MarcaImpresoraServiceTest`, `ModeloImpresoraServiceTest` en verde. `ImpresoraControllerIT`/`ImpresoraDriverControllerIT` pueden seguir fallando por el problema preexistente de H2/`schema.sql` (ver Global Constraints) — confirmar que el error es el mismo de siempre (fallo de carga de `ApplicationContext` por `schema.sql`) y no un error de compilación ni un error nuevo distinto.

- [ ] **Step 13: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/ soportedesk-backend/src/test/java/com/inia/soportedesk/impresoras/
git commit -m "feat: migrate Impresora to modeloImpresora catalog FK"
```

---

## Task 5: Frontend — modelos TS y `CatalogoService` para `MarcaImpresora`/`ModeloImpresora`

**Files:**
- Modify: `soportedesk-frontend/src/app/core/models/catalogo.model.ts`
- Modify: `soportedesk-frontend/src/app/core/catalogos/catalogo.service.ts`

**Interfaces:**
- Consumes: endpoints `GET/POST/PUT/DELETE /api/catalogos/marcas-impresora{,/{id}}` y `/api/catalogos/modelos-impresora{,/{id}}?marcaId=` (Tasks 2-3).
- Produces: interfaces `MarcaImpresora{id, nombre}`, `ModeloImpresoraToner{id?, color, variante, codigo}`, `ModeloImpresora{id, nombre, marca, toners}`, `ModeloImpresoraRequest{marcaId, nombre, toners}`; métodos `CatalogoService.getMarcasImpresora()/createMarcaImpresora()/updateMarcaImpresora()/deleteMarcaImpresora()` y `.getModelosImpresora(marcaId?)/createModeloImpresora()/updateModeloImpresora()/deleteModeloImpresora()`. Consumido por Tasks 6, 7, 8, 9, 10, 11, 12.

- [ ] **Step 1: Agregar las interfaces nuevas a `catalogo.model.ts`**

En `soportedesk-frontend/src/app/core/models/catalogo.model.ts`, agregar al final del archivo (después de `SubdependenciaRequest`):

```typescript

export interface MarcaImpresora {
  id: number;
  nombre: string;
}

export interface ModeloImpresoraToner {
  id?: number;
  color: string;
  variante: string;
  codigo: string;
}

export interface ModeloImpresora {
  id: number;
  nombre: string;
  marca: MarcaImpresora;
  toners: ModeloImpresoraToner[];
}

export interface ModeloImpresoraRequest {
  marcaId: number;
  nombre: string;
  toners: ModeloImpresoraToner[];
}
```

(`MarcaImpresora` reusa la interfaz genérica `CatalogoRequest` para crear/actualizar, igual que `TipoImpresora` — no necesita un `MarcaImpresoraRequest` propio).

- [ ] **Step 2: Agregar los métodos a `CatalogoService`**

En `soportedesk-frontend/src/app/core/catalogos/catalogo.service.ts`, ampliar el import:

```typescript
import {
  CatalogoRequest,
  Dependencia,
  DependenciaRequest,
  MarcaImpresora,
  ModeloImpresora,
  ModeloImpresoraRequest,
  Sede,
  Subdependencia,
  SubdependenciaRequest,
  TipoBien,
  TipoContrato,
  TipoLicencia,
  TipoImpresora,
} from '../models/catalogo.model';
```

Agregar al final de la clase, antes de la última llave de cierre (después de `deleteTipoImpresora`):

```typescript

  getMarcasImpresora(): Observable<MarcaImpresora[]> {
    return this.http.get<MarcaImpresora[]>(`${this.apiUrl}/marcas-impresora`);
  }

  createMarcaImpresora(request: CatalogoRequest): Observable<MarcaImpresora> {
    return this.http.post<MarcaImpresora>(`${this.apiUrl}/marcas-impresora`, request);
  }

  updateMarcaImpresora(id: number, request: CatalogoRequest): Observable<MarcaImpresora> {
    return this.http.put<MarcaImpresora>(`${this.apiUrl}/marcas-impresora/${id}`, request);
  }

  deleteMarcaImpresora(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/marcas-impresora/${id}`);
  }

  getModelosImpresora(marcaId?: number): Observable<ModeloImpresora[]> {
    let params = new HttpParams();
    if (marcaId) {
      params = params.set('marcaId', marcaId);
    }
    return this.http.get<ModeloImpresora[]>(`${this.apiUrl}/modelos-impresora`, { params });
  }

  createModeloImpresora(request: ModeloImpresoraRequest): Observable<ModeloImpresora> {
    return this.http.post<ModeloImpresora>(`${this.apiUrl}/modelos-impresora`, request);
  }

  updateModeloImpresora(id: number, request: ModeloImpresoraRequest): Observable<ModeloImpresora> {
    return this.http.put<ModeloImpresora>(`${this.apiUrl}/modelos-impresora/${id}`, request);
  }

  deleteModeloImpresora(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/modelos-impresora/${id}`);
  }
```

- [ ] **Step 3: Compilar el frontend**

Run: `cd soportedesk-frontend && npx tsc --noEmit -p tsconfig.app.json`
Expected: sin errores nuevos (este comando puede tardar; alternativa rápida: `ng build` se corre en la verificación final de la Task 13).

- [ ] **Step 4: Commit**

```bash
git add soportedesk-frontend/src/app/core/models/catalogo.model.ts soportedesk-frontend/src/app/core/catalogos/catalogo.service.ts
git commit -m "feat: add MarcaImpresora/ModeloImpresora models and CatalogoService methods"
```

---

## Task 6: Frontend — pestaña "Marcas de Impresora" en `/catalogos`

**Files:**
- Modify: `soportedesk-frontend/src/app/features/catalogos/catalogos.component.ts`
- Modify: `soportedesk-frontend/src/app/features/catalogos/catalogos.component.html`
- Modify: `soportedesk-frontend/src/app/features/catalogos/catalogos.component.spec.ts`

**Interfaces:**
- Consumes: `CatalogoService.getMarcasImpresora/createMarcaImpresora/updateMarcaImpresora/deleteMarcaImpresora` (Task 5).
- Produces: pestaña funcional "Marcas de Impresora" en `/catalogos`, reusando el patrón genérico `nombreForm`/`submitSimple()`/`deleteItem()`. Task 7 reutiliza `this.marcasImpresora` (la lista cargada aquí) como input del selector de marca en el formulario de Modelos.

- [ ] **Step 1: Actualizar el test que falla (flush de la nueva petición HTTP)**

En `soportedesk-frontend/src/app/features/catalogos/catalogos.component.spec.ts`, reemplazar la función `flushLoadAll`:

```typescript
  function flushLoadAll(sedesData: unknown[] = [], tiposImpresoraData: unknown[] = []): void {
    httpMock.expectOne((req) => req.url.includes('/catalogos/sedes')).flush(sedesData);
    httpMock.expectOne((req) => req.url.includes('/catalogos/dependencias')).flush([]);
    httpMock.expectOne((req) => req.url.includes('/catalogos/subdependencias')).flush([]);
    httpMock.expectOne((req) => req.url.includes('/catalogos/tipos-contrato')).flush([]);
    httpMock.expectOne((req) => req.url.includes('/catalogos/tipos-licencia')).flush([]);
    httpMock.expectOne((req) => req.url.includes('/catalogos/tipos-bien')).flush([]);
    httpMock.expectOne((req) => req.url.includes('/catalogos/tipos-impresora')).flush(tiposImpresoraData);
  }
```

por:

```typescript
  function flushLoadAll(sedesData: unknown[] = [], tiposImpresoraData: unknown[] = [], marcasImpresoraData: unknown[] = []): void {
    httpMock.expectOne((req) => req.url.includes('/catalogos/sedes')).flush(sedesData);
    httpMock.expectOne((req) => req.url.includes('/catalogos/dependencias')).flush([]);
    httpMock.expectOne((req) => req.url.includes('/catalogos/subdependencias')).flush([]);
    httpMock.expectOne((req) => req.url.includes('/catalogos/tipos-contrato')).flush([]);
    httpMock.expectOne((req) => req.url.includes('/catalogos/tipos-licencia')).flush([]);
    httpMock.expectOne((req) => req.url.includes('/catalogos/tipos-bien')).flush([]);
    httpMock.expectOne((req) => req.url.includes('/catalogos/tipos-impresora')).flush(tiposImpresoraData);
    httpMock.expectOne((req) => req.url.includes('/catalogos/marcas-impresora')).flush(marcasImpresoraData);
    httpMock.expectOne((req) => req.url.includes('/catalogos/modelos-impresora')).flush([]);
  }
```

Agregar un test nuevo al final del archivo, antes de la última llave de cierre del `describe`:

```typescript

  it('should create a marca de impresora and reload', () => {
    component.activeTab = 'marcasImpresora';
    component.nombreForm = 'HP';
    component.submitSimple();

    const postReq = httpMock.expectOne((req) =>
      req.method === 'POST' && req.url.includes('/catalogos/marcas-impresora'),
    );
    postReq.flush({ id: 1, nombre: 'HP' });

    flushLoadAll([], [], [{ id: 1, nombre: 'HP' }]);

    expect(component.marcasImpresora.length).toBe(1);
  });
```

- [ ] **Step 2: Confirmar que el test falla**

Run: `cd soportedesk-frontend && ng test --watch=false --include='**/catalogos.component.spec.ts'`
Expected: FAIL — `component.activeTab = 'marcasImpresora'` no es un valor válido del tipo `CatalogoTab` (error de compilación TS) y/o las peticiones a `marcas-impresora`/`modelos-impresora` nunca se disparan.

- [ ] **Step 3: Ampliar `catalogos.component.ts`**

En `soportedesk-frontend/src/app/features/catalogos/catalogos.component.ts`, ampliar el import:

```typescript
import {
  Dependencia,
  MarcaImpresora,
  ModeloImpresora,
  Sede,
  Subdependencia,
  TipoBien,
  TipoContrato,
  TipoLicencia,
  TipoImpresora,
} from '../../core/models/catalogo.model';
```

Ampliar el tipo `CatalogoTab`:

```typescript
type CatalogoTab =
  | 'sedes'
  | 'dependencias'
  | 'subdependencias'
  | 'tiposContrato'
  | 'tiposLicencia'
  | 'tiposBien'
  | 'tiposImpresora'
  | 'marcasImpresora'
  | 'modelosImpresora';
```

Agregar las propiedades de listado junto a `tiposImpresora`:

```typescript
  tiposImpresora: TipoImpresora[] = [];
  marcasImpresora: MarcaImpresora[] = [];
  modelosImpresora: ModeloImpresora[] = [];
```

En `loadAll()`, agregar después de `getTiposImpresora`:

```typescript
    this.service.getTiposImpresora().subscribe((data) => (this.tiposImpresora = data));
    this.service.getMarcasImpresora().subscribe((data) => (this.marcasImpresora = data));
    this.service.getModelosImpresora().subscribe((data) => (this.modelosImpresora = data));
```

En `submitSimple()`, agregar una rama antes del `else if (this.activeTab === 'dependencias')`:

```typescript
    } else if (this.activeTab === 'marcasImpresora') {
      obs = this.editingId
        ? this.service.updateMarcaImpresora(this.editingId, { nombre: this.nombreForm })
        : this.service.createMarcaImpresora({ nombre: this.nombreForm });
    } else if (this.activeTab === 'dependencias') {
```

En `deleteItem()`, agregar una rama antes del `else {` final (que hoy maneja `tiposImpresora`):

```typescript
    } else if (tab === 'marcasImpresora') {
      obs = this.service.deleteMarcaImpresora(id);
    } else {
      obs = this.service.deleteTipoImpresora(id);
    }
```

- [ ] **Step 4: Ampliar `catalogos.component.html`**

En `soportedesk-frontend/src/app/features/catalogos/catalogos.component.html`, agregar el botón de pestaña después del de "Tipos de Impresora":

```html
  <button [class.active]="activeTab === 'marcasImpresora'" (click)="setTab('marcasImpresora')">Marcas de Impresora</button>
```

Agregar el bloque de contenido después del `</ng-container>` de "Tipos de Impresora":

```html
<!-- Marcas de Impresora -->
<ng-container *ngIf="activeTab === 'marcasImpresora'">
  <table>
    <thead>
      <tr>
        <th>Nombre</th>
        <th>Acciones</th>
      </tr>
    </thead>
    <tbody>
      <tr *ngFor="let item of marcasImpresora">
        <td>{{ item.nombre }}</td>
        <td>
          <button (click)="startEdit(item.id, item.nombre)">Editar</button>
          <button class="danger" (click)="deleteItem('marcasImpresora', item.id)">Eliminar</button>
        </td>
      </tr>
    </tbody>
  </table>

  <div class="form">
    <input [(ngModel)]="nombreForm" placeholder="Nombre de marca" />
    <button (click)="submitSimple()">{{ editingId ? 'Actualizar' : 'Agregar' }}</button>
    <button class="secondary" *ngIf="editingId" (click)="resetForm()">Cancelar</button>
  </div>
</ng-container>
```

- [ ] **Step 5: Correr el test y confirmar que pasa**

Run: `cd soportedesk-frontend && ng test --watch=false --include='**/catalogos.component.spec.ts'`
Expected: PASS — todos los tests verdes, incluyendo el nuevo.

- [ ] **Step 6: Commit**

```bash
git add soportedesk-frontend/src/app/features/catalogos/catalogos.component.ts soportedesk-frontend/src/app/features/catalogos/catalogos.component.html soportedesk-frontend/src/app/features/catalogos/catalogos.component.spec.ts
git commit -m "feat: add Marcas de Impresora tab to Catalogos"
```

---

## Task 7: Frontend — `ModeloImpresoraFormComponent` + pestaña "Modelos de Impresora"

**Files:**
- Create: `soportedesk-frontend/src/app/features/catalogos/modelo-impresora-form.component.ts`
- Create: `soportedesk-frontend/src/app/features/catalogos/modelo-impresora-form.component.html`
- Create: `soportedesk-frontend/src/app/features/catalogos/modelo-impresora-form.component.scss`
- Modify: `soportedesk-frontend/src/app/features/catalogos/catalogos.component.ts`
- Modify: `soportedesk-frontend/src/app/features/catalogos/catalogos.component.html`

**Interfaces:**
- Consumes: `CatalogoService.createModeloImpresora/updateModeloImpresora` (Task 5); `marcasImpresora`/`modelosImpresora` cargados por `catalogos.component.ts` (Task 6).
- Produces: componente standalone `app-modelo-impresora-form` con `@Input() modelo: ModeloImpresora | null`, `@Input() marcas: MarcaImpresora[]`, `@Output() saved`, `@Output() cancelled` — mismo contrato que `ImpresoraFormComponent`/`LicenciaFormComponent`. Task 9 (`impresora-form`) replica el patrón de cascada Marca→Modelo aquí establecido.

Este componente no tiene spec dedicado (mismo criterio que `LicenciaFormComponent`, que tampoco lo tiene en este repo) — se verifica con `ng build` al final de la task y en la verificación final (Task 13).

- [ ] **Step 1: Crear el componente `ModeloImpresoraFormComponent`**

Crear `soportedesk-frontend/src/app/features/catalogos/modelo-impresora-form.component.ts`:

```typescript
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
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
  imports: [CommonModule, ReactiveFormsModule],
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

- [ ] **Step 2: Crear la plantilla**

Crear `soportedesk-frontend/src/app/features/catalogos/modelo-impresora-form.component.html`:

```html
<form [formGroup]="form" (ngSubmit)="submit()" class="modelo-impresora-form">
  <div class="form-grid">
    <div class="field">
      <label>Marca</label>
      <select [value]="marcaId" (change)="onMarcaChange($any($event.target).value)">
        <option [ngValue]="null">Seleccione...</option>
        <option *ngFor="let m of marcas" [value]="m.id">{{ m.nombre }}</option>
      </select>
    </div>
    <div class="field">
      <label>Modelo</label>
      <input type="text" formControlName="nombre" />
    </div>
  </div>

  <section class="toner-section">
    <div class="section-heading">
      <div>
        <h3>Variantes de tóner</h3>
        <p>Agrega una fila por cada color y variante (ej. Estándar, Alto rendimiento).</p>
      </div>
      <button type="button" class="secondary compact" (click)="addToner()">Agregar tóner</button>
    </div>

    <div class="toner-list" formArrayName="toners">
      <div class="toner-row" *ngFor="let group of tonersArray.controls; let i = index" [formGroupName]="i">
        <div class="field">
          <label>Color</label>
          <select formControlName="color">
            <option value="">Seleccione...</option>
            <option *ngFor="let c of tonerColores" [value]="c">{{ c }}</option>
          </select>
        </div>
        <div class="field">
          <label>Variante</label>
          <input type="text" formControlName="variante" placeholder="ej: Estándar" />
        </div>
        <div class="field">
          <label>Código</label>
          <input type="text" formControlName="codigo" placeholder="ej: CF259A" />
        </div>
        <button type="button" class="icon-btn" (click)="removeToner(i)" title="Quitar tóner">Quitar</button>
      </div>
    </div>
  </section>

  <div class="actions">
    <button type="button" class="secondary" (click)="cancelled.emit()">Cancelar</button>
    <button type="submit" [disabled]="form.invalid || !marcaId">Guardar</button>
  </div>
</form>
```

- [ ] **Step 3: Crear los estilos**

Crear `soportedesk-frontend/src/app/features/catalogos/modelo-impresora-form.component.scss`:

```scss
.modelo-impresora-form {
  display: grid;
  gap: 14px;
}

.form-grid,
.toner-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.field {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 5px;

  label {
    color: var(--color-text-secondary);
    font-size: 12px;
    font-weight: 700;
  }

  input,
  select {
    width: 100%;
    min-height: 38px;
    padding: 8px 10px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    font-family: inherit;
    outline: none;
  }
}

.toner-section {
  display: grid;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-muted);
}

.section-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;

  h3,
  p {
    margin: 0;
  }

  h3 {
    color: var(--color-text);
    font-size: 14px;
  }

  p {
    margin-top: 4px;
    color: var(--color-text-secondary);
    font-size: 12px;
  }
}

.toner-list {
  display: grid;
  gap: 10px;
}

.toner-row {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: end;
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
}

.toner-row .icon-btn {
  justify-self: end;
  min-height: 34px;
  grid-column: 1 / -1;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

button {
  min-height: 38px;
  border: none;
  border-radius: var(--radius-sm);
  padding: 8px 16px;
  background: var(--color-accent);
  color: var(--color-white);
  font-weight: 700;

  &:disabled {
    background: var(--color-gray);
    cursor: not-allowed;
  }

  &.secondary,
  &.icon-btn {
    background: var(--color-muted);
    color: var(--color-text);
    border: 1px solid var(--color-border);
  }

  &.compact {
    white-space: nowrap;
  }
}

@media (max-width: 640px) {
  .form-grid,
  .toner-row {
    grid-template-columns: 1fr;
  }

  .section-heading,
  .actions {
    flex-direction: column;
  }

  .actions button,
  .section-heading button {
    width: 100%;
  }
}
```

- [ ] **Step 4: Hospedar el componente en la pestaña "Modelos de Impresora" — `catalogos.component.ts`**

En `soportedesk-frontend/src/app/features/catalogos/catalogos.component.ts`, agregar el import del nuevo componente:

```typescript
import { ModeloImpresoraFormComponent } from './modelo-impresora-form.component';
```

Agregar `ModeloImpresoraFormComponent` al array `imports` del decorador `@Component`:

```typescript
@Component({
  selector: 'app-catalogos',
  standalone: true,
  imports: [CommonModule, FormsModule, ModeloImpresoraFormComponent],
  templateUrl: './catalogos.component.html',
  styleUrl: './catalogos.component.scss',
})
```

Agregar la propiedad de estado y los métodos, junto a `editingId`/`startEdit`/`resetForm`:

```typescript
  editingModeloImpresora: ModeloImpresora | null = null;

  onEditModeloImpresora(modelo: ModeloImpresora): void {
    this.editingModeloImpresora = modelo;
  }

  onModeloImpresoraSaved(): void {
    this.editingModeloImpresora = null;
    this.loadAll();
  }

  onModeloImpresoraCancelled(): void {
    this.editingModeloImpresora = null;
  }

  deleteModeloImpresora(id: number): void {
    this.service.deleteModeloImpresora(id).subscribe(() => this.loadAll());
  }
```

En `setTab()`, resetear también `editingModeloImpresora`:

```typescript
  setTab(tab: CatalogoTab): void {
    this.activeTab = tab;
    this.editingModeloImpresora = null;
    this.resetForm();
  }
```

- [ ] **Step 5: Agregar la pestaña y el bloque de contenido — `catalogos.component.html`**

Agregar el botón de pestaña después del de "Marcas de Impresora":

```html
  <button [class.active]="activeTab === 'modelosImpresora'" (click)="setTab('modelosImpresora')">Modelos de Impresora</button>
```

Agregar el bloque de contenido después del `</ng-container>` de "Marcas de Impresora":

```html
<!-- Modelos de Impresora -->
<ng-container *ngIf="activeTab === 'modelosImpresora'">
  <table>
    <thead>
      <tr>
        <th>Marca</th>
        <th>Modelo</th>
        <th>Tóner</th>
        <th>Acciones</th>
      </tr>
    </thead>
    <tbody>
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
    </tbody>
  </table>

  <app-modelo-impresora-form
    [modelo]="editingModeloImpresora"
    [marcas]="marcasImpresora"
    (saved)="onModeloImpresoraSaved()"
    (cancelled)="onModeloImpresoraCancelled()"
  />
</ng-container>
```

- [ ] **Step 6: Verificar manualmente que compila y arranca**

Run: `cd soportedesk-frontend && ng build`
Expected: BUILD SUCCESS, sin errores de TypeScript ni de plantillas (los `formControlName="color"`/`"variante"`/`"codigo"` deben resolver contra el `FormGroup` tipado de `createTonerGroup`).

- [ ] **Step 7: Commit**

```bash
git add soportedesk-frontend/src/app/features/catalogos/modelo-impresora-form.component.ts soportedesk-frontend/src/app/features/catalogos/modelo-impresora-form.component.html soportedesk-frontend/src/app/features/catalogos/modelo-impresora-form.component.scss soportedesk-frontend/src/app/features/catalogos/catalogos.component.ts soportedesk-frontend/src/app/features/catalogos/catalogos.component.html
git commit -m "feat: add Modelos de Impresora tab with toner FormArray"
```

---

## Task 8: Frontend — `impresora.model.ts` reemplaza marca/modelo/tóner por `modeloImpresora`

**Files:**
- Modify: `soportedesk-frontend/src/app/features/impresoras/impresora.model.ts`

**Interfaces:**
- Consumes: `ModeloImpresora` (Task 5, `core/models/catalogo.model.ts`).
- Produces: `Impresora.modeloImpresora: ModeloImpresora`, `ImpresoraRequest.modeloImpresoraId: number | null`. Consumido por Tasks 9, 10, 11, 12.

- [ ] **Step 1: Reemplazar el contenido completo del archivo**

Reemplazar `soportedesk-frontend/src/app/features/impresoras/impresora.model.ts`:

```typescript
import { BadgeTone } from '../../shared/status-badge/status-badge.component';
import { ModeloImpresora } from '../../core/models/catalogo.model';

export interface Impresora {
  id: number;
  modeloImpresora: ModeloImpresora;
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
  driverNombre: string | null;
  driverVersion: string | null;
  driverSo: string | null;
  driverArchivoPath: string | null;
}

export interface ImpresoraRequest {
  modeloImpresoraId: number | null;
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
}

export const IMPRESORA_ESTADOS: { value: string; tone: BadgeTone }[] = [
  { value: 'Activa', tone: 'success' },
  { value: 'En mantenimiento', tone: 'warning' },
  { value: 'De baja', tone: 'danger' },
];

export function impresoraEstadoTone(estado: string): BadgeTone {
  return IMPRESORA_ESTADOS.find((item) => item.value === estado)?.tone ?? 'neutral';
}
```

- [ ] **Step 2: Confirmar el estado de compilación**

Run: `cd soportedesk-frontend && ng build`
Expected: FAIL — `impresora-form.component.ts`, `impresora-ficha.component.ts`/`.html`, `impresora-resumen.component.ts`, `impresoras-list.component.ts` y sus specs todavía referencian `marca`/`modelo`/`modeloTonerNegro` etc. Esto es esperado; se corrige en las Tasks 9-12.

- [ ] **Step 3: Commit**

```bash
git add soportedesk-frontend/src/app/features/impresoras/impresora.model.ts
git commit -m "feat: replace Impresora marca/modelo/toner fields with modeloImpresora"
```

---

## Task 9: Frontend — `ImpresoraFormComponent`: cascada Marca→Modelo + tóner de solo lectura

**Files:**
- Modify: `soportedesk-frontend/src/app/features/impresoras/impresora-form.component.ts`
- Modify: `soportedesk-frontend/src/app/features/impresoras/impresora-form.component.html`
- Modify: `soportedesk-frontend/src/app/features/impresoras/impresora-form.component.scss`
- Modify: `soportedesk-frontend/src/app/features/impresoras/impresora-form.component.spec.ts`

**Interfaces:**
- Consumes: `CatalogoService.getMarcasImpresora()/getModelosImpresora(marcaId?)` (Task 5); `Impresora.modeloImpresora`/`ImpresoraRequest.modeloImpresoraId` (Task 8).
- Produces: formulario de alta/edición de Impresora actualizado — sin cambios en el contrato `@Input() impresora` / `@Output() saved`/`cancelled` que consume `impresoras-list.component.ts` (Task 12).

- [ ] **Step 1: Actualizar el test que falla (flush de la nueva petición HTTP)**

En `soportedesk-frontend/src/app/features/impresoras/impresora-form.component.spec.ts`, en el `beforeEach`, agregar el flush de `marcas-impresora`:

```typescript
    httpMock.expectOne((req) => req.url.includes('/catalogos/tipos-impresora')).flush([]);
    httpMock.expectOne((req) => req.url.includes('/catalogos/marcas-impresora')).flush([]);
    httpMock.expectOne((req) => req.url.includes('/catalogos/sedes')).flush([]);
    httpMock.expectOne((req) => req.url.includes('/catalogos/tipos-contrato')).flush([]);
```

- [ ] **Step 2: Confirmar que el test falla**

Run: `cd soportedesk-frontend && ng test --watch=false --include='**/impresora-form.component.spec.ts'`
Expected: FAIL — `httpMock.verify()` falla porque el componente todavía no dispara la petición a `marcas-impresora` (no existe ese `subscribe` en `ngOnInit`), y el archivo todavía referencia los controles `marca`/`modelo`/`modeloTonerNegro` que se van a quitar.

- [ ] **Step 3: Reescribir `impresora-form.component.ts`**

Reemplazar el contenido completo de `soportedesk-frontend/src/app/features/impresoras/impresora-form.component.ts`:

```typescript
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IMPRESORA_ESTADOS, Impresora, ImpresoraRequest } from './impresora.model';
import { ImpresoraService } from './impresora.service';
import { UbicacionSelectComponent } from '../../shared/ubicacion-select/ubicacion-select.component';
import { CatalogoService } from '../../core/catalogos/catalogo.service';
import { MarcaImpresora, ModeloImpresora, TipoImpresora } from '../../core/models/catalogo.model';
import { SectionCardComponent } from '../../shared/section-card/section-card.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';

@Component({
  selector: 'app-impresora-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    UbicacionSelectComponent,
    SectionCardComponent,
    StatusBadgeComponent,
  ],
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
  marcas: MarcaImpresora[] = [];
  modelos: ModeloImpresora[] = [];
  marcaId: number | null = null;
  readonly estadoOptions = IMPRESORA_ESTADOS;

  form = this.fb.nonNullable.group({
    modeloImpresoraId: [null as number | null, Validators.required],
    tipoImpresoraId:   [null as number | null],
    serie:              [''],
    codigoInventario:   [''],
    codigoPatrimonial:  [''],
    tipoConexion:       ['USB', Validators.required],
    ip:                 [''],
    estado:             ['Activa', Validators.required],
  });

  get modeloSeleccionado(): ModeloImpresora | null {
    const id = this.form.value.modeloImpresoraId;
    return this.modelos.find((m) => m.id === id) ?? null;
  }

  constructor() {
    this.form.get('tipoConexion')!.valueChanges.subscribe((value) => {
      if (value === 'USB') {
        this.form.patchValue({ ip: '' });
      }
    });
  }

  ngOnInit(): void {
    this.catalogoService.getTiposImpresora().subscribe((data) => (this.tiposImpresora = data));
    this.catalogoService.getMarcasImpresora().subscribe((data) => (this.marcas = data));
  }

  ngOnChanges(): void {
    if (this.impresora) {
      this.sedeId           = this.impresora.sede?.id ?? null;
      this.dependenciaId    = this.impresora.dependencia?.id ?? null;
      this.subdependenciaId = this.impresora.subdependencia?.id ?? null;
      this.marcaId           = this.impresora.modeloImpresora?.marca?.id ?? null;
      this.modelos = this.impresora.modeloImpresora ? [this.impresora.modeloImpresora] : [];
      if (this.marcaId) {
        this.catalogoService.getModelosImpresora(this.marcaId).subscribe((data) => (this.modelos = data));
      }
      this.form.patchValue({
        modeloImpresoraId: this.impresora.modeloImpresora?.id ?? null,
        tipoImpresoraId:   this.impresora.tipoImpresora?.id ?? null,
        serie:             this.impresora.serie ?? '',
        codigoInventario:  this.impresora.codigoInventario ?? '',
        codigoPatrimonial: this.impresora.codigoPatrimonial ?? '',
        tipoConexion:      this.impresora.tipoConexion,
        ip:                this.impresora.ip,
        estado:            this.impresora.estado,
      });
    } else {
      this.sedeId = null;
      this.dependenciaId = null;
      this.subdependenciaId = null;
      this.marcaId = null;
      this.modelos = [];
      this.form.reset({
        modeloImpresoraId: null,
        tipoImpresoraId: null, serie: '', codigoInventario: '', codigoPatrimonial: '',
        tipoConexion: 'USB', ip: '',
        estado: 'Activa',
      });
    }
  }

  onMarcaChange(value: string): void {
    this.marcaId = value ? Number(value) : null;
    this.modelos = [];
    this.form.patchValue({ modeloImpresoraId: null });
    if (this.marcaId) {
      this.catalogoService.getModelosImpresora(this.marcaId).subscribe((data) => (this.modelos = data));
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

- [ ] **Step 4: Reescribir el bloque "Identificación" y "Consumibles" en `impresora-form.component.html`**

En `soportedesk-frontend/src/app/features/impresoras/impresora-form.component.html`, reemplazar:

```html
      <div class="field">
        <label>Marca</label>
        <input type="text" formControlName="marca" />
      </div>
      <div class="field">
        <label>Modelo</label>
        <input type="text" formControlName="modelo" />
      </div>
```

por:

```html
      <div class="field">
        <label>Marca</label>
        <select [value]="marcaId" (change)="onMarcaChange($any($event.target).value)">
          <option [ngValue]="null">Seleccione...</option>
          <option *ngFor="let m of marcas" [value]="m.id">{{ m.nombre }}</option>
        </select>
      </div>
      <div class="field">
        <label>Modelo</label>
        <select formControlName="modeloImpresoraId">
          <option [ngValue]="null">Seleccione...</option>
          <option *ngFor="let modelo of modelos" [ngValue]="modelo.id">{{ modelo.nombre }}</option>
        </select>
      </div>
```

Reemplazar el bloque completo de la sección "Consumibles" (los 4 inputs de tóner):

```html
  <app-section-card title="Consumibles">
    <svg icon xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M4 7h16v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M8 12h8" />
    </svg>

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
  </app-section-card>
```

por:

```html
  <app-section-card title="Consumibles" *ngIf="modeloSeleccionado">
    <svg icon xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M4 7h16v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M8 12h8" />
    </svg>

    <ng-container *ngIf="modeloSeleccionado!.toners.length; else sinToner">
      <div class="toner-preview">
        <div class="toner-chip" *ngFor="let toner of modeloSeleccionado!.toners">
          <span>{{ toner.color }} · {{ toner.variante }}</span>
          <strong>{{ toner.codigo }}</strong>
        </div>
      </div>
    </ng-container>
    <ng-template #sinToner>
      <p class="empty-message">Este modelo no tiene tóner registrado en el catálogo.</p>
    </ng-template>
  </app-section-card>
```

- [ ] **Step 5: Agregar estilos para el bloque de tóner de solo lectura**

En `soportedesk-frontend/src/app/features/impresoras/impresora-form.component.scss`, agregar al final del archivo (antes del `@media` final, o después — el orden no afecta):

```scss
.toner-preview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 10px;
}

.toner-chip {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-muted);
  padding: 10px;

  span {
    display: block;
    margin-bottom: 4px;
    color: var(--color-text-secondary);
    font-size: 11px;
    font-weight: 700;
  }

  strong {
    color: var(--color-text);
    font-family: Consolas, 'Courier New', monospace;
    font-size: 13px;
  }
}

.empty-message {
  margin: 0;
  color: var(--color-text-secondary);
  font-style: italic;
  font-size: 14px;
}
```

- [ ] **Step 6: Correr el test y confirmar que pasa**

Run: `cd soportedesk-frontend && ng test --watch=false --include='**/impresora-form.component.spec.ts'`
Expected: PASS — 3/3 tests green (los tests existentes de `tipoConexion`/`ip` siguen aplicando sin cambios, ya que no tocan los controles de marca/modelo/tóner).

- [ ] **Step 7: Commit**

```bash
git add soportedesk-frontend/src/app/features/impresoras/impresora-form.component.ts soportedesk-frontend/src/app/features/impresoras/impresora-form.component.html soportedesk-frontend/src/app/features/impresoras/impresora-form.component.scss soportedesk-frontend/src/app/features/impresoras/impresora-form.component.spec.ts
git commit -m "feat: add Marca/Modelo cascade and read-only toner preview to ImpresoraForm"
```

---

## Task 10: Frontend — `ImpresoraFichaComponent`: Identificación + Consumibles agrupados por color

**Files:**
- Modify: `soportedesk-frontend/src/app/features/impresoras/impresora-ficha.component.ts`
- Modify: `soportedesk-frontend/src/app/features/impresoras/impresora-ficha.component.html`
- Modify: `soportedesk-frontend/src/app/features/impresoras/impresora-ficha.component.scss`
- Modify: `soportedesk-frontend/src/app/features/impresoras/impresora-ficha.component.spec.ts`

**Interfaces:**
- Consumes: `Impresora.modeloImpresora` (Task 8).
- Produces: `ImpresoraFichaComponent.tonersPorColor: { color: string; variantes: ModeloImpresoraToner[] }[]` (reemplaza `hasConsumibles()`). Sin cambios en `@Input() impresora`/`@Output() driverUpdated`, consumido sin cambios por `impresoras-list.component.ts`.

- [ ] **Step 1: Reescribir el mock y los tests que fallan**

Reemplazar el contenido completo de `soportedesk-frontend/src/app/features/impresoras/impresora-ficha.component.spec.ts`:

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
  driverNombre: null,
  driverVersion: null,
  driverSo: null,
  driverArchivoPath: null,
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

  it('should show upload section for admin', async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ImpresoraFichaComponent, HttpClientTestingModule],
      providers: [{ provide: AuthService, useValue: { isAdmin: () => true, canWrite: () => true } }],
    }).compileComponents();

    const adminFixture = TestBed.createComponent(ImpresoraFichaComponent);
    const adminComponent = adminFixture.componentInstance;
    adminComponent.impresora = mockImpresora;
    adminFixture.detectChanges();
    adminComponent.setTab('driver');
    adminFixture.detectChanges();

    expect(adminComponent.isAdmin).toBeTrue();
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

- [ ] **Step 2: Confirmar que el test falla**

Run: `cd soportedesk-frontend && ng test --watch=false --include='**/impresora-ficha.component.spec.ts'`
Expected: FAIL — `component.tonersPorColor` no existe todavía; `Impresora` ya no tiene `marca`/`modelo`/`modeloTonerNegro` (error de compilación TS hasta que se actualice el componente).

- [ ] **Step 3: Reescribir `impresora-ficha.component.ts`**

Reemplazar el contenido completo de `soportedesk-frontend/src/app/features/impresoras/impresora-ficha.component.ts`:

```typescript
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { Impresora, impresoraEstadoTone } from './impresora.model';
import { ImpresoraService } from './impresora.service';
import { ModeloImpresoraToner } from '../../core/models/catalogo.model';
import { SectionCardComponent } from '../../shared/section-card/section-card.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';

type FichaTab = 'instalacion' | 'consumibles' | 'driver';

@Component({
  selector: 'app-impresora-ficha',
  standalone: true,
  imports: [CommonModule, FormsModule, SectionCardComponent, StatusBadgeComponent],
  templateUrl: './impresora-ficha.component.html',
  styleUrl: './impresora-ficha.component.scss',
})
export class ImpresoraFichaComponent {
  private service = inject(ImpresoraService);
  private authService = inject(AuthService);

  @Input({ required: true }) impresora!: Impresora;
  @Output() driverUpdated = new EventEmitter<Impresora>();

  activeTab: FichaTab = 'instalacion';
  driverVersionInput = '';
  driverSoInput = '';
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

  downloadDriver(): void {
    this.service.downloadDriver(this.impresora.id).subscribe((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = this.impresora.driverNombre ?? 'driver';
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.service.uploadDriver(this.impresora.id, file, this.driverVersionInput, this.driverSoInput).subscribe((updated) => {
      this.driverVersionInput = '';
      this.driverSoInput = '';
      this.driverUpdated.emit(updated);
    });
  }
}
```

(se eliminó `hasConsumibles()`, reemplazado por el getter `tonersPorColor`).

- [ ] **Step 4: Actualizar `impresora-ficha.component.html`**

Reemplazar:

```html
        <div class="detail-field">
          <span class="detail-label">Marca / Modelo</span>
          <span class="detail-value">{{ impresora.marca }} {{ impresora.modelo }}</span>
        </div>
```

por:

```html
        <div class="detail-field">
          <span class="detail-label">Marca / Modelo</span>
          <span class="detail-value">{{ impresora.modeloImpresora.marca.nombre }} {{ impresora.modeloImpresora.nombre }}</span>
        </div>
```

Reemplazar el bloque completo del tab "Consumibles":

```html
  <div class="content" *ngIf="activeTab === 'consumibles'">
    <app-section-card title="Consumibles">
      <svg icon xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M4 7h16v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </svg>

      <ng-container *ngIf="hasConsumibles(); else noConsumibles">
        <div class="consumibles-grid">
          <div class="consumible-card" *ngIf="impresora.modeloTonerNegro">
            <span>Tóner Negro</span>
            <strong>{{ impresora.modeloTonerNegro }}</strong>
          </div>
          <div class="consumible-card" *ngIf="impresora.modeloTonerC">
            <span>Tóner Cyan</span>
            <strong>{{ impresora.modeloTonerC }}</strong>
          </div>
          <div class="consumible-card" *ngIf="impresora.modeloTonerM">
            <span>Tóner Magenta</span>
            <strong>{{ impresora.modeloTonerM }}</strong>
          </div>
          <div class="consumible-card" *ngIf="impresora.modeloTonerY">
            <span>Tóner Amarillo</span>
            <strong>{{ impresora.modeloTonerY }}</strong>
          </div>
        </div>
      </ng-container>
      <ng-template #noConsumibles>
        <p class="empty-message">Sin modelos de consumibles registrados.</p>
      </ng-template>
    </app-section-card>
  </div>
```

por:

```html
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
```

- [ ] **Step 5: Agregar estilos para `.toner-variante`**

En `soportedesk-frontend/src/app/features/impresoras/impresora-ficha.component.scss`, agregar dentro del bloque `.consumible-card` (después de la regla `strong { ... }`), o como bloque hermano nuevo:

```scss
.toner-variante {
  margin-top: 4px;
  font-size: 13px;
  color: var(--color-text);

  strong {
    font-family: Consolas, 'Courier New', monospace;
  }
}
```

- [ ] **Step 6: Correr el test y confirmar que pasa**

Run: `cd soportedesk-frontend && ng test --watch=false --include='**/impresora-ficha.component.spec.ts'`
Expected: PASS — 7/7 tests green.

- [ ] **Step 7: Commit**

```bash
git add soportedesk-frontend/src/app/features/impresoras/impresora-ficha.component.ts soportedesk-frontend/src/app/features/impresoras/impresora-ficha.component.html soportedesk-frontend/src/app/features/impresoras/impresora-ficha.component.scss soportedesk-frontend/src/app/features/impresoras/impresora-ficha.component.spec.ts
git commit -m "feat: group consumibles by color in ImpresoraFicha using catalogo toners"
```

---

## Task 11: Frontend — `ImpresoraResumenComponent`: agrupar conteo de tóner por (color, variante, código)

**Files:**
- Modify: `soportedesk-frontend/src/app/features/impresoras/impresora-resumen.component.ts`

**Interfaces:**
- Consumes: `Impresora.modeloImpresora.toners` (Task 8).
- Produces: sin cambios en `@Input() impresoras` ni en la forma de `ResumenRow{tipoLabel, modelo, cantidad}` — el HTML (`impresora-resumen.component.html`) no necesita cambios porque sigue bindeando las mismas 3 propiedades.

No existe spec para este componente (no se agrega uno nuevo, fuera de alcance del diseño) — se verifica con `ng build`/`ng test` generales (Task 13).

- [ ] **Step 1: Reescribir `impresora-resumen.component.ts`**

Reemplazar el contenido completo de `soportedesk-frontend/src/app/features/impresoras/impresora-resumen.component.ts`:

```typescript
import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Impresora } from './impresora.model';

interface ResumenRow {
  tipoLabel: string;
  modelo: string;
  cantidad: number;
}

@Component({
  selector: 'app-impresora-resumen',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './impresora-resumen.component.html',
  styleUrl: './impresora-resumen.component.scss',
})
export class ImpresoraResumenComponent implements OnChanges {
  @Input() impresoras: Impresora[] = [];

  selectedSede = '';
  selectedDependencia = '';
  collapsed = false;

  rows: ResumenRow[] = [];
  sedes: string[] = [];
  dependencias: string[] = [];

  ngOnChanges(): void {
    this.sedes = [...new Set(
      this.impresoras.map(i => i.sede?.nombre).filter((n): n is string => !!n)
    )].sort();
    this.dependencias = [...new Set(
      this.impresoras.map(i => i.dependencia?.nombre).filter((n): n is string => !!n)
    )].sort();
    this.calcularResumen();
  }

  onFilterChange(): void {
    this.calcularResumen();
  }

  toggle(): void {
    this.collapsed = !this.collapsed;
  }

  private calcularResumen(): void {
    const filtered = this.impresoras.filter(imp =>
      (!this.selectedSede || imp.sede?.nombre === this.selectedSede) &&
      (!this.selectedDependencia || imp.dependencia?.nombre === this.selectedDependencia)
    );

    const counts = new Map<string, ResumenRow>();
    for (const imp of filtered) {
      for (const toner of imp.modeloImpresora?.toners ?? []) {
        const key = `${toner.color}|${toner.variante}|${toner.codigo}`;
        const entry = counts.get(key);
        if (entry) {
          entry.cantidad += 1;
        } else {
          counts.set(key, {
            tipoLabel: `Tóner ${toner.color} — ${toner.variante}`,
            modelo: toner.codigo,
            cantidad: 1,
          });
        }
      }
    }
    this.rows = Array.from(counts.values());
  }
}
```

- [ ] **Step 2: Verificar manualmente**

Run: `cd soportedesk-frontend && ng build`
Expected: este archivo ya no produce errores de TypeScript (puede seguir habiendo errores en `impresoras-list.component.ts`, que se corrige en la Task 12).

- [ ] **Step 3: Commit**

```bash
git add soportedesk-frontend/src/app/features/impresoras/impresora-resumen.component.ts
git commit -m "feat: group consumibles summary by toner color/variante/codigo"
```

---

## Task 12: Frontend — `ImpresorasListComponent`: columnas de tabla Marca/Modelo

**Files:**
- Modify: `soportedesk-frontend/src/app/features/impresoras/impresoras-list.component.ts`

**Interfaces:**
- Consumes: `Impresora.modeloImpresora` (Task 8); `GenericTableComponent` ya soporta `key` con notación de punto anidada (`generic-table.component.ts:39`, método `getValue()`).
- Produces: ninguna nueva — último consumidor de la cadena de cambios de `Impresora`.

- [ ] **Step 1: Actualizar las columnas**

En `soportedesk-frontend/src/app/features/impresoras/impresoras-list.component.ts`, reemplazar:

```typescript
  columns: TableColumn[] = [
    { key: 'marca', label: 'Marca' },
    { key: 'modelo', label: 'Modelo' },
    { key: 'tipoImpresora.nombre', label: 'Tipo' },
    { key: 'serie', label: 'Serie' },
    { key: 'ip', label: 'IP' },
    { key: 'sede.nombre', label: 'Sede' },
    { key: 'dependencia.nombre', label: 'Dependencia' },
    { key: 'subdependencia.nombre', label: 'Subdependencia' },
  ];
```

por:

```typescript
  columns: TableColumn[] = [
    { key: 'modeloImpresora.marca.nombre', label: 'Marca' },
    { key: 'modeloImpresora.nombre', label: 'Modelo' },
    { key: 'tipoImpresora.nombre', label: 'Tipo' },
    { key: 'serie', label: 'Serie' },
    { key: 'ip', label: 'IP' },
    { key: 'sede.nombre', label: 'Sede' },
    { key: 'dependencia.nombre', label: 'Dependencia' },
    { key: 'subdependencia.nombre', label: 'Subdependencia' },
  ];
```

- [ ] **Step 2: Verificar que el frontend compila completo**

Run: `cd soportedesk-frontend && ng build`
Expected: BUILD SUCCESS — esta era la última referencia rota a `marca`/`modelo` en el módulo de impresoras.

- [ ] **Step 3: Commit**

```bash
git add soportedesk-frontend/src/app/features/impresoras/impresoras-list.component.ts
git commit -m "feat: show modeloImpresora marca/nombre columns in impresoras table"
```

---

## Task 13: Verificación final de la rama completa

**Files:** ninguno (solo comandos de verificación).

**Interfaces:** ninguna — task de cierre.

- [ ] **Step 1: Suite completa de backend**

Run: `cd soportedesk-backend && mvn test`
Expected: compila sin errores. Comparar el conteo de fallos/errores contra el baseline documentado en memoria del proyecto (89 tests, 0 failures, 4 errors preexistentes de H2/`schema.sql`: 2 en `UsuarioRepositoryTest` no relacionados, 2 que antes eran de `ImpresoraRepositoryTest` y que esta Task 4 corrigió). El número de errores preexistentes puede haber cambiado de "2 en ImpresoraRepositoryTest" a "0" (si ya pasa) más los de siempre en `*ControllerIT` por el problema de H2 — no debe haber **errores nuevos** distintos a ese patrón conocido.

- [ ] **Step 2: Compilación completa de backend (incluye tests `*ControllerIT`)**

Run: `cd soportedesk-backend && mvn verify -DskipTests=false -Dmaven.test.failure.ignore=true`
Expected: BUILD SUCCESS o BUILD FAILURE únicamente por los `*ControllerIT` ya documentados como rotos (ver Global Constraints) — ningún error de compilación.

- [ ] **Step 3: Build de producción de frontend**

Run: `cd soportedesk-frontend && ng build`
Expected: BUILD SUCCESS, sin errores de TypeScript ni de plantillas.

- [ ] **Step 4: Suite completa de tests de frontend**

Run: `cd soportedesk-frontend && ng test --watch=false`
Expected: todos los specs en verde, incluyendo los modificados en las Tasks 6, 9 y 10.

- [ ] **Step 5: Confirmar en el reporte qué falta para producción**

No hay paso de código aquí — dejar constancia textual (en el mensaje de cierre al usuario, no en un archivo) de que falta:
1. Que el usuario corra `alter_impresoras_catalogo_marca_modelo.sql` en SSMS contra `172.16.26.16`/`ssti` (verificando antes que `dbo.impresoras` esté vacía).
2. Reiniciar el backend (`mvn spring-boot:run`) para que tome las nuevas entidades/repositorios.
3. Cargar al menos una marca y un modelo (con su tóner) desde `/catalogos` antes de poder registrar una impresora nueva, ya que `modeloImpresoraId` es obligatorio.

- [ ] **Step 6: Commit final si quedó algo pendiente de stage**

```bash
git status --short
```

Si hay cambios sin commitear de las tasks anteriores, revisar y commitear cada uno por separado siguiendo el mensaje correspondiente — no usar un commit catch-all.

