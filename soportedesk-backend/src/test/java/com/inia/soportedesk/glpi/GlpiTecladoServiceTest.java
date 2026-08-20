package com.inia.soportedesk.glpi;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GlpiTecladoServiceTest {

    @Mock private GlpiComputerTecladoRepository repository;
    @InjectMocks private GlpiTecladoService service;

    @Test
    void crear_savesTecladoWithFixedContainerAndEntity() {
        when(repository.existsByItemsIdAndItemtype(42L, "Computer")).thenReturn(false);
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.crear(42L, " HP ", " KB-100 ", " SN-001 ", " 202405000 ", " 74089500.0001 ");

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
    void crear_yaExiste_throws() {
        when(repository.existsByItemsIdAndItemtype(42L, "Computer")).thenReturn(true);

        assertThatThrownBy(() -> service.crear(42L, "HP", "KB-100", "SN-001", null, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Este equipo ya tiene un teclado registrado.");
        verify(repository, never()).save(any());
    }

    @Test
    void crear_faltaCampoObligatorio_throws() {
        when(repository.existsByItemsIdAndItemtype(42L, "Computer")).thenReturn(false);

        assertThatThrownBy(() -> service.crear(42L, "HP", "  ", "SN-001", null, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Marca, modelo y número de serie del teclado son obligatorios.");
        verify(repository, never()).save(any());
    }

    @Test
    void crear_codigosOpcionalesEnBlanco_seGuardanComoNull() {
        when(repository.existsByItemsIdAndItemtype(7L, "Computer")).thenReturn(false);
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.crear(7L, "HP", "KB-100", "SN-002", "  ", null);

        ArgumentCaptor<GlpiComputerTeclado> captor = ArgumentCaptor.forClass(GlpiComputerTeclado.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().getCodigoInventario()).isNull();
        assertThat(captor.getValue().getCodigoPatrimonial()).isNull();
    }
}
