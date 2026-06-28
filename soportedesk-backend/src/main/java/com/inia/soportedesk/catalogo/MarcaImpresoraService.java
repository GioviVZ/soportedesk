package com.inia.soportedesk.catalogo;

import com.inia.soportedesk.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

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

    public MarcaImpresora create(MarcaImpresoraRequest request) {
        MarcaImpresora marca = new MarcaImpresora();
        marca.setNombre(request.getNombre());
        return repository.save(marca);
    }

    public MarcaImpresora update(Long id, MarcaImpresoraRequest request) {
        MarcaImpresora marca = findById(id);
        marca.setNombre(request.getNombre());
        return repository.save(marca);
    }

    public void delete(Long id) {
        repository.delete(findById(id));
    }
}
