package com.inia.soportedesk.impresoras;

import com.inia.soportedesk.catalogo.DependenciaRepository;
import com.inia.soportedesk.catalogo.ModeloImpresoraRepository;
import com.inia.soportedesk.catalogo.SedeRepository;
import com.inia.soportedesk.catalogo.SubdependenciaRepository;
import com.inia.soportedesk.catalogo.TipoImpresoraRepository;
import com.inia.soportedesk.exception.ResourceNotFoundException;
import com.inia.soportedesk.impresoras.intervencion.ImpresoraIntervencionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class ImpresoraService {

    private static final Pattern IPV4 = Pattern.compile(
            "^(?:(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)\\.){3}(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)$");

    private final ImpresoraRepository repository;
    private final SedeRepository sedeRepository;
    private final DependenciaRepository dependenciaRepository;
    private final SubdependenciaRepository subdependenciaRepository;
    private final TipoImpresoraRepository tipoImpresoraRepository;
    private final ModeloImpresoraRepository modeloImpresoraRepository;
    private final ImpresoraIntervencionService intervencionService;

    public List<Impresora> findAll(String search) {
        if (search == null || search.isBlank()) {
            return repository.findAll();
        }
        return repository.search(search);
    }

    public Impresora findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Impresora no encontrada: " + id));
    }

    @Transactional(readOnly = true)
    public ImpresoraDashboardCompleto getDashboardCompleto() {
        try {
            List<Impresora> all = repository.findAll();

            long activas = all.stream().filter(i -> "Activa".equals(i.getEstado())).count();
            long enMantenimiento = all.stream().filter(i -> "En mantenimiento".equals(i.getEstado())).count();
            long deBaja = all.stream().filter(i -> "De baja".equals(i.getEstado())).count();

            List<ImpresoraMarcaCount> distribucionPorMarca = all.stream()
                    .collect(java.util.stream.Collectors.groupingBy(
                            i -> i.getModeloImpresora().getMarca().getNombre(),
                            java.util.LinkedHashMap::new,
                            java.util.stream.Collectors.counting()))
                    .entrySet().stream()
                    .map(e -> new ImpresoraMarcaCount(e.getKey(), e.getValue()))
                    .sorted(java.util.Comparator.comparing(ImpresoraMarcaCount::marca))
                    .toList();

            List<ImpresoraSedeCount> distribucionPorSede = all.stream()
                    .collect(java.util.stream.Collectors.groupingBy(
                            i -> i.getSede() == null ? "Sin sede" : i.getSede().getNombre(),
                            java.util.LinkedHashMap::new,
                            java.util.stream.Collectors.counting()))
                    .entrySet().stream()
                    .map(e -> new ImpresoraSedeCount(e.getKey(), e.getValue()))
                    .sorted(java.util.Comparator.comparing(ImpresoraSedeCount::sede))
                    .toList();

            List<ImpresoraDependenciaCount> distribucionPorDependencia = all.stream()
                    .collect(java.util.stream.Collectors.groupingBy(
                            i -> i.getDependencia() == null ? "Sin dependencia" : i.getDependencia().getNombre(),
                            java.util.LinkedHashMap::new,
                            java.util.stream.Collectors.counting()))
                    .entrySet().stream()
                    .map(e -> new ImpresoraDependenciaCount(e.getKey(), e.getValue()))
                    .sorted(java.util.Comparator.comparing(ImpresoraDependenciaCount::total).reversed()
                            .thenComparing(ImpresoraDependenciaCount::dependencia))
                    .toList();

            List<ImpresoraSubdependenciaCount> distribucionPorSubdependencia = all.stream()
                    .collect(java.util.stream.Collectors.groupingBy(
                            i -> i.getSubdependencia() == null ? "Sin subdependencia" : i.getSubdependencia().getNombre(),
                            java.util.LinkedHashMap::new,
                            java.util.stream.Collectors.counting()))
                    .entrySet().stream()
                    .map(e -> new ImpresoraSubdependenciaCount(e.getKey(), e.getValue()))
                    .sorted(java.util.Comparator.comparing(ImpresoraSubdependenciaCount::total).reversed()
                            .thenComparing(ImpresoraSubdependenciaCount::subdependencia))
                    .toList();

            java.util.Map<String, Long> consumibleCounts = new java.util.LinkedHashMap<>();
            java.util.Map<String, com.inia.soportedesk.catalogo.ModeloImpresoraToner> consumibleSample = new java.util.LinkedHashMap<>();
            for (Impresora impresora : all) {
                for (com.inia.soportedesk.catalogo.ModeloImpresoraToner toner : impresora.getModeloImpresora().getToners()) {
                    String key = toner.getColor() + "|" + toner.getVariante() + "|" + toner.getCodigo();
                    consumibleCounts.merge(key, 1L, Long::sum);
                    consumibleSample.putIfAbsent(key, toner);
                }
            }
            List<ImpresoraConsumibleCount> topConsumibles = consumibleCounts.entrySet().stream()
                    .sorted(java.util.Map.Entry.<String, Long>comparingByValue(java.util.Comparator.reverseOrder()))
                    .limit(10)
                    .map(e -> {
                        com.inia.soportedesk.catalogo.ModeloImpresoraToner t = consumibleSample.get(e.getKey());
                        return new ImpresoraConsumibleCount(t.getColor(), t.getVariante(), t.getCodigo(), e.getValue());
                    })
                    .toList();

            return new ImpresoraDashboardCompleto(
                    all.size(), activas, enMantenimiento, deBaja,
                    distribucionPorMarca, distribucionPorSede,
                    distribucionPorDependencia, distribucionPorSubdependencia,
                    topConsumibles, consumibleCounts.size()
            );
        } catch (Exception e) {
            return new ImpresoraDashboardCompleto(0, 0, 0, 0, List.of(), List.of(), List.of(), List.of(), List.of(), 0);
        }
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public Impresora create(ImpresoraRequest request) {
        validateUniqueIdentifiers(request, null);
        Impresora impresora = new Impresora();
        copyFields(impresora, request);
        return repository.save(impresora);
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public Impresora update(Long id, ImpresoraRequest request) {
        Impresora impresora = findById(id);
        validateUniqueIdentifiers(request, id);
        copyFields(impresora, request);
        return repository.save(impresora);
    }

    public void delete(Long id) {
        Impresora impresora = findById(id);
        intervencionService.eliminarTodasDeImpresora(id);
        repository.delete(impresora);
    }

    private void copyFields(Impresora impresora, ImpresoraRequest request) {
        impresora.setModeloImpresora(modeloImpresoraRepository.findById(request.getModeloImpresoraId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Modelo de impresora no encontrado: " + request.getModeloImpresoraId())));
        impresora.setEstado(request.getEstado());
        impresora.setSede(request.getSedeId() != null
                ? sedeRepository.findById(request.getSedeId())
                        .orElseThrow(() -> new ResourceNotFoundException("Sede no encontrada: " + request.getSedeId()))
                : null);
        impresora.setDependencia(request.getDependenciaId() != null
                ? dependenciaRepository.findById(request.getDependenciaId())
                        .orElseThrow(() -> new ResourceNotFoundException("Dependencia no encontrada: " + request.getDependenciaId()))
                : null);
        impresora.setSubdependencia(request.getSubdependenciaId() != null
                ? subdependenciaRepository.findById(request.getSubdependenciaId())
                        .orElseThrow(() -> new ResourceNotFoundException("Subdependencia no encontrada: " + request.getSubdependenciaId()))
                : null);
        impresora.setTipoImpresora(request.getTipoImpresoraId() != null
                ? tipoImpresoraRepository.findById(request.getTipoImpresoraId())
                        .orElseThrow(() -> new ResourceNotFoundException("Tipo de impresora no encontrado: " + request.getTipoImpresoraId()))
                : null);
        impresora.setSerie(emptyToNull(request.getSerie()));
        impresora.setCodigoInventario(emptyToNull(request.getCodigoInventario()));
        impresora.setCodigoPatrimonial(emptyToNull(request.getCodigoPatrimonial()));
        impresora.setReferencia(emptyToNull(request.getReferencia()));
        impresora.setTipoConexion(request.getTipoConexion().trim().toUpperCase());
        impresora.setIp("IP".equalsIgnoreCase(request.getTipoConexion()) ? emptyToNull(request.getIp()) : null);
    }

    private void validateUniqueIdentifiers(ImpresoraRequest request, Long currentId) {
        String serie = emptyToNull(request.getSerie());
        if (serie != null && existsSerie(serie, currentId)) {
            throw new IllegalArgumentException("Ya existe una impresora con la serie " + serie + ".");
        }

        String inventario = emptyToNull(request.getCodigoInventario());
        if (inventario != null && existsCodigoInventario(inventario, currentId)) {
            throw new IllegalArgumentException("Ya existe una impresora con el codigo de inventario " + inventario + ".");
        }

        String patrimonial = emptyToNull(request.getCodigoPatrimonial());
        if (patrimonial != null && existsCodigoPatrimonial(patrimonial, currentId)) {
            throw new IllegalArgumentException("Ya existe una impresora con el codigo patrimonial " + patrimonial + ".");
        }

        String ip = "IP".equalsIgnoreCase(request.getTipoConexion()) ? emptyToNull(request.getIp()) : null;
        if ("IP".equalsIgnoreCase(request.getTipoConexion()) && ip == null) {
            throw new IllegalArgumentException("Debe ingresar la direccion IP de la impresora.");
        }
        if (ip != null && !IPV4.matcher(ip).matches()) {
            throw new IllegalArgumentException("La direccion IP ingresada no es valida.");
        }
        if (ip != null && existsIp(ip, currentId)) {
            throw new IllegalArgumentException("La direccion IP " + ip + " ya esta asignada a otra impresora.");
        }
    }

    private boolean existsSerie(String value, Long currentId) {
        return currentId == null
                ? repository.existsBySerieIgnoreCase(value)
                : repository.existsBySerieIgnoreCaseAndIdNot(value, currentId);
    }

    private boolean existsCodigoInventario(String value, Long currentId) {
        return currentId == null
                ? repository.existsByCodigoInventarioIgnoreCase(value)
                : repository.existsByCodigoInventarioIgnoreCaseAndIdNot(value, currentId);
    }

    private boolean existsCodigoPatrimonial(String value, Long currentId) {
        return currentId == null
                ? repository.existsByCodigoPatrimonialIgnoreCase(value)
                : repository.existsByCodigoPatrimonialIgnoreCaseAndIdNot(value, currentId);
    }

    private boolean existsIp(String value, Long currentId) {
        return currentId == null
                ? repository.existsByIpIgnoreCase(value)
                : repository.existsByIpIgnoreCaseAndIdNot(value, currentId);
    }

    private String emptyToNull(String val) {
        return (val == null || val.isBlank()) ? null : val.trim();
    }
}
