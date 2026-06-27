package com.inia.soportedesk.auth;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UsuarioSistemaServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private PermisoRepository permisoRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UsuarioSistemaService service;

    private UsuarioSistemaRequest baseRequest(Map<String, String> permisos) {
        UsuarioSistemaRequest request = new UsuarioSistemaRequest();
        request.setUsername("soporte01");
        request.setNombre("Soporte Uno");
        request.setPassword("secret123");
        request.setActivo(true);
        request.setPermisos(permisos);
        return request;
    }

    @Test
    void create_withUnknownModulo_throwsIllegalArgumentException() {
        when(usuarioRepository.findByUsername("soporte01")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(any())).thenReturn("hashed");

        UsuarioSistemaRequest request = baseRequest(Map.of("modulo-inexistente", "EDIT"));

        assertThatThrownBy(() -> service.create(request))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void create_withInvalidNivel_throwsIllegalArgumentException() {
        when(usuarioRepository.findByUsername("soporte01")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(any())).thenReturn("hashed");

        UsuarioSistemaRequest request = baseRequest(Map.of("licencias", "DELETE"));

        assertThatThrownBy(() -> service.create(request))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void create_withSoloVistaModuloRequestedAsEdit_persistsAsView() {
        when(usuarioRepository.findByUsername("soporte01")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(any())).thenReturn("hashed");

        UsuarioSistemaRequest request = baseRequest(Map.of("auditoria", "EDIT"));

        service.create(request);

        ArgumentCaptor<Permiso> captor = ArgumentCaptor.forClass(Permiso.class);
        verify(permisoRepository, times(1)).save(captor.capture());
        assertThat(captor.getValue().getModulo()).isEqualTo("auditoria");
        assertThat(captor.getValue().getNivel()).isEqualTo(NivelPermiso.VIEW);
    }

    @Test
    void create_withValidEditModulo_persistsRequestedNivel() {
        when(usuarioRepository.findByUsername("soporte01")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(any())).thenReturn("hashed");

        UsuarioSistemaRequest request = baseRequest(Map.of("licencias", "EDIT"));

        service.create(request);

        ArgumentCaptor<Permiso> captor = ArgumentCaptor.forClass(Permiso.class);
        verify(permisoRepository).save(captor.capture());
        assertThat(captor.getValue().getModulo()).isEqualTo("licencias");
        assertThat(captor.getValue().getNivel()).isEqualTo(NivelPermiso.EDIT);
    }
}
