package com.inia.soportedesk.glpi;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class GlpiTecladoService {

    private final GlpiComputerTecladoRepository repository;

    @Transactional("glpiTransactionManager")
    public void crear(Long computerId, String marca, String modelo, String numeroSerie,
                       String codigoInventario, String codigoPatrimonial) {
        if (repository.existsByItemsIdAndItemtype(computerId, "Computer")) {
            throw new IllegalArgumentException("Este equipo ya tiene un teclado registrado.");
        }
        if (isBlank(marca) || isBlank(modelo) || isBlank(numeroSerie)) {
            throw new IllegalArgumentException("Marca, modelo y número de serie del teclado son obligatorios.");
        }

        GlpiComputerTeclado teclado = new GlpiComputerTeclado();
        teclado.setItemsId(computerId);
        teclado.setMarca(marca.trim());
        teclado.setModelo(modelo.trim());
        teclado.setNumeroSerie(numeroSerie.trim());
        teclado.setCodigoInventario(blankToNull(codigoInventario));
        teclado.setCodigoPatrimonial(blankToNull(codigoPatrimonial));
        repository.save(teclado);
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private String blankToNull(String value) {
        return isBlank(value) ? null : value.trim();
    }
}
