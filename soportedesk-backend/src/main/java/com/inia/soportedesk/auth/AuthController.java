package com.inia.soportedesk.auth;

import com.inia.soportedesk.auditoria.MovimientoAuditoriaService;
import com.inia.soportedesk.exception.ResourceNotFoundException;
import com.inia.soportedesk.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UsuarioRepository usuarioRepository;
    private final PermisoRepository permisoRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final MovimientoAuditoriaService auditoriaService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));
        } catch (Exception ex) {
            auditoriaService.registrar(
                    request.getUsername(),
                    "LOGIN_FALLIDO",
                    "auth",
                    "POST",
                    "/api/auth/login",
                    null,
                    401,
                    null,
                    "Intento de inicio de sesion fallido"
            );
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Usuario o contraseña incorrectos"));
        }

        Usuario usuario = usuarioRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new IllegalStateException("Usuario autenticado no encontrado en BD"));

        List<String> permisos = permisoRepository.findByUsuario(usuario).stream()
                .map(Permiso::getModulo)
                .toList();

        String token = jwtService.generateToken(usuario.getUsername(), usuario.getRol().name(), permisos);
        auditoriaService.registrar(
                usuario.getUsername(),
                "LOGIN",
                "auth",
                "POST",
                "/api/auth/login",
                usuario.getId().toString(),
                200,
                null,
                "Inicio de sesion exitoso"
        );

        return ResponseEntity.ok(new AuthResponse(token, usuario.getUsername(), usuario.getNombre(), usuario.getRol().name(), permisos));
    }

    @GetMapping("/me")
    public ResponseEntity<AuthResponse> me() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Usuario usuario = usuarioRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario autenticado no encontrado en BD"));

        List<String> permisos = permisoRepository.findByUsuario(usuario).stream()
                .map(Permiso::getModulo)
                .toList();

        return ResponseEntity.ok(new AuthResponse(null, usuario.getUsername(), usuario.getNombre(), usuario.getRol().name(), permisos));
    }

    @PostMapping("/cambiar-password")
    public ResponseEntity<Void> cambiarPassword(@Valid @RequestBody CambiarPasswordRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Usuario usuario = usuarioRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario autenticado no encontrado en BD"));

        if (!passwordEncoder.matches(request.getPasswordActual(), usuario.getPasswordHash())) {
            throw new BadCredentialsException("La contraseña actual es incorrecta");
        }

        usuario.setPasswordHash(passwordEncoder.encode(request.getPasswordNueva()));
        usuarioRepository.save(usuario);

        return ResponseEntity.ok().build();
    }
}
