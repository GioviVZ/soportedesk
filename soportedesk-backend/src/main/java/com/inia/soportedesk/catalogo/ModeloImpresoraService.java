package com.inia.soportedesk.catalogo;

import com.inia.soportedesk.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

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

        syncToners(modelo, normalizedToners(request));
    }

    private List<ModeloImpresoraRequest.TonerRequest> normalizedToners(ModeloImpresoraRequest request) {
        List<ModeloImpresoraRequest.TonerRequest> normalized = new ArrayList<>();
        Map<String, Boolean> keys = new LinkedHashMap<>();
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
            item.setColor(item.getColor().trim());
            item.setVariante(item.getVariante().trim());
            item.setCodigo(item.getCodigo().trim());
            String key = tonerKey(item.getColor(), item.getVariante());
            if (keys.containsKey(key)) {
                throw new IllegalArgumentException("No repitas el mismo color y variante de consumible.");
            }
            keys.put(key, true);
            normalized.add(item);
        }
        return normalized;
    }

    private void syncToners(ModeloImpresora modelo, List<ModeloImpresoraRequest.TonerRequest> requested) {
        Map<String, ModeloImpresoraToner> existingByKey = new LinkedHashMap<>();
        for (ModeloImpresoraToner toner : modelo.getToners()) {
            existingByKey.put(tonerKey(toner.getColor(), toner.getVariante()), toner);
        }

        List<ModeloImpresoraToner> next = new ArrayList<>();
        for (ModeloImpresoraRequest.TonerRequest item : requested) {
            String key = tonerKey(item.getColor(), item.getVariante());
            ModeloImpresoraToner toner = existingByKey.remove(key);
            if (toner == null) {
                toner = new ModeloImpresoraToner();
                toner.setModeloImpresora(modelo);
            }
            toner.setColor(item.getColor());
            toner.setVariante(item.getVariante());
            toner.setCodigo(item.getCodigo());
            next.add(toner);
        }

        modelo.getToners().clear();
        modelo.getToners().addAll(next);
    }

    private String tonerKey(String color, String variante) {
        return (color == null ? "" : color.trim().toLowerCase(Locale.ROOT))
                + "::"
                + (variante == null ? "" : variante.trim().toLowerCase(Locale.ROOT));
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
