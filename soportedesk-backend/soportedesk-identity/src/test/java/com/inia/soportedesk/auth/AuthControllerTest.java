package com.inia.soportedesk.auth;

import com.inia.soportedesk.auditoria.MovimientoAuditoriaService;
import com.inia.soportedesk.security.JwtService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private PermisoRepository permisoRepository;

    @Mock
    private JwtService jwtService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private MovimientoAuditoriaService auditoriaService;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private AuthController controller;

    private Usuario usuario;

    @BeforeEach
    void setUp() {
        usuario = new Usuario();
        usuario.setId(1L);
        usuario.setUsername("admin");
        usuario.setPasswordHash("hashedOld");
        usuario.setNombre("Administrador");
        usuario.setRol(Rol.ADMIN);
        usuario.setActivo(true);

        org.mockito.Mockito.lenient().when(authentication.getName()).thenReturn("admin");
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void cambiarPassword_withCorrectCurrentPassword_updatesHash() {
        when(usuarioRepository.findByUsername("admin")).thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches("old123", "hashedOld")).thenReturn(true);
        when(passwordEncoder.encode("newpass1")).thenReturn("hashedNew");

        CambiarPasswordRequest request = new CambiarPasswordRequest();
        request.setPasswordActual("old123");
        request.setPasswordNueva("newpass1");

        ResponseEntity<Void> response = controller.cambiarPassword(request);

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(usuario.getPasswordHash()).isEqualTo("hashedNew");
        verify(usuarioRepository).save(usuario);
    }

    @Test
    void cambiarPassword_withIncorrectCurrentPassword_throwsBadCredentialsException() {
        when(usuarioRepository.findByUsername("admin")).thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches("wrong", "hashedOld")).thenReturn(false);

        CambiarPasswordRequest request = new CambiarPasswordRequest();
        request.setPasswordActual("wrong");
        request.setPasswordNueva("newpass1");

        assertThatThrownBy(() -> controller.cambiarPassword(request))
                .isInstanceOf(BadCredentialsException.class);

        verify(usuarioRepository, never()).save(usuario);
    }

    @Test
    void login_returnsPermisosAsModuloNivelMap() {
        Usuario soporte = new Usuario();
        soporte.setId(2L);
        soporte.setUsername("soporte01");
        soporte.setPasswordHash("hash");
        soporte.setNombre("Soporte Uno");
        soporte.setRol(Rol.SOPORTE);
        soporte.setActivo(true);

        Permiso editLicencias = new Permiso();
        editLicencias.setUsuario(soporte);
        editLicencias.setModulo("licencias");
        editLicencias.setNivel(NivelPermiso.EDIT);

        Permiso viewAuditoria = new Permiso();
        viewAuditoria.setUsuario(soporte);
        viewAuditoria.setModulo("auditoria");
        viewAuditoria.setNivel(NivelPermiso.VIEW);

        when(usuarioRepository.findByUsername("soporte01")).thenReturn(Optional.of(soporte));
        when(permisoRepository.findByUsuario(soporte)).thenReturn(List.of(editLicencias, viewAuditoria));
        when(jwtService.generateToken(eq("soporte01"), eq("SOPORTE"), any())).thenReturn("fake-token");

        LoginRequest request = new LoginRequest();
        request.setUsername("soporte01");
        request.setPassword("secret");

        ResponseEntity<?> response = controller.login(request);

        AuthResponse body = (AuthResponse) response.getBody();
        assertThat(body.getPermisos()).containsEntry("licencias", "EDIT");
        assertThat(body.getPermisos()).containsEntry("auditoria", "VIEW");
    }
}
