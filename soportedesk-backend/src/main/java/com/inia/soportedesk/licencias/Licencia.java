package com.inia.soportedesk.licencias;

import com.inia.soportedesk.catalogo.TipoBien;
import com.inia.soportedesk.catalogo.TipoLicencia;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "licencias")
@Getter
@Setter
@NoArgsConstructor
public class Licencia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "tipo_licencia_id", nullable = false)
    private TipoLicencia tipoLicencia;

    @Column(nullable = false, length = 300)
    private String descripcion;

    @Column(name = "cuenta_activacion")
    private String cuentaActivacion;

    @Convert(converter = LicenciaCredentialConverter.class)
    @Column(name = "clave_activacion", length = 1000)
    private String claveActivacion;

    @Column(name = "serial_activacion", columnDefinition = "NVARCHAR(MAX)")
    private String serialActivacion;

    @Column(name = "orden_compra", nullable = false)
    private String ordenCompra;

    @Column(nullable = false)
    private String anio;

    @Column(nullable = false)
    private Integer cantidad;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "tipo_bien_id", nullable = false)
    private TipoBien tipoBien;
}
