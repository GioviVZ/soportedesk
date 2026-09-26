package com.inia.soportedesk.catalogo;

import com.inia.soportedesk.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SubdependenciaService {

    private final SubdependenciaRepository repository;
    private final DependenciaRepository dependenciaRepository;

    public List<Subdependencia> findAll(Long dependenciaId, String search) {
        boolean hasSearch = search != null && !search.isBlank();

        if (dependenciaId != null && hasSearch) {
            return repository.searchByDependenciaId(dependenciaId, search);
        }
        if (dependenciaId != null) {
            return repository.findByDependenciaId(dependenciaId);
        }
        if (hasSearch) {
            return repository.search(search);
        }
        return repository.findAll();
    }

    public Subdependencia findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Subdependencia no encontrada: " + id));
    }

    public Subdependencia create(SubdependenciaRequest request) {
        Subdependencia subdependencia = new Subdependencia();
        subdependencia.setNombre(request.getNombre());
        subdependencia.setDependencia(resolveDependencia(request.getDependenciaId()));
        return repository.save(subdependencia);
    }

    public Subdependencia update(Long id, SubdependenciaRequest request) {
        Subdependencia subdependencia = findById(id);
        subdependencia.setNombre(request.getNombre());
        subdependencia.setDependencia(resolveDependencia(request.getDependenciaId()));
        return repository.save(subdependencia);
    }

    public void delete(Long id) {
        repository.delete(findById(id));
    }

    private Dependencia resolveDependencia(Long dependenciaId) {
        return dependenciaRepository.findById(dependenciaId)
                .orElseThrow(() -> new ResourceNotFoundException("Dependencia no encontrada: " + dependenciaId));
    }
}
