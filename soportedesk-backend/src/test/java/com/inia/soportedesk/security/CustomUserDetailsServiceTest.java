package com.inia.soportedesk.security;

import com.inia.soportedesk.auth.Rol;
import com.inia.soportedesk.auth.Usuario;
import com.inia.soportedesk.auth.UsuarioRepository;
import com.inia.soportedesk.auth.Permiso;
import com.inia.soportedesk.auth.PermisoRepository;
import com.inia.soportedesk.auth.NivelPermiso;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CustomUserDetailsServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private PermisoRepository permisoRepository;

    @InjectMocks
    private CustomUserDetailsService userDetailsService;

    @Test
    void loadUserByUsername_returnsUserDetailsWithRole() {
        Usuario usuario = new Usuario(1L, "jperez", "hashed", "Juan Perez", Rol.ADMIN, true);
        when(usuarioRepository.findByUsername("jperez")).thenReturn(Optional.of(usuario));
        when(permisoRepository.findByUsuario(usuario)).thenReturn(List.of());

        UserDetails userDetails = userDetailsService.loadUserByUsername("jperez");

        assertThat(userDetails.getUsername()).isEqualTo("jperez");
        assertThat(userDetails.getPassword()).isEqualTo("hashed");
        assertThat(userDetails.getAuthorities())
                .extracting(Object::toString)
                .containsExactly("ROLE_ADMIN");
    }

    @Test
    void loadUserByUsername_addsCurrentPermissionsFromDatabase() {
        Usuario usuario = new Usuario(2L, "soporte01", "hashed", "Soporte Uno", Rol.SOPORTE, true);
        Permiso licencias = permiso(usuario, "licencias", NivelPermiso.EDIT);
        Permiso auditoria = permiso(usuario, "auditoria", NivelPermiso.VIEW);
        when(usuarioRepository.findByUsername("soporte01")).thenReturn(Optional.of(usuario));
        when(permisoRepository.findByUsuario(usuario)).thenReturn(List.of(licencias, auditoria));

        UserDetails userDetails = userDetailsService.loadUserByUsername("soporte01");

        assertThat(userDetails.getAuthorities())
                .extracting(Object::toString)
                .containsExactlyInAnyOrder("ROLE_SOPORTE", "READ_licencias", "WRITE_licencias", "READ_auditoria");
    }

    @Test
    void loadUserByUsername_throwsWhenNotFound() {
        when(usuarioRepository.findByUsername("nope")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userDetailsService.loadUserByUsername("nope"))
                .isInstanceOf(UsernameNotFoundException.class);
    }

    private Permiso permiso(Usuario usuario, String modulo, NivelPermiso nivel) {
        Permiso permiso = new Permiso();
        permiso.setUsuario(usuario);
        permiso.setModulo(modulo);
        permiso.setNivel(nivel);
        return permiso;
    }
}
