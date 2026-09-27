package com.inia.soportedesk.equipos.enrichment;

import com.inia.soportedesk.catalogo.Dependencia;
import com.inia.soportedesk.catalogo.DependenciaRepository;
import com.inia.soportedesk.catalogo.Sede;
import com.inia.soportedesk.catalogo.SedeRepository;
import com.inia.soportedesk.catalogo.Subdependencia;
import com.inia.soportedesk.catalogo.SubdependenciaRepository;
import com.inia.soportedesk.glpi.GlpiComputerService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class EquipoEnrichmentService {

    private static final String ESTADO_BAJA = "BAJA";

    private final EquipoEnrichmentRepository repository;
    private final EquipoEnrichmentHistorialRepository historialRepository;
    private final SedeRepository sedeRepository;
    private final DependenciaRepository dependenciaRepository;
    private final SubdependenciaRepository subdependenciaRepository;
    private final EquipoAsignacionSyncService asignacionSyncService;
    private final GlpiComputerService glpiComputerService;

    public Optional<EquipoEnrichmentDto> findByComputerId(Long computerId) {
        return repository.findByComputerId(computerId).map(this::toDto);
    }

    @Transactional
    public EquipoEnrichmentDto save(Long computerId, EquipoEnrichmentDto dto, String username) {
        normalizeAndValidateCodes(computerId, dto);
        EquipoEnrichment entity = repository.findByComputerId(computerId).orElseGet(() -> {
            EquipoEnrichment e = new EquipoEnrichment();
            e.setComputerId(computerId);
            return e;
        });

        Sede sede = dto.getSedeId() != null ? sedeRepository.findById(dto.getSedeId()).orElse(null) : null;
        Dependencia dependencia = dto.getDependenciaId() != null
                ? dependenciaRepository.findById(dto.getDependenciaId()).orElse(null) : null;
        Subdependencia subdependencia = dto.getSubdependenciaId() != null
                ? subdependenciaRepository.findById(dto.getSubdependenciaId()).orElse(null) : null;

        recordChange(computerId, "tipo_override",         entity.getTipoOverride(),         dto.getTipoOverride(),         username);
        recordChange(computerId, "fabricante_override",   entity.getFabricanteOverride(),   dto.getFabricanteOverride(),   username);
        recordChange(computerId, "modelo_override",       entity.getModeloOverride(),       dto.getModeloOverride(),       username);
        recordChange(computerId, "codigo_patrimonial",    entity.getCodigoPatrimonial(),    dto.getCodigoPatrimonial(),    username);
        recordChange(computerId, "codigo_interno", entity.getCodigoInternoOverride(), dto.getCodigoInternoOverride(), username);
        recordChange(computerId, "nombre_asignado", entity.getNombreAsignadoOverride(), dto.getNombreAsignadoOverride(), username);
        recordChange(computerId, "usuario_asignado", entity.getUsuarioAsignadoOverride(), dto.getUsuarioAsignadoOverride(), username);
        recordChange(computerId, "estado_depuracion",     entity.getEstadoDepuracion(),     dto.getEstadoDepuracion(),     username);
        recordChange(computerId, "observaciones",         entity.getObservaciones(),        dto.getObservaciones(),       username);
        recordChange(computerId, "numero_serie_override", entity.getNumeroSerieOverride(),  dto.getNumeroSerieOverride(), username);
        recordChange(computerId, "monitor_fabricante_override", entity.getMonitorFabricanteOverride(), dto.getMonitorFabricanteOverride(), username);
        recordChange(computerId, "monitor_modelo_override", entity.getMonitorModeloOverride(), dto.getMonitorModeloOverride(), username);
        recordChange(computerId, "monitor_numero_serie_override", entity.getMonitorNumeroSerieOverride(), dto.getMonitorNumeroSerieOverride(), username);
        recordChange(computerId, "monitor_codigo_patrimonial", entity.getMonitorCodigoPatrimonial(), dto.getMonitorCodigoPatrimonial(), username);
        recordChange(computerId, "monitor_codigo_interno_override", entity.getMonitorCodigoInternoOverride(), dto.getMonitorCodigoInternoOverride(), username);
        recordChange(computerId, "monitor2_fabricante_override", entity.getMonitor2FabricanteOverride(), dto.getMonitor2FabricanteOverride(), username);
        recordChange(computerId, "monitor2_modelo_override", entity.getMonitor2ModeloOverride(), dto.getMonitor2ModeloOverride(), username);
        recordChange(computerId, "monitor2_numero_serie_override", entity.getMonitor2NumeroSerieOverride(), dto.getMonitor2NumeroSerieOverride(), username);
        recordChange(computerId, "monitor2_codigo_patrimonial", entity.getMonitor2CodigoPatrimonial(), dto.getMonitor2CodigoPatrimonial(), username);
        recordChange(computerId, "monitor2_codigo_interno_override", entity.getMonitor2CodigoInternoOverride(), dto.getMonitor2CodigoInternoOverride(), username);
        recordChange(computerId, "sede",           nombreDe(entity.getSede()),           nombreDe(sede),           username);
        recordChange(computerId, "dependencia",    nombreDe(entity.getDependencia()),    nombreDe(dependencia),    username);
        recordChange(computerId, "subdependencia", nombreDe(entity.getSubdependencia()), nombreDe(subdependencia), username);

        entity.setTipoOverride(dto.getTipoOverride());
        entity.setFabricanteOverride(dto.getFabricanteOverride());
        entity.setModeloOverride(dto.getModeloOverride());
        entity.setCodigoPatrimonial(dto.getCodigoPatrimonial());
        entity.setCodigoInternoOverride(dto.getCodigoInternoOverride());
        entity.setNombreAsignadoOverride(dto.getNombreAsignadoOverride());
        entity.setUsuarioAsignadoOverride(dto.getUsuarioAsignadoOverride());
        entity.setEstadoDepuracion(dto.getEstadoDepuracion());
        entity.setObservaciones(dto.getObservaciones());
        entity.setNumeroSerieOverride(dto.getNumeroSerieOverride());
        entity.setMonitorFabricanteOverride(dto.getMonitorFabricanteOverride());
        entity.setMonitorModeloOverride(dto.getMonitorModeloOverride());
        entity.setMonitorNumeroSerieOverride(dto.getMonitorNumeroSerieOverride());
        entity.setMonitorCodigoPatrimonial(dto.getMonitorCodigoPatrimonial());
        entity.setMonitorCodigoInternoOverride(dto.getMonitorCodigoInternoOverride());
        entity.setMonitor2FabricanteOverride(dto.getMonitor2FabricanteOverride());
        entity.setMonitor2ModeloOverride(dto.getMonitor2ModeloOverride());
        entity.setMonitor2NumeroSerieOverride(dto.getMonitor2NumeroSerieOverride());
        entity.setMonitor2CodigoPatrimonial(dto.getMonitor2CodigoPatrimonial());
        entity.setMonitor2CodigoInternoOverride(dto.getMonitor2CodigoInternoOverride());
        entity.setSede(sede);
        entity.setDependencia(dependencia);
        entity.setSubdependencia(subdependencia);
        entity.setRevisadoPor(username);
        entity.setFechaRevision(LocalDateTime.now());

        EquipoEnrichment saved = repository.save(entity);
        repository.flush();
        asignacionSyncService.sync(saved);
        return toDto(saved);
    }

    public EquipoEnrichmentDto darDeBaja(Long computerId, String motivo, String username) {
        String motivoNormalizado = trimToNull(motivo);
        if (motivoNormalizado == null) {
            throw new IllegalArgumentException("Debes indicar un motivo para dar de baja el equipo.");
        }

        glpiComputerService.marcarEliminado(computerId);

        EquipoEnrichmentDto dto = repository.findByComputerId(computerId).map(this::toDto).orElseGet(EquipoEnrichmentDto::new);
        dto.setEstadoDepuracion(ESTADO_BAJA);
        dto.setObservaciones(motivoNormalizado);
        return save(computerId, dto, username);
    }

    private void normalizeAndValidateCodes(Long computerId, EquipoEnrichmentDto dto) {
        String codigoInterno = trimToNull(dto.getCodigoInternoOverride());
        String codigoPatrimonial = trimToNull(dto.getCodigoPatrimonial());
        dto.setCodigoInternoOverride(codigoInterno);
        dto.setCodigoPatrimonial(codigoPatrimonial);

        if (codigoInterno != null
                && repository.existsByCodigoInternoOverrideIgnoreCaseAndComputerIdNot(codigoInterno, computerId)) {
            throw new IllegalArgumentException("El código interno " + codigoInterno + " ya está asignado a otro equipo.");
        }
        if (codigoPatrimonial != null
                && repository.existsByCodigoPatrimonialIgnoreCaseAndComputerIdNot(codigoPatrimonial, computerId)) {
            throw new IllegalArgumentException("El código patrimonial " + codigoPatrimonial + " ya está asignado a otro equipo.");
        }

        String monitorCodigoInterno = trimToNull(dto.getMonitorCodigoInternoOverride());
        String monitorCodigoPatrimonial = trimToNull(dto.getMonitorCodigoPatrimonial());
        dto.setMonitorCodigoInternoOverride(monitorCodigoInterno);
        dto.setMonitorCodigoPatrimonial(monitorCodigoPatrimonial);

        if (monitorCodigoInterno != null
                && repository.existsByMonitorCodigoInternoOverrideIgnoreCaseAndComputerIdNot(monitorCodigoInterno, computerId)) {
            throw new IllegalArgumentException("El código de inventario del monitor " + monitorCodigoInterno + " ya está asignado a otro equipo.");
        }
        if (monitorCodigoPatrimonial != null
                && repository.existsByMonitorCodigoPatrimonialIgnoreCaseAndComputerIdNot(monitorCodigoPatrimonial, computerId)) {
            throw new IllegalArgumentException("El código patrimonial del monitor " + monitorCodigoPatrimonial + " ya está asignado a otro equipo.");
        }

        String monitor2CodigoInterno = trimToNull(dto.getMonitor2CodigoInternoOverride());
        String monitor2CodigoPatrimonial = trimToNull(dto.getMonitor2CodigoPatrimonial());
        dto.setMonitor2CodigoInternoOverride(monitor2CodigoInterno);
        dto.setMonitor2CodigoPatrimonial(monitor2CodigoPatrimonial);

        if (monitor2CodigoInterno != null
                && repository.existsByMonitor2CodigoInternoOverrideIgnoreCaseAndComputerIdNot(monitor2CodigoInterno, computerId)) {
            throw new IllegalArgumentException("El código de inventario del segundo monitor " + monitor2CodigoInterno + " ya está asignado a otro equipo.");
        }
        if (monitor2CodigoPatrimonial != null
                && repository.existsByMonitor2CodigoPatrimonialIgnoreCaseAndComputerIdNot(monitor2CodigoPatrimonial, computerId)) {
            throw new IllegalArgumentException("El código patrimonial del segundo monitor " + monitor2CodigoPatrimonial + " ya está asignado a otro equipo.");
        }
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) return null;
        return value.trim();
    }

    public List<HistorialItemDto> getHistorial(Long computerId) {
        return historialRepository.findByComputerIdOrderByFechaModificacionDesc(computerId)
                .stream()
                .map(h -> new HistorialItemDto(
                        h.getCampo(), h.getValorAnterior(), h.getValorNuevo(),
                        h.getModificadoPor(), h.getFechaModificacion()))
                .toList();
    }

    public EquipoEnrichmentDto toDto(EquipoEnrichment entity) {
        EquipoEnrichmentDto dto = new EquipoEnrichmentDto();
        dto.setTipoOverride(entity.getTipoOverride());
        dto.setFabricanteOverride(entity.getFabricanteOverride());
        dto.setModeloOverride(entity.getModeloOverride());
        dto.setCodigoPatrimonial(entity.getCodigoPatrimonial());
        dto.setCodigoInternoOverride(entity.getCodigoInternoOverride());
        dto.setNombreAsignadoOverride(entity.getNombreAsignadoOverride());
        dto.setUsuarioAsignadoOverride(entity.getUsuarioAsignadoOverride());
        dto.setEstadoDepuracion(entity.getEstadoDepuracion());
        dto.setObservaciones(entity.getObservaciones());
        dto.setRevisadoPor(entity.getRevisadoPor());
        dto.setFechaRevision(entity.getFechaRevision());
        dto.setNumeroSerieOverride(entity.getNumeroSerieOverride());
        dto.setMonitorFabricanteOverride(entity.getMonitorFabricanteOverride());
        dto.setMonitorModeloOverride(entity.getMonitorModeloOverride());
        dto.setMonitorNumeroSerieOverride(entity.getMonitorNumeroSerieOverride());
        dto.setMonitorCodigoPatrimonial(entity.getMonitorCodigoPatrimonial());
        dto.setMonitorCodigoInternoOverride(entity.getMonitorCodigoInternoOverride());
        dto.setMonitor2FabricanteOverride(entity.getMonitor2FabricanteOverride());
        dto.setMonitor2ModeloOverride(entity.getMonitor2ModeloOverride());
        dto.setMonitor2NumeroSerieOverride(entity.getMonitor2NumeroSerieOverride());
        dto.setMonitor2CodigoPatrimonial(entity.getMonitor2CodigoPatrimonial());
        dto.setMonitor2CodigoInternoOverride(entity.getMonitor2CodigoInternoOverride());
        if (entity.getSede() != null) {
            dto.setSedeId(entity.getSede().getId());
            dto.setSedeNombre(entity.getSede().getNombre());
        }
        if (entity.getDependencia() != null) {
            dto.setDependenciaId(entity.getDependencia().getId());
            dto.setDependenciaNombre(entity.getDependencia().getNombre());
        }
        if (entity.getSubdependencia() != null) {
            dto.setSubdependenciaId(entity.getSubdependencia().getId());
            dto.setSubdependenciaNombre(entity.getSubdependencia().getNombre());
        }
        return dto;
    }

    private void recordChange(Long computerId, String campo, String anterior, String nuevo, String username) {
        if (!Objects.equals(anterior, nuevo)) {
            EquipoEnrichmentHistorial h = new EquipoEnrichmentHistorial();
            h.setComputerId(computerId);
            h.setCampo(campo);
            h.setValorAnterior(anterior);
            h.setValorNuevo(nuevo);
            h.setModificadoPor(username);
            h.setFechaModificacion(LocalDateTime.now());
            historialRepository.save(h);
        }
    }

    private String nombreDe(Sede sede) {
        return sede != null ? sede.getNombre() : null;
    }

    private String nombreDe(Dependencia dependencia) {
        return dependencia != null ? dependencia.getNombre() : null;
    }

    private String nombreDe(Subdependencia subdependencia) {
        return subdependencia != null ? subdependencia.getNombre() : null;
    }
}
