package com.inia.soportedesk.auth;

import com.inia.soportedesk.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

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

    private void setPermisos(Usuario u, Map<String, String> permisos) {
        permisoRepository.deleteByUsuario(u);
        permisoRepository.flush();

        if (permisos == null) {
            return;
        }
        Map<String, NivelPermiso> normalizados = new LinkedHashMap<>();
        for (Map.Entry<String, String> entry : permisos.entrySet()) {
            String modulo = entry.getKey();
            if (modulo == null || modulo.isBlank() || !Modulos.VALIDOS.contains(modulo)) {
                throw new IllegalArgumentException("Modulo de permiso invalido: " + modulo);
            }
            NivelPermiso nivel = Modulos.SOLO_VISTA.contains(modulo)
                    ? NivelPermiso.VIEW
                    : parseNivel(entry.getValue());
            normalizados.put(modulo, nivel);
        }

        if (normalizados.containsKey("solicitar-vpn")
                || normalizados.containsKey("aprobar-vpn")
                || normalizados.containsKey("credenciales-vpn")) {
            normalizados.putIfAbsent("vpn", NivelPermiso.VIEW);
        }

        for (Map.Entry<String, NivelPermiso> entry : normalizados.entrySet()) {
            Permiso p = new Permiso();
            p.setUsuario(u);
            p.setModulo(entry.getKey());
            p.setNivel(entry.getValue());
            permisoRepository.save(p);
        }
    }

    private NivelPermiso parseNivel(String value) {
        try {
            return NivelPermiso.valueOf(value);
        } catch (IllegalArgumentException | NullPointerException ex) {
            throw new IllegalArgumentException("Nivel de permiso invalido: " + value);
        }
    }

    private UsuarioSistemaResponse toResponse(Usuario u) {
        Map<String, String> permisos = permisoRepository.findByUsuario(u).stream()
                .collect(Collectors.toMap(Permiso::getModulo, p -> p.getNivel().name()));
        return new UsuarioSistemaResponse(u.getId(), u.getUsername(), u.getNombre(),
                u.getRol().name(), u.isActivo(), permisos);
    }

    private Usuario getUsuario(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado: " + id));
    }
}
