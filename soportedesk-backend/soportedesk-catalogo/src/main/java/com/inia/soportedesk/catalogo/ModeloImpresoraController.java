package com.inia.soportedesk.catalogo;

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
@RequestMapping("/api/catalogos/modelos-impresora")
@RequiredArgsConstructor
public class ModeloImpresoraController {

    private final ModeloImpresoraService service;
    private final FileStorageService fileStorageService;

    @GetMapping
    public List<ModeloImpresora> findAll(@RequestParam(required = false) Long marcaId,
                                          @RequestParam(required = false) String search) {
        return service.findAll(marcaId, search);
    }

    @GetMapping("/{id}")
    public ModeloImpresora findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_catalogos')")
    public ResponseEntity<ModeloImpresora> create(@Valid @RequestBody ModeloImpresoraRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_catalogos')")
    public ModeloImpresora update(@PathVariable Long id, @Valid @RequestBody ModeloImpresoraRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_catalogos')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/driver")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_catalogos')")
    public ModeloImpresora uploadDriver(@PathVariable Long id,
                                         @RequestParam("file") MultipartFile file,
                                         @RequestParam(value = "version", required = false, defaultValue = "") String version,
                                         @RequestParam(value = "so", required = false, defaultValue = "") String so) {
        String relativePath = fileStorageService.store(id, file);
        return service.updateDriver(id, file.getOriginalFilename(), version, so, relativePath);
    }

    @GetMapping("/{id}/driver")
    public ResponseEntity<Resource> downloadDriver(@PathVariable Long id) {
        ModeloImpresora modelo = service.findById(id);
        if (modelo.getDriverArchivoPath() == null) {
            throw new ResourceNotFoundException("El modelo de impresora no tiene un driver cargado: " + id);
        }
        Path filePath = fileStorageService.load(modelo.getDriverArchivoPath());
        Resource resource = new FileSystemResource(filePath);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + modelo.getDriverNombre() + "\"")
                .body(resource);
    }
}
