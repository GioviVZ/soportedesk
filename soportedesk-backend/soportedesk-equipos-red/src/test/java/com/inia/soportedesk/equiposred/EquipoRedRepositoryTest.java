package com.inia.soportedesk.equiposred;

import com.inia.soportedesk.catalogo.Sede;
import com.inia.soportedesk.catalogo.SedeRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class EquipoRedRepositoryTest {

    @Autowired
    private EquipoRedRepository repository;

    @Autowired
    private SedeRepository sedeRepository;

    @Test
    void search_findsByIpAndSedeNombreAndFiltersByTipo() {
        Sede central = new Sede();
        central.setNombre("Sede Experimental Central");
        central = sedeRepository.save(central);

        repository.save(equipo(TipoEquipoRed.SWITCH, "Cisco", "C9200", "10.10.8.20", central));
        repository.save(equipo(TipoEquipoRed.SWITCH, "Aruba", "2930F", "10.10.9.30", null));
        repository.save(equipo(TipoEquipoRed.ROUTER, "Mikrotik", "CCR2004", "10.10.8.21", central));

        List<EquipoRed> byIp = repository.search(TipoEquipoRed.SWITCH, "10.10.8.20");
        List<EquipoRed> bySede = repository.search(TipoEquipoRed.SWITCH, "Experimental Central");
        List<EquipoRed> routerSearch = repository.search(TipoEquipoRed.ROUTER, "Experimental Central");

        assertThat(byIp)
                .extracting(EquipoRed::getModelo)
                .containsExactly("C9200");
        assertThat(bySede)
                .extracting(EquipoRed::getTipo, EquipoRed::getModelo)
                .containsExactly(org.assertj.core.groups.Tuple.tuple(TipoEquipoRed.SWITCH, "C9200"));
        assertThat(routerSearch)
                .extracting(EquipoRed::getTipo, EquipoRed::getModelo)
                .containsExactly(org.assertj.core.groups.Tuple.tuple(TipoEquipoRed.ROUTER, "CCR2004"));
    }

    private EquipoRed equipo(
            TipoEquipoRed tipo,
            String marca,
            String modelo,
            String ip,
            Sede sede) {
        EquipoRed equipo = new EquipoRed();
        equipo.setTipo(tipo);
        equipo.setMarca(marca);
        equipo.setModelo(modelo);
        equipo.setIp(ip);
        equipo.setEstado("Operativo");
        equipo.setSede(sede);
        return equipo;
    }
}
