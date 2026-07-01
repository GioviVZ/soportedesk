package com.inia.soportedesk.equipos;

import com.inia.soportedesk.glpi.VwInvComputerFull;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/equipos")
@RequiredArgsConstructor
public class EquipoController {

    private final EquipoService service;
    private final EquipoRepository localEquipoRepository;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_equipos')")
    public List<VwInvComputerFull> findAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String sede,
            @RequestParam(required = false) String tipo) {
        return service.findAll(search, sede, tipo);
    }

    @GetMapping("/kpis")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_equipos')")
    public EquipoKpisDto getKpis() {
        return service.getKpis();
    }

    @GetMapping("/sedes")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_equipos')")
    public List<String> findSedes() {
        return service.findSedes();
    }

    @GetMapping("/tipos")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_equipos')")
    public List<String> findTipos() {
        return service.findTipos();
    }

    @GetMapping("/con-red")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_equipos')")
    public List<Equipo> findConRed() {
        return localEquipoRepository.findByTipoIn(List.of("Laptop", "Computadora"));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_equipos')")
    public EquipoDetalleResponse findById(@PathVariable Long id) {
        return service.findById(id);
    }
}
