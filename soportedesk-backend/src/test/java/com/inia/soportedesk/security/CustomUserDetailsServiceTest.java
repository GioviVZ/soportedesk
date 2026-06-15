package com.inia.soportedesk.security;

import com.inia.soportedesk.auth.Rol;
import com.inia.soportedesk.auth.Usuario;
import com.inia.soportedesk.auth.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CustomUserDetailsServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @InjectMocks
    private CustomUserDetailsService userDetailsService;

    @Test
    void loadUserByUsername_returnsUserDetailsWithRole() {
        Usuario usuario = new Usuario(1L, "jperez", "hashed", "Juan Perez", Rol.ADMIN, true);
        when(usuarioRepository.findByUsername("jperez")).thenReturn(Optional.of(usuario));

        UserDetails userDetails = userDetailsService.loadUserByUsername("jperez");

        assertThat(userDetails.getUsername()).isEqualTo("jperez");
        assertThat(userDetails.getPassword()).isEqualTo("hashed");
        assertThat(userDetails.getAuthorities())
                .extracting(Object::toString)
                .containsExactly("ROLE_ADMIN");
    }

    @Test
    void loadUserByUsername_throwsWhenNotFound() {
        when(usuarioRepository.findByUsername("nope")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userDetailsService.loadUserByUsername("nope"))
                .isInstanceOf(UsernameNotFoundException.class);
    }
}
