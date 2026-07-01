package com.inia.soportedesk.correos;

import com.inia.soportedesk.gestiontiinia.VwGwDashboard;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/correos")
@RequiredArgsConstructor
public class CorreoController {

    private final CorreoService service;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_correos')")
    public List<VwGwDashboard> findAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String sede,
            @RequestParam(required = false) String dependencia,
            @RequestParam(required = false) String subdependencia,
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) String modalidad,
            @RequestParam(required = false) Boolean sinUso30Dias) {
        return service.findAll(search, sede, dependencia, subdependencia, estado, modalidad, sinUso30Dias);
    }

    @GetMapping("/kpis")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_correos')")
    public CorreoKpisDto kpis() {
        return service.getKpis();
    }

    @GetMapping("/sedes")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_correos')")
    public List<String> sedes() {
        return service.getSedes();
    }

    @GetMapping("/dependencias")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_correos')")
    public List<String> dependencias() {
        return service.getDependencias();
    }

    @GetMapping("/subdependencias")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_correos')")
    public List<String> subdependencias(@RequestParam(required = false) String dependencia) {
        return service.getSubdependencias(dependencia);
    }
}
