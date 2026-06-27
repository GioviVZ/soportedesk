package com.inia.soportedesk.vpn;

import com.inia.soportedesk.equipos.Equipo;
import com.inia.soportedesk.equipos.EquipoRepository;
import com.inia.soportedesk.exception.ResourceNotFoundException;
import com.inia.soportedesk.usuariosred.UsuarioRed;
import com.inia.soportedesk.usuariosred.UsuarioRedRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class VpnService {

    private final VpnRepository repository;
    private final UsuarioRedRepository usuarioRedRepository;
    private final EquipoRepository equipoRepository;

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
    public Vpn create(VpnRequest request, Authentication auth) {
        Vpn vpn = new Vpn();
        copyFields(vpn, request, auth);
        return repository.save(vpn);
    }

    @Transactional
    public Vpn update(Long id, VpnRequest request, Authentication auth) {
        Vpn vpn = findById(id);
        copyFields(vpn, request, auth);
        return repository.save(vpn);
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

    private void copyFields(Vpn vpn, VpnRequest request, Authentication auth) {
        UsuarioRed usuarioRed = usuarioRedRepository.findById(request.getUsuarioRedId())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario de red no encontrado: " + request.getUsuarioRedId()));
        vpn.setUsuarioRed(usuarioRed);

        if (request.getEquipoId() != null) {
            Equipo equipo = equipoRepository.findById(request.getEquipoId())
                    .orElseThrow(() -> new ResourceNotFoundException("Equipo no encontrado: " + request.getEquipoId()));
            vpn.setEquipo(equipo);
        } else {
            vpn.setEquipo(null);
        }

        vpn.setIpAsignada(request.getIpAsignada());
        vpn.setVence(request.getVence());
        vpn.setEstado(request.getEstado());

        if (canEditCredenciales(auth)) {
            vpn.setUsuarioVpn(request.getUsuarioVpn());
            vpn.setCredencialVpn(request.getCredencialVpn());
        }
    }

    private boolean canEditCredenciales(Authentication auth) {
        return auth.getAuthorities().stream().anyMatch(a ->
                a.getAuthority().equals("ROLE_ADMIN") ||
                a.getAuthority().equals("WRITE_credenciales-vpn"));
    }

    public void maskCredencialesIfNeeded(Vpn vpn, Authentication auth) {
        if (!canViewCredenciales(auth)) {
            vpn.setUsuarioVpn(null);
            vpn.setCredencialVpn(null);
        }
    }

    public void maskCredencialesIfNeeded(List<Vpn> vpns, Authentication auth) {
        vpns.forEach(vpn -> maskCredencialesIfNeeded(vpn, auth));
    }

    private boolean canViewCredenciales(Authentication auth) {
        return auth.getAuthorities().stream().anyMatch(a ->
                a.getAuthority().equals("ROLE_ADMIN") ||
                a.getAuthority().equals("READ_credenciales-vpn"));
    }
}
