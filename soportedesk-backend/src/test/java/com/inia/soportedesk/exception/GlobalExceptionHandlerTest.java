package com.inia.soportedesk.exception;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;

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
}
