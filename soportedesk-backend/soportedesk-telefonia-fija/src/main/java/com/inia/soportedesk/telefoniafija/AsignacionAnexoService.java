package com.inia.soportedesk.telefoniafija;

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
public class AsignacionAnexoService {

    private static final Set<String> ESTADOS = Set.of("Activa", "Finalizada");

    private final AsignacionAnexoRepository repository;
    private final TelefonoFijoRepository telefonoRepository;
    private final DependenciaRepository dependenciaRepository;

    @Transactional(readOnly = true)
    public List<AsignacionAnexo> findAll(String search, Long sedeId, String estado) {
        return repository.search(
                search == null ? "" : search.trim(),
                sedeId,
                emptyToNull(estado));
    }

    @Transactional(readOnly = true)
    public AsignacionAnexo findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Asignación de anexo no encontrada: " + id));
    }

    @Transactional(readOnly = true)
    public AsignacionAnexoResumen resumen() {
        List<AsignacionAnexo> asignaciones = repository.search("", null, null);
        long activas = asignaciones.stream().filter(a -> "Activa".equals(a.getEstado())).count();
        long finalizadas = asignaciones.stream().filter(a -> "Finalizada".equals(a.getEstado())).count();
        long sedes = asignaciones.stream()
                .filter(a -> "Activa".equals(a.getEstado()))
                .map(AsignacionAnexo::getTelefonoFijo)
                .filter(telefono -> telefono != null && telefono.getSede() != null)
                .map(telefono -> telefono.getSede().getId())
                .distinct()
                .count();
        return new AsignacionAnexoResumen(asignaciones.size(), activas, finalizadas, sedes);
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public AsignacionAnexo create(AsignacionAnexoRequest request) {
        validateRequest(request, null);
        AsignacionAnexo asignacion = new AsignacionAnexo();
        copyFields(asignacion, request);
        return repository.save(asignacion);
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public AsignacionAnexo update(Long id, AsignacionAnexoRequest request) {
        AsignacionAnexo asignacion = findById(id);
        validateRequest(request, id);
        copyFields(asignacion, request);
        asignacion.setUpdatedAt(LocalDateTime.now());
        return repository.save(asignacion);
    }

    @Transactional
    public void delete(Long id) {
        repository.delete(findById(id));
    }

    private void validateRequest(AsignacionAnexoRequest request, Long currentId) {
        String anexo = emptyToNull(request.getAnexo());
        if (anexo == null || !anexo.matches("^\\d{3,6}$")) {
            throw new IllegalArgumentException("El anexo debe tener entre 3 y 6 dígitos");
        }

        String numeroDirecto = emptyToNull(request.getNumeroDirecto());
        if (numeroDirecto != null && !numeroDirecto.matches("^\\d{6,9}$")) {
            throw new IllegalArgumentException("El número directo debe tener entre 6 y 9 dígitos");
        }

        String personaDni = emptyToNull(request.getPersonaDni());
        if (personaDni != null && !personaDni.matches("^\\d{8}$")) {
            throw new IllegalArgumentException("El DNI debe tener 8 dígitos");
        }
        if (emptyToNull(request.getPersonaNombre()) == null) {
            throw new IllegalArgumentException("El nombre de la persona es obligatorio.");
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
        if (request.getTelefonoFijoId() == null || !telefonoRepository.existsById(request.getTelefonoFijoId())) {
            throw new ResourceNotFoundException("Teléfono fijo no encontrado: " + request.getTelefonoFijoId());
        }

        if ("Activa".equals(estado)) {
            if (repository.existsActiveAnexo(anexo, currentId)) {
                throw new IllegalArgumentException("El anexo " + anexo + " ya tiene una asignación activa.");
            }
            if (numeroDirecto != null && repository.existsActiveNumeroDirecto(numeroDirecto, currentId)) {
                throw new IllegalArgumentException(
                        "El número directo " + numeroDirecto + " ya tiene una asignación activa.");
            }
        }
    }

    private void copyFields(AsignacionAnexo asignacion, AsignacionAnexoRequest request) {
        TelefonoFijo telefono = telefonoRepository.findById(request.getTelefonoFijoId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Teléfono fijo no encontrado: " + request.getTelefonoFijoId()));
        Dependencia dependencia = request.getDependenciaId() == null
                ? null
                : dependenciaRepository.findById(request.getDependenciaId())
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Dependencia no encontrada: " + request.getDependenciaId()));

        asignacion.setTelefonoFijo(telefono);
        asignacion.setAnexo(emptyToNull(request.getAnexo()));
        asignacion.setNumeroDirecto(emptyToNull(request.getNumeroDirecto()));
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
