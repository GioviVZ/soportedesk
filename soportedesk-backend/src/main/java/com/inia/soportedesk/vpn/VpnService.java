package com.inia.soportedesk.vpn;

import com.inia.soportedesk.activedirectory.AdUsuarioCache;
import com.inia.soportedesk.activedirectory.AdUsuarioCacheRepository;
import com.inia.soportedesk.auth.Usuario;
import com.inia.soportedesk.auth.UsuarioRepository;
import com.inia.soportedesk.exception.ResourceNotFoundException;
import com.inia.soportedesk.glpi.VwInvComputerFull;
import com.inia.soportedesk.glpi.VwInvComputerFullRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class VpnService {

    private static final List<String> EDITABLES = List.of("PENDIENTE", "OBSERVADO");

    private final VpnRepository repository;
    private final AdUsuarioCacheRepository adUsuarioCacheRepository;
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
        return adUsuarioCacheRepository.autocompleteEnabled(normalized, PageRequest.of(0, 20)).stream()
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
                    distribucion,
                    vencidos.stream().limit(10).map(this::toAlerta).toList(),
                    vencidos.size(),
                    porVencer.stream().limit(10).map(this::toAlerta).toList(),
                    porVencer.size()
            );
        } catch (Exception e) {
            return new VpnDashboardCompleto(0, 0, 0, 0, 0, List.of(), List.of(), 0, List.of(), 0);
        }
    }

    private VpnVencimientoAlerta toAlerta(Vpn vpn) {
        String detalle = vpn.getVence().isBefore(LocalDate.now())
                ? "Vencido el " + vpn.getVence()
                : "Vence el " + vpn.getVence();
        return new VpnVencimientoAlerta(vpn.getId(), vpn.getTitularNombreCompleto(), vpn.getTipoEquipo(), vpn.getVence(), detalle);
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
        return saveAndApplyVence(vpn);
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
        return saveAndApplyVence(vpn);
    }

    @Transactional
    public Vpn aprobar(Long id, VpnAprobarRequest request, Authentication auth) {
        Vpn vpn = findById(id);
        if (!"PENDIENTE".equals(vpn.getEstadoSolicitud())) {
            throw new IllegalArgumentException("Solo se puede aprobar una solicitud pendiente");
        }
        vpn.setUsuarioVpn(request.getUsuarioVpn());
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
            AdUsuarioCache usuarioRed = adUsuarioCacheRepository
                    .findFirstBySamAccountNameIgnoreCase(request.getUsuarioRedSamAccountName().trim())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Usuario de red no encontrado en la cache local: " + request.getUsuarioRedSamAccountName()));
            if (!usuarioRed.isEnabled()) {
                throw new IllegalArgumentException("El usuario de red esta deshabilitado en la cache local");
            }
            vpn.setUsuarioRed(null);
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
            vpn.setUsuarioRed(null);
            vpn.setTitularTipo("EXTERNO");
            vpn.setAdSamAccountName(null);
            vpn.setAdDisplayName(null);
            vpn.setAdMail(null);
            vpn.setAdOffice(null);
            vpn.setAdOrganizationalUnit(null);
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

    private Vpn saveAndApplyVence(Vpn vpn) {
        Vpn saved = repository.save(vpn);
        aplicarVence(saved);
        return saved;
    }

    private void aplicarVence(Vpn vpn) {
        if ("INIA".equals(vpn.getTipoEquipo())) {
            vpn.setVence(configInstitucionalService.getVencimiento());
            return;
        }
        LocalDate vencimiento = vpn.getVencimientoAntivirus();
        vpn.setVence(vencimiento);
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
