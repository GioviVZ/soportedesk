package com.inia.soportedesk.dashboard;

import com.inia.soportedesk.herramientas.ordenes.OrdenServicioResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService service;

    @GetMapping("/counts")
    public DashboardCounts getCounts(Authentication auth) {
        return service.getCounts(auth);
    }

    @GetMapping("/usuarios-red-por-ubicacion")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_usuarios-red')")
    public List<UbicacionUsuariosCount> usuariosRedPorUbicacion(@RequestParam(required = false) String nivel) {
        return service.usuariosRedPorUbicacion(nivel);
    }

    @GetMapping("/licencias-por-tipo")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_licencias')")
    public List<LicenciaTipoCount> licenciasPorTipo() {
        return service.licenciasPorTipo();
    }

    @GetMapping("/ordenes-servicio")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_herramientas')")
    public List<OrdenServicioResponse> ordenesServicio() {
        return service.ordenesServicioProximas();
    }

    @GetMapping("/impresoras-por-estado")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_impresoras')")
    public List<ModuloBreakdownItem> impresorasPorEstado() {
        return service.impresorasPorEstado();
    }

    @GetMapping("/vpn-por-estado-solicitud")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_vpn') || hasAuthority('WRITE_solicitar-vpn') || hasAuthority('WRITE_aprobar-vpn')")
    public List<ModuloBreakdownItem> vpnPorEstadoSolicitud() {
        return service.vpnPorEstadoSolicitud();
    }

    @GetMapping("/wifi-por-estado")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_wifi')")
    public List<ModuloBreakdownItem> wifiPorEstado() {
        return service.wifiPorEstado();
    }

    @GetMapping("/correos-por-estado")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_correos')")
    public List<ModuloBreakdownItem> correosPorEstado() {
        return service.correosPorEstado();
    }

    @GetMapping("/equipos-por-tipo")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_equipos')")
    public List<ModuloBreakdownItem> equiposPorTipo() {
        return service.equiposPorTipo();
    }
}
