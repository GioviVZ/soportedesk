package com.inia.soportedesk.exception;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.access.AccessDeniedException;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void handleNotFound_returns404WithMessage() {
        ResponseEntity<ApiError> response =
                handler.handleNotFound(new ResourceNotFoundException("Licencia no encontrada: 99"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody().getMessage()).isEqualTo("Licencia no encontrada: 99");
    }

    @Test
    void handleBadCredentials_returns401() {
        ResponseEntity<ApiError> response =
                handler.handleBadCredentials(new BadCredentialsException("Usuario o contraseña incorrectos"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(response.getBody().getMessage()).isEqualTo("Usuario o contraseña incorrectos");
    }

    @Test
    void handleAccessDenied_preservesForbiddenStatus() {
        ResponseEntity<ApiError> response = handler.handleAccessDenied(new AccessDeniedException("internal detail"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(response.getBody().getMessage()).doesNotContain("internal detail");
    }
    @Test
    void handleDataIntegrityViolation_returnsConflictWithoutSqlDetails() {
        ResponseEntity<ApiError> response = handler.handleDataIntegrityViolation(
                new DataIntegrityViolationException("Violation of UNIQUE KEY UX_secret_table"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody().getMessage()).doesNotContain("UX_secret_table");
    }

    @Test
    void handleUnexpected_returnsSafeInternalError() {
        ResponseEntity<ApiError> response = handler.handleUnexpected(
                new RuntimeException("jdbc:sqlserver://internal-host;password=secret"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody().getMessage()).doesNotContain("internal-host", "secret");
    }
}
