package com.inia.soportedesk.equipos.enrichment;

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

    public Optional<EquipoEnrichmentDto> findByComputerId(Long computerId) {
        return repository.findByComputerId(computerId).map(this::toDto);
    }

    public EquipoEnrichmentDto save(Long computerId, EquipoEnrichmentDto dto, String username) {
        EquipoEnrichment entity = repository.findByComputerId(computerId).orElseGet(() -> {
            EquipoEnrichment e = new EquipoEnrichment();
            e.setComputerId(computerId);
            return e;
        });

        recordChange(computerId, "tipo_override",       entity.getTipoOverride(),       dto.getTipoOverride(),       username);
        recordChange(computerId, "fabricante_override", entity.getFabricanteOverride(), dto.getFabricanteOverride(), username);
        recordChange(computerId, "modelo_override",     entity.getModeloOverride(),     dto.getModeloOverride(),     username);
        recordChange(computerId, "codigo_patrimonial",  entity.getCodigoPatrimonial(),  dto.getCodigoPatrimonial(),  username);
        recordChange(computerId, "estado_depuracion",   entity.getEstadoDepuracion(),   dto.getEstadoDepuracion(),   username);
        recordChange(computerId, "observaciones",       entity.getObservaciones(),      dto.getObservaciones(),      username);

        entity.setTipoOverride(dto.getTipoOverride());
        entity.setFabricanteOverride(dto.getFabricanteOverride());
        entity.setModeloOverride(dto.getModeloOverride());
        entity.setCodigoPatrimonial(dto.getCodigoPatrimonial());
        entity.setEstadoDepuracion(dto.getEstadoDepuracion());
        entity.setObservaciones(dto.getObservaciones());
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
        dto.setEstadoDepuracion(entity.getEstadoDepuracion());
        dto.setObservaciones(entity.getObservaciones());
        dto.setRevisadoPor(entity.getRevisadoPor());
        dto.setFechaRevision(entity.getFechaRevision());
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
}
