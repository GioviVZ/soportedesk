# VPN Solicitudes/Aprobación Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single-step VPN CRUD with a two-role request/approval workflow: assistants submit a solicitud with verification checks (antivirus, GLPI equipment lookup), responsables approve (setting VPN credentials), reject, or observe (with mandatory comment).

**Architecture:** The existing `vpn` table gains workflow columns (`estado_solicitud`, checks, GLPI snapshot, requester/approver audit trail) instead of a new table. Two new granular permissions (`solicitar-vpn`, `aprobar-vpn`) gate the two roles, following the existing `credenciales-vpn` pseudo-module pattern. New endpoints (`/aprobar`, `/rechazar`, `/observar`) drive state transitions; `POST`/`PUT` are repurposed for creating/editing solicitudes. Frontend keeps the existing `GenericTableComponent` list and moves all new actions into the existing "Detalle VPN" modal (same place "Editar antivirus" already lives), since that component ties Add/Edit/Delete to a single `canEdit` flag with no per-row action slot.

**Tech Stack:** Spring Boot 3 / Java, JPA (SQL Server `ssti` primary datasource + read-only MySQL `glpi` datasource), Angular 17+ standalone components, JUnit + Mockito + MockMvc (backend), Karma/Jasmine (frontend).

## Global Constraints

- Migration SQL targets SQL Server (`ssti`) — use `IF COL_LENGTH(...) IS NULL BEGIN ALTER TABLE ... ADD ... END` / `GO` batches, `NVARCHAR`, `BIT`, `DATETIME`, `GETDATE()` (see `docs/superpowers/migrations/2026-07-04-equipos-enrichment.sql` for the exact idiom).
- No new JPA relationship crosses the `ssti`/`glpi` datasource boundary — GLPI equipment link is a plain `Long` (`glpiComputerId`), snapshotted at write time, same pattern as `EquipoEnrichment.computerId`.
- Audit fields (`solicitadoPor`, `aprobadoPor`) are plain username strings, not FKs to `Usuario` — same pattern as `EquipoEnrichment.revisadoPor` / `EquipoEnrichmentHistorial.modificadoPor`.
- Invalid state transitions throw `IllegalArgumentException` (already mapped to `409 Conflict` by the existing `GlobalExceptionHandler` — no new exception type).
- `VpnDatosRequest.java` (backend) and `vpn-datos-form.component.{ts,html}` (frontend) are dead code with zero references — delete them, do not touch/revive them.
- Full spec: `docs/superpowers/specs/2026-07-07-vpn-solicitudes-design.md`.

---

## Task 1: Migration SQL

**Files:**
- Create: `docs/superpowers/migrations/2026-07-07-vpn-solicitudes.sql`

**Interfaces:**
- Produces: the 13 new columns on `dbo.vpn` that every backend task in this plan assumes exist:
  `estado_solicitud`, `tipo_equipo`, `glpi_computer_id`, `glpi_nombre_equipo`, `glpi_ip_equipo`,
  `antivirus_verificado`, `analisis_antivirus_realizado`, `host_actualizado`,
  `comentario_responsable`, `solicitado_por`, `solicitado_por_nombre`, `fecha_solicitud`,
  `aprobado_por`, `aprobado_por_nombre`, `fecha_resolucion`.

- [ ] **Step 1: Write the migration file**

```sql
-- Migracion: flujo de solicitud/aprobacion para VPN
-- Ejecutar en: ssti (SQL Server)
-- Idempotente: se puede volver a ejecutar sin duplicar columnas.

IF COL_LENGTH('dbo.vpn', 'estado_solicitud') IS NULL
BEGIN
    ALTER TABLE dbo.vpn ADD estado_solicitud NVARCHAR(20) NOT NULL CONSTRAINT df_vpn_estado_solicitud DEFAULT 'PENDIENTE';
END;
GO

IF COL_LENGTH('dbo.vpn', 'tipo_equipo') IS NULL
BEGIN
    ALTER TABLE dbo.vpn ADD tipo_equipo NVARCHAR(20) NULL;
END;
GO

IF COL_LENGTH('dbo.vpn', 'glpi_computer_id') IS NULL
BEGIN
    ALTER TABLE dbo.vpn ADD glpi_computer_id BIGINT NULL;
END;
GO

IF COL_LENGTH('dbo.vpn', 'glpi_nombre_equipo') IS NULL
BEGIN
    ALTER TABLE dbo.vpn ADD glpi_nombre_equipo NVARCHAR(255) NULL;
END;
GO

IF COL_LENGTH('dbo.vpn', 'glpi_ip_equipo') IS NULL
BEGIN
    ALTER TABLE dbo.vpn ADD glpi_ip_equipo NVARCHAR(50) NULL;
END;
GO

IF COL_LENGTH('dbo.vpn', 'antivirus_verificado') IS NULL
BEGIN
    ALTER TABLE dbo.vpn ADD antivirus_verificado BIT NULL;
END;
GO

IF COL_LENGTH('dbo.vpn', 'analisis_antivirus_realizado') IS NULL
BEGIN
    ALTER TABLE dbo.vpn ADD analisis_antivirus_realizado BIT NULL;
END;
GO

IF COL_LENGTH('dbo.vpn', 'host_actualizado') IS NULL
BEGIN
    ALTER TABLE dbo.vpn ADD host_actualizado BIT NULL;
END;
GO

IF COL_LENGTH('dbo.vpn', 'comentario_responsable') IS NULL
BEGIN
    ALTER TABLE dbo.vpn ADD comentario_responsable NVARCHAR(500) NULL;
END;
GO

IF COL_LENGTH('dbo.vpn', 'solicitado_por') IS NULL
BEGIN
    ALTER TABLE dbo.vpn ADD solicitado_por NVARCHAR(80) NOT NULL CONSTRAINT df_vpn_solicitado_por DEFAULT 'sistema';
END;
GO

IF COL_LENGTH('dbo.vpn', 'solicitado_por_nombre') IS NULL
BEGIN
    ALTER TABLE dbo.vpn ADD solicitado_por_nombre NVARCHAR(150) NULL;
END;
GO

IF COL_LENGTH('dbo.vpn', 'fecha_solicitud') IS NULL
BEGIN
    ALTER TABLE dbo.vpn ADD fecha_solicitud DATETIME NOT NULL CONSTRAINT df_vpn_fecha_solicitud DEFAULT GETDATE();
END;
GO

IF COL_LENGTH('dbo.vpn', 'aprobado_por') IS NULL
BEGIN
    ALTER TABLE dbo.vpn ADD aprobado_por NVARCHAR(80) NULL;
END;
GO

IF COL_LENGTH('dbo.vpn', 'aprobado_por_nombre') IS NULL
BEGIN
    ALTER TABLE dbo.vpn ADD aprobado_por_nombre NVARCHAR(150) NULL;
END;
GO

IF COL_LENGTH('dbo.vpn', 'fecha_resolucion') IS NULL
BEGIN
    ALTER TABLE dbo.vpn ADD fecha_resolucion DATETIME NULL;
END;
GO

-- Los registros VPN existentes ya tienen usuario/contrasena asignados: se consideran
-- aprobados retroactivamente para que no aparezcan como solicitudes pendientes.
UPDATE dbo.vpn
SET estado_solicitud = 'APROBADO'
WHERE usuario_vpn IS NOT NULL AND usuario_vpn <> '';
GO

-- Verificacion
SELECT estado_solicitud, COUNT(*) AS filas FROM dbo.vpn GROUP BY estado_solicitud;
GO
```

- [ ] **Step 2: Ask the user to run this migration against the `ssti` SQL Server database**

This plan does not execute the migration automatically — SQL Server credentials/access are
environment-specific. Confirm with the user that the migration ran successfully (the verification
`SELECT` at the end should show existing VPN rows as `APROBADO`) before starting Task 3, since the
entity/repository/service tasks assume these columns exist.

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/migrations/2026-07-07-vpn-solicitudes.sql
git commit -m "feat(vpn): add solicitud/aprobacion workflow columns to vpn table"
```

---

## Task 2: Permisos — `solicitar-vpn` / `aprobar-vpn`

**Files:**
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/auth/Modulos.java`
- Modify: `soportedesk-backend/src/test/java/com/inia/soportedesk/auth/ModulosTest.java`
- Modify: `soportedesk-frontend/src/app/features/usuarios-sistema/usuario-sistema.model.ts`

**Interfaces:**
- Produces: `Modulos.VALIDOS` containing `"solicitar-vpn"` and `"aprobar-vpn"`, so
  `UsuarioSistemaService` (which validates every permiso key against `Modulos.VALIDOS`, see
  `UsuarioSistemaService.java:80`) accepts them, and admins can assign them from the "Usuarios del
  Sistema" screen via the `MODULOS` catalog.

- [ ] **Step 1: Update the failing test first**

Edit `soportedesk-backend/src/test/java/com/inia/soportedesk/auth/ModulosTest.java`:

```java
package com.inia.soportedesk.auth;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ModulosTest {

    @Test
    void validos_containsAllModuleKeys() {
        assertThat(Modulos.VALIDOS).containsExactlyInAnyOrder(
                "usuarios-red", "correos", "equipos", "vpn", "credenciales-vpn",
                "solicitar-vpn", "aprobar-vpn",
                "impresoras", "wifi", "licencias", "catalogos",
                "auditoria", "herramientas");
    }

    @Test
    void soloVista_isSubsetOfValidos() {
        assertThat(Modulos.SOLO_VISTA).containsExactlyInAnyOrder(
                "auditoria", "herramientas");
        assertThat(Modulos.VALIDOS).containsAll(Modulos.SOLO_VISTA);
    }
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd soportedesk-backend && ./mvnw test -Dtest=ModulosTest -q`
Expected: FAIL — `validos_containsAllModuleKeys` fails because `Modulos.VALIDOS` doesn't contain
`solicitar-vpn`/`aprobar-vpn` yet.

- [ ] **Step 3: Update `Modulos.java`**

```java
package com.inia.soportedesk.auth;

import java.util.Set;

public final class Modulos {

    public static final Set<String> SOLO_VISTA = Set.of(
            "auditoria", "herramientas");

    public static final Set<String> VALIDOS = Set.of(
            "usuarios-red", "correos", "equipos", "vpn", "credenciales-vpn",
            "solicitar-vpn", "aprobar-vpn",
            "impresoras", "wifi", "licencias", "catalogos",
            "auditoria", "herramientas");

    private Modulos() {
    }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd soportedesk-backend && ./mvnw test -Dtest=ModulosTest -q`
Expected: PASS

- [ ] **Step 5: Add the two new entries to the frontend permission catalog**

Edit `soportedesk-frontend/src/app/features/usuarios-sistema/usuario-sistema.model.ts`, in the
`MODULOS` array, right after the `credenciales-vpn` entry:

```typescript
  { key: 'credenciales-vpn', label: 'Credenciales VPN', kind: 'write', group: 'Redes y Accesos' },
  {
    key: 'solicitar-vpn',
    label: 'Solicitar VPN',
    kind: 'write',
    group: 'Redes y Accesos',
    description: 'Permite crear y reenviar solicitudes de acceso VPN (rol asistente).',
  },
  {
    key: 'aprobar-vpn',
    label: 'Aprobar VPN',
    kind: 'write',
    group: 'Redes y Accesos',
    description: 'Permite aprobar, rechazar u observar solicitudes de acceso VPN (rol responsable).',
  },
```

- [ ] **Step 6: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/auth/Modulos.java \
        soportedesk-backend/src/test/java/com/inia/soportedesk/auth/ModulosTest.java \
        soportedesk-frontend/src/app/features/usuarios-sistema/usuario-sistema.model.ts
git commit -m "feat(vpn): add solicitar-vpn and aprobar-vpn permission modules"
```

---

## Task 3: `Vpn` entity — add workflow fields

**Files:**
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/vpn/Vpn.java`

**Interfaces:**
- Consumes: nothing new (existing entity).
- Produces: getters/setters used by every later backend task —
  `getEstadoSolicitud()/setEstadoSolicitud(String)`, `getTipoEquipo()/setTipoEquipo(String)`,
  `getGlpiComputerId()/setGlpiComputerId(Long)`, `getGlpiNombreEquipo()/setGlpiNombreEquipo(String)`,
  `getGlpiIpEquipo()/setGlpiIpEquipo(String)`, `getAntivirusVerificado()/setAntivirusVerificado(Boolean)`,
  `getAnalisisAntivirusRealizado()/setAnalisisAntivirusRealizado(Boolean)`,
  `getHostActualizado()/setHostActualizado(Boolean)`,
  `getComentarioResponsable()/setComentarioResponsable(String)`,
  `getSolicitadoPor()/setSolicitadoPor(String)`, `getSolicitadoPorNombre()/setSolicitadoPorNombre(String)`,
  `getFechaSolicitud()/setFechaSolicitud(LocalDateTime)`,
  `getAprobadoPor()/setAprobadoPor(String)`, `getAprobadoPorNombre()/setAprobadoPorNombre(String)`,
  `getFechaResolucion()/setFechaResolucion(LocalDateTime)`.

