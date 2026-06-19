package com.inia.soportedesk.dashboard;

import com.inia.soportedesk.equipos.EquipoRepository;
import com.inia.soportedesk.correos.CorreoRepository;
import com.inia.soportedesk.impresoras.ImpresoraRepository;
import com.inia.soportedesk.licencias.LicenciaRepository;
import com.inia.soportedesk.usuariosred.UsuarioRedRepository;
import com.inia.soportedesk.vpn.VpnRepository;
import com.inia.soportedesk.wifi.WifiRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock
    private LicenciaRepository licenciaRepository;

    @Mock
    private CorreoRepository correoRepository;

    @Mock
    private UsuarioRedRepository usuarioRedRepository;

    @Mock
    private VpnRepository vpnRepository;

    @Mock
    private WifiRepository wifiRepository;

    @Mock
    private ImpresoraRepository impresoraRepository;

    @Mock
    private EquipoRepository equipoRepository;

    @InjectMocks
    private DashboardService service;

    @Test
    void getCounts_returnsCountForEachModule() {
        when(licenciaRepository.count()).thenReturn(5L);
        when(correoRepository.count()).thenReturn(12L);
        when(usuarioRedRepository.count()).thenReturn(20L);
        when(vpnRepository.count()).thenReturn(3L);
        when(wifiRepository.count()).thenReturn(4L);
        when(impresoraRepository.count()).thenReturn(7L);
        when(equipoRepository.count()).thenReturn(15L);
        when(usuarioRedRepository.countDesactivados()).thenReturn(1L);

        DashboardCounts counts = service.getCounts();

        assertThat(counts.licencias()).isEqualTo(5L);
        assertThat(counts.correos()).isEqualTo(12L);
        assertThat(counts.usuariosRed()).isEqualTo(20L);
        assertThat(counts.vpn()).isEqualTo(3L);
        assertThat(counts.wifi()).isEqualTo(4L);
        assertThat(counts.impresoras()).isEqualTo(7L);
        assertThat(counts.equipos()).isEqualTo(15L);
        assertThat(counts.usuariosRedInactivos()).isEqualTo(1L);
    }
}
