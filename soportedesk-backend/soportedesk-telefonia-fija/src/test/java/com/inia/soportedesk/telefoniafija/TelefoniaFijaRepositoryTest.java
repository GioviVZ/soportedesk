package com.inia.soportedesk.telefoniafija;

import com.inia.soportedesk.catalogo.Sede;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class TelefoniaFijaRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private TelefonoFijoRepository telefonoRepository;

    @Autowired
    private AsignacionAnexoRepository asignacionRepository;

    @Test
    void searchQueriesExecuteAndAsignacionesFilterByTelefonoSede() {
        Sede central = entityManager.persistAndFlush(new Sede(null, "Sede Central"));
        Sede norte = entityManager.persistAndFlush(new Sede(null, "Sede Norte"));

        TelefonoFijo cisco = telefono(
                TipoTelefonoFijo.IP, "Cisco", "CP-8841", "10.20.30.40", central);
        TelefonoFijo panasonic = telefono(
                TipoTelefonoFijo.ANALOGICO, "Panasonic", "KX-TS500", null, norte);
        cisco = telefonoRepository.save(cisco);
        panasonic = telefonoRepository.save(panasonic);

        asignacionRepository.save(asignacion(cisco, "1234", "Ana Torres"));
        asignacionRepository.save(asignacion(panasonic, "5678", "Luis Pérez"));
        entityManager.flush();

        List<TelefonoFijo> telefonos = telefonoRepository.search(TipoTelefonoFijo.IP, "10.20.30");
        List<AsignacionAnexo> porEquipo = asignacionRepository.search("Cisco", null, "Activa");
        List<AsignacionAnexo> porSede = asignacionRepository.search("", central.getId(), null);

        assertThat(telefonos).extracting(TelefonoFijo::getModelo).containsExactly("CP-8841");
        assertThat(porEquipo).extracting(AsignacionAnexo::getAnexo).containsExactly("1234");
        assertThat(porSede).extracting(AsignacionAnexo::getPersonaNombre).containsExactly("Ana Torres");
    }

    private TelefonoFijo telefono(
            TipoTelefonoFijo tipo,
            String marca,
            String modelo,
            String ip,
            Sede sede) {
        TelefonoFijo telefono = new TelefonoFijo();
        telefono.setTipo(tipo);
        telefono.setSede(sede);
        telefono.setMarca(marca);
        telefono.setModelo(modelo);
        telefono.setIp(ip);
        telefono.setEstado("Operativo");
        return telefono;
    }

    private AsignacionAnexo asignacion(TelefonoFijo telefono, String anexo, String persona) {
        AsignacionAnexo asignacion = new AsignacionAnexo();
        asignacion.setTelefonoFijo(telefono);
        asignacion.setAnexo(anexo);
        asignacion.setPersonaNombre(persona);
        asignacion.setFechaInicio(LocalDate.of(2026, 2, 1));
        asignacion.setEstado("Activa");
        return asignacion;
    }
}
