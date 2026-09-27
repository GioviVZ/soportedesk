package com.inia.soportedesk.glpi;

import com.inia.soportedesk.equipos.glpicache.EquipoGlpiCacheSyncService;
import com.inia.soportedesk.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class GlpiComputerService {

    private final GlpiComputerRepository repository;
    private final EquipoGlpiCacheSyncService equipoGlpiCacheSyncService;

    @Transactional("glpiTransactionManager")
    public void marcarEliminado(Long computerId) {
        GlpiComputer equipo = repository.findById(computerId)
                .orElseThrow(() -> new ResourceNotFoundException("Equipo no encontrado en GLPI: " + computerId));
        if (equipo.getIsDeleted() != null && equipo.getIsDeleted() == 1) {
            throw new IllegalArgumentException("Este equipo ya está dado de baja.");
        }
        equipo.setIsDeleted(1);
        repository.save(equipo);
        try {
            equipoGlpiCacheSyncService.resincronizarUno(computerId);
        } catch (Exception e) {
            log.warn("No se pudo refrescar el cache GLPI del equipo {} despues de darlo de baja",
                    computerId, e);
        }
    }
}
