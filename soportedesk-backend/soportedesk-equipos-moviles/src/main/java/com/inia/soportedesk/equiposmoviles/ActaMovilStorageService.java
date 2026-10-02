package com.inia.soportedesk.equiposmoviles;

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
public class ActaMovilStorageService {

    private final Path rootDir;

    public ActaMovilStorageService(@Value("${uploads.actas-moviles-dir}") String actasMovilesDir) {
        this.rootDir = Paths.get(actasMovilesDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(rootDir);
        } catch (IOException e) {
            throw new FileStorageException("No se pudo crear el directorio de almacenamiento: " + rootDir, e);
        }
    }

    public String store(Long actaId, MultipartFile file) {
        String suppliedName = file.getOriginalFilename() == null ? "archivo" : file.getOriginalFilename();
        String originalName = Paths.get(suppliedName).getFileName().toString();
        String extension = originalName.contains(".") ? originalName.substring(originalName.lastIndexOf('.')) : "";
        String uniqueName = UUID.randomUUID() + extension;
        Path targetDir = rootDir.resolve(String.valueOf(actaId));
        try {
            Files.createDirectories(targetDir);
            Path target = targetDir.resolve(uniqueName);
            try (var inputStream = file.getInputStream()) {
                Files.copy(inputStream, target, StandardCopyOption.REPLACE_EXISTING);
            }
            return actaId + "/" + uniqueName;
        } catch (IOException e) {
            throw new FileStorageException("No se pudo guardar el archivo: " + originalName, e);
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
            throw new FileStorageException("No se pudo eliminar el archivo: " + relativePath, e);
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
