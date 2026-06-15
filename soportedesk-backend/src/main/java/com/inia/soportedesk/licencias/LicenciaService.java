package com.inia.soportedesk.licencias;

import com.inia.soportedesk.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LicenciaService {

    private final LicenciaRepository repository;

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

    public Licencia create(LicenciaRequest request) {
        Licencia licencia = new Licencia();
        copyFields(licencia, request);
        return repository.save(licencia);
    }

    public Licencia update(Long id, LicenciaRequest request) {
        Licencia licencia = findById(id);
        copyFields(licencia, request);
        return repository.save(licencia);
    }

    public void delete(Long id) {
        repository.delete(findById(id));
    }

    private void copyFields(Licencia licencia, LicenciaRequest request) {
        licencia.setCantidad(request.getCantidad());
        licencia.setLicencia(request.getLicencia());
        licencia.setCorreo(request.getCorreo());
        licencia.setClave(request.getClave());
        licencia.setOrdenCompra(request.getOrdenCompra());
        licencia.setAnio(request.getAnio());
    }
}
