package com.inia.soportedesk.impresoras;

import com.inia.soportedesk.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ImpresoraService {

    private final ImpresoraRepository repository;

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

    public Impresora create(ImpresoraRequest request) {
        Impresora impresora = new Impresora();
        copyFields(impresora, request);
        return repository.save(impresora);
    }

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
        impresora.setPiso(request.getPiso());
        impresora.setArea(request.getArea());
        impresora.setEstado(request.getEstado());
        impresora.setTonerNegro(request.getTonerNegro());
        impresora.setTonerC(request.getTonerC());
        impresora.setTonerM(request.getTonerM());
        impresora.setTonerY(request.getTonerY());
        impresora.setCartucho(request.getCartucho());
        impresora.setDrum(request.getDrum());
        impresora.setFusor(request.getFusor());
    }
}
