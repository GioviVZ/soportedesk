package com.inia.soportedesk.vpn;

import com.inia.soportedesk.exception.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

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

    @InjectMocks
    private VpnService service;

    private VpnRequest sampleRequest() {
        VpnRequest request = new VpnRequest();
        request.setUsuario("jperez");
        request.setNombre("Juan Pérez");
        request.setTipo("OpenVPN");
        request.setIpAsignada("10.8.0.2");
        request.setVence(LocalDate.of(2025, 12, 31));
        request.setEstado("Activo");
        return request;
    }

    @Test
    void findAll_withoutSearch_returnsAll() {
        when(repository.findAll()).thenReturn(List.of(new Vpn(1L, "jperez", "Juan Pérez", "OpenVPN", "10.8.0.2", LocalDate.of(2025, 12, 31), "Activo")));

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
        when(repository.save(any(Vpn.class))).thenAnswer(inv -> inv.getArgument(0));

        Vpn result = service.create(sampleRequest());

        assertThat(result.getUsuario()).isEqualTo("jperez");
        assertThat(result.getVence()).isEqualTo(LocalDate.of(2025, 12, 31));
    }

    @Test
    void delete_removesExistingVpn() {
        Vpn existing = new Vpn(1L, "jperez", "Juan Pérez", "OpenVPN", "10.8.0.2", LocalDate.of(2025, 12, 31), "Activo");
        when(repository.findById(1L)).thenReturn(Optional.of(existing));

        service.delete(1L);

        verify(repository).delete(existing);
    }
}
