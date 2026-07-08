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
        vpn.setSistemaOperativoActualizado(request.getSistemaOperativoActualizado());
        vpn.setForticlientInstalado(request.getForticlientInstalado());
        vpn.setVencimientoAntivirus(request.getVencimientoAntivirus());
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
