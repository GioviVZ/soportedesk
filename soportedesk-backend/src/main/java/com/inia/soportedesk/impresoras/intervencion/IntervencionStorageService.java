package com.inia.soportedesk.impresoras.intervencion;

import com.inia.soportedesk.common.FileStorageException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class IntervencionStorageService {

    private final Path rootDir;

    public IntervencionStorageService(@Value("${uploads.intervenciones-dir}") String intervencionesDir) {
        this.rootDir = Paths.get(intervencionesDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(rootDir);
        } catch (IOException e) {
            throw new FileStorageException("No se pudo crear el directorio de almacenamiento: " + rootDir, e);
        }
    }

    public String store(Long intervencionId, MultipartFile file) {
        String originalName = Paths.get(file.getOriginalFilename()).getFileName().toString();
        String extension = originalName.contains(".") ? originalName.substring(originalName.lastIndexOf('.')) : "";
        String uniqueName = UUID.randomUUID() + extension;
        Path targetDir = rootDir.resolve(String.valueOf(intervencionId));
        try {
            Files.createDirectories(targetDir);
            Path target = targetDir.resolve(uniqueName);
            try (var inputStream = file.getInputStream()) {
                Files.copy(inputStream, target, StandardCopyOption.REPLACE_EXISTING);
            }
            return intervencionId + "/" + uniqueName;
        } catch (IOException e) {
            throw new FileStorageException("No se pudo guardar el adjunto: " + originalName, e);
        }
    }

    public Path load(String relativePath) {
        Path file = resolveWithinRoot(relativePath);
        if (!Files.exists(file)) {
            throw new FileStorageException("Archivo no encontrado: " + relativePath);
        }
        return file;
    }

    public void delete(String relativePath) {
        Path file = resolveWithinRoot(relativePath);
        try {
            Files.deleteIfExists(file);
        } catch (IOException e) {
            throw new FileStorageException("No se pudo eliminar el adjunto: " + relativePath, e);
        }
    }

    private Path resolveWithinRoot(String relativePath) {
        Path file = rootDir.resolve(relativePath).normalize();
        if (!file.startsWith(rootDir)) {
            throw new FileStorageException("Ruta de archivo inválida: " + relativePath);
        }
        return file;
    }
}
