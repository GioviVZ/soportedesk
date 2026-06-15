package com.inia.soportedesk.wifi;

import com.inia.soportedesk.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WifiService {

    private final WifiRepository repository;

    public List<Wifi> findAll(String search) {
        if (search == null || search.isBlank()) {
            return repository.findAll();
        }
        return repository.search(search);
    }

    public Wifi findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Red WiFi no encontrada: " + id));
    }

    public Wifi create(WifiRequest request) {
        Wifi wifi = new Wifi();
        copyFields(wifi, request);
        return repository.save(wifi);
    }

    public Wifi update(Long id, WifiRequest request) {
        Wifi wifi = findById(id);
        copyFields(wifi, request);
        return repository.save(wifi);
    }

    public void delete(Long id) {
        repository.delete(findById(id));
    }

    private void copyFields(Wifi wifi, WifiRequest request) {
        wifi.setSsid(request.getSsid());
        wifi.setClave(request.getClave());
        wifi.setUbicacion(request.getUbicacion());
        wifi.setTipo(request.getTipo());
        wifi.setEstado(request.getEstado());
    }
}
