package com.inia.soportedesk.vpn;

import com.inia.soportedesk.activedirectory.AdUsuarioCache;
import com.inia.soportedesk.activedirectory.AdUsuarioCacheRepository;
import com.inia.soportedesk.activedirectory.ActiveDirectoryService;
import com.inia.soportedesk.auth.Usuario;
import com.inia.soportedesk.auth.UsuarioRepository;
import com.inia.soportedesk.exception.ResourceNotFoundException;
import com.inia.soportedesk.glpi.VwInvComputerFull;
import com.inia.soportedesk.glpi.VwInvComputerFullRepository;
import com.inia.soportedesk.usuariosred.contrato.UsuarioRedContratoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class VpnService {

    private static final List<String> EDITABLES = List.of("PENDIENTE", "OBSERVADO");
    private static final List<String> ESTADOS_QUE_BLOQUEAN_DUPLICADO = List.of("PENDIENTE", "OBSERVADO", "APROBADO");

    private final VpnRepository repository;
    private final AdUsuarioCacheRepository adUsuarioCacheRepository;
    private final ActiveDirectoryService activeDirectoryService;
    private final UsuarioRedContratoRepository contratoRepository;
    private final VwInvComputerFullRepository glpiRepository;
    private final UsuarioRepository usuarioRepository;
    private final VpnConfigInstitucionalService configInstitucionalService;

    public List<Vpn> findAll(String search) {
        List<Vpn> result = search == null || search.isBlank()
                ? repository.findAll()
                : repository.search(search);
        result.forEach(this::aplicarVence);
        return result;
    }

    public Vpn findById(Long id) {
        Vpn vpn = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Acceso VPN no encontrado: " + id));
        aplicarVence(vpn);
        return vpn;
    }

    public VpnKpisDto getKpis() {
        return new VpnKpisDto(
                repository.countByEstadoSolicitud("PENDIENTE"),
                repository.countByEstadoSolicitud("APROBADO"),
                repository.countByEstadoSolicitud("RECHAZADO"),
                repository.countByEstadoSolicitud("OBSERVADO")
        );
    }

    public List<VpnUsuarioRedOption> buscarUsuariosRed(String termino) {
        String normalized = termino == null ? "" : termino.trim();
        if (normalized.length() < 2) {
            return List.of();
        }
        Map<String, AdUsuarioCache> resultados = new LinkedHashMap<>();
        adUsuarioCacheRepository.autocompleteEnabled(normalized, normalizeAccountSearchTerm(normalized), PageRequest.of(0, 20))
                .forEach(usuario -> resultados.put(usuario.getSamAccountName().toLowerCase(), usuario));

        contratoRepository.searchAllFields(normalized, PageRequest.of(0, 20)).forEach(contrato -> {
            String accountName = normalizeAccountSearchTerm(contrato.getUsuario());
            if (accountName == null || accountName.isBlank()) {
                return;
            }
            activeDirectoryService.buscarUsuarioCacheadoORefrescar(accountName)
                    .filter(AdUsuarioCache::isEnabled)
                    .ifPresent(usuario -> resultados.putIfAbsent(usuario.getSamAccountName().toLowerCase(), usuario));
        });

        return resultados.values().stream()
                .limit(20)
                .map(VpnUsuarioRedOption::from)
                .toList();
    }

    private static final int VENCIMIENTO_ALERTA_DIAS = 30;

    public VpnDashboardCompleto obtenerDashboardCompleto() {
        try {
            List<Vpn> all = repository.findAll();
            all.forEach(this::aplicarVence);

            long pendientes = all.stream().filter(v -> "PENDIENTE".equals(v.getEstadoSolicitud())).count();
            long aprobadas = all.stream().filter(v -> "APROBADO".equals(v.getEstadoSolicitud())).count();
            long rechazadas = all.stream().filter(v -> "RECHAZADO".equals(v.getEstadoSolicitud())).count();
            long observadas = all.stream().filter(v -> "OBSERVADO".equals(v.getEstadoSolicitud())).count();

            List<VpnTipoEquipoCount> distribucion = all.stream()
                    .collect(java.util.stream.Collectors.groupingBy(
                            v -> v.getTipoEquipo() == null ? "SIN_TIPO" : v.getTipoEquipo(),
                            java.util.LinkedHashMap::new,
                            java.util.stream.Collectors.counting()))
                    .entrySet().stream()
                    .map(e -> new VpnTipoEquipoCount(e.getKey(), e.getValue()))
                    .sorted(java.util.Comparator.comparing(VpnTipoEquipoCount::tipoEquipo))
                    .toList();

            List<VpnDependenciaCount> distribucionDependencia = all.stream()
                    .collect(java.util.stream.Collectors.groupingBy(
                            v -> v.getAdOffice() == null || v.getAdOffice().isBlank()
                                    ? "Externos / sin dependencia" : v.getAdOffice(),
                            java.util.LinkedHashMap::new,
                            java.util.stream.Collectors.counting()))
                    .entrySet().stream()
                    .map(e -> new VpnDependenciaCount(e.getKey(), e.getValue()))
                    .sorted(java.util.Comparator.comparing(VpnDependenciaCount::total).reversed()
                            .thenComparing(VpnDependenciaCount::dependencia))
                    .toList();

            List<VpnSubdependenciaCount> distribucionSubdependencia = all.stream()
                    .collect(java.util.stream.Collectors.groupingBy(
                            v -> v.getAdOrganizationalUnit() == null || v.getAdOrganizationalUnit().isBlank()
                                    ? "Externos / sin subdependencia" : v.getAdOrganizationalUnit(),
                            java.util.LinkedHashMap::new,
                            java.util.stream.Collectors.counting()))
                    .entrySet().stream()
                    .map(e -> new VpnSubdependenciaCount(e.getKey(), e.getValue()))
                    .sorted(java.util.Comparator.comparing(VpnSubdependenciaCount::total).reversed()
                            .thenComparing(VpnSubdependenciaCount::subdependencia))
                    .toList();

            LocalDate hoy = LocalDate.now();
            List<Vpn> vencidos = all.stream()
                    .filter(v -> v.getVence() != null && v.getVence().isBefore(hoy))
                    .sorted(java.util.Comparator.comparing(Vpn::getVence))
                    .toList();
            List<Vpn> porVencer = all.stream()
                    .filter(v -> v.getVence() != null && !v.getVence().isBefore(hoy)
                            && !v.getVence().isAfter(hoy.plusDays(VENCIMIENTO_ALERTA_DIAS)))
                    .sorted(java.util.Comparator.comparing(Vpn::getVence))
                    .toList();

            return new VpnDashboardCompleto(
                    pendientes, aprobadas, rechazadas, observadas, all.size(),
                    distribucion, distribucionDependencia, distribucionSubdependencia,
                    vencidos.stream().limit(10).map(this::toAlerta).toList(),
                    vencidos.size(),
                    porVencer.stream().limit(10).map(this::toAlerta).toList(),
                    porVencer.size()
            );
        } catch (Exception e) {
            return new VpnDashboardCompleto(0, 0, 0, 0, 0, List.of(), List.of(), List.of(), List.of(), 0, List.of(), 0);
        }
    }

    private VpnVencimientoAlerta toAlerta(Vpn vpn) {
        String baseDetalle = "CONTRATO".equals(vpn.getVenceOrigen()) ? " por fin de contrato" : "";
        String detalle = vpn.getVence().isBefore(LocalDate.now())
                ? "Vencido" + baseDetalle + " el " + vpn.getVence()
                : "Vence" + baseDetalle + " el " + vpn.getVence();
        return new VpnVencimientoAlerta(vpn.getId(), vpn.getTitularNombreCompleto(), vpn.getTipoEquipo(), vpn.getVence(), detalle);
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
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
        validateNoDuplicateSolicitud(vpn);
        return saveAndApplyVence(vpn);
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public Vpn actualizarSolicitud(Long id, VpnRequest request, Authentication auth) {
        Vpn vpn = findById(id);
        if (!EDITABLES.contains(vpn.getEstadoSolicitud())) {
            throw new IllegalArgumentException("Solo se puede editar una solicitud pendiente u observada");
        }
        copySolicitudFields(vpn, request);
        validateNoDuplicateSolicitud(vpn);
        if ("OBSERVADO".equals(vpn.getEstadoSolicitud())) {
            vpn.setEstadoSolicitud("PENDIENTE");
        }
        return saveAndApplyVence(vpn);
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public Vpn aprobar(Long id, VpnAprobarRequest request, Authentication auth) {
        Vpn vpn = findById(id);
        if (!"PENDIENTE".equals(vpn.getEstadoSolicitud())) {
            throw new IllegalArgumentException("Solo se puede aprobar una solicitud pendiente");
        }
        String usuarioVpn = request.getUsuarioVpn().trim();
        if (repository.countApprovedByUsuarioVpn(usuarioVpn, vpn.getId()) > 0) {
            throw new IllegalArgumentException("El usuario VPN " + usuarioVpn + " ya esta asignado a otro acceso aprobado.");
        }
        validateNoDuplicateSolicitud(vpn);
        vpn.setUsuarioVpn(usuarioVpn);
        vpn.setCredencialVpn(request.getCredencialVpn());
        vpn.setEstado(request.getEstado());
        vpn.setEstadoSolicitud("APROBADO");
        marcarResuelto(vpn, auth);
        return saveAndApplyVence(vpn);
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
        return saveAndApplyVence(vpn);
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
        return saveAndApplyVence(vpn);
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
        vpn.setSistemaOperativoActualizado(request.getSistemaOperativoActualizado());
        vpn.setForticlientInstalado(request.getForticlientInstalado());
        vpn.setVencimientoAntivirus(request.getVencimientoAntivirus());
        vpn.setTitularCargo(request.getTitularCargo());

        if (!isBlank(request.getUsuarioRedSamAccountName())) {
            String samAccountName = normalizeAccountSearchTerm(request.getUsuarioRedSamAccountName());
            AdUsuarioCache usuarioRed = activeDirectoryService
                    .buscarUsuarioCacheadoORefrescar(samAccountName)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Usuario de red no encontrado en Active Directory: " + request.getUsuarioRedSamAccountName()));
            if (!usuarioRed.isEnabled()) {
                throw new IllegalArgumentException("El usuario de red esta deshabilitado en la cache local");
            }
            vpn.setTitularTipo("AD");
            vpn.setAdSamAccountName(usuarioRed.getSamAccountName());
            vpn.setAdDisplayName(usuarioRed.getDisplayName());
            vpn.setAdMail(usuarioRed.getMail());
            vpn.setAdOffice(usuarioRed.getOffice());
            vpn.setAdOrganizationalUnit(usuarioRed.getOrganizationalUnit());
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
            vpn.setTitularTipo("EXTERNO");
            vpn.setAdSamAccountName(null);
            vpn.setAdDisplayName(null);
            vpn.setAdMail(null);
            vpn.setAdOffice(null);
            vpn.setAdOrganizationalUnit(null);
            vpn.setTitularNombre(request.getTitularNombre().trim());
            vpn.setTitularApellidos(request.getTitularApellidos().trim());
            vpn.setTitularCorreo(request.getTitularCorreo().trim());
            vpn.setTitularEmpresa(request.getTitularEmpresa().trim());
            vpn.setTitularMotivo(request.getTitularMotivo().trim());
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

    private void validateNoDuplicateSolicitud(Vpn vpn) {
        Long currentId = vpn.getId();
        if (!isBlank(vpn.getAdSamAccountName())
                && repository.countBlockingByAdUser(vpn.getAdSamAccountName(), ESTADOS_QUE_BLOQUEAN_DUPLICADO, currentId) > 0) {
            throw new IllegalArgumentException(
                    "El usuario de red " + vpn.getAdSamAccountName() + " ya tiene una solicitud o acceso VPN vigente.");
        }
        if (!isBlank(vpn.getTitularCorreo())
                && repository.countBlockingByExternalEmail(vpn.getTitularCorreo(), ESTADOS_QUE_BLOQUEAN_DUPLICADO, currentId) > 0) {
            throw new IllegalArgumentException(
                    "El correo " + vpn.getTitularCorreo() + " ya tiene una solicitud o acceso VPN vigente.");
        }
        if (vpn.getGlpiComputerId() != null
                && repository.countBlockingByGlpiComputer(vpn.getGlpiComputerId(), ESTADOS_QUE_BLOQUEAN_DUPLICADO, currentId) > 0) {
            throw new IllegalArgumentException(
                    "El equipo seleccionado ya tiene una solicitud o acceso VPN vigente.");
        }
    }

    private String normalizeAccountSearchTerm(String value) {
        if (value == null || value.trim().length() < 2) {
            return "";
        }
        String term = value.trim();
        int slash = Math.max(term.lastIndexOf('\\'), term.lastIndexOf('/'));
        if (slash >= 0 && slash + 1 < term.length()) {
            term = term.substring(slash + 1).trim();
        }
        int at = term.indexOf('@');
        if (at > 0 && isKnownAdDomain(term.substring(at + 1))) {
            return term.substring(0, at).trim();
        }
        return term;
    }

    private boolean isKnownAdDomain(String domain) {
        if (domain == null || domain.isBlank()) {
            return false;
        }
        return domain.trim().equalsIgnoreCase("inia.local");
    }

    private Vpn saveAndApplyVence(Vpn vpn) {
        Vpn saved = repository.save(vpn);
        aplicarVence(saved);
        return saved;
    }

    private void aplicarVence(Vpn vpn) {
        LocalDate vencimientoBase = "INIA".equals(vpn.getTipoEquipo())
                ? configInstitucionalService.getVencimiento()
                : vpn.getVencimientoAntivirus();
        LocalDate vencimientoContrato = vencimientoContrato(vpn.getAdSamAccountName());

        vpn.setVencimientoBaseVpn(vencimientoBase);
        vpn.setVencimientoContrato(vencimientoContrato);

        if (vencimientoContrato != null && (vencimientoBase == null || vencimientoContrato.isBefore(vencimientoBase))) {
            vpn.setVence(vencimientoContrato);
            vpn.setVenceOrigen("CONTRATO");
            return;
        }

        vpn.setVence(vencimientoBase);
        vpn.setVenceOrigen("INIA".equals(vpn.getTipoEquipo()) ? "INSTITUCIONAL" : "ANTIVIRUS_PERSONAL");
    }

    private LocalDate vencimientoContrato(String samAccountName) {
        if (isBlank(samAccountName)) {
            return null;
        }
        String usuario = normalizeAccountSearchTerm(samAccountName);
        return contratoRepository.findByUsuarioIgnoreCaseOrderByFechaInicioDesc(usuario).stream()
                .map(contrato -> contrato.getFechaFin())
                .filter(Objects::nonNull)
                .max(LocalDate::compareTo)
                .orElse(null);
    }

    private boolean canViewCredenciales(Vpn vpn, Authentication auth) {
        if (vpn.getSolicitadoPor() != null && vpn.getSolicitadoPor().equals(auth.getName())) {
            return true;
        }
        return auth.getAuthorities().stream().anyMatch(a ->
                a.getAuthority().equals("ROLE_ADMIN") ||
                a.getAuthority().equals("READ_solicitar-vpn") ||
                a.getAuthority().equals("WRITE_solicitar-vpn") ||
                a.getAuthority().equals("READ_credenciales-vpn"));
    }
}
