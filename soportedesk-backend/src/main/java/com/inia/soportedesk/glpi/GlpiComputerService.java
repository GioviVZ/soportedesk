package com.inia.soportedesk.glpi;

import com.inia.soportedesk.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class GlpiComputerService {

    private final GlpiComputerRepository repository;

    @Transactional("glpiTransactionManager")
    public void marcarEliminado(Long computerId) {
        GlpiComputer equipo = repository.findById(computerId)
                .orElseThrow(() -> new ResourceNotFoundException("Equipo no encontrado en GLPI: " + computerId));
        if (equipo.getIsDeleted() != null && equipo.getIsDeleted() == 1) {
            throw new IllegalArgumentException("Este equipo ya está dado de baja.");
        }
        equipo.setIsDeleted(1);
        repository.save(equipo);
    }
}
