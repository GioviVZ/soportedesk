package com.inia.soportedesk.telefoniafija;

import com.inia.soportedesk.catalogo.Dependencia;
import com.inia.soportedesk.catalogo.DependenciaRepository;
import com.inia.soportedesk.catalogo.Sede;
import com.inia.soportedesk.catalogo.SedeRepository;
import com.inia.soportedesk.catalogo.Subdependencia;
import com.inia.soportedesk.catalogo.SubdependenciaRepository;
import com.inia.soportedesk.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class TelefonoFijoService {

    private static final Set<String> ESTADOS = Set.of("Operativo", "En revisión", "Inactivo", "De baja");
    private static final Pattern IPV4 = Pattern.compile(
            "^(?:(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)\\.){3}(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)$");
    private static final Pattern MAC = Pattern.compile("^([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}$");

    private final TelefonoFijoRepository repository;
    private final AsignacionAnexoRepository asignacionRepository;
    private final SedeRepository sedeRepository;
    private final DependenciaRepository dependenciaRepository;
    private final SubdependenciaRepository subdependenciaRepository;

    @Transactional(readOnly = true)
    public List<TelefonoFijo> findAll(TipoTelefonoFijo tipo, String search) {
        if (search != null && !search.isBlank()) {
            return repository.search(tipo, search.trim());
        }
        return tipo == null
                ? repository.findAllByOrderByIdDesc()
                : repository.findByTipoOrderByIdDesc(tipo);
    }

    @Transactional(readOnly = true)
    public TelefonoFijo findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Teléfono fijo no encontrado: " + id));
    }

    @Transactional(readOnly = true)
    public TelefonoFijoResumen resumen() {
        List<TelefonoFijo> telefonos = repository.findAllByOrderByIdDesc();
        long operativos = telefonos.stream().filter(t -> "Operativo".equals(t.getEstado())).count();
        long enRevision = telefonos.stream().filter(t -> "En revisión".equals(t.getEstado())).count();
        long sinAsignar = telefonos.stream()
                .filter(t -> !asignacionRepository.existsByTelefonoFijoIdAndEstado(t.getId(), "Activa"))
                .count();
        return new TelefonoFijoResumen(telefonos.size(), operativos, enRevision, sinAsignar);
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public TelefonoFijo create(TelefonoFijoRequest request) {
        validateRequest(request, null);
        TelefonoFijo telefono = new TelefonoFijo();
        copyFields(telefono, request);
        return repository.save(telefono);
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public TelefonoFijo update(Long id, TelefonoFijoRequest request) {
        TelefonoFijo telefono = findById(id);
        validateRequest(request, id);
        copyFields(telefono, request);
        telefono.setUpdatedAt(LocalDateTime.now());
        return repository.save(telefono);
    }

    @Transactional
    public void delete(Long id) {
        TelefonoFijo telefono = findById(id);
        if (asignacionRepository.existsByTelefonoFijoId(id)) {
            throw new IllegalArgumentException(
                    "No se puede eliminar: el teléfono tiene asignaciones de anexo registradas.");
        }
        repository.delete(telefono);
    }

    private void validateRequest(TelefonoFijoRequest request, Long currentId) {
        if (request.getTipo() == null) {
            throw new IllegalArgumentException("El tipo de teléfono es obligatorio.");
        }
        if (emptyToNull(request.getMarca()) == null || emptyToNull(request.getModelo()) == null) {
            throw new IllegalArgumentException("La marca y el modelo son obligatorios.");
        }
        String estado = emptyToNull(request.getEstado());
        if (estado == null || !ESTADOS.contains(estado)) {
            throw new IllegalArgumentException("El estado del teléfono no es válido");
        }

        String ip = emptyToNull(request.getIp());
        if (ip != null && !IPV4.matcher(ip).matches()) {
            throw new IllegalArgumentException("La IP no es válida");
        }
        String mac = normalizeMac(request.getMac());
        if (mac != null && !MAC.matcher(mac).matches()) {
            throw new IllegalArgumentException("La MAC no es válida");
        }

        validateUnique(
                emptyToNull(request.getSerie()), currentId,
                repository::existsBySerieIgnoreCase,
                repository::existsBySerieIgnoreCaseAndIdNot,
                "Ya existe un teléfono fijo con la serie %s.");
        validateUnique(
                mac, currentId,
                repository::existsByMacIgnoreCase,
                repository::existsByMacIgnoreCaseAndIdNot,
                "Ya existe un teléfono fijo con la MAC %s.");
        validateUnique(
                ip, currentId,
                repository::existsByIpIgnoreCase,
                repository::existsByIpIgnoreCaseAndIdNot,
                "Ya existe un teléfono fijo con la IP %s.");
        validateUnique(
                emptyToNull(request.getCodigoPatrimonial()), currentId,
                repository::existsByCodigoPatrimonialIgnoreCase,
                repository::existsByCodigoPatrimonialIgnoreCaseAndIdNot,
                "Ya existe un teléfono fijo con el código patrimonial %s.");
        validateUnique(
                emptyToNull(request.getCodigoInventario()), currentId,
                repository::existsByCodigoInventarioIgnoreCase,
                repository::existsByCodigoInventarioIgnoreCaseAndIdNot,
                "Ya existe un teléfono fijo con el código de inventario %s.");
    }

    private void copyFields(TelefonoFijo telefono, TelefonoFijoRequest request) {
        Sede sede = request.getSedeId() == null
                ? null
                : sedeRepository.findById(request.getSedeId())
                        .orElseThrow(() -> new ResourceNotFoundException("Sede no encontrada: " + request.getSedeId()));
        Dependencia dependencia = request.getDependenciaId() == null
                ? null
                : dependenciaRepository.findById(request.getDependenciaId())
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Dependencia no encontrada: " + request.getDependenciaId()));
        Subdependencia subdependencia = request.getSubdependenciaId() == null
                ? null
                : subdependenciaRepository.findById(request.getSubdependenciaId())
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Subdependencia no encontrada: " + request.getSubdependenciaId()));

        if (sede != null && dependencia != null && dependencia.getSede() != null
                && !sede.getId().equals(dependencia.getSede().getId())) {
            throw new IllegalArgumentException("La dependencia seleccionada no pertenece a la sede indicada.");
        }
        if (dependencia != null && subdependencia != null && subdependencia.getDependencia() != null
                && !dependencia.getId().equals(subdependencia.getDependencia().getId())) {
            throw new IllegalArgumentException(
                    "La subdependencia seleccionada no pertenece a la dependencia indicada.");
        }

        telefono.setTipo(request.getTipo());
        telefono.setSede(sede);
        telefono.setDependencia(dependencia);
        telefono.setSubdependencia(subdependencia);
        telefono.setReferencia(emptyToNull(request.getReferencia()));
        telefono.setLatitud(request.getLatitud());
        telefono.setLongitud(request.getLongitud());
        telefono.setEdificio(emptyToNull(request.getEdificio()));
        telefono.setPiso(emptyToNull(request.getPiso()));
        telefono.setMarca(emptyToNull(request.getMarca()));
        telefono.setModelo(emptyToNull(request.getModelo()));
        telefono.setSerie(emptyToNull(request.getSerie()));
        telefono.setMac(normalizeMac(request.getMac()));
        telefono.setIp(emptyToNull(request.getIp()));
        telefono.setHost(emptyToNull(request.getHost()));
        telefono.setCodigoPatrimonial(emptyToNull(request.getCodigoPatrimonial()));
        telefono.setCodigoInventario(emptyToNull(request.getCodigoInventario()));
        telefono.setEstado(emptyToNull(request.getEstado()));
        telefono.setObservaciones(emptyToNull(request.getObservaciones()));
    }

    private void validateUnique(
            String value,
            Long currentId,
            java.util.function.Predicate<String> createExists,
            java.util.function.BiPredicate<String, Long> updateExists,
            String message) {
        if (value == null) {
            return;
        }
        boolean exists = currentId == null ? createExists.test(value) : updateExists.test(value, currentId);
        if (exists) {
            throw new IllegalArgumentException(message.formatted(value));
        }
    }

    private String normalizeMac(String value) {
        String mac = emptyToNull(value);
        return mac == null ? null : mac.replace('-', ':').toUpperCase(Locale.ROOT);
    }

    private String emptyToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
