package com.inia.soportedesk.catalogo;

import com.inia.soportedesk.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SedeService {

    private final SedeRepository repository;

    public List<Sede> findAll(String search) {
        if (search == null || search.isBlank()) {
            return repository.findAll();
        }
        return repository.search(search);
    }

    public Sede findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sede no encontrada: " + id));
    }

    public Sede create(SedeRequest request) {
        Sede sede = new Sede();
        sede.setNombre(request.getNombre());
        return repository.save(sede);
    }

    public Sede update(Long id, SedeRequest request) {
        Sede sede = findById(id);
        sede.setNombre(request.getNombre());
        return repository.save(sede);
    }

    public void delete(Long id) {
        repository.delete(findById(id));
    }
}
