package com.inia.soportedesk.equipos.evidencia;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;

class EvidenciaStorageServiceTest {

    @TempDir
    Path tempDir;

    private EvidenciaStorageService service;

    @BeforeEach
    void setUp() {
        service = new EvidenciaStorageService(tempDir.toString());
    }

    @Test
    void store_savesFileUnderComputerSubfolderWithUniqueName() throws IOException {
        MockMultipartFile file = new MockMultipartFile("file", "foto.jpg", "image/jpeg", "contenido".getBytes());

        String relativePath = service.store(291L, file);

        assertThat(relativePath).startsWith("291/").endsWith(".jpg");
        Path stored = tempDir.resolve(relativePath);
        assertThat(Files.exists(stored)).isTrue();
        assertThat(Files.readString(stored)).isEqualTo("contenido");
    }

    @Test
    void store_twoFilesWithSameOriginalName_doNotOverwriteEachOther() throws IOException {
        MockMultipartFile first = new MockMultipartFile("file", "foto.jpg", "image/jpeg", "primera".getBytes());
        MockMultipartFile second = new MockMultipartFile("file", "foto.jpg", "image/jpeg", "segunda".getBytes());

        String firstPath = service.store(291L, first);
        String secondPath = service.store(291L, second);

        assertThat(firstPath).isNotEqualTo(secondPath);
        assertThat(Files.readString(tempDir.resolve(firstPath))).isEqualTo("primera");
        assertThat(Files.readString(tempDir.resolve(secondPath))).isEqualTo("segunda");
    }

    @Test
    void load_returnsPathToStoredFile() throws IOException {
        MockMultipartFile file = new MockMultipartFile("file", "foto.jpg", "image/jpeg", "contenido".getBytes());
        String relativePath = service.store(291L, file);

        Path loaded = service.load(relativePath);

        assertThat(Files.exists(loaded)).isTrue();
    }

    @Test
    void delete_removesStoredFile() throws IOException {
        MockMultipartFile file = new MockMultipartFile("file", "foto.jpg", "image/jpeg", "contenido".getBytes());
        String relativePath = service.store(291L, file);

        service.delete(relativePath);

        assertThat(Files.exists(tempDir.resolve(relativePath))).isFalse();
    }
}
