package com.inia.soportedesk.glpi;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GlpiTecladoServiceTest {

    @Mock private GlpiComputerTecladoRepository repository;
    @InjectMocks private GlpiTecladoService service;

    @Test
    void guardar_sinTecladoPrevio_creaUnoNuevo() {
        when(repository.findFirstByItemsIdAndItemtype(42L, "Computer")).thenReturn(Optional.empty());
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.guardar(42L, " HP ", " KB-100 ", " SN-001 ", " 202405000 ", " 74089500.0001 ");

        ArgumentCaptor<GlpiComputerTeclado> captor = ArgumentCaptor.forClass(GlpiComputerTeclado.class);
        verify(repository).save(captor.capture());
        GlpiComputerTeclado saved = captor.getValue();
        assertThat(saved.getItemsId()).isEqualTo(42L);
        assertThat(saved.getItemtype()).isEqualTo("Computer");
        assertThat(saved.getPluginFieldsContainersId()).isEqualTo(6);
        assertThat(saved.getEntitiesId()).isEqualTo(0);
        assertThat(saved.getMarca()).isEqualTo("HP");
        assertThat(saved.getModelo()).isEqualTo("KB-100");
        assertThat(saved.getNumeroSerie()).isEqualTo("SN-001");
        assertThat(saved.getCodigoInventario()).isEqualTo("202405000");
        assertThat(saved.getCodigoPatrimonial()).isEqualTo("74089500.0001");
    }

    @Test
    void guardar_conTecladoExistente_loActualizaEnVezDeFallar() {
        GlpiComputerTeclado existente = new GlpiComputerTeclado();
        existente.setId(9L);
        existente.setItemsId(42L);
        existente.setMarca("HP-VIEJA");
        existente.setModelo("KB-OLD");
        existente.setNumeroSerie("SN-OLD");
        when(repository.findFirstByItemsIdAndItemtype(42L, "Computer")).thenReturn(Optional.of(existente));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.guardar(42L, "Logitech", "K120", "SN-NEW", null, null);

        ArgumentCaptor<GlpiComputerTeclado> captor = ArgumentCaptor.forClass(GlpiComputerTeclado.class);
        verify(repository).save(captor.capture());
        GlpiComputerTeclado saved = captor.getValue();
        assertThat(saved.getId()).isEqualTo(9L);
        assertThat(saved.getMarca()).isEqualTo("Logitech");
        assertThat(saved.getModelo()).isEqualTo("K120");
        assertThat(saved.getNumeroSerie()).isEqualTo("SN-NEW");
    }

    @Test
    void guardar_faltaCampoObligatorio_throws() {
        assertThatThrownBy(() -> service.guardar(42L, "HP", "  ", "SN-001", null, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Marca, modelo y número de serie del teclado son obligatorios.");
        verify(repository, never()).save(any());
        verify(repository, never()).findFirstByItemsIdAndItemtype(any(), any());
    }

    @Test
    void guardar_codigosOpcionalesEnBlanco_seGuardanComoNull() {
        when(repository.findFirstByItemsIdAndItemtype(7L, "Computer")).thenReturn(Optional.empty());
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.guardar(7L, "HP", "KB-100", "SN-002", "  ", null);

        ArgumentCaptor<GlpiComputerTeclado> captor = ArgumentCaptor.forClass(GlpiComputerTeclado.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().getCodigoInventario()).isNull();
        assertThat(captor.getValue().getCodigoPatrimonial()).isNull();
    }
}
