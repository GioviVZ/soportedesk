package com.inia.soportedesk.equipos.enrichment;

import com.inia.soportedesk.catalogo.Dependencia;
import com.inia.soportedesk.catalogo.DependenciaRepository;
import com.inia.soportedesk.catalogo.Sede;
import com.inia.soportedesk.catalogo.SedeRepository;
import com.inia.soportedesk.catalogo.Subdependencia;
import com.inia.soportedesk.catalogo.SubdependenciaRepository;
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
    @Mock private SedeRepository sedeRepository;
    @Mock private DependenciaRepository dependenciaRepository;
    @Mock private SubdependenciaRepository subdependenciaRepository;
    @Mock private EquipoAsignacionSyncService asignacionSyncService;
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

    @Test
    void save_withSedeDependenciaSubdependencia_resolvesEntitiesAndReturnsIdsAndNombres() {
        when(repository.findByComputerId(20L)).thenReturn(Optional.empty());
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Sede sede = new Sede();
        sede.setId(1L);
        sede.setNombre("SEDE CENTRAL");
        Dependencia dependencia = new Dependencia();
        dependencia.setId(2L);
        dependencia.setNombre("UTI");
        Subdependencia subdependencia = new Subdependencia();
        subdependencia.setId(3L);
        subdependencia.setNombre("Soporte");

        when(sedeRepository.findById(1L)).thenReturn(Optional.of(sede));
        when(dependenciaRepository.findById(2L)).thenReturn(Optional.of(dependencia));
        when(subdependenciaRepository.findById(3L)).thenReturn(Optional.of(subdependencia));

        EquipoEnrichmentDto dto = new EquipoEnrichmentDto();
        dto.setSedeId(1L);
        dto.setDependenciaId(2L);
        dto.setSubdependenciaId(3L);
        dto.setNumeroSerieOverride("SN-001");

        EquipoEnrichmentDto result = service.save(20L, dto, "admin");

        assertThat(result.getSedeId()).isEqualTo(1L);
        assertThat(result.getSedeNombre()).isEqualTo("SEDE CENTRAL");
        assertThat(result.getDependenciaId()).isEqualTo(2L);
        assertThat(result.getDependenciaNombre()).isEqualTo("UTI");
        assertThat(result.getSubdependenciaId()).isEqualTo(3L);
        assertThat(result.getSubdependenciaNombre()).isEqualTo("Soporte");
        assertThat(result.getNumeroSerieOverride()).isEqualTo("SN-001");
    }

    @Test
    void save_sedeChanged_recordsHistorialWithNombreNotId() {
        Sede oldSede = new Sede();
        oldSede.setId(1L);
        oldSede.setNombre("SEDE CENTRAL");
        EquipoEnrichment existing = new EquipoEnrichment();
        existing.setComputerId(21L);
        existing.setSede(oldSede);
        when(repository.findByComputerId(21L)).thenReturn(Optional.of(existing));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Sede newSede = new Sede();
        newSede.setId(2L);
        newSede.setNombre("EEA ANDENES");
        when(sedeRepository.findById(2L)).thenReturn(Optional.of(newSede));

        EquipoEnrichmentDto dto = new EquipoEnrichmentDto();
        dto.setSedeId(2L);

        service.save(21L, dto, "admin");

        ArgumentCaptor<EquipoEnrichmentHistorial> captor = ArgumentCaptor.forClass(EquipoEnrichmentHistorial.class);
        verify(historialRepository).save(captor.capture());
        EquipoEnrichmentHistorial recorded = captor.getValue();
        assertThat(recorded.getCampo()).isEqualTo("sede");
        assertThat(recorded.getValorAnterior()).isEqualTo("SEDE CENTRAL");
        assertThat(recorded.getValorNuevo()).isEqualTo("EEA ANDENES");
    }

    @Test
    void save_numeroSerieOverrideChanged_recordsHistorial() {
        EquipoEnrichment existing = new EquipoEnrichment();
        existing.setComputerId(22L);
        existing.setNumeroSerieOverride("SN-OLD");
        when(repository.findByComputerId(22L)).thenReturn(Optional.of(existing));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        EquipoEnrichmentDto dto = new EquipoEnrichmentDto();
        dto.setNumeroSerieOverride("SN-NEW");

        service.save(22L, dto, "admin");

        ArgumentCaptor<EquipoEnrichmentHistorial> captor = ArgumentCaptor.forClass(EquipoEnrichmentHistorial.class);
        verify(historialRepository).save(captor.capture());
        assertThat(captor.getValue().getCampo()).isEqualTo("numero_serie_override");
        assertThat(captor.getValue().getValorAnterior()).isEqualTo("SN-OLD");
        assertThat(captor.getValue().getValorNuevo()).isEqualTo("SN-NEW");
    }
}
