package com.inia.soportedesk.catalogo;

import com.inia.soportedesk.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TipoContratoService {

    private final TipoContratoRepository repository;

    public List<TipoContrato> findAll(String search) {
        if (search == null || search.isBlank()) {
            return repository.findAll();
        }
        return repository.search(search);
    }

    public TipoContrato findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tipo de contrato no encontrado: " + id));
    }

    public TipoContrato create(TipoContratoRequest request) {
        TipoContrato tipo = new TipoContrato();
        tipo.setNombre(request.getNombre());
        return repository.save(tipo);
    }

    public TipoContrato update(Long id, TipoContratoRequest request) {
        TipoContrato tipo = findById(id);
        tipo.setNombre(request.getNombre());
        return repository.save(tipo);
    }

    public void delete(Long id) {
        repository.delete(findById(id));
    }
}
