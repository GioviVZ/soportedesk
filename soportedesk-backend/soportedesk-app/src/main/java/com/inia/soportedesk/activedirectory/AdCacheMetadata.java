package com.inia.soportedesk.activedirectory;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "ad_cache_metadata")
@Getter
@Setter
@NoArgsConstructor
public class AdCacheMetadata {
    @Id
    @Column(length = 100)
    private String clave;

    @Column(length = 500)
    private String valor;

    @Column(name = "fecha_actualizacion", nullable = false)
    private LocalDateTime fechaActualizacion;

    public AdCacheMetadata(String clave, String valor, LocalDateTime fechaActualizacion) {
        this.clave = clave;
        this.valor = valor;
        this.fechaActualizacion = fechaActualizacion;
    }
}
