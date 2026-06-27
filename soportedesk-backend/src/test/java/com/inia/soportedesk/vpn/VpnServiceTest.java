package com.inia.soportedesk.vpn;

import com.inia.soportedesk.equipos.EquipoRepository;
import com.inia.soportedesk.exception.ResourceNotFoundException;
import com.inia.soportedesk.usuariosred.UsuarioRed;
import com.inia.soportedesk.usuariosred.UsuarioRedRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VpnServiceTest {

    @Mock
    private VpnRepository repository;

    @Mock
    private UsuarioRedRepository usuarioRedRepository;

    @Mock
    private EquipoRepository equipoRepository;

    @InjectMocks
    private VpnService service;

    private VpnRequest sampleRequest() {
        VpnRequest request = new VpnRequest();
        request.setUsuarioRedId(1L);
        request.setIpAsignada("10.8.0.2");
        request.setVence(LocalDate.of(2025, 12, 31));
        request.setEstado("Activo");
        return request;
    }

    @Test
    void findAll_withoutSearch_returnsAll() {
        Vpn vpn = new Vpn();
        vpn.setEstado("Activo");
        when(repository.findAll()).thenReturn(List.of(vpn));

        List<Vpn> result = service.findAll(null);

        assertThat(result).hasSize(1);
        verify(repository).findAll();
    }

    @Test
    void findById_whenNotFound_throwsResourceNotFoundException() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.findById(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void create_savesVpnFromRequest() {
        UsuarioRed mockUser = new UsuarioRed();
        mockUser.setId(1L);
        mockUser.setNombre("Juan Pérez");
        when(usuarioRedRepository.findById(1L)).thenReturn(Optional.of(mockUser));
        when(repository.save(any(Vpn.class))).thenAnswer(inv -> inv.getArgument(0));

        Authentication auth = org.mockito.Mockito.mock(Authentication.class);
        when(auth.getAuthorities()).thenReturn(java.util.List.of());

        Vpn result = service.create(sampleRequest(), auth);

        assertThat(result.getEstado()).isEqualTo("Activo");
        assertThat(result.getIpAsignada()).isEqualTo("10.8.0.2");
        assertThat(result.getVence()).isEqualTo(LocalDate.of(2025, 12, 31));
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

        Authentication auth = org.mockito.Mockito.mock(Authentication.class);
        java.util.List<org.springframework.security.core.GrantedAuthority> authorities = java.util.List.of(
                new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_SOPORTE"));
        org.mockito.Mockito.doReturn(authorities).when(auth).getAuthorities();

        service.maskCredencialesIfNeeded(vpn, auth);

        assertThat(vpn.getUsuarioVpn()).isNull();
        assertThat(vpn.getCredencialVpn()).isNull();
    }

    @Test
    void maskCredencialesIfNeeded_withReadAuthority_keepsCredentials() {
        Vpn vpn = new Vpn();
        vpn.setUsuarioVpn("vpnuser1");
        vpn.setCredencialVpn("supersecret");

        Authentication auth = org.mockito.Mockito.mock(Authentication.class);
        java.util.List<org.springframework.security.core.GrantedAuthority> authorities = java.util.List.of(
                new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_SOPORTE"),
                new org.springframework.security.core.authority.SimpleGrantedAuthority("READ_credenciales-vpn"));
        org.mockito.Mockito.doReturn(authorities).when(auth).getAuthorities();

        service.maskCredencialesIfNeeded(vpn, auth);

        assertThat(vpn.getUsuarioVpn()).isEqualTo("vpnuser1");
        assertThat(vpn.getCredencialVpn()).isEqualTo("supersecret");
    }

    @Test
    void maskCredencialesIfNeeded_withAdminRole_keepsCredentials() {
        Vpn vpn = new Vpn();
        vpn.setUsuarioVpn("vpnuser1");
        vpn.setCredencialVpn("supersecret");

        Authentication auth = org.mockito.Mockito.mock(Authentication.class);
        java.util.List<org.springframework.security.core.GrantedAuthority> authorities = java.util.List.of(
                new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_ADMIN"));
        org.mockito.Mockito.doReturn(authorities).when(auth).getAuthorities();

        service.maskCredencialesIfNeeded(vpn, auth);

        assertThat(vpn.getUsuarioVpn()).isEqualTo("vpnuser1");
    }
}
