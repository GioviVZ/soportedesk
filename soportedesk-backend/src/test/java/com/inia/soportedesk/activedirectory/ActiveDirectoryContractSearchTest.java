package com.inia.soportedesk.activedirectory;

import com.inia.soportedesk.activedirectory.config.LdapContextFactory;
import com.inia.soportedesk.activedirectory.dto.AdUserSearchResult;
import com.inia.soportedesk.auditoria.MovimientoAuditoriaService;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.ArgumentMatchers.nullable;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ActiveDirectoryContractSearchTest {

    @Mock private LdapContextFactory contextFactory;
    @Mock private MovimientoAuditoriaService auditoriaService;
    @Mock private HttpServletRequest request;
    @Mock private AdUsuarioCacheRepository cacheRepository;
    @Mock private AdCacheMetadataRepository metadataRepository;
    @Mock private AdSyncJobStatus jobStatus;
    @Mock private ApplicationEventPublisher eventPublisher;
    @Mock private UsuarioRedContratoRepository contratoRepository;

    @InjectMocks private ActiveDirectoryService service;

    @Test
    void buscarUsuarios_encuentraCuentaPorNombreRegistradoEnContrato() {
        AdUsuarioCache usuario = new AdUsuarioCache();
        usuario.setSamAccountName("mrojas");
        usuario.setDisplayName("Cuenta de servicio M. Rojas");
        usuario.setEnabled(true);

        when(cacheRepository.search(
                nullable(String.class), nullable(String.class), nullable(String.class), nullable(String.class),
                nullable(String.class), nullable(Boolean.class), nullable(Boolean.class), any(Pageable.class)))
                .thenReturn(List.of());
        when(contratoRepository.findUsuariosForDirectorySearch(
                nullable(String.class), nullable(String.class), any(Pageable.class)))
                .thenReturn(List.of("mrojas"));
        when(cacheRepository.findFirstBySamAccountNameIgnoreCase("mrojas"))
                .thenReturn(Optional.of(usuario));

        AdUserSearchResult result = service.buscarUsuarios(
                "Maria Elena Rojas", null, null, null, null, "all");

        assertThat(result.items()).singleElement()
                .extracting(item -> item.samAccountName())
                .isEqualTo("mrojas");
    }

    @Test
    void buscarUsuarios_combinaPrimerNombreYApellidoAunqueNoSeanContiguos() {
        AdUsuarioCache usuario = new AdUsuarioCache();
        usuario.setSamAccountName("mrojas");
        usuario.setDisplayName("Cuenta M. Rojas");
        usuario.setEnabled(true);

        when(cacheRepository.search(
                nullable(String.class), nullable(String.class), nullable(String.class), nullable(String.class),
                nullable(String.class), nullable(Boolean.class), nullable(Boolean.class), any(Pageable.class)))
                .thenReturn(List.of());
        when(contratoRepository.findUsuariosForDirectorySearch(
                eq("Maria Rojas"), isNull(), any(Pageable.class))).thenReturn(List.of());
        when(contratoRepository.findUsuariosForDirectorySearch(
                eq("Maria"), isNull(), any(Pageable.class))).thenReturn(List.of("mrojas", "mlopez"));
        when(contratoRepository.findUsuariosForDirectorySearch(
                eq("Rojas"), isNull(), any(Pageable.class))).thenReturn(List.of("mrojas"));
        when(cacheRepository.findFirstBySamAccountNameIgnoreCase("mrojas"))
                .thenReturn(Optional.of(usuario));

        AdUserSearchResult result = service.buscarUsuarios(
                "Maria Rojas", null, null, null, null, "all");

        assertThat(result.items()).extracting(item -> item.samAccountName())
                .containsExactly("mrojas");
    }
}
