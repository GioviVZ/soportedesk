package com.inia.soportedesk.usuariosred.contrato;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios-red/contratos")
@RequiredArgsConstructor
public class UsuarioRedContratoController {

    private final UsuarioRedContratoService service;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_usuarios-red')")
    public List<UsuarioRedContratoDto> findByUsuario(@RequestParam String usuario) {
        return service.findByUsuario(usuario);
    }

    @GetMapping("/buscar")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_usuarios-red')")
    public List<UsuarioRedContratoDto> buscarPorPersonal(@RequestParam String termino) {
        return service.searchByPersonal(termino);
    }

    @GetMapping("/consultas")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_usuarios-red')")
    public List<UsuarioRedConsultaDto> buscarConsultas(@RequestParam(required = false) String termino) {
        return service.searchConsultas(termino);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_usuarios-red')")
    public ResponseEntity<UsuarioRedContratoDto> create(@Valid @RequestBody UsuarioRedContratoRequest request,
                                                          Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request, auth.getName()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_usuarios-red')")
    public UsuarioRedContratoDto update(@PathVariable Long id,
                                         @Valid @RequestBody UsuarioRedContratoRequest request,
                                         Authentication auth) {
        return service.update(id, request, auth.getName());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_usuarios-red')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
