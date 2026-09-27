package com.inia.soportedesk.catalogo;

import com.inia.soportedesk.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MarcaImpresoraService {

    private final MarcaImpresoraRepository repository;

    public List<MarcaImpresora> findAll(String search) {
        if (search == null || search.isBlank()) {
            return repository.findAll();
        }
        return repository.search(search);
    }

    public MarcaImpresora findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Marca de impresora no encontrada: " + id));
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public MarcaImpresora create(MarcaImpresoraRequest request) {
        String nombre = request.getNombre().trim();
        if (repository.existsByNombreIgnoreCase(nombre)) {
            throw new IllegalArgumentException("Ya existe la marca de impresora " + nombre + ".");
        }
        MarcaImpresora marca = new MarcaImpresora();
        marca.setNombre(nombre);
        return repository.save(marca);
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public MarcaImpresora update(Long id, MarcaImpresoraRequest request) {
        MarcaImpresora marca = findById(id);
        String nombre = request.getNombre().trim();
        if (repository.existsByNombreIgnoreCaseAndIdNot(nombre, id)) {
            throw new IllegalArgumentException("Ya existe la marca de impresora " + nombre + ".");
        }
        marca.setNombre(nombre);
        return repository.save(marca);
    }

    public void delete(Long id) {
        repository.delete(findById(id));
    }
}
