package com.inia.soportedesk.equipos.evidencia;

import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/equipos/{computerId}/evidencias")
@RequiredArgsConstructor
public class EquipoEvidenciaController {

    private final EquipoEvidenciaService service;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_equipos')")
    public List<EquipoEvidenciaDto> listar(@PathVariable Long computerId) {
        return service.listar(computerId);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_equipos')")
    public ResponseEntity<EquipoEvidenciaDto> subir(@PathVariable Long computerId,
                                                      @RequestParam("file") MultipartFile file,
                                                      @RequestParam(value = "descripcion", required = false) String descripcion,
                                                      Authentication auth) {
        EquipoEvidenciaDto dto = service.subir(computerId, file, descripcion, auth.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    @GetMapping("/{evidenciaId}/archivo")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_equipos')")
    public ResponseEntity<Resource> descargar(@PathVariable Long computerId, @PathVariable Long evidenciaId) {
        ArchivoEvidencia archivo = service.cargarArchivo(computerId, evidenciaId);
        Resource resource = new FileSystemResource(archivo.path());
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(archivo.mimeType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + archivo.nombreOriginal() + "\"")
                .body(resource);
    }

    @DeleteMapping("/{evidenciaId}")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_equipos')")
    public ResponseEntity<Void> eliminar(@PathVariable Long computerId, @PathVariable Long evidenciaId) {
        service.eliminar(computerId, evidenciaId);
        return ResponseEntity.noContent().build();
    }
}
