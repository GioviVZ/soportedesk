package com.inia.soportedesk.wifi;

import com.inia.soportedesk.exception.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WifiServiceTest {

    @Mock
    private WifiRepository repository;

    @InjectMocks
    private WifiService service;

    private WifiRequest sampleRequest() {
        WifiRequest request = new WifiRequest();
        request.setSsid("INIA-CORP");
        request.setClave("clave-secreta");
        request.setUbicacion("Edificio Principal - Todos los pisos");
        request.setTipo("WPA2-Enterprise");
        request.setEstado("Activo");
        return request;
    }

    @Test
    void findAll_withoutSearch_returnsAll() {
        when(repository.findAll()).thenReturn(List.of(new Wifi(1L, "INIA-CORP", "clave-secreta", "Edificio Principal", "WPA2-Enterprise", "Activo")));

        List<Wifi> result = service.findAll(null);

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
    void create_savesWifiFromRequest() {
        when(repository.save(any(Wifi.class))).thenAnswer(inv -> inv.getArgument(0));

        Wifi result = service.create(sampleRequest());

        assertThat(result.getSsid()).isEqualTo("INIA-CORP");
    }

    @Test
    void delete_removesExistingWifi() {
        Wifi existing = new Wifi(1L, "INIA-CORP", "clave-secreta", "Edificio Principal", "WPA2-Enterprise", "Activo");
        when(repository.findById(1L)).thenReturn(Optional.of(existing));

        service.delete(1L);

        verify(repository).delete(existing);
    }
}
