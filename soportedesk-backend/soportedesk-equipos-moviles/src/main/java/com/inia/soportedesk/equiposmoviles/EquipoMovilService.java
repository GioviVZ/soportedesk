package com.inia.soportedesk.equiposmoviles;

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

@Service
@RequiredArgsConstructor
public class EquipoMovilService {

    private static final Set<String> ESTADOS = Set.of("Operativo", "En revisión", "Inactivo", "De baja");

    private final EquipoMovilRepository repository;
    private final AsignacionNumeroMovilRepository asignacionRepository;
    private final ActaMovilRepository actaRepository;
    private final SedeRepository sedeRepository;
    private final DependenciaRepository dependenciaRepository;
    private final SubdependenciaRepository subdependenciaRepository;

    @Transactional(readOnly = true)
    public List<EquipoMovil> findAll(TipoEquipoMovil tipo, String search) {
        if (search != null && !search.isBlank()) {
            return repository.search(tipo, search.trim());
        }
        return tipo == null
                ? repository.findAllByOrderByIdDesc()
                : repository.findByTipoOrderByIdDesc(tipo);
    }

    @Transactional(readOnly = true)
    public EquipoMovil findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Equipo móvil no encontrado: " + id));
    }

    @Transactional(readOnly = true)
    public EquipoMovilResumen resumen() {
        List<EquipoMovil> equipos = repository.findAllByOrderByIdDesc();
        long operativos = equipos.stream().filter(e -> "Operativo".equals(e.getEstado())).count();
        long enRevision = equipos.stream().filter(e -> "En revisión".equals(e.getEstado())).count();
        long sinAsignar = equipos.stream()
                .filter(e -> !asignacionRepository.existsByEquipoMovilIdAndEstado(e.getId(), "Activa"))
                .count();
        return new EquipoMovilResumen(equipos.size(), operativos, enRevision, sinAsignar);
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public EquipoMovil create(EquipoMovilRequest request) {
        validateRequest(request, null);
        EquipoMovil equipo = new EquipoMovil();
        copyFields(equipo, request);
        return repository.save(equipo);
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public EquipoMovil update(Long id, EquipoMovilRequest request) {
        EquipoMovil equipo = findById(id);
        validateRequest(request, id);
        copyFields(equipo, request);
        equipo.setUpdatedAt(LocalDateTime.now());
        return repository.save(equipo);
    }

    @Transactional
    public void delete(Long id) {
        EquipoMovil equipo = findById(id);
        if (asignacionRepository.existsByEquipoMovilId(id) || actaRepository.existsByEquiposId(id)) {
            throw new IllegalArgumentException(
                    "No se puede eliminar: el equipo tiene asignaciones o actas registradas.");
        }
        repository.delete(equipo);
    }

    private void validateRequest(EquipoMovilRequest request, Long currentId) {
        if (request.getTipo() == null) {
            throw new IllegalArgumentException("El tipo de equipo es obligatorio.");
        }
        if (emptyToNull(request.getMarca()) == null || emptyToNull(request.getModelo()) == null) {
            throw new IllegalArgumentException("La marca y el modelo son obligatorios.");
        }
        String estado = emptyToNull(request.getEstado());
        if (estado == null || !ESTADOS.contains(estado)) {
            throw new IllegalArgumentException("El estado del equipo no es válido");
        }

        String imei1 = emptyToNull(request.getImei1());
        String imei2 = emptyToNull(request.getImei2());
        validateImei(imei1);
        validateImei(imei2);
        if (imei1 != null && imei1.equals(imei2)) {
            throw new IllegalArgumentException("El IMEI 1 y el IMEI 2 deben ser diferentes.");
        }
        validateUniqueImei(imei1, currentId);
        validateUniqueImei(imei2, currentId);

        validateUnique(
                emptyToNull(request.getSerie()), currentId,
                repository::existsBySerieIgnoreCase,
                repository::existsBySerieIgnoreCaseAndIdNot,
                "Ya existe un equipo móvil con la serie %s.");
        validateUnique(
                normalizeMac(request.getMac()), currentId,
                repository::existsByMacIgnoreCase,
                repository::existsByMacIgnoreCaseAndIdNot,
                "Ya existe un equipo móvil con la MAC %s.");
        validateUnique(
                emptyToNull(request.getCodigoPatrimonial()), currentId,
                repository::existsByCodigoPatrimonialIgnoreCase,
                repository::existsByCodigoPatrimonialIgnoreCaseAndIdNot,
                "Ya existe un equipo móvil con el código patrimonial %s.");
        validateUnique(
                emptyToNull(request.getCodigoInventario()), currentId,
                repository::existsByCodigoInventarioIgnoreCase,
                repository::existsByCodigoInventarioIgnoreCaseAndIdNot,
                "Ya existe un equipo móvil con el código de inventario %s.");
    }

    private void copyFields(EquipoMovil equipo, EquipoMovilRequest request) {
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

        equipo.setTipo(request.getTipo());
        equipo.setSede(sede);
        equipo.setDependencia(dependencia);
        equipo.setSubdependencia(subdependencia);
        equipo.setReferencia(emptyToNull(request.getReferencia()));
        equipo.setLatitud(request.getLatitud());
        equipo.setLongitud(request.getLongitud());
        equipo.setEdificio(emptyToNull(request.getEdificio()));
        equipo.setPiso(emptyToNull(request.getPiso()));
        equipo.setMarca(emptyToNull(request.getMarca()));
        equipo.setModelo(emptyToNull(request.getModelo()));
        equipo.setSerie(emptyToNull(request.getSerie()));
        equipo.setImei1(emptyToNull(request.getImei1()));
        equipo.setImei2(emptyToNull(request.getImei2()));
        equipo.setMac(normalizeMac(request.getMac()));
        equipo.setSistemaOperativo(emptyToNull(request.getSistemaOperativo()));
        equipo.setAlmacenamiento(emptyToNull(request.getAlmacenamiento()));
        equipo.setCodigoPatrimonial(emptyToNull(request.getCodigoPatrimonial()));
        equipo.setCodigoInventario(emptyToNull(request.getCodigoInventario()));
        equipo.setEstado(emptyToNull(request.getEstado()));
        equipo.setObservaciones(emptyToNull(request.getObservaciones()));
    }

    private void validateImei(String imei) {
        if (imei == null) {
            return;
        }
        if (!imei.matches("\\d{15}") || !passesLuhn(imei)) {
            throw new IllegalArgumentException("El IMEI " + imei + " no es válido");
        }
    }

    private boolean passesLuhn(String value) {
        int sum = 0;
        for (int i = 0; i < value.length(); i++) {
            int digit = value.charAt(i) - '0';
            if (i % 2 == 1) {
                digit *= 2;
                digit = digit / 10 + digit % 10;
            }
            sum += digit;
        }
        return sum % 10 == 0;
    }

    private void validateUniqueImei(String imei, Long currentId) {
        if (imei != null && repository.existsImeiOnOtherEquipo(imei, currentId)) {
            throw new IllegalArgumentException("Ya existe un equipo móvil con el IMEI " + imei + ".");
        }
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
