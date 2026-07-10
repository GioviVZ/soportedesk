package com.inia.soportedesk.activedirectory;

import com.inia.soportedesk.activedirectory.dto.AdSyncResponse;
import com.inia.soportedesk.activedirectory.dto.AdSyncStatus;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class AdSyncJobStatusTest {

    @Test
    void marcarInicioDevuelveTrueLaPrimeraVezYFalseSiYaEstaCorriendo() {
        AdSyncJobStatus jobStatus = new AdSyncJobStatus();

        boolean primero = jobStatus.marcarInicio();
        boolean segundo = jobStatus.marcarInicio();

        assertThat(primero).isTrue();
        assertThat(segundo).isFalse();
        assertThat(jobStatus.snapshot().running()).isTrue();
    }

    @Test
    void incrementarProcesadosAcumulaSobreElTotalConfigurado() {
        AdSyncJobStatus jobStatus = new AdSyncJobStatus();
        jobStatus.marcarInicio();
        jobStatus.setTotal(500);

        jobStatus.incrementarProcesados(200);
        jobStatus.incrementarProcesados(150);

        AdSyncStatus snapshot = jobStatus.snapshot();
        assertThat(snapshot.total()).isEqualTo(500);
        assertThat(snapshot.procesados()).isEqualTo(350);
    }

    @Test
    void completarConExitoMarcaRunningFalseYGuardaElResultado() {
        AdSyncJobStatus jobStatus = new AdSyncJobStatus();
        jobStatus.marcarInicio();
        AdSyncResponse resultado = new AdSyncResponse(500, 3, LocalDateTime.now());

        jobStatus.completarConExito(resultado);

        AdSyncStatus snapshot = jobStatus.snapshot();
        assertThat(snapshot.running()).isFalse();
        assertThat(snapshot.ultimoResultado()).isEqualTo(resultado);
        assertThat(snapshot.finalizadoEn()).isNotNull();
        assertThat(snapshot.error()).isNull();
    }

    @Test
    void completarConErrorMarcaRunningFalseYGuardaElMensaje() {
        AdSyncJobStatus jobStatus = new AdSyncJobStatus();
        jobStatus.marcarInicio();

        jobStatus.completarConError("simple bind failed");

        AdSyncStatus snapshot = jobStatus.snapshot();
        assertThat(snapshot.running()).isFalse();
        assertThat(snapshot.error()).isEqualTo("simple bind failed");
        assertThat(snapshot.ultimoResultado()).isNull();
    }

    @Test
    void marcarInicioReiniciaProcesadosYTotalDeUnaCorridaAnterior() {
        AdSyncJobStatus jobStatus = new AdSyncJobStatus();
        jobStatus.marcarInicio();
        jobStatus.setTotal(100);
        jobStatus.incrementarProcesados(100);
        jobStatus.completarConExito(new AdSyncResponse(100, 1, LocalDateTime.now()));

        jobStatus.marcarInicio();

        AdSyncStatus snapshot = jobStatus.snapshot();
        assertThat(snapshot.procesados()).isZero();
        assertThat(snapshot.total()).isZero();
        assertThat(snapshot.finalizadoEn()).isNull();
    }
}
