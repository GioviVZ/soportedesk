package com.inia.soportedesk.impresoras.intervencion;

import com.inia.soportedesk.common.FileStorageException;
import com.inia.soportedesk.exception.ResourceNotFoundException;
import com.inia.soportedesk.impresoras.ImpresoraRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.time.LocalDate;
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
class ImpresoraIntervencionServiceTest {

    @Mock private ImpresoraIntervencionRepository repository;
    @Mock private ImpresoraIntervencionAdjuntoRepository adjuntoRepository;
    @Mock private ImpresoraRepository impresoraRepository;
    @Mock private IntervencionStorageService storageService;
    @InjectMocks private ImpresoraIntervencionService service;

    private ImpresoraIntervencionRequest request(String fecha, String observacion) {
        ImpresoraIntervencionRequest req = new ImpresoraIntervencionRequest();
        req.setFecha(LocalDate.parse(fecha));
        req.setObservacion(observacion);
        return req;
    }

    @Test
    void crear_impresoraExists_savesAndReturnsDto() {
        when(impresoraRepository.existsById(7L)).thenReturn(true);
        when(repository.save(any())).thenAnswer(inv -> {
            ImpresoraIntervencion e = inv.getArgument(0);
            e.setId(1L);
            return e;
        });
        when(adjuntoRepository.findByIntervencionIdOrderByFechaSubidaAsc(1L)).thenReturn(List.of());

        ImpresoraIntervencionDto result = service.crear(7L, request("2026-07-17", "Cambio de fusor"), "gvivanco");

        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getObservacion()).isEqualTo("Cambio de fusor");
        assertThat(result.getRegistradoPor()).isEqualTo("gvivanco");
        assertThat(result.getAdjuntos()).isEmpty();
    }

    @Test
    void crear_impresoraNotFound_throwsResourceNotFoundException() {
        when(impresoraRepository.existsById(999L)).thenReturn(false);

        assertThatThrownBy(() -> service.crear(999L, request("2026-07-17", "obs"), "gvivanco"))
                .isInstanceOf(ResourceNotFoundException.class);

        verifyNoInteractions(repository);
    }

    @Test
    void actualizar_belongsToImpresora_updatesFechaAndObservacion() {
        ImpresoraIntervencion existing = new ImpresoraIntervencion();
        existing.setId(1L);
        existing.setImpresoraId(7L);
        existing.setFecha(LocalDate.parse("2026-07-01"));
        existing.setObservacion("Original");
        when(repository.findByIdAndImpresoraId(1L, 7L)).thenReturn(Optional.of(existing));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(adjuntoRepository.findByIntervencionIdOrderByFechaSubidaAsc(1L)).thenReturn(List.of());

        ImpresoraIntervencionDto result = service.actualizar(7L, 1L, request("2026-07-17", "Corregida"));

        assertThat(result.getFecha()).isEqualTo(LocalDate.parse("2026-07-17"));
        assertThat(result.getObservacion()).isEqualTo("Corregida");
    }

    @Test
    void eliminar_belongsToImpresora_deletesAttachmentFilesAndRow() {
        ImpresoraIntervencion existing = new ImpresoraIntervencion();
        existing.setId(1L);
        existing.setImpresoraId(7L);
        when(repository.findByIdAndImpresoraId(1L, 7L)).thenReturn(Optional.of(existing));
        ImpresoraIntervencionAdjunto adj1 = new ImpresoraIntervencionAdjunto();
        adj1.setArchivoPath("1/a.jpg");
        ImpresoraIntervencionAdjunto adj2 = new ImpresoraIntervencionAdjunto();
        adj2.setArchivoPath("1/b.pdf");
        when(adjuntoRepository.findByIntervencionIdOrderByFechaSubidaAsc(1L)).thenReturn(List.of(adj1, adj2));

        service.eliminar(7L, 1L);

        verify(storageService).delete("1/a.jpg");
        verify(storageService).delete("1/b.pdf");
        verify(repository).delete(existing);
    }

    @Test
    void eliminar_notBelongingToImpresora_throwsResourceNotFoundException() {
        when(repository.findByIdAndImpresoraId(1L, 999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.eliminar(999L, 1L))
                .isInstanceOf(ResourceNotFoundException.class);

        verifyNoInteractions(storageService);
    }

    @Test
    void subirAdjuntos_allValid_savesAllAndReturnsDtos() {
        ImpresoraIntervencion existing = new ImpresoraIntervencion();
        existing.setId(1L);
        existing.setImpresoraId(7L);
        when(repository.findByIdAndImpresoraId(1L, 7L)).thenReturn(Optional.of(existing));
        MockMultipartFile foto = new MockMultipartFile("files", "foto.jpg", "image/jpeg", new byte[]{1});
        MockMultipartFile pdf = new MockMultipartFile("files", "informe.pdf", "application/pdf", new byte[]{2});
        when(storageService.store(1L, foto)).thenReturn("1/uuid1.jpg");
        when(storageService.store(1L, pdf)).thenReturn("1/uuid2.pdf");
        when(adjuntoRepository.save(any())).thenAnswer(inv -> {
            ImpresoraIntervencionAdjunto a = inv.getArgument(0);
            a.setId(a.getArchivoPath().equals("1/uuid1.jpg") ? 10L : 11L);
            return a;
        });

        List<ImpresoraIntervencionAdjuntoDto> result = service.subirAdjuntos(7L, 1L, List.of(foto, pdf), "gvivanco");

        assertThat(result).hasSize(2);
        assertThat(result).extracting(ImpresoraIntervencionAdjuntoDto::getNombreOriginal)
                .containsExactly("foto.jpg", "informe.pdf");
    }

    @Test
    void subirAdjuntos_oneInvalidMimeType_throwsAndSavesNone() {
        ImpresoraIntervencion existing = new ImpresoraIntervencion();
        existing.setId(1L);
        existing.setImpresoraId(7L);
        when(repository.findByIdAndImpresoraId(1L, 7L)).thenReturn(Optional.of(existing));
        MockMultipartFile foto = new MockMultipartFile("files", "foto.jpg", "image/jpeg", new byte[]{1});
        MockMultipartFile exe = new MockMultipartFile("files", "virus.exe", "application/x-msdownload", new byte[]{2});

        assertThatThrownBy(() -> service.subirAdjuntos(7L, 1L, List.of(foto, exe), "gvivanco"))
                .isInstanceOf(FileStorageException.class);

        verifyNoInteractions(storageService);
        verifyNoInteractions(adjuntoRepository);
    }

    @Test
    void eliminarAdjunto_belongsToIntervencion_deletesFileAndRow() {
        ImpresoraIntervencion existing = new ImpresoraIntervencion();
        existing.setId(1L);
        existing.setImpresoraId(7L);
        when(repository.findByIdAndImpresoraId(1L, 7L)).thenReturn(Optional.of(existing));
        ImpresoraIntervencionAdjunto adjunto = new ImpresoraIntervencionAdjunto();
        adjunto.setId(10L);
        adjunto.setArchivoPath("1/uuid1.jpg");
        when(adjuntoRepository.findByIdAndIntervencionId(10L, 1L)).thenReturn(Optional.of(adjunto));

        service.eliminarAdjunto(7L, 1L, 10L);

        verify(storageService).delete("1/uuid1.jpg");
        verify(adjuntoRepository).delete(adjunto);
    }

    @Test
    void listar_ordersByFechaDescending_includesAdjuntos() {
        ImpresoraIntervencion older = new ImpresoraIntervencion();
        older.setId(1L);
        older.setFecha(LocalDate.parse("2026-07-01"));
        older.setObservacion("vieja");
        ImpresoraIntervencion newer = new ImpresoraIntervencion();
        newer.setId(2L);
        newer.setFecha(LocalDate.parse("2026-07-17"));
        newer.setObservacion("nueva");
        when(repository.findByImpresoraIdOrderByFechaDesc(7L)).thenReturn(List.of(newer, older));
        when(adjuntoRepository.findByIntervencionIdOrderByFechaSubidaAsc(any())).thenReturn(List.of());

        List<ImpresoraIntervencionDto> result = service.listar(7L);

        assertThat(result).extracting(ImpresoraIntervencionDto::getObservacion)
                .containsExactly("nueva", "vieja");
    }
}
