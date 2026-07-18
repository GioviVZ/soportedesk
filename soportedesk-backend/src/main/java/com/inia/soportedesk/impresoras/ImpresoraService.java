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
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ImpresoraService {

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
                    topConsumibles, consumibleCounts.size()
            );
        } catch (Exception e) {
            return new ImpresoraDashboardCompleto(0, 0, 0, 0, List.of(), List.of(), List.of(), 0);
        }
    }

    @Transactional
    public Impresora create(ImpresoraRequest request) {
        Impresora impresora = new Impresora();
        copyFields(impresora, request);
        return repository.save(impresora);
    }

    @Transactional
    public Impresora update(Long id, ImpresoraRequest request) {
        Impresora impresora = findById(id);
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
        impresora.setTipoConexion(request.getTipoConexion());
        impresora.setIp("IP".equals(request.getTipoConexion()) ? emptyToNull(request.getIp()) : null);
    }

    private String emptyToNull(String val) {
        return (val == null || val.isBlank()) ? null : val.trim();
    }
}
