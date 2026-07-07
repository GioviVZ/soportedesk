# VPN Titular Externo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a VPN solicitud's titular (the person the access belongs to) be either an AD user found via live search, INIA staff not synced to AD (captured manually with sede/dependencia/tipo de contrato), or a genuine external third party (captured manually with empresa/motivo) — plus a mandatory "cargo" field for all three.

**Architecture:** The static "load all AD users" dropdown becomes a live search against the existing `GET /api/usuarios-red?search=` endpoint. When it returns nothing, the form offers two manual-entry branches that populate new `titular_*` columns on `vpn` instead of the `usuario_red_id` FK. `VpnService.copySolicitudFields` branches on whether `usuarioRedId` was supplied.

**Tech Stack:** Spring Boot 3 / Java, Angular 17+ standalone components (Reactive + Template-driven forms mixed in one component), JUnit + Mockito + MockMvc (backend), Karma/Jasmine (frontend).

## Global Constraints

- `usuario_red_id` is already nullable in the database (migration `2026-06-16-vpn-refactor.sql`, "para permitir datos existentes") — no migration needed for that column.
- New fields use the `titular_*` / `titular*` prefix, never `solicitante_*` — `Vpn.solicitadoPor`/`solicitadoPorNombre` already exist and mean "who filled the form" (the asistente), a different concept from "who the VPN belongs to."
- Do **not** reuse `UbicacionSelectComponent` for the Sede/Dependencia/Tipo de contrato picker — it always renders a Subdependencia dropdown with no way to hide it, which this feature doesn't need; build a small standalone Sede→Dependencia + Tipo de contrato selector directly on `CatalogoService` instead.
- `titular_cargo` applies to **all 3** titular types (AD, `INTERNO_MANUAL`, `EXTERNO`) and is **required** — closed list of exactly 6 values: `Director`, `Secretaria`, `Profesional`, `Gerente`, `Presidente Ejecutivo`, `Practicante`. Modeled as `String` + `@NotBlank`, no new catalog table (same lightweight treatment as `tipoEquipo`).
- `titular_tipo_contrato_id` (Sede/Dependencia/Tipo de contrato in general) applies **only** to `INTERNO_MANUAL` — AD users already carry `tipoContrato` on `UsuarioRed`, and `EXTERNO` uses `titularEmpresa`/`titularMotivo` instead.
- `*ControllerIT` tests run under Maven's `verify`/`integration-test` phase (Failsafe), not `test` (Surefire) — use `mvn verify -Dit.test=<Class>`.
- Full spec: `docs/superpowers/specs/2026-07-07-vpn-titular-externo-design.md`.

---

## Task 1: Migration SQL

**Files:**
- Create: `docs/superpowers/migrations/2026-07-07-vpn-titular-externo.sql`

**Interfaces:**
- Produces: the 10 new columns on `dbo.vpn` every later task assumes exist: `titular_tipo`,
  `titular_nombre`, `titular_apellidos`, `titular_correo`, `titular_sede_id`,
  `titular_dependencia_id`, `titular_tipo_contrato_id`, `titular_empresa`, `titular_motivo`,
  `titular_cargo`.

- [ ] **Step 1: Write the migration file**

```sql
-- Migracion: titular externo / personal INIA sin cuenta AD para VPN
-- Ejecutar en: ssti (SQL Server)
-- Idempotente: se puede volver a ejecutar sin duplicar columnas.

IF COL_LENGTH('dbo.vpn', 'titular_tipo') IS NULL
BEGIN
    ALTER TABLE dbo.vpn ADD titular_tipo NVARCHAR(20) NOT NULL CONSTRAINT df_vpn_titular_tipo DEFAULT 'AD';
END;
GO

IF COL_LENGTH('dbo.vpn', 'titular_nombre') IS NULL
BEGIN
    ALTER TABLE dbo.vpn ADD titular_nombre NVARCHAR(150) NULL;
END;
GO

IF COL_LENGTH('dbo.vpn', 'titular_apellidos') IS NULL
BEGIN
    ALTER TABLE dbo.vpn ADD titular_apellidos NVARCHAR(150) NULL;
END;
GO

IF COL_LENGTH('dbo.vpn', 'titular_correo') IS NULL
BEGIN
    ALTER TABLE dbo.vpn ADD titular_correo NVARCHAR(150) NULL;
END;
GO

IF COL_LENGTH('dbo.vpn', 'titular_sede_id') IS NULL
BEGIN
    ALTER TABLE dbo.vpn ADD titular_sede_id BIGINT NULL;
    ALTER TABLE dbo.vpn ADD CONSTRAINT fk_vpn_titular_sede FOREIGN KEY (titular_sede_id) REFERENCES dbo.sedes(id);
END;
GO

IF COL_LENGTH('dbo.vpn', 'titular_dependencia_id') IS NULL
BEGIN
    ALTER TABLE dbo.vpn ADD titular_dependencia_id BIGINT NULL;
    ALTER TABLE dbo.vpn ADD CONSTRAINT fk_vpn_titular_dependencia FOREIGN KEY (titular_dependencia_id) REFERENCES dbo.dependencias(id);
END;
GO

IF COL_LENGTH('dbo.vpn', 'titular_tipo_contrato_id') IS NULL
BEGIN
    ALTER TABLE dbo.vpn ADD titular_tipo_contrato_id BIGINT NULL;
    ALTER TABLE dbo.vpn ADD CONSTRAINT fk_vpn_titular_tipo_contrato FOREIGN KEY (titular_tipo_contrato_id) REFERENCES dbo.tipos_contrato(id);
END;
GO

IF COL_LENGTH('dbo.vpn', 'titular_empresa') IS NULL
BEGIN
    ALTER TABLE dbo.vpn ADD titular_empresa NVARCHAR(150) NULL;
END;
GO

IF COL_LENGTH('dbo.vpn', 'titular_motivo') IS NULL
BEGIN
    ALTER TABLE dbo.vpn ADD titular_motivo NVARCHAR(500) NULL;
END;
GO

IF COL_LENGTH('dbo.vpn', 'titular_cargo') IS NULL
BEGIN
    ALTER TABLE dbo.vpn ADD titular_cargo NVARCHAR(30) NOT NULL CONSTRAINT df_vpn_titular_cargo DEFAULT 'Profesional';
END;
GO

-- Verificacion
SELECT titular_tipo, COUNT(*) AS filas FROM dbo.vpn GROUP BY titular_tipo;
GO
```

- [ ] **Step 2: Ask the user to run this migration against the `ssti` SQL Server database**

