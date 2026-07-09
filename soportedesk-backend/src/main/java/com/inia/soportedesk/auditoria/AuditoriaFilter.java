package com.inia.soportedesk.auditoria;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
@RequiredArgsConstructor
public class AuditoriaFilter extends OncePerRequestFilter {

    private static final Set<String> AUDITED_METHODS = Set.of("POST", "PUT", "DELETE");
    private static final Pattern LAST_NUMERIC_SEGMENT = Pattern.compile(".*/(\\d+)(?:/.*)?$");

    private final MovimientoAuditoriaService auditoriaService;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {
        filterChain.doFilter(request, response);

        if (!shouldAudit(request, response)) {
            return;
        }

        try {
            String path = request.getRequestURI();
            auditoriaService.registrar(
                    currentUsername(),
                    actionFor(request.getMethod()),
                    moduleFrom(path),
                    request.getMethod(),
                    path,
                    entityIdFrom(path),
                    response.getStatus(),
                    clientIp(request),
                    request.getMethod() + " " + path
            );
        } catch (RuntimeException ignored) {
            // La auditoria no debe interrumpir la respuesta principal.
        }
    }

    private boolean shouldAudit(HttpServletRequest request, HttpServletResponse response) {
        String path = request.getRequestURI();
        return path.startsWith("/api/")
                && !path.startsWith("/api/auditoria")
                && !path.startsWith("/api/active-directory")
                && !path.equals("/api/auth/login")
                && AUDITED_METHODS.contains(request.getMethod())
                && response.getStatus() < 400;
    }

    private String currentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            return "sistema";
        }
        return authentication.getName();
    }

    private String actionFor(String method) {
        return switch (method) {
            case "POST" -> "CREAR";
            case "PUT" -> "ACTUALIZAR";
            case "DELETE" -> "ELIMINAR";
            default -> method;
        };
    }

    private String moduleFrom(String path) {
        String withoutApi = path.replaceFirst("^/api/", "");
        int slash = withoutApi.indexOf('/');
        return slash >= 0 ? withoutApi.substring(0, slash) : withoutApi;
    }

    private String entityIdFrom(String path) {
        Matcher matcher = LAST_NUMERIC_SEGMENT.matcher(path);
        return matcher.matches() ? matcher.group(1) : null;
    }

    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
