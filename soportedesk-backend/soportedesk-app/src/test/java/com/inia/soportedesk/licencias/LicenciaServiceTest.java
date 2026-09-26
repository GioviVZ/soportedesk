package com.inia.soportedesk.licencias;

import com.inia.soportedesk.catalogo.TipoBien;
import com.inia.soportedesk.catalogo.TipoBienRepository;
import com.inia.soportedesk.catalogo.TipoLicencia;
import com.inia.soportedesk.catalogo.TipoLicenciaRepository;
import com.inia.soportedesk.exception.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LicenciaServiceTest {

    @Mock
    private LicenciaRepository repository;

    @Mock
    private TipoLicenciaRepository tipoLicenciaRepository;

    @Mock
    private TipoBienRepository tipoBienRepository;

    @InjectMocks
    private LicenciaService service;

    private TipoLicencia tipoLicencia() {
        TipoLicencia tipo = new TipoLicencia();
        tipo.setId(1L);
        tipo.setNombre("Ofimática");
        return tipo;
    }

    private TipoBien tipoBien() {
        TipoBien tipo = new TipoBien();
        tipo.setId(1L);
        tipo.setNombre("Intangible");
        return tipo;
    }

    private Licencia existingLicencia() {
        Licencia licencia = new Licencia();
        licencia.setId(1L);
        licencia.setTipoLicencia(tipoLicencia());
        licencia.setTipoBien(tipoBien());
        licencia.setDescripcion("Office 2024 Profesional Home and Business");
        licencia.setCuentaActivacion("j.perez@inia.gob.pe");
        licencia.setClaveActivacion("NKJFR-XXXXX-XXXXX-MNBVC");
        licencia.setOrdenCompra("OC-2024-00123");
        licencia.setAnio("2024");
        licencia.setCantidad(5);
        return licencia;
    }

    private LicenciaRequest sampleRequest() {
        LicenciaRequest request = new LicenciaRequest();
        request.setTipoLicenciaId(1L);
        request.setTipoBienId(1L);
        request.setDescripcion("Office 2024 Profesional Home and Business");
        request.setCuentaActivacion("j.perez@inia.gob.pe");
        request.setClaveActivacion("NKJFR-XXXXX-XXXXX-MNBVC");
        request.setOrdenCompra("OC-2024-00123");
        request.setAnio("2024");
        request.setCantidad(5);
        return request;
    }

    @Test
    void findAll_withoutSearch_returnsAll() {
        when(repository.findAll()).thenReturn(List.of(existingLicencia()));

        List<Licencia> result = service.findAll(null);

        assertThat(result).hasSize(1);
        verify(repository).findAll();
    }

    @Test
    void findAll_withSearch_usesSearchQuery() {
        when(repository.search("office")).thenReturn(List.of(existingLicencia()));

        List<Licencia> result = service.findAll("office");

        assertThat(result).hasSize(1);
        verify(repository).search("office");
    }

    @Test
    void findById_whenNotFound_throwsResourceNotFoundException() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.findById(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void create_savesLicenciaFromRequest() {
        when(tipoLicenciaRepository.findById(1L)).thenReturn(Optional.of(tipoLicencia()));
        when(tipoBienRepository.findById(1L)).thenReturn(Optional.of(tipoBien()));
        when(repository.save(any(Licencia.class))).thenAnswer(inv -> inv.getArgument(0));

        Licencia result = service.create(sampleRequest());

        assertThat(result.getDescripcion()).isEqualTo("Office 2024 Profesional Home and Business");
        assertThat(result.getTipoLicencia().getNombre()).isEqualTo("Ofimática");
        assertThat(result.getTipoBien().getNombre()).isEqualTo("Intangible");
        assertThat(result.getClaveActivacion()).isEqualTo("NKJFR-XXXXX-XXXXX-MNBVC");
    }

    @Test
    void create_withUnknownTipoLicenciaId_throwsResourceNotFoundException() {
        when(tipoLicenciaRepository.findById(99L)).thenReturn(Optional.empty());

        LicenciaRequest request = sampleRequest();
        request.setTipoLicenciaId(99L);

        assertThatThrownBy(() -> service.create(request))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void create_withUnknownTipoBienId_throwsResourceNotFoundException() {
        when(tipoLicenciaRepository.findById(1L)).thenReturn(Optional.of(tipoLicencia()));
        when(tipoBienRepository.findById(99L)).thenReturn(Optional.empty());

        LicenciaRequest request = sampleRequest();
        request.setTipoBienId(99L);

        assertThatThrownBy(() -> service.create(request))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void create_withClaveActivacionButNoCuentaActivacion_throwsIllegalArgumentException() {
        LicenciaRequest request = sampleRequest();
        request.setCuentaActivacion(null);

        assertThatThrownBy(() -> service.create(request))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void create_withoutCuentaOrClaveActivacion_succeeds() {
        when(tipoLicenciaRepository.findById(1L)).thenReturn(Optional.of(tipoLicencia()));
        when(tipoBienRepository.findById(1L)).thenReturn(Optional.of(tipoBien()));
        when(repository.save(any(Licencia.class))).thenAnswer(inv -> inv.getArgument(0));

        LicenciaRequest request = sampleRequest();
        request.setCuentaActivacion(null);
        request.setClaveActivacion(null);

        Licencia result = service.create(request);

        assertThat(result.getCuentaActivacion()).isNull();
        assertThat(result.getClaveActivacion()).isNull();
    }

    @Test
    void update_modifiesExistingLicencia() {
        when(repository.findById(1L)).thenReturn(Optional.of(existingLicencia()));
        when(tipoLicenciaRepository.findById(1L)).thenReturn(Optional.of(tipoLicencia()));
        when(tipoBienRepository.findById(1L)).thenReturn(Optional.of(tipoBien()));
        when(repository.save(any(Licencia.class))).thenAnswer(inv -> inv.getArgument(0));

        LicenciaRequest request = sampleRequest();
        request.setCantidad(10);

        Licencia result = service.update(1L, request);

        assertThat(result.getCantidad()).isEqualTo(10);
    }

    @Test
    void delete_removesExistingLicencia() {
        Licencia existing = existingLicencia();
        when(repository.findById(1L)).thenReturn(Optional.of(existing));

        service.delete(1L);

        verify(repository).delete(existing);
    }
}
