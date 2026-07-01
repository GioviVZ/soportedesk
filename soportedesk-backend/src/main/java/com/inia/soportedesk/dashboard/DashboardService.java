package com.inia.soportedesk.dashboard;

import com.inia.soportedesk.equipos.EquipoRepository;
import com.inia.soportedesk.impresoras.ImpresoraRepository;
import com.inia.soportedesk.licencias.LicenciaRepository;
import com.inia.soportedesk.gestiontiinia.VwGwDashboardRepository;
import com.inia.soportedesk.usuariosred.UsuarioRedRepository;
import com.inia.soportedesk.vpn.VpnRepository;
import com.inia.soportedesk.wifi.WifiRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final LicenciaRepository licenciaRepository;
    private final VwGwDashboardRepository correoRepository;
    private final UsuarioRedRepository usuarioRedRepository;
    private final VpnRepository vpnRepository;
    private final WifiRepository wifiRepository;
    private final ImpresoraRepository impresoraRepository;
    private final EquipoRepository equipoRepository;

    public DashboardCounts getCounts() {
        return new DashboardCounts(
                licenciaRepository.count(),
                correoRepository.count(),
                usuarioRedRepository.count(),
                vpnRepository.count(),
                wifiRepository.count(),
                impresoraRepository.count(),
                equipoRepository.count(),
                usuarioRedRepository.countDesactivados()
        );
    }

    public List<UbicacionUsuariosCount> usuariosRedPorUbicacion(String nivel) {
        List<Object[]> rows = "dependencia".equalsIgnoreCase(nivel)
                ? usuarioRedRepository.countGroupedByDependenciaAndEstado()
                : usuarioRedRepository.countGroupedBySedeAndEstado();
        return pivot(rows);
    }

    public List<LicenciaTipoCount> licenciasPorTipo() {
        return licenciaRepository.sumCantidadGroupedByTipoLicencia().stream()
                .map(row -> new LicenciaTipoCount((String) row[0], ((Number) row[1]).longValue()))
                .toList();
    }

    private List<UbicacionUsuariosCount> pivot(List<Object[]> rows) {
        Map<String, long[]> acc = new LinkedHashMap<>();
        for (Object[] row : rows) {
            String nombre = (String) row[0];
            String estado = (String) row[1];
            long count = ((Number) row[2]).longValue();
            long[] pair = acc.computeIfAbsent(nombre, k -> new long[2]);
            if (estado != null && estado.equalsIgnoreCase("activo")) {
                pair[0] += count;
            } else {
                pair[1] += count;
            }
        }
        List<UbicacionUsuariosCount> result = new ArrayList<>();
        for (Map.Entry<String, long[]> entry : acc.entrySet()) {
            result.add(new UbicacionUsuariosCount(entry.getKey(), entry.getValue()[0], entry.getValue()[1]));
        }
        return result;
    }
}
