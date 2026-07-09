package com.inia.soportedesk.activedirectory;

import com.inia.soportedesk.activedirectory.dto.ActiveDirectoryDashboard;
import com.inia.soportedesk.activedirectory.dto.ActiveDirectoryDashboardCompleto;
import com.inia.soportedesk.activedirectory.dto.ActiveDirectoryGroup;
import com.inia.soportedesk.activedirectory.dto.ActiveDirectoryOu;
import com.inia.soportedesk.activedirectory.dto.ActiveDirectoryResponse;
import com.inia.soportedesk.activedirectory.dto.AdUserSearchResult;
import com.inia.soportedesk.activedirectory.dto.AdUser;
import com.inia.soportedesk.activedirectory.dto.GroupRequest;
import com.inia.soportedesk.activedirectory.dto.MoveUserRequest;
import com.inia.soportedesk.activedirectory.dto.ResetPasswordRequest;
import com.inia.soportedesk.activedirectory.dto.UpdateUserInfoRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/active-directory")
@RequiredArgsConstructor
public class ActiveDirectoryController {
    private final ActiveDirectoryService service;

    @GetMapping("/usuarios/{samAccountName}")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_usuarios-red')")
    public ActiveDirectoryResponse<AdUser> buscarUsuario(@PathVariable String samAccountName) {
        return service.buscarUsuarioPorSam(samAccountName);
    }

    @GetMapping("/usuarios/buscar")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_usuarios-red')")
    public AdUserSearchResult buscarUsuarios(@RequestParam(required = false) String usuario,
                                             @RequestParam(required = false) String nombre,
                                             @RequestParam(required = false) String oficina) {
        return service.buscarUsuarios(usuario, nombre, oficina);
    }

    @GetMapping("/usuarios/{samAccountName}/grupos")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_usuarios-red')")
    public List<ActiveDirectoryGroup> obtenerGruposUsuario(@PathVariable String samAccountName) {
        return service.obtenerGruposUsuario(samAccountName);
    }

    @GetMapping("/grupos")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_usuarios-red')")
    public List<ActiveDirectoryGroup> buscarGrupos(@RequestParam String nombre) {
        return service.buscarGrupos(nombre);
    }

    @GetMapping("/ous")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_usuarios-red')")
    public List<ActiveDirectoryOu> buscarOus(@RequestParam String nombre) {
        return service.buscarOus(nombre);
    }

    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_usuarios-red')")
    public ActiveDirectoryDashboard obtenerDashboard() {
        return service.obtenerDashboard();
    }

    @GetMapping("/dashboard/completo")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_usuarios-red')")
    public ActiveDirectoryDashboardCompleto obtenerDashboardCompleto() {
        return service.obtenerDashboardCompleto();
    }

    @PostMapping("/usuarios/{samAccountName}/desbloquear")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_usuarios-red')")
    public ActiveDirectoryResponse<AdUser> desbloquearUsuario(@PathVariable String samAccountName) {
        return service.desbloquearUsuario(samAccountName);
    }

    @PostMapping("/usuarios/{samAccountName}/reset-password")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_usuarios-red')")
    public ActiveDirectoryResponse<AdUser> resetPassword(@PathVariable String samAccountName,
                                                         @Valid @RequestBody ResetPasswordRequest request) {
        return service.resetPassword(samAccountName, request);
    }

    @PostMapping("/usuarios/{samAccountName}/deshabilitar")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_usuarios-red')")
    public ActiveDirectoryResponse<AdUser> deshabilitarUsuario(@PathVariable String samAccountName) {
        return service.deshabilitarUsuario(samAccountName);
    }

    @PostMapping("/usuarios/{samAccountName}/habilitar")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_usuarios-red')")
    public ActiveDirectoryResponse<AdUser> habilitarUsuario(@PathVariable String samAccountName) {
        return service.habilitarUsuario(samAccountName);
    }

    @PostMapping("/usuarios/{samAccountName}/mover-ou")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_usuarios-red')")
    public ActiveDirectoryResponse<AdUser> moverUsuarioOu(@PathVariable String samAccountName,
                                                          @Valid @RequestBody MoveUserRequest request) {
        return service.moverUsuarioOu(samAccountName, request);
    }

    @PostMapping("/usuarios/{samAccountName}/grupos/agregar")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_usuarios-red')")
    public ActiveDirectoryResponse<AdUser> agregarUsuarioGrupo(@PathVariable String samAccountName,
                                                               @Valid @RequestBody GroupRequest request) {
        return service.agregarUsuarioGrupo(samAccountName, request);
    }

    @PostMapping("/usuarios/{samAccountName}/grupos/quitar")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_usuarios-red')")
    public ActiveDirectoryResponse<AdUser> quitarUsuarioGrupo(@PathVariable String samAccountName,
                                                              @Valid @RequestBody GroupRequest request) {
        return service.quitarUsuarioGrupo(samAccountName, request);
    }

    @PostMapping("/usuarios/{samAccountName}/actualizar-info")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_usuarios-red')")
    public ActiveDirectoryResponse<AdUser> actualizarInformacionUsuario(@PathVariable String samAccountName,
                                                                        @RequestBody UpdateUserInfoRequest request) {
        return service.actualizarInformacionUsuario(samAccountName, request);
    }
}
