package com.inia.soportedesk.impresoras;

import com.inia.soportedesk.catalogo.DependenciaRepository;
import com.inia.soportedesk.catalogo.SedeRepository;
import com.inia.soportedesk.catalogo.SubdependenciaRepository;
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

    public Impresora updateDriver(Long id, String driverNombre, String driverVersion, String driverSo, String driverArchivoPath) {
        Impresora impresora = findById(id);
        impresora.setDriverNombre(driverNombre);
        impresora.setDriverVersion(driverVersion);
        impresora.setDriverSo(driverSo);
        impresora.setDriverArchivoPath(driverArchivoPath);
        return repository.save(impresora);
    }

    public void delete(Long id) {
        repository.delete(findById(id));
    }

    private void copyFields(Impresora impresora, ImpresoraRequest request) {
        impresora.setNombre(request.getNombre());
        impresora.setMarca(request.getMarca());
        impresora.setModelo(request.getModelo());
        impresora.setIp(request.getIp());
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
        impresora.setModeloTonerNegro(emptyToNull(request.getModeloTonerNegro()));
        impresora.setModeloTonerC(emptyToNull(request.getModeloTonerC()));
        impresora.setModeloTonerM(emptyToNull(request.getModeloTonerM()));
        impresora.setModeloTonerY(emptyToNull(request.getModeloTonerY()));
        impresora.setModeloCartucho(emptyToNull(request.getModeloCartucho()));
        impresora.setModeloDrum(emptyToNull(request.getModeloDrum()));
        impresora.setModeloFusor(emptyToNull(request.getModeloFusor()));
    }

    private String emptyToNull(String val) {
        return (val == null || val.isBlank()) ? null : val.trim();
    }
}
