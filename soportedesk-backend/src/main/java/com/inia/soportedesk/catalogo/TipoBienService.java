package com.inia.soportedesk.catalogo;

import com.inia.soportedesk.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TipoBienService {

    private final TipoBienRepository repository;

    public List<TipoBien> findAll(String search) {
        if (search == null || search.isBlank()) {
            return repository.findAll();
        }
        return repository.search(search);
    }

    public TipoBien findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tipo de bien no encontrado: " + id));
    }

    public TipoBien create(TipoBienRequest request) {
        TipoBien tipo = new TipoBien();
        tipo.setNombre(request.getNombre());
        return repository.save(tipo);
    }

    public TipoBien update(Long id, TipoBienRequest request) {
        TipoBien tipo = findById(id);
        tipo.setNombre(request.getNombre());
        return repository.save(tipo);
    }

    public void delete(Long id) {
        repository.delete(findById(id));
    }
}