There is no dedicated entity test in this codebase (verified: no `VpnTest.java` exists) — this
task is verified indirectly by Task 5's `VpnServiceTest`, so there is no isolated test step here.
Compile-check is the verification.

- [ ] **Step 1: Add the new fields to `Vpn.java`**

```java
package com.inia.soportedesk.vpn;

import com.inia.soportedesk.equipos.Equipo;
import com.inia.soportedesk.usuariosred.UsuarioRed;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "vpn")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Vpn {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "usuario_red_id")
    private UsuarioRed usuarioRed;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "equipo_id")
    private Equipo equipo;

    @Column(name = "ip_asignada")
    private String ipAsignada;

    private LocalDate vence;

    @Column(nullable = false)
    private String estado;

    @Column(name = "tiene_antivirus")
    private Boolean tieneAntivirus;

    @Column(name = "vencimiento_antivirus")
    private LocalDate vencimientoAntivirus;

    @Column(name = "usuario_vpn")
    private String usuarioVpn;

    @Column(name = "credencial_vpn")
    private String credencialVpn;

    @Column(name = "estado_solicitud", nullable = false)
    private String estadoSolicitud = "PENDIENTE";

    @Column(name = "tipo_equipo")
    private String tipoEquipo;

    @Column(name = "glpi_computer_id")
    private Long glpiComputerId;

    @Column(name = "glpi_nombre_equipo")
    private String glpiNombreEquipo;

    @Column(name = "glpi_ip_equipo")
    private String glpiIpEquipo;

    @Column(name = "antivirus_verificado")
    private Boolean antivirusVerificado;

    @Column(name = "analisis_antivirus_realizado")
    private Boolean analisisAntivirusRealizado;

    @Column(name = "host_actualizado")
    private Boolean hostActualizado;

    @Column(name = "comentario_responsable", length = 500)
    private String comentarioResponsable;

    @Column(name = "solicitado_por", nullable = false)
    private String solicitadoPor;

    @Column(name = "solicitado_por_nombre")
    private String solicitadoPorNombre;

    @Column(name = "fecha_solicitud", nullable = false)
    private LocalDateTime fechaSolicitud;

    @Column(name = "aprobado_por")
    private String aprobadoPor;

    @Column(name = "aprobado_por_nombre")
    private String aprobadoPorNombre;

    @Column(name = "fecha_resolucion")
    private LocalDateTime fechaResolucion;
}
```

- [ ] **Step 2: Compile-check**

Run: `cd soportedesk-backend && ./mvnw compile -q`
Expected: BUILD SUCCESS (nothing else references the old constructor shape positionally — verified
via `grep -rn "new Vpn(" soportedesk-backend/src` returning only no-arg `new Vpn()` call sites).

- [ ] **Step 3: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/vpn/Vpn.java
git commit -m "feat(vpn): add solicitud workflow fields to Vpn entity"
```

---

## Task 4: DTOs — `VpnRequest` rewrite, `VpnAprobarRequest`, `VpnResolucionRequest`, delete `VpnDatosRequest`

**Files:**
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/vpn/VpnRequest.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/vpn/VpnAprobarRequest.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/vpn/VpnResolucionRequest.java`
- Delete: `soportedesk-backend/src/main/java/com/inia/soportedesk/vpn/VpnDatosRequest.java`

**Interfaces:**
- Produces: `VpnRequest` (`usuarioRedId: Long @NotNull`, `tipoEquipo: String @NotBlank`,
  `glpiComputerId: Long`, `antivirusVerificado: Boolean`, `analisisAntivirusRealizado: Boolean`,
  `hostActualizado: Boolean`), `VpnAprobarRequest` (`usuarioVpn/credencialVpn/ipAsignada/estado:
  String @NotBlank`, `vence: LocalDate`), `VpnResolucionRequest` (`comentarioResponsable: String
  @NotBlank`) — consumed by Task 6/7's `VpnController`.

There's no dedicated DTO unit test in this codebase (validation is exercised indirectly through
`VpnControllerIT` in Task 7). This task is verified by compilation plus Task 5/6/7's tests.

- [ ] **Step 1: Confirm `VpnDatosRequest.java` really has zero references before deleting**

Run: `grep -rn "VpnDatosRequest" soportedesk-backend/src`
Expected: no output (already confirmed during spec research — this is a final safety check before
deleting).

- [ ] **Step 2: Delete the dead DTO**

```bash
git rm soportedesk-backend/src/main/java/com/inia/soportedesk/vpn/VpnDatosRequest.java
```

- [ ] **Step 3: Rewrite `VpnRequest.java`**

```java
package com.inia.soportedesk.vpn;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VpnRequest {

    @NotNull
    private Long usuarioRedId;

    @NotBlank
    private String tipoEquipo;

    private Long glpiComputerId;

    private Boolean antivirusVerificado;

    private Boolean analisisAntivirusRealizado;

    private Boolean hostActualizado;
}
```

- [ ] **Step 4: Create `VpnAprobarRequest.java`**

```java
package com.inia.soportedesk.vpn;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class VpnAprobarRequest {

    @NotBlank
    private String usuarioVpn;

    @NotBlank
    private String credencialVpn;

    @NotBlank
    private String ipAsignada;

    private LocalDate vence;

    @NotBlank
    private String estado;
}
```

- [ ] **Step 5: Create `VpnResolucionRequest.java`**

```java
package com.inia.soportedesk.vpn;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VpnResolucionRequest {

    @NotBlank
    private String comentarioResponsable;
}
```

- [ ] **Step 6: Compile-check**

Run: `cd soportedesk-backend && ./mvnw compile -q`
Expected: BUILD FAILURE — `VpnService.java`, `VpnController.java`, `VpnServiceTest.java`,
`VpnControllerIT.java` still reference the old `VpnRequest` fields (`equipoId`, `ipAsignada`,
`vence`, `estado`, `usuarioVpn`, `credencialVpn`). This is expected; Tasks 5–7 fix it. Do not
proceed to "fix" `VpnService`/`VpnController` in this task — that's Tasks 5 and 7.

- [ ] **Step 7: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/vpn/VpnRequest.java \
        soportedesk-backend/src/main/java/com/inia/soportedesk/vpn/VpnAprobarRequest.java \
        soportedesk-backend/src/main/java/com/inia/soportedesk/vpn/VpnResolucionRequest.java
git commit -m "feat(vpn): rewrite VpnRequest for solicitud shape, add aprobar/resolucion DTOs"
```

(The repo will not compile between this commit and Task 5's commit — that's expected mid-refactor
state within this plan; do not push or merge until Task 7 is done.)

---

## Task 5: `VpnRepository` — count and search additions

**Files:**
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/vpn/VpnRepository.java`

**Interfaces:**
- Consumes: `Vpn.solicitadoPorNombre`, `Vpn.estadoSolicitud` (Task 3).
- Produces: `long countByEstadoSolicitud(String estadoSolicitud)` — consumed by Task 9's
  `DashboardService`.

- [ ] **Step 1: Update `VpnRepository.java`**

```java
package com.inia.soportedesk.vpn;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface VpnRepository extends JpaRepository<Vpn, Long> {

    Optional<Vpn> findFirstByEquipoId(Long equipoId);

    Optional<Vpn> findFirstByUsuarioRedId(Long usuarioRedId);

    long countByEstadoSolicitud(String estadoSolicitud);

    @Query("SELECT v FROM Vpn v LEFT JOIN v.usuarioRed u LEFT JOIN v.equipo e WHERE " +
           "LOWER(u.nombre) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.usuario) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(e.marca) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(e.modelo) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(v.ipAsignada) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(v.usuarioVpn) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(v.solicitadoPorNombre) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<Vpn> search(@Param("search") String search);
}
```

- [ ] **Step 2: Compile-check**

Run: `cd soportedesk-backend && ./mvnw compile -q`
Expected: still BUILD FAILURE (same reason as Task 4 Step 6 — `VpnService`/`VpnController` not
updated yet). Confirm the *new* errors are limited to `VpnService.java`/`VpnController.java`/test
files, not `VpnRepository.java`.

- [ ] **Step 3: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/vpn/VpnRepository.java
git commit -m "feat(vpn): add countByEstadoSolicitud and extend search to solicitante"
```

---

## Task 6: `VpnService` — solicitud/aprobación business logic

**Files:**
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/vpn/VpnService.java`
- Modify: `soportedesk-backend/src/test/java/com/inia/soportedesk/vpn/VpnServiceTest.java`

**Interfaces:**
- Consumes: `VwInvComputerFullRepository` (`soportedesk-backend/src/main/java/com/inia/soportedesk/glpi/VwInvComputerFullRepository.java`, extends `JpaRepository<VwInvComputerFull, Long>` so `findById(Long)` is available), `UsuarioRepository.findByUsername(String): Optional<Usuario>` (`soportedesk-backend/src/main/java/com/inia/soportedesk/auth/UsuarioRepository.java`), `Vpn`/DTOs from Tasks 3–4.
- Produces: `crearSolicitud(VpnRequest, Authentication): Vpn`, `actualizarSolicitud(Long, VpnRequest, Authentication): Vpn`, `aprobar(Long, VpnAprobarRequest, Authentication): Vpn`, `rechazar(Long, VpnResolucionRequest, Authentication): Vpn`, `observar(Long, VpnResolucionRequest, Authentication): Vpn` — all consumed by Task 7's `VpnController`. `maskCredencialesIfNeeded` keeps its existing signature but adds the "own request" exception.

- [ ] **Step 1: Rewrite `VpnServiceTest.java` with the new test cases (written first, will fail to compile until Step 3)**

