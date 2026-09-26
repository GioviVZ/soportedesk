package com.inia.soportedesk.activedirectory;

import com.inia.soportedesk.activedirectory.config.LdapContextFactory;
import com.inia.soportedesk.activedirectory.dto.AdUserSearchResult;
import com.inia.soportedesk.auditoria.MovimientoAuditoriaService;
import com.inia.soportedesk.catalogo.Dependencia;
import com.inia.soportedesk.catalogo.DependenciaRepository;
import com.inia.soportedesk.catalogo.Subdependencia;
import com.inia.soportedesk.catalogo.SubdependenciaRepository;
import com.inia.soportedesk.usuariosred.contrato.UsuarioRedContratoRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.nullable;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ActiveDirectoryOrganizationalFilterTest {

    @Mock private LdapContextFactory contextFactory;
    @Mock private MovimientoAuditoriaService auditoriaService;
    @Mock private HttpServletRequest request;
    @Mock private AdUsuarioCacheRepository cacheRepository;
    @Mock private AdCacheMetadataRepository metadataRepository;
    @Mock private AdSyncJobStatus jobStatus;
    @Mock private ApplicationEventPublisher eventPublisher;
    @Mock private UsuarioRedContratoRepository contratoRepository;
    @Mock private DependenciaRepository dependenciaRepository;
    @Mock private SubdependenciaRepository subdependenciaRepository;

    @InjectMocks private ActiveDirectoryService service;

    @Test
    void buscarUsuarios_filtraPorDependenciaConFallbackADepartment() {
        Long dependenciaId = 37L;
        Dependencia dependencia = new Dependencia();
        dependencia.setNombre("Direccion de Recursos Geneticos y Biotecnologia");

        when(dependenciaRepository.findById(dependenciaId)).thenReturn(Optional.of(dependencia));
        when(cacheRepository.search(
                nullable(String.class), nullable(String.class), nullable(String.class), nullable(String.class),
                nullable(String.class), nullable(Boolean.class), nullable(Boolean.class), any(Pageable.class)))
                .thenReturn(List.of(
                        cachedUser("usuario.drgb", "Dirección de Recursos Genéticos y Biotecnología", "Valor sin coincidencia"),
                        cachedUser("usuario.oa", "Oficina de Administración", "Oficina de Administración")));

        AdUserSearchResult result = service.buscarUsuarios(
                null, null, null, null, null, "all", null, dependenciaId, null);

        assertThat(result.items()).singleElement()
                .extracting(item -> item.samAccountName())
                .isEqualTo("usuario.drgb");
    }

    @Test
    void buscarUsuarios_filtraPorSubdependenciaSdb() {
        Long subdependenciaId = 18L;
        Subdependencia subdependencia = new Subdependencia();
        subdependencia.setNombre("Sub-Direccion de Biotecnologia");

        when(subdependenciaRepository.findById(subdependenciaId)).thenReturn(Optional.of(subdependencia));
        when(cacheRepository.search(
                nullable(String.class), nullable(String.class), nullable(String.class), nullable(String.class),
                nullable(String.class), nullable(Boolean.class), nullable(Boolean.class), any(Pageable.class)))
                .thenReturn(List.of(
                        cachedUser("usuario.sdb", "Sub Dirección de Biotecnología", "Dirección de Recursos Genéticos"),
                        cachedUser("usuario.drgb", "Dirección de Recursos Genéticos", "Dirección de Recursos Genéticos")));

        AdUserSearchResult result = service.buscarUsuarios(
                null, null, null, null, null, "all", null, null, subdependenciaId);

        assertThat(result.items()).singleElement()
                .extracting(item -> item.samAccountName())
                .isEqualTo("usuario.sdb");
    }

    @Test
    void buscarUsuarios_dependenciaSinNombreNoConsultaCache() {
        Long dependenciaId = 38L;
        Dependencia dependencia = new Dependencia();
        dependencia.setNombre(null);

        when(dependenciaRepository.findById(dependenciaId)).thenReturn(Optional.of(dependencia));

        AdUserSearchResult result = service.buscarUsuarios(
                null, null, null, null, null, "all", null, dependenciaId, null);

        assertThat(result.items()).isEmpty();
        verify(cacheRepository, never()).search(any(), any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    void buscarUsuarios_conIdInexistenteNoConsultaCache() {
        Long subdependenciaId = 9999L;
        when(subdependenciaRepository.findById(subdependenciaId)).thenReturn(Optional.empty());

        AdUserSearchResult result = service.buscarUsuarios(
                null, null, null, null, null, "all", null, null, subdependenciaId);

        assertThat(result.items()).isEmpty();
        verify(cacheRepository, never()).search(any(), any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    void buscarUsuarios_filtraPorSedeUsandoNombreDeDependencia() {
        Long sedeId = 5L;
        Dependencia dependencia = new Dependencia();
        dependencia.setNombre("Estación Experimental Agraria Donoso");

        when(dependenciaRepository.findBySedeId(sedeId)).thenReturn(List.of(dependencia));
        when(cacheRepository.search(
                nullable(String.class), nullable(String.class), nullable(String.class), nullable(String.class),
                nullable(String.class), nullable(Boolean.class), nullable(Boolean.class), any(Pageable.class)))
                .thenReturn(List.of(
                        cachedUser("usuario.donoso", "Otra unidad", "ESTACION EXPERIMENTAL AGRARIA DONOSO"),
                        cachedUser("usuario.central", "Unidad Central", "Sede Central")));

        AdUserSearchResult result = service.buscarUsuarios(
                null, null, null, null, null, "all", sedeId, null, null);

        assertThat(result.items()).singleElement()
                .extracting(item -> item.samAccountName())
                .isEqualTo("usuario.donoso");
    }

    @Test
    void buscarUsuarios_filtraPendientesSinCoincidenciaEnCatalogo() {
        Dependencia dependencia = new Dependencia();
        dependencia.setNombre("Oficina de Administración");
        Subdependencia subdependencia = new Subdependencia();
        subdependencia.setNombre("Unidad de Abastecimiento");

        when(dependenciaRepository.findAll()).thenReturn(List.of(dependencia));
        when(subdependenciaRepository.findAll()).thenReturn(List.of(subdependencia));
        when(cacheRepository.search(
                nullable(String.class), nullable(String.class), nullable(String.class), nullable(String.class),
                nullable(String.class), nullable(Boolean.class), nullable(Boolean.class), any(Pageable.class)))
                .thenReturn(List.of(
                        cachedUser("usuario.dependencia", "Sin coincidencia", "Oficina de Administracion"),
                        cachedUser("usuario.subdependencia", "Unidad de Abastecimiento", "Otro valor"),
                        cachedUser("usuario.pendiente", "Area desconocida", "Empresa desconocida")));

        AdUserSearchResult result = service.buscarUsuarios(
                null, null, null, null, null, "all", -1L, null, null);

        assertThat(result.items()).singleElement()
                .extracting(item -> item.samAccountName())
                .isEqualTo("usuario.pendiente");
    }

    private static AdUsuarioCache cachedUser(String samAccountName, String department, String company) {
        AdUsuarioCache user = new AdUsuarioCache();
        user.setSamAccountName(samAccountName);
        user.setDisplayName(samAccountName);
        user.setDepartment(department);
        user.setCompany(company);
        user.setEnabled(true);
        return user;
    }
}
