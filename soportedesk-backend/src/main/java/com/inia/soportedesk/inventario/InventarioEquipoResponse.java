package com.inia.soportedesk.inventario;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class InventarioEquipoResponse {
    private final Long id;
    private final String agentId;
    private final String hostname;
    private final String serialEquipo;
    private final String fabricante;
    private final String modelo;
    private final String dominio;
    private final String ou;
    private final String usuarioActual;
    private final String sistemaOperativo;
    private final String versionSistema;
    private final String arquitectura;
    private final String procesador;
    private final Long ramTotalBytes;
    private final String ipPrincipal;
    private final String macPrincipal;
    private final LocalDateTime ultimoReporte;
    private final String ipReporte;
    private final String estadoAgente;
    private final String origen;
    private final Long equipoRelacionadoId;
    private final String equipoRelacionadoLabel;
    private final Long usuarioRedRelacionadoId;
    private final String usuarioRedRelacionadoLabel;
    private final Long vpnRelacionadoId;
    private final String vpnRelacionadoLabel;
    private final InventarioMatchEstado matchEstado;
    private final Integer matchScore;
    private final String matchNotas;
    private final LocalDateTime matchFecha;
    private final List<ProgramaResponse> programas;
    private final List<DiscoResponse> discos;
    private final List<RedResponse> redes;

    @Getter
    @Builder
    public static class ProgramaResponse {
        private final Long id;
        private final String nombre;
        private final String version;
        private final String fabricante;
        private final String fechaInstalacion;
    }

    @Getter
    @Builder
    public static class DiscoResponse {
        private final Long id;
        private final String letra;
        private final String nombre;
        private final String tipo;
        private final Long totalBytes;
        private final Long libreBytes;
    }

    @Getter
    @Builder
    public static class RedResponse {
        private final Long id;
        private final String descripcion;
        private final String macAddress;
        private final List<String> ipAddresses;
    }
}
