package com.inia.soportedesk.equipos.glpicache;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Frontera transaccional local para las escrituras del cache en SQL Server.
 * Vive en un bean separado para que las llamadas desde el sincronizador pasen
 * por el proxy de Spring despues de completar las lecturas contra GLPI.
 */
@Service
@RequiredArgsConstructor
class EquipoGlpiCacheWriter {

    private final EquipoGlpiCacheRepository cacheRepository;

    @Transactional
    public int upsertBatch(LocalDateTime syncedAt, List<EquipoGlpiCache> rows) {
        cacheRepository.saveAll(rows);
        return cacheRepository.deleteBySyncedAtBefore(syncedAt);
    }

    @Transactional
    public void save(EquipoGlpiCache row) {
        cacheRepository.save(row);
    }

    @Transactional
    public void deleteById(Long computerId) {
        cacheRepository.deleteById(computerId);
    }
}
