package com.inia.soportedesk.impresoras;

import com.inia.soportedesk.catalogo.DependenciaRepository;
import com.inia.soportedesk.catalogo.ModeloImpresoraRepository;
import com.inia.soportedesk.catalogo.SedeRepository;
import com.inia.soportedesk.catalogo.SubdependenciaRepository;
import com.inia.soportedesk.catalogo.TipoImpresoraRepository;
import com.inia.soportedesk.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ImpresoraService {

    private final ImpresoraRepository repository;
    private final SedeRepository sedeRepository;
    private final DependenciaRepository dependenciaRepository;
    private final SubdependenciaRepository subdependenciaRepository;
    private final TipoImpresoraRepository tipoImpresoraRepository;
    private final ModeloImpresoraRepository modeloImpresoraRepository;

    public List<Impresora> findAll(String search) {
        if (search == null || search.isBlank()) {
            return repository.findAll();
        }
        return repository.search(search);
    }

    public Impresora findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Impresora no encontrada: " + id));
    }

    @Transactional
    public Impresora create(ImpresoraRequest request) {
        Impresora impresora = new Impresora();
        copyFields(impresora, request);
        return repository.save(impresora);
    }

    @Transactional
    public Impresora update(Long id, ImpresoraRequest request) {
        Impresora impresora = findById(id);
        copyFields(impresora, request);
        return repository.save(impresora);
    }

    public void delete(Long id) {
        repository.delete(findById(id));
    }

    private void copyFields(Impresora impresora, ImpresoraRequest request) {
        impresora.setModeloImpresora(modeloImpresoraRepository.findById(request.getModeloImpresoraId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Modelo de impresora no encontrado: " + request.getModeloImpresoraId())));
        impresora.setEstado(request.getEstado());
        impresora.setSede(request.getSedeId() != null
                ? sedeRepository.findById(request.getSedeId())
                        .orElseThrow(() -> new ResourceNotFoundException("Sede no encontrada: " + request.getSedeId()))
                : null);
        impresora.setDependencia(request.getDependenciaId() != null
                ? dependenciaRepository.findById(request.getDependenciaId())
                        .orElseThrow(() -> new ResourceNotFoundException("Dependencia no encontrada: " + request.getDependenciaId()))
                : null);
        impresora.setSubdependencia(request.getSubdependenciaId() != null
                ? subdependenciaRepository.findById(request.getSubdependenciaId())
                        .orElseThrow(() -> new ResourceNotFoundException("Subdependencia no encontrada: " + request.getSubdependenciaId()))
                : null);
        impresora.setTipoImpresora(request.getTipoImpresoraId() != null
                ? tipoImpresoraRepository.findById(request.getTipoImpresoraId())
                        .orElseThrow(() -> new ResourceNotFoundException("Tipo de impresora no encontrado: " + request.getTipoImpresoraId()))
                : null);
        impresora.setSerie(emptyToNull(request.getSerie()));
        impresora.setCodigoInventario(emptyToNull(request.getCodigoInventario()));
        impresora.setCodigoPatrimonial(emptyToNull(request.getCodigoPatrimonial()));
        impresora.setTipoConexion(request.getTipoConexion());
        impresora.setIp("IP".equals(request.getTipoConexion()) ? emptyToNull(request.getIp()) : null);
    }

    private String emptyToNull(String val) {
        return (val == null || val.isBlank()) ? null : val.trim();
    }
}
