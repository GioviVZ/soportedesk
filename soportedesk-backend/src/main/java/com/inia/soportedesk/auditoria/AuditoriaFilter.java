package com.inia.soportedesk.auditoria;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.inia.soportedesk.realtime.RealtimeEventService;
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
import org.springframework.web.util.ContentCachingRequestWrapper;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
@RequiredArgsConstructor
public class AuditoriaFilter extends OncePerRequestFilter {

    private static final Set<String> AUDITED_METHODS = Set.of("POST", "PUT", "PATCH", "DELETE");
    private static final Pattern LAST_NUMERIC_SEGMENT = Pattern.compile(".*/(\\d+)(?:/.*)?$");
    private static final Pattern SENSITIVE_FIELD = Pattern.compile(
            "(?i).*(password|contrasena|contraseña|token|secret|credencial|authorization|clave|api.?key|llave|pin).*");
    private static final Pattern FILE_FIELD = Pattern.compile(
            "(?i).*(archivo|adjunto|imagen|base64|contenidoBinario|file).*");
    private static final int MAX_CACHED_PAYLOAD = 32 * 1024;
    private static final int MAX_TEXT_VALUE = 120;
    private static final int MAX_ARRAY_VALUES = 20;

    private static final Map<String, String> MODULE_LABELS = Map.ofEntries(
            Map.entry("auth", "autenticación"),
            Map.entry("usuarios-red", "usuarios de red"),
            Map.entry("active-directory", "usuarios de red"),
            Map.entry("correos", "correos"),
            Map.entry("equipos", "equipos"),
            Map.entry("vpn", "VPN"),
            Map.entry("impresoras", "impresoras"),
            Map.entry("wifi", "WiFi"),
            Map.entry("licencias", "licencias"),
            Map.entry("usuarios-sistema", "usuarios del sistema"),
            Map.entry("catalogos", "configuración"),
            Map.entry("herramientas", "herramientas")
    );

    private final MovimientoAuditoriaService auditoriaService;
    private final RealtimeEventService realtimeEventService;
    private final ObjectMapper objectMapper;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {
        HttpServletRequest requestToUse = wrapForPayloadCapture(request);
        filterChain.doFilter(requestToUse, response);

        if (shouldPublish(requestToUse, response)) {
            String path = requestToUse.getRequestURI();
            realtimeEventService.publish(moduleFrom(path), actionFor(requestToUse.getMethod(), path),
                    entityIdFrom(path), currentUsername());
        }

        if (!shouldAudit(requestToUse, response)) {
            return;
        }

        try {
            String path = requestToUse.getRequestURI();
            String action = actionFor(requestToUse.getMethod(), path);
            auditoriaService.registrar(
                    currentUsername(),
                    action,
                    moduleFrom(path),
                    requestToUse.getMethod(),
                    path,
                    entityIdFrom(path),
                    response.getStatus(),
                    clientIp(requestToUse),
                    buildDetail(requestToUse, action, path)
            );
        } catch (RuntimeException ignored) {
            // La auditoria no debe interrumpir la respuesta principal.
        }
    }

    private HttpServletRequest wrapForPayloadCapture(HttpServletRequest request) {
        if (request instanceof ContentCachingRequestWrapper || !isAuditCandidate(request)) {
            return request;
        }

        String contentType = request.getContentType();
        if (contentType != null && contentType.toLowerCase(Locale.ROOT).startsWith("multipart/")) {
            return request;
        }
        return new ContentCachingRequestWrapper(request, MAX_CACHED_PAYLOAD);
    }

    private boolean isAuditCandidate(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.startsWith("/api/")
                && !path.startsWith("/api/auditoria")
                && (!path.startsWith("/api/active-directory")
                || path.equals("/api/active-directory/sync/iniciar"))
                && !path.equals("/api/auth/login")
                && AUDITED_METHODS.contains(request.getMethod());
    }

    private boolean shouldPublish(HttpServletRequest request, HttpServletResponse response) {
        String path = request.getRequestURI();
        return path.startsWith("/api/")
                && !path.startsWith("/api/realtime")
                && !path.equals("/api/auth/login")
                && AUDITED_METHODS.contains(request.getMethod())
                && response.getStatus() < 400;
    }

    private boolean shouldAudit(HttpServletRequest request, HttpServletResponse response) {
        return isAuditCandidate(request) && response.getStatus() < 400;
    }

