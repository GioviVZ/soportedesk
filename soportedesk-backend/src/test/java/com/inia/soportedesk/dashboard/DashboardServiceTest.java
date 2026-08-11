package com.inia.soportedesk.dashboard;

import com.inia.soportedesk.activedirectory.AdUsuarioCacheRepository;
import com.inia.soportedesk.equipos.EquipoKpisDto;
import com.inia.soportedesk.equipos.EquipoService;
import com.inia.soportedesk.gestiontiinia.VwGwDashboardRepository;
import com.inia.soportedesk.herramientas.ordenes.OrdenServicioResponse;
import com.inia.soportedesk.herramientas.ordenes.OrdenServicioService;
import com.inia.soportedesk.impresoras.ImpresoraRepository;
import com.inia.soportedesk.licencias.LicenciaRepository;
import com.inia.soportedesk.vpn.VpnRepository;
import com.inia.soportedesk.wifi.WifiRepository;
import com.inia.soportedesk.usuariosred.contrato.UsuarioRedContratoRepository;
import com.inia.soportedesk.usuariosred.contrato.UsuarioRedContrato;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.time.LocalDate;

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
    private EquipoService equipoService;

    @Mock
    private OrdenServicioService ordenServicioService;

    @Mock
    private UsuarioRedContratoRepository usuarioRedContratoRepository;

    @InjectMocks
    private DashboardService service;

    @Test
    void getCounts_returnsCountForEachModule() {
        LocalDate hoy = LocalDate.now();
        UsuarioRedContrato contratoPorVencer = new UsuarioRedContrato();
        contratoPorVencer.setFechaFin(hoy.plusDays(6));
        when(licenciaRepository.count()).thenReturn(5L);
        when(correoRepository.count()).thenReturn(12L);
        when(adUsuarioCacheRepository.count()).thenReturn(20L);
        when(vpnRepository.count()).thenReturn(3L);
        when(vpnRepository.countByEstadoSolicitud("PENDIENTE")).thenReturn(2L);
        when(wifiRepository.count()).thenReturn(4L);
        when(impresoraRepository.count()).thenReturn(7L);
        when(equipoService.getKpis()).thenReturn(new EquipoKpisDto(15L, 6L, 7L, 2L, 10L, 5L));
        when(adUsuarioCacheRepository.countByEnabledFalse()).thenReturn(1L);
        when(usuarioRedContratoRepository.findVencimientosUsuarioRed(hoy, hoy.plusDays(30)))
                .thenReturn(List.of(contratoPorVencer));

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
        assertThat(counts.usuariosRedPorVencer()).isEqualTo(1L);
        assertThat(counts.proximoVencimientoUsuarioRed()).isEqualTo(hoy.plusDays(6));
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

    @Test
    void ordenesServicioProximas_returnsActiveOrdersFromService() {
        OrdenServicioResponse orden = new OrdenServicioResponse(
                1L, "OS-2026-001", "Soporte", null, null, 10, null, 5, false, "admin", null);
        when(ordenServicioService.listarProximas()).thenReturn(List.of(orden));

        assertThat(service.ordenesServicioProximas()).containsExactly(orden);
    }

    @Test
    void impresorasPorEstado_mapsRowsToModuloBreakdownItem() {
        List<Object[]> rows = Arrays.<Object[]>asList(
                new Object[]{"Operativa", 12L},
                new Object[]{"En reparacion", 3L}
        );
        when(impresoraRepository.countGroupedByEstado()).thenReturn(rows);

        List<ModuloBreakdownItem> result = service.impresorasPorEstado();

        assertThat(result).containsExactly(
                new ModuloBreakdownItem("Operativa", 12L),
                new ModuloBreakdownItem("En reparacion", 3L)
        );
    }

    @Test
    void vpnPorEstadoSolicitud_mapsRowsToModuloBreakdownItem() {
        List<Object[]> rows = Arrays.<Object[]>asList(
                new Object[]{"APROBADO", 8L},
                new Object[]{"PENDIENTE", 2L}
        );
        when(vpnRepository.countGroupedByEstadoSolicitud()).thenReturn(rows);

        List<ModuloBreakdownItem> result = service.vpnPorEstadoSolicitud();

        assertThat(result).containsExactly(
                new ModuloBreakdownItem("APROBADO", 8L),
                new ModuloBreakdownItem("PENDIENTE", 2L)
        );
    }

    @Test
    void wifiPorEstado_mapsRowsToModuloBreakdownItem() {
        List<Object[]> rows = Arrays.<Object[]>asList(new Object[]{"Activo", 6L});
        when(wifiRepository.countGroupedByEstado()).thenReturn(rows);

        assertThat(service.wifiPorEstado()).containsExactly(new ModuloBreakdownItem("Activo", 6L));
    }

    @Test
    void correosPorEstado_mapsRowsToModuloBreakdownItem() {
        List<Object[]> rows = Arrays.<Object[]>asList(new Object[]{"Activo", 20L});
        when(correoRepository.countGroupedByEstado()).thenReturn(rows);

        assertThat(service.correosPorEstado()).containsExactly(new ModuloBreakdownItem("Activo", 20L));
    }

    @Test
    void equiposPorTipo_returnsOnlyTheThreeAgreedComputerTypes() {
        when(equipoService.getKpis()).thenReturn(new EquipoKpisDto(50L, 18L, 27L, 5L, 30L, 20L));

        assertThat(service.equiposPorTipo()).containsExactly(
                new ModuloBreakdownItem("Laptop", 27L),
                new ModuloBreakdownItem("Computadora de Escritorio", 18L),
                new ModuloBreakdownItem("All in One", 5L)
        );
    }
}
