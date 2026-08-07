# Módulo Licencias — Rediseño de Campos y Catálogos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rediseñar el módulo de licencias de software para clasificar cada licencia por tipo de software y tipo de bien (vía dos catálogos nuevos), separar descripción de producto de tipo, hacer opcionales cuenta/clave/serial de activación, encriptar `claveActivacion` de forma reversible (AES-GCM), y actualizar el frontend correspondiente.

**Architecture:** Dos catálogos nuevos (`TipoLicencia`, `TipoBien`) siguiendo el patrón Entity/Request/Repository/Service/Controller idéntico a `TipoContrato`. La entidad `Licencia` se reescribe con FKs `EAGER` a ambos catálogos, campos de activación opcionales, y un `AttributeConverter` JPA (`LicenciaCredentialConverter`) que encripta/desencripta `claveActivacion` de forma transparente para el resto del código. El frontend reescribe el formulario (selects de catálogo + lógica condicional cuenta/clave) y reduce las columnas de la lista, moviendo el detalle completo al modal de "ver".

**Tech Stack:** Spring Boot 3.2.5, Java 17, Spring Data JPA + Hibernate, SQL Server 2016+, Lombok, JUnit 5 + Mockito + AssertJ, Angular 17+ standalone components, Reactive Forms, RxJS.

## Global Constraints

- `spring.sql.init.mode: never` — `schema.sql` no se ejecuta automáticamente; los cambios de esquema en la BD real (`172.16.26.16`, base `ssti`) se aplican manualmente vía script SSMS.
- Los datos actuales en `dbo.licencias` son descartables (confirmado) — la migración es drop-and-recreate, no preservación de filas.
- Catálogos de solo-lectura pública, escritura `@PreAuthorize("hasRole('ADMIN')")` — mismo patrón que todos los catálogos existentes.
- `LicenciaController` usa `@PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_licencias')")` para escritura — sin cambios de forma.
- Tests de entidades JPA usan constructor sin argumentos + setters (no `@AllArgsConstructor` posicional) — evita que renombrar/reordenar campos rompa tests, consistente con la convención ya establecida en el proyecto.
- Las relaciones FK de `Licencia` (`tipoLicencia`, `tipoBien`) **no** llevan `@JsonIgnore` — el controller serializa la entidad completa, igual que `UsuarioRed.sede`/`dependencia`/`tipoContrato`.
- Los campos FK en el formulario de Angular (`tipoLicenciaId`, `tipoBienId`) se modelan como propiedades de clase sueltas con `<select [value]> + (change)`, **no** como `formControlName` dentro del `FormGroup` reactivo — éste es el patrón establecido y repetido en `EquipoFormComponent` (`usuarioRedId`) y `UsuarioRedFormComponent` (`sedeId`/`dependenciaId`/`subdependenciaId`/`tipoContratoId`), confirmado leyendo ambos archivos antes de escribir este plan.
- No se crea un componente de combobox/select reusable nuevo — se usa `<select>` simple en cada lugar, igual que el resto del sistema (out of scope explícito del spec).
- `*ControllerIT` (todos, no solo los de este módulo) fallan al cargar el `ApplicationContext` por incompatibilidad H2/SQL-Server en `schema.sql` — bug transversal preexistente, documentado en memoria del proyecto, **fuera de alcance** arreglar aquí. Las tareas de este plan que tocan `*ControllerIT` deben dejar el archivo correcto y compilable; no se espera que el test runtime pase en este entorno.

---

## File Map

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/TipoLicencia.java` | Crear | Entidad catálogo |
| `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/TipoLicenciaRequest.java` | Crear | DTO de entrada |
| `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/TipoLicenciaRepository.java` | Crear | Repositorio JPA |
| `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/TipoLicenciaService.java` | Crear | Lógica CRUD |
| `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/TipoLicenciaController.java` | Crear | Endpoints REST |
| `soportedesk-backend/src/test/java/com/inia/soportedesk/catalogo/TipoLicenciaServiceTest.java` | Crear | Tests unitarios |
| `soportedesk-backend/src/test/java/com/inia/soportedesk/catalogo/TipoLicenciaControllerIT.java` | Crear | Tests de integración |
| `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/TipoBien.java` | Crear | Entidad catálogo |
| `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/TipoBienRequest.java` | Crear | DTO de entrada |
| `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/TipoBienRepository.java` | Crear | Repositorio JPA |
| `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/TipoBienService.java` | Crear | Lógica CRUD |
| `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/TipoBienController.java` | Crear | Endpoints REST |
| `soportedesk-backend/src/test/java/com/inia/soportedesk/catalogo/TipoBienServiceTest.java` | Crear | Tests unitarios |
| `soportedesk-backend/src/test/java/com/inia/soportedesk/catalogo/TipoBienControllerIT.java` | Crear | Tests de integración |
| `soportedesk-backend/src/main/java/com/inia/soportedesk/licencias/LicenciaCredentialConverter.java` | Crear | Encriptación AES-GCM de `claveActivacion` |
| `soportedesk-backend/src/test/java/com/inia/soportedesk/licencias/LicenciaCredentialConverterTest.java` | Crear | Round-trip de encriptación |
| `soportedesk-backend/src/main/resources/application.yml` | Modificar | Clave de cifrado `licencia.encryption-key` |
| `soportedesk-backend/src/test/resources/application.yml` | Modificar | Clave de cifrado para tests |
| `soportedesk-backend/src/main/java/com/inia/soportedesk/licencias/Licencia.java` | Reescribir | Entidad con FKs y campos nuevos |
| `soportedesk-backend/src/main/java/com/inia/soportedesk/licencias/LicenciaRequest.java` | Reescribir | DTO con campos nuevos |
| `soportedesk-backend/src/main/java/com/inia/soportedesk/licencias/LicenciaRepository.java` | Reescribir | Query de búsqueda actualizada |
| `soportedesk-backend/src/main/java/com/inia/soportedesk/licencias/LicenciaService.java` | Reescribir | Resolución de FKs + regla cuenta/clave |
| `soportedesk-backend/src/test/java/com/inia/soportedesk/licencias/LicenciaServiceTest.java` | Reescribir | Tests unitarios actualizados |
| `soportedesk-backend/src/test/java/com/inia/soportedesk/licencias/LicenciaControllerIT.java` | Reescribir | Tests de integración actualizados |
| `soportedesk-backend/src/main/resources/schema.sql` | Modificar | Bloques `tipos_licencia`/`tipos_bien` + `licencias` reemplazado |
| `soportedesk-backend/src/main/resources/migrate_licencias_v2.sql` | Crear | Migración manual one-shot para BD real |
| `soportedesk-frontend/src/app/core/models/catalogo.model.ts` | Modificar | Interfaces `TipoLicencia`/`TipoBien` |
| `soportedesk-frontend/src/app/core/catalogos/catalogo.service.ts` | Modificar | Métodos HTTP para los 2 catálogos nuevos |
| `soportedesk-frontend/src/app/features/licencias/licencia.model.ts` | Reescribir | Interfaces `Licencia`/`LicenciaRequest` |
| `soportedesk-frontend/src/app/features/licencias/licencia-form.component.ts` | Reescribir | Selects de catálogo + lógica condicional |
| `soportedesk-frontend/src/app/features/licencias/licencia-form.component.html` | Reescribir | Campos nuevos |
| `soportedesk-frontend/src/app/features/licencias/licencias-list.component.ts` | Modificar | Columnas reducidas |
| `soportedesk-frontend/src/app/features/licencias/licencias-list.component.html` | Modificar | Modal de detalle ampliado |
| `soportedesk-frontend/src/app/features/catalogos/catalogos.component.ts` | Modificar | 2 tabs nuevas |
| `soportedesk-frontend/src/app/features/catalogos/catalogos.component.html` | Modificar | 2 tabs nuevas |
| `soportedesk-frontend/src/app/features/catalogos/catalogos.component.spec.ts` | Modificar | Helper `flushLoadAll` para 6 endpoints |

---

## Task 1: Catálogo `TipoLicencia` (backend)

**Files:**
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/TipoLicencia.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/TipoLicenciaRequest.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/TipoLicenciaRepository.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/TipoLicenciaService.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/TipoLicenciaController.java`
- Test: `soportedesk-backend/src/test/java/com/inia/soportedesk/catalogo/TipoLicenciaServiceTest.java`
- Test: `soportedesk-backend/src/test/java/com/inia/soportedesk/catalogo/TipoLicenciaControllerIT.java`

**Interfaces:**
- Produces: `TipoLicencia` (fields: `Long id`, `String nombre`, no-arg ctor + getters/setters via Lombok `@Getter @Setter @NoArgsConstructor`), `TipoLicenciaRepository.search(String)`, `TipoLicenciaService.findAll(String)/findById(Long)/create(TipoLicenciaRequest)/update(Long, TipoLicenciaRequest)/delete(Long)`, REST endpoints under `/api/catalogos/tipos-licencia`. Task 5 (`LicenciaService`) consumes `TipoLicenciaRepository.findById(Long): Optional<TipoLicencia>` to resolve the FK.

- [ ] **Step 1: Create the entity**

```java
package com.inia.soportedesk.catalogo;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "tipos_licencia")
@Getter
@Setter
@NoArgsConstructor
public class TipoLicencia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;
}
```

- [ ] **Step 2: Create the request DTO**

```java
package com.inia.soportedesk.catalogo;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TipoLicenciaRequest {

    @NotBlank
    private String nombre;
}
```

- [ ] **Step 3: Create the repository**

```java
package com.inia.soportedesk.catalogo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TipoLicenciaRepository extends JpaRepository<TipoLicencia, Long> {

    @Query("SELECT t FROM TipoLicencia t WHERE LOWER(t.nombre) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<TipoLicencia> search(@Param("search") String search);
}
```

- [ ] **Step 4: Create the service**

```java
package com.inia.soportedesk.catalogo;

import com.inia.soportedesk.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TipoLicenciaService {

    private final TipoLicenciaRepository repository;

    public List<TipoLicencia> findAll(String search) {
        if (search == null || search.isBlank()) {
            return repository.findAll();
        }
        return repository.search(search);
    }

    public TipoLicencia findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tipo de licencia no encontrado: " + id));
    }

    public TipoLicencia create(TipoLicenciaRequest request) {
        TipoLicencia tipo = new TipoLicencia();
        tipo.setNombre(request.getNombre());
        return repository.save(tipo);
    }

    public TipoLicencia update(Long id, TipoLicenciaRequest request) {
        TipoLicencia tipo = findById(id);
        tipo.setNombre(request.getNombre());
        return repository.save(tipo);
    }

    public void delete(Long id) {
        repository.delete(findById(id));
    }
}
```

- [ ] **Step 5: Create the controller**

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
@RequestMapping("/api/catalogos/tipos-licencia")
@RequiredArgsConstructor
public class TipoLicenciaController {

    private final TipoLicenciaService service;

    @GetMapping
    public List<TipoLicencia> findAll(@RequestParam(required = false) String search) {
        return service.findAll(search);
    }

