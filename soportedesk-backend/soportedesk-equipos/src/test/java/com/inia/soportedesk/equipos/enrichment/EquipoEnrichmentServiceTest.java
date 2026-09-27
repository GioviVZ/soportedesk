package com.inia.soportedesk.equipos.enrichment;

import com.inia.soportedesk.catalogo.Dependencia;
import com.inia.soportedesk.catalogo.DependenciaRepository;
import com.inia.soportedesk.catalogo.Sede;
import com.inia.soportedesk.catalogo.SedeRepository;
import com.inia.soportedesk.catalogo.Subdependencia;
import com.inia.soportedesk.catalogo.SubdependenciaRepository;
import com.inia.soportedesk.glpi.GlpiComputerService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
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
    @Mock private GlpiComputerService glpiComputerService;
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
    void save_duplicateInternalCode_isRejectedBeforePersisting() {
        when(repository.existsByCodigoInternoOverrideIgnoreCaseAndComputerIdNot("INT-001", 42L)).thenReturn(true);
        EquipoEnrichmentDto dto = new EquipoEnrichmentDto();
        dto.setCodigoInternoOverride(" INT-001 ");

        assertThatThrownBy(() -> service.save(42L, dto, "admin"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("El código interno INT-001 ya está asignado a otro equipo.");
        verify(repository, never()).save(any());
    }

    @Test
    void save_duplicatePatrimonialCode_isRejectedBeforePersisting() {
        when(repository.existsByCodigoPatrimonialIgnoreCaseAndComputerIdNot("PAT-001", 42L)).thenReturn(true);
        EquipoEnrichmentDto dto = new EquipoEnrichmentDto();
        dto.setCodigoPatrimonial(" PAT-001 ");

        assertThatThrownBy(() -> service.save(42L, dto, "admin"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("El código patrimonial PAT-001 ya está asignado a otro equipo.");
        verify(repository, never()).save(any());
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

    @Test
    void darDeBaja_marksGlpiDeletedAndRecordsMotivoLocally() {
        when(repository.findByComputerId(50L)).thenReturn(Optional.empty());
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        EquipoEnrichmentDto result = service.darDeBaja(50L, "  Equipo retirado físicamente  ", "gvivanco");

        verify(glpiComputerService).marcarEliminado(50L);
        assertThat(result.getEstadoDepuracion()).isEqualTo("BAJA");
        assertThat(result.getObservaciones()).isEqualTo("Equipo retirado físicamente");
        assertThat(result.getRevisadoPor()).isEqualTo("gvivanco");
    }

    @Test
    void darDeBaja_preservesExistingFieldsNotRelatedToBaja() {
        EquipoEnrichment existing = new EquipoEnrichment();
        existing.setComputerId(51L);
        existing.setCodigoPatrimonial("PAT-051");
        when(repository.findByComputerId(51L)).thenReturn(Optional.of(existing));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        EquipoEnrichmentDto result = service.darDeBaja(51L, "Registro duplicado", "admin");

        assertThat(result.getCodigoPatrimonial()).isEqualTo("PAT-051");
        assertThat(result.getEstadoDepuracion()).isEqualTo("BAJA");
    }

    @Test
    void darDeBaja_blankMotivo_throwsAndNeverTouchesGlpi() {
        assertThatThrownBy(() -> service.darDeBaja(52L, "   ", "admin"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Debes indicar un motivo para dar de baja el equipo.");
        verifyNoInteractions(glpiComputerService);
        verify(repository, never()).save(any());
    }

    @Test
    void save_monitorOverrides_persistsAndReturnsFields() {
        when(repository.findByComputerId(60L)).thenReturn(Optional.empty());
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        EquipoEnrichmentDto dto = new EquipoEnrichmentDto();
        dto.setMonitorFabricanteOverride("Samsung");
        dto.setMonitorModeloOverride("S24F350");
        dto.setMonitorNumeroSerieOverride("MON-SN-001");
        dto.setMonitorCodigoPatrimonial("74089500.2000");
        dto.setMonitorCodigoInternoOverride("202405999");

        EquipoEnrichmentDto result = service.save(60L, dto, "admin");

        assertThat(result.getMonitorFabricanteOverride()).isEqualTo("Samsung");
        assertThat(result.getMonitorModeloOverride()).isEqualTo("S24F350");
        assertThat(result.getMonitorNumeroSerieOverride()).isEqualTo("MON-SN-001");
        assertThat(result.getMonitorCodigoPatrimonial()).isEqualTo("74089500.2000");
        assertThat(result.getMonitorCodigoInternoOverride()).isEqualTo("202405999");
    }

    @Test
    void save_duplicateMonitorCodigoInterno_isRejected() {
        when(repository.existsByMonitorCodigoInternoOverrideIgnoreCaseAndComputerIdNot("MON-001", 61L)).thenReturn(true);
        EquipoEnrichmentDto dto = new EquipoEnrichmentDto();
        dto.setMonitorCodigoInternoOverride(" MON-001 ");

        assertThatThrownBy(() -> service.save(61L, dto, "admin"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("El código de inventario del monitor MON-001 ya está asignado a otro equipo.");
        verify(repository, never()).save(any());
    }

    @Test
    void save_duplicateMonitorCodigoPatrimonial_isRejected() {
        when(repository.existsByMonitorCodigoPatrimonialIgnoreCaseAndComputerIdNot("PAT-MON-001", 62L)).thenReturn(true);
        EquipoEnrichmentDto dto = new EquipoEnrichmentDto();
        dto.setMonitorCodigoPatrimonial(" PAT-MON-001 ");

        assertThatThrownBy(() -> service.save(62L, dto, "admin"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("El código patrimonial del monitor PAT-MON-001 ya está asignado a otro equipo.");
        verify(repository, never()).save(any());
    }

    @Test
    void save_monitor2Overrides_persistsAndReturnsFields() {
        when(repository.findByComputerId(63L)).thenReturn(Optional.empty());
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        EquipoEnrichmentDto dto = new EquipoEnrichmentDto();
        dto.setMonitor2FabricanteOverride("LG");
        dto.setMonitor2ModeloOverride("24MK430H");
        dto.setMonitor2NumeroSerieOverride("MON2-SN-001");
        dto.setMonitor2CodigoPatrimonial("74089500.3000");
        dto.setMonitor2CodigoInternoOverride("202405998");

        EquipoEnrichmentDto result = service.save(63L, dto, "admin");

        assertThat(result.getMonitor2FabricanteOverride()).isEqualTo("LG");
        assertThat(result.getMonitor2ModeloOverride()).isEqualTo("24MK430H");
        assertThat(result.getMonitor2NumeroSerieOverride()).isEqualTo("MON2-SN-001");
        assertThat(result.getMonitor2CodigoPatrimonial()).isEqualTo("74089500.3000");
        assertThat(result.getMonitor2CodigoInternoOverride()).isEqualTo("202405998");
    }

    @Test
    void save_duplicateMonitor2CodigoInterno_isRejected() {
        when(repository.existsByMonitor2CodigoInternoOverrideIgnoreCaseAndComputerIdNot("MON2-001", 64L)).thenReturn(true);
        EquipoEnrichmentDto dto = new EquipoEnrichmentDto();
        dto.setMonitor2CodigoInternoOverride(" MON2-001 ");

        assertThatThrownBy(() -> service.save(64L, dto, "admin"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("El código de inventario del segundo monitor MON2-001 ya está asignado a otro equipo.");
        verify(repository, never()).save(any());
    }

    @Test
    void save_duplicateMonitor2CodigoPatrimonial_isRejected() {
        when(repository.existsByMonitor2CodigoPatrimonialIgnoreCaseAndComputerIdNot("PAT-MON2-001", 65L)).thenReturn(true);
        EquipoEnrichmentDto dto = new EquipoEnrichmentDto();
        dto.setMonitor2CodigoPatrimonial(" PAT-MON2-001 ");

        assertThatThrownBy(() -> service.save(65L, dto, "admin"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("El código patrimonial del segundo monitor PAT-MON2-001 ya está asignado a otro equipo.");
        verify(repository, never()).save(any());
    }

    @Test
    void darDeBaja_glpiRejectsChange_localRecordIsNotTouched() {
        doThrow(new IllegalArgumentException("Este equipo ya está dado de baja."))
                .when(glpiComputerService).marcarEliminado(53L);

        assertThatThrownBy(() -> service.darDeBaja(53L, "Registro duplicado", "admin"))
                .isInstanceOf(IllegalArgumentException.class);
        verify(repository, never()).save(any());
    }
}
