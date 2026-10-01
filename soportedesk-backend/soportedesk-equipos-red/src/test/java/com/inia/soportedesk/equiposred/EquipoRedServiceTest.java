package com.inia.soportedesk.equiposred;

import com.inia.soportedesk.catalogo.DependenciaRepository;
import com.inia.soportedesk.catalogo.Sede;
import com.inia.soportedesk.catalogo.SedeRepository;
import com.inia.soportedesk.catalogo.SubdependenciaRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EquipoRedServiceTest {

    @Mock
    private EquipoRedRepository repository;

    @Mock
    private SedeRepository sedeRepository;

    @Mock
    private DependenciaRepository dependenciaRepository;

    @Mock
    private SubdependenciaRepository subdependenciaRepository;

    @InjectMocks
    private EquipoRedService service;

    private EquipoRedRequest sampleRequest() {
        EquipoRedRequest request = new EquipoRedRequest();
        request.setTipo(TipoEquipoRed.SWITCH);
        request.setMarca(" Cisco ");
        request.setModelo(" Catalyst 9200 ");
        request.setSerie(" SW-001 ");
        request.setIp("10.20.30.40");
        request.setEstado("Operativo");
        return request;
    }

    @Test
    void create_savesNormalizedEquipo() {
        when(repository.save(any(EquipoRed.class))).thenAnswer(invocation -> invocation.getArgument(0));

        EquipoRed result = service.create(sampleRequest());

        assertThat(result.getTipo()).isEqualTo(TipoEquipoRed.SWITCH);
        assertThat(result.getMarca()).isEqualTo("Cisco");
        assertThat(result.getModelo()).isEqualTo("Catalyst 9200");
        assertThat(result.getSerie()).isEqualTo("SW-001");
        verify(repository).save(result);
    }

    @Test
    void create_withDuplicateSerie_rejectsRequest() {
        when(repository.existsBySerieIgnoreCase("SW-001")).thenReturn(true);

        assertThatThrownBy(() -> service.create(sampleRequest()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Ya existe un equipo de red con la serie SW-001.");
    }

    @Test
    void create_withInvalidIp_rejectsRequest() {
        EquipoRedRequest request = sampleRequest();
        request.setIp("999.20.30.40");

        assertThatThrownBy(() -> service.create(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("La IP no es válida");
    }

    @Test
    void create_normalizesMac() {
        EquipoRedRequest request = sampleRequest();
        request.setMac("a4-6c-2a-18-9f-01");
        when(repository.save(any(EquipoRed.class))).thenAnswer(invocation -> invocation.getArgument(0));

        EquipoRed result = service.create(request);

        assertThat(result.getMac()).isEqualTo("A4:6C:2A:18:9F:01");
        verify(repository).existsByMacIgnoreCase("A4:6C:2A:18:9F:01");
    }

    @Test
    void create_switch_forcesRadioenlaceFieldsToNull() {
        EquipoRedRequest request = sampleRequest();
        request.setRemotoSedeId(99L);
        request.setRemotoReferencia("Edificio remoto");
        request.setFrecuenciaGhz(new BigDecimal("5.800"));
        request.setAnchoCanalMhz(40);
        request.setSsidEnlace("BACKHAUL-INIA");
        when(repository.save(any(EquipoRed.class))).thenAnswer(invocation -> invocation.getArgument(0));

        EquipoRed result = service.create(request);

        assertThat(result.getRemotoSede()).isNull();
        assertThat(result.getRemotoReferencia()).isNull();
        assertThat(result.getFrecuenciaGhz()).isNull();
        assertThat(result.getAnchoCanalMhz()).isNull();
        assertThat(result.getSsidEnlace()).isNull();
    }

    @Test
    void resumen_countsEstadosAndDistinctSedes() {
        Sede sedeCentral = new Sede(1L, "Central");
        Sede sedeNorte = new Sede(2L, "Norte");

        EquipoRed operativo1 = equipo("Operativo", sedeCentral);
        EquipoRed operativo2 = equipo("Operativo", sedeCentral);
        EquipoRed enRevision = equipo("En revisión", sedeNorte);
        EquipoRed inactivo = equipo("Inactivo", null);
        EquipoRed deBaja = equipo("De baja", sedeNorte);
        when(repository.findByTipoOrderByIdDesc(TipoEquipoRed.SWITCH))
                .thenReturn(List.of(operativo1, operativo2, enRevision, inactivo, deBaja));

        EquipoRedResumen result = service.resumen(TipoEquipoRed.SWITCH);

        assertThat(result).isEqualTo(new EquipoRedResumen(5, 2, 1, 1, 1, 2));
    }

    private EquipoRed equipo(String estado, Sede sede) {
        EquipoRed equipo = new EquipoRed();
        equipo.setTipo(TipoEquipoRed.SWITCH);
        equipo.setMarca("Cisco");
        equipo.setModelo("C9200");
        equipo.setEstado(estado);
        equipo.setSede(sede);
        return equipo;
    }
}