    private String currentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            return "sistema";
        }
        return authentication.getName();
    }

    private String actionFor(String method, String path) {
        if (path.endsWith("/aprobar")) {
            return "APROBAR";
        }
        if (path.endsWith("/rechazar")) {
            return "RECHAZAR";
        }
        if (path.endsWith("/observar")) {
            return "OBSERVAR";
        }
        if (path.endsWith("/antivirus")) {
            return "ACTUALIZAR_ANTIVIRUS";
        }
        if (path.endsWith("/cambiar-password")) {
            return "CAMBIAR_PASSWORD";
        }
        if (path.matches(".*/adjuntos/\\d+$") && "DELETE".equals(method)) {
            return "ELIMINAR_ADJUNTO";
        }
        if (path.endsWith("/adjuntos") && "POST".equals(method)) {
            return "ADJUNTAR_ARCHIVO";
        }
        if (path.endsWith("/driver") && "POST".equals(method)) {
            return "SUBIR_DRIVER";
        }
        if (path.endsWith("/sync/iniciar") && "POST".equals(method)) {
            return "SINCRONIZAR";
        }
        if (path.endsWith("/ping") && "POST".equals(method)) {
            return "EJECUTAR_DIAGNOSTICO";
        }

        return switch (method) {
            case "POST" -> "CREAR";
            case "PUT", "PATCH" -> "ACTUALIZAR";
            case "DELETE" -> "ELIMINAR";
            default -> method;
        };
    }

    private String buildDetail(HttpServletRequest request, String action, String path) {
        String module = moduleFrom(path);
        String label = MODULE_LABELS.getOrDefault(module, module.replace('-', ' '));
        String entityId = entityIdFrom(path);

        String detail = switch (action) {
            case "CREAR" -> "Creó un registro en " + label;
            case "ACTUALIZAR" -> "Actualizó un registro en " + label;
            case "ELIMINAR" -> "Eliminó un registro de " + label;
            case "APROBAR" -> "Aprobó una solicitud de " + label;
            case "RECHAZAR" -> "Rechazó una solicitud de " + label;
            case "OBSERVAR" -> "Observó una solicitud de " + label;
            case "ACTUALIZAR_ANTIVIRUS" -> "Actualizó la verificación de antivirus en " + label;
            case "CAMBIAR_PASSWORD" -> "Cambió su contraseña. Datos sensibles omitidos";
            case "ADJUNTAR_ARCHIVO" -> "Adjuntó un archivo en " + label;
            case "ELIMINAR_ADJUNTO" -> "Eliminó un archivo adjunto de " + label;
            case "SUBIR_DRIVER" -> "Subió un controlador en " + label;
            case "SINCRONIZAR" -> "Inició la sincronización de " + label;
            case "EJECUTAR_DIAGNOSTICO" -> "Ejecutó un diagnóstico en " + label;
            default -> action + " en " + label;
        };

        if (entityId != null) {
            detail += " (ID " + entityId + ")";
        }

        String payload = payloadSummary(request);
        return payload == null ? detail + "." : detail + ". Valores enviados: " + payload;
    }

    private String payloadSummary(HttpServletRequest request) {
        if (!(request instanceof ContentCachingRequestWrapper wrapper)) {
            return null;
        }

        byte[] content = wrapper.getContentAsByteArray();
        if (content.length == 0) {
            return null;
        }

        String contentType = request.getContentType();
        if (contentType == null || (!contentType.toLowerCase(Locale.ROOT).contains("application/json")
                && !contentType.toLowerCase(Locale.ROOT).contains("+json"))) {
            return "formulario recibido (contenido omitido)";
        }

        try {
            JsonNode root = objectMapper.readTree(new String(content, StandardCharsets.UTF_8));
            JsonNode sanitized = sanitize(root, null);
            return objectMapper.writeValueAsString(sanitized);
        } catch (IOException ex) {
            return "contenido JSON no disponible";
        }
    }

    private JsonNode sanitize(JsonNode node, String fieldName) {
        if (fieldName != null && SENSITIVE_FIELD.matcher(fieldName).matches()) {
            return objectMapper.getNodeFactory().textNode("[PROTEGIDO]");
        }
        if (fieldName != null && FILE_FIELD.matcher(fieldName).matches()) {
            return objectMapper.getNodeFactory().textNode("[ARCHIVO OMITIDO]");
        }
        if (node == null || node.isNull() || node.isBoolean() || node.isNumber()) {
            return node;
        }
        if (node.isTextual()) {
            String value = node.asText().replaceAll("\\s+", " ").trim();
            if (value.length() > MAX_TEXT_VALUE) {
                value = value.substring(0, MAX_TEXT_VALUE) + "…";
            }
            return objectMapper.getNodeFactory().textNode(value);
        }
        if (node.isObject()) {
            ObjectNode sanitized = objectMapper.createObjectNode();
            for (Map.Entry<String, JsonNode> field : node.properties()) {
                sanitized.set(field.getKey(), sanitize(field.getValue(), field.getKey()));
            }
            return sanitized;
        }
        if (node.isArray()) {
            ArrayNode sanitized = objectMapper.createArrayNode();
            int count = 0;
            for (JsonNode value : node) {
                if (count++ >= MAX_ARRAY_VALUES) {
                    sanitized.add("[…]");
                    break;
                }
                sanitized.add(sanitize(value, fieldName));
            }
            return sanitized;
        }
        return objectMapper.getNodeFactory().textNode(node.asText());
    }

    private String moduleFrom(String path) {
        String withoutApi = path.replaceFirst("^/api/", "");
        int slash = withoutApi.indexOf('/');
        String module = slash >= 0 ? withoutApi.substring(0, slash) : withoutApi;
        return "active-directory".equals(module) ? "usuarios-red" : module;
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