```java
package com.inia.soportedesk.vpn;

import com.inia.soportedesk.auth.Usuario;
import com.inia.soportedesk.auth.UsuarioRepository;
import com.inia.soportedesk.exception.ResourceNotFoundException;
import com.inia.soportedesk.glpi.VwInvComputerFull;
import com.inia.soportedesk.glpi.VwInvComputerFullRepository;
import com.inia.soportedesk.usuariosred.UsuarioRed;
import com.inia.soportedesk.usuariosred.UsuarioRedRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VpnServiceTest {

    @Mock
    private VpnRepository repository;

    @Mock
    private UsuarioRedRepository usuarioRedRepository;

    @Mock
    private VwInvComputerFullRepository glpiRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @InjectMocks
    private VpnService service;

    private VpnRequest sampleRequest() {
        VpnRequest request = new VpnRequest();
        request.setUsuarioRedId(1L);
        request.setTipoEquipo("PERSONAL");
        request.setAntivirusVerificado(true);
        request.setAnalisisAntivirusRealizado(true);
        return request;
    }

    private Authentication authAs(String username, String... authorities) {
        Authentication auth = mock(Authentication.class);
        List<GrantedAuthority> granted = List.of(authorities).stream()
                .map(SimpleGrantedAuthority::new)
                .map(GrantedAuthority.class::cast)
                .toList();
        // lenient(): most tests using this helper never call getAuthorities() (only
        // maskCredencialesIfNeeded does) — MockitoExtension's strict stubbing would otherwise
        // fail those tests with UnnecessaryStubbingException.
        org.mockito.Mockito.lenient().when(auth.getName()).thenReturn(username);
        org.mockito.Mockito.lenient().doReturn(granted).when(auth).getAuthorities();
        return auth;
    }

    @Test
    void findAll_withoutSearch_returnsAll() {
        Vpn vpn = new Vpn();
        vpn.setEstadoSolicitud("PENDIENTE");
        when(repository.findAll()).thenReturn(List.of(vpn));

        List<Vpn> result = service.findAll(null);

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
    void crearSolicitud_withoutGlpiEquipo_savesPendingRequest() {
        UsuarioRed mockUser = new UsuarioRed();
        mockUser.setId(1L);
        mockUser.setNombre("Juan Pérez");
        when(usuarioRedRepository.findById(1L)).thenReturn(Optional.of(mockUser));
        when(usuarioRepository.findByUsername("jasistente")).thenReturn(Optional.empty());
        when(repository.save(any(Vpn.class))).thenAnswer(inv -> inv.getArgument(0));

        Vpn result = service.crearSolicitud(sampleRequest(), authAs("jasistente"));

        assertThat(result.getEstadoSolicitud()).isEqualTo("PENDIENTE");
        assertThat(result.getSolicitadoPor()).isEqualTo("jasistente");
        assertThat(result.getTipoEquipo()).isEqualTo("PERSONAL");
        assertThat(result.getGlpiComputerId()).isNull();
        assertThat(result.getFechaSolicitud()).isNotNull();
    }

    @Test
    void crearSolicitud_withGlpiEquipo_snapshotsHostAndIp() {
        UsuarioRed mockUser = new UsuarioRed();
        mockUser.setId(1L);
        when(usuarioRedRepository.findById(1L)).thenReturn(Optional.of(mockUser));
        when(usuarioRepository.findByUsername(any())).thenReturn(Optional.empty());

        VwInvComputerFull equipo = new VwInvComputerFull();
        equipo.setComputerID(42L);
        equipo.setNombreEquipo("PC-CONTABILIDAD-01");
        equipo.setIpEquipo("172.16.10.5");
        when(glpiRepository.findById(42L)).thenReturn(Optional.of(equipo));
        when(repository.save(any(Vpn.class))).thenAnswer(inv -> inv.getArgument(0));

        VpnRequest request = sampleRequest();
        request.setTipoEquipo("INIA");
        request.setGlpiComputerId(42L);
        request.setHostActualizado(true);

        Vpn result = service.crearSolicitud(request, authAs("jasistente"));

        assertThat(result.getGlpiComputerId()).isEqualTo(42L);
        assertThat(result.getGlpiNombreEquipo()).isEqualTo("PC-CONTABILIDAD-01");
        assertThat(result.getGlpiIpEquipo()).isEqualTo("172.16.10.5");
        assertThat(result.getHostActualizado()).isTrue();
    }

    @Test
    void crearSolicitud_withUnknownGlpiId_throwsResourceNotFoundException() {
        when(usuarioRedRepository.findById(1L)).thenReturn(Optional.of(new UsuarioRed()));
        when(glpiRepository.findById(999L)).thenReturn(Optional.empty());

        VpnRequest request = sampleRequest();
        request.setGlpiComputerId(999L);

        assertThatThrownBy(() -> service.crearSolicitud(request, authAs("jasistente")))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void actualizarSolicitud_whenObservado_savesAndReturnsToPendiente() {
        Vpn existing = new Vpn();
        existing.setId(5L);
        existing.setEstadoSolicitud("OBSERVADO");
        when(repository.findById(5L)).thenReturn(Optional.of(existing));
        when(usuarioRedRepository.findById(1L)).thenReturn(Optional.of(new UsuarioRed()));
        when(repository.save(any(Vpn.class))).thenAnswer(inv -> inv.getArgument(0));

        Vpn result = service.actualizarSolicitud(5L, sampleRequest(), authAs("jasistente"));

        assertThat(result.getEstadoSolicitud()).isEqualTo("PENDIENTE");
    }

    @Test
    void actualizarSolicitud_whenAprobado_throwsIllegalArgumentException() {
        Vpn existing = new Vpn();
        existing.setId(5L);
        existing.setEstadoSolicitud("APROBADO");
        when(repository.findById(5L)).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> service.actualizarSolicitud(5L, sampleRequest(), authAs("jasistente")))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void aprobar_whenPendiente_setsCredentialsAndMarksAprobado() {
        Vpn existing = new Vpn();
        existing.setId(7L);
        existing.setEstadoSolicitud("PENDIENTE");
        when(repository.findById(7L)).thenReturn(Optional.of(existing));
        when(usuarioRepository.findByUsername("mresponsable")).thenReturn(Optional.empty());
        when(repository.save(any(Vpn.class))).thenAnswer(inv -> inv.getArgument(0));

        VpnAprobarRequest request = new VpnAprobarRequest();
        request.setUsuarioVpn("vpnuser1");
        request.setCredencialVpn("Sup3rSecreta!");
        request.setIpAsignada("10.8.0.5");
        request.setEstado("Activo");

        Vpn result = service.aprobar(7L, request, authAs("mresponsable"));

        assertThat(result.getEstadoSolicitud()).isEqualTo("APROBADO");
        assertThat(result.getUsuarioVpn()).isEqualTo("vpnuser1");
        assertThat(result.getAprobadoPor()).isEqualTo("mresponsable");
        assertThat(result.getFechaResolucion()).isNotNull();
    }

    @Test
    void aprobar_whenNotPendiente_throwsIllegalArgumentException() {
        Vpn existing = new Vpn();
        existing.setId(7L);
        existing.setEstadoSolicitud("RECHAZADO");
        when(repository.findById(7L)).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> service.aprobar(7L, new VpnAprobarRequest(), authAs("mresponsable")))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void rechazar_whenPendiente_setsComentarioAndMarksRechazado() {
        Vpn existing = new Vpn();
        existing.setId(8L);
        existing.setEstadoSolicitud("PENDIENTE");
        when(repository.findById(8L)).thenReturn(Optional.of(existing));
        when(usuarioRepository.findByUsername(any())).thenReturn(Optional.empty());
        when(repository.save(any(Vpn.class))).thenAnswer(inv -> inv.getArgument(0));

        VpnResolucionRequest request = new VpnResolucionRequest();
        request.setComentarioResponsable("Falta análisis de antivirus");

        Vpn result = service.rechazar(8L, request, authAs("mresponsable"));

        assertThat(result.getEstadoSolicitud()).isEqualTo("RECHAZADO");
        assertThat(result.getComentarioResponsable()).isEqualTo("Falta análisis de antivirus");
    }

    @Test
    void observar_whenPendiente_setsComentarioAndMarksObservado() {
        Vpn existing = new Vpn();
        existing.setId(9L);
        existing.setEstadoSolicitud("PENDIENTE");
        when(repository.findById(9L)).thenReturn(Optional.of(existing));
        when(usuarioRepository.findByUsername(any())).thenReturn(Optional.empty());
        when(repository.save(any(Vpn.class))).thenAnswer(inv -> inv.getArgument(0));

        VpnResolucionRequest request = new VpnResolucionRequest();
        request.setComentarioResponsable("Falta seleccionar equipo GLPI");

        Vpn result = service.observar(9L, request, authAs("mresponsable"));

        assertThat(result.getEstadoSolicitud()).isEqualTo("OBSERVADO");
    }

    @Test
    void delete_removesExistingVpn() {
        Vpn existing = new Vpn();
        existing.setId(1L);
        when(repository.findById(1L)).thenReturn(Optional.of(existing));

        service.delete(1L);

        verify(repository).delete(existing);
    }

    @Test
    void maskCredencialesIfNeeded_withoutReadAuthority_nullsOutCredentials() {
        Vpn vpn = new Vpn();
        vpn.setUsuarioVpn("vpnuser1");
        vpn.setCredencialVpn("supersecret");
        vpn.setSolicitadoPor("otro-usuario");

        service.maskCredencialesIfNeeded(vpn, authAs("jasistente", "ROLE_SOPORTE"));

        assertThat(vpn.getUsuarioVpn()).isNull();
        assertThat(vpn.getCredencialVpn()).isNull();
    }

    @Test
    void maskCredencialesIfNeeded_withReadAuthority_keepsCredentials() {
        Vpn vpn = new Vpn();
        vpn.setUsuarioVpn("vpnuser1");
        vpn.setCredencialVpn("supersecret");
        vpn.setSolicitadoPor("otro-usuario");

        service.maskCredencialesIfNeeded(vpn, authAs("jasistente", "ROLE_SOPORTE", "READ_credenciales-vpn"));

        assertThat(vpn.getUsuarioVpn()).isEqualTo("vpnuser1");
    }

    @Test
    void maskCredencialesIfNeeded_withAdminRole_keepsCredentials() {
        Vpn vpn = new Vpn();
        vpn.setUsuarioVpn("vpnuser1");
        vpn.setCredencialVpn("supersecret");
        vpn.setSolicitadoPor("otro-usuario");

        service.maskCredencialesIfNeeded(vpn, authAs("admin", "ROLE_ADMIN"));

        assertThat(vpn.getUsuarioVpn()).isEqualTo("vpnuser1");
    }

    @Test
    void maskCredencialesIfNeeded_forOwnRequest_keepsCredentialsWithoutSpecialAuthority() {
        Vpn vpn = new Vpn();
        vpn.setUsuarioVpn("vpnuser1");
        vpn.setCredencialVpn("supersecret");
        vpn.setSolicitadoPor("jasistente");

        service.maskCredencialesIfNeeded(vpn, authAs("jasistente", "ROLE_SOPORTE", "WRITE_solicitar-vpn"));

        assertThat(vpn.getUsuarioVpn()).isEqualTo("vpnuser1");
        assertThat(vpn.getCredencialVpn()).isEqualTo("supersecret");
    }
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd soportedesk-backend && ./mvnw test -Dtest=VpnServiceTest -q`
Expected: COMPILE FAILURE — `VpnService` doesn't have `crearSolicitud`/`actualizarSolicitud`/
`aprobar`/`rechazar`/`observar` yet, and its constructor doesn't take `VwInvComputerFullRepository`/
`UsuarioRepository`.

- [ ] **Step 3: Rewrite `VpnService.java`**

```java
package com.inia.soportedesk.vpn;

import com.inia.soportedesk.auth.Usuario;
import com.inia.soportedesk.auth.UsuarioRepository;
import com.inia.soportedesk.exception.ResourceNotFoundException;
import com.inia.soportedesk.glpi.VwInvComputerFull;
import com.inia.soportedesk.glpi.VwInvComputerFullRepository;
import com.inia.soportedesk.usuariosred.UsuarioRed;
import com.inia.soportedesk.usuariosred.UsuarioRedRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class VpnService {

    private static final List<String> EDITABLES = List.of("PENDIENTE", "OBSERVADO");

    private final VpnRepository repository;
    private final UsuarioRedRepository usuarioRedRepository;
    private final VwInvComputerFullRepository glpiRepository;
    private final UsuarioRepository usuarioRepository;

    public List<Vpn> findAll(String search) {
        if (search == null || search.isBlank()) {
            return repository.findAll();
        }
        return repository.search(search);
    }

    public Vpn findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Acceso VPN no encontrado: " + id));
    }

    @Transactional
    public Vpn crearSolicitud(VpnRequest request, Authentication auth) {
        Vpn vpn = new Vpn();
        vpn.setEstadoSolicitud("PENDIENTE");
        vpn.setSolicitadoPor(auth.getName());
        vpn.setSolicitadoPorNombre(nombreDe(auth.getName()));
        vpn.setFechaSolicitud(LocalDateTime.now());
        copySolicitudFields(vpn, request);
        return repository.save(vpn);
    }

    @Transactional
    public Vpn actualizarSolicitud(Long id, VpnRequest request, Authentication auth) {
        Vpn vpn = findById(id);
        if (!EDITABLES.contains(vpn.getEstadoSolicitud())) {
            throw new IllegalArgumentException("Solo se puede editar una solicitud pendiente u observada");
        }
        copySolicitudFields(vpn, request);
        if ("OBSERVADO".equals(vpn.getEstadoSolicitud())) {
            vpn.setEstadoSolicitud("PENDIENTE");
        }
        return repository.save(vpn);
    }

    @Transactional
    public Vpn aprobar(Long id, VpnAprobarRequest request, Authentication auth) {
        Vpn vpn = findById(id);
        if (!"PENDIENTE".equals(vpn.getEstadoSolicitud())) {
            throw new IllegalArgumentException("Solo se puede aprobar una solicitud pendiente");
        }
        vpn.setUsuarioVpn(request.getUsuarioVpn());
        vpn.setCredencialVpn(request.getCredencialVpn());
        vpn.setIpAsignada(request.getIpAsignada());
        vpn.setVence(request.getVence());
        vpn.setEstado(request.getEstado());
        vpn.setEstadoSolicitud("APROBADO");
        marcarResuelto(vpn, auth);
        return repository.save(vpn);
    }

    @Transactional
    public Vpn rechazar(Long id, VpnResolucionRequest request, Authentication auth) {
        return resolver(id, request, auth, "RECHAZADO");
    }

    @Transactional
    public Vpn observar(Long id, VpnResolucionRequest request, Authentication auth) {
        return resolver(id, request, auth, "OBSERVADO");
    }

    @Transactional
    public Vpn updateAntivirus(Long id, VpnAntivirusRequest request) {
        Vpn vpn = findById(id);
        vpn.setTieneAntivirus(request.getTieneAntivirus());
        vpn.setVencimientoAntivirus(request.getVencimientoAntivirus());
        return repository.save(vpn);
    }

    public void delete(Long id) {
        repository.delete(findById(id));
    }

    public void maskCredencialesIfNeeded(Vpn vpn, Authentication auth) {
        if (!canViewCredenciales(vpn, auth)) {
            vpn.setUsuarioVpn(null);
            vpn.setCredencialVpn(null);
        }
    }

    public void maskCredencialesIfNeeded(List<Vpn> vpns, Authentication auth) {
        vpns.forEach(vpn -> maskCredencialesIfNeeded(vpn, auth));
    }

    private Vpn resolver(Long id, VpnResolucionRequest request, Authentication auth, String nuevoEstado) {
        Vpn vpn = findById(id);
        if (!"PENDIENTE".equals(vpn.getEstadoSolicitud())) {
            throw new IllegalArgumentException("Solo se puede resolver una solicitud pendiente");
        }
        vpn.setComentarioResponsable(request.getComentarioResponsable());
        vpn.setEstadoSolicitud(nuevoEstado);
        marcarResuelto(vpn, auth);
        return repository.save(vpn);
    }

    private void marcarResuelto(Vpn vpn, Authentication auth) {
        vpn.setAprobadoPor(auth.getName());
        vpn.setAprobadoPorNombre(nombreDe(auth.getName()));
        vpn.setFechaResolucion(LocalDateTime.now());
    }

    private String nombreDe(String username) {
        return usuarioRepository.findByUsername(username).map(Usuario::getNombre).orElse(username);
    }

    private void copySolicitudFields(Vpn vpn, VpnRequest request) {
        UsuarioRed usuarioRed = usuarioRedRepository.findById(request.getUsuarioRedId())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario de red no encontrado: " + request.getUsuarioRedId()));
        vpn.setUsuarioRed(usuarioRed);
        vpn.setTipoEquipo(request.getTipoEquipo());
        vpn.setAntivirusVerificado(request.getAntivirusVerificado());
        vpn.setAnalisisAntivirusRealizado(request.getAnalisisAntivirusRealizado());

        if (request.getGlpiComputerId() != null) {
            VwInvComputerFull equipo = glpiRepository.findById(request.getGlpiComputerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Equipo GLPI no encontrado: " + request.getGlpiComputerId()));
            vpn.setGlpiComputerId(equipo.getComputerID());
            vpn.setGlpiNombreEquipo(equipo.getNombreEquipo());
            vpn.setGlpiIpEquipo(equipo.getIpEquipo());
            vpn.setHostActualizado(request.getHostActualizado());
        } else {
            vpn.setGlpiComputerId(null);
            vpn.setGlpiNombreEquipo(null);
            vpn.setGlpiIpEquipo(null);
            vpn.setHostActualizado(null);
        }
    }

    private boolean canViewCredenciales(Vpn vpn, Authentication auth) {
        if (vpn.getSolicitadoPor() != null && vpn.getSolicitadoPor().equals(auth.getName())) {
            return true;
        }
        return auth.getAuthorities().stream().anyMatch(a ->
                a.getAuthority().equals("ROLE_ADMIN") ||
                a.getAuthority().equals("READ_credenciales-vpn"));
    }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd soportedesk-backend && ./mvnw test -Dtest=VpnServiceTest -q`
