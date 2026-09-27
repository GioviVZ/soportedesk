package com.inia.soportedesk.auth;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class UsuarioRepositoryTest {

    @org.springframework.beans.factory.annotation.Autowired
    private UsuarioRepository repository;

    @Test
    void findByUsername_returnsExistingUser() {
        Usuario admin = new Usuario();
        admin.setUsername("admin");
        admin.setNombre("Administrador");
        admin.setPasswordHash("hash");
        admin.setRol(Rol.ADMIN);
        admin.setActivo(true);
        repository.save(admin);

        var found = repository.findByUsername("admin");

        assertThat(found).isPresent();
        assertThat(found.get().getRol()).isEqualTo(Rol.ADMIN);
        assertThat(found.get().isActivo()).isTrue();
    }

    @Test
    void findByUsername_returnsEmptyForUnknownUser() {
        assertThat(repository.findByUsername("nope")).isEmpty();
    }
}
