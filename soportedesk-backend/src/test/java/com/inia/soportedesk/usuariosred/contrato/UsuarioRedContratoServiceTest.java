package com.inia.soportedesk.usuariosred.contrato;

import com.inia.soportedesk.activedirectory.ActiveDirectoryService;
import com.inia.soportedesk.activedirectory.AdUsuarioCache;
import com.inia.soportedesk.activedirectory.AdUsuarioCacheRepository;
import com.inia.soportedesk.catalogo.TipoContrato;
import com.inia.soportedesk.catalogo.TipoContratoRepository;
import com.inia.soportedesk.exception.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UsuarioRedContratoServiceTest {

    @Mock
    private UsuarioRedContratoRepository repository;

    @Mock
    private TipoContratoRepository tipoContratoRepository;

    @Mock
    private AdUsuarioCacheRepository adUsuarioCacheRepository;

    @Mock
    private ActiveDirectoryService activeDirectoryService;

    @InjectMocks
    private UsuarioRedContratoService service;

    private final TipoContrato tipoContrato = new TipoContrato(1L, "OS");

    private AdUsuarioCache sampleAdUsuario(String sam, String displayName, String office) {
        AdUsuarioCache user = new AdUsuarioCache();
        user.setSamAccountName(sam);
        user.setDisplayName(displayName);
        user.setOffice(office);
        user.setEnabled(true);
        return user;
    }

    private UsuarioRedContratoRequest sampleRequest() {
        UsuarioRedContratoRequest request = new UsuarioRedContratoRequest();
        request.setUsuario("jperez");
        request.setTipoContratoId(1L);
        request.setFechaInicio(LocalDate.of(2026, 1, 1));
        request.setFechaFin(LocalDate.of(2026, 12, 31));
        request.setNumeroContrato("OS-001-2026");
        request.setPersonalNombre("Juan");
        request.setPersonalApellidos("Pérez");
        return request;
    }

    private UsuarioRedContrato sampleEntity() {
        UsuarioRedContrato contrato = new UsuarioRedContrato();
        contrato.setId(1L);
        contrato.setUsuario("jperez");
        contrato.setTipoContrato(tipoContrato);
        contrato.setFechaInicio(LocalDate.of(2026, 1, 1));
        contrato.setFechaFin(LocalDate.of(2026, 12, 31));
        contrato.setNumeroContrato("OS-001-2026");
        contrato.setPersonalNombre("Juan");
        contrato.setPersonalApellidos("Pérez");
        return contrato;
    }

    @Test
    void create_setsRegistradoPorAndFechaRegistro() {
        when(activeDirectoryService.buscarUsuarioCacheadoORefrescar("jperez"))
                .thenReturn(Optional.of(sampleAdUsuario("jperez", "Juan Perez", null)));
        when(tipoContratoRepository.findById(1L)).thenReturn(Optional.of(tipoContrato));
        when(repository.save(any(UsuarioRedContrato.class))).thenAnswer(inv -> inv.getArgument(0));

        UsuarioRedContratoDto result = service.create(sampleRequest(), "admin");

        assertThat(result.getUsuario()).isEqualTo("jperez");
        assertThat(result.getTipoContratoNombre()).isEqualTo("OS");
        assertThat(result.getRegistradoPor()).isEqualTo("admin");
        assertThat(result.getFechaRegistro()).isNotNull();
    }

    @Test
    void create_tipoContratoNotFound_throwsResourceNotFoundException() {
        when(activeDirectoryService.buscarUsuarioCacheadoORefrescar("jperez"))
                .thenReturn(Optional.of(sampleAdUsuario("jperez", "Juan Perez", null)));
        when(tipoContratoRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.create(sampleRequest(), "admin"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void create_fechaFinBeforeFechaInicio_throwsIllegalArgumentException() {
        UsuarioRedContratoRequest request = sampleRequest();
        request.setFechaFin(LocalDate.of(2025, 1, 1));

        assertThatThrownBy(() -> service.create(request, "admin"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void update_setsActualizadoPorAndFechaActualizacion_leavesRegistradoPorUnchanged() {
        UsuarioRedContrato existing = sampleEntity();
        existing.setRegistradoPor("soporte1");
        when(repository.findById(1L)).thenReturn(Optional.of(existing));
        when(activeDirectoryService.buscarUsuarioCacheadoORefrescar("jperez"))
                .thenReturn(Optional.of(sampleAdUsuario("jperez", "Juan Perez", null)));
        when(tipoContratoRepository.findById(1L)).thenReturn(Optional.of(tipoContrato));
        when(repository.save(any(UsuarioRedContrato.class))).thenAnswer(inv -> inv.getArgument(0));

        UsuarioRedContratoDto result = service.update(1L, sampleRequest(), "admin");

        assertThat(result.getActualizadoPor()).isEqualTo("admin");
        assertThat(result.getFechaActualizacion()).isNotNull();
        assertThat(result.getRegistradoPor()).isEqualTo("soporte1");
    }

    @Test
    void findByUsuario_mapsTipoContratoNombre() {
        when(repository.findByUsuarioIgnoreCaseOrderByFechaInicioDesc("jperez"))
                .thenReturn(List.of(sampleEntity()));

        List<UsuarioRedContratoDto> result = service.findByUsuario("jperez");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTipoContratoNombre()).isEqualTo("OS");
    }

    @Test
    void searchByPersonal_delegatesToRepository() {
        when(repository.searchByPersonal("Juan")).thenReturn(List.of(sampleEntity()));

        List<UsuarioRedContratoDto> result = service.searchByPersonal("Juan");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getPersonalNombre()).isEqualTo("Juan");
    }

    @Test
    void delete_removesExistingContrato() {
        UsuarioRedContrato contrato = sampleEntity();
        when(repository.findById(1L)).thenReturn(Optional.of(contrato));

        service.delete(1L);

        org.mockito.Mockito.verify(repository).delete(contrato);
    }

    @Test
    void searchConsultas_nullTerm_returnsUnionOfAdCacheAndOrphanContratosSortedByName() {
        AdUsuarioCache beatriz = sampleAdUsuario("bgomez", "Beatriz Gomez", "Direccion General");
        AdUsuarioCache ana = sampleAdUsuario("acruz", "Ana Cruz", "Informatica");
        when(adUsuarioCacheRepository.findAll()).thenReturn(List.of(beatriz, ana));

        UsuarioRedContrato orphan = new UsuarioRedContrato();
        orphan.setUsuario("dperez");
        orphan.setPersonalNombre("David");
        orphan.setPersonalApellidos("Perez");
        orphan.setTipoContrato(tipoContrato);
        orphan.setFechaInicio(LocalDate.of(2026, 1, 1));
        when(repository.findAll()).thenReturn(List.of(orphan));

        when(repository.findByUsuarioIgnoreCaseOrderByFechaInicioDesc("bgomez")).thenReturn(List.of());
        when(repository.findByUsuarioIgnoreCaseOrderByFechaInicioDesc("acruz")).thenReturn(List.of());
        when(repository.findByUsuarioIgnoreCaseOrderByFechaInicioDesc("dperez")).thenReturn(List.of(orphan));

        List<UsuarioRedConsultaDto> result = service.searchConsultas(null);

        assertThat(result).hasSize(3);
        assertThat(result.get(0).getDisplayName()).isEqualTo("Ana Cruz");
        assertThat(result.get(1).getDisplayName()).isEqualTo("Beatriz Gomez");
        assertThat(result.get(2).getDisplayName()).isEqualTo("David Perez");
    }

    @Test
    void searchConsultas_blankTerm_alsoDelegatesToListarTodos() {
        AdUsuarioCache beatriz = sampleAdUsuario("bgomez", "Beatriz Gomez", "Direccion General");
        when(adUsuarioCacheRepository.findAll()).thenReturn(List.of(beatriz));
        when(repository.findAll()).thenReturn(List.of());
        when(repository.findByUsuarioIgnoreCaseOrderByFechaInicioDesc("bgomez")).thenReturn(List.of());

        List<UsuarioRedConsultaDto> resultBlank = service.searchConsultas("");
        List<UsuarioRedConsultaDto> resultWhitespace = service.searchConsultas("   ");

        assertThat(resultBlank).hasSize(1);
        assertThat(resultWhitespace).hasSize(1);
    }

    @Test
    void listarTodos_dedupesWhenContratoUsuarioMatchesAdCacheSamAccountName_caseInsensitive() {
        AdUsuarioCache jperez = sampleAdUsuario("jperez", "Juan Perez", "Informatica");
        when(adUsuarioCacheRepository.findAll()).thenReturn(List.of(jperez));

        UsuarioRedContrato contrato = new UsuarioRedContrato();
        contrato.setUsuario("JPEREZ");
        contrato.setTipoContrato(tipoContrato);
        contrato.setFechaInicio(LocalDate.of(2026, 1, 1));
        when(repository.findAll()).thenReturn(List.of(contrato));
        when(repository.findByUsuarioIgnoreCaseOrderByFechaInicioDesc("jperez")).thenReturn(List.of(contrato));

        List<UsuarioRedConsultaDto> result = service.searchConsultas(null);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getContratos()).hasSize(1);
    }

    @Test
    void listarTodos_officeNullOnAdCacheRow_isPassedThroughAsNull() {
        AdUsuarioCache user = sampleAdUsuario("sinoficina", "Sin Oficina", null);
        when(adUsuarioCacheRepository.findAll()).thenReturn(List.of(user));
        when(repository.findAll()).thenReturn(List.of());
        when(repository.findByUsuarioIgnoreCaseOrderByFechaInicioDesc("sinoficina")).thenReturn(List.of());

        List<UsuarioRedConsultaDto> result = service.searchConsultas(null);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getOffice()).isNull();
    }
}
