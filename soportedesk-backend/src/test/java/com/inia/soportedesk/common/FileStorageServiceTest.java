package com.inia.soportedesk.common;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;

class FileStorageServiceTest {

    @TempDir
    Path tempDir;

    private FileStorageService service;

    @BeforeEach
    void setUp() {
        service = new FileStorageService(tempDir.toString());
    }

    @Test
    void store_savesFileUnderEntitySubfolder() throws IOException {
        MockMultipartFile file = new MockMultipartFile("file", "driver-hp.zip", "application/zip", "contenido".getBytes());

        String relativePath = service.store(1L, file);

        assertThat(relativePath).isEqualTo("1/driver-hp.zip");
        Path stored = tempDir.resolve(relativePath);
        assertThat(Files.exists(stored)).isTrue();
        assertThat(Files.readString(stored)).isEqualTo("contenido");
    }

    @Test
    void load_returnsPathToStoredFile() throws IOException {
        MockMultipartFile file = new MockMultipartFile("file", "driver-hp.zip", "application/zip", "contenido".getBytes());
        String relativePath = service.store(1L, file);

        Path loaded = service.load(relativePath);

        assertThat(Files.exists(loaded)).isTrue();
        assertThat(Files.readString(loaded)).isEqualTo("contenido");
    }
}
