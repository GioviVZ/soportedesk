package com.inia.soportedesk.vpn;

import com.inia.soportedesk.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class VpnService {

    private final VpnRepository repository;

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

    public Vpn create(VpnRequest request) {
        Vpn vpn = new Vpn();
        copyFields(vpn, request);
        return repository.save(vpn);
    }

    public Vpn update(Long id, VpnRequest request) {
        Vpn vpn = findById(id);
        copyFields(vpn, request);
        return repository.save(vpn);
    }

    public void delete(Long id) {
        repository.delete(findById(id));
    }

    private void copyFields(Vpn vpn, VpnRequest request) {
        vpn.setUsuario(request.getUsuario());
        vpn.setNombre(request.getNombre());
        vpn.setTipo(request.getTipo());
        vpn.setIpAsignada(request.getIpAsignada());
        vpn.setVence(request.getVence());
        vpn.setEstado(request.getEstado());
    }
}