Expected: PASS (all 16 test methods)

- [ ] **Step 5: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/vpn/VpnService.java \
        soportedesk-backend/src/test/java/com/inia/soportedesk/vpn/VpnServiceTest.java
git commit -m "feat(vpn): implement solicitud/aprobacion/rechazo/observacion in VpnService"
```

---

## Task 7: `VpnController` — new endpoints and authorization

**Files:**
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/vpn/VpnController.java`
- Modify: `soportedesk-backend/src/test/java/com/inia/soportedesk/vpn/VpnControllerIT.java`

**Interfaces:**
- Consumes: `VpnService.crearSolicitud/actualizarSolicitud/aprobar/rechazar/observar` (Task 6).
- Produces: `POST /api/vpn`, `PUT /api/vpn/{id}`, `PATCH /api/vpn/{id}/aprobar`,
  `PATCH /api/vpn/{id}/rechazar`, `PATCH /api/vpn/{id}/observar` — the full VPN module's public
  HTTP surface, unchanged for any other consumer beyond the frontend built in later tasks.

- [ ] **Step 1: Rewrite `VpnControllerIT.java`**

```java
package com.inia.soportedesk.vpn;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class VpnControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private VpnService service;

    private VpnRequest sampleRequest() {
        VpnRequest request = new VpnRequest();
        request.setUsuarioRedId(1L);
        request.setTipoEquipo("PERSONAL");
        request.setAntivirusVerificado(true);
        request.setAnalisisAntivirusRealizado(true);
        return request;
    }

    private Vpn sampleVpn() {
        Vpn vpn = new Vpn();
        vpn.setId(1L);
        vpn.setEstadoSolicitud("PENDIENTE");
        return vpn;
    }

    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "READ_vpn"})
    void findAll_withReadAuthority_allowsUser() throws Exception {
        when(service.findAll(null)).thenReturn(List.of(sampleVpn()));

        mockMvc.perform(get("/api/vpn"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].estadoSolicitud", is("PENDIENTE")));
    }

    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "READ_solicitar-vpn"})
    void findAll_withReadSolicitarAuthority_allowsUser() throws Exception {
        when(service.findAll(null)).thenReturn(List.of(sampleVpn()));

        mockMvc.perform(get("/api/vpn"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void findAll_withoutAnyReadAuthority_returnsForbidden() throws Exception {
        mockMvc.perform(get("/api/vpn"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "READ_vpn"})
    void findAll_withoutCredencialesAuthority_masksCredentials() throws Exception {
        Vpn vpn = sampleVpn();
        vpn.setUsuarioVpn("vpnuser1");
        vpn.setCredencialVpn("supersecret");
        when(service.findAll(null)).thenReturn(List.of(vpn));
        doAnswer(invocation -> {
            List<Vpn> vpns = invocation.getArgument(0);
            vpns.forEach(v -> {
                v.setUsuarioVpn(null);
                v.setCredencialVpn(null);
            });
            return null;
        }).when(service).maskCredencialesIfNeeded(anyList(), any());

        mockMvc.perform(get("/api/vpn"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].usuarioVpn", org.hamcrest.Matchers.nullValue()))
                .andExpect(jsonPath("$[0].credencialVpn", org.hamcrest.Matchers.nullValue()));
    }

    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "WRITE_solicitar-vpn"})
    void create_withSolicitarAuthority_returnsCreated() throws Exception {
        when(service.crearSolicitud(any(), any())).thenReturn(sampleVpn());

        mockMvc.perform(post("/api/vpn")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.estadoSolicitud", is("PENDIENTE")));
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void create_withoutSolicitarAuthority_returnsForbidden() throws Exception {
        mockMvc.perform(post("/api/vpn")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "WRITE_solicitar-vpn"})
    void update_withSolicitarAuthority_returnsOk() throws Exception {
        Vpn updated = sampleVpn();
        when(service.actualizarSolicitud(any(), any(), any())).thenReturn(updated);

        mockMvc.perform(put("/api/vpn/1")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "WRITE_aprobar-vpn"})
    void aprobar_withAprobarAuthority_returnsOk() throws Exception {
        Vpn approved = sampleVpn();
        approved.setEstadoSolicitud("APROBADO");
        when(service.aprobar(any(), any(), any())).thenReturn(approved);

        VpnAprobarRequest request = new VpnAprobarRequest();
        request.setUsuarioVpn("vpnuser1");
        request.setCredencialVpn("Sup3rSecreta!");
        request.setIpAsignada("10.8.0.5");
        request.setEstado("Activo");

        mockMvc.perform(patch("/api/vpn/1/aprobar")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estadoSolicitud", is("APROBADO")));
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void aprobar_withoutAprobarAuthority_returnsForbidden() throws Exception {
        VpnAprobarRequest request = new VpnAprobarRequest();
        request.setUsuarioVpn("vpnuser1");
        request.setCredencialVpn("Sup3rSecreta!");
        request.setIpAsignada("10.8.0.5");
        request.setEstado("Activo");

        mockMvc.perform(patch("/api/vpn/1/aprobar")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "WRITE_aprobar-vpn"})
    void rechazar_withAprobarAuthority_returnsOk() throws Exception {
        Vpn rejected = sampleVpn();
        rejected.setEstadoSolicitud("RECHAZADO");
        when(service.rechazar(any(), any(), any())).thenReturn(rejected);

        VpnResolucionRequest request = new VpnResolucionRequest();
        request.setComentarioResponsable("Antivirus no verificado");

        mockMvc.perform(patch("/api/vpn/1/rechazar")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estadoSolicitud", is("RECHAZADO")));
    }

    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "WRITE_aprobar-vpn"})
    void observar_withAprobarAuthority_returnsOk() throws Exception {
        Vpn observed = sampleVpn();
        observed.setEstadoSolicitud("OBSERVADO");
        when(service.observar(any(), any(), any())).thenReturn(observed);

        VpnResolucionRequest request = new VpnResolucionRequest();
        request.setComentarioResponsable("Falta equipo GLPI");

        mockMvc.perform(patch("/api/vpn/1/observar")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estadoSolicitud", is("OBSERVADO")));
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void patchAntivirus_withSoporteRole_returnsOk() throws Exception {
        VpnAntivirusRequest req = new VpnAntivirusRequest();
        req.setTieneAntivirus(true);
        req.setVencimientoAntivirus(LocalDate.of(2026, 12, 31));

        Vpn vpn = sampleVpn();
        vpn.setTieneAntivirus(true);
        when(service.updateAntivirus(any(), any())).thenReturn(vpn);

        mockMvc.perform(patch("/api/vpn/1/antivirus")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tieneAntivirus", is(true)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void delete_withAdminRole_returnsNoContent() throws Exception {
        mockMvc.perform(delete("/api/vpn/1"))
                .andExpect(status().isNoContent());
    }
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd soportedesk-backend && ./mvnw verify -Dit.test=VpnControllerIT -q`

