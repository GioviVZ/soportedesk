package com.inia.soportedesk.usuariosred.contrato;

import com.inia.soportedesk.activedirectory.ActiveDirectoryService;
import com.inia.soportedesk.activedirectory.AdUsuarioCache;
import com.inia.soportedesk.activedirectory.AdUsuarioCacheRepository;
import com.inia.soportedesk.catalogo.TipoContratoRepository;
import com.inia.soportedesk.glpi.VwInvComputerFullRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

/**
 * Reproduce el reporte del usuario: "en Consultas escribo una palabra y no sale nada,
 * ni siquiera similares". Usa repositorios JPA reales (no mocks) contra datos parecidos
 * a la caché real de AD, para descartar tanto bugs de JPQL como de la logica de scoring.
 */
@DataJpaTest
class UsuarioRedConsultaBusquedaRealTest {

    @Autowired
    private UsuarioRedContratoRepository repository;

    @Autowired
    private TipoContratoRepository tipoContratoRepository;

    @Autowired
    private AdUsuarioCacheRepository adUsuarioCacheRepository;

    private UsuarioRedContratoService service() {
        return new UsuarioRedContratoService(
                repository, tipoContratoRepository, adUsuarioCacheRepository,
                mock(ActiveDirectoryService.class), mock(VwInvComputerFullRepository.class));
    }

    private void seedUsuario(String sam, String displayName, String givenName, String surname) {
        AdUsuarioCache user = new AdUsuarioCache();
        user.setSamAccountName(sam);
        user.setDisplayName(displayName);
        user.setGivenName(givenName);
        user.setSurname(surname);
        user.setEnabled(true);
        user.setSyncedAt(LocalDateTime.now());
        adUsuarioCacheRepository.save(user);
    }

    @Test
    void searchConsultas_conPalabraParcial_encuentraCoincidenciasReales() {
        seedUsuario("ahumpire", "Abel Adan Humpire Mendoza", "Abel Adan", "Humpire Mendoza");
        seedUsuario("jperez", "Juan Perez Gomez", "Juan", "Perez Gomez");

        List<UsuarioRedConsultaDto> result = service().searchConsultas("humpire");

        assertThat(result).extracting(UsuarioRedConsultaDto::getUsuario).contains("ahumpire");
    }

    @Test
    void searchConsultas_conUnaSolaLetraDeUnaPalabraDeDosLetras_noRompe() {
        seedUsuario("ahumpire", "Abel Adan Humpire Mendoza", "Abel Adan", "Humpire Mendoza");

        List<UsuarioRedConsultaDto> result = service().searchConsultas("ab");

        assertThat(result).isNotNull();
    }
}
