package com.inia.soportedesk.equipos.enrichment;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EquipoEnrichmentServiceTest {

    @Mock private EquipoEnrichmentRepository repository;
    @Mock private EquipoEnrichmentHistorialRepository historialRepository;
    @InjectMocks private EquipoEnrichmentService service;

    @Test
    void save_newRecord_createsEntityWithComputerId() {
        when(repository.findByComputerId(42L)).thenReturn(Optional.empty());
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        EquipoEnrichmentDto dto = new EquipoEnrichmentDto();
        dto.setCodigoPatrimonial("PAT-001");
        dto.setEstadoDepuracion("ACTIVO");

        EquipoEnrichmentDto result = service.save(42L, dto, "admin");

        assertThat(result.getCodigoPatrimonial()).isEqualTo("PAT-001");
        assertThat(result.getRevisadoPor()).isEqualTo("admin");
        assertThat(result.getFechaRevision()).isNotNull();
    }

    @Test
    void save_changedField_recordsHistorialEntry() {
        EquipoEnrichment existing = new EquipoEnrichment();
        existing.setComputerId(10L);
        existing.setCodigoPatrimonial("PAT-OLD");
        when(repository.findByComputerId(10L)).thenReturn(Optional.of(existing));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        EquipoEnrichmentDto dto = new EquipoEnrichmentDto();
        dto.setCodigoPatrimonial("PAT-NEW");

        service.save(10L, dto, "gvivanco");

        ArgumentCaptor<EquipoEnrichmentHistorial> captor = ArgumentCaptor.forClass(EquipoEnrichmentHistorial.class);
        verify(historialRepository).save(captor.capture());
        EquipoEnrichmentHistorial recorded = captor.getValue();
        assertThat(recorded.getCampo()).isEqualTo("codigo_patrimonial");
        assertThat(recorded.getValorAnterior()).isEqualTo("PAT-OLD");
        assertThat(recorded.getValorNuevo()).isEqualTo("PAT-NEW");
        assertThat(recorded.getModificadoPor()).isEqualTo("gvivanco");
    }

    @Test
    void save_unchangedField_doesNotRecordHistorial() {
        EquipoEnrichment existing = new EquipoEnrichment();
        existing.setComputerId(10L);
        existing.setCodigoPatrimonial("PAT-SAME");
        when(repository.findByComputerId(10L)).thenReturn(Optional.of(existing));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        EquipoEnrichmentDto dto = new EquipoEnrichmentDto();
        dto.setCodigoPatrimonial("PAT-SAME");

        service.save(10L, dto, "admin");

        verify(historialRepository, never()).save(any());
    }

    @Test
    void getHistorial_mapsToDto() {
        EquipoEnrichmentHistorial h = new EquipoEnrichmentHistorial();
        h.setCampo("estado_depuracion");
        h.setValorAnterior(null);
        h.setValorNuevo("ACTIVO");
        h.setModificadoPor("admin");
        h.setFechaModificacion(java.time.LocalDateTime.now());
        when(historialRepository.findByComputerIdOrderByFechaModificacionDesc(5L)).thenReturn(List.of(h));

        List<HistorialItemDto> result = service.getHistorial(5L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).campo()).isEqualTo("estado_depuracion");
    }
}
