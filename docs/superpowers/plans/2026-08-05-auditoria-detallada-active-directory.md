# Auditoría detallada de cambios en Active Directory — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Registrar cada operación de escritura sobre Active Directory (crear, resetear contraseña, habilitar/deshabilitar, desbloquear, mover OU, grupos, actualizar info, eliminar) en la tabla `dbo.ad_auditoria` ya existente en la base de datos, con estado anterior/nuevo, duración y resultado — y exponerlo en una nueva pestaña "Detalle AD" dentro de la pantalla de Auditoría.

**Architecture:** Nuevo componente backend `AdAuditoria`/`AdAuditoriaRepository`/`AdAuditoriaService`/`AdAuditoriaController` (paquete `auditoria`, junto a `MovimientoAuditoria`) que mapea 1:1 la tabla `ad_auditoria` existente (sin migración). `ActiveDirectoryService` gana una segunda llamada de auditoría (`auditAd(...)`) en paralelo a la llamada `audit(...)` que ya existe hoy — ninguna reemplaza a la otra. El frontend agrega una pestaña nueva a `AuditoriaComponent` que consume el nuevo endpoint `GET /api/auditoria/ad`.

**Tech Stack:** Spring Boot 3 / JPA / SQL Server (backend), Angular 17+ standalone components (frontend).

## Global Constraints

- No se modifica `movimientos_auditoria`, `MovimientoAuditoria`, `MovimientoAuditoriaService` ni `AuditoriaFilter` — quedan intactos.
- No se crea migración de esquema: la tabla `ad_auditoria` ya existe en la base de datos con las columnas documentadas en el spec (`docs/superpowers/specs/2026-08-05-auditoria-detallada-active-directory-design.md`, sección 3).
- El registro en `ad_auditoria` nunca debe interrumpir ni fallar la operación real sobre AD — cualquier error al guardar se captura y se loguea (`log.warn`), nunca se propaga.
- Se reutiliza el permiso existente `READ_auditoria` / `hasRole('ADMIN')` para el nuevo endpoint — no se crean permisos nuevos.
- Los literales de texto nuevos en `ActiveDirectoryService.java` van sin tildes/ñ, siguiendo la convención ya usada en ese archivo ("Informacion", "Contrasena", "accion").
- Nomenclatura de acción: se usa `ACTUALIZAR_INFO` (nombre real usado hoy en el código y el filtro de Auditoría), no `ACTUALIZAR_INFORMACION`.

---

### Task 1: Entidad `AdAuditoria` y record `AdAuditoriaRegistro`

**Files:**
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/auditoria/AdAuditoria.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/auditoria/AdAuditoriaRegistro.java`

**Interfaces:**
- Produces: entidad JPA `AdAuditoria` (getters/setters vía Lombok) mapeada a `ad_auditoria`; record `AdAuditoriaRegistro` con los datos de entrada para registrar un movimiento.

- [ ] **Step 1: Crear la entidad `AdAuditoria`**

```java
package com.inia.soportedesk.auditoria;

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
import java.util.UUID;

@Entity
@Table(name = "ad_auditoria")
@Getter
@Setter
@NoArgsConstructor
public class AdAuditoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "operador_usuario", nullable = false, length = 100)
    private String operadorUsuario;

    @Column(name = "operador_nombre", length = 150)
    private String operadorNombre;

    @Column(name = "usuario_afectado", nullable = false, length = 100)
    private String usuarioAfectado;

    @Column(name = "usuario_afectadodn", length = 500)
    private String usuarioAfectadoDn;

    @Column(nullable = false, length = 80)
    private String accion;

    @Column(nullable = false, length = 50)
    private String modulo;

    @Column(nullable = false, length = 20)
    private String resultado;

    @Column(length = 500)
    private String mensaje;

    @Column(name = "detalle_error", columnDefinition = "nvarchar(max)")
    private String detalleError;

    @Column(name = "ip_origen", length = 50)
    private String ipOrigen;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(name = "fecha_registro", nullable = false)
    private LocalDateTime fechaRegistro;

    @Column(name = "id_transaccion")
    private UUID idTransaccion;

    @Column(name = "fecha_inicio")
    private LocalDateTime fechaInicio;

    @Column(name = "fecha_fin")
    private LocalDateTime fechaFin;

    @Column(name = "duracion_ms")
    private Integer duracionMs;

    @Column(name = "estado_anterior", columnDefinition = "nvarchar(max)")
    private String estadoAnterior;

    @Column(name = "estado_nuevo", columnDefinition = "nvarchar(max)")
    private String estadoNuevo;

    @Column(name = "recurso_afectado", length = 300)
    private String recursoAfectado;

    @Column(name = "tipo_recurso", length = 100)
    private String tipoRecurso;

    @Column(name = "end_point", length = 300)
    private String endPoint;

    @Column(name = "metodo_http", length = 20)
    private String metodoHttp;

    @Column(name = "host_origen", length = 200)
    private String hostOrigen;

    @Column(length = 100)
    private String aplicacion;

    @Column(name = "version_aplicacion", length = 50)
    private String versionAplicacion;
}
```

- [ ] **Step 2: Crear el record `AdAuditoriaRegistro`**

```java
package com.inia.soportedesk.auditoria;

import java.time.LocalDateTime;
import java.util.UUID;

public record AdAuditoriaRegistro(
        String operadorUsuario,
        String operadorNombre,
        String usuarioAfectado,
        String usuarioAfectadoDn,
        String accion,
        String resultado,
        String mensaje,
        String detalleError,
        String estadoAnterior,
        String estadoNuevo,
        String recursoAfectado,
        String endPoint,
        String metodoHttp,
        String ipOrigen,
        String userAgent,
        UUID idTransaccion,
        LocalDateTime fechaInicio,
        LocalDateTime fechaFin
) {
}
```

- [ ] **Step 3: Compilar**

Run: `cd soportedesk-backend && mvn compile -q`
Expected: BUILD SUCCESS (ningún otro archivo referencia estas clases todavía, solo verifica que compilan).

- [ ] **Step 4: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/auditoria/AdAuditoria.java soportedesk-backend/src/main/java/com/inia/soportedesk/auditoria/AdAuditoriaRegistro.java
git commit -m "feat(auditoria): agrega entidad AdAuditoria mapeada a tabla existente ad_auditoria"
```

---

### Task 2: `AdAuditoriaRepository`, `AdAuditoriaResponse` y `AdAuditoriaService`

**Files:**
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/auditoria/AdAuditoriaRepository.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/auditoria/AdAuditoriaResponse.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/auditoria/AdAuditoriaService.java`
- Test: `soportedesk-backend/src/test/java/com/inia/soportedesk/auditoria/AdAuditoriaServiceTest.java`

**Interfaces:**
- Consumes: `AdAuditoria` y `AdAuditoriaRegistro` (Task 1).
- Produces: `AdAuditoriaService.registrar(AdAuditoriaRegistro datos)` (void, nunca lanza excepción) y `AdAuditoriaService.buscar(String usuarioAfectado, String accion, String resultado, LocalDate desde, LocalDate hasta, Integer limit)` → `List<AdAuditoriaResponse>`. Usados por `ActiveDirectoryService` (Task 4) y `AdAuditoriaController` (Task 3).

- [ ] **Step 1: Escribir el test que falla primero**

Crear `soportedesk-backend/src/test/java/com/inia/soportedesk/auditoria/AdAuditoriaServiceTest.java`:

```java
package com.inia.soportedesk.auditoria;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdAuditoriaServiceTest {

    @Mock
    private AdAuditoriaRepository repository;

    @Test
    void registrar_calculaDuracionMsYGuardaConValoresFijos() {
        AdAuditoriaService service = new AdAuditoriaService(repository);
        LocalDateTime inicio = LocalDateTime.of(2026, 8, 5, 10, 0, 0);
        LocalDateTime fin = inicio.plusNanos(150_000_000);

        service.registrar(new AdAuditoriaRegistro(
                "admin", null, "dhuaman", "CN=Darwin,OU=INIA", "HABILITAR_CUENTA", "EXITOSO",
                "Cuenta habilitada correctamente.", null, "Deshabilitada", "Habilitada",
                "dhuaman", "/api/active-directory/usuarios/dhuaman/habilitar", "POST",
                "127.0.0.1", "JUnit", UUID.randomUUID(), inicio, fin));

        ArgumentCaptor<AdAuditoria> captor = ArgumentCaptor.forClass(AdAuditoria.class);
        verify(repository).save(captor.capture());
        AdAuditoria guardado = captor.getValue();
        assertThat(guardado.getDuracionMs()).isEqualTo(150);
        assertThat(guardado.getEstadoAnterior()).isEqualTo("Deshabilitada");
        assertThat(guardado.getEstadoNuevo()).isEqualTo("Habilitada");
        assertThat(guardado.getModulo()).isEqualTo("ACTIVE_DIRECTORY");
        assertThat(guardado.getTipoRecurso()).isEqualTo("USUARIO");
        assertThat(guardado.getAplicacion()).isEqualTo("SoporteDesk");
        assertThat(guardado.getOperadorUsuario()).isEqualTo("admin");
    }

    @Test
    void registrar_noPropagaExcepcionSiRepositoryFalla() {
        AdAuditoriaService service = new AdAuditoriaService(repository);
        when(repository.save(any())).thenThrow(new RuntimeException("timeout de BD"));

        service.registrar(new AdAuditoriaRegistro(
                "admin", null, "dhuaman", null, "HABILITAR_CUENTA", "EXITOSO",
                "Cuenta habilitada correctamente.", null, "Deshabilitada", "Habilitada",
                "dhuaman", "/api/active-directory/usuarios/dhuaman/habilitar", "POST",
                "127.0.0.1", null, UUID.randomUUID(), LocalDateTime.now(), LocalDateTime.now()));

        // Si llega aquí sin lanzar excepcion, el test pasa.
    }

    @Test
    void registrar_usuarioNuloSeReemplazaPorSistema() {
        AdAuditoriaService service = new AdAuditoriaService(repository);
        LocalDateTime ahora = LocalDateTime.now();

        service.registrar(new AdAuditoriaRegistro(
                null, null, "dhuaman", null, "HABILITAR_CUENTA", "EXITOSO", "ok", null, null, null,
                "dhuaman", "/api/x", "POST", "127.0.0.1", null, UUID.randomUUID(), ahora, ahora));

        ArgumentCaptor<AdAuditoria> captor = ArgumentCaptor.forClass(AdAuditoria.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().getOperadorUsuario()).isEqualTo("sistema");
    }
}
```

- [ ] **Step 2: Ejecutar el test y verificar que falla (las clases de producción no existen aún)**

Run: `cd soportedesk-backend && mvn test -q -Dtest=AdAuditoriaServiceTest`
Expected: FAIL — compilation error, `AdAuditoriaService`/`AdAuditoriaRepository` no existen.

- [ ] **Step 3: Crear `AdAuditoriaRepository`**

```java
package com.inia.soportedesk.auditoria;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface AdAuditoriaRepository extends JpaRepository<AdAuditoria, Long> {

    @Query("""
            SELECT a FROM AdAuditoria a
            WHERE (:usuarioAfectado IS NULL OR LOWER(a.usuarioAfectado) LIKE LOWER(CONCAT('%', :usuarioAfectado, '%')))
              AND (:accion IS NULL OR a.accion = :accion)
              AND (:resultado IS NULL OR a.resultado = :resultado)
              AND (:desde IS NULL OR a.fechaRegistro >= :desde)
              AND (:hasta IS NULL OR a.fechaRegistro <= :hasta)
            ORDER BY a.fechaRegistro DESC
            """)
    List<AdAuditoria> buscar(
            @Param("usuarioAfectado") String usuarioAfectado,
            @Param("accion") String accion,
            @Param("resultado") String resultado,
            @Param("desde") LocalDateTime desde,
            @Param("hasta") LocalDateTime hasta,
            Pageable pageable
    );
}
```

- [ ] **Step 4: Crear `AdAuditoriaResponse`**

```java
package com.inia.soportedesk.auditoria;

