package com.inia.soportedesk.equiposred;

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
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class EquipoRedService {

    private static final Pattern IPV4 = Pattern.compile(
            "^(?:(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)\\.){3}(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)$");

    private final EquipoRedRepository repository;
    private final SedeRepository sedeRepository;
    private final DependenciaRepository dependenciaRepository;
    private final SubdependenciaRepository subdependenciaRepository;

    @Transactional(readOnly = true)
    public List<EquipoRed> findAll(TipoEquipoRed tipo, String search) {
        if (search == null || search.isBlank()) {
            return repository.findByTipoOrderByIdDesc(tipo);
        }
        return repository.search(tipo, search.trim());
    }

    @Transactional(readOnly = true)
    public EquipoRed findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Equipo de red no encontrado: " + id));
    }

    @Transactional(readOnly = true)
    public EquipoRedResumen resumen(TipoEquipoRed tipo) {
        List<EquipoRed> equipos = repository.findByTipoOrderByIdDesc(tipo);
        long operativos = equipos.stream().filter(e -> "Operativo".equals(e.getEstado())).count();
        long enRevision = equipos.stream().filter(e -> "En revisión".equals(e.getEstado())).count();
        long inactivos = equipos.stream().filter(e -> "Inactivo".equals(e.getEstado())).count();
        long deBaja = equipos.stream().filter(e -> "De baja".equals(e.getEstado())).count();
        long sedes = equipos.stream()
                .map(EquipoRed::getSede)
                .filter(sede -> sede != null && sede.getId() != null)
                .map(Sede::getId)
                .distinct()
                .count();

        return new EquipoRedResumen(equipos.size(), operativos, enRevision, inactivos, deBaja, sedes);
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public EquipoRed create(EquipoRedRequest request) {
        validateUniqueIdentifiers(request, null);
        EquipoRed equipo = new EquipoRed();
        copyFields(equipo, request);
        return repository.save(equipo);
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public EquipoRed update(Long id, EquipoRedRequest request) {
        EquipoRed equipo = findById(id);
        validateUniqueIdentifiers(request, id);
        copyFields(equipo, request);
        equipo.setUpdatedAt(LocalDateTime.now());
        return repository.save(equipo);
    }

    @Transactional
    public void delete(Long id) {
        EquipoRed equipo = findById(id);
        repository.delete(equipo);
    }

    private void copyFields(EquipoRed equipo, EquipoRedRequest request) {
        Sede sede = resolveSede(request.getSedeId(), "Sede no encontrada: ");
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
        equipo.setGabinete(emptyToNull(request.getGabinete()));
        equipo.setMarca(emptyToNull(request.getMarca()));
        equipo.setModelo(emptyToNull(request.getModelo()));
        equipo.setSerie(emptyToNull(request.getSerie()));
        equipo.setCodigoPatrimonial(emptyToNull(request.getCodigoPatrimonial()));
        equipo.setCodigoInventario(emptyToNull(request.getCodigoInventario()));
        equipo.setEtiqueta(emptyToNull(request.getEtiqueta()));
        equipo.setMac(normalizeMac(request.getMac()));
        equipo.setIp(emptyToNull(request.getIp()));
        equipo.setIpPorDefecto(emptyToNull(request.getIpPorDefecto()));
        equipo.setHost(emptyToNull(request.getHost()));
        equipo.setEstado(emptyToNull(request.getEstado()));
        equipo.setObservaciones(emptyToNull(request.getObservaciones()));

        if (request.getTipo() == TipoEquipoRed.RADIOENLACE) {
            equipo.setRemotoSede(resolveSede(request.getRemotoSedeId(), "Sede remota no encontrada: "));
            equipo.setRemotoReferencia(emptyToNull(request.getRemotoReferencia()));
            equipo.setFrecuenciaGhz(request.getFrecuenciaGhz());
            equipo.setAnchoCanalMhz(request.getAnchoCanalMhz());
            equipo.setSsidEnlace(emptyToNull(request.getSsidEnlace()));
        } else {
            equipo.setRemotoSede(null);
            equipo.setRemotoReferencia(null);
            equipo.setFrecuenciaGhz(null);
            equipo.setAnchoCanalMhz(null);
            equipo.setSsidEnlace(null);
        }
    }

    private Sede resolveSede(Long id, String messagePrefix) {
        if (id == null) {
            return null;
        }
        return sedeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(messagePrefix + id));
    }

    private void validateUniqueIdentifiers(EquipoRedRequest request, Long currentId) {
        String serie = emptyToNull(request.getSerie());
        if (serie != null && existsSerie(serie, currentId)) {
            throw new IllegalArgumentException("Ya existe un equipo de red con la serie " + serie + ".");
        }

        String codigoPatrimonial = emptyToNull(request.getCodigoPatrimonial());
        if (codigoPatrimonial != null && existsCodigoPatrimonial(codigoPatrimonial, currentId)) {
            throw new IllegalArgumentException(
                    "Ya existe un equipo de red con el código patrimonial " + codigoPatrimonial + ".");
        }

        String codigoInventario = emptyToNull(request.getCodigoInventario());
        if (codigoInventario != null && existsCodigoInventario(codigoInventario, currentId)) {
            throw new IllegalArgumentException(
                    "Ya existe un equipo de red con el código de inventario " + codigoInventario + ".");
        }

        String ip = emptyToNull(request.getIp());
        validateIpv4(ip);
        if (ip != null && existsIp(ip, currentId)) {
            throw new IllegalArgumentException("Ya existe un equipo de red con la IP " + ip + ".");
        }

        validateIpv4(emptyToNull(request.getIpPorDefecto()));

        String mac = normalizeMac(request.getMac());
        if (mac != null && existsMac(mac, currentId)) {
            throw new IllegalArgumentException("Ya existe un equipo de red con la MAC " + mac + ".");
        }
    }

    private void validateIpv4(String ip) {
        if (ip != null && !IPV4.matcher(ip).matches()) {
            throw new IllegalArgumentException("La IP no es válida");
        }
    }

    private boolean existsSerie(String value, Long currentId) {
        return currentId == null
                ? repository.existsBySerieIgnoreCase(value)
                : repository.existsBySerieIgnoreCaseAndIdNot(value, currentId);
    }

    private boolean existsCodigoPatrimonial(String value, Long currentId) {
        return currentId == null
                ? repository.existsByCodigoPatrimonialIgnoreCase(value)
                : repository.existsByCodigoPatrimonialIgnoreCaseAndIdNot(value, currentId);
    }

    private boolean existsCodigoInventario(String value, Long currentId) {
        return currentId == null
                ? repository.existsByCodigoInventarioIgnoreCase(value)
                : repository.existsByCodigoInventarioIgnoreCaseAndIdNot(value, currentId);
    }

    private boolean existsIp(String value, Long currentId) {
        return currentId == null
                ? repository.existsByIpIgnoreCase(value)
                : repository.existsByIpIgnoreCaseAndIdNot(value, currentId);
    }

    private boolean existsMac(String value, Long currentId) {
        return currentId == null
                ? repository.existsByMacIgnoreCase(value)
                : repository.existsByMacIgnoreCaseAndIdNot(value, currentId);
    }

    private String normalizeMac(String value) {
        String mac = emptyToNull(value);
        return mac == null ? null : mac.replace('-', ':').toUpperCase(Locale.ROOT);
    }

    private String emptyToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
