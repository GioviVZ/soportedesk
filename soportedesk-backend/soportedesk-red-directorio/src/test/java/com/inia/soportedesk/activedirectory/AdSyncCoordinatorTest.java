package com.inia.soportedesk.activedirectory;

import com.inia.soportedesk.activedirectory.dto.AdSyncResponse;
import com.inia.soportedesk.activedirectory.dto.AdSyncStatus;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AdSyncCoordinatorTest {

    @Test
    void iniciarEjecutaSincronizacionYActualizaElEstadoAlTerminar() throws InterruptedException {
        ActiveDirectoryService service = mock(ActiveDirectoryService.class);
        AdSyncResponse resultado = new AdSyncResponse(500, 3, LocalDateTime.now());
        when(service.sincronizarCache()).thenReturn(resultado);
        AdSyncJobStatus jobStatus = new AdSyncJobStatus();
        ExecutorService executor = Executors.newSingleThreadExecutor();
        ScheduledExecutorService scheduler = mock(ScheduledExecutorService.class);
        AdSyncCoordinator coordinator = new AdSyncCoordinator(service, jobStatus, executor, scheduler);

        AdSyncStatus started = coordinator.iniciar();
        assertThat(started.running()).isTrue();

        executor.shutdown();
        boolean finished = executor.awaitTermination(2, TimeUnit.SECONDS);
        assertThat(finished).isTrue();

        AdSyncStatus done = coordinator.estado();
        assertThat(done.running()).isFalse();
        assertThat(done.ultimoResultado()).isEqualTo(resultado);
    }

    @Test
    void iniciarNoArrancaUnSegundoSyncSiYaHayUnoCorriendo() {
        ActiveDirectoryService service = mock(ActiveDirectoryService.class);
        AdSyncJobStatus jobStatus = new AdSyncJobStatus();
        ExecutorService executor = mock(ExecutorService.class);
        ScheduledExecutorService scheduler = mock(ScheduledExecutorService.class);
        AdSyncCoordinator coordinator = new AdSyncCoordinator(service, jobStatus, executor, scheduler);

        AdSyncStatus first = coordinator.iniciar();
        AdSyncStatus second = coordinator.iniciar();

        assertThat(first.running()).isTrue();
        assertThat(second.running()).isTrue();
        verify(executor, times(1)).submit(any(Runnable.class));
    }

    @Test
    @SuppressWarnings("unchecked")
    void notificarCambioCancelaYReagendaElTemporizadorAnterior() {
        ActiveDirectoryService service = mock(ActiveDirectoryService.class);
        AdSyncJobStatus jobStatus = new AdSyncJobStatus();
        ExecutorService executor = mock(ExecutorService.class);
        ScheduledExecutorService scheduler = mock(ScheduledExecutorService.class);
        ScheduledFuture<Object> firstFuture = mock(ScheduledFuture.class);
        ScheduledFuture<Object> secondFuture = mock(ScheduledFuture.class);
        doReturn(firstFuture, secondFuture)
                .when(scheduler).schedule(any(Runnable.class), eq(30L), eq(TimeUnit.SECONDS));
        AdSyncCoordinator coordinator = new AdSyncCoordinator(service, jobStatus, executor, scheduler);

        coordinator.notificarCambio();
        coordinator.notificarCambio();

        verify(firstFuture).cancel(false);
        verify(scheduler, times(2)).schedule(any(Runnable.class), eq(30L), eq(TimeUnit.SECONDS));
        verify(secondFuture, never()).cancel(anyBoolean());
    }

    @Test
    @SuppressWarnings("unchecked")
    void onCambioDelegaAlDebounce() {
        ActiveDirectoryService service = mock(ActiveDirectoryService.class);
        AdSyncJobStatus jobStatus = new AdSyncJobStatus();
        ExecutorService executor = mock(ExecutorService.class);
        ScheduledExecutorService scheduler = mock(ScheduledExecutorService.class);
        doReturn(mock(ScheduledFuture.class))
                .when(scheduler).schedule(any(Runnable.class), eq(30L), eq(TimeUnit.SECONDS));
        AdSyncCoordinator coordinator = new AdSyncCoordinator(service, jobStatus, executor, scheduler);

        coordinator.onCambio(new AdCambioEvent("jperez", "RESET_PASSWORD"));

        verify(scheduler, times(1)).schedule(any(Runnable.class), eq(30L), eq(TimeUnit.SECONDS));
    }
}
