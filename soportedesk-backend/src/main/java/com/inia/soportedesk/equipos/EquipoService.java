package com.inia.soportedesk.equipos;

import com.inia.soportedesk.catalogo.DependenciaRepository;
import com.inia.soportedesk.catalogo.SedeRepository;
import com.inia.soportedesk.catalogo.SubdependenciaRepository;
import com.inia.soportedesk.exception.ResourceNotFoundException;
import com.inia.soportedesk.usuariosred.UsuarioRedRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EquipoService {

    private final EquipoRepository repository;
    private final UsuarioRedRepository usuarioRedRepository;
    private final SedeRepository sedeRepository;
    private final DependenciaRepository dependenciaRepository;
    private final SubdependenciaRepository subdependenciaRepository;

    public List<Equipo> findAll(String search) {
        if (search == null || search.isBlank()) {
            return repository.findAll();
        }
        return repository.search(search);
    }

    public List<Equipo> findConRed() {
        return repository.findByTipoIn(java.util.List.of("Laptop", "Computadora"));
    }

    public Equipo findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Equipo no encontrado: " + id));
    }

    @Transactional
    public Equipo create(EquipoRequest request) {
        Equipo equipo = new Equipo();
        copyFields(equipo, request);
        return repository.save(equipo);
    }

    @Transactional
    public Equipo update(Long id, EquipoRequest request) {
        Equipo equipo = findById(id);
        copyFields(equipo, request);
        return repository.save(equipo);
    }

    public void delete(Long id) {
        repository.delete(findById(id));
    }

    private void copyFields(Equipo equipo, EquipoRequest request) {
        equipo.setNumeroSerie(request.getNumeroSerie());
        equipo.setCodigoPatrimonial(request.getCodigoPatrimonial());
        equipo.setCodigoInventario(request.getCodigoInventario());
        equipo.setTipo(request.getTipo());
        equipo.setMarca(request.getMarca());
        equipo.setModelo(request.getModelo());
        equipo.setHost(request.getHost());
        equipo.setIp(request.getIp());
        equipo.setAsignado(request.getAsignado());
        equipo.setEstado(request.getEstado());
        equipo.setUsuarioRed(request.getUsuarioRedId() != null
                ? usuarioRedRepository.findById(request.getUsuarioRedId())
                        .orElseThrow(() -> new ResourceNotFoundException("Usuario de red no encontrado: " + request.getUsuarioRedId()))
                : null);
        equipo.setSede(request.getSedeId() != null
                ? sedeRepository.findById(request.getSedeId())
                        .orElseThrow(() -> new ResourceNotFoundException("Sede no encontrada: " + request.getSedeId()))
                : null);
        equipo.setDependencia(request.getDependenciaId() != null
                ? dependenciaRepository.findById(request.getDependenciaId())
                        .orElseThrow(() -> new ResourceNotFoundException("Dependencia no encontrada: " + request.getDependenciaId()))
                : null);
        equipo.setSubdependencia(request.getSubdependenciaId() != null
                ? subdependenciaRepository.findById(request.getSubdependenciaId())
                        .orElseThrow(() -> new ResourceNotFoundException("Subdependencia no encontrada: " + request.getSubdependenciaId()))
                : null);
    }
}
