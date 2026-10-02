package com.inia.soportedesk.equiposmoviles;

import com.inia.soportedesk.catalogo.DependenciaRepository;
import com.inia.soportedesk.common.FileStorageException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ActaMovilServiceTest {

    @Mock
    private ActaMovilRepository repository;
    @Mock
    private EquipoMovilRepository equipoRepository;
    @Mock
    private DependenciaRepository dependenciaRepository;
    @Mock
    private ActaMovilStorageService storageService;

    @InjectMocks
    private ActaMovilService service;

    @Test
    void create_rejectsDuplicateNumeroActaIgnoringCase() {
        ActaMovilRequest request = sampleRequest();
        when(repository.existsByNumeroActaIgnoreCase("AM-001")).thenReturn(true);

        assertThatThrownBy(() -> service.create(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Ya existe un acta móvil con el número AM-001.");
    }

    @Test
    void create_rejectsEmptyEquipos() {
        ActaMovilRequest request = sampleRequest();
        request.setEquipoMovilIds(List.of());

        assertThatThrownBy(() -> service.create(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Debe seleccionar al menos un equipo móvil.");
    }

    @Test
    void uploadFile_rejectsUnsupportedContentType() {
        MultipartFile file = mock(MultipartFile.class);
        when(file.getContentType()).thenReturn("text/plain");

        assertThatThrownBy(() -> service.uploadFile(1L, file))
                .isInstanceOf(FileStorageException.class)
                .hasMessage("El archivo debe ser PDF, JPG o PNG de hasta 10 MB.");
    }

    @Test
    void uploadFile_rejectsFileLargerThanTenMegabytes() {
        MultipartFile file = mock(MultipartFile.class);
        when(file.getContentType()).thenReturn("application/pdf");
        when(file.getSize()).thenReturn(10L * 1024 * 1024 + 1);

        assertThatThrownBy(() -> service.uploadFile(1L, file))
                .isInstanceOf(FileStorageException.class)
                .hasMessage("El archivo debe ser PDF, JPG o PNG de hasta 10 MB.");
    }

    @Test
    void resumen_countsEachActaType() {
        when(repository.findAllByOrderByIdDesc()).thenReturn(List.of(
                acta("Entrega"), acta("Entrega"), acta("Devolución"), acta("Transferencia")));

        ActaMovilResumen result = service.resumen();

        assertThat(result).isEqualTo(new ActaMovilResumen(4, 2, 1, 1));
    }

    private ActaMovilRequest sampleRequest() {
        ActaMovilRequest request = new ActaMovilRequest();
        request.setNumeroActa("AM-001");
        request.setTipo("Entrega");
        request.setFecha(LocalDate.of(2026, 2, 1));
        request.setPersonaNombre("María Pérez");
        request.setEquipoMovilIds(List.of(1L));
        return request;
    }

    private ActaMovil acta(String tipo) {
        ActaMovil acta = new ActaMovil();
        acta.setTipo(tipo);
        return acta;
    }
}
