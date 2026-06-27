package com.inia.soportedesk.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secret",
                "c29wb3J0ZWRlc2staW5pYS1zZWNyZXQta2V5LWNoYW5nZS1pbi1wcm9kdWNjaW9uLTEyMzQ1Ng==");
        ReflectionTestUtils.setField(jwtService, "expirationMs", 86400000L);
    }

    @Test
    void generateToken_thenExtractUsernameAndRole() {
        String token = jwtService.generateToken("jperez", "ADMIN", Map.of());

        assertThat(jwtService.extractUsername(token)).isEqualTo("jperez");
        assertThat(jwtService.extractRole(token)).isEqualTo("ADMIN");
        assertThat(jwtService.isTokenValid(token, "jperez")).isTrue();
    }

    @Test
    void isTokenValid_returnsFalseForDifferentUsername() {
        String token = jwtService.generateToken("jperez", "ADMIN", Map.of());

        assertThat(jwtService.isTokenValid(token, "otro")).isFalse();
    }

    @Test
    void generateToken_thenExtractPermisos_roundTripsModuloNivelMap() {
        String token = jwtService.generateToken("soporte01", "SOPORTE",
                Map.of("licencias", "EDIT", "auditoria", "VIEW"));

        Map<String, String> permisos = jwtService.extractPermisos(token);

        assertThat(permisos).containsEntry("licencias", "EDIT");
        assertThat(permisos).containsEntry("auditoria", "VIEW");
    }

    @Test
    void extractPermisos_withNoPermisosClaim_returnsEmptyMap() {
        String token = jwtService.generateToken("soporte01", "SOPORTE", Map.of());

        assertThat(jwtService.extractPermisos(token)).isEmpty();
    }
}
