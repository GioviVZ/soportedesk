package com.inia.soportedesk.catalogo;

import com.inia.soportedesk.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ModeloImpresoraService {

    private final ModeloImpresoraRepository repository;
    private final MarcaImpresoraRepository marcaImpresoraRepository;

    public List<ModeloImpresora> findAll(Long marcaId, String search) {
        boolean hasSearch = search != null && !search.isBlank();

        if (marcaId != null && hasSearch) {
            return repository.searchByMarcaId(marcaId, search);
        }
        if (marcaId != null) {
            return repository.findByMarcaId(marcaId);
        }
        if (hasSearch) {
            return repository.search(search);
        }
        return repository.findAll();
    }

    public ModeloImpresora findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Modelo de impresora no encontrado: " + id));
    }

    @Transactional
    public ModeloImpresora create(ModeloImpresoraRequest request) {
        ModeloImpresora modelo = new ModeloImpresora();
        copyFields(modelo, request);
        return repository.save(modelo);
    }

    @Transactional
    public ModeloImpresora update(Long id, ModeloImpresoraRequest request) {
        ModeloImpresora modelo = findById(id);
        copyFields(modelo, request);
        return repository.save(modelo);
    }

    public void delete(Long id) {
        repository.delete(findById(id));
    }

    public ModeloImpresora updateDriver(Long id, String driverNombre, String driverVersion, String driverSo, String driverArchivoPath) {
        ModeloImpresora modelo = findById(id);
        modelo.setDriverNombre(driverNombre);
        modelo.setDriverVersion(driverVersion);
        modelo.setDriverSo(driverSo);
        modelo.setDriverArchivoPath(driverArchivoPath);
        return repository.save(modelo);
    }

    private void copyFields(ModeloImpresora modelo, ModeloImpresoraRequest request) {
        MarcaImpresora marca = marcaImpresoraRepository.findById(request.getMarcaId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Marca de impresora no encontrada: " + request.getMarcaId()));

        modelo.setMarca(marca);
        modelo.setNombre(request.getNombre());

        modelo.getToners().clear();
        for (ModeloImpresoraRequest.TonerRequest item : normalizedToners(request)) {
            ModeloImpresoraToner toner = new ModeloImpresoraToner();
            toner.setModeloImpresora(modelo);
            toner.setColor(item.getColor().trim());
            toner.setVariante(item.getVariante().trim());
            toner.setCodigo(item.getCodigo().trim());
            modelo.getToners().add(toner);
        }
    }

    private List<ModeloImpresoraRequest.TonerRequest> normalizedToners(ModeloImpresoraRequest request) {
        List<ModeloImpresoraRequest.TonerRequest> normalized = new ArrayList<>();
        if (request.getToners() == null) {
            return normalized;
        }
        for (ModeloImpresoraRequest.TonerRequest item : request.getToners()) {
            boolean hasColor = item != null && hasText(item.getColor());
            boolean hasVariante = item != null && hasText(item.getVariante());
            boolean hasCodigo = item != null && hasText(item.getCodigo());
            if (!hasColor && !hasVariante && !hasCodigo) {
                continue;
            }
            if (!hasColor || !hasVariante || !hasCodigo) {
                throw new IllegalArgumentException("Cada tóner debe tener color, variante y código.");
            }
            normalized.add(item);
        }
        return normalized;
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
