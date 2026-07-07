# VPN Eliminar Titular INTERNO_MANUAL Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the `INTERNO_MANUAL` titular type end to end — frontend, backend, and (via a
prepared-but-not-executed SQL script) the database — so a VPN solicitud's titular is only ever `AD`
(found via live search) or `EXTERNO` (the fallback when the search finds nothing).

**Architecture:** Delete the "Personal de INIA" branch from the titular fallback prompt and its
supporting form state, collapse `VpnService.copySolicitudFields`'s "no `usuarioRedId`" branch to a
single `EXTERNO` path, and drop the `titular_sede_id`/`titular_dependencia_id`/
`titular_tipo_contrato_id` columns and fields that only that branch used. The 405 historical rows
that used `INTERNO_MANUAL` get a prepared `DELETE` script that the user runs manually once ready
(they're re-doing that import from a corrected source file, out of scope here).

**Tech Stack:** Spring Boot 3 / Java, Angular 17+ standalone components, JUnit + Mockito (backend).

## Global Constraints

- Only two titular types remain after this plan: `AD` and `EXTERNO`. No code path should reference
  `INTERNO_MANUAL` after Task 2.
- The two new SQL scripts (Task 3) are **not executed** as part of this plan — the user runs them
  manually against `ssti` when ready. Do not run them against the database during implementation.
- `VpnController.java` does not change — same endpoints, same request/response shape minus the
  removed fields.
- Full spec: `docs/superpowers/specs/2026-07-07-vpn-eliminar-interno-manual-design.md`.

---

## Task 1: Backend — remove `INTERNO_MANUAL` from entity, request, and service

**Files:**
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/vpn/Vpn.java`
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/vpn/VpnRequest.java`
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/vpn/VpnService.java`
- Modify: `soportedesk-backend/src/test/java/com/inia/soportedesk/vpn/VpnServiceTest.java`

**Interfaces:**
- Produces: `Vpn.getTitularOrigenLabel()` now returns only `"AD"` or `"Externo"`. `VpnRequest` no
  longer has `titularSedeId`/`titularDependenciaId`/`titularTipoContratoId`. `VpnService`'s
  constructor drops `SedeRepository`/`DependenciaRepository`/`TipoContratoRepository` — consumed by
  nothing else in the backend (verified: these three were injected only for this branch).

These four files must change together — `VpnService` sets fields that only exist on `Vpn` today,
and reads request fields that only exist on `VpnRequest` today, so none of the three production
files compiles correctly in isolation from the other two.

- [ ] **Step 1: Remove the obsolete mocks and tests from `VpnServiceTest.java`**

Delete these three mock field declarations (currently right before `@InjectMocks`):

```java
    @Mock
    private com.inia.soportedesk.catalogo.SedeRepository sedeRepository;

    @Mock
    private com.inia.soportedesk.catalogo.DependenciaRepository dependenciaRepository;

    @Mock
    private com.inia.soportedesk.catalogo.TipoContratoRepository tipoContratoRepository;

```

Delete these two test methods in full (currently between
`crearSolicitud_withUnknownGlpiId_throwsResourceNotFoundException` and
`crearSolicitud_withTitularExterno_savesManualFieldsAndClearsCatalogRefs`):

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

```

Everything else in `VpnServiceTest.java` stays as-is, including
`crearSolicitud_withTitularExterno_savesManualFieldsAndClearsCatalogRefs`,
`crearSolicitud_withTitularExterno_missingMotivo_throwsIllegalArgumentException`, and
`crearSolicitud_withoutUsuarioRedIdOrValidTitularTipo_throwsIllegalArgumentException` (that last one
already covers "no `usuarioRedId` and no valid `titularTipo`" → `IllegalArgumentException`, which is
exactly the behavior `INTERNO_MANUAL` now falls into as an invalid value).

- [ ] **Step 2: Rewrite `Vpn.java`**

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

    @Column(name = "titular_tipo", nullable = false)
    private String titularTipo = "AD";

    @Column(name = "titular_nombre")
    private String titularNombre;

    @Column(name = "titular_apellidos")
    private String titularApellidos;

    @Column(name = "titular_correo")
    private String titularCorreo;

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
        return "EXTERNO".equals(titularTipo) ? "Externo" : "AD";
    }
}
```

- [ ] **Step 3: Rewrite `VpnRequest.java`**

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

- [ ] **Step 4: Rewrite `VpnService.java`**

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

        if (request.getUsuarioRedId() != null) {
            UsuarioRed usuarioRed = usuarioRedRepository.findById(request.getUsuarioRedId())
                    .orElseThrow(() -> new ResourceNotFoundException("Usuario de red no encontrado: " + request.getUsuarioRedId()));
            vpn.setUsuarioRed(usuarioRed);
            vpn.setTitularTipo("AD");
            vpn.setTitularNombre(null);
            vpn.setTitularApellidos(null);
            vpn.setTitularCorreo(null);
            vpn.setTitularEmpresa(null);
            vpn.setTitularMotivo(null);
        } else {
            if (!"EXTERNO".equals(request.getTitularTipo())) {
                throw new IllegalArgumentException("Debe seleccionar un usuario de red o indicar los datos del tercero externo");
            }
            if (isBlank(request.getTitularNombre()) || isBlank(request.getTitularApellidos()) || isBlank(request.getTitularCorreo())) {
                throw new IllegalArgumentException("Nombre, apellidos y correo del titular son obligatorios");
            }
            if (isBlank(request.getTitularEmpresa()) || isBlank(request.getTitularMotivo())) {
                throw new IllegalArgumentException("Empresa y motivo son obligatorios para un tercero externo");
            }
            vpn.setUsuarioRed(null);
            vpn.setTitularTipo("EXTERNO");
            vpn.setTitularNombre(request.getTitularNombre());
            vpn.setTitularApellidos(request.getTitularApellidos());
            vpn.setTitularCorreo(request.getTitularCorreo());
            vpn.setTitularEmpresa(request.getTitularEmpresa());
            vpn.setTitularMotivo(request.getTitularMotivo());
        }

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

- [ ] **Step 5: Run the tests**

Run: `cd soportedesk-backend && mvn test -Dtest=VpnServiceTest -q`
Expected: PASS.

- [ ] **Step 6: Compile-check the whole backend module**

Run: `cd soportedesk-backend && mvn compile -q`
Expected: BUILD SUCCESS (confirms nothing else in the module referenced the removed
`titularSede`/`titularDependencia`/`titularTipoContrato`/`titularSedeId`/`titularDependenciaId`/
`titularTipoContratoId`).

- [ ] **Step 7: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/vpn/Vpn.java \
        soportedesk-backend/src/main/java/com/inia/soportedesk/vpn/VpnRequest.java \
        soportedesk-backend/src/main/java/com/inia/soportedesk/vpn/VpnService.java \
        soportedesk-backend/src/test/java/com/inia/soportedesk/vpn/VpnServiceTest.java
git commit -m "feat(vpn): remove INTERNO_MANUAL titular type from backend"
```

