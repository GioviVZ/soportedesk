package com.inia.soportedesk.licencias;

import com.inia.soportedesk.catalogo.TipoBien;
import com.inia.soportedesk.catalogo.TipoBienRepository;
import com.inia.soportedesk.catalogo.TipoLicencia;
import com.inia.soportedesk.catalogo.TipoLicenciaRepository;
import com.inia.soportedesk.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
        if (request.getClaveActivacion() != null && !request.getClaveActivacion().isBlank()
                && (request.getCuentaActivacion() == null || request.getCuentaActivacion().isBlank())) {
            throw new IllegalArgumentException(
                    "No se puede registrar una clave de activación sin una cuenta de activación asociada.");
        }

        TipoLicencia tipoLicencia = tipoLicenciaRepository.findById(request.getTipoLicenciaId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Tipo de licencia no encontrado: " + request.getTipoLicenciaId()));
        TipoBien tipoBien = tipoBienRepository.findById(request.getTipoBienId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Tipo de bien no encontrado: " + request.getTipoBienId()));

        licencia.setTipoLicencia(tipoLicencia);
        licencia.setTipoBien(tipoBien);
        licencia.setDescripcion(request.getDescripcion());
        licencia.setCuentaActivacion(request.getCuentaActivacion());
        licencia.setClaveActivacion(request.getClaveActivacion());
        licencia.setSerialActivacion(request.getSerialActivacion());
        licencia.setOrdenCompra(request.getOrdenCompra());
        licencia.setAnio(request.getAnio());
        licencia.setCantidad(request.getCantidad());
    }
}
