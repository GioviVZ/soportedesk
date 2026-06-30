package com.inia.soportedesk.inventario;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class InventarioAgenteRequest {

    @NotBlank(message = "El agentId es obligatorio")
    @Size(max = 80)
    private String agentId;

    @NotBlank(message = "El hostname es obligatorio")
    @Size(max = 120)
    private String hostname;

    @Size(max = 120)
    private String serialEquipo;

    @Size(max = 160)
    private String fabricante;

    @Size(max = 180)
    private String modelo;

    @Size(max = 180)
    private String dominio;

    @Size(max = 500)
    private String ou;

    @Size(max = 180)
    private String usuarioActual;

    @Size(max = 220)
    private String sistemaOperativo;

    @Size(max = 100)
    private String versionSistema;

    @Size(max = 80)
    private String arquitectura;

    @Size(max = 260)
    private String procesador;

    private Long ramTotalBytes;

    @Size(max = 80)
    private String ipPrincipal;

    @Size(max = 80)
    private String macPrincipal;

    @Valid
    private List<ProgramaRequest> programas = new ArrayList<>();

    @Valid
    private List<DiscoRequest> discos = new ArrayList<>();

    @Valid
    private List<RedRequest> redes = new ArrayList<>();

    @Getter
    @Setter
    public static class ProgramaRequest {
        @NotBlank(message = "El nombre del programa es obligatorio")
        @Size(max = 300)
        private String nombre;

        @Size(max = 120)
        private String version;

        @Size(max = 220)
        private String fabricante;

        @Size(max = 60)
        private String fechaInstalacion;
    }

    @Getter
    @Setter
    public static class DiscoRequest {
        @Size(max = 20)
        private String letra;

        @Size(max = 120)
        private String nombre;

        @Size(max = 80)
        private String tipo;

        private Long totalBytes;
        private Long libreBytes;
    }

    @Getter
    @Setter
    public static class RedRequest {
        @Size(max = 260)
        private String descripcion;

        @Size(max = 80)
        private String macAddress;

        private List<@Size(max = 80) String> ipAddresses = new ArrayList<>();
    }
}
