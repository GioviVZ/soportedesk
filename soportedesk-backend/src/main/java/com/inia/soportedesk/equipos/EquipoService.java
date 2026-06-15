package com.inia.soportedesk.equipos;

import com.inia.soportedesk.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EquipoService {

    private final EquipoRepository repository;

    public List<Equipo> findAll(String search) {
        if (search == null || search.isBlank()) {
            return repository.findAll();
        }
        return repository.search(search);
    }

    public Equipo findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Equipo no encontrado: " + id));
    }

    public Equipo create(EquipoRequest request) {
        Equipo equipo = new Equipo();
        copyFields(equipo, request);
        return repository.save(equipo);
    }

    public Equipo update(Long id, EquipoRequest request) {
        Equipo equipo = findById(id);
        copyFields(equipo, request);
        return repository.save(equipo);
    }

    public void delete(Long id) {
        repository.delete(findById(id));
    }

    private void copyFields(Equipo equipo, EquipoRequest request) {
        equipo.setCodigo(request.getCodigo());
        equipo.setTipo(request.getTipo());
        equipo.setMarca(request.getMarca());
        equipo.setModelo(request.getModelo());
        equipo.setUsuario(request.getUsuario());
        equipo.setArea(request.getArea());
        equipo.setAsignado(request.getAsignado());
        equipo.setEstado(request.getEstado());
    }
}
