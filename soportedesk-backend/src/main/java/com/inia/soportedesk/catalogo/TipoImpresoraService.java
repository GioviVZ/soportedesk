package com.inia.soportedesk.catalogo;

import com.inia.soportedesk.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TipoImpresoraService {

    private final TipoImpresoraRepository repository;

    public List<TipoImpresora> findAll(String search) {
        if (search == null || search.isBlank()) {
            return repository.findAll();
        }
        return repository.search(search);
    }

    public TipoImpresora findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tipo de impresora no encontrado: " + id));
    }

    public TipoImpresora create(TipoImpresoraRequest request) {
        TipoImpresora tipo = new TipoImpresora();
        tipo.setNombre(request.getNombre());
        return repository.save(tipo);
    }

    public TipoImpresora update(Long id, TipoImpresoraRequest request) {
        TipoImpresora tipo = findById(id);
        tipo.setNombre(request.getNombre());
        return repository.save(tipo);
    }

    public void delete(Long id) {
        repository.delete(findById(id));
    }
}
