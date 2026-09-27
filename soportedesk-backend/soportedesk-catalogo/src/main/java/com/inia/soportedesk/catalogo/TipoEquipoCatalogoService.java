package com.inia.soportedesk.catalogo;

import com.inia.soportedesk.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TipoEquipoCatalogoService {

    private final TipoEquipoCatalogoRepository repository;

    public List<TipoEquipoCatalogo> findAll() {
        return repository.findByActivoTrue();
    }

    public TipoEquipoCatalogo create(TipoEquipoCatalogoRequest request) {
        TipoEquipoCatalogo entity = new TipoEquipoCatalogo();
        entity.setGlpiValor(request.getGlpiValor().trim());
        entity.setTipoNormalizado(request.getTipoNormalizado().trim());
        return repository.save(entity);
    }

    public TipoEquipoCatalogo update(Long id, TipoEquipoCatalogoRequest request) {
        TipoEquipoCatalogo entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tipo de equipo no encontrado: " + id));
        entity.setGlpiValor(request.getGlpiValor().trim());
        entity.setTipoNormalizado(request.getTipoNormalizado().trim());
        return repository.save(entity);
    }

    public void delete(Long id) {
        TipoEquipoCatalogo entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tipo de equipo no encontrado: " + id));
        entity.setActivo(false);
        repository.save(entity);
    }
}
