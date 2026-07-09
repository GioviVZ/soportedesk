package com.inia.soportedesk.vpn;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class VpnConfigInstitucionalService {

    private static final Long ID_UNICO = 1L;

    private final VpnConfigInstitucionalRepository repository;

    public LocalDate getVencimiento() {
        return repository.findById(ID_UNICO)
                .map(VpnConfigInstitucional::getVencimientoAntivirus)
                .orElse(null);
    }

    public VpnConfigInstitucional actualizar(LocalDate vencimiento) {
        VpnConfigInstitucional config = repository.findById(ID_UNICO).orElseGet(() -> {
            VpnConfigInstitucional nuevo = new VpnConfigInstitucional();
            nuevo.setId(ID_UNICO);
            return nuevo;
        });
        config.setVencimientoAntivirus(vencimiento);
        return repository.save(config);
    }
}
