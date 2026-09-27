package com.inia.soportedesk.glpi;

import com.inia.soportedesk.exception.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GlpiComputerServiceTest {

    @Mock private GlpiComputerRepository repository;
    @InjectMocks private GlpiComputerService service;

    @Test
    void marcarEliminado_setsIsDeletedFlag() {
        GlpiComputer equipo = new GlpiComputer();
        equipo.setId(42L);
        equipo.setIsDeleted(0);
        when(repository.findById(42L)).thenReturn(Optional.of(equipo));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.marcarEliminado(42L);

        assertThat(equipo.getIsDeleted()).isEqualTo(1);
        verify(repository).save(equipo);
    }

    @Test
    void marcarEliminado_computerNotFound_throwsNotFound() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.marcarEliminado(99L))
                .isInstanceOf(ResourceNotFoundException.class);
        verify(repository, never()).save(any());
    }

    @Test
    void marcarEliminado_alreadyDeleted_throwsIllegalArgument() {
        GlpiComputer equipo = new GlpiComputer();
        equipo.setId(7L);
        equipo.setIsDeleted(1);
        when(repository.findById(7L)).thenReturn(Optional.of(equipo));

        assertThatThrownBy(() -> service.marcarEliminado(7L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Este equipo ya está dado de baja.");
        verify(repository, never()).save(any());
    }
}
