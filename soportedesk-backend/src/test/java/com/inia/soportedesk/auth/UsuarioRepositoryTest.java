package com.inia.soportedesk.auth;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class UsuarioRepositoryTest {

    @org.springframework.beans.factory.annotation.Autowired
    private UsuarioRepository repository;

    @Test
    void findByUsername_returnsSeededAdmin() {
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