(This project's `pom.xml` wires `*ControllerIT` tests through the `maven-failsafe-plugin`, which
only runs during `verify`/`integration-test` — plain `mvn test` (Surefire) skips `*IT.java` files
by naming convention. Use `-Dit.test=` for Failsafe, not Surefire's `-Dtest=`.)
Expected: COMPILE FAILURE / FAIL — `VpnController` doesn't expose `/aprobar`, `/rechazar`,
`/observar` yet and `create`/`update` still call the old `service.create`/`service.update`.

- [ ] **Step 3: Rewrite `VpnController.java`**

```java
package com.inia.soportedesk.vpn;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vpn")
@RequiredArgsConstructor
public class VpnController {

    private static final String CAN_VIEW =
            "hasRole('ADMIN') || hasAnyAuthority('READ_vpn','WRITE_vpn','READ_solicitar-vpn','WRITE_solicitar-vpn','READ_aprobar-vpn','WRITE_aprobar-vpn')";

    private final VpnService service;

    @GetMapping
    @PreAuthorize(CAN_VIEW)
    public List<Vpn> findAll(@RequestParam(required = false) String search, Authentication auth) {
        List<Vpn> result = service.findAll(search);
        service.maskCredencialesIfNeeded(result, auth);
        return result;
    }

    @GetMapping("/{id}")
    @PreAuthorize(CAN_VIEW)
    public Vpn findById(@PathVariable Long id, Authentication auth) {
        Vpn vpn = service.findById(id);
        service.maskCredencialesIfNeeded(vpn, auth);
        return vpn;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_solicitar-vpn')")
    public ResponseEntity<Vpn> create(@Valid @RequestBody VpnRequest request, Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.crearSolicitud(request, auth));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_solicitar-vpn')")
    public Vpn update(@PathVariable Long id, @Valid @RequestBody VpnRequest request, Authentication auth) {
        return service.actualizarSolicitud(id, request, auth);
    }

    @PatchMapping("/{id}/aprobar")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_aprobar-vpn')")
    public Vpn aprobar(@PathVariable Long id, @Valid @RequestBody VpnAprobarRequest request, Authentication auth) {
        return service.aprobar(id, request, auth);
    }

    @PatchMapping("/{id}/rechazar")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_aprobar-vpn')")
    public Vpn rechazar(@PathVariable Long id, @Valid @RequestBody VpnResolucionRequest request, Authentication auth) {
        return service.rechazar(id, request, auth);
    }

    @PatchMapping("/{id}/observar")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_aprobar-vpn')")
    public Vpn observar(@PathVariable Long id, @Valid @RequestBody VpnResolucionRequest request, Authentication auth) {
        return service.observar(id, request, auth);
    }

    @PatchMapping("/{id}/antivirus")
    public Vpn updateAntivirus(@PathVariable Long id, @RequestBody VpnAntivirusRequest request) {
        return service.updateAntivirus(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd soportedesk-backend && ./mvnw verify -Dit.test=VpnControllerIT -q`

(This project's `pom.xml` wires `*ControllerIT` tests through the `maven-failsafe-plugin`, which
only runs during `verify`/`integration-test` — plain `mvn test` (Surefire) skips `*IT.java` files
by naming convention. Use `-Dit.test=` for Failsafe, not Surefire's `-Dtest=`.)
Expected: PASS

- [ ] **Step 5: Run the full backend test suite to confirm nothing else broke**

Run: `cd soportedesk-backend && ./mvnw verify -q`
Expected: BUILD SUCCESS (this is the first point since Task 4 where the whole module compiles and
tests pass again — `DashboardServiceTest`/`DashboardController` are untouched so far and should
still pass since `Vpn`'s changes are additive). Use `verify`, not `test`, so the `*ControllerIT`
suite (Failsafe) actually runs alongside the unit tests (Surefire).

- [ ] **Step 6: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/vpn/VpnController.java \
        soportedesk-backend/src/test/java/com/inia/soportedesk/vpn/VpnControllerIT.java
git commit -m "feat(vpn): expose aprobar/rechazar/observar endpoints with new permissions"
```

---

## Task 8: Dashboard — pending VPN count

**Files:**
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/dashboard/DashboardCounts.java`
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/dashboard/DashboardService.java`
- Modify: `soportedesk-backend/src/test/java/com/inia/soportedesk/dashboard/DashboardServiceTest.java`
- Modify: `soportedesk-frontend/src/app/features/dashboard/dashboard-counts.model.ts`

**Interfaces:**
- Consumes: `VpnRepository.countByEstadoSolicitud(String)` (Task 5).
- Produces: `DashboardCounts.vpnPendientes(): long` in the `GET /api/dashboard/counts` response —
  consumed by Task 13's `DashboardComponent`.

- [ ] **Step 1: Update the failing test first**

Edit `soportedesk-backend/src/test/java/com/inia/soportedesk/dashboard/DashboardServiceTest.java`,
in `getCounts_returnsCountForEachModule`:

```java
    @Test
    void getCounts_returnsCountForEachModule() {
        when(licenciaRepository.count()).thenReturn(5L);
        when(correoRepository.count()).thenReturn(12L);
        when(usuarioRedRepository.count()).thenReturn(20L);
        when(vpnRepository.count()).thenReturn(3L);
        when(vpnRepository.countByEstadoSolicitud("PENDIENTE")).thenReturn(2L);
        when(wifiRepository.count()).thenReturn(4L);
        when(impresoraRepository.count()).thenReturn(7L);
        when(equipoRepository.count()).thenReturn(15L);
        when(usuarioRedRepository.countDesactivados()).thenReturn(1L);

        DashboardCounts counts = service.getCounts();

        assertThat(counts.licencias()).isEqualTo(5L);
        assertThat(counts.correos()).isEqualTo(12L);
        assertThat(counts.usuariosRed()).isEqualTo(20L);
        assertThat(counts.vpn()).isEqualTo(3L);
        assertThat(counts.vpnPendientes()).isEqualTo(2L);
        assertThat(counts.wifi()).isEqualTo(4L);
        assertThat(counts.impresoras()).isEqualTo(7L);
        assertThat(counts.equipos()).isEqualTo(15L);
        assertThat(counts.usuariosRedInactivos()).isEqualTo(1L);
    }
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd soportedesk-backend && ./mvnw test -Dtest=DashboardServiceTest -q`
Expected: COMPILE FAILURE — `DashboardCounts.vpnPendientes()` doesn't exist yet.

- [ ] **Step 3: Add the field to `DashboardCounts.java`**

```java
package com.inia.soportedesk.dashboard;

public record DashboardCounts(
        long licencias,
        long correos,
        long usuariosRed,
        long vpn,
        long vpnPendientes,
        long wifi,
        long impresoras,
        long equipos,
        long usuariosRedInactivos
) {
}
```

- [ ] **Step 4: Update `DashboardService.getCounts()`**

```java
    public DashboardCounts getCounts() {
        return new DashboardCounts(
                licenciaRepository.count(),
                correoRepository.count(),
                usuarioRedRepository.count(),
                vpnRepository.count(),
                vpnRepository.countByEstadoSolicitud("PENDIENTE"),
                wifiRepository.count(),
                impresoraRepository.count(),
                equipoRepository.count(),
                usuarioRedRepository.countDesactivados()
        );
    }
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd soportedesk-backend && ./mvnw test -Dtest=DashboardServiceTest -q`
Expected: PASS

- [ ] **Step 6: Update the frontend model**

Edit `soportedesk-frontend/src/app/features/dashboard/dashboard-counts.model.ts`:

```typescript
export interface DashboardCounts {
  licencias: number;
  correos: number;
  usuariosRed: number;
  vpn: number;
  vpnPendientes: number;
  wifi: number;
  impresoras: number;
  equipos: number;
  usuariosRedInactivos: number;
}
```

- [ ] **Step 7: Run the backend full test suite**

Run: `cd soportedesk-backend && ./mvnw verify -q`
Expected: BUILD SUCCESS

- [ ] **Step 8: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/dashboard/DashboardCounts.java \
        soportedesk-backend/src/main/java/com/inia/soportedesk/dashboard/DashboardService.java \
        soportedesk-backend/src/test/java/com/inia/soportedesk/dashboard/DashboardServiceTest.java \
        soportedesk-frontend/src/app/features/dashboard/dashboard-counts.model.ts
git commit -m "feat(dashboard): expose pending VPN solicitud count"
```

This is the last backend task. Backend is now fully consistent end-to-end.

---

## Task 9: Frontend — `AuthService.getUsername()`

**Files:**
- Modify: `soportedesk-frontend/src/app/core/auth/auth.service.ts`

**Interfaces:**
- Produces: `getUsername(): string | null` — consumed by Task 12's `vpn-list.component.ts` for the
  "own request" credential-visibility check.

There is no existing spec file for `AuthService` in this codebase (verified: no
`auth.service.spec.ts`). This is a trivial one-line getter mirroring the existing `getNombre()`
pattern — verified by TypeScript compilation and by Task 12's usage.

- [ ] **Step 1: Add the getter**

Edit `soportedesk-frontend/src/app/core/auth/auth.service.ts`, right after `getNombre()`:

```typescript
  getNombre(): string | null {
    return localStorage.getItem('nombre');
  }

  getUsername(): string | null {
    return localStorage.getItem('username');
  }
```

- [ ] **Step 2: Compile-check**

Run: `cd soportedesk-frontend && npx tsc --noEmit -p tsconfig.app.json`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add soportedesk-frontend/src/app/core/auth/auth.service.ts
git commit -m "feat(auth): expose getUsername() for own-record ownership checks"
```

---

## Task 10: Frontend — `vpn.model.ts` and `vpn.service.ts`

**Files:**
- Modify: `soportedesk-frontend/src/app/features/vpn/vpn.model.ts`
- Modify: `soportedesk-frontend/src/app/features/vpn/vpn.service.ts`

**Interfaces:**
- Produces: `Vpn`, `VpnSolicitudRequest`, `VpnAprobarRequest`, `VpnResolucionRequest` interfaces
  and `VpnService.aprobar/rechazar/observar` methods — consumed by every remaining frontend task.

- [ ] **Step 1: Rewrite `vpn.model.ts`**

```typescript
export interface Vpn {
  id: number;
  usuarioRed: { id: number; nombre: string; usuario: string } | null;
  equipo: { id: number; marca: string; modelo: string; tipo: string; host: string | null; ip: string | null } | null;
  ipAsignada: string | null;
  vence: string | null;
  estado: string;
  tieneAntivirus: boolean | null;
  vencimientoAntivirus: string | null;
  usuarioVpn: string | null;
  credencialVpn: string | null;
  estadoSolicitud: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'OBSERVADO';
  tipoEquipo: 'INIA' | 'PERSONAL' | null;
  glpiComputerId: number | null;
  glpiNombreEquipo: string | null;
  glpiIpEquipo: string | null;
  antivirusVerificado: boolean | null;
  analisisAntivirusRealizado: boolean | null;
  hostActualizado: boolean | null;
  comentarioResponsable: string | null;
  solicitadoPor: string;
  solicitadoPorNombre: string | null;
  fechaSolicitud: string;
  aprobadoPor: string | null;
  aprobadoPorNombre: string | null;
  fechaResolucion: string | null;
}

export interface VpnSolicitudRequest {
  usuarioRedId: number;
  tipoEquipo: 'INIA' | 'PERSONAL';
  glpiComputerId: number | null;
  antivirusVerificado: boolean;
  analisisAntivirusRealizado: boolean;
  hostActualizado: boolean | null;
}

export interface VpnAprobarRequest {
  usuarioVpn: string;
  credencialVpn: string;
  ipAsignada: string;
  vence: string | null;
  estado: string;
}

export interface VpnResolucionRequest {
  comentarioResponsable: string;
}

export interface VpnAntivirusRequest {
  tieneAntivirus: boolean | null;
  vencimientoAntivirus: string | null;
}
```

- [ ] **Step 2: Rewrite `vpn.service.ts`**

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Vpn,
  VpnAntivirusRequest,
  VpnAprobarRequest,
  VpnResolucionRequest,
  VpnSolicitudRequest,
} from './vpn.model';

@Injectable({ providedIn: 'root' })
export class VpnService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/vpn`;

  getAll(search?: string): Observable<Vpn[]> {
    let params = new HttpParams();
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<Vpn[]>(this.apiUrl, { params });
  }

  getById(id: number): Observable<Vpn> {
    return this.http.get<Vpn>(`${this.apiUrl}/${id}`);
  }

  create(request: VpnSolicitudRequest): Observable<Vpn> {
    return this.http.post<Vpn>(this.apiUrl, request);
  }

  update(id: number, request: VpnSolicitudRequest): Observable<Vpn> {
    return this.http.put<Vpn>(`${this.apiUrl}/${id}`, request);
  }

  aprobar(id: number, request: VpnAprobarRequest): Observable<Vpn> {
    return this.http.patch<Vpn>(`${this.apiUrl}/${id}/aprobar`, request);
  }

  rechazar(id: number, request: VpnResolucionRequest): Observable<Vpn> {
    return this.http.patch<Vpn>(`${this.apiUrl}/${id}/rechazar`, request);
  }

  observar(id: number, request: VpnResolucionRequest): Observable<Vpn> {
    return this.http.patch<Vpn>(`${this.apiUrl}/${id}/observar`, request);
  }

  patchAntivirus(id: number, request: VpnAntivirusRequest): Observable<Vpn> {
    return this.http.patch<Vpn>(`${this.apiUrl}/${id}/antivirus`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
```

- [ ] **Step 3: Compile-check**

Run: `cd soportedesk-frontend && npx tsc --noEmit -p tsconfig.app.json`
Expected: errors in `vpn-form.component.ts` and `vpn-list.component.ts` (they still use the old
`VpnRequest` shape/fields) — expected, fixed in Tasks 11–12. Confirm no errors outside the `vpn`
feature folder.

- [ ] **Step 4: Commit**

```bash
git add soportedesk-frontend/src/app/features/vpn/vpn.model.ts \
        soportedesk-frontend/src/app/features/vpn/vpn.service.ts
git commit -m "feat(vpn): rewrite frontend model/service for solicitud workflow"
```

---

## Task 11: Frontend — `vpn-form.component` rewrite (solicitud form)

**Files:**
- Modify: `soportedesk-frontend/src/app/features/vpn/vpn-form.component.ts`
- Modify: `soportedesk-frontend/src/app/features/vpn/vpn-form.component.html`

**Interfaces:**
- Consumes: `VpnSolicitudRequest` (Task 10), `EquipoService.getAll(filters): Observable<EquipoResumen[]>`
  (`soportedesk-frontend/src/app/features/equipos/equipo.service.ts:16`), `EquipoResumen`
  (`computerID: number`, `nombreEquipo: string`, `ipEquipo: string | null`, from
  `soportedesk-frontend/src/app/features/equipos/equipo.model.ts:1`).
- Produces: `VpnFormComponent` now emits `VpnSolicitudRequest` on `saved`/`submit`, consumed by
  Task 12's `vpn-list.component.ts` (`onSaved()` — unchanged signature, still `(saved)="onSaved()"`).

No dedicated `.spec.ts` exists for this component today — verified with the manual browser check
in Task 14.

- [ ] **Step 1: Rewrite `vpn-form.component.ts`**

```typescript
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Vpn } from './vpn.model';
import { VpnService } from './vpn.service';
import { UsuarioRedService } from '../usuarios-red/usuario-red.service';
import { EquipoService } from '../equipos/equipo.service';
import { UsuarioRed } from '../usuarios-red/usuario-red.model';
import { EquipoResumen } from '../equipos/equipo.model';

@Component({
  selector: 'app-vpn-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './vpn-form.component.html',
  styleUrl: './vpn-form.component.scss',
})
export class VpnFormComponent implements OnInit, OnChanges {
  private fb = inject(FormBuilder);
  private service = inject(VpnService);
  private usuarioRedService = inject(UsuarioRedService);
  private equipoService = inject(EquipoService);

  @Input() vpn: Vpn | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  usuariosRed: UsuarioRed[] = [];
  selectedAdUserId: number | null = null;

  equipoResults: EquipoResumen[] = [];
  equipoSeleccionado: EquipoResumen | null = null;
  equipoSearchTerm = '';
  private equipoSearchTimeout?: ReturnType<typeof setTimeout>;

  form = this.fb.nonNullable.group({
    usuarioRedId: [null as number | null, Validators.required],
    tipoEquipo: ['PERSONAL' as 'INIA' | 'PERSONAL', Validators.required],
    tieneGlpi: [false],
    glpiComputerId: [null as number | null],
    antivirusVerificado: [false],
    analisisAntivirusRealizado: [false],
    hostActualizado: [false],
  });

  get adUserSelected(): UsuarioRed | null {
    if (!this.selectedAdUserId) return null;
    return this.usuariosRed.find((u) => u.id === this.selectedAdUserId) ?? null;
  }

  get esInia(): boolean {
    return this.form.getRawValue().tipoEquipo === 'INIA';
  }

  get tieneGlpi(): boolean {
    return this.form.getRawValue().tieneGlpi;
  }

  ngOnInit(): void {
    this.usuarioRedService.getAll().subscribe((data) => (this.usuariosRed = data));
  }

  ngOnChanges(): void {
    if (this.vpn) {
      this.selectedAdUserId = this.vpn.usuarioRed?.id ?? null;
      this.form.patchValue({
        usuarioRedId: this.vpn.usuarioRed?.id ?? null,
        tipoEquipo: (this.vpn.tipoEquipo ?? 'PERSONAL') as 'INIA' | 'PERSONAL',
        tieneGlpi: this.vpn.glpiComputerId !== null,
        glpiComputerId: this.vpn.glpiComputerId,
        antivirusVerificado: this.vpn.antivirusVerificado ?? false,
        analisisAntivirusRealizado: this.vpn.analisisAntivirusRealizado ?? false,
        hostActualizado: this.vpn.hostActualizado ?? false,
      });
      if (this.vpn.glpiComputerId && this.vpn.glpiNombreEquipo) {
        this.equipoSeleccionado = {
          computerID: this.vpn.glpiComputerId,
          nombreEquipo: this.vpn.glpiNombreEquipo,
          ipEquipo: this.vpn.glpiIpEquipo,
        } as EquipoResumen;
      }
    } else {
      this.selectedAdUserId = null;
      this.equipoSeleccionado = null;
      this.equipoResults = [];
      this.form.reset({ tipoEquipo: 'PERSONAL', tieneGlpi: false, antivirusVerificado: false, analisisAntivirusRealizado: false, hostActualizado: false });
    }
  }

  onAdUserSelected(event: Event): void {
    const id = Number((event.target as HTMLSelectElement).value) || null;
    this.selectedAdUserId = id;
    this.form.patchValue({ usuarioRedId: id });
  }

  onTipoEquipoChange(): void {
    if (!this.esInia) {
      this.form.patchValue({ tieneGlpi: false, glpiComputerId: null, hostActualizado: false });
      this.equipoSeleccionado = null;
    }
  }

  onTieneGlpiChange(): void {
    if (!this.tieneGlpi) {
      this.form.patchValue({ glpiComputerId: null, hostActualizado: false });
      this.equipoSeleccionado = null;
    }
  }

  onEquipoSearch(term: string): void {
    this.equipoSearchTerm = term;
    clearTimeout(this.equipoSearchTimeout);
    this.equipoSearchTimeout = setTimeout(() => {
      if (!term.trim()) {
        this.equipoResults = [];
        return;
      }
      this.equipoService.getAll({ search: term }).subscribe((data) => (this.equipoResults = data));
    }, 300);
  }

  onEquipoSelected(equipo: EquipoResumen): void {
    this.equipoSeleccionado = equipo;
    this.equipoResults = [];
    this.equipoSearchTerm = '';
    this.form.patchValue({ glpiComputerId: equipo.computerID });
  }

  submit(): void {
    if (this.form.invalid) return;
    const raw = this.form.getRawValue();
    const request = {
      usuarioRedId: raw.usuarioRedId!,
      tipoEquipo: raw.tipoEquipo,
      glpiComputerId: raw.tieneGlpi ? raw.glpiComputerId : null,
      antivirusVerificado: raw.antivirusVerificado,
      analisisAntivirusRealizado: raw.analisisAntivirusRealizado,
      hostActualizado: raw.tieneGlpi ? raw.hostActualizado : null,
    };
    const obs = this.vpn
      ? this.service.update(this.vpn.id, request)
      : this.service.create(request);
    obs.subscribe(() => this.saved.emit());
  }
}
```

- [ ] **Step 2: Rewrite `vpn-form.component.html`**

```html
<form [formGroup]="form" (ngSubmit)="submit()">

  <!-- AD autocomplete selector -->
  <div class="section-header ad-header">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
      <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" />
    </svg>
    Seleccionar usuario de red
  </div>

  <div class="field ad-field">
    <label>Usuario AD *</label>
    <select (change)="onAdUserSelected($event)">
      <option value="">— Buscar usuario —</option>
      <option *ngFor="let u of usuariosRed" [value]="u.id" [selected]="u.id === selectedAdUserId">
        {{ u.nombre }} ({{ u.usuario }})
      </option>
    </select>
  </div>

  <div class="ad-preview" *ngIf="adUserSelected">
    <div class="ad-preview-row">
      <span class="ad-label">Usuario</span>
      <span>{{ adUserSelected.usuario }}</span>
    </div>
    <div class="ad-preview-row">
      <span class="ad-label">Nombre</span>
      <span>{{ adUserSelected.nombre }}</span>
    </div>
    <div class="ad-preview-row" *ngIf="adUserSelected.sede">
      <span class="ad-label">Sede</span>
      <span>{{ adUserSelected.sede.nombre }}</span>
    </div>
    <div class="ad-preview-row" *ngIf="adUserSelected.dependencia">
      <span class="ad-label">Dependencia</span>
      <span>{{ adUserSelected.dependencia.nombre }}</span>
    </div>
  </div>

  <hr class="divider" />

  <!-- Verificaciones -->
  <div class="section-header">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
      <path fill-rule="evenodd" d="M10 1.75a.75.75 0 0 1 .692.462l1.41 3.393 3.664.293a.75.75 0 0 1 .428 1.317l-2.791 2.39.853 3.575a.75.75 0 0 1-1.12.814L10 12.347l-3.135 1.647a.75.75 0 0 1-1.12-.814l.852-3.575-2.79-2.39a.75.75 0 0 1 .427-1.317l3.663-.293 1.41-3.393A.75.75 0 0 1 10 1.75Z" clip-rule="evenodd" />
    </svg>
    Verificaciones de seguridad
  </div>

  <div class="field">
    <label>Tipo de equipo</label>
    <div class="radio-group">
      <label>
        <input type="radio" formControlName="tipoEquipo" value="INIA" (change)="onTipoEquipoChange()" />
        Equipo de INIA
      </label>
      <label>
        <input type="radio" formControlName="tipoEquipo" value="PERSONAL" (change)="onTipoEquipoChange()" />
        Equipo personal
      </label>
    </div>
  </div>

  <ng-container *ngIf="esInia">
    <div class="field checkbox-field">
      <label>
        <input type="checkbox" formControlName="tieneGlpi" (change)="onTieneGlpiChange()" />
        ¿Tiene GLPI instalado?
      </label>
    </div>

    <div class="field" *ngIf="tieneGlpi">
      <label>Buscar equipo GLPI</label>
      <input type="text" [value]="equipoSearchTerm" (input)="onEquipoSearch($any($event.target).value)" placeholder="Nombre de equipo o usuario de contacto" />
      <ul class="equipo-results" *ngIf="equipoResults.length">
        <li *ngFor="let e of equipoResults" (click)="onEquipoSelected(e)">
          {{ e.nombreEquipo }} — {{ e.usuarioContacto }}
        </li>
      </ul>
      <div class="equipo-preview" *ngIf="equipoSeleccionado">
        <span class="ad-label">Host</span> {{ equipoSeleccionado.nombreEquipo }}
        <ng-container *ngIf="equipoSeleccionado.ipEquipo">
          | <span class="ad-label">IP</span> {{ equipoSeleccionado.ipEquipo }}
        </ng-container>
      </div>
    </div>

    <div class="field checkbox-field" *ngIf="tieneGlpi">
      <label>
        <input type="checkbox" formControlName="hostActualizado" />
        Host actualizado
      </label>
    </div>

    <div class="field checkbox-field">
      <label>
        <input type="checkbox" formControlName="antivirusVerificado" />
        Antivirus institucional verificado
      </label>
    </div>
  </ng-container>

  <ng-container *ngIf="!esInia">
    <div class="field checkbox-field">
      <label>
        <input type="checkbox" formControlName="antivirusVerificado" />
        Antivirus con protección anti-ransomware verificado
      </label>
    </div>
  </ng-container>

  <div class="field checkbox-field">
    <label>
      <input type="checkbox" formControlName="analisisAntivirusRealizado" />
      Análisis de antivirus al equipo realizado
    </label>
  </div>

  <div class="actions">
    <button type="button" class="secondary" (click)="cancelled.emit()">Cancelar</button>
    <button type="submit" [disabled]="form.invalid">Guardar</button>
  </div>
</form>
```

- [ ] **Step 3: Compile-check**

Run: `cd soportedesk-frontend && npx tsc --noEmit -p tsconfig.app.json`
Expected: remaining errors only in `vpn-list.component.ts` (Task 12 fixes it).

- [ ] **Step 4: Commit**

```bash
git add soportedesk-frontend/src/app/features/vpn/vpn-form.component.ts \
        soportedesk-frontend/src/app/features/vpn/vpn-form.component.html
git commit -m "feat(vpn): rewrite solicitud form with GLPI equipment lookup and security checks"
```

---

## Task 12: Frontend — `vpn-aprobar-form` and `vpn-resolucion-form` components

**Files:**
- Create: `soportedesk-frontend/src/app/features/vpn/vpn-aprobar-form.component.ts`
- Create: `soportedesk-frontend/src/app/features/vpn/vpn-aprobar-form.component.html`
- Create: `soportedesk-frontend/src/app/features/vpn/vpn-resolucion-form.component.ts`
- Create: `soportedesk-frontend/src/app/features/vpn/vpn-resolucion-form.component.html`

**Interfaces:**
- Consumes: `VpnService.aprobar/rechazar/observar` (Task 10), `VpnPasswordGeneratorComponent`
  (`selector: 'app-vpn-password-generator'`, `@Output() passwordSelected: EventEmitter<string>`,
  from `soportedesk-frontend/src/app/features/vpn/vpn-password-generator.component.ts:15`).
- Produces: `VpnAprobarFormComponent` (`@Input() vpn: Vpn | null`, `@Output() saved`,
  `@Output() cancelled`) and `VpnResolucionFormComponent` (`@Input() vpn: Vpn | null`,
  `@Input() modo: 'RECHAZAR' | 'OBSERVAR'`, `@Output() saved`, `@Output() cancelled`) — both
  consumed by Task 13's `vpn-list.component.html`.

- [ ] **Step 1: Create `vpn-aprobar-form.component.ts`**

```typescript
import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Vpn } from './vpn.model';
import { VpnService } from './vpn.service';
import { VpnPasswordGeneratorComponent } from './vpn-password-generator.component';

@Component({
  selector: 'app-vpn-aprobar-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, VpnPasswordGeneratorComponent],
  templateUrl: './vpn-aprobar-form.component.html',
})
export class VpnAprobarFormComponent implements OnChanges {
  private fb = inject(FormBuilder);
  private service = inject(VpnService);

  @Input() vpn: Vpn | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  form = this.fb.nonNullable.group({
    usuarioVpn: ['', Validators.required],
    credencialVpn: ['', Validators.required],
    ipAsignada: ['', Validators.required],
    vence: [''],
    estado: ['Activo', Validators.required],
  });

  ngOnChanges(): void {
    this.form.reset({ estado: 'Activo' });
  }

  useGeneratedPassword(password: string): void {
    this.form.patchValue({ credencialVpn: password });
  }

  submit(): void {
    if (!this.vpn || this.form.invalid) return;
    const raw = this.form.getRawValue();
    this.service.aprobar(this.vpn.id, {
      usuarioVpn: raw.usuarioVpn,
      credencialVpn: raw.credencialVpn,
      ipAsignada: raw.ipAsignada,
      vence: raw.vence || null,
      estado: raw.estado,
    }).subscribe(() => this.saved.emit());
  }
}
```

- [ ] **Step 2: Create `vpn-aprobar-form.component.html`**

```html
<form [formGroup]="form" (ngSubmit)="submit()" *ngIf="vpn">
  <div class="field">
    <label>Tipo de equipo</label>
    <p>{{ vpn.tipoEquipo === 'INIA' ? 'Equipo de INIA' : 'Equipo personal' }}</p>
  </div>

  <div class="field" *ngIf="vpn.glpiNombreEquipo">
    <label>Equipo GLPI</label>
    <p>{{ vpn.glpiNombreEquipo }} <ng-container *ngIf="vpn.glpiIpEquipo">| IP: {{ vpn.glpiIpEquipo }}</ng-container></p>
  </div>

  <div class="field">
    <label>Antivirus verificado</label>
    <p>{{ vpn.antivirusVerificado ? 'Sí' : 'No' }}</p>
  </div>

  <div class="field">
    <label>Análisis de antivirus realizado</label>
    <p>{{ vpn.analisisAntivirusRealizado ? 'Sí' : 'No' }}</p>
  </div>

  <div class="field" *ngIf="vpn.glpiComputerId">
    <label>Host actualizado</label>
    <p>{{ vpn.hostActualizado ? 'Sí' : 'No' }}</p>
  </div>

  <hr class="divider" />

  <div class="field">
    <label>Usuario VPN *</label>
    <input type="text" formControlName="usuarioVpn" placeholder="Nombre de usuario VPN" />
  </div>

  <div class="field">
    <label>Credencial / Contraseña VPN *</label>
    <input type="text" formControlName="credencialVpn" placeholder="Contraseña o clave de acceso" />
  </div>

  <app-vpn-password-generator (passwordSelected)="useGeneratedPassword($event)" />

  <div class="field">
    <label>IP VPN asignada *</label>
    <input type="text" formControlName="ipAsignada" placeholder="10.0.0.x" />
  </div>

  <div class="field">
    <label>Vence (VPN)</label>
    <input type="date" formControlName="vence" />
  </div>

  <div class="actions">
    <button type="button" class="secondary" (click)="cancelled.emit()">Cancelar</button>
    <button type="submit" [disabled]="form.invalid">Aprobar</button>
  </div>
</form>
```

- [ ] **Step 3: Create `vpn-resolucion-form.component.ts`**

```typescript
import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Vpn } from './vpn.model';
import { VpnService } from './vpn.service';

@Component({
  selector: 'app-vpn-resolucion-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './vpn-resolucion-form.component.html',
})
export class VpnResolucionFormComponent implements OnChanges {
  private fb = inject(FormBuilder);
  private service = inject(VpnService);

  @Input() vpn: Vpn | null = null;
  @Input() modo: 'RECHAZAR' | 'OBSERVAR' = 'RECHAZAR';
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  form = this.fb.nonNullable.group({
    comentarioResponsable: ['', Validators.required],
  });

  get titulo(): string {
    return this.modo === 'RECHAZAR' ? 'Rechazar solicitud' : 'Observar solicitud';
  }

  ngOnChanges(): void {
    this.form.reset();
  }

  submit(): void {
    if (!this.vpn || this.form.invalid) return;
    const request = { comentarioResponsable: this.form.getRawValue().comentarioResponsable };
    const obs = this.modo === 'RECHAZAR'
      ? this.service.rechazar(this.vpn.id, request)
      : this.service.observar(this.vpn.id, request);
    obs.subscribe(() => this.saved.emit());
  }
}
```

- [ ] **Step 4: Create `vpn-resolucion-form.component.html`**

```html
<form [formGroup]="form" (ngSubmit)="submit()" *ngIf="vpn">
  <div class="field">
    <label>Comentario *</label>
    <textarea formControlName="comentarioResponsable" rows="4" placeholder="Explica el motivo para el asistente"></textarea>
  </div>

  <div class="actions">
    <button type="button" class="secondary" (click)="cancelled.emit()">Cancelar</button>
    <button type="submit" [disabled]="form.invalid">{{ titulo }}</button>
  </div>
</form>
```

- [ ] **Step 5: Compile-check**

Run: `cd soportedesk-frontend && npx tsc --noEmit -p tsconfig.app.json`
Expected: only remaining errors in `vpn-list.component.ts` (Task 13 fixes it).

- [ ] **Step 6: Commit**

```bash
git add soportedesk-frontend/src/app/features/vpn/vpn-aprobar-form.component.ts \
        soportedesk-frontend/src/app/features/vpn/vpn-aprobar-form.component.html \
        soportedesk-frontend/src/app/features/vpn/vpn-resolucion-form.component.ts \
        soportedesk-frontend/src/app/features/vpn/vpn-resolucion-form.component.html
git commit -m "feat(vpn): add aprobar and rechazar/observar modals"
```

---

## Task 13: Frontend — `vpn-list.component` rewrite and dead code removal

**Files:**
- Modify: `soportedesk-frontend/src/app/features/vpn/vpn-list.component.ts`
- Modify: `soportedesk-frontend/src/app/features/vpn/vpn-list.component.html`
- Delete: `soportedesk-frontend/src/app/features/vpn/vpn-datos-form.component.ts`
- Delete: `soportedesk-frontend/src/app/features/vpn/vpn-datos-form.component.html`

**Interfaces:**
- Consumes: `AuthService.getUsername()` (Task 9), `VpnAprobarFormComponent`,
  `VpnResolucionFormComponent` (Task 12).
- Produces: the finished VPN list page — the last frontend task before manual verification.

- [ ] **Step 1: Confirm `vpn-datos-form` really has zero references before deleting**

Run: `grep -rn "VpnDatosForm\|vpn-datos-form" soportedesk-frontend/src`
Expected: only the two files being deleted show up (their own definitions) — no importer.

- [ ] **Step 2: Delete the dead component**

```bash
git rm soportedesk-frontend/src/app/features/vpn/vpn-datos-form.component.ts \
       soportedesk-frontend/src/app/features/vpn/vpn-datos-form.component.html
```

- [ ] **Step 3: Rewrite `vpn-list.component.ts`**

```typescript
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';
import { GenericTableComponent, TableColumn } from '../../shared/generic-table/generic-table.component';
import { ModalComponent } from '../../shared/modal/modal.component';
import { FieldComponent } from '../../shared/field/field.component';
import { VencimientoBadgeComponent } from '../../shared/vencimiento-badge/vencimiento-badge.component';
import { VpnFormComponent } from './vpn-form.component';
import { VpnAntivirusFormComponent } from './vpn-antivirus-form.component';
import { VpnAprobarFormComponent } from './vpn-aprobar-form.component';
import { VpnResolucionFormComponent } from './vpn-resolucion-form.component';
import { Vpn } from './vpn.model';
import { VpnService } from './vpn.service';

const EDITABLE_STATES = new Set(['PENDIENTE', 'OBSERVADO']);

@Component({
  selector: 'app-vpn-list',
  standalone: true,
  imports: [
    CommonModule,
    GenericTableComponent,
    ModalComponent,
    FieldComponent,
    VencimientoBadgeComponent,
    VpnFormComponent,
    VpnAntivirusFormComponent,
    VpnAprobarFormComponent,
    VpnResolucionFormComponent,
  ],
  templateUrl: './vpn-list.component.html',
  styleUrl: './vpn-list.component.scss',
})
export class VpnListComponent implements OnInit {
  private service = inject(VpnService);
  private authService = inject(AuthService);

  items: Vpn[] = [];
  columns: TableColumn[] = [
    { key: 'usuarioRed.nombre', label: 'Nombre' },
    { key: 'usuarioRed.usuario', label: 'Usuario red' },
    { key: 'estadoSolicitud', label: 'Estado solicitud' },
    { key: 'ipAsignada', label: 'IP VPN' },
    { key: 'estado', label: 'Estado' },
  ];

  viewing: Vpn | null = null;
  editing: Vpn | null = null;
  formOpen = false;

  antivirusEditing: Vpn | null = null;
  antivirusOpen = false;

  aprobarEditing: Vpn | null = null;
  aprobarOpen = false;

  resolucionEditing: Vpn | null = null;
  resolucionModo: 'RECHAZAR' | 'OBSERVAR' = 'RECHAZAR';
  resolucionOpen = false;

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  get canWriteSolicitar(): boolean {
    return this.authService.isAdmin() || this.authService.canWrite('solicitar-vpn');
  }

  get canWriteAprobar(): boolean {
    return this.authService.isAdmin() || this.authService.canWrite('aprobar-vpn');
  }

  get canEditCredenciales(): boolean {
    if (this.authService.isAdmin() || this.authService.canWrite('credenciales-vpn')) return true;
    return this.viewing?.solicitadoPor === this.authService.getUsername();
  }

  ngOnInit(): void {
    this.load();
  }

  load(search?: string): void {
    this.service.getAll(search).subscribe((data) => (this.items = data));
  }

  onSearch(term: string): void {
    this.load(term);
  }

  onView(item: Vpn): void {
    this.viewing = item;
  }

  closeView(): void {
    this.viewing = null;
  }

  onAdd(): void {
    this.editing = null;
    this.formOpen = true;
  }

  onEdit(item: Vpn): void {
    if (!EDITABLE_STATES.has(item.estadoSolicitud)) {
      alert('Esta solicitud ya fue resuelta y no se puede editar.');
      return;
    }
    this.editing = item;
    this.formOpen = true;
  }

  closeForm(): void {
    this.formOpen = false;
  }

  onDelete(item: Vpn): void {
    const nombre = item.usuarioRed?.nombre ?? item.id;
    if (!confirm(`¿Eliminar el registro VPN de "${nombre}"?`)) return;
    this.service.delete(item.id).subscribe(() => this.load());
  }

  onSaved(): void {
    this.formOpen = false;
    this.load();
  }

  openAntivirus(item: Vpn): void {
    this.viewing = null;
    this.antivirusEditing = item;
    this.antivirusOpen = true;
  }

  closeAntivirus(): void {
    this.antivirusOpen = false;
  }

  onAntivirusSaved(): void {
    this.antivirusOpen = false;
    this.load();
  }

  openAprobar(item: Vpn): void {
    this.viewing = null;
    this.aprobarEditing = item;
    this.aprobarOpen = true;
  }

  closeAprobar(): void {
    this.aprobarOpen = false;
  }

  onAprobarSaved(): void {
    this.aprobarOpen = false;
    this.load();
  }

  openResolucion(item: Vpn, modo: 'RECHAZAR' | 'OBSERVAR'): void {
    this.viewing = null;
    this.resolucionEditing = item;
    this.resolucionModo = modo;
    this.resolucionOpen = true;
  }

  closeResolucion(): void {
    this.resolucionOpen = false;
  }

  onResolucionSaved(): void {
    this.resolucionOpen = false;
    this.load();
  }

  antivirusLabel(vpn: Vpn | null): string {
    if (!vpn || vpn.tieneAntivirus === null || vpn.tieneAntivirus === undefined) return '—';
    return vpn.tieneAntivirus ? 'Sí' : 'No';
  }
}
```

- [ ] **Step 4: Rewrite `vpn-list.component.html`**

```html
<div class="module-page vpn-page">
  <div class="module-header">
    <div>
      <span class="module-eyebrow">Acceso remoto</span>
      <h2>VPN</h2>
      <p>Solicitudes, verificaciones de seguridad y credenciales de acceso remoto.</p>
    </div>
  </div>

  <app-generic-table
    [columns]="columns"
    [data]="items"
    [canEdit]="canWriteSolicitar"
    extraColumnLabel="Vence VPN"
    (searchChange)="onSearch($event)"
    (add)="onAdd()"
    (view)="onView($event)"
    (edit)="onEdit($event)"
    (delete)="onDelete($event)"
  >
    <ng-template #extraCell let-row>
      <span class="badge-estado" [ngClass]="'badge-' + row.estadoSolicitud.toLowerCase()">{{ row.estadoSolicitud }}</span>
      <app-vencimiento-badge [fecha]="row.vence" />
    </ng-template>
  </app-generic-table>
</div>

<!-- Modal: detalle -->
<app-modal title="Detalle VPN" [open]="viewing !== null" (closed)="closeView()">
  <ng-container *ngIf="viewing">
    <app-field label="Nombre">{{ viewing.usuarioRed?.nombre }}</app-field>
    <app-field label="Usuario red">{{ viewing.usuarioRed?.usuario }}</app-field>

    <hr style="margin: 12px 0; border-color: var(--color-border)" />

    <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #4338ca; margin-bottom: 8px;">Solicitud</div>
    <app-field label="Solicitado por">{{ viewing.solicitadoPorNombre || viewing.solicitadoPor }}</app-field>
    <app-field label="Fecha de solicitud">{{ viewing.fechaSolicitud }}</app-field>
    <app-field label="Estado de solicitud">{{ viewing.estadoSolicitud }}</app-field>
    <app-field label="Tipo de equipo">{{ viewing.tipoEquipo === 'INIA' ? 'Equipo de INIA' : 'Equipo personal' }}</app-field>
    <app-field label="Equipo GLPI" *ngIf="viewing.glpiNombreEquipo">
      {{ viewing.glpiNombreEquipo }} <ng-container *ngIf="viewing.glpiIpEquipo">| IP: {{ viewing.glpiIpEquipo }}</ng-container>
    </app-field>
    <app-field label="Antivirus verificado">{{ viewing.antivirusVerificado ? 'Sí' : 'No' }}</app-field>
    <app-field label="Análisis de antivirus realizado">{{ viewing.analisisAntivirusRealizado ? 'Sí' : 'No' }}</app-field>
    <app-field label="Host actualizado" *ngIf="viewing.glpiComputerId">{{ viewing.hostActualizado ? 'Sí' : 'No' }}</app-field>
    <ng-container *ngIf="viewing.aprobadoPorNombre">
      <app-field label="Resuelto por">{{ viewing.aprobadoPorNombre }}</app-field>
      <app-field label="Fecha de resolución">{{ viewing.fechaResolucion }}</app-field>
    </ng-container>
    <app-field label="Comentario del responsable" *ngIf="viewing.comentarioResponsable">{{ viewing.comentarioResponsable }}</app-field>

    <hr style="margin: 12px 0; border-color: var(--color-border)" />

    <app-field label="IP VPN asignada">{{ viewing.ipAsignada || '—' }}</app-field>
    <app-field label="Vence (VPN)">{{ viewing.vence || '—' }}</app-field>
    <app-field label="Estado">{{ viewing.estado || '—' }}</app-field>

    <ng-container *ngIf="canEditCredenciales">
      <hr style="margin: 12px 0; border-color: #a5b4fc; border-style: dashed;" />
      <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #4338ca; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
        Credenciales VPN
      </div>
      <app-field label="Usuario VPN">{{ viewing.usuarioVpn || '—' }}</app-field>
      <app-field label="Credencial VPN">{{ viewing.credencialVpn || '—' }}</app-field>
    </ng-container>

    <hr style="margin: 12px 0; border-color: var(--color-border)" />

    <app-field label="Antivirus (monitoreo)">{{ antivirusLabel(viewing) }}</app-field>
    <app-field label="Vence antivirus">{{ viewing.vencimientoAntivirus || '—' }}</app-field>

    <div class="actions" style="margin-top: 16px; display: flex; gap: 8px; flex-wrap: wrap;">
      <button class="secondary" (click)="openAntivirus(viewing!)">Editar antivirus</button>
      <ng-container *ngIf="canWriteAprobar && viewing.estadoSolicitud === 'PENDIENTE'">
        <button (click)="openAprobar(viewing!)">Aprobar</button>
        <button class="secondary" (click)="openResolucion(viewing!, 'OBSERVAR')">Observar</button>
        <button class="secondary" (click)="openResolucion(viewing!, 'RECHAZAR')">Rechazar</button>
      </ng-container>
    </div>
  </ng-container>
</app-modal>

<!-- Modal: formulario de solicitud -->
<app-modal
  [title]="editing ? 'Editar solicitud VPN' : 'Nueva solicitud VPN'"
  [open]="formOpen"
  (closed)="closeForm()"
>
  <app-vpn-form [vpn]="editing" (saved)="onSaved()" (cancelled)="closeForm()" />
</app-modal>

<!-- Modal: antivirus (soporte) -->
<app-modal title="Antivirus" [open]="antivirusOpen" (closed)="closeAntivirus()">
  <app-vpn-antivirus-form
    [vpn]="antivirusEditing"
    (saved)="onAntivirusSaved()"
    (cancelled)="closeAntivirus()"
  />
</app-modal>

<!-- Modal: aprobar -->
<app-modal title="Aprobar solicitud VPN" [open]="aprobarOpen" (closed)="closeAprobar()">
  <app-vpn-aprobar-form
    [vpn]="aprobarEditing"
    (saved)="onAprobarSaved()"
    (cancelled)="closeAprobar()"
  />
</app-modal>

<!-- Modal: rechazar/observar -->
<app-modal [title]="resolucionModo === 'RECHAZAR' ? 'Rechazar solicitud VPN' : 'Observar solicitud VPN'" [open]="resolucionOpen" (closed)="closeResolucion()">
  <app-vpn-resolucion-form
    [vpn]="resolucionEditing"
    [modo]="resolucionModo"
    (saved)="onResolucionSaved()"
    (cancelled)="closeResolucion()"
  />
</app-modal>
```

- [ ] **Step 5: Add badge styles to `vpn-list.component.scss`**

Append to the end of `soportedesk-frontend/src/app/features/vpn/vpn-list.component.scss`:

```scss
.badge-estado {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-weight: 700;
  font-size: 10px;
  text-transform: uppercase;
  padding: 3px 8px;
  margin-right: 6px;
}

.badge-pendiente { background: #f1f5f9; color: #475569; }
.badge-aprobado { background: #dcfce7; color: #15803d; }
.badge-rechazado { background: #fee2e2; color: #b91c1c; }
.badge-observado { background: #fef3c7; color: #b45309; }
```

- [ ] **Step 6: Compile-check**

Run: `cd soportedesk-frontend && npx tsc --noEmit -p tsconfig.app.json`
Expected: no errors in the `vpn` feature folder.

- [ ] **Step 7: Commit**

```bash
git add soportedesk-frontend/src/app/features/vpn/vpn-list.component.ts \
        soportedesk-frontend/src/app/features/vpn/vpn-list.component.html \
        soportedesk-frontend/src/app/features/vpn/vpn-list.component.scss
git rm soportedesk-frontend/src/app/features/vpn/vpn-datos-form.component.ts \
       soportedesk-frontend/src/app/features/vpn/vpn-datos-form.component.html 2>/dev/null || true
git commit -m "feat(vpn): wire aprobar/rechazar/observar actions into detail modal"
```

---

## Task 14: Dashboard — pending VPN alert card

**Files:**
- Modify: `soportedesk-frontend/src/app/features/dashboard/dashboard.component.ts`

**Interfaces:**
- Consumes: `DashboardCounts.vpnPendientes` (Task 8), `AuthService.isAdmin()/canWrite(modulo)`
  (existing, `soportedesk-frontend/src/app/core/auth/auth.service.ts:52,69`).
- Produces: one new entry in `summaryMetrics`, rendered by the existing
  `dashboard.component.html` loop (`*ngFor="let metric of summaryMetrics"`, unchanged) — this task
  does not touch the HTML.

There is a `dashboard.component.spec.ts` in this codebase — check it for existing assertions on
`summaryMetrics.length` before editing, since adding an entry may need a matching update.

- [ ] **Step 1: Check the existing dashboard spec for a metrics-count assertion**

Run: `grep -n "summaryMetrics" soportedesk-frontend/src/app/features/dashboard/dashboard.component.spec.ts`

If it asserts an exact array length or exact index-based content for `summaryMetrics`, update that
assertion in the same commit as Step 3 to account for the new conditional entry. If it only checks
specific known metrics by label (not by length), no test change is needed.

- [ ] **Step 2: Inject `AuthService` and add the conditional metric**

Edit `soportedesk-frontend/src/app/features/dashboard/dashboard.component.ts`:

```typescript
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AuthService } from '../../core/auth/auth.service';
import { DashboardService } from './dashboard.service';
import { DashboardCounts } from './dashboard-counts.model';
import { UsuariosRedPorUbicacionChartComponent } from './usuarios-red-por-ubicacion-chart.component';
import { LicenciasPorTipoChartComponent } from './licencias-por-tipo-chart.component';
```

Add the field:

```typescript
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private authService = inject(AuthService);
  private sanitizer = inject(DomSanitizer);
```

Update `toSummaryMetrics`:

```typescript
  private toSummaryMetrics(counts: DashboardCounts): SummaryMetric[] {
    const accesos = counts.licencias + counts.correos + counts.usuariosRed + counts.vpn + counts.wifi;
    const infraestructura = counts.impresoras + counts.equipos;

    const metrics: SummaryMetric[] = [
      {
        label: 'Registros totales',
        value: this.totalRegistros,
        detail: 'Inventario general del sistema',
        state: 'neutral',
      },
      {
        label: 'Accesos gestionados',
        value: accesos,
        detail: 'Licencias, correos, red, VPN y WiFi',
        state: 'success',
      },
      {
        label: 'Infraestructura',
        value: infraestructura,
        detail: 'Equipos asignados e impresoras',
        state: 'neutral',
      },
      {
        label: 'Usuarios activos',
        value: this.usuariosActivos,
        detail: `${counts.usuariosRedInactivos} usuarios desactivados`,
        path: '/usuarios-red',
        queryParams: { search: 'Inactivo' },
        state: counts.usuariosRedInactivos > 0 ? 'warning' : 'success',
      },
    ];

    if (this.authService.isAdmin() || this.authService.canWrite('aprobar-vpn')) {
      metrics.push({
        label: 'Solicitudes VPN pendientes',
        value: counts.vpnPendientes,
        detail: 'Esperando verificación y aprobación',
        path: '/vpn',
        state: counts.vpnPendientes > 0 ? 'warning' : 'success',
      });
    }

    return metrics;
  }
```

- [ ] **Step 3: Update the spec if needed (per Step 1's finding), then compile-check**

Run: `cd soportedesk-frontend && npx tsc --noEmit -p tsconfig.app.json`
Expected: no errors.

Run: `cd soportedesk-frontend && npx ng test --watch=false --browsers=ChromeHeadless --include='**/dashboard.component.spec.ts'`

(This project uses Karma/Jasmine via `ng test`, not Jest — confirmed via `package.json`'s
`"test": "ng test"` script and `karma-jasmine`/`karma-chrome-launcher` devDependencies.
`ChromeHeadless` is a built-in launcher shipped with `karma-chrome-launcher`, no extra config
needed.)
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add soportedesk-frontend/src/app/features/dashboard/dashboard.component.ts
git commit -m "feat(dashboard): add pending VPN solicitudes alert card for aprobadores"
```

---

## Task 15: Full verification pass

**Files:** none (verification only)

- [ ] **Step 1: Run the full backend test suite**

Run: `cd soportedesk-backend && ./mvnw verify -q`
Expected: BUILD SUCCESS. (Use `verify`, not `test`, per this project's convention for
`*ControllerIT` tests to actually run — see `tech_backend_patterns` memory note.)

- [ ] **Step 2: Run the full frontend test suite**

Run: `cd soportedesk-frontend && npx ng test --watch=false --browsers=ChromeHeadless`
Expected: PASS, no new failures.

- [ ] **Step 3: Build the frontend to catch template/type errors the test suite might miss**

Run: `cd soportedesk-frontend && npm run build`
Expected: BUILD SUCCESS.

- [ ] **Step 4: Manual walkthrough in the browser**

Start both apps (backend `./mvnw spring-boot:run`, frontend `npm start`) and, using two test
accounts — one with `solicitar-vpn` and one with `aprobar-vpn` (create them via "Usuarios del
Sistema" if they don't exist) — walk through:

1. As the solicitante: create a solicitud for an `INIA` equipo with GLPI (search and pick a real
   equipo from the search box, confirm host/IP autofill in the preview), verify it appears as
   `PENDIENTE` in the list, verify you can see it but not approve it.
2. As the responsable: open the detail modal, click Aprobar, fill usuario/contraseña VPN (try the
   password generator), confirm it moves to `APROBADO` and the credentials show.
3. Back as the solicitante: confirm you can now see the usuario/contraseña VPN of your own request
   in the detail modal (without `credenciales-vpn` permission).
4. Create a second solicitud, have the responsable Observar it with a comment, confirm the
   solicitante can edit and resubmit it (back to `PENDIENTE`).
5. Create a third solicitud, have the responsable Rechazar it with a comment, confirm the Editar
   button now shows the "ya fue resuelta" alert and does not open the form.
6. As the responsable (or admin), check the Dashboard shows the "Solicitudes VPN pendientes" card
   with the correct count and that it links to `/vpn`.

Report explicitly which of these six flows you exercised in the browser and what you observed —
do not report this task as complete without having done so, per this project's verification
standard (type-checking and unit tests verify code correctness, not feature correctness).

- [ ] **Step 5: Fix any issues found, then final commit if needed**

If Step 4 surfaces bugs, fix them with a normal edit/test/commit cycle following the patterns
established in Tasks 6/7 (backend) or 11–13 (frontend) — do not skip writing/updating a test for
the fix.
