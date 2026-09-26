package com.inia.soportedesk.glpi;

import com.inia.soportedesk.equipos.glpicache.EquipoGlpiCacheSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class GlpiTecladoService {

    private final GlpiComputerTecladoRepository repository;
    private final EquipoGlpiCacheSyncService equipoGlpiCacheSyncService;

    @Transactional("glpiTransactionManager")
    public void guardar(Long computerId, String marca, String modelo, String numeroSerie,
                        String codigoInventario, String codigoPatrimonial) {
        if (isBlank(marca) || isBlank(modelo) || isBlank(numeroSerie)) {
            throw new IllegalArgumentException("Marca, modelo y número de serie del teclado son obligatorios.");
        }

        GlpiComputerTeclado teclado = repository.findFirstByItemsIdAndItemtype(computerId, "Computer")
                .orElseGet(() -> {
                    GlpiComputerTeclado nuevo = new GlpiComputerTeclado();
                    nuevo.setItemsId(computerId);
                    return nuevo;
                });
        teclado.setMarca(marca.trim());
        teclado.setModelo(modelo.trim());
        teclado.setNumeroSerie(numeroSerie.trim());
        teclado.setCodigoInventario(blankToNull(codigoInventario));
        teclado.setCodigoPatrimonial(blankToNull(codigoPatrimonial));
        repository.save(teclado);
        try {
            equipoGlpiCacheSyncService.resincronizarUno(computerId);
        } catch (Exception e) {
            log.warn("No se pudo refrescar el cache GLPI del equipo {} despues de guardar su teclado",
                    computerId, e);
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private String blankToNull(String value) {
        return isBlank(value) ? null : value.trim();
    }
}
