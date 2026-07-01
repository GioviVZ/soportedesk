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
}
