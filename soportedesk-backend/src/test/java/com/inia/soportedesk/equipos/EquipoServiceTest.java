package com.inia.soportedesk.equipos;

import com.inia.soportedesk.glpi.GlpiTecladoRepository;
import com.inia.soportedesk.glpi.VwInvComputerFull;
import com.inia.soportedesk.glpi.VwInvComputerFullRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EquipoServiceTest {

    @Mock
    private VwInvComputerFullRepository repository;

    @Mock
    private GlpiTecladoRepository tecladoRepository;

    @InjectMocks
    private EquipoService service;

    @Test
    void findAll_delegatesFiltersToRepository() {
        VwInvComputerFull equipo = new VwInvComputerFull();
        equipo.setComputerID(10L);
        when(repository.findFiltered("ana", "SEDE CENTRAL", "Laptop")).thenReturn(List.of(equipo));

        List<VwInvComputerFull> result = service.findAll("ana", "SEDE CENTRAL", "Laptop");

        assertThat(result).containsExactly(equipo);
        verify(repository).findFiltered("ana", "SEDE CENTRAL", "Laptop");
    }

    @Test
    void getKpis_calculatesCountsByTypeAndSede() {
        VwInvComputerFull desktopCentral = equipo("Desktop", "SEDE CENTRAL");
        VwInvComputerFull laptopEea = equipo("Laptop", "EEA ANDENES");
        VwInvComputerFull otroEea = equipo("Servidor", "EEA DONOSO");
        when(repository.findFiltered(null, null, null)).thenReturn(List.of(desktopCentral, laptopEea, otroEea));

        EquipoKpisDto result = service.getKpis();

        assertThat(result.totalActivos()).isEqualTo(3);
        assertThat(result.desktopCount()).isEqualTo(1);
        assertThat(result.laptopCount()).isEqualTo(1);
        assertThat(result.otrosCount()).isEqualTo(1);
        assertThat(result.sedeCentralCount()).isEqualTo(1);
        assertThat(result.eeasCount()).isEqualTo(2);
    }

    private VwInvComputerFull equipo(String tipo, String sede) {
        VwInvComputerFull equipo = new VwInvComputerFull();
        equipo.setTipoEquipo(tipo);
        equipo.setSedeNombre(sede);
        return equipo;
    }
}
