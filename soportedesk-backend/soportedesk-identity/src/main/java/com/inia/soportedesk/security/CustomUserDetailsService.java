package com.inia.soportedesk.security;

import com.inia.soportedesk.auth.Usuario;
import com.inia.soportedesk.auth.Permiso;
import com.inia.soportedesk.auth.PermisoRepository;
import com.inia.soportedesk.auth.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.ArrayList;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;
    private final PermisoRepository permisoRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Usuario usuario = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado: " + username));
        List<GrantedAuthority> authorities = new ArrayList<>();
        authorities.add(new SimpleGrantedAuthority("ROLE_" + usuario.getRol().name()));
        for (Permiso permiso : permisoRepository.findByUsuario(usuario)) {
            authorities.add(new SimpleGrantedAuthority("READ_" + permiso.getModulo()));
            if ("EDIT".equals(permiso.getNivel().name())) {
                authorities.add(new SimpleGrantedAuthority("WRITE_" + permiso.getModulo()));
            }
        }

        return new User(
                usuario.getUsername(),
                usuario.getPasswordHash(),
                usuario.isActivo(),
                true, true, true,
                authorities
        );
    }
}
