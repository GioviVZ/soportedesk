package com.inia.soportedesk.impresoras;

import com.inia.soportedesk.common.FileStorageService;
import com.inia.soportedesk.exception.ResourceNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.util.List;

@RestController
@RequestMapping("/api/impresoras")
@RequiredArgsConstructor
public class ImpresoraController {

    private final ImpresoraService service;
    private final FileStorageService fileStorageService;

    @GetMapping
    public List<Impresora> findAll(@RequestParam(required = false) String search) {
        return service.findAll(search);
    }

    @GetMapping("/{id}")
    public Impresora findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_impresoras')")
    public ResponseEntity<Impresora> create(@Valid @RequestBody ImpresoraRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_impresoras')")
    public Impresora update(@PathVariable Long id, @Valid @RequestBody ImpresoraRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_impresoras')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/driver")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_impresoras')")
    public Impresora uploadDriver(@PathVariable Long id,
                                   @RequestParam("file") MultipartFile file,
                                   @RequestParam(value = "version", required = false, defaultValue = "") String version,
                                   @RequestParam(value = "so", required = false, defaultValue = "") String so) {
        String relativePath = fileStorageService.store(id, file);
        return service.updateDriver(id, file.getOriginalFilename(), version, so, relativePath);
    }

    @GetMapping("/{id}/driver")
    public ResponseEntity<Resource> downloadDriver(@PathVariable Long id) {
        Impresora impresora = service.findById(id);
        if (impresora.getDriverArchivoPath() == null) {
            throw new ResourceNotFoundException("La impresora no tiene un driver cargado: " + id);
        }
        Path filePath = fileStorageService.load(impresora.getDriverArchivoPath());
        Resource resource = new FileSystemResource(filePath);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + impresora.getDriverNombre() + "\"")
                .body(resource);
    }
}
