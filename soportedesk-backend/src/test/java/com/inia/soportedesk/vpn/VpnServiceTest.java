package com.inia.soportedesk.vpn;

import com.inia.soportedesk.activedirectory.AdUsuarioCache;
import com.inia.soportedesk.activedirectory.AdUsuarioCacheRepository;
import com.inia.soportedesk.auth.UsuarioRepository;
import com.inia.soportedesk.exception.ResourceNotFoundException;
import com.inia.soportedesk.glpi.VwInvComputerFull;
import com.inia.soportedesk.glpi.VwInvComputerFullRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VpnServiceTest {

    @Mock
    private VpnRepository repository;

    @Mock
    private AdUsuarioCacheRepository adUsuarioCacheRepository;

    @Mock
    private VwInvComputerFullRepository glpiRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private VpnConfigInstitucionalService configInstitucionalService;

    @InjectMocks
    private VpnService service;

    private VpnRequest sampleRequest() {
        VpnRequest request = new VpnRequest();
        request.setUsuarioRedSamAccountName("jruiz");
        request.setTipoEquipo("PERSONAL");
        request.setAntivirusVerificado(true);
        request.setAnalisisAntivirusRealizado(true);
        request.setTitularCargo("Profesional");
        return request;
    }

    private AdUsuarioCache cacheUser() {
        AdUsuarioCache usuario = new AdUsuarioCache();
        usuario.setSamAccountName("jruiz");
        usuario.setDisplayName("Juan Ruiz");
        usuario.setMail("jruiz@inia.gob.pe");
        usuario.setOffice("UTI");
        usuario.setOrganizationalUnit("OU=UTI,DC=inia,DC=local");
        usuario.setEnabled(true);
        return usuario;
    }

    private Authentication authAs(String username, String... authorities) {
        Authentication auth = mock(Authentication.class);
        List<GrantedAuthority> granted = List.of(authorities).stream()
                .map(SimpleGrantedAuthority::new)
                .map(GrantedAuthority.class::cast)
                .toList();
        // lenient(): most tests using this helper never call getAuthorities() (only
        // maskCredencialesIfNeeded does) — MockitoExtension's strict stubbing would otherwise
        // fail those tests with UnnecessaryStubbingException.
        org.mockito.Mockito.lenient().when(auth.getName()).thenReturn(username);
        org.mockito.Mockito.lenient().doReturn(granted).when(auth).getAuthorities();
        return auth;
    }

    @Test
    void findAll_withoutSearch_returnsAll() {
        Vpn vpn = new Vpn();
        vpn.setEstadoSolicitud("PENDIENTE");
        when(repository.findAll()).thenReturn(List.of(vpn));

        List<Vpn> result = service.findAll(null);

        assertThat(result).hasSize(1);
        verify(repository).findAll();
    }

    @Test
    void findAll_forEquipoInia_setsVenceFromConfigInstitucional() {
        Vpn vpn = new Vpn();
        vpn.setTipoEquipo("INIA");
        when(repository.findAll()).thenReturn(List.of(vpn));
        when(configInstitucionalService.getVencimiento()).thenReturn(LocalDate.of(2027, 12, 31));

        List<Vpn> result = service.findAll(null);

        assertThat(result.get(0).getVence()).isEqualTo(LocalDate.of(2027, 12, 31));
    }

    @Test
    void findById_whenNotFound_throwsResourceNotFoundException() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.findById(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getKpis_countsEachEstadoSolicitud() {
        when(repository.countByEstadoSolicitud("PENDIENTE")).thenReturn(3L);
        when(repository.countByEstadoSolicitud("APROBADO")).thenReturn(10L);
        when(repository.countByEstadoSolicitud("RECHAZADO")).thenReturn(2L);
        when(repository.countByEstadoSolicitud("OBSERVADO")).thenReturn(1L);

        VpnKpisDto result = service.getKpis();

        assertThat(result.pendientes()).isEqualTo(3L);
        assertThat(result.aprobadas()).isEqualTo(10L);
        assertThat(result.rechazadas()).isEqualTo(2L);
        assertThat(result.observadas()).isEqualTo(1L);
    }

    @Test
    void buscarUsuariosRed_normalizesIniaUpnForAdAutocomplete() {
        when(adUsuarioCacheRepository.autocompleteEnabled(eq("jruiz@inia.local"), eq("jruiz"), any(Pageable.class)))
                .thenReturn(List.of(cacheUser()));

        List<VpnUsuarioRedOption> result = service.buscarUsuariosRed("jruiz@inia.local");

        assertThat(result).extracting(VpnUsuarioRedOption::samAccountName).containsExactly("jruiz");
        verify(adUsuarioCacheRepository).autocompleteEnabled(eq("jruiz@inia.local"), eq("jruiz"), any(Pageable.class));
    }

    @Test
    void buscarUsuariosRed_normalizesDomainPrefixForAdAutocomplete() {
        when(adUsuarioCacheRepository.autocompleteEnabled(eq("INIA\\jruiz"), eq("jruiz"), any(Pageable.class)))
                .thenReturn(List.of(cacheUser()));

        List<VpnUsuarioRedOption> result = service.buscarUsuariosRed("INIA\\jruiz");

        assertThat(result).extracting(VpnUsuarioRedOption::samAccountName).containsExactly("jruiz");
        verify(adUsuarioCacheRepository).autocompleteEnabled(eq("INIA\\jruiz"), eq("jruiz"), any(Pageable.class));
    }

    @Test
    void crearSolicitud_withoutGlpiEquipo_savesPendingRequest() {
        when(adUsuarioCacheRepository.findFirstBySamAccountNameIgnoreCase("jruiz")).thenReturn(Optional.of(cacheUser()));
        when(usuarioRepository.findByUsername("jasistente")).thenReturn(Optional.empty());
        when(repository.save(any(Vpn.class))).thenAnswer(inv -> inv.getArgument(0));

        Vpn result = service.crearSolicitud(sampleRequest(), authAs("jasistente"));

        assertThat(result.getEstadoSolicitud()).isEqualTo("PENDIENTE");
        assertThat(result.getEstado()).isEqualTo("Inactivo");
        assertThat(result.getSolicitadoPor()).isEqualTo("jasistente");
        assertThat(result.getTipoEquipo()).isEqualTo("PERSONAL");
        assertThat(result.getGlpiComputerId()).isNull();
        assertThat(result.getFechaSolicitud()).isNotNull();
    }

    @Test
    void crearSolicitud_withIniaUpn_usesSamAccountNameForLookup() {
        when(adUsuarioCacheRepository.findFirstBySamAccountNameIgnoreCase("jruiz")).thenReturn(Optional.of(cacheUser()));
        when(usuarioRepository.findByUsername(any())).thenReturn(Optional.empty());
        when(repository.save(any(Vpn.class))).thenAnswer(inv -> inv.getArgument(0));

        VpnRequest request = sampleRequest();
        request.setUsuarioRedSamAccountName("jruiz@inia.local");

        Vpn result = service.crearSolicitud(request, authAs("jasistente"));

        assertThat(result.getAdSamAccountName()).isEqualTo("jruiz");
        verify(adUsuarioCacheRepository).findFirstBySamAccountNameIgnoreCase("jruiz");
    }

    @Test
    void crearSolicitud_withGlpiEquipo_snapshotsHostAndIp() {
        when(adUsuarioCacheRepository.findFirstBySamAccountNameIgnoreCase("jruiz")).thenReturn(Optional.of(cacheUser()));
        when(usuarioRepository.findByUsername(any())).thenReturn(Optional.empty());

        VwInvComputerFull equipo = new VwInvComputerFull();
        equipo.setComputerID(42L);
        equipo.setNombreEquipo("PC-CONTABILIDAD-01");
        equipo.setIpEquipo("172.16.10.5");
        when(glpiRepository.findById(42L)).thenReturn(Optional.of(equipo));
        when(repository.save(any(Vpn.class))).thenAnswer(inv -> inv.getArgument(0));

        VpnRequest request = sampleRequest();
        request.setTipoEquipo("INIA");
        request.setGlpiComputerId(42L);
        request.setHostActualizado(true);

        Vpn result = service.crearSolicitud(request, authAs("jasistente"));

        assertThat(result.getGlpiComputerId()).isEqualTo(42L);
        assertThat(result.getGlpiNombreEquipo()).isEqualTo("PC-CONTABILIDAD-01");
        assertThat(result.getGlpiIpEquipo()).isEqualTo("172.16.10.5");
        assertThat(result.getHostActualizado()).isTrue();
    }

    @Test
    void crearSolicitud_withUnknownGlpiId_throwsResourceNotFoundException() {
        when(adUsuarioCacheRepository.findFirstBySamAccountNameIgnoreCase("jruiz")).thenReturn(Optional.of(cacheUser()));
        when(glpiRepository.findById(999L)).thenReturn(Optional.empty());

        VpnRequest request = sampleRequest();
        request.setGlpiComputerId(999L);

        assertThatThrownBy(() -> service.crearSolicitud(request, authAs("jasistente")))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void crearSolicitud_copiesSistemaOperativoForticlientAndVencimientoAntivirus() {
        when(adUsuarioCacheRepository.findFirstBySamAccountNameIgnoreCase("jruiz")).thenReturn(Optional.of(cacheUser()));
        when(usuarioRepository.findByUsername(any())).thenReturn(Optional.empty());
        when(repository.save(any(Vpn.class))).thenAnswer(inv -> inv.getArgument(0));

        VpnRequest request = sampleRequest();
        request.setSistemaOperativoActualizado(true);
        request.setForticlientInstalado(true);
        request.setVencimientoAntivirus(LocalDate.of(2027, 1, 15));

        Vpn result = service.crearSolicitud(request, authAs("jasistente"));

        assertThat(result.getSistemaOperativoActualizado()).isTrue();
        assertThat(result.getForticlientInstalado()).isTrue();
        assertThat(result.getVencimientoAntivirus()).isEqualTo(LocalDate.of(2027, 1, 15));
    }

    @Test
    void crearSolicitud_forEquipoPersonal_setsVenceFromVencimientoAntivirus() {
        when(adUsuarioCacheRepository.findFirstBySamAccountNameIgnoreCase("jruiz")).thenReturn(Optional.of(cacheUser()));
        when(usuarioRepository.findByUsername(any())).thenReturn(Optional.empty());
        when(repository.save(any(Vpn.class))).thenAnswer(inv -> inv.getArgument(0));

        VpnRequest request = sampleRequest();
        request.setTipoEquipo("PERSONAL");
        request.setVencimientoAntivirus(LocalDate.of(2027, 2, 20));

        Vpn result = service.crearSolicitud(request, authAs("jasistente"));

        assertThat(result.getVence()).isEqualTo(LocalDate.of(2027, 2, 20));
    }

    @Test
    void aplicarVence_forEquipoIniaWithoutConfig_setsVenceNull() {
        Vpn vpn = new Vpn();
        vpn.setId(12L);
        vpn.setTipoEquipo("INIA");
        when(repository.findById(12L)).thenReturn(Optional.of(vpn));
        when(configInstitucionalService.getVencimiento()).thenReturn(null);

        Vpn result = service.findById(12L);

        assertThat(result.getVence()).isNull();
    }

    @Test
    void crearSolicitud_withTitularExterno_savesManualFieldsAndClearsCatalogRefs() {
        when(usuarioRepository.findByUsername(any())).thenReturn(Optional.empty());
        when(repository.save(any(Vpn.class))).thenAnswer(inv -> inv.getArgument(0));

        VpnRequest request = new VpnRequest();
        request.setTitularTipo("EXTERNO");
        request.setTitularNombre("Juan");
        request.setTitularApellidos("Pérez");
        request.setTitularCorreo("juan@externo.com");
        request.setTitularEmpresa("ACME SAC");
        request.setTitularMotivo("Consultoria - Proyecto X");
        request.setTitularCargo("Gerente");
        request.setTipoEquipo("PERSONAL");
        request.setAntivirusVerificado(true);
        request.setAnalisisAntivirusRealizado(true);

        Vpn result = service.crearSolicitud(request, authAs("jasistente"));

        assertThat(result.getTitularTipo()).isEqualTo("EXTERNO");
        assertThat(result.getTitularEmpresa()).isEqualTo("ACME SAC");
        assertThat(result.getTitularMotivo()).isEqualTo("Consultoria - Proyecto X");
        assertThat(result.getTitularNombreCompleto()).isEqualTo("Juan Pérez");
        assertThat(result.getTitularOrigenLabel()).isEqualTo("Externo");
    }

    @Test
    void crearSolicitud_withTitularExterno_missingMotivo_throwsIllegalArgumentException() {
        VpnRequest request = new VpnRequest();
        request.setTitularTipo("EXTERNO");
        request.setTitularNombre("Juan");
        request.setTitularApellidos("Pérez");
        request.setTitularCorreo("juan@externo.com");
        request.setTitularEmpresa("ACME SAC");
        request.setTitularCargo("Gerente");
        request.setTipoEquipo("PERSONAL");

        assertThatThrownBy(() -> service.crearSolicitud(request, authAs("jasistente")))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void crearSolicitud_withoutUsuarioRedIdOrValidTitularTipo_throwsIllegalArgumentException() {
        VpnRequest request = new VpnRequest();
        request.setTipoEquipo("PERSONAL");
        request.setTitularCargo("Profesional");

        assertThatThrownBy(() -> service.crearSolicitud(request, authAs("jasistente")))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void getTitularNombreCompleto_forAdTitular_returnsAdDisplayName() {
        Vpn vpn = new Vpn();
        vpn.setTitularTipo("AD");
        vpn.setAdDisplayName("Carlos Ruiz");

        assertThat(vpn.getTitularNombreCompleto()).isEqualTo("Carlos Ruiz");
        assertThat(vpn.getTitularOrigenLabel()).isEqualTo("AD");
    }

    @Test
    void getTitularNombreCompleto_forAdTitularWithoutDisplayName_fallsBackToSamAccountName() {
        Vpn vpn = new Vpn();
        vpn.setTitularTipo("AD");
        vpn.setAdSamAccountName("cruiz");

        assertThat(vpn.getTitularNombreCompleto()).isEqualTo("cruiz");
    }

    @Test
    void actualizarSolicitud_whenObservado_savesAndReturnsToPendiente() {
        Vpn existing = new Vpn();
        existing.setId(5L);
        existing.setEstadoSolicitud("OBSERVADO");
        when(repository.findById(5L)).thenReturn(Optional.of(existing));
        when(adUsuarioCacheRepository.findFirstBySamAccountNameIgnoreCase("jruiz")).thenReturn(Optional.of(cacheUser()));
        when(repository.save(any(Vpn.class))).thenAnswer(inv -> inv.getArgument(0));

        Vpn result = service.actualizarSolicitud(5L, sampleRequest(), authAs("jasistente"));

        assertThat(result.getEstadoSolicitud()).isEqualTo("PENDIENTE");
    }

    @Test
    void actualizarSolicitud_whenAprobado_throwsIllegalArgumentException() {
        Vpn existing = new Vpn();
        existing.setId(5L);
        existing.setEstadoSolicitud("APROBADO");
        when(repository.findById(5L)).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> service.actualizarSolicitud(5L, sampleRequest(), authAs("jasistente")))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void aprobar_whenPendiente_setsCredentialsAndMarksAprobado() {
        Vpn existing = new Vpn();
        existing.setId(7L);
        existing.setEstadoSolicitud("PENDIENTE");
        when(repository.findById(7L)).thenReturn(Optional.of(existing));
        when(usuarioRepository.findByUsername("mresponsable")).thenReturn(Optional.empty());
        when(repository.save(any(Vpn.class))).thenAnswer(inv -> inv.getArgument(0));

        VpnAprobarRequest request = new VpnAprobarRequest();
        request.setUsuarioVpn("vpnuser1");
        request.setCredencialVpn("Sup3rSecreta!");
        request.setEstado("Activo");

        Vpn result = service.aprobar(7L, request, authAs("mresponsable"));

        assertThat(result.getEstadoSolicitud()).isEqualTo("APROBADO");
        assertThat(result.getUsuarioVpn()).isEqualTo("vpnuser1");
        assertThat(result.getAprobadoPor()).isEqualTo("mresponsable");
        assertThat(result.getFechaResolucion()).isNotNull();
    }

    @Test
    void aprobar_whenNotPendiente_throwsIllegalArgumentException() {
        Vpn existing = new Vpn();
        existing.setId(7L);
        existing.setEstadoSolicitud("RECHAZADO");
        when(repository.findById(7L)).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> service.aprobar(7L, new VpnAprobarRequest(), authAs("mresponsable")))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void rechazar_whenPendiente_setsComentarioAndMarksRechazado() {
        Vpn existing = new Vpn();
        existing.setId(8L);
        existing.setEstadoSolicitud("PENDIENTE");
        when(repository.findById(8L)).thenReturn(Optional.of(existing));
        when(usuarioRepository.findByUsername(any())).thenReturn(Optional.empty());
        when(repository.save(any(Vpn.class))).thenAnswer(inv -> inv.getArgument(0));

        VpnResolucionRequest request = new VpnResolucionRequest();
        request.setComentarioResponsable("Falta análisis de antivirus");

        Vpn result = service.rechazar(8L, request, authAs("mresponsable"));

        assertThat(result.getEstadoSolicitud()).isEqualTo("RECHAZADO");
        assertThat(result.getComentarioResponsable()).isEqualTo("Falta análisis de antivirus");
    }

    @Test
    void observar_whenPendiente_setsComentarioAndMarksObservado() {
        Vpn existing = new Vpn();
        existing.setId(9L);
        existing.setEstadoSolicitud("PENDIENTE");
        when(repository.findById(9L)).thenReturn(Optional.of(existing));
        when(usuarioRepository.findByUsername(any())).thenReturn(Optional.empty());
        when(repository.save(any(Vpn.class))).thenAnswer(inv -> inv.getArgument(0));

        VpnResolucionRequest request = new VpnResolucionRequest();
        request.setComentarioResponsable("Falta seleccionar equipo GLPI");

        Vpn result = service.observar(9L, request, authAs("mresponsable"));

        assertThat(result.getEstadoSolicitud()).isEqualTo("OBSERVADO");
    }

    @Test
    void delete_removesExistingVpn() {
        Vpn existing = new Vpn();
        existing.setId(1L);
        when(repository.findById(1L)).thenReturn(Optional.of(existing));

        service.delete(1L);

        verify(repository).delete(existing);
    }

    @Test
    void maskCredencialesIfNeeded_withoutReadAuthority_nullsOutCredentials() {
        Vpn vpn = new Vpn();
        vpn.setUsuarioVpn("vpnuser1");
        vpn.setCredencialVpn("supersecret");
        vpn.setSolicitadoPor("otro-usuario");

        service.maskCredencialesIfNeeded(vpn, authAs("jasistente", "ROLE_SOPORTE"));

        assertThat(vpn.getUsuarioVpn()).isNull();
        assertThat(vpn.getCredencialVpn()).isNull();
    }

    @Test
    void maskCredencialesIfNeeded_withReadAuthority_keepsCredentials() {
        Vpn vpn = new Vpn();
        vpn.setUsuarioVpn("vpnuser1");
        vpn.setCredencialVpn("supersecret");
        vpn.setSolicitadoPor("otro-usuario");

        service.maskCredencialesIfNeeded(vpn, authAs("jasistente", "ROLE_SOPORTE", "READ_credenciales-vpn"));

        assertThat(vpn.getUsuarioVpn()).isEqualTo("vpnuser1");
    }

    @Test
    void maskCredencialesIfNeeded_withSolicitarReadAuthority_keepsCredentialsForRegistros() {
        Vpn vpn = new Vpn();
        vpn.setUsuarioVpn("vpnuser1");
        vpn.setCredencialVpn("supersecret");
        vpn.setSolicitadoPor("otro-usuario");

        service.maskCredencialesIfNeeded(vpn, authAs("jregistro", "ROLE_SOPORTE", "READ_solicitar-vpn"));

        assertThat(vpn.getUsuarioVpn()).isEqualTo("vpnuser1");
        assertThat(vpn.getCredencialVpn()).isEqualTo("supersecret");
    }

    @Test
    void maskCredencialesIfNeeded_withAdminRole_keepsCredentials() {
        Vpn vpn = new Vpn();
        vpn.setUsuarioVpn("vpnuser1");
        vpn.setCredencialVpn("supersecret");
        vpn.setSolicitadoPor("otro-usuario");

        service.maskCredencialesIfNeeded(vpn, authAs("admin", "ROLE_ADMIN"));

        assertThat(vpn.getUsuarioVpn()).isEqualTo("vpnuser1");
    }

    @Test
    void maskCredencialesIfNeeded_forOwnRequest_keepsCredentialsWithoutSpecialAuthority() {
        Vpn vpn = new Vpn();
        vpn.setUsuarioVpn("vpnuser1");
        vpn.setCredencialVpn("supersecret");
        vpn.setSolicitadoPor("jasistente");

        service.maskCredencialesIfNeeded(vpn, authAs("jasistente", "ROLE_SOPORTE", "WRITE_solicitar-vpn"));

        assertThat(vpn.getUsuarioVpn()).isEqualTo("vpnuser1");
        assertThat(vpn.getCredencialVpn()).isEqualTo("supersecret");
    }

    @Test
    void obtenerDashboardCompleto_aggregatesCountsAndBuckets() {
        Vpn iniaAprobado = new Vpn();
        iniaAprobado.setId(1L);
        iniaAprobado.setEstadoSolicitud("APROBADO");
        iniaAprobado.setTipoEquipo("INIA");
        iniaAprobado.setTitularTipo("AD");

        Vpn personalVencido = new Vpn();
        personalVencido.setId(2L);
        personalVencido.setEstadoSolicitud("APROBADO");
        personalVencido.setTipoEquipo("PERSONAL");
        personalVencido.setTitularTipo("EXTERNO");
        personalVencido.setTitularNombre("Ana");
        personalVencido.setTitularApellidos("Lopez");
        personalVencido.setVencimientoAntivirus(LocalDate.now().minusDays(5));

        Vpn personalPorVencer = new Vpn();
        personalPorVencer.setId(3L);
        personalPorVencer.setEstadoSolicitud("PENDIENTE");
        personalPorVencer.setTipoEquipo("PERSONAL");
        personalPorVencer.setTitularTipo("EXTERNO");
        personalPorVencer.setTitularNombre("Luis");
        personalPorVencer.setTitularApellidos("Ruiz");
        personalPorVencer.setVencimientoAntivirus(LocalDate.now().plusDays(10));

        Vpn personalVigente = new Vpn();
        personalVigente.setId(4L);
        personalVigente.setEstadoSolicitud("RECHAZADO");
        personalVigente.setTipoEquipo("PERSONAL");
        personalVigente.setTitularTipo("EXTERNO");
        personalVigente.setVencimientoAntivirus(LocalDate.now().plusDays(90));

        when(repository.findAll()).thenReturn(List.of(iniaAprobado, personalVencido, personalPorVencer, personalVigente));

        VpnDashboardCompleto result = service.obtenerDashboardCompleto();

        assertThat(result.pendientes()).isEqualTo(1);
        assertThat(result.aprobadas()).isEqualTo(2);
        assertThat(result.rechazadas()).isEqualTo(1);
        assertThat(result.observadas()).isEqualTo(0);
        assertThat(result.total()).isEqualTo(4);

        assertThat(result.distribucionPorTipoEquipo())
                .extracting(VpnTipoEquipoCount::tipoEquipo, VpnTipoEquipoCount::total)
                .containsExactlyInAnyOrder(
                        org.assertj.core.groups.Tuple.tuple("INIA", 1L),
                        org.assertj.core.groups.Tuple.tuple("PERSONAL", 3L)
                );

        assertThat(result.totalAntivirusVencidos()).isEqualTo(1);
        assertThat(result.antivirusVencidos()).extracting(VpnVencimientoAlerta::vpnId).containsExactly(2L);

        assertThat(result.totalAntivirusPorVencer()).isEqualTo(1);
        assertThat(result.antivirusPorVencer()).extracting(VpnVencimientoAlerta::vpnId).containsExactly(3L);
    }

    @Test
    void obtenerDashboardCompleto_onException_returnsEmptyDashboard() {
        when(repository.findAll()).thenThrow(new RuntimeException("db down"));

        VpnDashboardCompleto result = service.obtenerDashboardCompleto();

        assertThat(result.total()).isEqualTo(0);
        assertThat(result.distribucionPorTipoEquipo()).isEmpty();
        assertThat(result.antivirusVencidos()).isEmpty();
    }
}
