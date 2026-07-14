package com.inia.soportedesk.dashboard;

import com.inia.soportedesk.activedirectory.AdUsuarioCacheRepository;
import com.inia.soportedesk.glpi.VwInvComputerFullRepository;
import com.inia.soportedesk.gestiontiinia.VwGwDashboardRepository;
import com.inia.soportedesk.impresoras.ImpresoraRepository;
import com.inia.soportedesk.licencias.LicenciaRepository;
import com.inia.soportedesk.vpn.VpnRepository;
import com.inia.soportedesk.wifi.WifiRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock
    private LicenciaRepository licenciaRepository;

    @Mock
    private VwGwDashboardRepository correoRepository;

    @Mock
    private AdUsuarioCacheRepository adUsuarioCacheRepository;

    @Mock
    private VpnRepository vpnRepository;

    @Mock
    private WifiRepository wifiRepository;

    @Mock
    private ImpresoraRepository impresoraRepository;

    @Mock
    private VwInvComputerFullRepository equipoRepository;

    @InjectMocks
    private DashboardService service;

    @Test
    void getCounts_returnsCountForEachModule() {
        when(licenciaRepository.count()).thenReturn(5L);
        when(correoRepository.count()).thenReturn(12L);
        when(adUsuarioCacheRepository.count()).thenReturn(20L);
        when(vpnRepository.count()).thenReturn(3L);
        when(vpnRepository.countByEstadoSolicitud("PENDIENTE")).thenReturn(2L);
        when(wifiRepository.count()).thenReturn(4L);
        when(impresoraRepository.count()).thenReturn(7L);
        when(equipoRepository.countByEliminado(0)).thenReturn(15L);
        when(adUsuarioCacheRepository.countByEnabledFalse()).thenReturn(1L);

        DashboardCounts counts = service.getCounts();

        assertThat(counts.licencias()).isEqualTo(5L);
        assertThat(counts.correos()).isEqualTo(12L);
        assertThat(counts.usuariosRed()).isEqualTo(20L);
        assertThat(counts.vpn()).isEqualTo(3L);
        assertThat(counts.vpnPendientes()).isEqualTo(2L);
        assertThat(counts.wifi()).isEqualTo(4L);
        assertThat(counts.impresoras()).isEqualTo(7L);
        assertThat(counts.equipos()).isEqualTo(15L);
        assertThat(counts.usuariosRedInactivos()).isEqualTo(1L);
    }

    @Test
    void usuariosRedPorUbicacion_withSede_pivotsRowsIntoActivosInactivos() {
        List<Object[]> rows = Arrays.<Object[]>asList(
                new Object[]{"Lima", "Activo", 10L},
                new Object[]{"Lima", "Inactivo", 2L},
                new Object[]{"Cusco", "Activo", 5L}
        );
        when(adUsuarioCacheRepository.countGroupedByOfficeAndEnabled()).thenReturn(rows);

        List<UbicacionUsuariosCount> result = service.usuariosRedPorUbicacion("sede");

        assertThat(result).containsExactly(
                new UbicacionUsuariosCount("Lima", 10L, 2L),
                new UbicacionUsuariosCount("Cusco", 5L, 0L)
        );
    }

    @Test
    void usuariosRedPorUbicacion_withDependencia_usesGroupedByOuQuery() {
        List<Object[]> rows = Arrays.<Object[]>asList(new Object[]{"TI", "Activo", 8L});
        when(adUsuarioCacheRepository.countGroupedByOuAndEnabled()).thenReturn(rows);

        List<UbicacionUsuariosCount> result = service.usuariosRedPorUbicacion("dependencia");

        assertThat(result).containsExactly(new UbicacionUsuariosCount("TI", 8L, 0L));
    }

    @Test
    void usuariosRedPorUbicacion_withInvalidOrNullNivel_defaultsToOffice() {
        when(adUsuarioCacheRepository.countGroupedByOfficeAndEnabled()).thenReturn(List.of());

        List<UbicacionUsuariosCount> result = service.usuariosRedPorUbicacion("foo");
        service.usuariosRedPorUbicacion(null);

        assertThat(result).isEmpty();
        verify(adUsuarioCacheRepository, org.mockito.Mockito.times(2)).countGroupedByOfficeAndEnabled();
    }

    @Test
    void licenciasPorTipo_sumsAndMapsRowsPreservingQueryOrder() {
        List<Object[]> rows = Arrays.<Object[]>asList(
                new Object[]{"Office", 450L},
                new Object[]{"Antivirus", 200L}
        );
        when(licenciaRepository.sumCantidadGroupedByTipoLicencia()).thenReturn(rows);

        List<LicenciaTipoCount> result = service.licenciasPorTipo();

        assertThat(result).containsExactly(
                new LicenciaTipoCount("Office", 450L),
                new LicenciaTipoCount("Antivirus", 200L)
        );
    }
}
