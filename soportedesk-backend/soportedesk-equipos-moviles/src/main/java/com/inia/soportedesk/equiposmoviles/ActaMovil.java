package com.inia.soportedesk.equiposmoviles;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.inia.soportedesk.catalogo.Dependencia;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(name = "actas_moviles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ActaMovil {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "numero_acta", nullable = false, length = 50)
    private String numeroActa;

    @Column(nullable = false, length = 20)
    private String tipo;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(name = "persona_nombre", nullable = false, length = 150)
    private String personaNombre;

    @Column(name = "persona_dni", length = 8)
    private String personaDni;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "dependencia_id")
    private Dependencia dependencia;

    @Column(length = 1000)
    private String observaciones;

    @Column(name = "archivo_nombre", length = 255)
    private String archivoNombre;

    @JsonIgnore
    @Column(name = "archivo_ruta", length = 500)
    private String archivoRuta;

    @Column(name = "archivo_content_type", length = 100)
    private String archivoContentType;

    @Column(name = "archivo_tamano")
    private Long archivoTamano;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "actas_moviles_equipos",
            joinColumns = @JoinColumn(name = "acta_id"),
            inverseJoinColumns = @JoinColumn(name = "equipo_movil_id"))
    private Set<EquipoMovil> equipos = new LinkedHashSet<>();

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @JsonProperty("tieneArchivo")
    public boolean isTieneArchivo() {
        return archivoRuta != null && !archivoRuta.isBlank();
    }
}
