package com.inia.soportedesk.catalogo;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class ModeloImpresoraRequest {

    @NotNull
    private Long marcaId;

    @NotBlank
    @Size(max = 100)
    private String nombre;

    private List<TonerRequest> toners = new ArrayList<>();

    @Getter
    @Setter
    public static class TonerRequest {
        @Size(max = 20)
        private String color;

        @Size(max = 50)
        private String variante;

        @Size(max = 80)
        private String codigo;
    }
}
