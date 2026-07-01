package com.inia.soportedesk.equipos;

import com.inia.soportedesk.exception.ResourceNotFoundException;
import com.inia.soportedesk.glpi.VwInvComputerFull;
import com.inia.soportedesk.glpi.VwInvComputerFullRepository;
import com.inia.soportedesk.glpi.GlpiTecladoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EquipoService {

    private static final String DESKTOP = "Desktop";
    private static final String LAPTOP = "Laptop";
    private static final String SEDE_CENTRAL = "SEDE CENTRAL";

    private final VwInvComputerFullRepository repository;
    private final GlpiTecladoRepository tecladoRepository;

    public List<VwInvComputerFull> findAll(String search, String sede, String tipo) {
        return repository.findFiltered(blankToNull(search), blankToNull(sede), blankToNull(tipo));
    }

    public EquipoKpisDto getKpis() {
        List<VwInvComputerFull> equipos = repository.findFiltered(null, null, null);
        long totalActivos = equipos.size();
        long desktopCount = equipos.stream().filter(e -> DESKTOP.equals(e.getTipoEquipo())).count();
        long laptopCount = equipos.stream().filter(e -> LAPTOP.equals(e.getTipoEquipo())).count();
        long otrosCount = totalActivos - desktopCount - laptopCount;
        long sedeCentralCount = equipos.stream().filter(e -> SEDE_CENTRAL.equals(e.getSedeNombre())).count();
        long eeasCount = totalActivos - sedeCentralCount;

        return new EquipoKpisDto(totalActivos, desktopCount, laptopCount, otrosCount, sedeCentralCount, eeasCount);
    }

    public List<String> findSedes() {
        return repository.findDistinctSedes();
    }

    public List<String> findTipos() {
        return repository.findDistinctTipos();
    }

    public EquipoDetalleResponse findById(Long id) {
        VwInvComputerFull equipo = repository.findById(id)
                .filter(e -> e.getEliminado() == null || e.getEliminado() == 0)
                .orElseThrow(() -> new ResourceNotFoundException("Equipo no encontrado: " + id));
        return new EquipoDetalleResponse(
                equipo,
                repository.findSoftwareByComputerId(id),
                tecladoRepository.findByItemsId(id).orElse(null));
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }
}
