package com.inia.soportedesk.equiposmoviles;

import com.inia.soportedesk.catalogo.Dependencia;
import com.inia.soportedesk.catalogo.DependenciaRepository;
import com.inia.soportedesk.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AsignacionNumeroMovilService {

    private static final Set<String> OPERADORES = Set.of("Claro", "Movistar", "Entel", "Bitel", "Otro");
    private static final Set<String> ESTADOS = Set.of("Activa", "Finalizada");

    private final AsignacionNumeroMovilRepository repository;
    private final EquipoMovilRepository equipoRepository;
    private final DependenciaRepository dependenciaRepository;

    @Transactional(readOnly = true)
    public List<AsignacionNumeroMovil> findAll(String search, String operador, String estado) {
        return repository.search(
                search == null ? "" : search.trim(),
                emptyToNull(operador),
                emptyToNull(estado));
    }

    @Transactional(readOnly = true)
    public AsignacionNumeroMovil findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Asignación móvil no encontrada: " + id));
    }

    @Transactional(readOnly = true)
    public AsignacionNumeroMovilResumen resumen() {
        List<AsignacionNumeroMovil> asignaciones = repository.search("", null, null);
        long activas = asignaciones.stream().filter(a -> "Activa".equals(a.getEstado())).count();
        long finalizadas = asignaciones.stream().filter(a -> "Finalizada".equals(a.getEstado())).count();
        long operadores = asignaciones.stream()
                .filter(a -> "Activa".equals(a.getEstado()))
                .map(AsignacionNumeroMovil::getOperador)
                .filter(value -> value != null && !value.isBlank())
                .distinct()
                .count();
        return new AsignacionNumeroMovilResumen(asignaciones.size(), activas, finalizadas, operadores);
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public AsignacionNumeroMovil create(AsignacionNumeroMovilRequest request) {
        validateRequest(request, null);
        AsignacionNumeroMovil asignacion = new AsignacionNumeroMovil();
        copyFields(asignacion, request);
        return repository.save(asignacion);
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public AsignacionNumeroMovil update(Long id, AsignacionNumeroMovilRequest request) {
        AsignacionNumeroMovil asignacion = findById(id);
        validateRequest(request, id);
        copyFields(asignacion, request);
        asignacion.setUpdatedAt(LocalDateTime.now());
        return repository.save(asignacion);
    }

    @Transactional
    public void delete(Long id) {
        repository.delete(findById(id));
    }

    private void validateRequest(AsignacionNumeroMovilRequest request, Long currentId) {
        String numero = emptyToNull(request.getNumero());
        if (numero == null || !numero.matches("^9\\d{8}$")) {
            throw new IllegalArgumentException("El número debe tener 9 dígitos y empezar con 9");
        }

        String simIccid = emptyToNull(request.getSimIccid());
        if (simIccid != null && !simIccid.matches("^\\d{19,20}$")) {
            throw new IllegalArgumentException("El ICCID debe tener 19 o 20 dígitos");
        }

        String personaDni = emptyToNull(request.getPersonaDni());
        if (personaDni != null && !personaDni.matches("^\\d{8}$")) {
            throw new IllegalArgumentException("El DNI debe tener 8 dígitos");
        }
        if (request.getFechaInicio() == null) {
            throw new IllegalArgumentException("La fecha de inicio es obligatoria.");
        }
        if (request.getFechaFin() != null && request.getFechaFin().isBefore(request.getFechaInicio())) {
            throw new IllegalArgumentException("La fecha de fin no puede ser anterior a la fecha de inicio.");
        }

        String estado = emptyToNull(request.getEstado());
        if (estado == null || !ESTADOS.contains(estado)) {
            throw new IllegalArgumentException("El estado de la asignación no es válido");
        }
        if ("Finalizada".equals(estado) && request.getFechaFin() == null) {
            throw new IllegalArgumentException("Una asignación finalizada debe tener fecha de fin.");
        }
        if (!OPERADORES.contains(emptyToNull(request.getOperador()))) {
            throw new IllegalArgumentException("El operador no es válido");
        }
        if (emptyToNull(request.getPersonaNombre()) == null) {
            throw new IllegalArgumentException("El nombre de la persona es obligatorio.");
        }
        if (request.getEquipoMovilId() == null || !equipoRepository.existsById(request.getEquipoMovilId())) {
            throw new ResourceNotFoundException("Equipo móvil no encontrado: " + request.getEquipoMovilId());
        }

        if ("Activa".equals(estado)) {
            if (repository.existsActiveNumero(numero, currentId)) {
                throw new IllegalArgumentException("El número " + numero + " ya tiene una asignación activa.");
            }
            if (simIccid != null && repository.existsActiveIccid(simIccid, currentId)) {
                throw new IllegalArgumentException("El ICCID " + simIccid + " ya tiene una asignación activa.");
            }
        }
    }

    private void copyFields(AsignacionNumeroMovil asignacion, AsignacionNumeroMovilRequest request) {
        EquipoMovil equipo = equipoRepository.findById(request.getEquipoMovilId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Equipo móvil no encontrado: " + request.getEquipoMovilId()));
        Dependencia dependencia = request.getDependenciaId() == null
                ? null
                : dependenciaRepository.findById(request.getDependenciaId())
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Dependencia no encontrada: " + request.getDependenciaId()));

        asignacion.setEquipoMovil(equipo);
        asignacion.setNumero(emptyToNull(request.getNumero()));
        asignacion.setOperador(emptyToNull(request.getOperador()));
        asignacion.setPlan(emptyToNull(request.getPlan()));
        asignacion.setSimIccid(emptyToNull(request.getSimIccid()));
        asignacion.setPersonaNombre(emptyToNull(request.getPersonaNombre()));
        asignacion.setPersonaDni(emptyToNull(request.getPersonaDni()));
        asignacion.setDependencia(dependencia);
        asignacion.setFechaInicio(request.getFechaInicio());
        asignacion.setFechaFin(request.getFechaFin());
        asignacion.setEstado(emptyToNull(request.getEstado()));
        asignacion.setObservaciones(emptyToNull(request.getObservaciones()));
    }

    private String emptyToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
