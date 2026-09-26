package com.inia.soportedesk.equipos.evidencia;

import com.inia.soportedesk.common.FileStorageException;
import com.inia.soportedesk.exception.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EquipoEvidenciaServiceTest {

    @Mock private EquipoEvidenciaRepository repository;
    @Mock private EvidenciaStorageService storageService;
    @InjectMocks private EquipoEvidenciaService service;

    @Test
    void subir_validImage_savesAndReturnsDto() {
        MockMultipartFile file = new MockMultipartFile("file", "foto.jpg", "image/jpeg", new byte[]{1, 2, 3});
        when(storageService.store(291L, file)).thenReturn("291/uuid.jpg");
        when(repository.save(any())).thenAnswer(inv -> {
            EquipoEvidencia e = inv.getArgument(0);
            e.setId(5L);
            return e;
        });

        EquipoEvidenciaDto result = service.subir(291L, file, "Etiqueta de serie", "gvivanco");

        assertThat(result.getId()).isEqualTo(5L);
        assertThat(result.getNombreOriginal()).isEqualTo("foto.jpg");
        assertThat(result.getDescripcion()).isEqualTo("Etiqueta de serie");
        assertThat(result.getSubidoPor()).isEqualTo("gvivanco");
    }

    @Test
    void subir_invalidMimeType_throwsFileStorageException() {
        MockMultipartFile file = new MockMultipartFile("file", "documento.pdf", "application/pdf", new byte[]{1, 2, 3});

        assertThatThrownBy(() -> service.subir(291L, file, null, "gvivanco"))
                .isInstanceOf(FileStorageException.class)
                .hasMessageContaining("JPG, PNG o WEBP");

        verifyNoInteractions(storageService);
    }

    @Test
    void subir_fileTooLarge_throwsFileStorageException() {
        byte[] tooLarge = new byte[9 * 1024 * 1024];
        MockMultipartFile file = new MockMultipartFile("file", "foto.jpg", "image/jpeg", tooLarge);

        assertThatThrownBy(() -> service.subir(291L, file, null, "gvivanco"))
                .isInstanceOf(FileStorageException.class)
                .hasMessageContaining("8 MB");

        verifyNoInteractions(storageService);
    }

    @Test
    void eliminar_belongsToComputer_deletesFileAndRow() {
        EquipoEvidencia entity = new EquipoEvidencia();
        entity.setId(5L);
        entity.setComputerId(291L);
        entity.setArchivoPath("291/uuid.jpg");
        when(repository.findByIdAndComputerId(5L, 291L)).thenReturn(Optional.of(entity));

        service.eliminar(291L, 5L);

        verify(storageService).delete("291/uuid.jpg");
        verify(repository).delete(entity);
    }

    @Test
    void eliminar_notBelongingToComputer_throwsResourceNotFoundException() {
        when(repository.findByIdAndComputerId(5L, 999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.eliminar(999L, 5L))
                .isInstanceOf(ResourceNotFoundException.class);

        verifyNoInteractions(storageService);
    }

    @Test
    void listar_ordersByFechaSubidaDescending() {
        EquipoEvidencia older = new EquipoEvidencia();
        older.setId(1L);
        older.setNombreOriginal("vieja.jpg");
        older.setFechaSubida(LocalDateTime.now().minusDays(1));
        EquipoEvidencia newer = new EquipoEvidencia();
        newer.setId(2L);
        newer.setNombreOriginal("nueva.jpg");
        newer.setFechaSubida(LocalDateTime.now());
        when(repository.findByComputerIdOrderByFechaSubidaDesc(291L)).thenReturn(List.of(newer, older));

        List<EquipoEvidenciaDto> result = service.listar(291L);

        assertThat(result).extracting(EquipoEvidenciaDto::getNombreOriginal)
                .containsExactly("nueva.jpg", "vieja.jpg");
    }
}