Confirm with the user that it ran successfully before Task 4 (the earliest task that touches
real request/response shapes end-to-end) — same reasoning as the original VPN redesign plan:
`ddl-auto: none` means adding JPA fields alone won't break compilation or unit tests, but any real
query against `vpn` (including this whole feature's manual verification) needs the columns to
exist.

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/migrations/2026-07-07-vpn-titular-externo.sql
git commit -m "feat(vpn): add titular_* columns for manual/external titular support"
```

---

## Task 2: Backend — `Vpn.java` entity fields + transient display getters

**Files:**
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/vpn/Vpn.java`

**Interfaces:**
- Produces: `titularTipo/titularNombre/titularApellidos/titularCorreo: String`,
  `titularSede: Sede`, `titularDependencia: Dependencia`, `titularTipoContrato: TipoContrato`,
  `titularEmpresa/titularMotivo/titularCargo: String` (getters/setters via Lombok),
  `getTitularNombreCompleto(): String`, `getTitularOrigenLabel(): String` — consumed by Task 3
  (service logic), Task 4 (tests), and the frontend (Jackson serializes the two transient getters
  as plain JSON fields).

No dedicated entity test exists in this codebase (verified: no `VpnTest.java`) — this task is
verified by compilation and by Task 4's `VpnServiceTest` assertions on the returned `Vpn` object.

- [ ] **Step 1: Rewrite `Vpn.java`**

```java
package com.inia.soportedesk.vpn;

import com.inia.soportedesk.catalogo.Dependencia;
import com.inia.soportedesk.catalogo.Sede;
import com.inia.soportedesk.catalogo.TipoContrato;
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

    @Column(name = "titular_tipo", nullable = false)
    private String titularTipo = "AD";

    @Column(name = "titular_nombre")
    private String titularNombre;

    @Column(name = "titular_apellidos")
    private String titularApellidos;

    @Column(name = "titular_correo")
    private String titularCorreo;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "titular_sede_id")
    private Sede titularSede;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "titular_dependencia_id")
    private Dependencia titularDependencia;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "titular_tipo_contrato_id")
    private TipoContrato titularTipoContrato;

    @Column(name = "titular_empresa")
    private String titularEmpresa;

    @Column(name = "titular_motivo", length = 500)
    private String titularMotivo;

    @Column(name = "titular_cargo", nullable = false)
    private String titularCargo;

    @Transient
    public String getTitularNombreCompleto() {
        if (usuarioRed != null) return usuarioRed.getNombre();
        String apellidos = titularApellidos == null ? "" : " " + titularApellidos;
        return (titularNombre == null ? "" : titularNombre) + apellidos;
    }

    @Transient
    public String getTitularOrigenLabel() {
        return switch (titularTipo) {
            case "INTERNO_MANUAL" -> "Interno (manual)";
            case "EXTERNO" -> "Externo";
            default -> "AD";
        };
    }
}
```

- [ ] **Step 2: Compile-check**

Run: `cd soportedesk-backend && mvn compile -q`
Expected: BUILD SUCCESS.

- [ ] **Step 3: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/vpn/Vpn.java
git commit -m "feat(vpn): add titular_* fields and display getters to Vpn entity"
```

---

## Task 3: Backend — `VpnRequest.java` — optional `usuarioRedId`, new titular fields

**Files:**
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/vpn/VpnRequest.java`

**Interfaces:**
- Produces: `usuarioRedId: Long` (now optional), `titularTipo/titularNombre/titularApellidos/
  titularCorreo/titularEmpresa/titularMotivo: String`, `titularSedeId/titularDependenciaId/
  titularTipoContratoId: Long`, `titularCargo: String` (`@NotBlank`) — consumed by Task 4
  (`VpnService`) and Task 5 (`VpnControllerIT`).

No dedicated test for this DTO — validation is exercised via `VpnControllerIT` (Task 5, real Bean
Validation through `@Valid @RequestBody`) and `VpnServiceTest` (Task 4, business-rule validation
that bypasses Bean Validation since it calls the service directly).

- [ ] **Step 1: Rewrite `VpnRequest.java`**

```java
package com.inia.soportedesk.vpn;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VpnRequest {

    private Long usuarioRedId;

    private String titularTipo;
    private String titularNombre;
    private String titularApellidos;
    private String titularCorreo;
    private Long titularSedeId;
    private Long titularDependenciaId;
    private Long titularTipoContratoId;
    private String titularEmpresa;
    private String titularMotivo;

    @NotBlank
    private String titularCargo;

    @NotBlank
    private String tipoEquipo;

    private Long glpiComputerId;

    private Boolean antivirusVerificado;

    private Boolean analisisAntivirusRealizado;

    private Boolean hostActualizado;
}
```

- [ ] **Step 2: Compile-check**

Run: `cd soportedesk-backend && mvn compile -q`
Expected: BUILD SUCCESS (nothing else references `@NotNull` on `usuarioRedId` — verified via
`grep -rn "NotNull" soportedesk-backend/src/main/java/com/inia/soportedesk/vpn/`, which after this
edit returns no results in this package).

- [ ] **Step 3: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/vpn/VpnRequest.java
git commit -m "feat(vpn): make usuarioRedId optional, add titular_* request fields"
```

(The repo will not compile cleanly end-to-end between this commit and Task 4's — `VpnService.java`
still calls the old unconditional `usuarioRedRepository.findById(request.getUsuarioRedId())`, which
is fine syntactically but wrong behaviorally; Task 4 fixes it.)

---

## Task 4: Backend — `VpnService.java` titular branching logic (TDD)

**Files:**
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/vpn/VpnService.java`
- Modify: `soportedesk-backend/src/test/java/com/inia/soportedesk/vpn/VpnServiceTest.java`

**Interfaces:**
- Consumes: `SedeRepository`/`DependenciaRepository`/`TipoContratoRepository`
  (`com.inia.soportedesk.catalogo`, all pre-existing, same `ssti` datasource as `VpnRepository`).
- Produces: `VpnService` now has 3 additional constructor-injected dependencies (via
  `@RequiredArgsConstructor` — no new public methods, `copySolicitudFields` behavior changes) —
  consumed by nothing new downstream (this is the last backend logic task before controller tests).

- [ ] **Step 1: Update `sampleRequest()` and add new test cases to `VpnServiceTest.java`**

Add the 3 new `@Mock` fields (right after the existing `usuarioRepository` mock):

```java
    @Mock
    private com.inia.soportedesk.catalogo.SedeRepository sedeRepository;

    @Mock
    private com.inia.soportedesk.catalogo.DependenciaRepository dependenciaRepository;

    @Mock
    private com.inia.soportedesk.catalogo.TipoContratoRepository tipoContratoRepository;
```

Update `sampleRequest()` to include the new required field:

```java
    private VpnRequest sampleRequest() {
        VpnRequest request = new VpnRequest();
        request.setUsuarioRedId(1L);
        request.setTipoEquipo("PERSONAL");
        request.setAntivirusVerificado(true);
        request.setAnalisisAntivirusRealizado(true);
        request.setTitularCargo("Profesional");
        return request;
    }
```

Add these test methods (anywhere after `crearSolicitud_withUnknownGlpiId_throwsResourceNotFoundException`):

```java
    @Test
    void crearSolicitud_withTitularInternoManual_savesManualFieldsAndClearsUsuarioRed() {
        when(usuarioRepository.findByUsername(any())).thenReturn(Optional.empty());
        when(repository.save(any(Vpn.class))).thenAnswer(inv -> inv.getArgument(0));

        com.inia.soportedesk.catalogo.Sede sede = new com.inia.soportedesk.catalogo.Sede();
        sede.setId(2L);
        sede.setNombre("Sede Central");
        when(sedeRepository.findById(2L)).thenReturn(Optional.of(sede));

        com.inia.soportedesk.catalogo.Dependencia dependencia = new com.inia.soportedesk.catalogo.Dependencia();
        dependencia.setId(3L);
        dependencia.setNombre("TI");
        when(dependenciaRepository.findById(3L)).thenReturn(Optional.of(dependencia));

        com.inia.soportedesk.catalogo.TipoContrato tipoContrato = new com.inia.soportedesk.catalogo.TipoContrato();
        tipoContrato.setId(4L);
        tipoContrato.setNombre("CAS");
        when(tipoContratoRepository.findById(4L)).thenReturn(Optional.of(tipoContrato));

        VpnRequest request = new VpnRequest();
        request.setTitularTipo("INTERNO_MANUAL");
        request.setTitularNombre("Ana");
        request.setTitularApellidos("Gómez");
        request.setTitularCorreo("ana.gomez@inia.gob.pe");
        request.setTitularSedeId(2L);
        request.setTitularDependenciaId(3L);
        request.setTitularTipoContratoId(4L);
        request.setTitularCargo("Practicante");
        request.setTipoEquipo("PERSONAL");
        request.setAntivirusVerificado(true);
        request.setAnalisisAntivirusRealizado(true);

        Vpn result = service.crearSolicitud(request, authAs("jasistente"));

        assertThat(result.getUsuarioRed()).isNull();
        assertThat(result.getTitularTipo()).isEqualTo("INTERNO_MANUAL");
        assertThat(result.getTitularNombre()).isEqualTo("Ana");
        assertThat(result.getTitularSede().getNombre()).isEqualTo("Sede Central");
        assertThat(result.getTitularDependencia().getNombre()).isEqualTo("TI");
        assertThat(result.getTitularTipoContrato().getNombre()).isEqualTo("CAS");
        assertThat(result.getTitularCargo()).isEqualTo("Practicante");
        assertThat(result.getTitularNombreCompleto()).isEqualTo("Ana Gómez");
        assertThat(result.getTitularOrigenLabel()).isEqualTo("Interno (manual)");
    }

    @Test
    void crearSolicitud_withTitularInternoManual_missingTipoContrato_throwsIllegalArgumentException() {
        VpnRequest request = new VpnRequest();
        request.setTitularTipo("INTERNO_MANUAL");
        request.setTitularNombre("Ana");
        request.setTitularApellidos("Gómez");
        request.setTitularCorreo("ana.gomez@inia.gob.pe");
        request.setTitularSedeId(2L);
        request.setTitularDependenciaId(3L);
        request.setTitularCargo("Practicante");
        request.setTipoEquipo("PERSONAL");

        assertThatThrownBy(() -> service.crearSolicitud(request, authAs("jasistente")))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void crearSolicitud_withTitularExterno_savesManualFieldsAndClearsCatalogRefs() {
        when(usuarioRepository.findByUsername(any())).thenReturn(Optional.empty());
        when(repository.save(any(Vpn.class))).thenAnswer(inv -> inv.getArgument(0));

        VpnRequest request = new VpnRequest();
        request.setTitularTipo("EXTERNO");
        request.setTitularNombre("Juan");
        request.setTitularApellidos("Pérez");
        request.setTitularCorreo("juan@externo.com");
        request.setTitularEmpresa("ACME SAC");
        request.setTitularMotivo("Consultoria - Proyecto X");
        request.setTitularCargo("Gerente");
        request.setTipoEquipo("PERSONAL");
        request.setAntivirusVerificado(true);
        request.setAnalisisAntivirusRealizado(true);

        Vpn result = service.crearSolicitud(request, authAs("jasistente"));

        assertThat(result.getUsuarioRed()).isNull();
        assertThat(result.getTitularTipo()).isEqualTo("EXTERNO");
        assertThat(result.getTitularEmpresa()).isEqualTo("ACME SAC");
        assertThat(result.getTitularMotivo()).isEqualTo("Consultoria - Proyecto X");
        assertThat(result.getTitularSede()).isNull();
        assertThat(result.getTitularNombreCompleto()).isEqualTo("Juan Pérez");
        assertThat(result.getTitularOrigenLabel()).isEqualTo("Externo");
    }

    @Test
    void crearSolicitud_withTitularExterno_missingMotivo_throwsIllegalArgumentException() {
        VpnRequest request = new VpnRequest();
        request.setTitularTipo("EXTERNO");
        request.setTitularNombre("Juan");
        request.setTitularApellidos("Pérez");
        request.setTitularCorreo("juan@externo.com");
        request.setTitularEmpresa("ACME SAC");
        request.setTitularCargo("Gerente");
        request.setTipoEquipo("PERSONAL");

        assertThatThrownBy(() -> service.crearSolicitud(request, authAs("jasistente")))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void crearSolicitud_withoutUsuarioRedIdOrValidTitularTipo_throwsIllegalArgumentException() {
        VpnRequest request = new VpnRequest();
        request.setTipoEquipo("PERSONAL");
        request.setTitularCargo("Profesional");

        assertThatThrownBy(() -> service.crearSolicitud(request, authAs("jasistente")))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void getTitularNombreCompleto_forAdTitular_returnsUsuarioRedNombre() {
        Vpn vpn = new Vpn();
        UsuarioRed usuarioRed = new UsuarioRed();
        usuarioRed.setNombre("Carlos Ruiz");
        vpn.setUsuarioRed(usuarioRed);

        assertThat(vpn.getTitularNombreCompleto()).isEqualTo("Carlos Ruiz");
        assertThat(vpn.getTitularOrigenLabel()).isEqualTo("AD");
    }
```

- [ ] **Step 2: Run the tests to verify the new ones fail**

Run: `cd soportedesk-backend && mvn test -Dtest=VpnServiceTest -q`
Expected: COMPILE FAILURE / FAIL — `VpnService`'s constructor doesn't accept
`SedeRepository`/`DependenciaRepository`/`TipoContratoRepository` yet, and `copySolicitudFields`
doesn't branch on `titularTipo`.

- [ ] **Step 3: Rewrite `VpnService.java`**

```java
package com.inia.soportedesk.vpn;

import com.inia.soportedesk.auth.Usuario;
import com.inia.soportedesk.auth.UsuarioRepository;
import com.inia.soportedesk.catalogo.Dependencia;
import com.inia.soportedesk.catalogo.DependenciaRepository;
import com.inia.soportedesk.catalogo.Sede;
import com.inia.soportedesk.catalogo.SedeRepository;
import com.inia.soportedesk.catalogo.TipoContrato;
import com.inia.soportedesk.catalogo.TipoContratoRepository;
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
    private final SedeRepository sedeRepository;
    private final DependenciaRepository dependenciaRepository;
    private final TipoContratoRepository tipoContratoRepository;

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

    public VpnKpisDto getKpis() {
        return new VpnKpisDto(
                repository.countByEstadoSolicitud("PENDIENTE"),
                repository.countByEstadoSolicitud("APROBADO"),
                repository.countByEstadoSolicitud("RECHAZADO"),
                repository.countByEstadoSolicitud("OBSERVADO")
        );
    }

    @Transactional
    public Vpn crearSolicitud(VpnRequest request, Authentication auth) {
        Vpn vpn = new Vpn();
        vpn.setEstadoSolicitud("PENDIENTE");
        // "estado" (Activo/Inactivo) es NOT NULL en la BD y solo cobra sentido una vez
        // aprobada la solicitud; hasta entonces el acceso VPN no está activo.
        vpn.setEstado("Inactivo");
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
        vpn.setTipoEquipo(request.getTipoEquipo());
        vpn.setAntivirusVerificado(request.getAntivirusVerificado());
        vpn.setAnalisisAntivirusRealizado(request.getAnalisisAntivirusRealizado());
        vpn.setTitularCargo(request.getTitularCargo());

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

        if (request.getUsuarioRedId() != null) {
            UsuarioRed usuarioRed = usuarioRedRepository.findById(request.getUsuarioRedId())
                    .orElseThrow(() -> new ResourceNotFoundException("Usuario de red no encontrado: " + request.getUsuarioRedId()));
            vpn.setUsuarioRed(usuarioRed);
            vpn.setTitularTipo("AD");
            vpn.setTitularNombre(null);
            vpn.setTitularApellidos(null);
            vpn.setTitularCorreo(null);
            vpn.setTitularSede(null);
            vpn.setTitularDependencia(null);
            vpn.setTitularTipoContrato(null);
            vpn.setTitularEmpresa(null);
            vpn.setTitularMotivo(null);
        } else {
            String tipo = request.getTitularTipo();
            if (!"INTERNO_MANUAL".equals(tipo) && !"EXTERNO".equals(tipo)) {
                throw new IllegalArgumentException("Debe seleccionar un usuario de red o indicar los datos del titular manual");
            }
            if (isBlank(request.getTitularNombre()) || isBlank(request.getTitularApellidos()) || isBlank(request.getTitularCorreo())) {
                throw new IllegalArgumentException("Nombre, apellidos y correo del titular son obligatorios");
            }
            vpn.setUsuarioRed(null);
            vpn.setTitularTipo(tipo);
            vpn.setTitularNombre(request.getTitularNombre());
            vpn.setTitularApellidos(request.getTitularApellidos());
            vpn.setTitularCorreo(request.getTitularCorreo());
            if ("INTERNO_MANUAL".equals(tipo)) {
                if (request.getTitularSedeId() == null || request.getTitularDependenciaId() == null
                        || request.getTitularTipoContratoId() == null) {
                    throw new IllegalArgumentException("Sede, dependencia y tipo de contrato son obligatorios para personal INIA sin cuenta AD");
                }
                Sede sede = sedeRepository.findById(request.getTitularSedeId())
                        .orElseThrow(() -> new ResourceNotFoundException("Sede no encontrada: " + request.getTitularSedeId()));
                Dependencia dependencia = dependenciaRepository.findById(request.getTitularDependenciaId())
                        .orElseThrow(() -> new ResourceNotFoundException("Dependencia no encontrada: " + request.getTitularDependenciaId()));
                TipoContrato tipoContrato = tipoContratoRepository.findById(request.getTitularTipoContratoId())
                        .orElseThrow(() -> new ResourceNotFoundException("Tipo de contrato no encontrado: " + request.getTitularTipoContratoId()));
                vpn.setTitularSede(sede);
                vpn.setTitularDependencia(dependencia);
                vpn.setTitularTipoContrato(tipoContrato);
                vpn.setTitularEmpresa(null);
                vpn.setTitularMotivo(null);
            } else {
                if (isBlank(request.getTitularEmpresa()) || isBlank(request.getTitularMotivo())) {
                    throw new IllegalArgumentException("Empresa y motivo son obligatorios para un tercero externo");
                }
                vpn.setTitularSede(null);
                vpn.setTitularDependencia(null);
                vpn.setTitularTipoContrato(null);
                vpn.setTitularEmpresa(request.getTitularEmpresa());
                vpn.setTitularMotivo(request.getTitularMotivo());
            }
        }
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
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

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd soportedesk-backend && mvn test -Dtest=VpnServiceTest -q`
Expected: PASS (22 test methods total).

- [ ] **Step 5: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/vpn/VpnService.java \
        soportedesk-backend/src/test/java/com/inia/soportedesk/vpn/VpnServiceTest.java
git commit -m "feat(vpn): branch crearSolicitud/actualizarSolicitud on titular type"
```

---

## Task 5: Backend — `VpnControllerIT` — validation boundary tests

**Files:**
- Modify: `soportedesk-backend/src/test/java/com/inia/soportedesk/vpn/VpnControllerIT.java`

**Interfaces:**
- Consumes: `VpnRequest.titularCargo` `@NotBlank` (Task 3) — this is the only place in the whole
  plan that exercises Bean Validation on `titularCargo` through the real Spring MVC pipeline
  (`VpnServiceTest` calls the service directly, bypassing `@Valid`).

- [ ] **Step 1: Update `sampleRequest()` and add new tests**

Update the existing `sampleRequest()` helper:

```java
    private VpnRequest sampleRequest() {
        VpnRequest request = new VpnRequest();
        request.setUsuarioRedId(1L);
        request.setTipoEquipo("PERSONAL");
        request.setAntivirusVerificado(true);
        request.setAnalisisAntivirusRealizado(true);
        request.setTitularCargo("Profesional");
        return request;
    }
```

Add these tests (anywhere after `create_withoutSolicitarAuthority_returnsForbidden`):

```java
    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "WRITE_solicitar-vpn"})
    void create_withTitularExterno_returnsCreated() throws Exception {
        Vpn saved = sampleVpn();
        saved.setTitularTipo("EXTERNO");
        when(service.crearSolicitud(any(), any())).thenReturn(saved);

        VpnRequest request = new VpnRequest();
        request.setTipoEquipo("PERSONAL");
        request.setAntivirusVerificado(true);
        request.setAnalisisAntivirusRealizado(true);
        request.setTitularCargo("Profesional");
        request.setTitularTipo("EXTERNO");
        request.setTitularNombre("Juan");
        request.setTitularApellidos("Pérez");
        request.setTitularCorreo("juan@externo.com");
        request.setTitularEmpresa("ACME SAC");
        request.setTitularMotivo("Consultoria");

        mockMvc.perform(post("/api/vpn")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }

    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "WRITE_solicitar-vpn"})
    void create_withoutTitularCargo_returnsBadRequest() throws Exception {
        VpnRequest request = sampleRequest();
        request.setTitularCargo(null);

        mockMvc.perform(post("/api/vpn")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
```

- [ ] **Step 2: Run the tests**

Run: `cd soportedesk-backend && mvn verify -Dit.test=VpnControllerIT -q`
Expected: PASS.

- [ ] **Step 3: Run the full backend suite**

Run: `cd soportedesk-backend && mvn verify -q`
Expected: BUILD SUCCESS.

- [ ] **Step 4: Commit**

```bash
git add soportedesk-backend/src/test/java/com/inia/soportedesk/vpn/VpnControllerIT.java
git commit -m "test(vpn): cover titularCargo validation and EXTERNO creation end to end"
```

---

## Task 6: Frontend — `vpn.model.ts` — titular fields + `CARGOS_VPN`

**Files:**
- Modify: `soportedesk-frontend/src/app/features/vpn/vpn.model.ts`

**Interfaces:**
- Produces: `Vpn.titularTipo/titularNombre/titularApellidos/titularCorreo/titularEmpresa/
  titularMotivo/titularCargo/titularNombreCompleto/titularOrigenLabel: string`,
  `Vpn.titularSede/titularDependencia/titularTipoContrato: { id: number; nombre: string } | null`,
  `CARGOS_VPN: readonly string[]`, `VpnSolicitudRequest` with the matching `titular*Id` fields —
  consumed by Task 7 (form component) and Task 9 (list/detail display).

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
  titularTipo: 'AD' | 'INTERNO_MANUAL' | 'EXTERNO';
  titularNombre: string | null;
  titularApellidos: string | null;
  titularCorreo: string | null;
  titularSede: { id: number; nombre: string } | null;
  titularDependencia: { id: number; nombre: string } | null;
  titularTipoContrato: { id: number; nombre: string } | null;
  titularEmpresa: string | null;
  titularMotivo: string | null;
  titularCargo: string;
  titularNombreCompleto: string;
  titularOrigenLabel: string;
}

export const CARGOS_VPN = [
  'Director',
  'Secretaria',
  'Profesional',
  'Gerente',
  'Presidente Ejecutivo',
  'Practicante',
] as const;

export interface VpnSolicitudRequest {
  usuarioRedId: number | null;
  titularTipo: 'INTERNO_MANUAL' | 'EXTERNO' | null;
  titularNombre: string | null;
  titularApellidos: string | null;
  titularCorreo: string | null;
  titularSedeId: number | null;
  titularDependenciaId: number | null;
  titularTipoContratoId: number | null;
  titularEmpresa: string | null;
  titularMotivo: string | null;
  titularCargo: string;
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

export interface VpnKpis {
  pendientes: number;
  aprobadas: number;
  rechazadas: number;
  observadas: number;
}
```

- [ ] **Step 2: Compile-check**

Run: `cd soportedesk-frontend && npx tsc --noEmit -p tsconfig.app.json`
Expected: errors in `vpn-form.component.ts` (still builds the old request shape) — expected, fixed
in Task 7. Confirm no errors outside the `vpn` feature folder.

- [ ] **Step 3: Commit**

```bash
git add soportedesk-frontend/src/app/features/vpn/vpn.model.ts
git commit -m "feat(vpn): add titular_* fields and CARGOS_VPN to frontend model"
```

---

## Task 7: Frontend — `vpn-form.component` — live AD search + manual titular capture

**Files:**
- Modify: `soportedesk-frontend/src/app/features/vpn/vpn-form.component.ts`
- Modify: `soportedesk-frontend/src/app/features/vpn/vpn-form.component.html`
- Modify: `soportedesk-frontend/src/app/features/vpn/vpn-form.component.scss`

**Interfaces:**
- Consumes: `UsuarioRedService.getAll(search): Observable<UsuarioRed[]>` (already exists,
  `soportedesk-frontend/src/app/features/usuarios-red/usuario-red.service.ts:12`),
  `CatalogoService.getSedes()/getDependencias(sedeId)/getTiposContrato()` (already exist,
  `soportedesk-frontend/src/app/core/catalogos/catalogo.service.ts`), `CARGOS_VPN` (Task 6).
- Produces: `VpnFormComponent` now builds a `VpnSolicitudRequest` matching Task 6's shape — no
  change to its public `@Input()`/`@Output()` contract (`[vpn]`, `(saved)`, `(cancelled)`), so
  `vpn-list.component.html`'s usage of `<app-vpn-form>` (Task 9) needs no changes.

No dedicated `.spec.ts` exists for this component — verified via `ng build` (Angular's strict
template type-checking) and the manual check in Task 9.

- [ ] **Step 1: Rewrite `vpn-form.component.ts`**

```typescript
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CARGOS_VPN, Vpn } from './vpn.model';
import { VpnService } from './vpn.service';
import { UsuarioRedService } from '../usuarios-red/usuario-red.service';
import { EquipoService } from '../equipos/equipo.service';
import { UsuarioRed } from '../usuarios-red/usuario-red.model';
import { EquipoResumen } from '../equipos/equipo.model';
import { CatalogoService } from '../../core/catalogos/catalogo.service';
import { Sede, Dependencia, TipoContrato } from '../../core/models/catalogo.model';

type TitularModo = 'buscando' | 'ad-seleccionado' | 'interno-manual' | 'externo';

@Component({
  selector: 'app-vpn-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './vpn-form.component.html',
  styleUrl: './vpn-form.component.scss',
})
export class VpnFormComponent implements OnInit, OnChanges {
  private fb = inject(FormBuilder);
  private service = inject(VpnService);
  private usuarioRedService = inject(UsuarioRedService);
  private equipoService = inject(EquipoService);
  private catalogoService = inject(CatalogoService);

  @Input() vpn: Vpn | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  readonly cargos = CARGOS_VPN;

  titularModo: TitularModo = 'buscando';
  adSearchTerm = '';
  adResults: UsuarioRed[] = [];
  adBusquedaRealizada = false;
  private adSearchTimeout?: ReturnType<typeof setTimeout>;

  selectedAdUserId: number | null = null;
  adUserSelected: UsuarioRed | null = null;

  sedes: Sede[] = [];
  dependencias: Dependencia[] = [];
  tiposContrato: TipoContrato[] = [];
  titularSedeId: number | null = null;
  titularDependenciaId: number | null = null;
  titularTipoContratoId: number | null = null;

  equipoResults: EquipoResumen[] = [];
  equipoSeleccionado: EquipoResumen | null = null;
  equipoSearchTerm = '';
  private equipoSearchTimeout?: ReturnType<typeof setTimeout>;

  form = this.fb.nonNullable.group({
    titularNombre: [''],
    titularApellidos: [''],
    titularCorreo: [''],
    titularEmpresa: [''],
    titularMotivo: [''],
    titularCargo: ['', Validators.required],
    tipoEquipo: ['PERSONAL' as 'INIA' | 'PERSONAL', Validators.required],
    tieneGlpi: [false],
    glpiComputerId: [null as number | null],
    antivirusVerificado: [false],
    analisisAntivirusRealizado: [false],
    hostActualizado: [false],
  });

  get esInia(): boolean {
    return this.form.getRawValue().tipoEquipo === 'INIA';
  }

  get tieneGlpi(): boolean {
    return this.form.getRawValue().tieneGlpi;
  }

  ngOnInit(): void {
    this.catalogoService.getSedes().subscribe((data) => (this.sedes = data));
    this.catalogoService.getTiposContrato().subscribe((data) => (this.tiposContrato = data));
  }

  ngOnChanges(): void {
    if (this.vpn) {
      this.form.patchValue({
        tipoEquipo: (this.vpn.tipoEquipo ?? 'PERSONAL') as 'INIA' | 'PERSONAL',
        tieneGlpi: this.vpn.glpiComputerId !== null,
        glpiComputerId: this.vpn.glpiComputerId,
        antivirusVerificado: this.vpn.antivirusVerificado ?? false,
        analisisAntivirusRealizado: this.vpn.analisisAntivirusRealizado ?? false,
        hostActualizado: this.vpn.hostActualizado ?? false,
        titularCargo: this.vpn.titularCargo ?? '',
      });
      if (this.vpn.glpiComputerId && this.vpn.glpiNombreEquipo) {
        this.equipoSeleccionado = {
          computerID: this.vpn.glpiComputerId,
          nombreEquipo: this.vpn.glpiNombreEquipo,
          ipEquipo: this.vpn.glpiIpEquipo,
        } as EquipoResumen;
      }
      if (this.vpn.usuarioRed) {
        this.selectedAdUserId = this.vpn.usuarioRed.id;
        this.adUserSelected = this.vpn.usuarioRed as UsuarioRed;
        this.setTitularModo('ad-seleccionado');
      } else if (this.vpn.titularTipo === 'INTERNO_MANUAL') {
        this.form.patchValue({
          titularNombre: this.vpn.titularNombre ?? '',
          titularApellidos: this.vpn.titularApellidos ?? '',
          titularCorreo: this.vpn.titularCorreo ?? '',
        });
        this.titularSedeId = this.vpn.titularSede?.id ?? null;
        this.titularDependenciaId = this.vpn.titularDependencia?.id ?? null;
        this.titularTipoContratoId = this.vpn.titularTipoContrato?.id ?? null;
        if (this.titularSedeId) {
          this.catalogoService.getDependencias(this.titularSedeId).subscribe((data) => (this.dependencias = data));
        }
        this.setTitularModo('interno-manual');
      } else if (this.vpn.titularTipo === 'EXTERNO') {
        this.form.patchValue({
          titularNombre: this.vpn.titularNombre ?? '',
          titularApellidos: this.vpn.titularApellidos ?? '',
          titularCorreo: this.vpn.titularCorreo ?? '',
          titularEmpresa: this.vpn.titularEmpresa ?? '',
          titularMotivo: this.vpn.titularMotivo ?? '',
        });
        this.setTitularModo('externo');
      }
    } else {
      this.resetAll();
    }
  }

  onAdSearch(term: string): void {
    this.adSearchTerm = term;
    clearTimeout(this.adSearchTimeout);
    this.adSearchTimeout = setTimeout(() => {
      if (!term.trim()) {
        this.adResults = [];
        this.adBusquedaRealizada = false;
        return;
      }
      this.usuarioRedService.getAll(term).subscribe((data) => {
        this.adResults = data;
        this.adBusquedaRealizada = true;
      });
    }, 300);
  }

  onAdUserSelected(usuario: UsuarioRed): void {
    this.selectedAdUserId = usuario.id;
    this.adUserSelected = usuario;
    this.adResults = [];
    this.adSearchTerm = '';
    this.setTitularModo('ad-seleccionado');
  }

  onCambiarUsuario(): void {
    this.selectedAdUserId = null;
    this.adUserSelected = null;
    this.setTitularModo('buscando');
  }

  onElegirInternoManual(): void {
    this.setTitularModo('interno-manual');
  }

  onElegirExterno(): void {
    this.setTitularModo('externo');
  }

  onVolverABuscar(): void {
    this.titularSedeId = null;
    this.titularDependenciaId = null;
    this.titularTipoContratoId = null;
    this.dependencias = [];
    this.setTitularModo('buscando');
  }

  onSedeChange(value: string): void {
    const sedeId = value ? Number(value) : null;
    this.titularSedeId = sedeId;
    this.titularDependenciaId = null;
    this.dependencias = [];
    if (sedeId) {
      this.catalogoService.getDependencias(sedeId).subscribe((data) => (this.dependencias = data));
    }
  }

  onDependenciaChange(value: string): void {
    this.titularDependenciaId = value ? Number(value) : null;
  }

  onTipoContratoChange(value: string): void {
    this.titularTipoContratoId = value ? Number(value) : null;
  }

  setTitularModo(modo: TitularModo): void {
    this.titularModo = modo;
    this.applyTitularValidators();
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
    if (this.titularModo === 'buscando') {
      alert('Debe seleccionar un usuario de red, o indicar si es personal INIA sin cuenta AD o un tercero externo.');
      return;
    }
    if (this.titularModo === 'interno-manual' && (!this.titularSedeId || !this.titularDependenciaId || !this.titularTipoContratoId)) {
      alert('Complete sede, dependencia y tipo de contrato.');
      return;
    }
    const raw = this.form.getRawValue();
    const esManual = this.titularModo === 'interno-manual' || this.titularModo === 'externo';
    const request = {
      usuarioRedId: this.titularModo === 'ad-seleccionado' ? this.selectedAdUserId : null,
      titularTipo: this.titularModo === 'interno-manual' ? ('INTERNO_MANUAL' as const)
        : this.titularModo === 'externo' ? ('EXTERNO' as const)
        : null,
      titularNombre: esManual ? raw.titularNombre : null,
      titularApellidos: esManual ? raw.titularApellidos : null,
      titularCorreo: esManual ? raw.titularCorreo : null,
      titularSedeId: this.titularModo === 'interno-manual' ? this.titularSedeId : null,
      titularDependenciaId: this.titularModo === 'interno-manual' ? this.titularDependenciaId : null,
      titularTipoContratoId: this.titularModo === 'interno-manual' ? this.titularTipoContratoId : null,
      titularEmpresa: this.titularModo === 'externo' ? raw.titularEmpresa : null,
      titularMotivo: this.titularModo === 'externo' ? raw.titularMotivo : null,
      titularCargo: raw.titularCargo,
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

  private applyTitularValidators(): void {
    const nombre = this.form.controls.titularNombre;
    const apellidos = this.form.controls.titularApellidos;
    const correo = this.form.controls.titularCorreo;
    const empresa = this.form.controls.titularEmpresa;
    const motivo = this.form.controls.titularMotivo;

    if (this.titularModo === 'interno-manual' || this.titularModo === 'externo') {
      nombre.setValidators(Validators.required);
      apellidos.setValidators(Validators.required);
      correo.setValidators(Validators.required);
    } else {
      nombre.clearValidators();
      apellidos.clearValidators();
      correo.clearValidators();
    }

    if (this.titularModo === 'externo') {
      empresa.setValidators(Validators.required);
      motivo.setValidators(Validators.required);
    } else {
      empresa.clearValidators();
      motivo.clearValidators();
    }

    nombre.updateValueAndValidity();
    apellidos.updateValueAndValidity();
    correo.updateValueAndValidity();
    empresa.updateValueAndValidity();
    motivo.updateValueAndValidity();
  }

  private resetAll(): void {
    this.selectedAdUserId = null;
    this.adUserSelected = null;
    this.adSearchTerm = '';
    this.adResults = [];
    this.adBusquedaRealizada = false;
    this.titularSedeId = null;
    this.titularDependenciaId = null;
    this.titularTipoContratoId = null;
    this.dependencias = [];
    this.equipoSeleccionado = null;
    this.equipoResults = [];
    this.titularModo = 'buscando';
    this.form.reset({
      tipoEquipo: 'PERSONAL',
      tieneGlpi: false,
      antivirusVerificado: false,
      analisisAntivirusRealizado: false,
      hostActualizado: false,
      titularCargo: '',
    });
    this.applyTitularValidators();
  }
}
```

- [ ] **Step 2: Rewrite `vpn-form.component.html`**

```html
<form [formGroup]="form" (ngSubmit)="submit()">

  <!-- Titular: búsqueda AD / manual -->
  <div class="section-header ad-header">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
      <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" />
    </svg>
    Titular del acceso VPN
  </div>

  <ng-container *ngIf="titularModo === 'buscando'">
    <div class="field ad-field">
      <label>Buscar usuario de red (AD) *</label>
      <input type="text" [value]="adSearchTerm" (input)="onAdSearch($any($event.target).value)" placeholder="Nombre o usuario" />
      <ul class="equipo-results" *ngIf="adResults.length">
        <li *ngFor="let u of adResults" (click)="onAdUserSelected(u)">
          {{ u.nombre }} ({{ u.usuario }})
        </li>
      </ul>
    </div>

    <div class="titular-fallback" *ngIf="adBusquedaRealizada && adResults.length === 0">
      <p>No se encontró en AD. ¿Es personal de INIA sin cuenta AD, o un tercero externo?</p>
      <div class="actions">
        <button type="button" class="secondary" (click)="onElegirInternoManual()">Personal de INIA</button>
        <button type="button" class="secondary" (click)="onElegirExterno()">Tercero externo</button>
      </div>
    </div>
  </ng-container>

  <div class="ad-preview" *ngIf="titularModo === 'ad-seleccionado' && adUserSelected">
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
    <button type="button" class="secondary" (click)="onCambiarUsuario()">Cambiar usuario</button>
  </div>

  <ng-container *ngIf="titularModo === 'interno-manual'">
    <div class="field">
      <label>Nombre *</label>
      <input type="text" formControlName="titularNombre" />
    </div>
    <div class="field">
      <label>Apellidos *</label>
      <input type="text" formControlName="titularApellidos" />
    </div>
    <div class="field">
      <label>Correo *</label>
      <input type="email" formControlName="titularCorreo" />
    </div>
    <div class="field">
      <label>Sede *</label>
      <select [ngModel]="titularSedeId" [ngModelOptions]="{standalone: true}" (change)="onSedeChange($any($event.target).value)">
        <option value="">Seleccione...</option>
        <option *ngFor="let sede of sedes" [value]="sede.id">{{ sede.nombre }}</option>
      </select>
    </div>
    <div class="field">
      <label>Dependencia *</label>
      <select [ngModel]="titularDependenciaId" [ngModelOptions]="{standalone: true}" (change)="onDependenciaChange($any($event.target).value)" [disabled]="!titularSedeId">
        <option value="">Seleccione...</option>
        <option *ngFor="let dep of dependencias" [value]="dep.id">{{ dep.nombre }}</option>
      </select>
    </div>
    <div class="field">
      <label>Tipo de contrato *</label>
      <select [ngModel]="titularTipoContratoId" [ngModelOptions]="{standalone: true}" (change)="onTipoContratoChange($any($event.target).value)">
        <option value="">Seleccione...</option>
        <option *ngFor="let tipo of tiposContrato" [value]="tipo.id">{{ tipo.nombre }}</option>
      </select>
    </div>
    <button type="button" class="secondary" (click)="onVolverABuscar()">Volver a buscar en AD</button>
  </ng-container>

  <ng-container *ngIf="titularModo === 'externo'">
    <div class="field">
      <label>Nombre *</label>
      <input type="text" formControlName="titularNombre" />
    </div>
    <div class="field">
      <label>Apellidos *</label>
      <input type="text" formControlName="titularApellidos" />
    </div>
    <div class="field">
      <label>Correo *</label>
      <input type="email" formControlName="titularCorreo" />
    </div>
    <div class="field">
      <label>Empresa *</label>
      <input type="text" formControlName="titularEmpresa" />
    </div>
    <div class="field">
      <label>Motivo *</label>
      <input type="text" formControlName="titularMotivo" placeholder="Ej. Consultor externo - Proyecto X" />
    </div>
    <button type="button" class="secondary" (click)="onVolverABuscar()">Volver a buscar en AD</button>
  </ng-container>

  <div class="field">
    <label>Cargo *</label>
    <select formControlName="titularCargo">
      <option value="">Seleccione...</option>
      <option *ngFor="let cargo of cargos" [value]="cargo">{{ cargo }}</option>
    </select>
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

- [ ] **Step 3: Add fallback-prompt styles to `vpn-form.component.scss`**

Append at the end of the file:

```scss
.titular-fallback {
  background: #fff7ed;
  border: 1px solid #fed7aa;
  border-radius: 6px;
  padding: 10px 12px;
  margin-top: 8px;

  p {
    margin: 0 0 8px;
    font-size: 13px;
    color: #7c2d12;
  }
}
```

- [ ] **Step 4: Compile-check**

Run: `cd soportedesk-frontend && npx tsc --noEmit -p tsconfig.app.json`
Expected: no errors.

- [ ] **Step 5: Build to catch template errors**

Run: `cd soportedesk-frontend && npx ng build 2>&1 | grep -iE "error|Application bundle"`
Expected: `Application bundle generation complete.` with no `error` lines.

- [ ] **Step 6: Commit**

```bash
git add soportedesk-frontend/src/app/features/vpn/vpn-form.component.ts \
        soportedesk-frontend/src/app/features/vpn/vpn-form.component.html \
        soportedesk-frontend/src/app/features/vpn/vpn-form.component.scss
git commit -m "feat(vpn): replace static AD dropdown with live search and manual titular capture"
```

---

## Task 8: Frontend — `vpn-list.component` — display titular fields

**Files:**
- Modify: `soportedesk-frontend/src/app/features/vpn/vpn-list.component.ts`
- Modify: `soportedesk-frontend/src/app/features/vpn/vpn-list.component.html`

**Interfaces:**
- Consumes: `Vpn.titularNombreCompleto/titularOrigenLabel/titularCargo/titularCorreo/titularSede/
  titularDependencia/titularTipoContrato/titularEmpresa/titularMotivo/titularTipo` (Task 6).
- Produces: nothing new downstream — last frontend task before verification.

- [ ] **Step 1: Update the `columns` array in `vpn-list.component.ts`**

Change:

```typescript
  columns: TableColumn[] = [
    { key: 'usuarioRed.nombre', label: 'Nombre' },
    { key: 'usuarioRed.usuario', label: 'Usuario red' },
    { key: 'estadoSolicitud', label: 'Estado solicitud' },
    { key: 'ipAsignada', label: 'IP VPN' },
    { key: 'estado', label: 'Estado' },
  ];
```

to:

```typescript
  columns: TableColumn[] = [
    { key: 'titularNombreCompleto', label: 'Nombre' },
    { key: 'titularOrigenLabel', label: 'Origen' },
    { key: 'estadoSolicitud', label: 'Estado solicitud' },
    { key: 'ipAsignada', label: 'IP VPN' },
    { key: 'estado', label: 'Estado' },
  ];
```

- [ ] **Step 2: Update the detail modal in `vpn-list.component.html`**

Change:

```html
    <app-field label="Nombre">{{ viewing.usuarioRed?.nombre }}</app-field>
    <app-field label="Usuario red">{{ viewing.usuarioRed?.usuario }}</app-field>

    <hr style="margin: 12px 0; border-color: var(--color-border)" />

    <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #4338ca; margin-bottom: 8px;">Solicitud</div>
```

to:

```html
    <app-field label="Nombre">{{ viewing.titularNombreCompleto }}</app-field>
    <app-field label="Origen">{{ viewing.titularOrigenLabel }}</app-field>
    <app-field label="Cargo">{{ viewing.titularCargo }}</app-field>
    <app-field label="Correo" *ngIf="viewing.titularTipo !== 'AD'">{{ viewing.titularCorreo }}</app-field>
    <app-field label="Sede" *ngIf="viewing.titularTipo === 'INTERNO_MANUAL'">{{ viewing.titularSede?.nombre }}</app-field>
    <app-field label="Dependencia" *ngIf="viewing.titularTipo === 'INTERNO_MANUAL'">{{ viewing.titularDependencia?.nombre }}</app-field>
    <app-field label="Tipo de contrato" *ngIf="viewing.titularTipo === 'INTERNO_MANUAL'">{{ viewing.titularTipoContrato?.nombre }}</app-field>
    <app-field label="Empresa" *ngIf="viewing.titularTipo === 'EXTERNO'">{{ viewing.titularEmpresa }}</app-field>
    <app-field label="Motivo" *ngIf="viewing.titularTipo === 'EXTERNO'">{{ viewing.titularMotivo }}</app-field>

    <hr style="margin: 12px 0; border-color: var(--color-border)" />

    <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #4338ca; margin-bottom: 8px;">Solicitud</div>
```

- [ ] **Step 3: Compile-check**

Run: `cd soportedesk-frontend && npx tsc --noEmit -p tsconfig.app.json`
Expected: no errors.

- [ ] **Step 4: Build**

Run: `cd soportedesk-frontend && npx ng build 2>&1 | grep -iE "error|Application bundle"`
Expected: `Application bundle generation complete.` with no `error` lines.

- [ ] **Step 5: Commit**

```bash
git add soportedesk-frontend/src/app/features/vpn/vpn-list.component.ts \
        soportedesk-frontend/src/app/features/vpn/vpn-list.component.html
git commit -m "feat(vpn): display titular origin/cargo/manual fields in list and detail"
```

---

## Task 9: Full verification pass

**Files:** none (verification only)

- [ ] **Step 1: Run the full backend test suite**

Run: `cd soportedesk-backend && mvn verify -q`
Expected: BUILD SUCCESS.

- [ ] **Step 2: Run the full frontend test suite**

Run: `cd soportedesk-frontend && npx ng test --watch=false --browsers=ChromeHeadless`
Expected: all existing specs still PASS (no new specs were added in this plan).

- [ ] **Step 3: Build the frontend**

Run: `cd soportedesk-frontend && npx ng build`
Expected: `Application bundle generation complete.` with no errors.

- [ ] **Step 4: Manual verification**

Restart both the backend jar and `ng serve` (kill the process on the port, repackage/rebuild,
relaunch) so they pick up this plan's changes, then log in as a user with `solicitar-vpn` and:

1. Open "Nueva solicitud VPN", search for a real AD user by name — confirm results appear and
   selecting one shows the existing preview (usuario/nombre/sede/dependencia).
2. Search for a nonsense string with no AD matches — confirm the "No se encontró en AD..." prompt
   appears with both buttons.
3. Click "Personal de INIA" — confirm nombre/apellidos/correo/Sede/Dependencia (cascading)/Tipo de
   contrato fields appear, and that submitting without filling them shows the right validation
   error.
4. Click "Volver a buscar en AD" — confirm it returns to the search box.
5. Fill "Personal de INIA" completely and submit — confirm the request succeeds (check the network
   tab or the resulting row) and that the list/detail modal show "Interno (manual)" as origen, the
   right nombre, and Sede/Dependencia/Tipo de contrato.
6. Repeat for "Tercero externo" (nombre/apellidos/correo/empresa/motivo) — confirm the list/detail
   show "Externo" as origen and the empresa/motivo fields.
7. Confirm every solicitud (AD, interno manual, externo) requires and displays "Cargo".

Report which of these seven checks you actually performed and what you observed — don't report
this task complete without having done so.

- [ ] **Step 5: Fix any issues found**

If Step 4 surfaces bugs, fix them with a normal edit/test/commit cycle following the patterns in
Tasks 4 (backend) or 7 (frontend) — do not skip writing/updating a test for the fix.
