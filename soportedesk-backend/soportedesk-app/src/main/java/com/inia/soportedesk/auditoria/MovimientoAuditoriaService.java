package com.inia.soportedesk.auditoria;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MovimientoAuditoriaService {

    private static final int MAX_LIMIT = 5_000;

    private final MovimientoAuditoriaRepository repository;

    @Transactional(readOnly = true)
    public List<MovimientoAuditoriaResponse> buscar(String modulo, String accion, String search,
                                                    LocalDate desde, LocalDate hasta, Integer limit) {
        int size = Math.min(Math.max(limit == null ? 100 : limit, 1), MAX_LIMIT);
        LocalDateTime desdeDateTime = desde == null ? null : desde.atStartOfDay();
        LocalDateTime hastaDateTime = hasta == null ? null : hasta.atTime(LocalTime.MAX);

        return repository.buscar(blankToNull(modulo), blankToNull(accion), blankToNull(search),
                        desdeDateTime, hastaDateTime, PageRequest.of(0, size))
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void registrar(String usuario, String accion, String modulo, String metodo, String ruta,
                          String entidadId, Integer estadoHttp, String ip, String detalle) {
        MovimientoAuditoria movimiento = new MovimientoAuditoria();
        movimiento.setFecha(LocalDateTime.now());
        movimiento.setUsuario(limit(blankToNull(usuario) == null ? "sistema" : usuario, 80));
        movimiento.setAccion(limit(accion, 30));
        movimiento.setModulo(limit(modulo, 60));
        movimiento.setMetodo(limit(metodo, 10));
        movimiento.setRuta(limit(ruta, 300));
        movimiento.setEntidadId(limit(entidadId, 80));
        movimiento.setEstadoHttp(estadoHttp);
        movimiento.setIp(limit(ip, 80));
        movimiento.setDetalle(limit(detalle, 500));
        repository.save(movimiento);
    }

    private MovimientoAuditoriaResponse toResponse(MovimientoAuditoria m) {
        return new MovimientoAuditoriaResponse(
                m.getId(),
                m.getFecha(),
                m.getUsuario(),
                m.getAccion(),
                m.getModulo(),
                m.getMetodo(),
                m.getRuta(),
                m.getEntidadId(),
                m.getEstadoHttp(),
                m.getIp(),
                m.getDetalle()
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
