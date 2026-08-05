package com.inia.soportedesk.auditoria;

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
import java.util.UUID;

@Entity
@Table(name = "ad_auditoria")
@Getter
@Setter
@NoArgsConstructor
public class AdAuditoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "operador_usuario", nullable = false, length = 100)
    private String operadorUsuario;

    @Column(name = "operador_nombre", length = 150)
    private String operadorNombre;

    @Column(name = "usuario_afectado", nullable = false, length = 100)
    private String usuarioAfectado;

    @Column(name = "usuario_afectadodn", length = 500)
    private String usuarioAfectadoDn;

    @Column(nullable = false, length = 80)
    private String accion;

    @Column(nullable = false, length = 50)
    private String modulo;

    @Column(nullable = false, length = 20)
    private String resultado;

    @Column(length = 500)
    private String mensaje;

    @Column(name = "detalle_error", columnDefinition = "nvarchar(max)")
    private String detalleError;

    @Column(name = "ip_origen", length = 50)
    private String ipOrigen;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(name = "fecha_registro", nullable = false)
    private LocalDateTime fechaRegistro;

    @Column(name = "id_transaccion")
    private UUID idTransaccion;

    @Column(name = "fecha_inicio")
    private LocalDateTime fechaInicio;

    @Column(name = "fecha_fin")
    private LocalDateTime fechaFin;

    @Column(name = "duracion_ms")
    private Integer duracionMs;

    @Column(name = "estado_anterior", columnDefinition = "nvarchar(max)")
    private String estadoAnterior;

    @Column(name = "estado_nuevo", columnDefinition = "nvarchar(max)")
    private String estadoNuevo;

    @Column(name = "recurso_afectado", length = 300)
    private String recursoAfectado;

    @Column(name = "tipo_recurso", length = 100)
    private String tipoRecurso;

    @Column(name = "end_point", length = 300)
    private String endPoint;

    @Column(name = "metodo_http", length = 20)
    private String metodoHttp;

    @Column(name = "host_origen", length = 200)
    private String hostOrigen;

    @Column(length = 100)
    private String aplicacion;

    @Column(name = "version_aplicacion", length = 50)
    private String versionAplicacion;
}
