package com.inia.soportedesk.correos;

import com.inia.soportedesk.gestiontiinia.VwGwDashboard;
import com.inia.soportedesk.gestiontiinia.VwGwDashboardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CorreoService {

    private final VwGwDashboardRepository repository;

    @Transactional(readOnly = true)
    public List<VwGwDashboard> findAll(
            String search,
            String sede,
            String dependencia,
            String subdependencia,
            String estado,
            String modalidad,
            Boolean sinUso30Dias) {
        return repository.findFiltered(
                normalize(search),
                normalize(sede),
                normalize(dependencia),
                normalize(subdependencia),
                normalize(estado),
                normalize(modalidad),
                Boolean.TRUE.equals(sinUso30Dias) ? LocalDateTime.now().minusDays(30) : null
        );
    }

    @Transactional(readOnly = true)
    public CorreoKpisDto getKpis() {
        List<VwGwDashboard> all = repository.findAll();
        if (all.isEmpty()) {
            return new CorreoKpisDto(0, 0, 0, 0, 0, 0, 0);
        }

        VwGwDashboard first = all.get(0);
        int licenciasTotales = first.getLicenciasTotales();
        int licenciasAsignadas = first.getLicenciasAsignadas() != null ? first.getLicenciasAsignadas() : 0;
        int licenciasDisponibles = first.getLicenciasDisponibles() != null ? first.getLicenciasDisponibles() : 0;

        long activas = all.stream().filter(v -> "Activo".equals(v.getEstado())).count();
        long suspendidas = all.stream().filter(v -> "Suspendido".equals(v.getEstado())).count();

        int sedeCentral = all.stream()
                .filter(v -> "Sede Central".equals(v.getCategoria()) && v.getTotalUsuariosCategoria() != null)
                .mapToInt(VwGwDashboard::getTotalUsuariosCategoria)
                .findFirst()
                .orElse(0);

        int eeas = all.stream()
                .filter(v -> "EEAs".equals(v.getCategoria()) && v.getTotalUsuariosCategoria() != null)
                .mapToInt(VwGwDashboard::getTotalUsuariosCategoria)
                .findFirst()
                .orElse(0);

        return new CorreoKpisDto(
                licenciasTotales,
                licenciasAsignadas,
                licenciasDisponibles,
                activas,
                suspendidas,
                sedeCentral,
                eeas
        );
    }

    @Transactional(readOnly = true)
    public List<String> getSedes() {
        return repository.findDistinctSedes();
    }

    @Transactional(readOnly = true)
    public List<String> getDependencias() {
        return repository.findDistinctDependencias();
    }

    @Transactional(readOnly = true)
    public List<String> getSubdependencias(String dependencia) {
        return repository.findDistinctSubdependencias(normalize(dependencia));
    }

    private String normalize(String value) {
        return value != null && !value.isBlank() ? value : null;
    }

    private static final int INACTIVIDAD_DIAS = 30;

    @Transactional(readOnly = true)
    public CorreoDashboardCompleto getDashboardCompleto() {
        try {
            List<VwGwDashboard> all = repository.findAll();
            CorreoKpisDto kpis = getKpis();

            List<CorreoDependenciaCount> distribucion = all.stream()
                    .collect(java.util.stream.Collectors.groupingBy(
                            v -> v.getOficinaPadre() == null || v.getOficinaPadre().isBlank() ? "Sin dependencia" : v.getOficinaPadre(),
                            java.util.LinkedHashMap::new,
                            java.util.stream.Collectors.counting()))
                    .entrySet().stream()
                    .map(e -> new CorreoDependenciaCount(e.getKey(), e.getValue()))
                    .sorted(java.util.Comparator.comparing(CorreoDependenciaCount::dependencia))
                    .toList();

            long con2FA = all.stream().filter(v -> "Enrolado".equals(v.getVerificacion2Pasos())).count();
            double porcentaje = all.isEmpty() ? 0.0 : (con2FA * 100.0) / all.size();

            LocalDateTime umbral = LocalDateTime.now().minusDays(INACTIVIDAD_DIAS);
            List<VwGwDashboard> sinUso = all.stream()
                    .filter(v -> v.getUltimoInicioSesion() == null || v.getUltimoInicioSesion().isBefore(umbral))
                    .sorted(java.util.Comparator.comparing(
                            VwGwDashboard::getUltimoInicioSesion,
                            java.util.Comparator.nullsFirst(java.util.Comparator.naturalOrder())))
                    .toList();

            return new CorreoDashboardCompleto(
                    kpis,
                    distribucion,
                    con2FA, all.size(), porcentaje,
                    sinUso.stream().limit(10).map(this::toAlerta).toList(),
                    sinUso.size()
            );
        } catch (Exception e) {
            return new CorreoDashboardCompleto(
                    new CorreoKpisDto(0, 0, 0, 0, 0, 0, 0), List.of(), 0, 0, 0.0, List.of(), 0);
        }
    }

    private CorreoInactividadAlerta toAlerta(VwGwDashboard v) {
        String detalle = v.getUltimoInicioSesion() == null
                ? "Sin acceso registrado"
                : "Sin acceso desde " + v.getUltimoInicioSesion().toLocalDate();
        return new CorreoInactividadAlerta(v.getEmail(), v.getNombreCompleto(), detalle);
    }
}