---

## Task 2: Frontend — remove `INTERNO_MANUAL` from model, form, and list

**Files:**
- Modify: `soportedesk-frontend/src/app/features/vpn/vpn.model.ts`
- Modify: `soportedesk-frontend/src/app/features/vpn/vpn-form.component.ts`
- Modify: `soportedesk-frontend/src/app/features/vpn/vpn-form.component.html`
- Modify: `soportedesk-frontend/src/app/features/vpn/vpn-list.component.html`

**Interfaces:**
- Consumes: `Vpn.titularTipo` narrows from `'AD' | 'INTERNO_MANUAL' | 'EXTERNO'` to `'AD' |
  'EXTERNO'` (Task 1's backend already only ever returns one of those two).
- Produces: `VpnFormComponent`'s public `@Input()`/`@Output()` contract (`[vpn]`, `(saved)`,
  `(cancelled)`) is unchanged — `vpn-list.component.ts`'s usage of `<app-vpn-form>` needs no edits.

These four files change together for the same reason as Task 1: `vpn-form.component.ts` reads
`Vpn.titularSede`/`titularDependencia`/`titularTipoContrato` (removed from the model in this task)
and calls `CatalogoService.getSedes()`/`getDependencias()`/`getTiposContrato()` only for the branch
being deleted.

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
  titularTipo: 'AD' | 'EXTERNO';
  titularNombre: string | null;
  titularApellidos: string | null;
  titularCorreo: string | null;
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
  titularTipo: 'EXTERNO' | null;
  titularNombre: string | null;
  titularApellidos: string | null;
  titularCorreo: string | null;
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

- [ ] **Step 2: Rewrite `vpn-form.component.ts`**

