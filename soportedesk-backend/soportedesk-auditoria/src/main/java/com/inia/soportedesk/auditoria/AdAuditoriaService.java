package com.inia.soportedesk.auditoria;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdAuditoriaService {

    private static final Logger log = LoggerFactory.getLogger(AdAuditoriaService.class);
    private static final int MAX_LIMIT = 5_000;

    private final AdAuditoriaRepository repository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void registrar(AdAuditoriaRegistro datos) {
        try {
            AdAuditoria entidad = new AdAuditoria();
            entidad.setOperadorUsuario(limit(blankToNull(datos.operadorUsuario()) == null ? "sistema" : datos.operadorUsuario(), 100));
            entidad.setOperadorNombre(limit(datos.operadorNombre(), 150));
            entidad.setUsuarioAfectado(limit(datos.usuarioAfectado(), 100));
            entidad.setUsuarioAfectadoDn(limit(datos.usuarioAfectadoDn(), 500));
            entidad.setAccion(limit(datos.accion(), 80));
            entidad.setModulo("ACTIVE_DIRECTORY");
            entidad.setResultado(limit(datos.resultado(), 20));
            entidad.setMensaje(limit(datos.mensaje(), 500));
            entidad.setDetalleError(datos.detalleError());
            entidad.setEstadoAnterior(datos.estadoAnterior());
            entidad.setEstadoNuevo(datos.estadoNuevo());
            entidad.setRecursoAfectado(limit(datos.recursoAfectado(), 300));
            entidad.setTipoRecurso("USUARIO");
            entidad.setEndPoint(limit(datos.endPoint(), 300));
            entidad.setMetodoHttp(limit(datos.metodoHttp(), 20));
            entidad.setIpOrigen(limit(datos.ipOrigen(), 50));
            entidad.setUserAgent(limit(datos.userAgent(), 500));
            entidad.setIdTransaccion(datos.idTransaccion());
            entidad.setFechaInicio(datos.fechaInicio());
            entidad.setFechaFin(datos.fechaFin());
            entidad.setDuracionMs(datos.fechaInicio() != null && datos.fechaFin() != null
                    ? (int) Duration.between(datos.fechaInicio(), datos.fechaFin()).toMillis() : null);
            entidad.setFechaRegistro(LocalDateTime.now());
            entidad.setAplicacion("SoporteDesk");
            repository.save(entidad);
        } catch (RuntimeException e) {
            log.warn("No se pudo registrar auditoria detallada de AD para accion={} usuarioAfectado={}",
                    datos.accion(), datos.usuarioAfectado(), e);
        }
    }

    @Transactional(readOnly = true)
    public List<AdAuditoriaResponse> buscar(String usuarioAfectado, String accion, String resultado,
                                             LocalDate desde, LocalDate hasta, Integer limit) {
        int size = Math.min(Math.max(limit == null ? 100 : limit, 1), MAX_LIMIT);
        LocalDateTime desdeDateTime = desde == null ? null : desde.atStartOfDay();
        LocalDateTime hastaDateTime = hasta == null ? null : hasta.atTime(LocalTime.MAX);

        return repository.buscar(blankToNull(usuarioAfectado), blankToNull(accion), blankToNull(resultado),
                        desdeDateTime, hastaDateTime, PageRequest.of(0, size))
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private AdAuditoriaResponse toResponse(AdAuditoria a) {
        return new AdAuditoriaResponse(
                a.getId(), a.getFechaRegistro(), a.getOperadorUsuario(), a.getOperadorNombre(),
                a.getUsuarioAfectado(), a.getUsuarioAfectadoDn(), a.getAccion(), a.getResultado(),
                a.getMensaje(), a.getDetalleError(), a.getEstadoAnterior(), a.getEstadoNuevo(),
                a.getRecursoAfectado(), a.getEndPoint(), a.getMetodoHttp(), a.getIpOrigen(),
                a.getIdTransaccion(), a.getDuracionMs()
        );
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String limit(String value, int max) {
        if (value == null) {
            return null;
        }
        return value.length() <= max ? value : value.substring(0, max);
    }
}
