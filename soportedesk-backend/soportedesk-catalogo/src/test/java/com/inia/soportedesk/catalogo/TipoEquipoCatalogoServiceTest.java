package com.inia.soportedesk.catalogo;

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
class TipoEquipoCatalogoServiceTest {

    @Mock
    private TipoEquipoCatalogoRepository repository;

    @InjectMocks
    private TipoEquipoCatalogoService service;

    private TipoEquipoCatalogo sample() {
        TipoEquipoCatalogo t = new TipoEquipoCatalogo();
        t.setId(1L);
        t.setGlpiValor("PC");
        t.setTipoNormalizado("Desktop");
        t.setActivo(true);
        return t;
    }

    @Test
    void findAll_returnsOnlyActiveEntries() {
        when(repository.findByActivoTrue()).thenReturn(List.of(sample()));
        assertThat(service.findAll()).hasSize(1);
        verify(repository).findByActivoTrue();
    }

    @Test
    void create_savesFromRequest() {
        TipoEquipoCatalogoRequest req = new TipoEquipoCatalogoRequest();
        req.setGlpiValor("Notebook");
        req.setTipoNormalizado("Laptop");
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        TipoEquipoCatalogo result = service.create(req);

        assertThat(result.getGlpiValor()).isEqualTo("Notebook");
        assertThat(result.getTipoNormalizado()).isEqualTo("Laptop");
        assertThat(result.isActivo()).isTrue();
    }

    @Test
    void delete_setsActivoFalse() {
        TipoEquipoCatalogo entity = sample();
        when(repository.findById(1L)).thenReturn(Optional.of(entity));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.delete(1L);

        assertThat(entity.isActivo()).isFalse();
        verify(repository).save(entity);
    }

    @Test
    void delete_whenNotFound_throws() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.delete(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
