package com.inia.soportedesk.equiposmoviles;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/equipos-moviles/actas")
@RequiredArgsConstructor
public class ActaMovilController {

    private final ActaMovilService service;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_equipos-moviles')")
    public List<ActaMovil> findAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String tipo,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return service.findAll(search, tipo, desde, hasta);
    }

    @GetMapping("/resumen")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_equipos-moviles')")
    public ActaMovilResumen resumen() {
        return service.resumen();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_equipos-moviles')")
    public ActaMovil findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_equipos-moviles')")
    public ResponseEntity<ActaMovil> create(@Valid @RequestBody ActaMovilRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_equipos-moviles')")
    public ActaMovil update(@PathVariable Long id, @Valid @RequestBody ActaMovilRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_equipos-moviles')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(path = "/{id}/archivo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_equipos-moviles')")
    public ActaMovil uploadFile(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        return service.uploadFile(id, file);
    }

    @GetMapping("/{id}/archivo")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_equipos-moviles')")
    public ResponseEntity<Resource> downloadFile(@PathVariable Long id) {
        ArchivoActaMovil archivo = service.loadFile(id);
        MediaType mediaType = archivo.contentType() == null
                ? MediaType.APPLICATION_OCTET_STREAM
                : MediaType.parseMediaType(archivo.contentType());
        ContentDisposition disposition = ContentDisposition.attachment()
                .filename(archivo.nombreOriginal(), StandardCharsets.UTF_8)
                .build();
        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .body(new FileSystemResource(archivo.path()));
    }

    @DeleteMapping("/{id}/archivo")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_equipos-moviles')")
    public ResponseEntity<Void> deleteFile(@PathVariable Long id) {
        service.deleteFile(id);
        return ResponseEntity.noContent().build();
    }
}
