package com.inia.soportedesk.equipos.evidencia;

import com.inia.soportedesk.common.FileStorageException;
import com.inia.soportedesk.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class EquipoEvidenciaService {

    private static final Set<String> ALLOWED_MIME_TYPES = Set.of("image/jpeg", "image/png", "image/webp");
    private static final long MAX_FILE_SIZE_BYTES = 8L * 1024 * 1024;

    private final EquipoEvidenciaRepository repository;
    private final EvidenciaStorageService storageService;

    public List<EquipoEvidenciaDto> listar(Long computerId) {
        return repository.findByComputerIdOrderByFechaSubidaDesc(computerId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    public EquipoEvidenciaDto subir(Long computerId, MultipartFile file, String descripcion, String username) {
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType)) {
            throw new FileStorageException("Solo se aceptan imágenes JPG, PNG o WEBP.");
        }
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new FileStorageException("La imagen supera el tamaño máximo permitido (8 MB).");
        }

        String relativePath = storageService.store(computerId, file);

        EquipoEvidencia entity = new EquipoEvidencia();
        entity.setComputerId(computerId);
        entity.setArchivoPath(relativePath);
        entity.setNombreOriginal(file.getOriginalFilename());
        entity.setMimeType(contentType);
        entity.setDescripcion(descripcion);
        entity.setSubidoPor(username);
        entity.setFechaSubida(LocalDateTime.now());

        return toDto(repository.save(entity));
    }

    public void eliminar(Long computerId, Long evidenciaId) {
        EquipoEvidencia entity = repository.findByIdAndComputerId(evidenciaId, computerId)
                .orElseThrow(() -> new ResourceNotFoundException("Evidencia no encontrada: " + evidenciaId));
        storageService.delete(entity.getArchivoPath());
        repository.delete(entity);
    }

    public ArchivoEvidencia cargarArchivo(Long computerId, Long evidenciaId) {
        EquipoEvidencia entity = repository.findByIdAndComputerId(evidenciaId, computerId)
                .orElseThrow(() -> new ResourceNotFoundException("Evidencia no encontrada: " + evidenciaId));
        Path path = storageService.load(entity.getArchivoPath());
        return new ArchivoEvidencia(path, entity.getMimeType(), entity.getNombreOriginal());
    }

    private EquipoEvidenciaDto toDto(EquipoEvidencia entity) {
        EquipoEvidenciaDto dto = new EquipoEvidenciaDto();
        dto.setId(entity.getId());
        dto.setNombreOriginal(entity.getNombreOriginal());
        dto.setDescripcion(entity.getDescripcion());
        dto.setSubidoPor(entity.getSubidoPor());
        dto.setFechaSubida(entity.getFechaSubida());
        return dto;
    }
}