```typescript
import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CARGOS_VPN, Vpn } from './vpn.model';
import { VpnService } from './vpn.service';
import { UsuarioRedService } from '../usuarios-red/usuario-red.service';
import { EquipoService } from '../equipos/equipo.service';
import { UsuarioRed } from '../usuarios-red/usuario-red.model';
import { EquipoResumen } from '../equipos/equipo.model';

type TitularModo = 'buscando' | 'ad-seleccionado' | 'externo';

@Component({
  selector: 'app-vpn-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './vpn-form.component.html',
  styleUrl: './vpn-form.component.scss',
})
export class VpnFormComponent implements OnChanges {
  private fb = inject(FormBuilder);
  private service = inject(VpnService);
  private usuarioRedService = inject(UsuarioRedService);
  private equipoService = inject(EquipoService);

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

  onElegirExterno(): void {
    this.setTitularModo('externo');
  }

  onVolverABuscar(): void {
    this.setTitularModo('buscando');
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
      alert('Debe seleccionar un usuario de red o indicar los datos del tercero externo.');
      return;
    }
    const raw = this.form.getRawValue();
    const esExterno = this.titularModo === 'externo';
    const request = {
      usuarioRedId: this.titularModo === 'ad-seleccionado' ? this.selectedAdUserId : null,
      titularTipo: esExterno ? ('EXTERNO' as const) : null,
      titularNombre: esExterno ? raw.titularNombre : null,
      titularApellidos: esExterno ? raw.titularApellidos : null,
      titularCorreo: esExterno ? raw.titularCorreo : null,
      titularEmpresa: esExterno ? raw.titularEmpresa : null,
      titularMotivo: esExterno ? raw.titularMotivo : null,
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

    if (this.titularModo === 'externo') {
      nombre.setValidators(Validators.required);
      apellidos.setValidators(Validators.required);
      correo.setValidators(Validators.required);
      empresa.setValidators(Validators.required);
      motivo.setValidators(Validators.required);
    } else {
      nombre.clearValidators();
      apellidos.clearValidators();
      correo.clearValidators();
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

- [ ] **Step 3: Rewrite `vpn-form.component.html`**

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
      <p>No se encontró en AD. Indique los datos del tercero externo.</p>
      <div class="actions">
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

- [ ] **Step 4: Update `vpn-list.component.html`**

Change:

```html
    <app-field label="Correo" *ngIf="viewing.titularTipo !== 'AD'">{{ viewing.titularCorreo }}</app-field>
    <app-field label="Sede" *ngIf="viewing.titularTipo === 'INTERNO_MANUAL'">{{ viewing.titularSede?.nombre }}</app-field>
    <app-field label="Dependencia" *ngIf="viewing.titularTipo === 'INTERNO_MANUAL'">{{ viewing.titularDependencia?.nombre }}</app-field>
    <app-field label="Tipo de contrato" *ngIf="viewing.titularTipo === 'INTERNO_MANUAL'">{{ viewing.titularTipoContrato?.nombre }}</app-field>
    <app-field label="Empresa" *ngIf="viewing.titularTipo === 'EXTERNO'">{{ viewing.titularEmpresa }}</app-field>
```

to:

```html
    <app-field label="Correo" *ngIf="viewing.titularTipo !== 'AD'">{{ viewing.titularCorreo }}</app-field>
    <app-field label="Empresa" *ngIf="viewing.titularTipo === 'EXTERNO'">{{ viewing.titularEmpresa }}</app-field>
```

- [ ] **Step 5: Compile-check**

Run: `cd soportedesk-frontend && npx tsc --noEmit -p tsconfig.app.json`
Expected: no errors.

- [ ] **Step 6: Build to catch template errors**

Run: `cd soportedesk-frontend && npx ng build 2>&1 | grep -iE "error|Application bundle"`
Expected: `Application bundle generation complete.` with no `error` lines.

- [ ] **Step 7: Commit**

```bash
git add soportedesk-frontend/src/app/features/vpn/vpn.model.ts \
        soportedesk-frontend/src/app/features/vpn/vpn-form.component.ts \
        soportedesk-frontend/src/app/features/vpn/vpn-form.component.html \
        soportedesk-frontend/src/app/features/vpn/vpn-list.component.html
git commit -m "feat(vpn): remove INTERNO_MANUAL titular type from frontend"
```

---

## Task 3: SQL scripts to retire historical `INTERNO_MANUAL` data (prepared, not executed)

**Files:**
- Create: `docs/superpowers/migrations/2026-07-07-vpn-eliminar-interno-manual-datos.sql`
- Create: `docs/superpowers/migrations/2026-07-07-vpn-eliminar-interno-manual-columnas.sql`

**Interfaces:** none — these are standalone SQL scripts, not consumed by any other task. Do **not**
run them against the database as part of this plan; the user runs them manually once ready.

- [ ] **Step 1: Write the data-deletion script**

```sql
-- Borra los 405 registros historicos con titular_tipo='INTERNO_MANUAL'.
-- Ejecutar en: ssti (SQL Server). NO idempotente en el sentido de "recuperable" -- revisar el
-- conteo antes de confirmar. Correr ANTES del script de DROP COLUMN.

SELECT COUNT(*) AS antes FROM dbo.vpn WHERE titular_tipo = 'INTERNO_MANUAL';
GO

DELETE FROM dbo.vpn WHERE titular_tipo = 'INTERNO_MANUAL';
GO

