package com.inia.soportedesk.equipos.enrichment;

import com.inia.soportedesk.catalogo.Dependencia;
import com.inia.soportedesk.catalogo.DependenciaRepository;
import com.inia.soportedesk.catalogo.Sede;
import com.inia.soportedesk.catalogo.SedeRepository;
import com.inia.soportedesk.catalogo.Subdependencia;
import com.inia.soportedesk.catalogo.SubdependenciaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class EquipoEnrichmentService {

    private final EquipoEnrichmentRepository repository;
    private final EquipoEnrichmentHistorialRepository historialRepository;
    private final SedeRepository sedeRepository;
    private final DependenciaRepository dependenciaRepository;
    private final SubdependenciaRepository subdependenciaRepository;

    public Optional<EquipoEnrichmentDto> findByComputerId(Long computerId) {
        return repository.findByComputerId(computerId).map(this::toDto);
    }

    public EquipoEnrichmentDto save(Long computerId, EquipoEnrichmentDto dto, String username) {
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
        entity.setSede(sede);
        entity.setDependencia(dependencia);
        entity.setSubdependencia(subdependencia);
        entity.setRevisadoPor(username);
        entity.setFechaRevision(LocalDateTime.now());

        return toDto(repository.save(entity));
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
