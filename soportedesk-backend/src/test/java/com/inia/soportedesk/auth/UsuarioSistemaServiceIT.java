package com.inia.soportedesk.auth;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class UsuarioSistemaServiceIT {

    @Autowired
    private UsuarioSistemaService service;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PermisoRepository permisoRepository;

    @BeforeEach
    void setUp() {
        permisoRepository.deleteAll();
        usuarioRepository.deleteAll();
    }

    @Test
    void update_replacesExistingPermisosAndAllowsAddingAuditoria() {
        UsuarioSistemaRequest create = new UsuarioSistemaRequest();
        create.setUsername("soporte01");
        create.setNombre("Soporte Uno");
        create.setPassword("secret123");
        create.setActivo(true);
        create.setPermisos(List.of("vpn"));

        UsuarioSistemaResponse created = service.create(create);

        UsuarioSistemaRequest update = new UsuarioSistemaRequest();
        update.setUsername("soporte01");
        update.setNombre("Soporte Uno");
        update.setActivo(true);
        update.setPermisos(List.of("vpn", "auditoria"));

        UsuarioSistemaResponse updated = service.update(created.getId(), update);

        assertThat(updated.getPermisos()).containsExactlyInAnyOrder("vpn", "auditoria");
        Usuario usuario = usuarioRepository.findByUsername("soporte01").orElseThrow();
        assertThat(permisoRepository.findByUsuario(usuario))
                .extracting(Permiso::getModulo)
                .containsExactlyInAnyOrder("vpn", "auditoria");
    }
}
