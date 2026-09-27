package com.inia.soportedesk.vpn;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VpnConfigInstitucionalServiceTest {

    @Mock
    private VpnConfigInstitucionalRepository repository;

    @InjectMocks
    private VpnConfigInstitucionalService service;

    @Test
    void actualizar_whenNoRowExists_createsWithFixedId() {
        LocalDate vencimiento = LocalDate.of(2027, 12, 31);
        when(repository.findById(1L)).thenReturn(Optional.empty());
        when(repository.save(org.mockito.ArgumentMatchers.any(VpnConfigInstitucional.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        VpnConfigInstitucional result = service.actualizar(vencimiento);

        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getVencimientoAntivirus()).isEqualTo(vencimiento);
        verify(repository).save(result);
    }

    @Test
    void actualizar_whenRowExists_updatesInPlace() {
        VpnConfigInstitucional existing = new VpnConfigInstitucional();
        existing.setId(1L);
        existing.setVencimientoAntivirus(LocalDate.of(2026, 1, 1));
        LocalDate nuevoVencimiento = LocalDate.of(2028, 3, 15);
        when(repository.findById(1L)).thenReturn(Optional.of(existing));
        when(repository.save(existing)).thenReturn(existing);

        VpnConfigInstitucional result = service.actualizar(nuevoVencimiento);

        assertThat(result).isSameAs(existing);
        assertThat(existing.getVencimientoAntivirus()).isEqualTo(nuevoVencimiento);
    }

    @Test
    void getVencimiento_whenNotConfigured_returnsNull() {
        when(repository.findById(1L)).thenReturn(Optional.empty());

        assertThat(service.getVencimiento()).isNull();
    }
}
