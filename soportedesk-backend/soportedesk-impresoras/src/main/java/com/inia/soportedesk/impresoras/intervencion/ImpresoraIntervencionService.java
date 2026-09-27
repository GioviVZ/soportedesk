package com.inia.soportedesk.impresoras.intervencion;

import com.inia.soportedesk.common.FileStorageException;
import com.inia.soportedesk.exception.ResourceNotFoundException;
import com.inia.soportedesk.impresoras.ImpresoraRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ImpresoraIntervencionService {

    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp",
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    private static final long MAX_FILE_SIZE_BYTES = 15L * 1024 * 1024;

    private final ImpresoraIntervencionRepository repository;
    private final ImpresoraIntervencionAdjuntoRepository adjuntoRepository;
    private final ImpresoraRepository impresoraRepository;
    private final IntervencionStorageService storageService;

    public List<ImpresoraIntervencionDto> listar(Long impresoraId) {
        return repository.findByImpresoraIdOrderByFechaDesc(impresoraId).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public void eliminarTodasDeImpresora(Long impresoraId) {
        repository.findByImpresoraIdOrderByFechaDesc(impresoraId)
                .forEach(entity -> adjuntoRepository.findByIntervencionIdOrderByFechaSubidaAsc(entity.getId())
                        .forEach(adjunto -> storageService.delete(adjunto.getArchivoPath())));
    }

    @Transactional
    public ImpresoraIntervencionDto crear(Long impresoraId, ImpresoraIntervencionRequest request, String username) {
        if (!impresoraRepository.existsById(impresoraId)) {
            throw new ResourceNotFoundException("Impresora no encontrada: " + impresoraId);
        }
        ImpresoraIntervencion entity = new ImpresoraIntervencion();
        entity.setImpresoraId(impresoraId);
        entity.setFecha(request.getFecha());
        entity.setObservacion(request.getObservacion());
        entity.setRegistradoPor(username);
        entity.setFechaRegistro(LocalDateTime.now());
        return toDto(repository.save(entity));
    }

    @Transactional
    public ImpresoraIntervencionDto actualizar(Long impresoraId, Long intervencionId, ImpresoraIntervencionRequest request) {
        ImpresoraIntervencion entity = obtener(impresoraId, intervencionId);
        entity.setFecha(request.getFecha());
        entity.setObservacion(request.getObservacion());
        return toDto(repository.save(entity));
    }

    @Transactional
    public void eliminar(Long impresoraId, Long intervencionId) {
        ImpresoraIntervencion entity = obtener(impresoraId, intervencionId);
        adjuntoRepository.findByIntervencionIdOrderByFechaSubidaAsc(intervencionId)
                .forEach(adjunto -> storageService.delete(adjunto.getArchivoPath()));
        repository.delete(entity);
    }

    @Transactional
    public List<ImpresoraIntervencionAdjuntoDto> subirAdjuntos(Long impresoraId, Long intervencionId,
                                                                 List<MultipartFile> files, String username) {
        obtener(impresoraId, intervencionId);
        files.forEach(this::validar);

        List<ImpresoraIntervencionAdjuntoDto> resultado = new ArrayList<>();
        for (MultipartFile file : files) {
            String relativePath = storageService.store(intervencionId, file);
            ImpresoraIntervencionAdjunto adjunto = new ImpresoraIntervencionAdjunto();
            adjunto.setIntervencionId(intervencionId);
            adjunto.setArchivoPath(relativePath);
            adjunto.setNombreOriginal(file.getOriginalFilename());
            adjunto.setMimeType(file.getContentType());
            adjunto.setSubidoPor(username);
            adjunto.setFechaSubida(LocalDateTime.now());
            resultado.add(toAdjuntoDto(adjuntoRepository.save(adjunto)));
        }
        return resultado;
    }

    @Transactional
    public void eliminarAdjunto(Long impresoraId, Long intervencionId, Long adjuntoId) {
        obtener(impresoraId, intervencionId);
        ImpresoraIntervencionAdjunto adjunto = adjuntoRepository.findByIdAndIntervencionId(adjuntoId, intervencionId)
                .orElseThrow(() -> new ResourceNotFoundException("Adjunto no encontrado: " + adjuntoId));
        storageService.delete(adjunto.getArchivoPath());
        adjuntoRepository.delete(adjunto);
    }

    public ArchivoIntervencionAdjunto cargarArchivo(Long impresoraId, Long intervencionId, Long adjuntoId) {
        obtener(impresoraId, intervencionId);
        ImpresoraIntervencionAdjunto adjunto = adjuntoRepository.findByIdAndIntervencionId(adjuntoId, intervencionId)
                .orElseThrow(() -> new ResourceNotFoundException("Adjunto no encontrado: " + adjuntoId));
        Path path = storageService.load(adjunto.getArchivoPath());
        return new ArchivoIntervencionAdjunto(path, adjunto.getMimeType(), adjunto.getNombreOriginal());
    }

    private void validar(MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType)) {
            throw new FileStorageException("Tipo de archivo no permitido: " + file.getOriginalFilename());
        }
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new FileStorageException("El archivo supera el tamaño máximo permitido (15 MB): " + file.getOriginalFilename());
        }
    }

    private ImpresoraIntervencion obtener(Long impresoraId, Long intervencionId) {
        return repository.findByIdAndImpresoraId(intervencionId, impresoraId)
                .orElseThrow(() -> new ResourceNotFoundException("Intervención no encontrada: " + intervencionId));
    }

    private ImpresoraIntervencionDto toDto(ImpresoraIntervencion entity) {
        ImpresoraIntervencionDto dto = new ImpresoraIntervencionDto();
        dto.setId(entity.getId());
        dto.setFecha(entity.getFecha());
        dto.setObservacion(entity.getObservacion());
        dto.setRegistradoPor(entity.getRegistradoPor());
        dto.setFechaRegistro(entity.getFechaRegistro());
        dto.setAdjuntos(adjuntoRepository.findByIntervencionIdOrderByFechaSubidaAsc(entity.getId()).stream()
                .map(this::toAdjuntoDto)
                .toList());
        return dto;
    }

    private ImpresoraIntervencionAdjuntoDto toAdjuntoDto(ImpresoraIntervencionAdjunto entity) {
        ImpresoraIntervencionAdjuntoDto dto = new ImpresoraIntervencionAdjuntoDto();
        dto.setId(entity.getId());
        dto.setNombreOriginal(entity.getNombreOriginal());
        dto.setMimeType(entity.getMimeType());
        dto.setSubidoPor(entity.getSubidoPor());
        dto.setFechaSubida(entity.getFechaSubida());
        return dto;
    }
}
