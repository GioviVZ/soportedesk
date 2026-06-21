package com.inia.soportedesk.catalogo;

import com.inia.soportedesk.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TipoLicenciaService {

    private final TipoLicenciaRepository repository;

    public List<TipoLicencia> findAll(String search) {
        if (search == null || search.isBlank()) {
            return repository.findAll();
        }
        return repository.search(search);
    }

    public TipoLicencia findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tipo de licencia no encontrado: " + id));
    }

    public TipoLicencia create(TipoLicenciaRequest request) {
        TipoLicencia tipo = new TipoLicencia();
        tipo.setNombre(request.getNombre());
        return repository.save(tipo);
    }

    public TipoLicencia update(Long id, TipoLicenciaRequest request) {
        TipoLicencia tipo = findById(id);
        tipo.setNombre(request.getNombre());
        return repository.save(tipo);
    }

    public void delete(Long id) {
        repository.delete(findById(id));
    }
}
