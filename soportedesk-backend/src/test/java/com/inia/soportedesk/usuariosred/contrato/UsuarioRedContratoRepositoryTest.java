package com.inia.soportedesk.usuariosred.contrato;

import com.inia.soportedesk.catalogo.TipoContrato;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDate;
import java.util.List;

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

    @Test
    void findVencimientosUsuarioRed_returnsOnlyLatestContractPerUserWithinThirtyDays() {
        LocalDate hoy = LocalDate.of(2026, 8, 9);
        TipoContrato tipo = new TipoContrato(null, "OS");
        entityManager.persist(tipo);

        persistContrato(tipo, "porvencer", hoy.minusDays(30), hoy.plusDays(11));
        persistContrato(tipo, "renovado", hoy.minusDays(30), hoy.plusDays(5));
        persistContrato(tipo, "renovado", hoy, hoy.plusDays(60));
        persistContrato(tipo, "duplicado", hoy.minusDays(30), hoy.plusDays(15));
        persistContrato(tipo, "DUPLICADO", hoy.minusDays(15), hoy.plusDays(15));
        persistContrato(tipo, "vencido", hoy.minusDays(90), hoy.minusDays(1));
        persistContrato(tipo, "lejano", hoy, hoy.plusDays(31));
        entityManager.flush();

        List<UsuarioRedContrato> result = repository.findVencimientosUsuarioRed(hoy, hoy.plusDays(30));

        assertThat(result)
                .extracting(UsuarioRedContrato::getUsuario)
                .containsExactly("porvencer", "DUPLICADO");
    }

    private void persistContrato(TipoContrato tipo, String usuario, LocalDate inicio, LocalDate fin) {
        UsuarioRedContrato contrato = new UsuarioRedContrato();
        contrato.setUsuario(usuario);
        contrato.setTipoContrato(tipo);
        contrato.setFechaInicio(inicio);
        contrato.setFechaFin(fin);
        entityManager.persist(contrato);
    }
}