    @GetMapping("/{id}")
    public TipoLicencia findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TipoLicencia> create(@Valid @RequestBody TipoLicenciaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public TipoLicencia update(@PathVariable Long id, @Valid @RequestBody TipoLicenciaRequest request) {
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

- [ ] **Step 6: Write the service test**

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
class TipoLicenciaServiceTest {

    @Mock
    private TipoLicenciaRepository repository;

    @InjectMocks
    private TipoLicenciaService service;

    private TipoLicencia sample() {
        TipoLicencia tipo = new TipoLicencia();
        tipo.setId(1L);
        tipo.setNombre("Ofimática");
        return tipo;
    }

    @Test
    void findAll_withoutSearch_returnsAll() {
        when(repository.findAll()).thenReturn(List.of(sample()));

        List<TipoLicencia> result = service.findAll(null);

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
    void create_savesTipoLicenciaFromRequest() {
        TipoLicenciaRequest request = new TipoLicenciaRequest();
        request.setNombre("Ofimática");
        when(repository.save(any(TipoLicencia.class))).thenAnswer(inv -> inv.getArgument(0));

        TipoLicencia result = service.create(request);

        assertThat(result.getNombre()).isEqualTo("Ofimática");
    }
}
```

- [ ] **Step 7: Run the service test**

Run: `cd soportedesk-backend && mvn test -Dtest=TipoLicenciaServiceTest`
Expected: PASS (3 tests)

- [ ] **Step 8: Write the controller integration test**

```java
package com.inia.soportedesk.catalogo;

import com.fasterxml.jackson.databind.ObjectMapper;
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
class TipoLicenciaControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private TipoLicenciaService service;

    private TipoLicencia sample() {
        TipoLicencia tipo = new TipoLicencia();
        tipo.setId(1L);
        tipo.setNombre("Ofimática");
        return tipo;
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void findAll_allowsAuthenticatedUser() throws Exception {
        when(service.findAll(null)).thenReturn(List.of(sample()));

        mockMvc.perform(get("/api/catalogos/tipos-licencia"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].nombre", is("Ofimática")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void create_withAdminRole_returnsCreated() throws Exception {
        TipoLicenciaRequest request = new TipoLicenciaRequest();
        request.setNombre("Ofimática");
        when(service.create(any())).thenReturn(sample());

        mockMvc.perform(post("/api/catalogos/tipos-licencia")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nombre", is("Ofimática")));
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void create_withSoporteRole_returnsForbidden() throws Exception {
        TipoLicenciaRequest request = new TipoLicenciaRequest();
        request.setNombre("Ofimática");

        mockMvc.perform(post("/api/catalogos/tipos-licencia")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }
}
```

- [ ] **Step 9: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/TipoLicencia*.java soportedesk-backend/src/test/java/com/inia/soportedesk/catalogo/TipoLicencia*.java
git commit -m "feat: add TipoLicencia catalog (entity, CRUD, tests)"
```

---

## Task 2: Catálogo `TipoBien` (backend)

**Files:**
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/TipoBien.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/TipoBienRequest.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/TipoBienRepository.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/TipoBienService.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/TipoBienController.java`
- Test: `soportedesk-backend/src/test/java/com/inia/soportedesk/catalogo/TipoBienServiceTest.java`
- Test: `soportedesk-backend/src/test/java/com/inia/soportedesk/catalogo/TipoBienControllerIT.java`

**Interfaces:**
- Produces: `TipoBien` (fields: `Long id`, `String nombre`, same Lombok shape as `TipoLicencia`), `TipoBienRepository.search(String)`, `TipoBienService.findAll(String)/findById(Long)/create(TipoBienRequest)/update(Long, TipoBienRequest)/delete(Long)`, REST endpoints under `/api/catalogos/tipos-bien`. Task 5 (`LicenciaService`) consumes `TipoBienRepository.findById(Long): Optional<TipoBien>` to resolve the FK.

- [ ] **Step 1: Create the entity**

```java
package com.inia.soportedesk.catalogo;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "tipos_bien")
@Getter
@Setter
@NoArgsConstructor
public class TipoBien {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;
}
```

- [ ] **Step 2: Create the request DTO**

```java
package com.inia.soportedesk.catalogo;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TipoBienRequest {

    @NotBlank
    private String nombre;
}
```

- [ ] **Step 3: Create the repository**

```java
package com.inia.soportedesk.catalogo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TipoBienRepository extends JpaRepository<TipoBien, Long> {

    @Query("SELECT t FROM TipoBien t WHERE LOWER(t.nombre) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<TipoBien> search(@Param("search") String search);
}
```

- [ ] **Step 4: Create the service**

```java
package com.inia.soportedesk.catalogo;

import com.inia.soportedesk.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TipoBienService {

    private final TipoBienRepository repository;

    public List<TipoBien> findAll(String search) {
        if (search == null || search.isBlank()) {
            return repository.findAll();
        }
        return repository.search(search);
    }

    public TipoBien findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tipo de bien no encontrado: " + id));
    }

    public TipoBien create(TipoBienRequest request) {
        TipoBien tipo = new TipoBien();
        tipo.setNombre(request.getNombre());
        return repository.save(tipo);
    }

    public TipoBien update(Long id, TipoBienRequest request) {
        TipoBien tipo = findById(id);
        tipo.setNombre(request.getNombre());
        return repository.save(tipo);
    }

    public void delete(Long id) {
        repository.delete(findById(id));
    }
}
```

- [ ] **Step 5: Create the controller**

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
@RequestMapping("/api/catalogos/tipos-bien")
@RequiredArgsConstructor
public class TipoBienController {

    private final TipoBienService service;

    @GetMapping
    public List<TipoBien> findAll(@RequestParam(required = false) String search) {
        return service.findAll(search);
    }

    @GetMapping("/{id}")
    public TipoBien findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TipoBien> create(@Valid @RequestBody TipoBienRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public TipoBien update(@PathVariable Long id, @Valid @RequestBody TipoBienRequest request) {
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

- [ ] **Step 6: Write the service test**

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
class TipoBienServiceTest {

    @Mock
    private TipoBienRepository repository;

    @InjectMocks
    private TipoBienService service;

    private TipoBien sample() {
        TipoBien tipo = new TipoBien();
        tipo.setId(1L);
        tipo.setNombre("Intangible");
        return tipo;
    }

    @Test
    void findAll_withoutSearch_returnsAll() {
        when(repository.findAll()).thenReturn(List.of(sample()));

        List<TipoBien> result = service.findAll(null);

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
    void create_savesTipoBienFromRequest() {
        TipoBienRequest request = new TipoBienRequest();
        request.setNombre("Intangible");
        when(repository.save(any(TipoBien.class))).thenAnswer(inv -> inv.getArgument(0));

        TipoBien result = service.create(request);

        assertThat(result.getNombre()).isEqualTo("Intangible");
    }
}
```

- [ ] **Step 7: Run the service test**

Run: `cd soportedesk-backend && mvn test -Dtest=TipoBienServiceTest`
Expected: PASS (3 tests)

- [ ] **Step 8: Write the controller integration test**

```java
package com.inia.soportedesk.catalogo;

import com.fasterxml.jackson.databind.ObjectMapper;
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
class TipoBienControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private TipoBienService service;

    private TipoBien sample() {
        TipoBien tipo = new TipoBien();
        tipo.setId(1L);
        tipo.setNombre("Intangible");
        return tipo;
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void findAll_allowsAuthenticatedUser() throws Exception {
        when(service.findAll(null)).thenReturn(List.of(sample()));

        mockMvc.perform(get("/api/catalogos/tipos-bien"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].nombre", is("Intangible")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void create_withAdminRole_returnsCreated() throws Exception {
        TipoBienRequest request = new TipoBienRequest();
        request.setNombre("Intangible");
        when(service.create(any())).thenReturn(sample());

        mockMvc.perform(post("/api/catalogos/tipos-bien")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nombre", is("Intangible")));
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void create_withSoporteRole_returnsForbidden() throws Exception {
        TipoBienRequest request = new TipoBienRequest();
        request.setNombre("Intangible");

        mockMvc.perform(post("/api/catalogos/tipos-bien")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }
}
```

- [ ] **Step 9: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/catalogo/TipoBien*.java soportedesk-backend/src/test/java/com/inia/soportedesk/catalogo/TipoBien*.java
git commit -m "feat: add TipoBien catalog (entity, CRUD, tests)"
```

---

## Task 3: `LicenciaCredentialConverter` (encriptación AES-GCM de `claveActivacion`)

**Files:**
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/licencias/LicenciaCredentialConverter.java`
- Test: `soportedesk-backend/src/test/java/com/inia/soportedesk/licencias/LicenciaCredentialConverterTest.java`
- Modify: `soportedesk-backend/src/main/resources/application.yml`
- Modify: `soportedesk-backend/src/test/resources/application.yml`

**Interfaces:**
- Produces: `LicenciaCredentialConverter` implementing `AttributeConverter<String, String>`, public constructor `LicenciaCredentialConverter(String base64Key)` (Spring injects `${licencia.encryption-key}` via `@Value`, but the test instantiates it directly with a literal key string — no Spring context needed). Task 4 (`Licencia` entity) consumes this class via `@Convert(converter = LicenciaCredentialConverter.class)` on the `claveActivacion` field.
- The AES key used here (`${LICENCIA_ENCRYPTION_KEY}`) was verified to base64-decode to exactly 32 bytes (AES-256-compatible) before writing this plan.

- [ ] **Step 1: Add the encryption key to `application.yml`**

In `soportedesk-backend/src/main/resources/application.yml`, after the `jwt:` block (currently lines 22-24) and before the `uploads:` block, add:

```yaml
licencia:
  encryption-key: ${LICENCIA_ENCRYPTION_KEY:${LICENCIA_ENCRYPTION_KEY}}
```

The file's top section should read:

```yaml
jwt:
  secret: ${JWT_SECRET:c29wb3J0ZWRlc2staW5pYS1zZWNyZXQta2V5LWNoYW5nZS1pbi1wcm9kdWNjaW9uLTEyMzQ1Ng==}
  expiration-ms: 86400000

licencia:
  encryption-key: ${LICENCIA_ENCRYPTION_KEY:${LICENCIA_ENCRYPTION_KEY}}

uploads:
  drivers-dir: uploads/drivers
```

- [ ] **Step 2: Add the encryption key to the test `application.yml`**

In `soportedesk-backend/src/test/resources/application.yml`, after the `jwt:` block, add:

```yaml
licencia:
  encryption-key: ${LICENCIA_ENCRYPTION_KEY}
```

The file's bottom section should read:

```yaml
jwt:
  secret: c29wb3J0ZWRlc2staW5pYS1zZWNyZXQta2V5LWNoYW5nZS1pbi1wcm9kdWNjaW9uLTEyMzQ1Ng==
  expiration-ms: 86400000

licencia:
  encryption-key: ${LICENCIA_ENCRYPTION_KEY}

uploads:
  drivers-dir: build/test-uploads/drivers
```

- [ ] **Step 3: Write the failing converter test**

```java
package com.inia.soportedesk.licencias;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class LicenciaCredentialConverterTest {

    private static final String TEST_KEY = "${LICENCIA_ENCRYPTION_KEY}";

    private final LicenciaCredentialConverter converter = new LicenciaCredentialConverter(TEST_KEY);

    @Test
    void convertToDatabaseColumn_thenConvertToEntityAttribute_roundTrips() {
        String plaintext = "MiClaveSecreta123!";

        String encrypted = converter.convertToDatabaseColumn(plaintext);

        assertThat(encrypted).isNotEqualTo(plaintext);
        assertThat(converter.convertToEntityAttribute(encrypted)).isEqualTo(plaintext);
    }

    @Test
    void convertToDatabaseColumn_withNull_returnsNull() {
        assertThat(converter.convertToDatabaseColumn(null)).isNull();
    }

    @Test
    void convertToDatabaseColumn_withBlank_returnsBlankUnchanged() {
        assertThat(converter.convertToDatabaseColumn("   ")).isEqualTo("   ");
    }

    @Test
    void convertToEntityAttribute_withNull_returnsNull() {
        assertThat(converter.convertToEntityAttribute(null)).isNull();
    }

    @Test
    void convertToDatabaseColumn_producesDifferentCiphertextEachTime() {
        String plaintext = "MismaClave";

        String first = converter.convertToDatabaseColumn(plaintext);
        String second = converter.convertToDatabaseColumn(plaintext);

        assertThat(first).isNotEqualTo(second);
    }
}
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `cd soportedesk-backend && mvn test -Dtest=LicenciaCredentialConverterTest`
Expected: FAIL with compile error "cannot find symbol: class LicenciaCredentialConverter"

- [ ] **Step 5: Implement the converter**

```java
package com.inia.soportedesk.licencias;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

@Converter(autoApply = false)
@Component
public class LicenciaCredentialConverter implements AttributeConverter<String, String> {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int IV_LENGTH_BYTES = 12;
    private static final int TAG_LENGTH_BITS = 128;

    private final SecretKeySpec key;
    private final SecureRandom secureRandom = new SecureRandom();

    public LicenciaCredentialConverter(@Value("${licencia.encryption-key}") String base64Key) {
        byte[] decoded = Base64.getDecoder().decode(base64Key);
        this.key = new SecretKeySpec(decoded, "AES");
    }

    @Override
    public String convertToDatabaseColumn(String attribute) {
        if (attribute == null || attribute.isBlank()) {
            return attribute;
        }
        try {
            byte[] iv = new byte[IV_LENGTH_BYTES];
            secureRandom.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(TAG_LENGTH_BITS, iv));
            byte[] ciphertext = cipher.doFinal(attribute.getBytes(StandardCharsets.UTF_8));

            ByteBuffer buffer = ByteBuffer.allocate(iv.length + ciphertext.length);
            buffer.put(iv);
            buffer.put(ciphertext);

            return Base64.getEncoder().encodeToString(buffer.array());
        } catch (Exception e) {
            throw new IllegalStateException("Error al encriptar clave de activación", e);
        }
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) {
            return dbData;
        }
        try {
            byte[] decoded = Base64.getDecoder().decode(dbData);
            ByteBuffer buffer = ByteBuffer.wrap(decoded);

            byte[] iv = new byte[IV_LENGTH_BYTES];
            buffer.get(iv);
            byte[] ciphertext = new byte[buffer.remaining()];
            buffer.get(ciphertext);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(TAG_LENGTH_BITS, iv));
            byte[] plaintext = cipher.doFinal(ciphertext);

            return new String(plaintext, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new IllegalStateException("Error al desencriptar clave de activación", e);
        }
    }
}
```

`@Component` lets Spring Boot's auto-configured `SpringBeanContainer` (wired into Hibernate automatically since Spring Boot 2.5+) inject `${licencia.encryption-key}` into the converter even though JPA itself instantiates `@Convert`-referenced converters — this is the standard way to get `@Value` into an `AttributeConverter` and matches the spec's requirement to source the key from `application.yml` the same way `jwt.secret` is sourced.

- [ ] **Step 6: Run the test to verify it passes**

Run: `cd soportedesk-backend && mvn test -Dtest=LicenciaCredentialConverterTest`
Expected: PASS (5 tests)

- [ ] **Step 7: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/licencias/LicenciaCredentialConverter.java soportedesk-backend/src/test/java/com/inia/soportedesk/licencias/LicenciaCredentialConverterTest.java soportedesk-backend/src/main/resources/application.yml soportedesk-backend/src/test/resources/application.yml
git commit -m "feat: add AES-GCM converter for licencia claveActivacion encryption"
```

---

## Task 4: `Licencia.java` + `LicenciaRequest.java` (rediseño de entidad y DTO)

**Files:**
- Modify (full rewrite): `soportedesk-backend/src/main/java/com/inia/soportedesk/licencias/Licencia.java`
- Modify (full rewrite): `soportedesk-backend/src/main/java/com/inia/soportedesk/licencias/LicenciaRequest.java`

**Interfaces:**
- Consumes: `TipoLicencia` and `TipoBien` from Task 1/2 (`com.inia.soportedesk.catalogo` package); `LicenciaCredentialConverter` from Task 3.
- Produces: `Licencia` entity with no-arg constructor + getters/setters for: `Long id`, `TipoLicencia tipoLicencia`, `TipoBien tipoBien`, `String descripcion`, `String cuentaActivacion`, `String claveActivacion`, `String serialActivacion`, `String ordenCompra`, `String anio`, `Integer cantidad`. `LicenciaRequest` DTO with fields: `Long tipoLicenciaId`, `Long tipoBienId`, `String descripcion`, `String cuentaActivacion`, `String claveActivacion`, `String serialActivacion`, `String ordenCompra`, `String anio`, `Integer cantidad`. Task 5 (`LicenciaService`/`LicenciaRepository`) and Task 6/7 (tests) consume these exact field names and types.
- Note: `Licencia` no longer has `@AllArgsConstructor` — only `@NoArgsConstructor`, matching the project's established convention of building test fixtures with setters (see Global Constraints) so field reordering doesn't silently break positional-constructor test calls.

- [ ] **Step 1: Rewrite the entity**

Replace the full contents of `soportedesk-backend/src/main/java/com/inia/soportedesk/licencias/Licencia.java`:

```java
package com.inia.soportedesk.licencias;

import com.inia.soportedesk.catalogo.TipoBien;
import com.inia.soportedesk.catalogo.TipoLicencia;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "licencias")
@Getter
@Setter
@NoArgsConstructor
public class Licencia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "tipo_licencia_id", nullable = false)
    private TipoLicencia tipoLicencia;

    @Column(nullable = false, length = 300)
    private String descripcion;

    @Column(name = "cuenta_activacion")
    private String cuentaActivacion;

    @Convert(converter = LicenciaCredentialConverter.class)
    @Column(name = "clave_activacion", length = 1000)
    private String claveActivacion;

    @Column(name = "serial_activacion")
    private String serialActivacion;

    @Column(name = "orden_compra", nullable = false)
    private String ordenCompra;

    @Column(nullable = false)
    private String anio;

    @Column(nullable = false)
    private Integer cantidad;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "tipo_bien_id", nullable = false)
    private TipoBien tipoBien;
}
```

- [ ] **Step 2: Rewrite the request DTO**

Replace the full contents of `soportedesk-backend/src/main/java/com/inia/soportedesk/licencias/LicenciaRequest.java`:

```java
package com.inia.soportedesk.licencias;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LicenciaRequest {

    @NotNull
    private Long tipoLicenciaId;

    @NotNull
    private Long tipoBienId;

    @NotBlank
    @Size(max = 300)
    private String descripcion;

    @Size(max = 200)
    private String cuentaActivacion;

    private String claveActivacion;

    @Size(max = 200)
    private String serialActivacion;

    @NotBlank
    private String ordenCompra;

    @NotBlank
    private String anio;

    @NotNull
    @Min(1)
    private Integer cantidad;
}
```

- [ ] **Step 3: Verify the project compiles**

Run: `cd soportedesk-backend && mvn compile`
Expected: `BUILD SUCCESS` — note `LicenciaService`/`LicenciaRepository` still reference the old fields (`licencia`, `correo`, `clave`) at this point, so this step actually compiles against the **new** `Licencia`/`LicenciaRequest` shapes; if `mvn compile` fails here referencing `licencia.getLicencia()`/`getCorreo()`/`getClave()`, that confirms Task 4 changed the right things — proceed to Task 5 immediately, the codebase is expected to be inconsistent between Task 4 and Task 5.

- [ ] **Step 4: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/licencias/Licencia.java soportedesk-backend/src/main/java/com/inia/soportedesk/licencias/LicenciaRequest.java
git commit -m "feat: redesign Licencia entity and request DTO with tipo/tipoBien FKs and activation fields"
```

---

## Task 5: `LicenciaRepository.java` + `LicenciaService.java` (resolución de FKs y regla cuenta/clave)

**Files:**
- Modify (full rewrite): `soportedesk-backend/src/main/java/com/inia/soportedesk/licencias/LicenciaRepository.java`
- Modify (full rewrite): `soportedesk-backend/src/main/java/com/inia/soportedesk/licencias/LicenciaService.java`

**Interfaces:**
- Consumes: `Licencia`/`LicenciaRequest` from Task 4; `TipoLicenciaRepository`/`TipoBienRepository` from Task 1/2; `ResourceNotFoundException` (existing, `com.inia.soportedesk.exception`, constructor `ResourceNotFoundException(String message)`).
- Produces: `LicenciaService.findAll(String search)`, `findById(Long id)`, `create(LicenciaRequest request)`, `update(Long id, LicenciaRequest request)`, `delete(Long id)` — same signatures as before. Throws `IllegalArgumentException` (mapped to HTTP 409 by the existing `GlobalExceptionHandler`) when `claveActivacion` is non-blank but `cuentaActivacion` is blank. Task 6 (tests) and Task 7 (controller IT) rely on this exact exception type for the cross-field rule.

- [ ] **Step 1: Rewrite the repository**

Replace the full contents of `soportedesk-backend/src/main/java/com/inia/soportedesk/licencias/LicenciaRepository.java`:

```java
package com.inia.soportedesk.licencias;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface LicenciaRepository extends JpaRepository<Licencia, Long> {

    @Query("SELECT l FROM Licencia l WHERE " +
           "LOWER(l.descripcion) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(l.cuentaActivacion) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(l.serialActivacion) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(l.ordenCompra) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(l.anio) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(l.tipoLicencia.nombre) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(l.tipoBien.nombre) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<Licencia> search(@Param("search") String search);
}
```

- [ ] **Step 2: Rewrite the service**

Replace the full contents of `soportedesk-backend/src/main/java/com/inia/soportedesk/licencias/LicenciaService.java`:

```java
package com.inia.soportedesk.licencias;

import com.inia.soportedesk.catalogo.TipoBien;
import com.inia.soportedesk.catalogo.TipoBienRepository;
import com.inia.soportedesk.catalogo.TipoLicencia;
import com.inia.soportedesk.catalogo.TipoLicenciaRepository;
import com.inia.soportedesk.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LicenciaService {

    private final LicenciaRepository repository;
    private final TipoLicenciaRepository tipoLicenciaRepository;
    private final TipoBienRepository tipoBienRepository;

    public List<Licencia> findAll(String search) {
        if (search == null || search.isBlank()) {
            return repository.findAll();
        }
        return repository.search(search);
    }

    public Licencia findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Licencia no encontrada: " + id));
    }

    @Transactional
    public Licencia create(LicenciaRequest request) {
        Licencia licencia = new Licencia();
        copyFields(licencia, request);
        return repository.save(licencia);
    }

    @Transactional
    public Licencia update(Long id, LicenciaRequest request) {
        Licencia licencia = findById(id);
        copyFields(licencia, request);
        return repository.save(licencia);
    }

    public void delete(Long id) {
        repository.delete(findById(id));
    }

    private void copyFields(Licencia licencia, LicenciaRequest request) {
        if (request.getClaveActivacion() != null && !request.getClaveActivacion().isBlank()
                && (request.getCuentaActivacion() == null || request.getCuentaActivacion().isBlank())) {
            throw new IllegalArgumentException(
                    "No se puede registrar una clave de activación sin una cuenta de activación asociada.");
        }

        TipoLicencia tipoLicencia = tipoLicenciaRepository.findById(request.getTipoLicenciaId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Tipo de licencia no encontrado: " + request.getTipoLicenciaId()));
        TipoBien tipoBien = tipoBienRepository.findById(request.getTipoBienId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Tipo de bien no encontrado: " + request.getTipoBienId()));

        licencia.setTipoLicencia(tipoLicencia);
        licencia.setTipoBien(tipoBien);
        licencia.setDescripcion(request.getDescripcion());
        licencia.setCuentaActivacion(request.getCuentaActivacion());
        licencia.setClaveActivacion(request.getClaveActivacion());
        licencia.setSerialActivacion(request.getSerialActivacion());
        licencia.setOrdenCompra(request.getOrdenCompra());
        licencia.setAnio(request.getAnio());
        licencia.setCantidad(request.getCantidad());
    }
}
```

`@Transactional` on `create`/`update` matches the blanket convention already used by `VpnService` (confirmed by reading `VpnService.java`) for every service method that resolves one or more FKs before saving.

- [ ] **Step 3: Verify the project compiles**

Run: `cd soportedesk-backend && mvn compile`
Expected: `BUILD SUCCESS`

- [ ] **Step 4: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/licencias/LicenciaRepository.java soportedesk-backend/src/main/java/com/inia/soportedesk/licencias/LicenciaService.java
git commit -m "feat: resolve tipoLicencia/tipoBien FKs and enforce cuenta/clave activation rule in LicenciaService"
```

---

## Task 6: `LicenciaServiceTest.java` (reescritura)

**Files:**
- Modify (full rewrite): `soportedesk-backend/src/test/java/com/inia/soportedesk/licencias/LicenciaServiceTest.java`

**Interfaces:**
- Consumes: `Licencia`/`LicenciaRequest`/`LicenciaService`/`LicenciaRepository` from Tasks 4-5; `TipoLicenciaRepository`/`TipoBienRepository`/`TipoLicencia`/`TipoBien` from Tasks 1-2.
- Note on encryption round-trip coverage: per the spec, `LicenciaService` always works with plaintext `claveActivacion` — encryption/decryption happens transparently at the JPA column-converter boundary (`LicenciaCredentialConverter`, Task 3), which `LicenciaRepository` is mocked out in this test. The AES-GCM round-trip is therefore exercised by `LicenciaCredentialConverterTest` (Task 3 Step 4), not duplicated here — there is nothing encryption-specific for a mocked-repository service test to assert.

- [ ] **Step 1: Write the failing test**

Replace the full contents of `soportedesk-backend/src/test/java/com/inia/soportedesk/licencias/LicenciaServiceTest.java`:

```java
package com.inia.soportedesk.licencias;

import com.inia.soportedesk.catalogo.TipoBien;
import com.inia.soportedesk.catalogo.TipoBienRepository;
import com.inia.soportedesk.catalogo.TipoLicencia;
import com.inia.soportedesk.catalogo.TipoLicenciaRepository;
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
class LicenciaServiceTest {

    @Mock
    private LicenciaRepository repository;

    @Mock
    private TipoLicenciaRepository tipoLicenciaRepository;

    @Mock
    private TipoBienRepository tipoBienRepository;

    @InjectMocks
    private LicenciaService service;

    private TipoLicencia tipoLicencia() {
        TipoLicencia tipo = new TipoLicencia();
        tipo.setId(1L);
        tipo.setNombre("Ofimática");
        return tipo;
    }

    private TipoBien tipoBien() {
        TipoBien tipo = new TipoBien();
        tipo.setId(1L);
        tipo.setNombre("Intangible");
        return tipo;
    }

    private Licencia existingLicencia() {
        Licencia licencia = new Licencia();
        licencia.setId(1L);
        licencia.setTipoLicencia(tipoLicencia());
        licencia.setTipoBien(tipoBien());
        licencia.setDescripcion("Office 2024 Profesional Home and Business");
        licencia.setCuentaActivacion("j.perez@inia.gob.pe");
        licencia.setClaveActivacion("NKJFR-XXXXX-XXXXX-MNBVC");
        licencia.setOrdenCompra("OC-2024-00123");
        licencia.setAnio("2024");
        licencia.setCantidad(5);
        return licencia;
    }

    private LicenciaRequest sampleRequest() {
        LicenciaRequest request = new LicenciaRequest();
        request.setTipoLicenciaId(1L);
        request.setTipoBienId(1L);
        request.setDescripcion("Office 2024 Profesional Home and Business");
        request.setCuentaActivacion("j.perez@inia.gob.pe");
        request.setClaveActivacion("NKJFR-XXXXX-XXXXX-MNBVC");
        request.setOrdenCompra("OC-2024-00123");
        request.setAnio("2024");
        request.setCantidad(5);
        return request;
    }

    @Test
    void findAll_withoutSearch_returnsAll() {
        when(repository.findAll()).thenReturn(List.of(existingLicencia()));

        List<Licencia> result = service.findAll(null);

        assertThat(result).hasSize(1);
        verify(repository).findAll();
    }

    @Test
    void findAll_withSearch_usesSearchQuery() {
        when(repository.search("office")).thenReturn(List.of(existingLicencia()));

        List<Licencia> result = service.findAll("office");

        assertThat(result).hasSize(1);
        verify(repository).search("office");
    }

    @Test
    void findById_whenNotFound_throwsResourceNotFoundException() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.findById(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void create_savesLicenciaFromRequest() {
        when(tipoLicenciaRepository.findById(1L)).thenReturn(Optional.of(tipoLicencia()));
        when(tipoBienRepository.findById(1L)).thenReturn(Optional.of(tipoBien()));
        when(repository.save(any(Licencia.class))).thenAnswer(inv -> inv.getArgument(0));

        Licencia result = service.create(sampleRequest());

        assertThat(result.getDescripcion()).isEqualTo("Office 2024 Profesional Home and Business");
        assertThat(result.getTipoLicencia().getNombre()).isEqualTo("Ofimática");
        assertThat(result.getTipoBien().getNombre()).isEqualTo("Intangible");
        assertThat(result.getClaveActivacion()).isEqualTo("NKJFR-XXXXX-XXXXX-MNBVC");
    }

    @Test
    void create_withUnknownTipoLicenciaId_throwsResourceNotFoundException() {
        when(tipoLicenciaRepository.findById(99L)).thenReturn(Optional.empty());

        LicenciaRequest request = sampleRequest();
        request.setTipoLicenciaId(99L);

        assertThatThrownBy(() -> service.create(request))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void create_withUnknownTipoBienId_throwsResourceNotFoundException() {
        when(tipoLicenciaRepository.findById(1L)).thenReturn(Optional.of(tipoLicencia()));
        when(tipoBienRepository.findById(99L)).thenReturn(Optional.empty());

        LicenciaRequest request = sampleRequest();
        request.setTipoBienId(99L);

        assertThatThrownBy(() -> service.create(request))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void create_withClaveActivacionButNoCuentaActivacion_throwsIllegalArgumentException() {
        LicenciaRequest request = sampleRequest();
        request.setCuentaActivacion(null);

        assertThatThrownBy(() -> service.create(request))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void create_withoutCuentaOrClaveActivacion_succeeds() {
        when(tipoLicenciaRepository.findById(1L)).thenReturn(Optional.of(tipoLicencia()));
        when(tipoBienRepository.findById(1L)).thenReturn(Optional.of(tipoBien()));
        when(repository.save(any(Licencia.class))).thenAnswer(inv -> inv.getArgument(0));

        LicenciaRequest request = sampleRequest();
        request.setCuentaActivacion(null);
        request.setClaveActivacion(null);

        Licencia result = service.create(request);

        assertThat(result.getCuentaActivacion()).isNull();
        assertThat(result.getClaveActivacion()).isNull();
    }

    @Test
    void update_modifiesExistingLicencia() {
        when(repository.findById(1L)).thenReturn(Optional.of(existingLicencia()));
        when(tipoLicenciaRepository.findById(1L)).thenReturn(Optional.of(tipoLicencia()));
        when(tipoBienRepository.findById(1L)).thenReturn(Optional.of(tipoBien()));
        when(repository.save(any(Licencia.class))).thenAnswer(inv -> inv.getArgument(0));

        LicenciaRequest request = sampleRequest();
        request.setCantidad(10);

        Licencia result = service.update(1L, request);

        assertThat(result.getCantidad()).isEqualTo(10);
    }

    @Test
    void delete_removesExistingLicencia() {
        Licencia existing = existingLicencia();
        when(repository.findById(1L)).thenReturn(Optional.of(existing));

        service.delete(1L);

        verify(repository).delete(existing);
    }
}
```

- [ ] **Step 2: Run the tests**

Run: `cd soportedesk-backend && mvn test -Dtest=LicenciaServiceTest`
Expected: PASS (10 tests)

- [ ] **Step 3: Commit**

```bash
git add soportedesk-backend/src/test/java/com/inia/soportedesk/licencias/LicenciaServiceTest.java
git commit -m "test: rewrite LicenciaServiceTest for FK resolution and cuenta/clave activation rule"
```

---

## Task 7: `LicenciaControllerIT.java` (reescritura)

**Files:**
- Modify (full rewrite): `soportedesk-backend/src/test/java/com/inia/soportedesk/licencias/LicenciaControllerIT.java`

**Interfaces:**
- Consumes: `Licencia`/`LicenciaRequest`/`LicenciaService` from Tasks 4-5; `TipoLicencia`/`TipoBien` from Tasks 1-2.
- Note (per Global Constraints): this test's `ApplicationContext` will fail to load in this environment due to the pre-existing, out-of-scope H2/SQL-Server `schema.sql` incompatibility affecting every `*ControllerIT`. The file must be correct and compilable; runtime PASS is not expected here.

- [ ] **Step 1: Write the failing test**

Replace the full contents of `soportedesk-backend/src/test/java/com/inia/soportedesk/licencias/LicenciaControllerIT.java`:

```java
package com.inia.soportedesk.licencias;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.inia.soportedesk.catalogo.TipoBien;
import com.inia.soportedesk.catalogo.TipoLicencia;
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
class LicenciaControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private LicenciaService service;

    private TipoLicencia tipoLicencia() {
        TipoLicencia tipo = new TipoLicencia();
        tipo.setId(1L);
        tipo.setNombre("Ofimática");
        return tipo;
    }

    private TipoBien tipoBien() {
        TipoBien tipo = new TipoBien();
        tipo.setId(1L);
        tipo.setNombre("Intangible");
        return tipo;
    }

    private Licencia sampleLicencia() {
        Licencia licencia = new Licencia();
        licencia.setId(1L);
        licencia.setTipoLicencia(tipoLicencia());
        licencia.setTipoBien(tipoBien());
        licencia.setDescripcion("Office 2024 Profesional Home and Business");
        licencia.setCuentaActivacion("j.perez@inia.gob.pe");
        licencia.setClaveActivacion("NKJFR-XXXXX-XXXXX-MNBVC");
        licencia.setOrdenCompra("OC-2024-00123");
        licencia.setAnio("2024");
        licencia.setCantidad(5);
        return licencia;
    }

    private LicenciaRequest sampleRequest() {
        LicenciaRequest request = new LicenciaRequest();
        request.setTipoLicenciaId(1L);
        request.setTipoBienId(1L);
        request.setDescripcion("Office 2024 Profesional Home and Business");
        request.setCuentaActivacion("j.perez@inia.gob.pe");
        request.setClaveActivacion("NKJFR-XXXXX-XXXXX-MNBVC");
        request.setOrdenCompra("OC-2024-00123");
        request.setAnio("2024");
        request.setCantidad(5);
        return request;
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void findAll_allowsAuthenticatedUser() throws Exception {
        when(service.findAll(null)).thenReturn(List.of(sampleLicencia()));

        mockMvc.perform(get("/api/licencias"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].descripcion", is("Office 2024 Profesional Home and Business")))
                .andExpect(jsonPath("$[0].tipoLicencia.nombre", is("Ofimática")))
                .andExpect(jsonPath("$[0].tipoBien.nombre", is("Intangible")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void create_withAdminRole_returnsCreated() throws Exception {
        when(service.create(any())).thenReturn(sampleLicencia());

        mockMvc.perform(post("/api/licencias")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.descripcion", is("Office 2024 Profesional Home and Business")));
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void create_withSoporteRole_returnsForbidden() throws Exception {
        mockMvc.perform(post("/api/licencias")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void create_withInvalidRequest_returns400() throws Exception {
        LicenciaRequest request = sampleRequest();
        request.setDescripcion("");

        mockMvc.perform(post("/api/licencias")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void create_withClaveActivacionButNoCuentaActivacion_returns409() throws Exception {
        when(service.create(any())).thenThrow(new IllegalArgumentException(
                "No se puede registrar una clave de activación sin una cuenta de activación asociada."));

        LicenciaRequest request = sampleRequest();
        request.setCuentaActivacion(null);

        mockMvc.perform(post("/api/licencias")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void delete_withAdminRole_returnsNoContent() throws Exception {
        mockMvc.perform(delete("/api/licencias/1"))
                .andExpect(status().isNoContent());
    }
}
```

- [ ] **Step 2: Run the test**

Run: `cd soportedesk-backend && mvn test -Dtest=LicenciaControllerIT`
Expected: Compiles successfully. `ApplicationContext` load FAILS — this is the pre-existing, out-of-scope `*ControllerIT` infra bug (see Global Constraints), not a regression introduced by this task. Confirm the failure is the same generic context-load error seen on every other `*ControllerIT` in this codebase, not a new error specific to this file.

- [ ] **Step 3: Commit**

```bash
git add soportedesk-backend/src/test/java/com/inia/soportedesk/licencias/LicenciaControllerIT.java
git commit -m "test: rewrite LicenciaControllerIT for new fields and cuenta/clave 409 case"
```

---

## Task 8: `schema.sql` (catálogos nuevos + tabla `licencias` reescrita)

**Files:**
- Modify: `soportedesk-backend/src/main/resources/schema.sql`

**Interfaces:**
- Consumes: nothing (raw SQL DDL).
- Produces: `dbo.tipos_licencia`, `dbo.tipos_bien` tables with seed rows; rewritten `dbo.licencias` table. Task 9 (`migrate_licencias_v2.sql`) mirrors this exact DDL for the live database.

- [ ] **Step 1: Insert the `tipos_licencia` and `tipos_bien` table blocks after the existing `tipos_contrato` block**

In `soportedesk-backend/src/main/resources/schema.sql`, the current `tipos_contrato` block (lines 33-40) ends with:

```sql
IF OBJECT_ID(N'dbo.tipos_contrato', N'U') IS NULL
CREATE TABLE dbo.tipos_contrato (
    id     BIGINT        NOT NULL IDENTITY(1,1),
    nombre NVARCHAR(100) NOT NULL,
    CONSTRAINT PK_tipos_contrato        PRIMARY KEY (id),
    CONSTRAINT UQ_tipos_contrato_nombre UNIQUE      (nombre)
);
GO
```

Insert immediately after it (before the `dependencias` block):

```sql
IF OBJECT_ID(N'dbo.tipos_licencia', N'U') IS NULL
CREATE TABLE dbo.tipos_licencia (
    id     BIGINT        NOT NULL IDENTITY(1,1),
    nombre NVARCHAR(100) NOT NULL,
    CONSTRAINT PK_tipos_licencia        PRIMARY KEY (id),
    CONSTRAINT UQ_tipos_licencia_nombre UNIQUE      (nombre)
);
GO

IF NOT EXISTS (SELECT 1 FROM dbo.tipos_licencia WHERE nombre = N'Ofimática')
    INSERT INTO dbo.tipos_licencia (nombre) VALUES (N'Ofimática');
GO
IF NOT EXISTS (SELECT 1 FROM dbo.tipos_licencia WHERE nombre = N'Diseño')
    INSERT INTO dbo.tipos_licencia (nombre) VALUES (N'Diseño');
GO
IF NOT EXISTS (SELECT 1 FROM dbo.tipos_licencia WHERE nombre = N'Edición de Video')
    INSERT INTO dbo.tipos_licencia (nombre) VALUES (N'Edición de Video');
GO
IF NOT EXISTS (SELECT 1 FROM dbo.tipos_licencia WHERE nombre = N'Sistema Operativo')
    INSERT INTO dbo.tipos_licencia (nombre) VALUES (N'Sistema Operativo');
GO
IF NOT EXISTS (SELECT 1 FROM dbo.tipos_licencia WHERE nombre = N'Antivirus')
    INSERT INTO dbo.tipos_licencia (nombre) VALUES (N'Antivirus');
GO
IF NOT EXISTS (SELECT 1 FROM dbo.tipos_licencia WHERE nombre = N'Otro')
    INSERT INTO dbo.tipos_licencia (nombre) VALUES (N'Otro');
GO

IF OBJECT_ID(N'dbo.tipos_bien', N'U') IS NULL
CREATE TABLE dbo.tipos_bien (
    id     BIGINT        NOT NULL IDENTITY(1,1),
    nombre NVARCHAR(100) NOT NULL,
    CONSTRAINT PK_tipos_bien        PRIMARY KEY (id),
    CONSTRAINT UQ_tipos_bien_nombre UNIQUE      (nombre)
);
GO

IF NOT EXISTS (SELECT 1 FROM dbo.tipos_bien WHERE nombre = N'Equipo')
    INSERT INTO dbo.tipos_bien (nombre) VALUES (N'Equipo');
GO
IF NOT EXISTS (SELECT 1 FROM dbo.tipos_bien WHERE nombre = N'Intangible')
    INSERT INTO dbo.tipos_bien (nombre) VALUES (N'Intangible');
GO
IF NOT EXISTS (SELECT 1 FROM dbo.tipos_bien WHERE nombre = N'Servicio')
    INSERT INTO dbo.tipos_bien (nombre) VALUES (N'Servicio');
GO
```

- [ ] **Step 2: Replace the `licencias` table block**

Replace the current block:

```sql
IF OBJECT_ID(N'dbo.licencias', N'U') IS NULL
CREATE TABLE dbo.licencias (
    id           BIGINT        NOT NULL IDENTITY(1,1),
    cantidad     INT           NOT NULL,
    licencia     NVARCHAR(200) NOT NULL,
    correo       NVARCHAR(200) NOT NULL,
    clave        NVARCHAR(500) NOT NULL,
    orden_compra NVARCHAR(100) NOT NULL,
    anio         CHAR(4)       NOT NULL,
    CONSTRAINT PK_licencias           PRIMARY KEY (id),
    CONSTRAINT CHK_licencias_cantidad CHECK (cantidad > 0),
    CONSTRAINT CHK_licencias_anio     CHECK (anio LIKE '[0-9][0-9][0-9][0-9]')
);
GO
```

with:

```sql
IF OBJECT_ID(N'dbo.licencias', N'U') IS NULL
CREATE TABLE dbo.licencias (
    id                 BIGINT         NOT NULL IDENTITY(1,1),
    tipo_licencia_id   BIGINT         NOT NULL,
    descripcion        NVARCHAR(300)  NOT NULL,
    cuenta_activacion  NVARCHAR(200)  NULL,
    clave_activacion   NVARCHAR(1000) NULL,
    serial_activacion  NVARCHAR(200)  NULL,
    orden_compra       NVARCHAR(100)  NOT NULL,
    anio               CHAR(4)        NOT NULL,
    cantidad           INT            NOT NULL,
    tipo_bien_id       BIGINT         NOT NULL,
    CONSTRAINT PK_licencias              PRIMARY KEY (id),
    CONSTRAINT CHK_licencias_cantidad    CHECK (cantidad > 0),
    CONSTRAINT CHK_licencias_anio        CHECK (anio LIKE '[0-9][0-9][0-9][0-9]'),
    CONSTRAINT FK_licencias_tipo_licencia FOREIGN KEY (tipo_licencia_id) REFERENCES dbo.tipos_licencia (id) ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT FK_licencias_tipo_bien     FOREIGN KEY (tipo_bien_id)     REFERENCES dbo.tipos_bien (id)     ON UPDATE NO ACTION ON DELETE NO ACTION
);
GO
```

- [ ] **Step 3: Replace the `licencias` index block**

Replace the current block:

```sql
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_licencias_licencia') CREATE INDEX IX_licencias_licencia ON dbo.licencias (licencia);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_licencias_anio')     CREATE INDEX IX_licencias_anio     ON dbo.licencias (anio);
GO
```

with:

```sql
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_licencias_descripcion')      CREATE INDEX IX_licencias_descripcion      ON dbo.licencias (descripcion);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_licencias_anio')              CREATE INDEX IX_licencias_anio              ON dbo.licencias (anio);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_licencias_tipo_licencia_id')  CREATE INDEX IX_licencias_tipo_licencia_id  ON dbo.licencias (tipo_licencia_id);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_licencias_tipo_bien_id')      CREATE INDEX IX_licencias_tipo_bien_id      ON dbo.licencias (tipo_bien_id);
GO
```

- [ ] **Step 4: Commit**

```bash
git add soportedesk-backend/src/main/resources/schema.sql
git commit -m "feat: add tipos_licencia/tipos_bien catalogs and redesign licencias table in schema.sql"
```

---

## Task 9: `migrate_licencias_v2.sql` (script manual para la BD real)

**Files:**
- Create: `soportedesk-backend/src/main/resources/migrate_licencias_v2.sql`

**Interfaces:**
- Consumes: nothing (standalone SQL script, executed manually via SSMS against `172.16.26.16`, base `ssti` — same operational pattern as the existing `fix_usuarios_red_columns.sql`).
- Produces: same final schema as Task 8's `schema.sql` edits, applied to the live database. This script is NOT auto-run (`spring.sql.init.mode: never`).

- [ ] **Step 1: Write the migration script**

Create `soportedesk-backend/src/main/resources/migrate_licencias_v2.sql`:

```sql
-- =============================================================
-- Migración: Rediseño del módulo Licencias
-- Ejecutar manualmente en SSMS contra el servidor 172.16.26.16, base ssti
-- Los datos actuales en dbo.licencias son descartables (confirmado) —
-- este script hace DROP de la tabla y la recrea con la estructura final.
-- =============================================================

USE ssti;
GO

-- ============================================================
-- 1. Catálogos nuevos: tipos_licencia, tipos_bien
-- ============================================================

IF OBJECT_ID(N'dbo.tipos_licencia', N'U') IS NULL
CREATE TABLE dbo.tipos_licencia (
    id     BIGINT        NOT NULL IDENTITY(1,1),
    nombre NVARCHAR(100) NOT NULL,
    CONSTRAINT PK_tipos_licencia        PRIMARY KEY (id),
    CONSTRAINT UQ_tipos_licencia_nombre UNIQUE      (nombre)
);
GO

IF NOT EXISTS (SELECT 1 FROM dbo.tipos_licencia WHERE nombre = N'Ofimática')
    INSERT INTO dbo.tipos_licencia (nombre) VALUES (N'Ofimática');
GO
IF NOT EXISTS (SELECT 1 FROM dbo.tipos_licencia WHERE nombre = N'Diseño')
    INSERT INTO dbo.tipos_licencia (nombre) VALUES (N'Diseño');
GO
IF NOT EXISTS (SELECT 1 FROM dbo.tipos_licencia WHERE nombre = N'Edición de Video')
    INSERT INTO dbo.tipos_licencia (nombre) VALUES (N'Edición de Video');
GO
IF NOT EXISTS (SELECT 1 FROM dbo.tipos_licencia WHERE nombre = N'Sistema Operativo')
    INSERT INTO dbo.tipos_licencia (nombre) VALUES (N'Sistema Operativo');
GO
IF NOT EXISTS (SELECT 1 FROM dbo.tipos_licencia WHERE nombre = N'Antivirus')
    INSERT INTO dbo.tipos_licencia (nombre) VALUES (N'Antivirus');
GO
IF NOT EXISTS (SELECT 1 FROM dbo.tipos_licencia WHERE nombre = N'Otro')
    INSERT INTO dbo.tipos_licencia (nombre) VALUES (N'Otro');
GO

IF OBJECT_ID(N'dbo.tipos_bien', N'U') IS NULL
CREATE TABLE dbo.tipos_bien (
    id     BIGINT        NOT NULL IDENTITY(1,1),
    nombre NVARCHAR(100) NOT NULL,
    CONSTRAINT PK_tipos_bien        PRIMARY KEY (id),
    CONSTRAINT UQ_tipos_bien_nombre UNIQUE      (nombre)
);
GO

IF NOT EXISTS (SELECT 1 FROM dbo.tipos_bien WHERE nombre = N'Equipo')
    INSERT INTO dbo.tipos_bien (nombre) VALUES (N'Equipo');
GO
IF NOT EXISTS (SELECT 1 FROM dbo.tipos_bien WHERE nombre = N'Intangible')
    INSERT INTO dbo.tipos_bien (nombre) VALUES (N'Intangible');
GO
IF NOT EXISTS (SELECT 1 FROM dbo.tipos_bien WHERE nombre = N'Servicio')
    INSERT INTO dbo.tipos_bien (nombre) VALUES (N'Servicio');
GO

-- ============================================================
-- 2. Tabla licencias: drop-and-recreate (datos descartables)
-- ============================================================

IF OBJECT_ID(N'dbo.licencias', N'U') IS NOT NULL
    DROP TABLE dbo.licencias;
GO

CREATE TABLE dbo.licencias (
    id                 BIGINT         NOT NULL IDENTITY(1,1),
    tipo_licencia_id   BIGINT         NOT NULL,
    descripcion        NVARCHAR(300)  NOT NULL,
    cuenta_activacion  NVARCHAR(200)  NULL,
    clave_activacion   NVARCHAR(1000) NULL,
    serial_activacion  NVARCHAR(200)  NULL,
    orden_compra       NVARCHAR(100)  NOT NULL,
    anio               CHAR(4)        NOT NULL,
    cantidad           INT            NOT NULL,
    tipo_bien_id       BIGINT         NOT NULL,
    CONSTRAINT PK_licencias              PRIMARY KEY (id),
    CONSTRAINT CHK_licencias_cantidad    CHECK (cantidad > 0),
    CONSTRAINT CHK_licencias_anio        CHECK (anio LIKE '[0-9][0-9][0-9][0-9]'),
    CONSTRAINT FK_licencias_tipo_licencia FOREIGN KEY (tipo_licencia_id) REFERENCES dbo.tipos_licencia (id) ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT FK_licencias_tipo_bien     FOREIGN KEY (tipo_bien_id)     REFERENCES dbo.tipos_bien (id)     ON UPDATE NO ACTION ON DELETE NO ACTION
);
GO

CREATE INDEX IX_licencias_descripcion      ON dbo.licencias (descripcion);
GO
CREATE INDEX IX_licencias_anio              ON dbo.licencias (anio);
GO
CREATE INDEX IX_licencias_tipo_licencia_id  ON dbo.licencias (tipo_licencia_id);
GO
CREATE INDEX IX_licencias_tipo_bien_id      ON dbo.licencias (tipo_bien_id);
GO

-- ============================================================
-- 3. Verificación
-- ============================================================

SELECT * FROM dbo.tipos_licencia;
SELECT * FROM dbo.tipos_bien;
SELECT * FROM dbo.licencias;
GO
```

- [ ] **Step 2: Commit**

```bash
git add soportedesk-backend/src/main/resources/migrate_licencias_v2.sql
git commit -m "feat: add manual migration script for licencias module redesign"
```

---

## Task 10: Frontend `catalogo.model.ts` + `catalogo.service.ts` (TipoLicencia/TipoBien)

**Files:**
- Modify: `soportedesk-frontend/src/app/core/models/catalogo.model.ts`
- Modify: `soportedesk-frontend/src/app/core/catalogos/catalogo.service.ts`

**Interfaces:**
- Produces: `TipoLicencia { id: number; nombre: string }`, `TipoBien { id: number; nombre: string }` interfaces; `CatalogoService.getTiposLicencia()/createTipoLicencia()/updateTipoLicencia()/deleteTipoLicencia()` and the equivalent 4 methods for `TipoBien`. Task 11 (`licencia.model.ts`), Task 12 (`licencia-form.component.ts`), and Task 14 (`catalogos.component.ts`) all import these.

- [ ] **Step 1: Add the two interfaces**

In `soportedesk-frontend/src/app/core/models/catalogo.model.ts`, the file currently ends with:

```typescript
export interface TipoContrato {
  id: number;
  nombre: string;
}
```

Add immediately after it:

```typescript
export interface TipoLicencia {
  id: number;
  nombre: string;
}

export interface TipoBien {
  id: number;
  nombre: string;
}
```

- [ ] **Step 2: Add the 8 service methods**

In `soportedesk-frontend/src/app/core/catalogos/catalogo.service.ts`, update the import block:

```typescript
import {
  CatalogoRequest,
  Dependencia,
  DependenciaRequest,
  Sede,
  Subdependencia,
  SubdependenciaRequest,
  TipoBien,
  TipoContrato,
  TipoLicencia,
} from '../models/catalogo.model';
```

Then, the file currently ends with:

```typescript
  deleteTipoContrato(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/tipos-contrato/${id}`);
  }
}
```

Replace it with:

```typescript
  deleteTipoContrato(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/tipos-contrato/${id}`);
  }

  getTiposLicencia(): Observable<TipoLicencia[]> {
    return this.http.get<TipoLicencia[]>(`${this.apiUrl}/tipos-licencia`);
  }

  createTipoLicencia(request: CatalogoRequest): Observable<TipoLicencia> {
    return this.http.post<TipoLicencia>(`${this.apiUrl}/tipos-licencia`, request);
  }

  updateTipoLicencia(id: number, request: CatalogoRequest): Observable<TipoLicencia> {
    return this.http.put<TipoLicencia>(`${this.apiUrl}/tipos-licencia/${id}`, request);
  }

  deleteTipoLicencia(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/tipos-licencia/${id}`);
  }

  getTiposBien(): Observable<TipoBien[]> {
    return this.http.get<TipoBien[]>(`${this.apiUrl}/tipos-bien`);
  }

  createTipoBien(request: CatalogoRequest): Observable<TipoBien> {
    return this.http.post<TipoBien>(`${this.apiUrl}/tipos-bien`, request);
  }

  updateTipoBien(id: number, request: CatalogoRequest): Observable<TipoBien> {
    return this.http.put<TipoBien>(`${this.apiUrl}/tipos-bien/${id}`, request);
  }

  deleteTipoBien(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/tipos-bien/${id}`);
  }
}
```

- [ ] **Step 3: Verify the project builds**

Run: `cd soportedesk-frontend && npx ng build`
Expected: builds successfully (the new methods are unused until Task 11/12 land, which is fine — TypeScript does not error on unused exported class methods).

- [ ] **Step 4: Commit**

```bash
git add soportedesk-frontend/src/app/core/models/catalogo.model.ts soportedesk-frontend/src/app/core/catalogos/catalogo.service.ts
git commit -m "feat: add TipoLicencia/TipoBien models and CatalogoService methods"
```

---

## Task 11: Frontend `licencia.model.ts` (rediseño)

**Files:**
- Modify (full rewrite): `soportedesk-frontend/src/app/features/licencias/licencia.model.ts`

**Interfaces:**
- Consumes: `TipoLicencia`/`TipoBien` from Task 10.
- Produces: `Licencia`/`LicenciaRequest` interfaces. Task 12 (`licencia-form.component.ts`) and Task 13 (`licencias-list.component.ts`/`.html`) both depend on these exact shapes.

- [ ] **Step 1: Rewrite the model**

Replace the full contents of `soportedesk-frontend/src/app/features/licencias/licencia.model.ts`:

```typescript
import { TipoBien, TipoLicencia } from '../../core/models/catalogo.model';

export interface Licencia {
  id: number;
  tipoLicencia: TipoLicencia;
  tipoBien: TipoBien;
  descripcion: string;
  cuentaActivacion?: string;
  claveActivacion?: string;
  serialActivacion?: string;
  ordenCompra: string;
  anio: string;
  cantidad: number;
}

export interface LicenciaRequest {
  tipoLicenciaId: number;
  tipoBienId: number;
  descripcion: string;
  cuentaActivacion?: string;
  claveActivacion?: string;
  serialActivacion?: string;
  ordenCompra: string;
  anio: string;
  cantidad: number;
}
```

`LicenciaRequest` is no longer `Omit<Licencia, 'id'>` — it diverges from `Licencia` (FK ids instead of nested objects), same relationship as `UsuarioRedRequest` to `UsuarioRed`. `licencia.service.ts` needs no changes — its methods are already generically typed against `Licencia`/`LicenciaRequest`.

- [ ] **Step 2: Verify the project compiles**

Run: `cd soportedesk-frontend && npx tsc --noEmit -p tsconfig.app.json`
Expected: New errors in `licencia-form.component.ts` and `licencias-list.component.ts`/`.html` (still referencing old fields `cantidad`/`licencia`/`correo`/`clave` directly via `formControlName`/interpolation) — **expected and resolved by Tasks 12-13**, not a regression to fix here.

- [ ] **Step 3: Commit**

```bash
git add soportedesk-frontend/src/app/features/licencias/licencia.model.ts
git commit -m "feat: redesign Licencia/LicenciaRequest frontend models with tipo/tipoBien FKs"
```

---

## Task 12: Frontend `licencia-form.component.ts` + `.html` (rediseño)

**Files:**
- Modify (full rewrite): `soportedesk-frontend/src/app/features/licencias/licencia-form.component.ts`
- Modify (full rewrite): `soportedesk-frontend/src/app/features/licencias/licencia-form.component.html`

**Interfaces:**
- Consumes: `Licencia`/`LicenciaRequest` from Task 11; `TipoLicencia`/`TipoBien` and `CatalogoService.getTiposLicencia()/getTiposBien()` from Task 10.
- Produces: `tipoLicenciaId`/`tipoBienId: number | null` class properties + `onTipoLicenciaChange(value: string)`/`onTipoBienChange(value: string)` handlers — same externalized-FK pattern as `EquipoFormComponent.usuarioRedId`/`onUsuarioChange` (confirmed in `equipo-form.component.ts`). `claveActivacion` reactive control is enabled/disabled based on whether `cuentaActivacion` has a value, via a `syncClaveActivacionState()` method called from both `ngOnInit` and `ngOnChanges` — `ngOnChanges` fires before `ngOnInit` on first init when an `@Input` is already bound, so both call sites are needed to cover the "open form in edit mode" and "open form in create mode" cases correctly on the very first render.

- [ ] **Step 1: Rewrite the component class**

Replace the full contents of `soportedesk-frontend/src/app/features/licencias/licencia-form.component.ts`:

```typescript
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Licencia, LicenciaRequest } from './licencia.model';
import { LicenciaService } from './licencia.service';
import { CatalogoService } from '../../core/catalogos/catalogo.service';
import { TipoBien, TipoLicencia } from '../../core/models/catalogo.model';

@Component({
  selector: 'app-licencia-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './licencia-form.component.html',
  styleUrl: './licencia-form.component.scss',
})
export class LicenciaFormComponent implements OnInit, OnChanges {
  private fb = inject(FormBuilder);
  private service = inject(LicenciaService);
  private catalogoService = inject(CatalogoService);

  @Input() licencia: Licencia | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  tiposLicencia: TipoLicencia[] = [];
  tiposBien: TipoBien[] = [];
  tipoLicenciaId: number | null = null;
  tipoBienId: number | null = null;

  form = this.fb.nonNullable.group({
    descripcion: ['', Validators.required],
    cuentaActivacion: [''],
    claveActivacion: [''],
    serialActivacion: [''],
    ordenCompra: ['', Validators.required],
    anio: ['', Validators.required],
    cantidad: [1, [Validators.required, Validators.min(1)]],
  });

  ngOnInit(): void {
    this.catalogoService.getTiposLicencia().subscribe((data) => (this.tiposLicencia = data));
    this.catalogoService.getTiposBien().subscribe((data) => (this.tiposBien = data));
    this.form.controls.cuentaActivacion.valueChanges.subscribe(() => this.syncClaveActivacionState());
    this.syncClaveActivacionState();
  }

  ngOnChanges(): void {
    if (this.licencia) {
      this.tipoLicenciaId = this.licencia.tipoLicencia?.id ?? null;
      this.tipoBienId = this.licencia.tipoBien?.id ?? null;
      this.form.patchValue({
        descripcion: this.licencia.descripcion,
        cuentaActivacion: this.licencia.cuentaActivacion ?? '',
        claveActivacion: this.licencia.claveActivacion ?? '',
        serialActivacion: this.licencia.serialActivacion ?? '',
        ordenCompra: this.licencia.ordenCompra,
        anio: this.licencia.anio,
        cantidad: this.licencia.cantidad,
      });
    } else {
      this.tipoLicenciaId = null;
      this.tipoBienId = null;
      this.form.reset({
        descripcion: '',
        cuentaActivacion: '',
        claveActivacion: '',
        serialActivacion: '',
        ordenCompra: '',
        anio: '',
        cantidad: 1,
      });
    }
    this.syncClaveActivacionState();
  }

  onTipoLicenciaChange(value: string): void {
    this.tipoLicenciaId = value ? Number(value) : null;
  }

  onTipoBienChange(value: string): void {
    this.tipoBienId = value ? Number(value) : null;
  }

  private syncClaveActivacionState(): void {
    const cuenta = this.form.controls.cuentaActivacion.value;
    if (cuenta && cuenta.trim()) {
      this.form.controls.claveActivacion.enable({ emitEvent: false });
    } else {
      this.form.controls.claveActivacion.setValue('', { emitEvent: false });
      this.form.controls.claveActivacion.disable({ emitEvent: false });
    }
  }

  submit(): void {
    if (this.form.invalid || !this.tipoLicenciaId || !this.tipoBienId) {
      return;
    }
    const raw = this.form.getRawValue();
    const request: LicenciaRequest = {
      tipoLicenciaId: this.tipoLicenciaId,
      tipoBienId: this.tipoBienId,
      descripcion: raw.descripcion,
      cuentaActivacion: raw.cuentaActivacion || undefined,
      claveActivacion: raw.claveActivacion || undefined,
      serialActivacion: raw.serialActivacion || undefined,
      ordenCompra: raw.ordenCompra,
      anio: raw.anio,
      cantidad: raw.cantidad,
    };
    const obs = this.licencia
      ? this.service.update(this.licencia.id, request)
      : this.service.create(request);
    obs.subscribe(() => this.saved.emit());
  }
}
```

`form.getRawValue()` is required (not `form.value`) because `claveActivacion` may be disabled — `.value` omits disabled controls, `.getRawValue()` includes them, same reasoning already applied in `EquipoFormComponent.submit()`.

- [ ] **Step 2: Rewrite the template**

Replace the full contents of `soportedesk-frontend/src/app/features/licencias/licencia-form.component.html`:

```html
<form [formGroup]="form" (ngSubmit)="submit()">
  <div class="field">
    <label>Tipo de Licencia</label>
    <select [value]="tipoLicenciaId" (change)="onTipoLicenciaChange($any($event.target).value)">
      <option [ngValue]="null">Seleccione...</option>
      <option *ngFor="let t of tiposLicencia" [value]="t.id">{{ t.nombre }}</option>
    </select>
  </div>
  <div class="field">
    <label>Tipo de Bien</label>
    <select [value]="tipoBienId" (change)="onTipoBienChange($any($event.target).value)">
      <option [ngValue]="null">Seleccione...</option>
      <option *ngFor="let t of tiposBien" [value]="t.id">{{ t.nombre }}</option>
    </select>
  </div>
  <div class="field">
    <label>Descripción</label>
    <input type="text" formControlName="descripcion" />
  </div>
  <div class="field">
    <label>Cuenta de Activación</label>
    <input type="text" formControlName="cuentaActivacion" />
  </div>
  <div class="field">
    <label>Clave de Activación</label>
    <input type="text" formControlName="claveActivacion" />
    <small *ngIf="form.controls.claveActivacion.disabled">
      Ingrese una cuenta de activación para habilitar este campo.
    </small>
  </div>
  <div class="field">
    <label>Serial de Activación</label>
    <input type="text" formControlName="serialActivacion" />
  </div>
  <div class="field">
    <label>Orden de Compra</label>
    <input type="text" formControlName="ordenCompra" />
  </div>
  <div class="field">
    <label>Año</label>
    <input type="text" formControlName="anio" />
  </div>
  <div class="field">
    <label>Cantidad</label>
    <input type="number" formControlName="cantidad" min="1" />
  </div>
  <div class="actions">
    <button type="button" class="secondary" (click)="cancelled.emit()">Cancelar</button>
    <button type="submit" [disabled]="form.invalid || !tipoLicenciaId || !tipoBienId">Guardar</button>
  </div>
</form>
```

- [ ] **Step 3: Verify the project compiles**

Run: `cd soportedesk-frontend && npx tsc --noEmit -p tsconfig.app.json`
Expected: no errors referencing `licencia-form.component.ts`. Remaining errors (if any) should only be in `licencias-list.component.ts`/`.html`, resolved by Task 13.

- [ ] **Step 4: Commit**

```bash
git add soportedesk-frontend/src/app/features/licencias/licencia-form.component.ts soportedesk-frontend/src/app/features/licencias/licencia-form.component.html
git commit -m "feat: redesign licencia form with catalog selects and conditional clave de activacion"
```

---

## Task 13: Frontend `licencias-list.component.ts` + `.html` (columnas reducidas, detalle ampliado)

**Files:**
- Modify: `soportedesk-frontend/src/app/features/licencias/licencias-list.component.ts`
- Modify: `soportedesk-frontend/src/app/features/licencias/licencias-list.component.html`

**Interfaces:**
- Consumes: `Licencia` from Task 11.

- [ ] **Step 1: Update the columns array and delete-confirmation message**

In `soportedesk-frontend/src/app/features/licencias/licencias-list.component.ts`, replace:

```typescript
  licencias: Licencia[] = [];
  columns: TableColumn[] = [
    { key: 'cantidad', label: 'Cantidad' },
    { key: 'licencia', label: 'Licencia' },
    { key: 'correo', label: 'Correo' },
    { key: 'clave', label: 'Clave' },
    { key: 'ordenCompra', label: 'Orden de Compra' },
    { key: 'anio', label: 'Año' },
  ];
```

with:

```typescript
  licencias: Licencia[] = [];
  columns: TableColumn[] = [
    { key: 'tipoLicencia.nombre', label: 'Tipo' },
    { key: 'descripcion', label: 'Licencia' },
    { key: 'ordenCompra', label: 'Orden de Compra' },
    { key: 'anio', label: 'Año' },
  ];
```

And replace:

```typescript
  onDelete(licencia: Licencia): void {
    if (!confirm(`¿Eliminar la licencia "${licencia.licencia}"?`)) {
      return;
    }
    this.service.delete(licencia.id).subscribe(() => this.load());
  }
```

with:

```typescript
  onDelete(licencia: Licencia): void {
    if (!confirm(`¿Eliminar la licencia "${licencia.descripcion}"?`)) {
      return;
    }
    this.service.delete(licencia.id).subscribe(() => this.load());
  }
```

- [ ] **Step 2: Update the detail modal**

In `soportedesk-frontend/src/app/features/licencias/licencias-list.component.html`, replace the `app-modal title="Detalle de licencia"` block:

```html
<app-modal title="Detalle de licencia" [open]="viewing !== null" (closed)="closeView()">
  <ng-container *ngIf="viewing">
    <app-field label="Cantidad">{{ viewing.cantidad }}</app-field>
    <app-field label="Licencia">{{ viewing.licencia }}</app-field>
    <app-field label="Correo">{{ viewing.correo }}</app-field>
    <app-field label="Clave">{{ viewing.clave }}</app-field>
    <app-field label="Orden de Compra">{{ viewing.ordenCompra }}</app-field>
    <app-field label="Año">{{ viewing.anio }}</app-field>
  </ng-container>
</app-modal>
```

with:

```html
<app-modal title="Detalle de licencia" [open]="viewing !== null" (closed)="closeView()">
  <ng-container *ngIf="viewing">
    <app-field label="Tipo de Licencia">{{ viewing.tipoLicencia?.nombre || '—' }}</app-field>
    <app-field label="Tipo de Bien">{{ viewing.tipoBien?.nombre || '—' }}</app-field>
    <app-field label="Descripción">{{ viewing.descripcion }}</app-field>
    <app-field label="Cuenta de Activación">{{ viewing.cuentaActivacion || '—' }}</app-field>
    <app-field label="Clave de Activación">{{ viewing.claveActivacion || '—' }}</app-field>
    <app-field label="Serial de Activación">{{ viewing.serialActivacion || '—' }}</app-field>
    <app-field label="Orden de Compra">{{ viewing.ordenCompra }}</app-field>
    <app-field label="Año">{{ viewing.anio }}</app-field>
    <app-field label="Cantidad">{{ viewing.cantidad }}</app-field>
  </ng-container>
</app-modal>
```

- [ ] **Step 3: Verify the project compiles**

Run: `cd soportedesk-frontend && npx tsc --noEmit -p tsconfig.app.json`
Expected: `BUILD SUCCESS`, no remaining errors anywhere in the `licencias` feature.

- [ ] **Step 4: Commit**

```bash
git add soportedesk-frontend/src/app/features/licencias/licencias-list.component.ts soportedesk-frontend/src/app/features/licencias/licencias-list.component.html
git commit -m "feat: reduce licencias list columns and expand detail modal with new fields"
```

---

## Task 14: Frontend `catalogos.component.ts` + `.html` + `.spec.ts` (dos tabs nuevas)

**Files:**
- Modify: `soportedesk-frontend/src/app/features/catalogos/catalogos.component.ts`
- Modify: `soportedesk-frontend/src/app/features/catalogos/catalogos.component.html`
- Modify: `soportedesk-frontend/src/app/features/catalogos/catalogos.component.spec.ts`

**Interfaces:**
- Consumes: `TipoLicencia`/`TipoBien` and the 8 `CatalogoService` methods from Task 10.

- [ ] **Step 1: Update imports and the `CatalogoTab` type**

In `soportedesk-frontend/src/app/features/catalogos/catalogos.component.ts`, replace:

```typescript
import {
  Dependencia,
  Sede,
  Subdependencia,
  TipoContrato,
} from '../../core/models/catalogo.model';

type CatalogoTab = 'sedes' | 'dependencias' | 'subdependencias' | 'tiposContrato';
```

with:

```typescript
import {
  Dependencia,
  Sede,
  Subdependencia,
  TipoBien,
  TipoContrato,
  TipoLicencia,
} from '../../core/models/catalogo.model';

type CatalogoTab =
  | 'sedes'
  | 'dependencias'
  | 'subdependencias'
  | 'tiposContrato'
  | 'tiposLicencia'
  | 'tiposBien';
```

- [ ] **Step 2: Add the two new data arrays**

Replace:

```typescript
  sedes: Sede[] = [];
  dependencias: Dependencia[] = [];
  subdependencias: Subdependencia[] = [];
  tiposContrato: TipoContrato[] = [];
```

with:

```typescript
  sedes: Sede[] = [];
  dependencias: Dependencia[] = [];
  subdependencias: Subdependencia[] = [];
  tiposContrato: TipoContrato[] = [];
  tiposLicencia: TipoLicencia[] = [];
  tiposBien: TipoBien[] = [];
```

- [ ] **Step 3: Extend `loadAll()`**

Replace:

```typescript
  loadAll(): void {
    this.service.getSedes().subscribe((data) => (this.sedes = data));
    this.service.getDependencias().subscribe((data) => (this.dependencias = data));
    this.service.getSubdependencias().subscribe((data) => (this.subdependencias = data));
    this.service.getTiposContrato().subscribe((data) => (this.tiposContrato = data));
  }
```

with:

```typescript
  loadAll(): void {
    this.service.getSedes().subscribe((data) => (this.sedes = data));
    this.service.getDependencias().subscribe((data) => (this.dependencias = data));
    this.service.getSubdependencias().subscribe((data) => (this.subdependencias = data));
    this.service.getTiposContrato().subscribe((data) => (this.tiposContrato = data));
    this.service.getTiposLicencia().subscribe((data) => (this.tiposLicencia = data));
    this.service.getTiposBien().subscribe((data) => (this.tiposBien = data));
  }
```

- [ ] **Step 4: Extend `submitSimple()`**

Replace:

```typescript
    } else if (this.activeTab === 'tiposContrato') {
      obs = this.editingId
        ? this.service.updateTipoContrato(this.editingId, { nombre: this.nombreForm })
        : this.service.createTipoContrato({ nombre: this.nombreForm });
    } else if (this.activeTab === 'dependencias') {
```

with:

```typescript
    } else if (this.activeTab === 'tiposContrato') {
      obs = this.editingId
        ? this.service.updateTipoContrato(this.editingId, { nombre: this.nombreForm })
        : this.service.createTipoContrato({ nombre: this.nombreForm });
    } else if (this.activeTab === 'tiposLicencia') {
      obs = this.editingId
        ? this.service.updateTipoLicencia(this.editingId, { nombre: this.nombreForm })
        : this.service.createTipoLicencia({ nombre: this.nombreForm });
    } else if (this.activeTab === 'tiposBien') {
      obs = this.editingId
        ? this.service.updateTipoBien(this.editingId, { nombre: this.nombreForm })
        : this.service.createTipoBien({ nombre: this.nombreForm });
    } else if (this.activeTab === 'dependencias') {
```

- [ ] **Step 5: Extend `deleteItem()`**

Replace:

```typescript
  deleteItem(tab: CatalogoTab, id: number): void {
    let obs;
    if (tab === 'sedes') {
      obs = this.service.deleteSede(id);
    } else if (tab === 'dependencias') {
      obs = this.service.deleteDependencia(id);
    } else if (tab === 'subdependencias') {
      obs = this.service.deleteSubdependencia(id);
    } else {
      obs = this.service.deleteTipoContrato(id);
    }
    obs.subscribe(() => this.loadAll());
  }
```

with:

```typescript
  deleteItem(tab: CatalogoTab, id: number): void {
    let obs;
    if (tab === 'sedes') {
      obs = this.service.deleteSede(id);
    } else if (tab === 'dependencias') {
      obs = this.service.deleteDependencia(id);
    } else if (tab === 'subdependencias') {
      obs = this.service.deleteSubdependencia(id);
    } else if (tab === 'tiposContrato') {
      obs = this.service.deleteTipoContrato(id);
    } else if (tab === 'tiposLicencia') {
      obs = this.service.deleteTipoLicencia(id);
    } else {
      obs = this.service.deleteTipoBien(id);
    }
    obs.subscribe(() => this.loadAll());
  }
```

- [ ] **Step 6: Add the two tab buttons**

In `soportedesk-frontend/src/app/features/catalogos/catalogos.component.html`, replace:

```html
<div class="tabs">
  <button [class.active]="activeTab === 'sedes'" (click)="setTab('sedes')">Sedes</button>
  <button [class.active]="activeTab === 'dependencias'" (click)="setTab('dependencias')">Dependencias</button>
  <button [class.active]="activeTab === 'subdependencias'" (click)="setTab('subdependencias')">Subdependencias</button>
  <button [class.active]="activeTab === 'tiposContrato'" (click)="setTab('tiposContrato')">Tipos de Contrato</button>
</div>
```

with:

```html
<div class="tabs">
  <button [class.active]="activeTab === 'sedes'" (click)="setTab('sedes')">Sedes</button>
  <button [class.active]="activeTab === 'dependencias'" (click)="setTab('dependencias')">Dependencias</button>
  <button [class.active]="activeTab === 'subdependencias'" (click)="setTab('subdependencias')">Subdependencias</button>
  <button [class.active]="activeTab === 'tiposContrato'" (click)="setTab('tiposContrato')">Tipos de Contrato</button>
  <button [class.active]="activeTab === 'tiposLicencia'" (click)="setTab('tiposLicencia')">Tipos de Licencia</button>
  <button [class.active]="activeTab === 'tiposBien'" (click)="setTab('tiposBien')">Tipos de Bien</button>
</div>
```

- [ ] **Step 7: Add the two new `ng-container` blocks**

In the same file, after the closing `</ng-container>` of the "Tipos de Contrato" block (the file's last block), append:

```html
<!-- Tipos de Licencia -->
<ng-container *ngIf="activeTab === 'tiposLicencia'">
  <table>
    <thead>
      <tr>
        <th>Nombre</th>
        <th>Acciones</th>
      </tr>
    </thead>
    <tbody>
      <tr *ngFor="let item of tiposLicencia">
        <td>{{ item.nombre }}</td>
        <td>
          <button (click)="startEdit(item.id, item.nombre)">Editar</button>
          <button class="danger" (click)="deleteItem('tiposLicencia', item.id)">Eliminar</button>
        </td>
      </tr>
    </tbody>
  </table>

  <div class="form">
    <input [(ngModel)]="nombreForm" placeholder="Nombre de tipo de licencia" />
    <button (click)="submitSimple()">{{ editingId ? 'Actualizar' : 'Agregar' }}</button>
    <button class="secondary" *ngIf="editingId" (click)="resetForm()">Cancelar</button>
  </div>
</ng-container>

<!-- Tipos de Bien -->
<ng-container *ngIf="activeTab === 'tiposBien'">
  <table>
    <thead>
      <tr>
        <th>Nombre</th>
        <th>Acciones</th>
      </tr>
    </thead>
    <tbody>
      <tr *ngFor="let item of tiposBien">
        <td>{{ item.nombre }}</td>
        <td>
          <button (click)="startEdit(item.id, item.nombre)">Editar</button>
          <button class="danger" (click)="deleteItem('tiposBien', item.id)">Eliminar</button>
        </td>
      </tr>
    </tbody>
  </table>

  <div class="form">
    <input [(ngModel)]="nombreForm" placeholder="Nombre de tipo de bien" />
    <button (click)="submitSimple()">{{ editingId ? 'Actualizar' : 'Agregar' }}</button>
    <button class="secondary" *ngIf="editingId" (click)="resetForm()">Cancelar</button>
  </div>
</ng-container>
```

- [ ] **Step 8: Fix `catalogos.component.spec.ts` for the 2 new endpoints**

Replace the full contents of `soportedesk-frontend/src/app/features/catalogos/catalogos.component.spec.ts`:

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CatalogosComponent } from './catalogos.component';

describe('CatalogosComponent', () => {
  let component: CatalogosComponent;
  let fixture: ComponentFixture<CatalogosComponent>;
  let httpMock: HttpTestingController;

  function flushLoadAll(sedesData: unknown[] = []): void {
    httpMock.expectOne((req) => req.url.includes('/catalogos/sedes')).flush(sedesData);
    httpMock.expectOne((req) => req.url.includes('/catalogos/dependencias')).flush([]);
    httpMock.expectOne((req) => req.url.includes('/catalogos/subdependencias')).flush([]);
    httpMock.expectOne((req) => req.url.includes('/catalogos/tipos-contrato')).flush([]);
    httpMock.expectOne((req) => req.url.includes('/catalogos/tipos-licencia')).flush([]);
    httpMock.expectOne((req) => req.url.includes('/catalogos/tipos-bien')).flush([]);
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CatalogosComponent, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(CatalogosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    httpMock = TestBed.inject(HttpTestingController);

    flushLoadAll();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should default to sedes tab', () => {
    expect(component.activeTab).toBe('sedes');
  });

  it('should switch to dependencias tab', () => {
    component.setTab('dependencias');
    expect(component.activeTab).toBe('dependencias');
  });

  it('should create a sede and reload', () => {
    component.activeTab = 'sedes';
    component.nombreForm = 'Nueva Sede';
    component.submitSimple();

    const postReq = httpMock.expectOne((req) =>
      req.method === 'POST' && req.url.includes('/catalogos/sedes'),
    );
    postReq.flush({ id: 1, nombre: 'Nueva Sede' });

    // After create, loadAll() fires 6 more requests
    flushLoadAll([{ id: 1, nombre: 'Nueva Sede' }]);

    expect(component.sedes.length).toBe(1);
  });
});
```

- [ ] **Step 9: Run the tests**

Run: `cd soportedesk-frontend && npx ng test --watch=false --browsers=ChromeHeadless --include='**/catalogos.component.spec.ts'`
Expected: PASS (3 tests), `httpMock.verify()` passes with no outstanding requests.

- [ ] **Step 10: Verify the full project builds**

Run: `cd soportedesk-frontend && npx ng build`
Expected: `BUILD SUCCESS`, no compile errors anywhere in the project.

- [ ] **Step 11: Commit**

```bash
git add soportedesk-frontend/src/app/features/catalogos/catalogos.component.ts soportedesk-frontend/src/app/features/catalogos/catalogos.component.html soportedesk-frontend/src/app/features/catalogos/catalogos.component.spec.ts
git commit -m "feat: add Tipos de Licencia and Tipos de Bien tabs to catalogos admin screen"
```

---

## Verificación final

Tras completar las 14 tareas, validar el conjunto completo:

- [ ] **1. Backend — compilación y tests unitarios**

```bash
cd soportedesk-backend && mvn clean compile
cd soportedesk-backend && mvn test
```

Expected: `mvn compile` → `BUILD SUCCESS`. `mvn test` → todos los `*ServiceTest` (incluyendo `LicenciaServiceTest`, `TipoLicenciaServiceTest`, `TipoBienServiceTest`, `LicenciaCredentialConverterTest`) PASAN. Todos los `*ControllerIT` (incluyendo los 3 nuevos/modificados de este plan) FALLAN al cargar el `ApplicationContext` — bug preexistente, transversal, documentado en Global Constraints y en memoria del proyecto (`feedback_tests_entidades.md`). Confirmar que el conteo de tests `ControllerIT` fallidos coincide con el de antes de este plan más los 2 archivos nuevos (`TipoLicenciaControllerIT`, `TipoBienControllerIT`) — ningún test debe fallar por una razón *distinta* al error de carga de contexto conocido.

- [ ] **2. Frontend — compilación y tests**

```bash
cd soportedesk-frontend && npx ng build
cd soportedesk-frontend && npx ng test --watch=false --browsers=ChromeHeadless
```

Expected: `ng build` → `BUILD SUCCESS`. `ng test` → todos los specs existentes siguen pasando, incluyendo el `catalogos.component.spec.ts` corregido en Task 14.

- [ ] **3. Migración manual de base de datos**

Conectarse a SSMS contra `172.16.26.16`, base `ssti`, y ejecutar `soportedesk-backend/src/main/resources/migrate_licencias_v2.sql` (Task 9). Confirmar en el `SELECT` final del script:
- `dbo.tipos_licencia` tiene 6 filas (Ofimática, Diseño, Edición de Video, Sistema Operativo, Antivirus, Otro).
- `dbo.tipos_bien` tiene 3 filas (Equipo, Intangible, Servicio).
- `dbo.licencias` existe, vacía, con las columnas nuevas (`tipo_licencia_id`, `descripcion`, `cuenta_activacion`, `clave_activacion`, `serial_activacion`, `orden_compra`, `anio`, `cantidad`, `tipo_bien_id`).

- [ ] **4. Smoke test end-to-end**

Con el backend reiniciado (para que recoja `LicenciaCredentialConverter`/`licencia.encryption-key` y los nuevos repositorios) y el frontend corriendo:

1. Abrir la pantalla de Catálogos → tabs "Tipos de Licencia" y "Tipos de Bien" muestran los 6 y 3 valores sembrados respectivamente.
2. Abrir el módulo de Licencias → la lista está vacía (datos descartados). Columnas visibles: Tipo, Licencia, Orden de Compra, Año.
3. Crear una licencia nueva: seleccionar Tipo de Licencia y Tipo de Bien, completar Descripción/Orden de Compra/Año/Cantidad, dejar Cuenta/Clave de Activación vacíos → debe guardar sin error (regla cuenta/clave no aplica si ambos están vacíos).
4. Editar la misma licencia: completar Cuenta de Activación → el campo Clave de Activación se habilita (antes estaba deshabilitado con el mensaje de ayuda visible); completar Clave de Activación y guardar.
5. En SSMS, `SELECT clave_activacion FROM dbo.licencias` → el valor debe verse como ciphertext Base64 (no el texto plano ingresado).
6. Recargar la lista en el frontend y abrir el modal de detalle de esa licencia → `Clave de Activación` debe mostrar el texto plano original (confirma el round-trip de desencriptación transparente).
7. Llamar directamente a `POST /api/licencias` (vía Postman/curl) con `claveActivacion` seteado y `cuentaActivacion` vacío/ausente → debe responder `409 Conflict` (confirma el respaldo de backend para la regla cuenta/clave, incluso si la UI ya la impide).

- [ ] **5. `DashboardServiceTest` — confirmar que no se ve afectado**

Ya verificado durante la redacción de este plan: `soportedesk-backend/src/main/java/com/inia/soportedesk/dashboard/DashboardService.java` solo invoca `licenciaRepository.count()` (línea 32) — no referencia ningún campo específico de `Licencia` (ni el antiguo `licencia`/`correo`/`clave` ni los nuevos `descripcion`/`tipoLicencia`/etc.). `DashboardServiceTest` no necesita cambios. Confirmar que `mvn test -Dtest=DashboardServiceTest` (ya cubierto por el paso 1 de esta sección) sigue pasando sin modificaciones.

---