SELECT COUNT(*) AS despues FROM dbo.vpn WHERE titular_tipo = 'INTERNO_MANUAL';
GO
```

Save to `docs/superpowers/migrations/2026-07-07-vpn-eliminar-interno-manual-datos.sql`.

- [ ] **Step 2: Write the column-drop script**

```sql
-- Elimina las columnas titular_sede_id/titular_dependencia_id/titular_tipo_contrato_id de dbo.vpn.
-- Ejecutar en: ssti (SQL Server), DESPUES de vaciar los registros INTERNO_MANUAL (ver script de
-- datos) -- esas columnas contienen los valores de esos registros.

IF OBJECT_ID('dbo.fk_vpn_titular_sede', 'F') IS NOT NULL
    ALTER TABLE dbo.vpn DROP CONSTRAINT fk_vpn_titular_sede;
GO
IF OBJECT_ID('dbo.fk_vpn_titular_dependencia', 'F') IS NOT NULL
    ALTER TABLE dbo.vpn DROP CONSTRAINT fk_vpn_titular_dependencia;
GO
IF OBJECT_ID('dbo.fk_vpn_titular_tipo_contrato', 'F') IS NOT NULL
    ALTER TABLE dbo.vpn DROP CONSTRAINT fk_vpn_titular_tipo_contrato;
GO

IF COL_LENGTH('dbo.vpn', 'titular_sede_id') IS NOT NULL
    ALTER TABLE dbo.vpn DROP COLUMN titular_sede_id;
GO
IF COL_LENGTH('dbo.vpn', 'titular_dependencia_id') IS NOT NULL
    ALTER TABLE dbo.vpn DROP COLUMN titular_dependencia_id;
GO
IF COL_LENGTH('dbo.vpn', 'titular_tipo_contrato_id') IS NOT NULL
    ALTER TABLE dbo.vpn DROP COLUMN titular_tipo_contrato_id;
GO
```

Save to `docs/superpowers/migrations/2026-07-07-vpn-eliminar-interno-manual-columnas.sql`.

- [ ] **Step 3: Tell the user these scripts are ready but not run**

State explicitly: these two files are committed but **not executed**. The user runs the data script
first, confirms the "antes"/"despues" counts look right (405 → 0), then runs the column script —
whenever they're ready, independent of this plan's completion.

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/migrations/2026-07-07-vpn-eliminar-interno-manual-datos.sql \
        docs/superpowers/migrations/2026-07-07-vpn-eliminar-interno-manual-columnas.sql
git commit -m "chore(vpn): add prepared SQL to retire historical INTERNO_MANUAL data"
```

---

## Task 4: Full verification pass

**Files:** none (verification only)

- [ ] **Step 1: Run the full backend test suite**

Run: `cd soportedesk-backend && mvn test -q`
Expected: BUILD SUCCESS for the `vpn` package's tests (note: this repo has a preexisting unrelated
`UsuarioRepositoryTest` failure — see [[project_soportedesk_inia]] memory — confirm any failure is
that one and not something introduced here).

- [ ] **Step 2: Build the frontend**

Run: `cd soportedesk-frontend && npx ng build`
Expected: `Application bundle generation complete.` with no errors.

- [ ] **Step 3: Grep for leftover references**

Run: `grep -rn "INTERNO_MANUAL" soportedesk-backend/src soportedesk-frontend/src`
Expected: no matches (the historical migration SQL and old spec/plan docs are outside `src/` and are
expected to still mention it — that's history, not live code).

- [ ] **Step 4: Manual verification**

Restart both the backend jar and `ng serve` so they pick up this plan's changes, then log in as a
user with `solicitar-vpn` and:

1. Open "Nueva solicitud VPN", search for a real AD user by name — confirm results appear and
   selecting one still shows the existing preview (usuario/nombre/sede/dependencia), unchanged from
   before.
2. Search for a nonsense string with no AD matches — confirm the fallback prompt shows **only** the
   "Tercero externo" button (no "Personal de INIA").
3. Click "Tercero externo", fill nombre/apellidos/correo/empresa/motivo/cargo, submit — confirm the
   request succeeds and the list/detail modal show "Externo" as origen with the empresa/motivo
   fields.
4. Open an existing `APROBADO` VPN record that has `titularTipo = 'AD'` — confirm its detail modal
   still renders correctly (no missing fields, no console errors).

Report which of these four checks you actually performed and what you observed — don't report this
task complete without having done so.

- [ ] **Step 5: Fix any issues found**

If Step 4 surfaces bugs, fix them with a normal edit/test/commit cycle following the patterns in
Task 1 (backend) or Task 2 (frontend) — do not skip writing/updating a test for the fix.
