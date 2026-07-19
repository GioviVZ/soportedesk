package com.inia.soportedesk.herramientas.ordenes;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrdenServicioServiceTest {

    @Mock
    private OrdenServicioRepository repository;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void crear_calculaVencimientoYRegistraUsuario() {
        OrdenServicioService service = new OrdenServicioService(repository);
        OrdenServicioRequest request = request("OS-2026-001", LocalDate.now(), 15);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("maria", "", List.of()));
        when(repository.existsByNumeroOrdenIgnoreCase("OS-2026-001")).thenReturn(false);
        when(repository.save(org.mockito.ArgumentMatchers.any(OrdenServicio.class)))
                .thenAnswer(invocation -> {
                    OrdenServicio orden = invocation.getArgument(0);
                    orden.setId(1L);
                    return orden;
                });

        OrdenServicioResponse response = service.crear(request);

        ArgumentCaptor<OrdenServicio> saved = ArgumentCaptor.forClass(OrdenServicio.class);
        verify(repository).save(saved.capture());
        assertThat(saved.getValue().getFechaVencimiento()).isEqualTo(LocalDate.now().plusDays(15));
        assertThat(saved.getValue().getRegistradoPor()).isEqualTo("maria");
        assertThat(response.diasRestantes()).isEqualTo(15);
        assertThat(response.finalizada()).isFalse();
    }

    @Test
    void crear_rechazaNumeroDuplicado() {
        OrdenServicioService service = new OrdenServicioService(repository);
        OrdenServicioRequest request = request("OS-2026-001", LocalDate.now(), 10);
        when(repository.existsByNumeroOrdenIgnoreCase("OS-2026-001")).thenReturn(true);

        assertThatThrownBy(() -> service.crear(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("OS-2026-001");
    }

    @Test
    void listarProximas_incluyeTodasLasOrdenesActivasOrdenadas() {
        OrdenServicioService service = new OrdenServicioService(repository);
        when(repository.findAllByFinalizadaFalseOrderByFechaVencimientoAsc()).thenReturn(List.of());

        assertThat(service.listarProximas()).isEmpty();

        verify(repository).findAllByFinalizadaFalseOrderByFechaVencimientoAsc();
    }

    private OrdenServicioRequest request(String numero, LocalDate inicio, int plazo) {
        OrdenServicioRequest request = new OrdenServicioRequest();
        request.setNumeroOrden(numero);
        request.setDescripcion("Servicio de soporte");
        request.setProveedor("Proveedor INIA");
        request.setFechaInicio(inicio);
        request.setPlazoDias(plazo);
        return request;
    }
}
