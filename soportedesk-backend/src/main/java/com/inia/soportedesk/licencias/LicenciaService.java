package com.inia.soportedesk.licencias;

import com.inia.soportedesk.catalogo.TipoBien;
import com.inia.soportedesk.catalogo.TipoBienRepository;
import com.inia.soportedesk.catalogo.TipoLicencia;
import com.inia.soportedesk.catalogo.TipoLicenciaRepository;
import com.inia.soportedesk.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LicenciaService {

    private final LicenciaRepository repository;
    private final TipoLicenciaRepository tipoLicenciaRepository;
    private final TipoBienRepository tipoBienRepository;

    public List<Licencia> findAll(String search) {
        if (search == null || search.isBlank()) {
            return repository.findAll();
        }
        return repository.search(search);
    }

    public Licencia findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Licencia no encontrada: " + id));
    }

    @Transactional
    public Licencia create(LicenciaRequest request) {
        Licencia licencia = new Licencia();
        copyFields(licencia, request);
        return repository.save(licencia);
    }

    @Transactional
    public Licencia update(Long id, LicenciaRequest request) {
        Licencia licencia = findById(id);
        copyFields(licencia, request);
        return repository.save(licencia);
    }

    public void delete(Long id) {
        repository.delete(findById(id));
    }

    private void copyFields(Licencia licencia, LicenciaRequest request) {
        List<LicenciaRequest.ActivacionRequest> activaciones = normalizedActivaciones(request);

        TipoLicencia tipoLicencia = tipoLicenciaRepository.findById(request.getTipoLicenciaId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Tipo de licencia no encontrado: " + request.getTipoLicenciaId()));
        TipoBien tipoBien = tipoBienRepository.findById(request.getTipoBienId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Tipo de bien no encontrado: " + request.getTipoBienId()));

        licencia.setTipoLicencia(tipoLicencia);
        licencia.setTipoBien(tipoBien);
        licencia.setDescripcion(request.getDescripcion());
        licencia.setCuentaActivacion(activaciones.isEmpty() ? null : activaciones.get(0).getCuentaActivacion().trim());
        licencia.setClaveActivacion(activaciones.isEmpty() ? null : activaciones.get(0).getClaveActivacion().trim());
        licencia.setSerialActivacion(request.getSerialActivacion());
        licencia.setOrdenCompra(request.getOrdenCompra());
        licencia.setAnio(request.getAnio());
        licencia.setCantidad(request.getCantidad());

        licencia.getActivaciones().clear();
        for (LicenciaRequest.ActivacionRequest item : activaciones) {
            LicenciaActivacion activacion = new LicenciaActivacion();
            activacion.setLicencia(licencia);
            activacion.setCuentaActivacion(item.getCuentaActivacion().trim());
            activacion.setClaveActivacion(item.getClaveActivacion().trim());
            licencia.getActivaciones().add(activacion);
        }
    }

    private List<LicenciaRequest.ActivacionRequest> normalizedActivaciones(LicenciaRequest request) {
        List<LicenciaRequest.ActivacionRequest> items = new ArrayList<>();
        if (request.getActivaciones() != null && !request.getActivaciones().isEmpty()) {
            items.addAll(request.getActivaciones());
        } else if (hasText(request.getCuentaActivacion()) || hasText(request.getClaveActivacion())) {
            LicenciaRequest.ActivacionRequest legacy = new LicenciaRequest.ActivacionRequest();
            legacy.setCuentaActivacion(request.getCuentaActivacion());
            legacy.setClaveActivacion(request.getClaveActivacion());
            items.add(legacy);
        }

        List<LicenciaRequest.ActivacionRequest> normalized = new ArrayList<>();
        for (LicenciaRequest.ActivacionRequest item : items) {
            boolean hasCuenta = item != null && hasText(item.getCuentaActivacion());
            boolean hasClave = item != null && hasText(item.getClaveActivacion());
            if (!hasCuenta && !hasClave) {
                continue;
            }
            if (!hasCuenta || !hasClave) {
                throw new IllegalArgumentException(
                        "Cada clave de activacion debe tener una cuenta de activacion asociada.");
            }
            normalized.add(item);
        }
        return normalized;
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
