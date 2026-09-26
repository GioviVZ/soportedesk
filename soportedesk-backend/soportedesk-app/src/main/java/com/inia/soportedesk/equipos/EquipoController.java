package com.inia.soportedesk.equipos;

import com.inia.soportedesk.equipos.glpicache.EquipoGlpiCache;
import com.inia.soportedesk.equipos.glpicache.GlpiSyncCoordinator;
import com.inia.soportedesk.equipos.glpicache.dto.GlpiSyncStatus;
import com.inia.soportedesk.glpi.SoftwareExportRow;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/equipos")
@RequiredArgsConstructor
public class EquipoController {

    private final EquipoService service;
    private final GlpiSyncCoordinator syncCoordinator;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_equipos')")
    public List<EquipoGlpiCache> findAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String sede,
            @RequestParam(required = false) String tipo,
            @RequestParam(required = false) String dependencia,
            @RequestParam(required = false) String subdependencia,
            @RequestParam(required = false) String fabricante) {
        return service.findAll(search, sede, tipo, dependencia, subdependencia, fabricante);
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

    @GetMapping("/dependencias")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_equipos')")
    public List<String> findDependencias(@RequestParam(required = false) String sede) {
        return service.findDependencias(sede);
    }

    @GetMapping("/subdependencias")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_equipos')")
    public List<String> findSubdependencias(
            @RequestParam(required = false) String sede,
            @RequestParam(required = false) String dependencia) {
        return service.findSubdependencias(sede, dependencia);
    }

    @GetMapping("/fabricantes")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_equipos')")
    public List<String> findFabricantes() {
        return service.findFabricantes();
    }

    @PostMapping("/software/export")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_equipos')")
    public List<SoftwareExportRow> findSoftwareForExport(@RequestBody List<Long> computerIds) {
        return service.findSoftwareForExport(computerIds);
    }

@GetMapping("/salud")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_equipos')")
    public List<EquipoSaludDto> getSalud() {
        return service.getSalud();
    }

    @GetMapping("/dashboard/completo")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_equipos')")
    public EquipoDashboardCompleto dashboardCompleto() {
        return service.getDashboardCompleto();
    }

    @PostMapping("/sync/iniciar")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_equipos')")
    public GlpiSyncStatus iniciarSincronizacion() {
        return syncCoordinator.iniciar();
    }

    @GetMapping("/sync/estado")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_equipos')")
    public GlpiSyncStatus estadoSincronizacion() {
        return syncCoordinator.estado();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_equipos')")
    public EquipoDetalleResponse findById(@PathVariable Long id) {
        return service.findById(id);
    }
}