import java.time.LocalDateTime;
import java.util.UUID;

public record AdAuditoriaResponse(
        Long id,
        LocalDateTime fechaRegistro,
        String operadorUsuario,
        String operadorNombre,
        String usuarioAfectado,
        String usuarioAfectadoDn,
        String accion,
        String resultado,
        String mensaje,
        String detalleError,
        String estadoAnterior,
        String estadoNuevo,
        String recursoAfectado,
        String endPoint,
        String metodoHttp,
        String ipOrigen,
        UUID idTransaccion,
        Integer duracionMs
) {
}
```

- [ ] **Step 5: Crear `AdAuditoriaService`**

```java
package com.inia.soportedesk.auditoria;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdAuditoriaService {

    private static final Logger log = LoggerFactory.getLogger(AdAuditoriaService.class);
    private static final int MAX_LIMIT = 5_000;

    private final AdAuditoriaRepository repository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void registrar(AdAuditoriaRegistro datos) {
        try {
            AdAuditoria entidad = new AdAuditoria();
            entidad.setOperadorUsuario(limit(blankToNull(datos.operadorUsuario()) == null ? "sistema" : datos.operadorUsuario(), 100));
            entidad.setOperadorNombre(limit(datos.operadorNombre(), 150));
            entidad.setUsuarioAfectado(limit(datos.usuarioAfectado(), 100));
            entidad.setUsuarioAfectadoDn(limit(datos.usuarioAfectadoDn(), 500));
            entidad.setAccion(limit(datos.accion(), 80));
            entidad.setModulo("ACTIVE_DIRECTORY");
            entidad.setResultado(limit(datos.resultado(), 20));
            entidad.setMensaje(limit(datos.mensaje(), 500));
            entidad.setDetalleError(datos.detalleError());
            entidad.setEstadoAnterior(datos.estadoAnterior());
            entidad.setEstadoNuevo(datos.estadoNuevo());
            entidad.setRecursoAfectado(limit(datos.recursoAfectado(), 300));
            entidad.setTipoRecurso("USUARIO");
            entidad.setEndPoint(limit(datos.endPoint(), 300));
            entidad.setMetodoHttp(limit(datos.metodoHttp(), 20));
            entidad.setIpOrigen(limit(datos.ipOrigen(), 50));
            entidad.setUserAgent(limit(datos.userAgent(), 500));
            entidad.setIdTransaccion(datos.idTransaccion());
            entidad.setFechaInicio(datos.fechaInicio());
            entidad.setFechaFin(datos.fechaFin());
            entidad.setDuracionMs(datos.fechaInicio() != null && datos.fechaFin() != null
                    ? (int) Duration.between(datos.fechaInicio(), datos.fechaFin()).toMillis() : null);
            entidad.setFechaRegistro(LocalDateTime.now());
            entidad.setAplicacion("SoporteDesk");
            repository.save(entidad);
        } catch (RuntimeException e) {
            log.warn("No se pudo registrar auditoria detallada de AD para accion={} usuarioAfectado={}",
                    datos.accion(), datos.usuarioAfectado(), e);
        }
    }

    @Transactional(readOnly = true)
    public List<AdAuditoriaResponse> buscar(String usuarioAfectado, String accion, String resultado,
                                             LocalDate desde, LocalDate hasta, Integer limit) {
        int size = Math.min(Math.max(limit == null ? 100 : limit, 1), MAX_LIMIT);
        LocalDateTime desdeDateTime = desde == null ? null : desde.atStartOfDay();
        LocalDateTime hastaDateTime = hasta == null ? null : hasta.atTime(LocalTime.MAX);

        return repository.buscar(blankToNull(usuarioAfectado), blankToNull(accion), blankToNull(resultado),
                        desdeDateTime, hastaDateTime, PageRequest.of(0, size))
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private AdAuditoriaResponse toResponse(AdAuditoria a) {
        return new AdAuditoriaResponse(
                a.getId(), a.getFechaRegistro(), a.getOperadorUsuario(), a.getOperadorNombre(),
                a.getUsuarioAfectado(), a.getUsuarioAfectadoDn(), a.getAccion(), a.getResultado(),
                a.getMensaje(), a.getDetalleError(), a.getEstadoAnterior(), a.getEstadoNuevo(),
                a.getRecursoAfectado(), a.getEndPoint(), a.getMetodoHttp(), a.getIpOrigen(),
                a.getIdTransaccion(), a.getDuracionMs()
        );
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String limit(String value, int max) {
        if (value == null) {
            return null;
        }
        return value.length() <= max ? value : value.substring(0, max);
    }
}
```

- [ ] **Step 6: Ejecutar el test y verificar que pasa**

Run: `cd soportedesk-backend && mvn test -q -Dtest=AdAuditoriaServiceTest`
Expected: PASS (3 tests).

- [ ] **Step 7: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/auditoria/AdAuditoriaRepository.java soportedesk-backend/src/main/java/com/inia/soportedesk/auditoria/AdAuditoriaResponse.java soportedesk-backend/src/main/java/com/inia/soportedesk/auditoria/AdAuditoriaService.java soportedesk-backend/src/test/java/com/inia/soportedesk/auditoria/AdAuditoriaServiceTest.java
git commit -m "feat(auditoria): agrega AdAuditoriaService/Repository con registrar() y buscar()"
```

---

### Task 3: `AdAuditoriaController` y test de integración

**Files:**
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/auditoria/AdAuditoriaController.java`
- Test: `soportedesk-backend/src/test/java/com/inia/soportedesk/auditoria/AdAuditoriaControllerIT.java`

**Interfaces:**
- Consumes: `AdAuditoriaService.buscar(...)` (Task 2).
- Produces: `GET /api/auditoria/ad` (query params: `usuarioAfectado`, `accion`, `resultado`, `desde`, `hasta`, `limit`) → `List<AdAuditoriaResponse>`. Consumido por el frontend en Task 8.

- [ ] **Step 1: Escribir el test de integración que falla primero**

Crear `soportedesk-backend/src/test/java/com/inia/soportedesk/auditoria/AdAuditoriaControllerIT.java`:

```java
package com.inia.soportedesk.auditoria;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AdAuditoriaControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AdAuditoriaService service;

    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "READ_auditoria"})
    void buscar_withReadAuthority_returnsOk() throws Exception {
        when(service.buscar(any(), any(), any(), any(), any(), any())).thenReturn(List.of());

        mockMvc.perform(get("/api/auditoria/ad"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void buscar_withoutReadAuthority_returnsForbidden() throws Exception {
        mockMvc.perform(get("/api/auditoria/ad"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void buscar_withAdminRole_returnsOk() throws Exception {
        when(service.buscar(any(), any(), any(), any(), any(), any())).thenReturn(List.of());

        mockMvc.perform(get("/api/auditoria/ad"))
                .andExpect(status().isOk());
    }
}
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `cd soportedesk-backend && mvn verify -q -Dtest=AdAuditoriaControllerIT -DfailIfNoTests=false`
Expected: FAIL — `404 Not Found` (la ruta `/api/auditoria/ad` no existe todavía) o error de compilación por `AdAuditoriaController` inexistente.

- [ ] **Step 3: Crear `AdAuditoriaController`**

```java
package com.inia.soportedesk.auditoria;

import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/auditoria")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_auditoria')")
public class AdAuditoriaController {

    private final AdAuditoriaService service;

    @GetMapping("/ad")
    public List<AdAuditoriaResponse> buscar(
            @RequestParam(required = false) String usuarioAfectado,
            @RequestParam(required = false) String accion,
            @RequestParam(required = false) String resultado,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @RequestParam(required = false) Integer limit
    ) {
        return service.buscar(usuarioAfectado, accion, resultado, desde, hasta, limit);
    }
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `cd soportedesk-backend && mvn verify -q -Dtest=AdAuditoriaControllerIT -DfailIfNoTests=false`
Expected: PASS (3 tests). Nota: este proyecto requiere `mvn verify` (no `mvn test`) para las clases `*ControllerIT` — revisar `pom.xml` (plugin `maven-failsafe-plugin`) si el comando anterior no ejecuta el test.

- [ ] **Step 5: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/auditoria/AdAuditoriaController.java soportedesk-backend/src/test/java/com/inia/soportedesk/auditoria/AdAuditoriaControllerIT.java
git commit -m "feat(auditoria): expone GET /api/auditoria/ad con permisos READ_auditoria"
```

---

### Task 4: Helpers en `ActiveDirectoryService` — `AdAuditoriaDetalle`, `auditAd(...)`, `describirCambiosInfo(...)`

**Files:**
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/activedirectory/ActiveDirectoryService.java`
- Test: `soportedesk-backend/src/test/java/com/inia/soportedesk/activedirectory/ActiveDirectoryServiceLabelsTest.java`

**Interfaces:**
- Consumes: `AdAuditoriaService.registrar(AdAuditoriaRegistro)` (Task 2).
- Produces: campo `adAuditoriaService`; método de instancia `void auditAd(String action, String samAccountName, String userDn, String resultado, String mensaje, String estadoAnterior, String estadoNuevo, String detalleExitoOError, UUID idTransaccion, Instant inicio)`; método de instancia `String describirCambiosInfo(Attributes antes, UpdateUserInfoRequest body)`; record anidado `AdAuditoriaDetalle(String estadoAnterior, String estadoNuevo, String detalleExito)`. Usados por Task 5 y Task 6.

Este task NO conecta todavía los 8 sitios de `withUserWrite`/`crearUsuario`/`eliminarUsuario` — solo agrega la infraestructura y su test. Task 5 y 6 la conectan.

- [ ] **Step 1: Escribir el test que falla primero**

Crear `soportedesk-backend/src/test/java/com/inia/soportedesk/activedirectory/ActiveDirectoryServiceLabelsTest.java`:

```java
package com.inia.soportedesk.activedirectory;

import com.inia.soportedesk.activedirectory.config.LdapContextFactory;
import com.inia.soportedesk.activedirectory.dto.UpdateUserInfoRequest;
import com.inia.soportedesk.auditoria.AdAuditoriaService;
import com.inia.soportedesk.auditoria.MovimientoAuditoriaService;
import com.inia.soportedesk.usuariosred.contrato.UsuarioRedContratoRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;

import javax.naming.directory.BasicAttribute;
import javax.naming.directory.BasicAttributes;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

class ActiveDirectoryServiceLabelsTest {

    private final ActiveDirectoryService service = new ActiveDirectoryService(
            mock(LdapContextFactory.class),
            mock(MovimientoAuditoriaService.class),
            mock(HttpServletRequest.class),
            mock(AdUsuarioCacheRepository.class),
            mock(AdCacheMetadataRepository.class),
            mock(AdSyncJobStatus.class),
            mock(ApplicationEventPublisher.class),
            mock(UsuarioRedContratoRepository.class),
            mock(AdAuditoriaService.class));

    @Test
    void describirCambiosInfo_soloListaCamposQueRealmenteCambiaron() throws Exception {
        BasicAttributes antes = new BasicAttributes(true);
        antes.put(new BasicAttribute("displayName", "Juan Perez"));
        antes.put(new BasicAttribute("title", "Analista"));
        antes.put(new BasicAttribute("mail", "jperez@inia.gob.pe"));

        UpdateUserInfoRequest body = new UpdateUserInfoRequest(
                "Juan Perez", "Administrador de Red", null, null, null, null, null, false, null);

        String resultado = service.describirCambiosInfo(antes, body);

        assertThat(resultado).isEqualTo("Campos actualizados: Cargo: Analista -> Administrador de Red");
    }

    @Test
    void describirCambiosInfo_sinCambiosDevuelveNull() throws Exception {
        BasicAttributes antes = new BasicAttributes(true);
        antes.put(new BasicAttribute("displayName", "Juan Perez"));

        UpdateUserInfoRequest body = new UpdateUserInfoRequest(
                "Juan Perez", null, null, null, null, null, null, false, null);

        String resultado = service.describirCambiosInfo(antes, body);

        assertThat(resultado).isNull();
    }

    @Test
    void describirCambiosInfo_campoAntesVacioMuestraVacio() throws Exception {
        BasicAttributes antes = new BasicAttributes(true);

        UpdateUserInfoRequest body = new UpdateUserInfoRequest(
                null, null, null, null, null, null, "nuevo@inia.gob.pe", false, null);

        String resultado = service.describirCambiosInfo(antes, body);

        assertThat(resultado).isEqualTo("Campos actualizados: Correo: (vacio) -> nuevo@inia.gob.pe");
    }

    @Test
    void describirCambiosInfo_clearMailConCorreoAnteriorReportaEliminacion() throws Exception {
        BasicAttributes antes = new BasicAttributes(true);
        antes.put(new BasicAttribute("mail", "jperez@inia.gob.pe"));

        UpdateUserInfoRequest body = new UpdateUserInfoRequest(
                null, null, null, null, null, null, null, true, null);

        String resultado = service.describirCambiosInfo(antes, body);

        assertThat(resultado).isEqualTo("Campos actualizados: Correo: jperez@inia.gob.pe -> (eliminado)");
    }
}
```

- [ ] **Step 2: Ejecutar el test y verificar que falla**

Run: `cd soportedesk-backend && mvn test -q -Dtest=ActiveDirectoryServiceLabelsTest`
Expected: FAIL — compilation error, `describirCambiosInfo` no existe y el constructor de `ActiveDirectoryService` no acepta 9 argumentos (falta `adAuditoriaService`).

- [ ] **Step 3: Agregar el campo, imports y los tres helpers en `ActiveDirectoryService.java`**

Modificar el bloque de imports (después de la línea `import com.inia.soportedesk.auditoria.MovimientoAuditoriaService;`, línea 22):

```java
import com.inia.soportedesk.auditoria.AdAuditoriaRegistro;
import com.inia.soportedesk.auditoria.AdAuditoriaService;
import com.inia.soportedesk.auditoria.MovimientoAuditoriaService;
```

Agregar tras el import de `java.util.Set;` (línea 67):

```java
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
```

(el import de `java.util.Set;` ya existe — solo agregar `Objects` antes y `UUID` después, manteniendo orden alfabético).

Modificar el bloque de campos finales (líneas 90-97), agregando el nuevo campo al final:

```java
    private final LdapContextFactory contextFactory;
    private final MovimientoAuditoriaService auditoriaService;
    private final HttpServletRequest request;
    private final AdUsuarioCacheRepository cacheRepository;
    private final AdCacheMetadataRepository metadataRepository;
    private final AdSyncJobStatus jobStatus;
    private final ApplicationEventPublisher eventPublisher;
    private final UsuarioRedContratoRepository contratoRepository;
    private final AdAuditoriaService adAuditoriaService;
```

Agregar los tres helpers nuevos justo después del método `audit(...)` existente (busca `private void audit(String action, String samAccountName, String dn, int status, String detail) {` — está cerca de la línea 1327 — e inserta el siguiente bloque inmediatamente después de su llave de cierre `}`):

```java
    private void auditAd(String action, String samAccountName, String userDn, String resultado, String mensaje,
                          String estadoAnterior, String estadoNuevo, String detalleExitoOError,
                          UUID idTransaccion, Instant inicio) {
        LocalDateTime fechaInicio = LocalDateTime.ofInstant(inicio, ZoneId.systemDefault());
        LocalDateTime fechaFin = LocalDateTime.now();
        adAuditoriaService.registrar(new AdAuditoriaRegistro(
                currentUsername(), null, samAccountName, userDn, action, resultado, mensaje, detalleExitoOError,
                estadoAnterior, estadoNuevo, samAccountName, request.getRequestURI(), request.getMethod(),
                clientIp(), request.getHeader("User-Agent"), idTransaccion, fechaInicio, fechaFin));
    }

    String describirCambiosInfo(Attributes antes, UpdateUserInfoRequest body) throws Exception {
        List<String> cambios = new ArrayList<>();
        agregarCambio(cambios, "Nombre para mostrar", attr(antes, "displayName"), body.displayName());
        agregarCambio(cambios, "Cargo", attr(antes, "title"), body.title());
        agregarCambio(cambios, "Departamento", attr(antes, "department"), body.department());
        agregarCambio(cambios, "Oficina", attr(antes, "physicalDeliveryOfficeName"), body.office());
        agregarCambio(cambios, "Telefono", attr(antes, "telephoneNumber"), body.telephoneNumber());
        agregarCambio(cambios, "Celular", attr(antes, "mobile"), body.mobile());
        if (body.clearMail()) {
            String mailAntes = blankToNull(attr(antes, "mail"));
            if (mailAntes != null) {
                cambios.add("Correo: " + mailAntes + " -> (eliminado)");
            }
        } else {
            agregarCambio(cambios, "Correo", attr(antes, "mail"), body.mail());
        }
        agregarCambio(cambios, "Descripcion", attr(antes, "description"), body.description());
        return cambios.isEmpty() ? null : "Campos actualizados: " + String.join(", ", cambios);
    }

    private void agregarCambio(List<String> cambios, String etiqueta, String antes, String nuevoValor) {
        if (nuevoValor == null || nuevoValor.isBlank()) {
            return;
        }
        String nuevo = nuevoValor.trim();
        String antesNorm = blankToNull(antes);
        if (!nuevo.equals(antesNorm)) {
            cambios.add(etiqueta + ": " + (antesNorm == null ? "(vacio)" : antesNorm) + " -> " + nuevo);
        }
    }

    private record AdAuditoriaDetalle(String estadoAnterior, String estadoNuevo, String detalleExito) {
    }
```

- [ ] **Step 4: Ejecutar el test y verificar que pasa**

Run: `cd soportedesk-backend && mvn test -q -Dtest=ActiveDirectoryServiceLabelsTest`
Expected: PASS (4 tests). Nota: si falla por otro sitio del código que instancia `ActiveDirectoryService` manualmente (fuera de Spring), buscar con `grep -rn "new ActiveDirectoryService(" soportedesk-backend/src` y actualizar esa llamada agregando el nuevo argumento — no debería haber ninguna (Spring lo inyecta), pero verificar.

- [ ] **Step 5: Compilar todo el módulo**

Run: `cd soportedesk-backend && mvn compile -q`
Expected: BUILD SUCCESS. Nota: `AdAuditoriaDetalle` y `describirCambiosInfo` quedarán sin usar todavía (warning, no error) hasta Task 5/6 — es esperado.

- [ ] **Step 6: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/activedirectory/ActiveDirectoryService.java soportedesk-backend/src/test/java/com/inia/soportedesk/activedirectory/ActiveDirectoryServiceLabelsTest.java
git commit -m "feat(activedirectory): agrega helpers de auditoria detallada (auditAd, describirCambiosInfo)"
```

---

### Task 5: Conectar `withUserWrite` y sus 8 operaciones a la nueva auditoría

**Files:**
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/activedirectory/ActiveDirectoryService.java`

**Interfaces:**
- Consumes: `AdAuditoriaDetalle`, `auditAd(...)`, `describirCambiosInfo(...)` (Task 4), `extractOus(String dn)` y `extractCn(String dn)` (ya existentes en el archivo, líneas ~1236 y ~1249).
- Produces: `withUserWrite(...)` ahora registra en `ad_auditoria` en sus 4 ramas (404, éxito, validación, excepción). Ningún consumidor externo cambia — `withUserWrite` sigue siendo privado.

No hay test unitario nuevo en este task (probar `withUserWrite` de punta a punta requiere un servidor LDAP real o mockeado, fuera de alcance — ver Task 7 para verificación manual contra AD real). La cobertura de las etiquetas específicas ya quedó en el test de Task 4.

- [ ] **Step 1: Cambiar la interfaz funcional `UserWriteOperation` para que devuelva `AdAuditoriaDetalle`**

Ubicar (cerca de la línea 1356):

```java
    @FunctionalInterface
    private interface UserWriteOperation {
        void apply(DirContext context, String userDn, SearchResult result) throws Exception;
    }
```

Reemplazar por:

```java
    @FunctionalInterface
    private interface UserWriteOperation {
        AdAuditoriaDetalle apply(DirContext context, String userDn, SearchResult result) throws Exception;
    }
```

- [ ] **Step 2: Reescribir `withUserWrite` para medir tiempo, generar `id_transaccion` y llamar `auditAd` en las 4 ramas**

Ubicar el método completo (líneas 613-641):

```java
    private ActiveDirectoryResponse<AdUser> withUserWrite(String samAccountName, String action, String successMessage,
                                                         UserWriteOperation operation) {
        String userDn = null;
        DirContext context = null;
        try {
            context = contextFactory.openDirContext();
            SearchResult result = findUser(context, samAccountName, USER_ATTRIBUTES);
            if (result == null) {
                audit(action, samAccountName, null, 404, "Usuario no encontrado.");
                return ActiveDirectoryResponse.error("Usuario no encontrado.");
            }
            userDn = result.getNameInNamespace();
            operation.apply(context, userDn, result);
            audit(action, samAccountName, userDn, 200, successMessage);
            eventPublisher.publishEvent(new AdCambioEvent(samAccountName, action));
            AdUser refreshed = refreshCachedUserFromAd(samAccountName);
            return ActiveDirectoryResponse.ok(successMessage, refreshed);
        } catch (IllegalArgumentException | IllegalStateException e) {
            audit(action, samAccountName, userDn, 400, e.getMessage());
            return ActiveDirectoryResponse.error(e.getMessage());
        } catch (Exception e) {
            log.warn("Error ejecutando accion {} en Active Directory para samAccountName={}", action, samAccountName, e);
            audit(action, samAccountName, userDn, 500, e.getMessage());
            return ActiveDirectoryResponse.error(
                    "No se pudo completar la accion en Active Directory. Verifique la conexion e intente nuevamente.");
        } finally {
            closeQuietly(context);
        }
    }
```

Reemplazar por:

```java
    private ActiveDirectoryResponse<AdUser> withUserWrite(String samAccountName, String action, String successMessage,
                                                         UserWriteOperation operation) {
        Instant inicio = Instant.now();
        UUID idTransaccion = UUID.randomUUID();
        String userDn = null;
        DirContext context = null;
        try {
            context = contextFactory.openDirContext();
            SearchResult result = findUser(context, samAccountName, USER_ATTRIBUTES);
            if (result == null) {
                audit(action, samAccountName, null, 404, "Usuario no encontrado.");
                auditAd(action, samAccountName, null, "FALLIDO", "Usuario no encontrado.", null, null, null,
                        idTransaccion, inicio);
                return ActiveDirectoryResponse.error("Usuario no encontrado.");
            }
            userDn = result.getNameInNamespace();
            AdAuditoriaDetalle detalle = operation.apply(context, userDn, result);
            audit(action, samAccountName, userDn, 200, successMessage);
            auditAd(action, samAccountName, userDn, "EXITOSO", successMessage,
                    detalle.estadoAnterior(), detalle.estadoNuevo(), detalle.detalleExito(), idTransaccion, inicio);
            eventPublisher.publishEvent(new AdCambioEvent(samAccountName, action));
            AdUser refreshed = refreshCachedUserFromAd(samAccountName);
            return ActiveDirectoryResponse.ok(successMessage, refreshed);
        } catch (IllegalArgumentException | IllegalStateException e) {
            audit(action, samAccountName, userDn, 400, e.getMessage());
            auditAd(action, samAccountName, userDn, "FALLIDO", e.getMessage(), null, null, e.getMessage(),
                    idTransaccion, inicio);
            return ActiveDirectoryResponse.error(e.getMessage());
        } catch (Exception e) {
            log.warn("Error ejecutando accion {} en Active Directory para samAccountName={}", action, samAccountName, e);
            audit(action, samAccountName, userDn, 500, e.getMessage());
            auditAd(action, samAccountName, userDn, "FALLIDO", e.getMessage(), null, null, e.getMessage(),
                    idTransaccion, inicio);
            return ActiveDirectoryResponse.error(
                    "No se pudo completar la accion en Active Directory. Verifique la conexion e intente nuevamente.");
        } finally {
            closeQuietly(context);
        }
    }
```

- [ ] **Step 3: `desbloquearUsuario` — devolver la etiqueta**

Ubicar (líneas 262-268):

```java
    public ActiveDirectoryResponse<AdUser> desbloquearUsuario(String samAccountName) {
        return withUserWrite(samAccountName, "DESBLOQUEAR_CUENTA", "Cuenta desbloqueada correctamente.", (context, userDn, result) ->
                context.modifyAttributes(userDn, new ModificationItem[]{
                        new ModificationItem(DirContext.REPLACE_ATTRIBUTE, new BasicAttribute("lockoutTime", "0"))
                })
        );
    }
```

Reemplazar por:

```java
    public ActiveDirectoryResponse<AdUser> desbloquearUsuario(String samAccountName) {
        return withUserWrite(samAccountName, "DESBLOQUEAR_CUENTA", "Cuenta desbloqueada correctamente.", (context, userDn, result) -> {
            context.modifyAttributes(userDn, new ModificationItem[]{
                    new ModificationItem(DirContext.REPLACE_ATTRIBUTE, new BasicAttribute("lockoutTime", "0"))
            });
            return new AdAuditoriaDetalle("Bloqueada", "Desbloqueada", null);
        });
    }
```

- [ ] **Step 4: `resetPassword` — devolver la etiqueta**

Ubicar (líneas 270-280):

```java
    public ActiveDirectoryResponse<AdUser> resetPassword(String samAccountName, ResetPasswordRequest body) {
        return withUserWrite(samAccountName, "RESET_PASSWORD", "Contrasena restablecida correctamente.", (context, userDn, result) -> {
            String quotedPassword = "\"" + body.newPassword() + "\"";
            context.modifyAttributes(userDn, new ModificationItem[]{
                    new ModificationItem(DirContext.REPLACE_ATTRIBUTE,
                            new BasicAttribute("unicodePwd", quotedPassword.getBytes(StandardCharsets.UTF_16LE))),
                    new ModificationItem(DirContext.REPLACE_ATTRIBUTE,
                            new BasicAttribute("pwdLastSet", body.forceChange() ? "0" : "-1"))
            });
        });
    }
```

Reemplazar por:

```java
    public ActiveDirectoryResponse<AdUser> resetPassword(String samAccountName, ResetPasswordRequest body) {
        return withUserWrite(samAccountName, "RESET_PASSWORD", "Contrasena restablecida correctamente.", (context, userDn, result) -> {
            String quotedPassword = "\"" + body.newPassword() + "\"";
            context.modifyAttributes(userDn, new ModificationItem[]{
                    new ModificationItem(DirContext.REPLACE_ATTRIBUTE,
                            new BasicAttribute("unicodePwd", quotedPassword.getBytes(StandardCharsets.UTF_16LE))),
                    new ModificationItem(DirContext.REPLACE_ATTRIBUTE,
                            new BasicAttribute("pwdLastSet", body.forceChange() ? "0" : "-1"))
            });
            return new AdAuditoriaDetalle("Contrasena anterior no registrada por seguridad", "Contrasena restablecida",
                    "Cambio obligatorio al iniciar sesion: " + (body.forceChange() ? "Si" : "No"));
        });
    }
```

- [ ] **Step 5: `changeEnabled` — devolver la etiqueta según `enabled`**

Ubicar (líneas 585-596):

```java
    private ActiveDirectoryResponse<AdUser> changeEnabled(String samAccountName, boolean enabled) {
        return withUserWrite(samAccountName, enabled ? "HABILITAR_CUENTA" : "DESHABILITAR_CUENTA",
                enabled ? "Cuenta habilitada correctamente." : "Cuenta deshabilitada correctamente.",
                (context, userDn, result) -> {
                    int uac = parseInt(attr(result.getAttributes(), "userAccountControl"));
                    int next = enabled ? (uac & ~ACCOUNT_DISABLED) : (uac | ACCOUNT_DISABLED);
                    context.modifyAttributes(userDn, new ModificationItem[]{
                            new ModificationItem(DirContext.REPLACE_ATTRIBUTE,
                                    new BasicAttribute("userAccountControl", String.valueOf(next)))
                    });
                });
    }
```

Reemplazar por:

```java
    private ActiveDirectoryResponse<AdUser> changeEnabled(String samAccountName, boolean enabled) {
        return withUserWrite(samAccountName, enabled ? "HABILITAR_CUENTA" : "DESHABILITAR_CUENTA",
                enabled ? "Cuenta habilitada correctamente." : "Cuenta deshabilitada correctamente.",
                (context, userDn, result) -> {
                    int uac = parseInt(attr(result.getAttributes(), "userAccountControl"));
                    int next = enabled ? (uac & ~ACCOUNT_DISABLED) : (uac | ACCOUNT_DISABLED);
                    context.modifyAttributes(userDn, new ModificationItem[]{
                            new ModificationItem(DirContext.REPLACE_ATTRIBUTE,
                                    new BasicAttribute("userAccountControl", String.valueOf(next)))
                    });
                    return enabled
                            ? new AdAuditoriaDetalle("Deshabilitada", "Habilitada", null)
                            : new AdAuditoriaDetalle("Habilitada", "Deshabilitada", null);
                });
    }
```

- [ ] **Step 6: `modifyGroup` — devolver la etiqueta según `operation`**

Ubicar (líneas 598-611):

```java
    private ActiveDirectoryResponse<AdUser> modifyGroup(String samAccountName, String groupDn, int operation,
                                                        String action, String message) {
        return withUserWrite(samAccountName, action, message, (context, userDn, result) -> {
            try {
                context.modifyAttributes(groupDn.trim(), new ModificationItem[]{
                        new ModificationItem(operation, new BasicAttribute("member", userDn))
                });
            } catch (AttributeInUseException e) {
                throw new IllegalStateException("El usuario ya pertenece a este grupo.");
            } catch (NoSuchAttributeException e) {
                throw new IllegalStateException("El usuario no pertenece a este grupo.");
            }
        });
    }
```

Reemplazar por:

```java
    private ActiveDirectoryResponse<AdUser> modifyGroup(String samAccountName, String groupDn, int operation,
                                                        String action, String message) {
        boolean agregando = operation == DirContext.ADD_ATTRIBUTE;
        return withUserWrite(samAccountName, action, message, (context, userDn, result) -> {
            try {
                context.modifyAttributes(groupDn.trim(), new ModificationItem[]{
                        new ModificationItem(operation, new BasicAttribute("member", userDn))
                });
            } catch (AttributeInUseException e) {
                throw new IllegalStateException("El usuario ya pertenece a este grupo.");
            } catch (NoSuchAttributeException e) {
                throw new IllegalStateException("El usuario no pertenece a este grupo.");
            }
            String detalle = "Grupo: " + extractCn(groupDn.trim()) + " | DN grupo: " + groupDn.trim();
            return agregando
                    ? new AdAuditoriaDetalle("No pertenece", "Pertenece", detalle)
                    : new AdAuditoriaDetalle("Pertenece", "No pertenece", detalle);
        });
    }
```

- [ ] **Step 7: `moverUsuarioOu` — devolver la etiqueta con OU origen/destino**

Ubicar (líneas 318-332):

```java
    public ActiveDirectoryResponse<AdUser> moverUsuarioOu(String samAccountName, MoveUserRequest body) {
        return withUserWrite(samAccountName, "MOVER_OU", "Usuario movido correctamente.", (context, userDn, result) -> {
            String targetOu = body.ouDestinoDn().trim();
            if (!targetOu.toLowerCase().endsWith(contextFactory.baseDn().toLowerCase())) {
                throw new IllegalArgumentException("La OU destino debe pertenecer a " + contextFactory.baseDn());
            }
            String cn = attr(result.getAttributes(), "cn");
            if (cn == null || cn.isBlank()) {
                cn = dnFirstSegment(userDn);
            } else {
                cn = "CN=" + cn;
            }
            context.rename(new LdapName(userDn), new LdapName(cn + "," + targetOu));
        });
    }
```

Reemplazar por:

```java
    public ActiveDirectoryResponse<AdUser> moverUsuarioOu(String samAccountName, MoveUserRequest body) {
        return withUserWrite(samAccountName, "MOVER_OU", "Usuario movido correctamente.", (context, userDn, result) -> {
            String targetOu = body.ouDestinoDn().trim();
            if (!targetOu.toLowerCase().endsWith(contextFactory.baseDn().toLowerCase())) {
                throw new IllegalArgumentException("La OU destino debe pertenecer a " + contextFactory.baseDn());
            }
            String cn = attr(result.getAttributes(), "cn");
            if (cn == null || cn.isBlank()) {
                cn = dnFirstSegment(userDn);
            } else {
                cn = "CN=" + cn;
            }
            String dnNuevo = cn + "," + targetOu;
            String ouOrigen = extractOus(userDn);
            String ouDestino = extractOus(targetOu);
            context.rename(new LdapName(userDn), new LdapName(dnNuevo));
            String detalle = "OU origen: " + ouOrigen + " | OU destino: " + ouDestino
                    + " | DN anterior: " + userDn + " | DN nuevo: " + dnNuevo;
            return new AdAuditoriaDetalle(ouOrigen, ouDestino, detalle);
        });
    }
```

- [ ] **Step 8: `actualizarInformacionUsuario` — devolver la etiqueta con `describirCambiosInfo`**

Ubicar (líneas 344-369):

```java
    public synchronized ActiveDirectoryResponse<AdUser> actualizarInformacionUsuario(String samAccountName, UpdateUserInfoRequest body) {
        return withUserWrite(samAccountName, "ACTUALIZAR_INFO", "Informacion del usuario actualizada correctamente.", (context, userDn, result) -> {
            if (!body.clearMail() && body.mail() != null && !body.mail().isBlank()) {
                ensureMailIsUniqueInDirectory(context, body.mail(), samAccountName);
            }
            String department = blankToNull(body.department());
            String office = firstNonBlank(body.office(), department);
            List<ModificationItem> mods = new ArrayList<>();
            addReplace(mods, "displayName", body.displayName());
            addReplace(mods, "title", body.title());
            addReplace(mods, "department", department);
            addReplace(mods, "physicalDeliveryOfficeName", office);
            addReplace(mods, "telephoneNumber", body.telephoneNumber());
            addReplace(mods, "mobile", body.mobile());
            if (body.clearMail()) {
                addReplaceOrRemove(mods, "mail", null);
            } else {
                addReplace(mods, "mail", body.mail());
            }
            addReplace(mods, "description", body.description());
            if (mods.isEmpty()) {
                throw new IllegalArgumentException("No hay informacion para actualizar.");
            }
            context.modifyAttributes(userDn, mods.toArray(ModificationItem[]::new));
        });
    }
```

Reemplazar por:

```java
    public synchronized ActiveDirectoryResponse<AdUser> actualizarInformacionUsuario(String samAccountName, UpdateUserInfoRequest body) {
        return withUserWrite(samAccountName, "ACTUALIZAR_INFO", "Informacion del usuario actualizada correctamente.", (context, userDn, result) -> {
            if (!body.clearMail() && body.mail() != null && !body.mail().isBlank()) {
                ensureMailIsUniqueInDirectory(context, body.mail(), samAccountName);
            }
            String department = blankToNull(body.department());
            String office = firstNonBlank(body.office(), department);
            List<ModificationItem> mods = new ArrayList<>();
            addReplace(mods, "displayName", body.displayName());
            addReplace(mods, "title", body.title());
            addReplace(mods, "department", department);
            addReplace(mods, "physicalDeliveryOfficeName", office);
            addReplace(mods, "telephoneNumber", body.telephoneNumber());
            addReplace(mods, "mobile", body.mobile());
            if (body.clearMail()) {
                addReplaceOrRemove(mods, "mail", null);
            } else {
                addReplace(mods, "mail", body.mail());
            }
            addReplace(mods, "description", body.description());
            if (mods.isEmpty()) {
                throw new IllegalArgumentException("No hay informacion para actualizar.");
            }
            String detalle = describirCambiosInfo(result.getAttributes(), body);
            context.modifyAttributes(userDn, mods.toArray(ModificationItem[]::new));
            return new AdAuditoriaDetalle("Informacion anterior", "Informacion actualizada", detalle);
        });
    }
```

- [ ] **Step 9: Compilar**

Run: `cd soportedesk-backend && mvn compile -q`
Expected: BUILD SUCCESS. Si aparece un error de tipo "lambda no compatible con interfaz funcional" en algún sitio no listado arriba, significa que hay un noveno consumidor de `withUserWrite` no detectado — buscar con `grep -n "withUserWrite(" soportedesk-backend/src/main/java/com/inia/soportedesk/activedirectory/ActiveDirectoryService.java` y aplicarle el mismo patrón (agregar `return new AdAuditoriaDetalle(...)` al final de su lambda).

- [ ] **Step 10: Ejecutar toda la suite de tests del módulo Active Directory**

Run: `cd soportedesk-backend && mvn test -q -Dtest="com.inia.soportedesk.activedirectory.*Test"`
Expected: PASS (todos los tests existentes de `activedirectory` siguen pasando, incluyendo `ActiveDirectoryServiceLabelsTest` de Task 4).

- [ ] **Step 11: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/activedirectory/ActiveDirectoryService.java
git commit -m "feat(activedirectory): registra auditoria detallada en las 8 operaciones de withUserWrite"
```

---

### Task 6: Conectar `crearUsuario` y `eliminarUsuario`

**Files:**
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/activedirectory/ActiveDirectoryService.java`

**Interfaces:**
- Consumes: `auditAd(...)`, `extractOus(String dn)` (ya existente).

Estos dos métodos no usan `withUserWrite`, tienen su propio try/catch — se les agrega `auditAd(...)` directamente en cada uno de sus 3 puntos de auditoría existentes (uno por rama).

- [ ] **Step 1: `eliminarUsuario` — agregar medición de tiempo y las 3 llamadas a `auditAd`**

Ubicar (líneas 290-316):

```java
    public synchronized ActiveDirectoryResponse<Void> eliminarUsuario(String samAccountName) {
        String userDn = null;
        DirContext context = null;
        try {
            context = contextFactory.openDirContext();
            SearchResult result = findUser(context, samAccountName, new String[]{"distinguishedName"});
            if (result == null) {
                audit("ELIMINAR_USUARIO", samAccountName, null, 404, "Usuario no encontrado.");
                return ActiveDirectoryResponse.error("Usuario no encontrado.");
            }

            userDn = result.getNameInNamespace();
            context.destroySubcontext(userDn);
            cacheRepository.findFirstBySamAccountNameIgnoreCase(samAccountName)
                    .ifPresent(cacheRepository::delete);
            audit("ELIMINAR_USUARIO", samAccountName, userDn, 200, "Usuario eliminado correctamente.");
            eventPublisher.publishEvent(new AdCambioEvent(samAccountName, "ELIMINAR_USUARIO"));
            return ActiveDirectoryResponse.ok("Usuario eliminado correctamente.", null);
        } catch (Exception e) {
            log.warn("Error eliminando usuario de Active Directory para samAccountName={}", samAccountName, e);
            audit("ELIMINAR_USUARIO", samAccountName, userDn, 500, e.getMessage());
            return ActiveDirectoryResponse.error(
                    "No se pudo eliminar el usuario de Active Directory. Verifique sus dependencias e intente nuevamente.");
        } finally {
            closeQuietly(context);
        }
    }
```

Reemplazar por:

```java
    public synchronized ActiveDirectoryResponse<Void> eliminarUsuario(String samAccountName) {
        Instant inicio = Instant.now();
        UUID idTransaccion = UUID.randomUUID();
        String userDn = null;
        DirContext context = null;
        try {
            context = contextFactory.openDirContext();
            SearchResult result = findUser(context, samAccountName, new String[]{"distinguishedName"});
            if (result == null) {
                audit("ELIMINAR_USUARIO", samAccountName, null, 404, "Usuario no encontrado.");
                auditAd("ELIMINAR_USUARIO", samAccountName, null, "FALLIDO", "Usuario no encontrado.",
                        null, null, null, idTransaccion, inicio);
                return ActiveDirectoryResponse.error("Usuario no encontrado.");
            }

            userDn = result.getNameInNamespace();
            context.destroySubcontext(userDn);
            cacheRepository.findFirstBySamAccountNameIgnoreCase(samAccountName)
                    .ifPresent(cacheRepository::delete);
            audit("ELIMINAR_USUARIO", samAccountName, userDn, 200, "Usuario eliminado correctamente.");
            auditAd("ELIMINAR_USUARIO", samAccountName, userDn, "EXITOSO", "Usuario eliminado correctamente.",
                    "Usuario existia", "Usuario eliminado", "DN eliminado: " + userDn, idTransaccion, inicio);
            eventPublisher.publishEvent(new AdCambioEvent(samAccountName, "ELIMINAR_USUARIO"));
            return ActiveDirectoryResponse.ok("Usuario eliminado correctamente.", null);
        } catch (Exception e) {
            log.warn("Error eliminando usuario de Active Directory para samAccountName={}", samAccountName, e);
            audit("ELIMINAR_USUARIO", samAccountName, userDn, 500, e.getMessage());
            auditAd("ELIMINAR_USUARIO", samAccountName, userDn, "FALLIDO", e.getMessage(), null, null,
                    e.getMessage(), idTransaccion, inicio);
            return ActiveDirectoryResponse.error(
                    "No se pudo eliminar el usuario de Active Directory. Verifique sus dependencias e intente nuevamente.");
        } finally {
            closeQuietly(context);
        }
    }
```

- [ ] **Step 2: `crearUsuario` — agregar medición de tiempo y las 3 llamadas a `auditAd`**

Ubicar el inicio del método (líneas 371-376):

```java
    public synchronized ActiveDirectoryResponse<AdUser> crearUsuario(CreateAdUserRequest body) {
        String sam = body.samAccountName().trim();
        String userDn = null;
        DirContext context = null;
        try {
            context = contextFactory.openDirContext();
```

Reemplazar por:

```java
    public synchronized ActiveDirectoryResponse<AdUser> crearUsuario(CreateAdUserRequest body) {
        Instant inicio = Instant.now();
        UUID idTransaccion = UUID.randomUUID();
        String sam = body.samAccountName().trim();
        String userDn = null;
        DirContext context = null;
        try {
            context = contextFactory.openDirContext();
```

Ubicar el bloque de la rama "el usuario ya existe" (línea 377-380):

```java
            if (findUser(context, sam, new String[]{"distinguishedName"}) != null) {
                audit("CREAR_USUARIO", sam, null, 400, "El usuario ya existe.");
                return ActiveDirectoryResponse.error("El usuario ya existe en Active Directory.");
            }
```

Reemplazar por:

```java
            if (findUser(context, sam, new String[]{"distinguishedName"}) != null) {
                audit("CREAR_USUARIO", sam, null, 400, "El usuario ya existe.");
                auditAd("CREAR_USUARIO", sam, null, "FALLIDO", "El usuario ya existe.",
                        "No existia", "Error de creacion", "El usuario ya existe en Active Directory.",
                        idTransaccion, inicio);
                return ActiveDirectoryResponse.error("El usuario ya existe en Active Directory.");
            }
```

Ubicar la rama de éxito (líneas 433-436):

```java
            audit("CREAR_USUARIO", sam, userDn, 201, "Usuario creado correctamente.");
            eventPublisher.publishEvent(new AdCambioEvent(sam, "CREAR_USUARIO"));
            AdUser refreshed = refreshCachedUserFromAd(sam, userDn);
            return ActiveDirectoryResponse.ok("Usuario creado correctamente.", refreshed);
```

Reemplazar por:

```java
            audit("CREAR_USUARIO", sam, userDn, 201, "Usuario creado correctamente.");
            String detalleCreacion = "SAM: " + sam + " | Nombre: " + displayName + " | OU: " + extractOus(targetOu)
                    + " | Cambio obligatorio: " + (body.forceChange() ? "Si" : "No");
            auditAd("CREAR_USUARIO", sam, userDn, "EXITOSO", "Usuario creado correctamente.",
                    "No existia", "Usuario creado y habilitado", detalleCreacion, idTransaccion, inicio);
            eventPublisher.publishEvent(new AdCambioEvent(sam, "CREAR_USUARIO"));
            AdUser refreshed = refreshCachedUserFromAd(sam, userDn);
            return ActiveDirectoryResponse.ok("Usuario creado correctamente.", refreshed);
```

Ubicar las dos ramas de error finales (líneas 437-444):

```java
        } catch (IllegalArgumentException e) {
            audit("CREAR_USUARIO", sam, userDn, 400, e.getMessage());
            return ActiveDirectoryResponse.error(e.getMessage());
        } catch (Exception e) {
            log.warn("Error creando usuario en Active Directory para samAccountName={}", sam, e);
            audit("CREAR_USUARIO", sam, userDn, 500, e.getMessage());
            return ActiveDirectoryResponse.error(
                    "No se pudo crear el usuario en Active Directory. Verifique la conexion e intente nuevamente.");
        } finally {
```

Reemplazar por:

```java
        } catch (IllegalArgumentException e) {
            audit("CREAR_USUARIO", sam, userDn, 400, e.getMessage());
            auditAd("CREAR_USUARIO", sam, userDn, "FALLIDO", e.getMessage(), "No existia", "Error de creacion",
                    e.getMessage(), idTransaccion, inicio);
            return ActiveDirectoryResponse.error(e.getMessage());
        } catch (Exception e) {
            log.warn("Error creando usuario en Active Directory para samAccountName={}", sam, e);
            audit("CREAR_USUARIO", sam, userDn, 500, e.getMessage());
            auditAd("CREAR_USUARIO", sam, userDn, "FALLIDO", e.getMessage(), "No existia", "Error de creacion",
                    e.getMessage(), idTransaccion, inicio);
            return ActiveDirectoryResponse.error(
                    "No se pudo crear el usuario en Active Directory. Verifique la conexion e intente nuevamente.");
        } finally {
```

Nota: `displayName` y `targetOu` ya son variables locales existentes en `crearUsuario` (declaradas antes de la línea 391, `String displayName = ...` y `String targetOu = body.ouDestinoDn().trim();`) — el bloque de éxito reutiliza esas mismas variables, no crea unas nuevas.

- [ ] **Step 3: Compilar**

Run: `cd soportedesk-backend && mvn compile -q`
Expected: BUILD SUCCESS.

- [ ] **Step 4: Ejecutar toda la suite de tests del módulo Active Directory**

Run: `cd soportedesk-backend && mvn test -q -Dtest="com.inia.soportedesk.activedirectory.*Test"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/activedirectory/ActiveDirectoryService.java
git commit -m "feat(activedirectory): registra auditoria detallada en crearUsuario y eliminarUsuario"
```

---

### Task 7 (manual, opcional): Verificación contra el backend en ejecución

Este paso no es parte del ciclo TDD automático — requiere un backend corriendo con conexión real a `SRV-DC02.inia.local` y una cuenta de AD segura para pruebas. **No usar una cuenta de un empleado real.** En sesiones anteriores de este mismo proyecto se usó `prueba.ad01` / `prueba.ad03` como cuentas de prueba dedicadas — confirmar con el usuario si siguen existiendo antes de ejecutar este paso, o pedir que indique qué cuenta de prueba usar.

- [ ] **Step 1:** Reiniciar el backend (`mvn spring-boot:run` o el proceso que ya esté corriendo) para cargar los cambios.
- [ ] **Step 2:** Hacer login como admin vía `POST /api/auth/login` y guardar el token (mismo flujo ya usado en esta sesión para VPN).
- [ ] **Step 3:** Ejecutar 2-3 operaciones sobre la cuenta de prueba: por ejemplo `POST /api/active-directory/usuarios/{sam}/deshabilitar` y luego `.../habilitar`.
- [ ] **Step 4:** Verificar por SQL que se crearon filas nuevas en `dbo.ad_auditoria` con `estado_anterior`/`estado_nuevo` correctos:

```sql
SELECT TOP 5 accion, estado_anterior, estado_nuevo, resultado, duracion_ms, operador_usuario, usuario_afectado
FROM dbo.ad_auditoria
ORDER BY id DESC;
```

- [ ] **Step 5:** Verificar también que `movimientos_auditoria` sigue recibiendo su registro de siempre (no debe haberse roto):

```sql
SELECT TOP 5 usuario, accion, modulo, detalle FROM dbo.movimientos_auditoria ORDER BY id DESC;
```

---

### Task 8: Frontend — modelo y servicio `AdAuditoria`

**Files:**
- Create: `soportedesk-frontend/src/app/features/auditoria/ad-auditoria.model.ts`
- Create: `soportedesk-frontend/src/app/features/auditoria/ad-auditoria.service.ts`

**Interfaces:**
- Consumes: `GET /api/auditoria/ad` (Task 3).
- Produces: interfaz `AdAuditoria`, interfaz `AdAuditoriaFilters`, `AdAuditoriaService.getMovimientos(filters)`. Usado por Task 9.

- [ ] **Step 1: Crear el modelo**

```typescript
export interface AdAuditoria {
  id: number;
  fechaRegistro: string;
  operadorUsuario: string;
  operadorNombre: string | null;
  usuarioAfectado: string;
  usuarioAfectadoDn: string | null;
  accion: string;
  resultado: string;
  mensaje: string | null;
  detalleError: string | null;
  estadoAnterior: string | null;
  estadoNuevo: string | null;
  recursoAfectado: string | null;
  endPoint: string | null;
  metodoHttp: string | null;
  ipOrigen: string | null;
  idTransaccion: string | null;
  duracionMs: number | null;
}

export interface AdAuditoriaFilters {
  usuarioAfectado?: string;
  accion?: string;
  resultado?: string;
  desde?: string;
  hasta?: string;
  limit?: number;
}
```

- [ ] **Step 2: Crear el servicio**

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AdAuditoria, AdAuditoriaFilters } from './ad-auditoria.model';

@Injectable({ providedIn: 'root' })
export class AdAuditoriaService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/auditoria/ad`;

  getMovimientos(filters: AdAuditoriaFilters): Observable<AdAuditoria[]> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && `${value}`.trim() !== '') {
        params = params.set(key, `${value}`);
      }
    });
    return this.http.get<AdAuditoria[]>(this.apiUrl, { params });
  }
}
```

- [ ] **Step 3: Verificar que el proyecto compila**

Run: `cd soportedesk-frontend && npx tsc --noEmit -p tsconfig.json`
Expected: sin errores nuevos relacionados a estos dos archivos (pueden existir warnings preexistentes no relacionados; ignorarlos).

- [ ] **Step 4: Commit**

```bash
git add soportedesk-frontend/src/app/features/auditoria/ad-auditoria.model.ts soportedesk-frontend/src/app/features/auditoria/ad-auditoria.service.ts
git commit -m "feat(auditoria-frontend): agrega modelo y servicio para GET /api/auditoria/ad"
```

---

### Task 9: Frontend — pestaña "Detalle AD" en `AuditoriaComponent`

**Files:**
- Modify: `soportedesk-frontend/src/app/features/auditoria/auditoria.component.ts`
- Modify: `soportedesk-frontend/src/app/features/auditoria/auditoria.component.html`
- Modify: `soportedesk-frontend/src/app/features/auditoria/auditoria.component.scss`

**Interfaces:**
- Consumes: `AdAuditoriaService`, `AdAuditoria`, `AdAuditoriaFilters` (Task 8).

- [ ] **Step 1: `auditoria.component.ts` — imports, inyección y estado de pestañas**

Agregar el import (después de `import { MovimientoAuditoria, MovimientoAuditoriaFilters } from './movimiento-auditoria.model';`, línea 7):

```typescript
import { AdAuditoria, AdAuditoriaFilters } from './ad-auditoria.model';
import { AdAuditoriaService } from './ad-auditoria.service';
```

Agregar la inyección (después de `private service = inject(AuditoriaService);`, línea 34):

```typescript
  private adService = inject(AdAuditoriaService);
```

Agregar, después del cierre del array `readonly acciones = [...]` (línea 63, justo antes de `readonly modulos = ...`), las propiedades de la pestaña AD:

```typescript
  activeTab: 'general' | 'ad' = 'general';

  readonly adAcciones = [
    'CREAR_USUARIO',
    'DESBLOQUEAR_CUENTA',
    'RESET_PASSWORD',
    'HABILITAR_CUENTA',
    'DESHABILITAR_CUENTA',
    'MOVER_OU',
    'AGREGAR_GRUPO',
    'QUITAR_GRUPO',
    'ACTUALIZAR_INFO',
    'ELIMINAR_USUARIO',
  ];

  adMovimientos: AdAuditoria[] = [];
  adLoading = false;
  adLoaded = false;
  adError = '';
  adSeleccionado: AdAuditoria | null = null;

  adFilters: AdAuditoriaFilters = {
    usuarioAfectado: '',
    accion: '',
    resultado: '',
    desde: '',
    hasta: '',
    limit: 100,
  };
```

- [ ] **Step 2: `auditoria.component.ts` — métodos de la pestaña AD**

Agregar, justo después del método `clearFilters(): void { ... }` (líneas 129-132), los nuevos métodos:

```typescript
  setTab(tab: 'general' | 'ad'): void {
    this.activeTab = tab;
    if (tab === 'ad' && !this.adLoaded) {
      this.loadAd();
    }
  }

  loadAd(): void {
    this.adLoading = true;
    this.adError = '';
    this.adService.getMovimientos(this.adFilters).subscribe({
      next: (rows) => {
        this.adMovimientos = rows;
        this.adLoading = false;
        this.adLoaded = true;
      },
      error: (err) => {
        this.adError = err?.error?.message ?? 'No se pudieron cargar los movimientos de Active Directory';
        this.adLoading = false;
      },
    });
  }

  clearAdFilters(): void {
    this.adFilters = { usuarioAfectado: '', accion: '', resultado: '', desde: '', hasta: '', limit: 100 };
    this.loadAd();
  }

  verDetalleAd(movimiento: AdAuditoria): void {
    this.adSeleccionado = movimiento;
  }

  cerrarDetalleAd(): void {
    this.adSeleccionado = null;
  }

  formatDuracion(ms: number | null): string {
    if (ms == null) {
      return '-';
    }
    return ms >= 1000 ? `${(ms / 1000).toFixed(1)} s` : `${ms} ms`;
  }
```

- [ ] **Step 3: `auditoria.component.html` — agregar el selector de pestañas**

Ubicar el cierre de `.module-header` (línea 22, `</div>`, justo antes de `<section class="filters">` en línea 24). Insertar entre ambos:

```html
  <div class="tabs">
    <button type="button" [class.active]="activeTab === 'general'" (click)="setTab('general')">General</button>
    <button type="button" [class.active]="activeTab === 'ad'" (click)="setTab('ad')">Detalle AD</button>
  </div>
```

- [ ] **Step 4: `auditoria.component.html` — envolver la vista "General" existente**

Ubicar la apertura `<section class="filters">` (línea 24) y el cierre del modal `app-modal` de "Detalle del movimiento" (línea 223, `</app-modal>` seguido de `}` en línea 223-224 antes del `</div>` final). Envolver TODO ese bloque (desde `<section class="filters">` hasta el `}` que cierra el `@if (movimientoSeleccionado; as movimiento) { ... }`) en un `@if (activeTab === 'general') { ... }`:

```html
  @if (activeTab === 'general') {
    <section class="filters">
      <!-- ... contenido existente sin cambios ... -->
    </section>

    @if (exportMessage) {
      <p class="export-message">{{ exportMessage }}</p>
    }

    <section class="audit-table">
      <!-- ... contenido existente sin cambios ... -->
    </section>

    @if (movimientoSeleccionado; as movimiento) {
      <app-modal title="Detalle del movimiento" [open]="true" (closed)="cerrarDetalle()">
        <!-- ... contenido existente sin cambios ... -->
      </app-modal>
    }
  }
```

(Solo se agregan la línea de apertura `@if (activeTab === 'general') {` justo antes de `<section class="filters">` y una línea de cierre `}` justo después del `</app-modal>` final, antes del `</div>` que cierra `.auditoria-page`. Todo el contenido intermedio, ya leído completo más arriba en esta sesión, se mantiene sin ninguna otra modificación.)

- [ ] **Step 5: `auditoria.component.html` — agregar la vista "Detalle AD"**

Insertar, justo después del `}` que cierra el bloque `@if (activeTab === 'general') { ... }` del Step 4, y antes del `</div>` final que cierra `.auditoria-page`:

```html
  @if (activeTab === 'ad') {
    <section class="filters">
      <div class="field field-search">
        <label>Usuario afectado</label>
        <input type="search" [(ngModel)]="adFilters.usuarioAfectado" placeholder="sAMAccountName" autocomplete="off" />
      </div>
      <div class="field">
        <label>Acción</label>
        <select [(ngModel)]="adFilters.accion">
          <option value="">Todas</option>
          @for (accion of adAcciones; track accion) {
            <option [value]="accion">{{ accion }}</option>
          }
        </select>
      </div>
      <div class="field">
        <label>Resultado</label>
        <select [(ngModel)]="adFilters.resultado">
          <option value="">Todos</option>
          <option value="EXITOSO">Exitoso</option>
          <option value="FALLIDO">Fallido</option>
        </select>
      </div>
      <div class="field">
        <label>Desde</label>
        <input type="date" [(ngModel)]="adFilters.desde" />
      </div>
      <div class="field">
        <label>Hasta</label>
        <input type="date" [(ngModel)]="adFilters.hasta" />
      </div>
      <div class="filter-actions">
        <button type="button" class="btn btn-primary" (click)="loadAd()">Filtrar</button>
        <button type="button" class="btn btn-ghost" (click)="clearAdFilters()">Limpiar</button>
      </div>
    </section>

    <section class="audit-table">
      @if (adLoading) {
        <div class="table-state">Cargando movimientos de Active Directory...</div>
      }
      @if (!adLoading && adError) {
        <div class="table-state error">{{ adError }}</div>
      }
      @if (!adLoading && !adError) {
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Fecha y hora</th>
                <th>Realizado por</th>
                <th>Usuario afectado</th>
                <th>Acción</th>
                <th>Resultado</th>
                <th>Duración</th>
                <th class="actions-heading">Detalle</th>
              </tr>
            </thead>
            <tbody>
              @for (movimiento of adMovimientos; track movimiento.id) {
                <tr>
                  <td class="fecha" data-label="Fecha y hora">
                    <div class="fecha-value">
                      <strong>{{ formatFechaDia(movimiento.fechaRegistro) }}</strong>
                      <span>{{ formatHora(movimiento.fechaRegistro) }}</span>
                    </div>
                  </td>
                  <td data-label="Realizado por">
                    <div class="usuario">
                      <span class="user-avatar">{{ movimiento.operadorUsuario.charAt(0).toUpperCase() }}</span>
                      <strong>{{ movimiento.operadorUsuario }}</strong>
                    </div>
                  </td>
                  <td data-label="Usuario afectado">{{ movimiento.usuarioAfectado }}</td>
                  <td data-label="Acción">
                    <span class="accion-badge" [ngClass]="accionClass(movimiento.accion)">{{ movimiento.accion }}</span>
                  </td>
                  <td data-label="Resultado">
                    <span class="http-badge" [class.http-badge--error]="movimiento.resultado === 'FALLIDO'">
                      {{ movimiento.resultado }}
                    </span>
                  </td>
                  <td data-label="Duración">{{ formatDuracion(movimiento.duracionMs) }}</td>
                  <td data-label="Detalle" class="actions-cell">
                    <button
                      type="button"
                      class="btn-view-record"
                      (click)="verDetalleAd(movimiento)"
                      [attr.aria-label]="'Ver detalle del cambio de ' + movimiento.usuarioAfectado"
                      >
                      <i class="ti ti-eye" aria-hidden="true"></i><span>Ver detalle</span>
                    </button>
                  </td>
                </tr>
              }
              @if (adMovimientos.length === 0) {
                <tr>
                  <td colspan="7" class="empty">No hay movimientos de Active Directory para los filtros seleccionados</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>

    @if (adSeleccionado; as movimiento) {
      <app-modal title="Detalle del cambio en Active Directory" [open]="true" (closed)="cerrarDetalleAd()">
        <div class="movement-detail">
          <div class="detail-summary">
            <div class="detail-user">
              <span class="user-avatar user-avatar--large">{{ movimiento.operadorUsuario.charAt(0).toUpperCase() }}</span>
              <div>
                <small>Realizado por</small>
                <strong>{{ movimiento.operadorUsuario }}</strong>
              </div>
            </div>
            <span class="http-badge" [class.http-badge--error]="movimiento.resultado === 'FALLIDO'">
              {{ movimiento.resultado }}
            </span>
          </div>
          <section class="change-detail">
            <span>CAMBIO REALIZADO</span>
            <p>{{ movimiento.mensaje }}</p>
          </section>
          @if (movimiento.estadoAnterior || movimiento.estadoNuevo) {
            <section class="state-diff">
              <span>ESTADO ANTERIOR</span>
              <strong>{{ movimiento.estadoAnterior || 'No disponible' }}</strong>
              <span class="state-diff-arrow">&rarr;</span>
              <span>ESTADO NUEVO</span>
              <strong>{{ movimiento.estadoNuevo || 'No disponible' }}</strong>
            </section>
          }
          @if (movimiento.detalleError) {
            <section class="change-detail">
              <span>CONTEXTO ADICIONAL</span>
              <p>{{ movimiento.detalleError }}</p>
            </section>
          }
          <dl class="detail-grid">
            <div>
              <dt>Fecha</dt>
              <dd>{{ formatFechaDia(movimiento.fechaRegistro) }}</dd>
            </div>
            <div>
              <dt>Hora exacta</dt>
              <dd>{{ formatHora(movimiento.fechaRegistro) }}</dd>
            </div>
            <div>
              <dt>Usuario afectado</dt>
              <dd>{{ movimiento.usuarioAfectado }}</dd>
            </div>
            <div>
              <dt>Duración</dt>
              <dd>{{ formatDuracion(movimiento.duracionMs) }}</dd>
            </div>
            <div>
              <dt>Dirección IP</dt>
              <dd class="monospace">{{ movimiento.ipOrigen || 'No disponible' }}</dd>
            </div>
            <div>
              <dt>ID de transacción</dt>
              <dd class="monospace">{{ movimiento.idTransaccion || 'No disponible' }}</dd>
            </div>
          </dl>
          <div class="route-detail">
            <span>RUTA DEL RECURSO</span>
            <code>{{ movimiento.metodoHttp }} {{ movimiento.endPoint }}</code>
          </div>
        </div>
      </app-modal>
    }
  }
```

- [ ] **Step 6: `auditoria.component.scss` — estilos de pestañas y del diff de estado**

Agregar al inicio del archivo, después del bloque `.auditoria-page { ... }` (línea 4):

```scss
.tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--color-border);

  button {
    flex: 0 0 auto;
    padding: 9px 14px;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    border-radius: var(--radius-sm) var(--radius-sm) 0 0;
    font-weight: 700;
    color: var(--color-text-secondary);
    cursor: pointer;

    &.active {
      border-bottom-color: var(--color-accent);
      color: var(--color-accent);
    }
  }
}

.state-diff {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 10px;
  padding: 12px;
  margin: 12px 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface-subtle, var(--color-surface));

  span {
    font-size: 11px;
    font-weight: 800;
    color: var(--color-text-secondary);
    text-transform: uppercase;
  }

  strong {
    display: block;
    font-size: 14px;
  }

  .state-diff-arrow {
    grid-row: 1 / span 2;
    justify-self: center;
    font-size: 18px;
    color: var(--color-accent);
  }
}
```

- [ ] **Step 7: Verificar que el proyecto compila**

Run: `cd soportedesk-frontend && npx tsc --noEmit -p tsconfig.json`
Expected: sin errores nuevos.

- [ ] **Step 8: Commit**

```bash
git add soportedesk-frontend/src/app/features/auditoria/auditoria.component.ts soportedesk-frontend/src/app/features/auditoria/auditoria.component.html soportedesk-frontend/src/app/features/auditoria/auditoria.component.scss
git commit -m "feat(auditoria-frontend): agrega pestana Detalle AD con estado anterior/nuevo"
```

---

### Task 10 (manual): Verificación visual en el navegador

- [ ] **Step 1:** Levantar el frontend (`npm start` o el comando ya configurado en `soportedesk-frontend`) y el backend.
- [ ] **Step 2:** Iniciar sesión como usuario con rol ADMIN o permiso `READ_auditoria`, ir a **Auditoría**.
- [ ] **Step 3:** Confirmar que la pestaña "General" se ve y funciona exactamente igual que antes (sin regresión).
- [ ] **Step 4:** Cambiar a la pestaña "Detalle AD" y confirmar que carga (aunque sea con las 60 filas de prueba históricas si no se ejecutó la Task 7).
- [ ] **Step 5:** Abrir el detalle de una fila y confirmar que se ve el bloque "Estado anterior → Estado nuevo".
- [ ] **Step 6:** Probar los filtros (usuario afectado, acción, resultado, fechas) y el botón "Limpiar".

---

## Self-Review

**Cobertura del spec:** Sección 3 (columnas) → Task 1. Sección 4.1 (componentes backend) → Tasks 1-3. Sección 4.2 (puntos de integración) → Tasks 5-6. Sección 4.3 (mapeo de etiquetas por acción) → Tasks 4-6, cada fila de la tabla del spec tiene su lambda correspondiente. Sección 5 (frontend) → Tasks 8-9. Sección 6 (manejo de errores no bloqueante) → `AdAuditoriaService.registrar` con try/catch interno (Task 2) + test dedicado. Sección 7 (testing) → tests unitarios (Tasks 2, 4) e IT (Task 3), más verificación manual (Tasks 7, 10) para lo que requiere LDAP real. Sección 8 (fuera de alcance) → respetado, no se tocó `movimientos_auditoria` ni `AuditoriaFilter`.

**Placeholders:** ninguno — todos los pasos tienen código completo o comandos concretos.

**Consistencia de tipos:** `AdAuditoriaRegistro` (Task 1) se usa con los mismos 18 campos en `AdAuditoriaService.registrar` (Task 2) y en `auditAd(...)` de `ActiveDirectoryService` (Task 4). `AdAuditoriaDetalle(estadoAnterior, estadoNuevo, detalleExito)` (Task 4) se construye igual en los 6 sitios de Task 5. `describirCambiosInfo` se declara en Task 4 con visibilidad de paquete (sin modificador) y se llama igual en Task 5 (`ACTUALIZAR_INFO`) y se testea igual en Task 4.
