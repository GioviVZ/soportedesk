package com.inia.soportedesk.correos;

import com.inia.soportedesk.catalogo.*;
import com.inia.soportedesk.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CorreoService {

    private final CorreoRepository repository;
    private final SedeRepository sedeRepository;
    private final DependenciaRepository dependenciaRepository;
    private final SubdependenciaRepository subdependenciaRepository;
    private final TipoContratoRepository tipoContratoRepository;

    public List<Correo> findAll(String search) {
        if (search == null || search.isBlank()) {
            return repository.findAll();
        }
        return repository.search(search);
    }

    public Correo findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Correo no encontrado: " + id));
    }

    @Transactional
    public Correo create(CorreoRequest request) {
        Correo correo = new Correo();
        copyFields(correo, request);
        return repository.save(correo);
    }

    @Transactional
    public Correo update(Long id, CorreoRequest request) {
        Correo correo = findById(id);
        copyFields(correo, request);
        return repository.save(correo);
    }

    public void delete(Long id) {
        repository.delete(findById(id));
    }

    private void copyFields(Correo correo, CorreoRequest request) {
        correo.setUsuario(request.getUsuario());
        correo.setNombre(request.getNombre());
        correo.setCorreo(request.getCorreo());
        correo.setEstado(request.getEstado());
        correo.setFechaFinContrato(request.getFechaFinContrato());
        correo.setCreado(request.getCreado());
        correo.setSede(sedeRepository.findById(request.getSedeId())
                .orElseThrow(() -> new ResourceNotFoundException("Sede no encontrada: " + request.getSedeId())));
        correo.setDependencia(dependenciaRepository.findById(request.getDependenciaId())
                .orElseThrow(() -> new ResourceNotFoundException("Dependencia no encontrada: " + request.getDependenciaId())));
        correo.setSubdependencia(subdependenciaRepository.findById(request.getSubdependenciaId())
                .orElseThrow(() -> new ResourceNotFoundException("Subdependencia no encontrada: " + request.getSubdependenciaId())));
        correo.setTipoContrato(tipoContratoRepository.findById(request.getTipoContratoId())
                .orElseThrow(() -> new ResourceNotFoundException("Tipo de contrato no encontrado: " + request.getTipoContratoId())));
    }
}
