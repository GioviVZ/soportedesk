package com.inia.soportedesk.equiposmoviles;

import com.inia.soportedesk.catalogo.Dependencia;
import com.inia.soportedesk.catalogo.DependenciaRepository;
import com.inia.soportedesk.common.FileStorageException;
import com.inia.soportedesk.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ActaMovilService {

    private static final Set<String> TIPOS = Set.of("Entrega", "Devolución", "Transferencia");
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "application/pdf", "image/jpeg", "image/png");
    private static final long MAX_FILE_SIZE = 10L * 1024 * 1024;
    private static final String INVALID_FILE_MESSAGE =
            "El archivo debe ser PDF, JPG o PNG de hasta 10 MB.";

    private final ActaMovilRepository repository;
    private final EquipoMovilRepository equipoRepository;
    private final DependenciaRepository dependenciaRepository;
    private final ActaMovilStorageService storageService;

    @Transactional(readOnly = true)
    public List<ActaMovil> findAll(String search, String tipo, LocalDate desde, LocalDate hasta) {
        if (desde != null && hasta != null && hasta.isBefore(desde)) {
            throw new IllegalArgumentException("La fecha hasta no puede ser anterior a la fecha desde.");
        }
        return repository.search(
                search == null ? "" : search.trim(),
                emptyToNull(tipo),
                desde,
                hasta);
    }

    @Transactional(readOnly = true)
    public ActaMovil findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Acta móvil no encontrada: " + id));
    }

    @Transactional(readOnly = true)
    public ActaMovilResumen resumen() {
        List<ActaMovil> actas = repository.findAllByOrderByIdDesc();
        long entregas = actas.stream().filter(a -> "Entrega".equals(a.getTipo())).count();
        long devoluciones = actas.stream().filter(a -> "Devolución".equals(a.getTipo())).count();
        long transferencias = actas.stream().filter(a -> "Transferencia".equals(a.getTipo())).count();
        return new ActaMovilResumen(actas.size(), entregas, devoluciones, transferencias);
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public ActaMovil create(ActaMovilRequest request) {
        validateRequest(request, null);
        ActaMovil acta = new ActaMovil();
        copyFields(acta, request);
        return repository.save(acta);
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public ActaMovil update(Long id, ActaMovilRequest request) {
        ActaMovil acta = findById(id);
        validateRequest(request, id);
        copyFields(acta, request);
        acta.setUpdatedAt(LocalDateTime.now());
        return repository.save(acta);
    }

    @Transactional
    public void delete(Long id) {
        ActaMovil acta = findById(id);
        if (acta.getArchivoRuta() != null) {
            storageService.delete(acta.getArchivoRuta());
        }
        repository.delete(acta);
    }

    @Transactional
    public ActaMovil uploadFile(Long id, MultipartFile file) {
        validateFile(file);
        ActaMovil acta = findById(id);
        String previousPath = acta.getArchivoRuta();
        String newPath = storageService.store(id, file);
        acta.setArchivoNombre(safeOriginalName(file));
        acta.setArchivoRuta(newPath);
        acta.setArchivoContentType(file.getContentType());
        acta.setArchivoTamano(file.getSize());
        acta.setUpdatedAt(LocalDateTime.now());
        ActaMovil saved = repository.save(acta);
        if (previousPath != null && !previousPath.equals(newPath)) {
            storageService.delete(previousPath);
        }
        return saved;
    }

    @Transactional(readOnly = true)
    public ArchivoActaMovil loadFile(Long id) {
        ActaMovil acta = findById(id);
        if (!acta.isTieneArchivo()) {
            throw new ResourceNotFoundException("El acta no tiene un archivo adjunto: " + id);
        }
        Path path = storageService.load(acta.getArchivoRuta());
        return new ArchivoActaMovil(path, acta.getArchivoContentType(), acta.getArchivoNombre());
    }

    @Transactional
    public void deleteFile(Long id) {
        ActaMovil acta = findById(id);
        if (acta.getArchivoRuta() != null) {
            storageService.delete(acta.getArchivoRuta());
        }
        acta.setArchivoNombre(null);
        acta.setArchivoRuta(null);
        acta.setArchivoContentType(null);
        acta.setArchivoTamano(null);
        acta.setUpdatedAt(LocalDateTime.now());
        repository.save(acta);
    }

    private void validateRequest(ActaMovilRequest request, Long currentId) {
        String numeroActa = emptyToNull(request.getNumeroActa());
        if (numeroActa == null) {
            throw new IllegalArgumentException("El número de acta es obligatorio.");
        }
        boolean duplicate = currentId == null
                ? repository.existsByNumeroActaIgnoreCase(numeroActa)
                : repository.existsByNumeroActaIgnoreCaseAndIdNot(numeroActa, currentId);
        if (duplicate) {
            throw new IllegalArgumentException("Ya existe un acta móvil con el número " + numeroActa + ".");
        }
        if (!TIPOS.contains(emptyToNull(request.getTipo()))) {
            throw new IllegalArgumentException("El tipo de acta no es válido");
        }
        if (request.getFecha() == null) {
            throw new IllegalArgumentException("La fecha es obligatoria.");
        }
        if (emptyToNull(request.getPersonaNombre()) == null) {
            throw new IllegalArgumentException("El nombre de la persona es obligatorio.");
        }
        String dni = emptyToNull(request.getPersonaDni());
        if (dni != null && !dni.matches("^\\d{8}$")) {
            throw new IllegalArgumentException("El DNI debe tener 8 dígitos");
        }
        if (request.getEquipoMovilIds() == null || request.getEquipoMovilIds().isEmpty()) {
            throw new IllegalArgumentException("Debe seleccionar al menos un equipo móvil.");
        }
        resolveEquipos(request.getEquipoMovilIds());
    }

    private void copyFields(ActaMovil acta, ActaMovilRequest request) {
        Dependencia dependencia = request.getDependenciaId() == null
                ? null
                : dependenciaRepository.findById(request.getDependenciaId())
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Dependencia no encontrada: " + request.getDependenciaId()));
        acta.setNumeroActa(emptyToNull(request.getNumeroActa()));
        acta.setTipo(emptyToNull(request.getTipo()));
        acta.setFecha(request.getFecha());
        acta.setPersonaNombre(emptyToNull(request.getPersonaNombre()));
        acta.setPersonaDni(emptyToNull(request.getPersonaDni()));
        acta.setDependencia(dependencia);
        acta.setObservaciones(emptyToNull(request.getObservaciones()));
        acta.setEquipos(resolveEquipos(request.getEquipoMovilIds()));
    }

    private Set<EquipoMovil> resolveEquipos(List<Long> equipoIds) {
        if (equipoIds == null || equipoIds.stream().anyMatch(id -> id == null)) {
            throw new ResourceNotFoundException("Uno o más equipos móviles no existen.");
        }
        Set<Long> requestedIds = new LinkedHashSet<>(equipoIds);
        List<EquipoMovil> equipos = equipoRepository.findAllById(requestedIds);
        if (equipos.size() != requestedIds.size()) {
            throw new ResourceNotFoundException("Uno o más equipos móviles no existen.");
        }
        return new LinkedHashSet<>(equipos);
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.getContentType() == null
                || !ALLOWED_CONTENT_TYPES.contains(file.getContentType())
                || file.getSize() > MAX_FILE_SIZE) {
            throw new FileStorageException(INVALID_FILE_MESSAGE);
        }
    }

    private String safeOriginalName(MultipartFile file) {
        String originalName = file.getOriginalFilename() == null ? "archivo" : file.getOriginalFilename();
        return Path.of(originalName).getFileName().toString();
    }

    private String emptyToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
