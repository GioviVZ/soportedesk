package com.inia.soportedesk.vpn;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vpn")
@RequiredArgsConstructor
public class VpnController {

    private static final String CAN_VIEW =
            "hasRole('ADMIN') || hasAnyAuthority('READ_vpn','WRITE_vpn','READ_solicitar-vpn','WRITE_solicitar-vpn','READ_aprobar-vpn','WRITE_aprobar-vpn')";

    private final VpnService service;

    @GetMapping
    @PreAuthorize(CAN_VIEW)
    public List<Vpn> findAll(@RequestParam(required = false) String search, Authentication auth) {
        List<Vpn> result = service.findAll(search);
        service.maskCredencialesIfNeeded(result, auth);
        return result;
    }

    @GetMapping("/kpis")
    @PreAuthorize(CAN_VIEW)
    public VpnKpisDto getKpis() {
        return service.getKpis();
    }

    @GetMapping("/usuarios-red/buscar")
    @PreAuthorize(CAN_VIEW)
    public List<VpnUsuarioRedOption> buscarUsuariosRed(@RequestParam String termino) {
        return service.buscarUsuariosRed(termino);
    }

    @GetMapping("/{id}")
    @PreAuthorize(CAN_VIEW)
    public Vpn findById(@PathVariable Long id, Authentication auth) {
        Vpn vpn = service.findById(id);
        service.maskCredencialesIfNeeded(vpn, auth);
        return vpn;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_solicitar-vpn')")
    public ResponseEntity<Vpn> create(@Valid @RequestBody VpnRequest request, Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.crearSolicitud(request, auth));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_solicitar-vpn')")
    public Vpn update(@PathVariable Long id, @Valid @RequestBody VpnRequest request, Authentication auth) {
        return service.actualizarSolicitud(id, request, auth);
    }

    @PatchMapping("/{id}/aprobar")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_aprobar-vpn')")
    public Vpn aprobar(@PathVariable Long id, @Valid @RequestBody VpnAprobarRequest request, Authentication auth) {
        return service.aprobar(id, request, auth);
    }

    @PatchMapping("/{id}/rechazar")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_aprobar-vpn')")
    public Vpn rechazar(@PathVariable Long id, @Valid @RequestBody VpnResolucionRequest request, Authentication auth) {
        return service.rechazar(id, request, auth);
    }

    @PatchMapping("/{id}/observar")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_aprobar-vpn')")
    public Vpn observar(@PathVariable Long id, @Valid @RequestBody VpnResolucionRequest request, Authentication auth) {
        return service.observar(id, request, auth);
    }

    @PatchMapping("/{id}/antivirus")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_solicitar-vpn')")
    public Vpn updateAntivirus(@PathVariable Long id, @RequestBody VpnAntivirusRequest request) {
        return service.updateAntivirus(id, request);
    }

    @GetMapping("/dashboard/completo")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_aprobar-vpn')")
    public VpnDashboardCompleto getDashboardCompleto() {
        return service.obtenerDashboardCompleto();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
