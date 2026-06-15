package com.inia.soportedesk.usuariosred;

import com.inia.soportedesk.catalogo.*;
import com.inia.soportedesk.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UsuarioRedService {

    private final UsuarioRedRepository repository;
    private final SedeRepository sedeRepository;
    private final DependenciaRepository dependenciaRepository;
    private final SubdependenciaRepository subdependenciaRepository;
    private final TipoContratoRepository tipoContratoRepository;

    public List<UsuarioRed> findAll(String search) {
        if (search == null || search.isBlank()) {
            return repository.findAll();
        }
        return repository.search(search);
    }

    public UsuarioRed findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario de red no encontrado: " + id));
    }

    public UsuarioRed create(UsuarioRedRequest request) {
        UsuarioRed usuario = new UsuarioRed();
        copyFields(usuario, request);
        return repository.save(usuario);
    }

    public UsuarioRed update(Long id, UsuarioRedRequest request) {
        UsuarioRed usuario = findById(id);
        copyFields(usuario, request);
        return repository.save(usuario);
    }

    public void delete(Long id) {
        repository.delete(findById(id));
    }

    private void copyFields(UsuarioRed usuario, UsuarioRedRequest request) {
        usuario.setUsuario(request.getUsuario());
        usuario.setNombre(request.getNombre());
        usuario.setGrupo(request.getGrupo());
        usuario.setUltimoLogin(request.getUltimoLogin());
        usuario.setEstado(request.getEstado());
        usuario.setFechaFinContrato(request.getFechaFinContrato());
        usuario.setSede(sedeRepository.findById(request.getSedeId())
                .orElseThrow(() -> new ResourceNotFoundException("Sede no encontrada: " + request.getSedeId())));
        usuario.setDependencia(dependenciaRepository.findById(request.getDependenciaId())
                .orElseThrow(() -> new ResourceNotFoundException("Dependencia no encontrada: " + request.getDependenciaId())));
        usuario.setSubdependencia(subdependenciaRepository.findById(request.getSubdependenciaId())
                .orElseThrow(() -> new ResourceNotFoundException("Subdependencia no encontrada: " + request.getSubdependenciaId())));
        usuario.setTipoContrato(tipoContratoRepository.findById(request.getTipoContratoId())
                .orElseThrow(() -> new ResourceNotFoundException("Tipo de contrato no encontrado: " + request.getTipoContratoId())));
    }
}
