package com.inia.soportedesk.usuariosred.contrato;

import com.inia.soportedesk.catalogo.TipoContrato;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class UsuarioRedContratoRepositoryTest {

    @Autowired private TestEntityManager entityManager;
    @Autowired private UsuarioRedContratoRepository repository;

    @Test
    void buscaNombreCompletoYApellidosPrimero() {
        TipoContrato tipo = new TipoContrato(null, "OS");
        entityManager.persist(tipo);

        UsuarioRedContrato contrato = new UsuarioRedContrato();
        contrato.setUsuario("mrojas");
        contrato.setTipoContrato(tipo);
        contrato.setFechaInicio(LocalDate.of(2026, 1, 1));
        contrato.setPersonalNombre("Maria Elena");
        contrato.setPersonalApellidos("Rojas Salazar");
        entityManager.persistAndFlush(contrato);

        assertThat(repository.searchByPersonal("Maria Elena Rojas Salazar"))
                .extracting(UsuarioRedContrato::getUsuario)
                .containsExactly("mrojas");
        assertThat(repository.searchByPersonal("Rojas Salazar Maria Elena"))
                .extracting(UsuarioRedContrato::getUsuario)
                .containsExactly("mrojas");
        assertThat(repository.findUsuariosForDirectorySearch(
                "Maria Elena Rojas Salazar", null, PageRequest.of(0, 75)))
                .containsExactly("mrojas");
    }
}
