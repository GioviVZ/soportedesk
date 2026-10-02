package com.inia.soportedesk.equiposmoviles;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.time.LocalDate;
import java.util.LinkedHashSet;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class EquiposMovilesRepositoryTest {

    @Autowired
    private EquipoMovilRepository equipoRepository;

    @Autowired
    private AsignacionNumeroMovilRepository asignacionRepository;

    @Autowired
    private ActaMovilRepository actaRepository;

    @Test
    void searchQueriesExecuteAndFilterAcrossAllThreeAggregates() {
        EquipoMovil samsung = equipo(
                TipoEquipoMovil.SMARTPHONE, "Samsung", "Galaxy S24", "490154203237518");
        EquipoMovil apple = equipo(
                TipoEquipoMovil.TABLET, "Apple", "iPad Air", "356938035643809");
        samsung = equipoRepository.save(samsung);
        apple = equipoRepository.save(apple);

        AsignacionNumeroMovil asignacion = new AsignacionNumeroMovil();
        asignacion.setEquipoMovil(samsung);
        asignacion.setNumero("987654321");
        asignacion.setOperador("Claro");
        asignacion.setPlan("Plan institucional");
        asignacion.setPersonaNombre("María Pérez");
        asignacion.setFechaInicio(LocalDate.of(2026, 1, 10));
        asignacion.setEstado("Activa");
        asignacionRepository.save(asignacion);

        ActaMovil actaSamsung = acta("AM-001", "Entrega", samsung);
        ActaMovil actaApple = acta("AM-002", "Devolución", apple);
        actaRepository.saveAll(List.of(actaSamsung, actaApple));

        List<EquipoMovil> equipos = equipoRepository.search(TipoEquipoMovil.SMARTPHONE, "490154");
        List<AsignacionNumeroMovil> asignaciones = asignacionRepository.search(
                "Galaxy", "Claro", "Activa");
        List<ActaMovil> actas = actaRepository.search("490154", "Entrega", null, null);

        assertThat(equipos).extracting(EquipoMovil::getModelo).containsExactly("Galaxy S24");
        assertThat(asignaciones).extracting(AsignacionNumeroMovil::getNumero)
                .containsExactly("987654321");
        assertThat(actas).extracting(ActaMovil::getNumeroActa).containsExactly("AM-001");
    }

    private EquipoMovil equipo(TipoEquipoMovil tipo, String marca, String modelo, String imei1) {
        EquipoMovil equipo = new EquipoMovil();
        equipo.setTipo(tipo);
        equipo.setMarca(marca);
        equipo.setModelo(modelo);
        equipo.setImei1(imei1);
        equipo.setEstado("Operativo");
        return equipo;
    }

    private ActaMovil acta(String numero, String tipo, EquipoMovil equipo) {
        ActaMovil acta = new ActaMovil();
        acta.setNumeroActa(numero);
        acta.setTipo(tipo);
        acta.setFecha(LocalDate.of(2026, 2, 1));
        acta.setPersonaNombre("María Pérez");
        acta.setEquipos(new LinkedHashSet<>(List.of(equipo)));
        return acta;
    }
}
