package com.inia.soportedesk.impresoras.intervencion;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/impresoras/{impresoraId}/intervenciones")
@RequiredArgsConstructor
public class ImpresoraIntervencionController {

    private final ImpresoraIntervencionService service;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_impresoras')")
    public List<ImpresoraIntervencionDto> listar(@PathVariable Long impresoraId) {
        return service.listar(impresoraId);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_impresoras')")
    public ResponseEntity<ImpresoraIntervencionDto> crear(@PathVariable Long impresoraId,
                                                            @Valid @RequestBody ImpresoraIntervencionRequest request,
                                                            Authentication auth) {
        ImpresoraIntervencionDto dto = service.crear(impresoraId, request, auth.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    @PutMapping("/{intervencionId}")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_impresoras')")
    public ImpresoraIntervencionDto actualizar(@PathVariable Long impresoraId,
                                                @PathVariable Long intervencionId,
                                                @Valid @RequestBody ImpresoraIntervencionRequest request) {
        return service.actualizar(impresoraId, intervencionId, request);
    }

    @DeleteMapping("/{intervencionId}")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_impresoras')")
    public ResponseEntity<Void> eliminar(@PathVariable Long impresoraId, @PathVariable Long intervencionId) {
        service.eliminar(impresoraId, intervencionId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{intervencionId}/adjuntos")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_impresoras')")
    public ResponseEntity<List<ImpresoraIntervencionAdjuntoDto>> subirAdjuntos(@PathVariable Long impresoraId,
                                                                                 @PathVariable Long intervencionId,
                                                                                 @RequestParam("files") List<MultipartFile> files,
                                                                                 Authentication auth) {
        List<ImpresoraIntervencionAdjuntoDto> dtos = service.subirAdjuntos(impresoraId, intervencionId, files, auth.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(dtos);
    }

    @GetMapping("/{intervencionId}/adjuntos/{adjuntoId}/archivo")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_impresoras')")
    public ResponseEntity<Resource> descargar(@PathVariable Long impresoraId,
                                               @PathVariable Long intervencionId,
                                               @PathVariable Long adjuntoId) {
        ArchivoIntervencionAdjunto archivo = service.cargarArchivo(impresoraId, intervencionId, adjuntoId);
        Resource resource = new FileSystemResource(archivo.path());
        boolean previewable = archivo.mimeType().startsWith("image/") || archivo.mimeType().equals("application/pdf");
        String disposition = (previewable ? "inline" : "attachment") + "; filename=\"" + archivo.nombreOriginal() + "\"";
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(archivo.mimeType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition)
                .body(resource);
    }

    @DeleteMapping("/{intervencionId}/adjuntos/{adjuntoId}")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_impresoras')")
    public ResponseEntity<Void> eliminarAdjunto(@PathVariable Long impresoraId,
                                                 @PathVariable Long intervencionId,
                                                 @PathVariable Long adjuntoId) {
        service.eliminarAdjunto(impresoraId, intervencionId, adjuntoId);
        return ResponseEntity.noContent().build();
    }
}
