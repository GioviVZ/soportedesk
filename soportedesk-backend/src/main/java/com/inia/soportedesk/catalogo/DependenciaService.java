package com.inia.soportedesk.catalogo;

import com.inia.soportedesk.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DependenciaService {

    private final DependenciaRepository repository;
    private final SedeRepository sedeRepository;

    public List<Dependencia> findAll(Long sedeId, String search) {
        boolean hasSearch = search != null && !search.isBlank();

        if (sedeId != null && hasSearch) {
            return repository.searchBySedeId(sedeId, search);
        }
        if (sedeId != null) {
            return repository.findBySedeId(sedeId);
        }
        if (hasSearch) {
            return repository.search(search);
        }
        return repository.findAll();
    }

    public Dependencia findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Dependencia no encontrada: " + id));
    }

    public Dependencia create(DependenciaRequest request) {
        Dependencia dependencia = new Dependencia();
        dependencia.setNombre(request.getNombre());
        dependencia.setSede(resolveSede(request.getSedeId()));
        return repository.save(dependencia);
    }

    public Dependencia update(Long id, DependenciaRequest request) {
        Dependencia dependencia = findById(id);
        dependencia.setNombre(request.getNombre());
        dependencia.setSede(resolveSede(request.getSedeId()));
        return repository.save(dependencia);
    }

    public void delete(Long id) {
        repository.delete(findById(id));
    }

    private Sede resolveSede(Long sedeId) {
        return sedeRepository.findById(sedeId)
                .orElseThrow(() -> new ResourceNotFoundException("Sede no encontrada: " + sedeId));
    }
}
