package com.inia.soportedesk.herramientas.ordenes;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrdenServicioServiceTest {

    @Mock
    private OrdenServicioRepository repository;

    @Test
    void crear_calculaVencimiento() {
        OrdenServicioService service = new OrdenServicioService(repository);
        OrdenServicioRequest request = request("OS-2026-001", LocalDate.now(), 15);
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
    void crear_registraEntregablesYCalculaSusFechas() {
        OrdenServicioService service = new OrdenServicioService(repository);
        LocalDate inicio = LocalDate.now().minusDays(35);
        OrdenServicioRequest request = request("OS-2385-2026", inicio, 90);
        request.setHitos(List.of(hito("Primer entregable", 30), hito("Segundo entregable", 60),
                hito("Tercer entregable", 90)));
        when(repository.existsByNumeroOrdenIgnoreCase("OS-2385-2026")).thenReturn(false);
        when(repository.save(org.mockito.ArgumentMatchers.any(OrdenServicio.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        OrdenServicioResponse response = service.crear(request);

        assertThat(response.diasTranscurridos()).isEqualTo(35);
        assertThat(response.hitos()).extracting(OrdenServicioHitoResponse::diaPlazo)
                .containsExactly(30, 60, 90);
        assertThat(response.hitos().get(0).diasRestantes()).isEqualTo(-5);
        assertThat(response.hitos().get(1).diasRestantes()).isEqualTo(25);
    }

    @Test
    void crear_rechazaEntregablePosteriorAlPlazoTotal() {
        OrdenServicioService service = new OrdenServicioService(repository);
        OrdenServicioRequest request = request("OS-2026-002", LocalDate.now(), 60);
        request.setHitos(List.of(hito("Entregable final", 90)));
        when(repository.existsByNumeroOrdenIgnoreCase("OS-2026-002")).thenReturn(false);

        assertThatThrownBy(() -> service.crear(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("supera la duración total");
    }

    @Test
    void cambiarHitoCompletado_marcaLaEntregaComoCompletada() {
        OrdenServicioService service = new OrdenServicioService(repository);
        OrdenServicio orden = new OrdenServicio();
        orden.setId(1L);
        orden.setNumeroOrden("OS-2385-2026");
        orden.setDescripcion("Servicio por entregables");
        orden.setFechaInicio(LocalDate.now().minusDays(35));
        orden.setPlazoDias(90);
        orden.setFechaVencimiento(LocalDate.now().plusDays(55));
        orden.setFinalizada(false);
        OrdenServicioHito hito = new OrdenServicioHito();
        hito.setId(30L);
        hito.setOrdenServicio(orden);
        hito.setNombre("Primer entregable");
        hito.setDiaPlazo(30);
        hito.setCompletado(false);
        orden.getHitos().add(hito);
        when(repository.findById(1L)).thenReturn(Optional.of(orden));
        when(repository.save(orden)).thenReturn(orden);

        OrdenServicioResponse response = service.cambiarHitoCompletado(1L, 30L, true);

        assertThat(response.hitos().get(0).completado()).isTrue();
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

    private OrdenServicioHitoRequest hito(String nombre, int dia) {
        OrdenServicioHitoRequest hito = new OrdenServicioHitoRequest();
        hito.setNombre(nombre);
        hito.setDiaPlazo(dia);
        return hito;
    }
}
