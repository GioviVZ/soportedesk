package com.inia.soportedesk.impresoras.intervencion;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;

class IntervencionStorageServiceTest {

    @TempDir
    Path tempDir;

    private IntervencionStorageService service;

    @BeforeEach
    void setUp() {
        service = new IntervencionStorageService(tempDir.toString());
    }

    @Test
    void store_savesFileUnderIntervencionSubfolderWithUniqueName() throws IOException {
        MockMultipartFile file = new MockMultipartFile("file", "informe.pdf", "application/pdf", "contenido".getBytes());

        String relativePath = service.store(42L, file);

        assertThat(relativePath).startsWith("42/").endsWith(".pdf");
        Path stored = tempDir.resolve(relativePath);
        assertThat(Files.exists(stored)).isTrue();
        assertThat(Files.readString(stored)).isEqualTo("contenido");
    }

    @Test
    void store_twoFilesWithSameOriginalName_doNotOverwriteEachOther() throws IOException {
        MockMultipartFile first = new MockMultipartFile("file", "foto.jpg", "image/jpeg", "primera".getBytes());
        MockMultipartFile second = new MockMultipartFile("file", "foto.jpg", "image/jpeg", "segunda".getBytes());

        String firstPath = service.store(42L, first);
        String secondPath = service.store(42L, second);

        assertThat(firstPath).isNotEqualTo(secondPath);
        assertThat(Files.readString(tempDir.resolve(firstPath))).isEqualTo("primera");
        assertThat(Files.readString(tempDir.resolve(secondPath))).isEqualTo("segunda");
    }

    @Test
    void load_returnsPathToStoredFile() throws IOException {
        MockMultipartFile file = new MockMultipartFile("file", "foto.jpg", "image/jpeg", "contenido".getBytes());
        String relativePath = service.store(42L, file);

        Path loaded = service.load(relativePath);

        assertThat(Files.exists(loaded)).isTrue();
    }

    @Test
    void delete_removesStoredFile() throws IOException {
        MockMultipartFile file = new MockMultipartFile("file", "foto.jpg", "image/jpeg", "contenido".getBytes());
        String relativePath = service.store(42L, file);

        service.delete(relativePath);

        assertThat(Files.exists(tempDir.resolve(relativePath))).isFalse();
    }
}
