package com.inia.soportedesk.equipos.evidencia;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "equipos_evidencias")
@Getter
@Setter
@NoArgsConstructor
public class EquipoEvidencia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "computer_id", nullable = false)
    private Long computerId;

    @Column(name = "archivo_path", nullable = false)
    private String archivoPath;

    @Column(name = "nombre_original", nullable = false)
    private String nombreOriginal;

    @Column(name = "mime_type", nullable = false)
    private String mimeType;

    private String descripcion;

    @Column(name = "subido_por", nullable = false)
    private String subidoPor;

    @Column(name = "fecha_subida", nullable = false)
    private LocalDateTime fechaSubida;
}
