package com.inia.soportedesk.auth;

import com.inia.soportedesk.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class UsuarioSistemaService {

    private final UsuarioRepository usuarioRepository;
    private final PermisoRepository permisoRepository;
    private final PasswordEncoder passwordEncoder;

    public List<UsuarioSistemaResponse> findAll() {
        return usuarioRepository.findAll().stream()
                .filter(u -> u.getRol() == Rol.SOPORTE)
                .map(this::toResponse)
                .toList();
    }

    public UsuarioSistemaResponse findById(Long id) {
        return toResponse(getUsuario(id));
    }

    @Transactional
    public UsuarioSistemaResponse create(UsuarioSistemaRequest request) {
        if (usuarioRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new IllegalArgumentException("El username '" + request.getUsername() + "' ya está en uso");
        }
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new IllegalArgumentException("La contraseña es obligatoria al crear un usuario");
        }
        Usuario u = new Usuario();
        u.setUsername(request.getUsername());
        u.setNombre(request.getNombre());
        u.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        u.setRol(Rol.SOPORTE);
        u.setActivo(request.isActivo());
        usuarioRepository.save(u);
        setPermisos(u, request.getPermisos());
        return toResponse(u);
    }

    @Transactional
    public UsuarioSistemaResponse update(Long id, UsuarioSistemaRequest request) {
        Usuario u = getUsuario(id);
        u.setNombre(request.getNombre());
        u.setActivo(request.isActivo());
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            u.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }
        usuarioRepository.save(u);
        setPermisos(u, request.getPermisos());
        return toResponse(u);
    }

    @Transactional
    public void delete(Long id) {
        Usuario u = getUsuario(id);
        permisoRepository.deleteByUsuario(u);
        usuarioRepository.delete(u);
    }

    private void setPermisos(Usuario u, List<String> modulos) {
        permisoRepository.deleteByUsuario(u);
        permisoRepository.flush();

        for (String modulo : normalizePermisos(modulos)) {
            Permiso p = new Permiso();
            p.setUsuario(u);
            p.setModulo(modulo);
            permisoRepository.save(p);
        }
    }

    private Set<String> normalizePermisos(List<String> modulos) {
        Set<String> normalized = new LinkedHashSet<>();
        if (modulos == null) {
            return normalized;
        }
        modulos.stream()
                .filter(modulo -> modulo != null && !modulo.isBlank())
                .map(String::trim)
                .forEach(normalized::add);
        return normalized;
    }

    private UsuarioSistemaResponse toResponse(Usuario u) {
        List<String> permisos = permisoRepository.findByUsuario(u).stream()
                .map(Permiso::getModulo)
                .toList();
        return new UsuarioSistemaResponse(u.getId(), u.getUsername(), u.getNombre(),
                u.getRol().name(), u.isActivo(), permisos);
    }

    private Usuario getUsuario(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado: " + id));
    }
}
