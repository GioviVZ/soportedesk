package com.inia.soportedesk.identidad;

import com.inia.soportedesk.activedirectory.AdUsuarioCache;
import com.inia.soportedesk.activedirectory.AdUsuarioCacheRepository;
import com.inia.soportedesk.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Reconciliacion de identidad continua: detecta cuentas AD que todavia no
 * tienen fila en dbo.persona, sugiere una clasificacion automatica (misma
 * heuristica usada en la reconciliacion manual de julio-2026), y las deja
 * en dbo.persona_candidato -- SIN crear la persona real. La creacion real
 * solo pasa cuando alguien confirma explicitamente (confirmar()).
 *
 * A proposito NO promueve solo -- la heuristica tuvo ~2% de falsos
 * positivos en la corrida manual (cuentas de recursos institucionales
 * con nombre con forma de persona), y equivocarse con quien es una
 * persona pesa mas que equivocarse con un equipo.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PersonaReconciliacionService {

    private static final Set<String> PATRONES_SERVICIO = Set.of(
            "vmware", "backup", "noreply", "scanner", "impresora", "printer");

    private final AdUsuarioCacheRepository adUsuarioCacheRepository;
    private final PersonaCandidatoRepository candidatoRepository;
    private final JdbcTemplate jdbc;

    @Scheduled(cron = "${identidad.reconciliacion-cron:0 30 3 * * *}")
    @Transactional
    public int detectarCandidatosNuevos() {
        Set<String> yaEnPersona = new HashSet<>(jdbc.queryForList(
                "SELECT sam_account_name FROM dbo.persona WHERE sam_account_name IS NOT NULL",
                String.class));

        int nuevos = 0;
        for (AdUsuarioCache cuenta : adUsuarioCacheRepository.findAll()) {
            String sam = cuenta.getSamAccountName();
            if (sam == null || sam.isBlank()) continue;
            if (yaEnPersona.contains(sam)) continue;
            if (candidatoRepository.existsBySamAccountName(sam)) continue;

            String[] nombreApellido = dividirNombre(cuenta);
            if (nombreApellido == null) continue; // sin display_name utilizable, no se puede sugerir nombre

            PersonaCandidato candidato = new PersonaCandidato();
            candidato.setSamAccountName(sam);
            candidato.setNombres(nombreApellido[0]);
            candidato.setApellidos(nombreApellido[1]);
            candidato.setCorreoInstitucional(cuenta.getMail());
            candidato.setClasificacionSugerida(clasificar(cuenta));
            candidato.setFechaDeteccion(LocalDateTime.now());
            candidatoRepository.save(candidato);
            nuevos++;
        }

        if (nuevos > 0) {
            log.info("persona_candidato: {} cuentas nuevas detectadas, pendientes de revision", nuevos);
        } else {
            log.info("persona_candidato: sin cuentas nuevas, identidad al dia");
        }
        return nuevos;
    }

    public List<PersonaCandidato> listarPendientes() {
        return candidatoRepository.findByEstadoOrderByClasificacionSugeridaAscFechaDeteccionDesc("PENDIENTE");
    }

    @Transactional
    public Long confirmar(Long candidatoId, String confirmadoPor) {
        PersonaCandidato candidato = obtenerPendiente(candidatoId);

        Long tipoCuentaId = jdbc.queryForObject(
                "SELECT TipoCuentaID FROM core.TiposCuentaDirectorio WHERE Codigo = 'PERSONAL'", Long.class);
        Long nuevoPersonaId = jdbc.queryForObject("SELECT NEXT VALUE FOR dbo.seq_persona_id", Long.class);
        if (nuevoPersonaId == null) {
            throw new IllegalStateException("dbo.seq_persona_id no devolvio un valor");
        }

        jdbc.update("""
                INSERT INTO dbo.persona
                    (persona_id, nombres, apellidos, sam_account_name, correo_institucional,
                     estado_persona, activo, tipo_cuenta_id, fecha_registro, creado_por)
                VALUES (?, ?, ?, ?, ?, 'ACTIVO', 1, ?, SYSUTCDATETIME(), ?)
                """,
                nuevoPersonaId, candidato.getNombres(), candidato.getApellidos(),
                candidato.getSamAccountName(), candidato.getCorreoInstitucional(),
                tipoCuentaId, confirmadoPor);

        candidato.setEstado("CONFIRMADO");
        candidato.setConfirmadoPor(confirmadoPor);
        candidato.setFechaResolucion(LocalDateTime.now());
        candidato.setPersonaId(nuevoPersonaId);
        candidatoRepository.save(candidato);
        return nuevoPersonaId;
    }

    @Transactional
    public void descartar(Long candidatoId, String descartadoPor) {
        PersonaCandidato candidato = obtenerPendiente(candidatoId);
        candidato.setEstado("DESCARTADO");
        candidato.setConfirmadoPor(descartadoPor);
        candidato.setFechaResolucion(LocalDateTime.now());
        candidatoRepository.save(candidato);
    }

    private PersonaCandidato obtenerPendiente(Long candidatoId) {
        PersonaCandidato candidato = candidatoRepository.findById(candidatoId)
                .orElseThrow(() -> new ResourceNotFoundException("Candidato no encontrado: " + candidatoId));
        if (!"PENDIENTE".equals(candidato.getEstado())) {
            throw new IllegalArgumentException("Este candidato ya fue resuelto (" + candidato.getEstado() + ")");
        }
        return candidato;
    }

    private String clasificar(AdUsuarioCache cuenta) {
        String sam = cuenta.getSamAccountName() == null ? "" : cuenta.getSamAccountName().toLowerCase();
        if (PATRONES_SERVICIO.stream().anyMatch(sam::contains) || sam.startsWith("svc") || sam.startsWith("support_")) {
            return "SERVICIO";
        }
        if (sam.matches(".*[0-9]$") && !sam.contains(" ")) {
            return "FUNCIONAL";
        }
        if (cuenta.getDisplayName() == null) {
            return null; // sin senal suficiente -- requiere revision manual sin sugerencia
        }
        String displayName = cuenta.getDisplayName();
        boolean pareceNombrePersona = displayName.contains(" ") && !displayName.matches(".*[0-9].*");
        if (!pareceNombrePersona) {
            return null;
        }
        boolean tieneAtributosPersona = isNotBlank(cuenta.getDepartment())
                || isNotBlank(cuenta.getTitle())
                || isNotBlank(cuenta.getMail());
        boolean tieneGuion = displayName.contains("-");
        return (tieneAtributosPersona || !tieneGuion) ? "PERSONAL" : null;
    }

    /** Devuelve {nombres, apellidos} o null si no hay dato suficiente para separarlos. */
    private String[] dividirNombre(AdUsuarioCache cuenta) {
        if (isNotBlank(cuenta.getGivenName()) && isNotBlank(cuenta.getSurname())) {
            return new String[]{cuenta.getGivenName().trim(), cuenta.getSurname().trim()};
        }
        String displayName = cuenta.getDisplayName();
        if (displayName == null || !displayName.contains(" ")) {
            return null;
        }
        int idx = displayName.indexOf(' ');
        return new String[]{displayName.substring(0, idx).trim(), displayName.substring(idx + 1).trim()};
    }

    private static boolean isNotBlank(String value) {
        return value != null && !value.isBlank();
    }
}
