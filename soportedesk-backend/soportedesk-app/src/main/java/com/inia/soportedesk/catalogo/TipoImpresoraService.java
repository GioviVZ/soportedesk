package com.inia.soportedesk.catalogo;

import com.inia.soportedesk.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

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

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public TipoImpresora create(TipoImpresoraRequest request) {
        String nombre = request.getNombre().trim();
        if (repository.existsByNombreIgnoreCase(nombre)) {
            throw new IllegalArgumentException("Ya existe el tipo de impresora " + nombre + ".");
        }
        TipoImpresora tipo = new TipoImpresora();
        tipo.setNombre(nombre);
        return repository.save(tipo);
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public TipoImpresora update(Long id, TipoImpresoraRequest request) {
        TipoImpresora tipo = findById(id);
        String nombre = request.getNombre().trim();
        if (repository.existsByNombreIgnoreCaseAndIdNot(nombre, id)) {
            throw new IllegalArgumentException("Ya existe el tipo de impresora " + nombre + ".");
        }
        tipo.setNombre(nombre);
        return repository.save(tipo);
    }

    public void delete(Long id) {
        repository.delete(findById(id));
    }
}
