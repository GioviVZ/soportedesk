package com.inia.soportedesk.dashboard;

import com.inia.soportedesk.equipos.EquipoRepository;
import com.inia.soportedesk.impresoras.ImpresoraRepository;
import com.inia.soportedesk.licencias.LicenciaRepository;
import com.inia.soportedesk.gestiontiinia.VwGwDashboardRepository;
import com.inia.soportedesk.usuariosred.UsuarioRedRepository;
import com.inia.soportedesk.vpn.VpnRepository;
import com.inia.soportedesk.wifi.WifiRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
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
                vpnRepository.countByEstadoSolicitud("PENDIENTE"),
                wifiRepository.count(),
                impresoraRepository.count(),
                equipoRepository.count(),
                usuarioRedRepository.countDesactivados()
        );
    }

    public DashboardCounts getCounts(Authentication auth) {
        DashboardCounts counts = getCounts();
        return new DashboardCounts(
                canRead(auth, "licencias") ? counts.licencias() : 0,
                canRead(auth, "correos") ? counts.correos() : 0,
                canRead(auth, "usuarios-red") ? counts.usuariosRed() : 0,
                canReadVpn(auth) ? counts.vpn() : 0,
                canWrite(auth, "aprobar-vpn") ? counts.vpnPendientes() : 0,
                canRead(auth, "wifi") ? counts.wifi() : 0,
                canRead(auth, "impresoras") ? counts.impresoras() : 0,
                canRead(auth, "equipos") ? counts.equipos() : 0,
                canWrite(auth, "usuarios-red") ? counts.usuariosRedInactivos() : 0
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

    private boolean canRead(Authentication auth, String modulo) {
        return hasAuthority(auth, "ROLE_ADMIN") || hasAuthority(auth, "READ_" + modulo);
    }

    private boolean canWrite(Authentication auth, String modulo) {
        return hasAuthority(auth, "ROLE_ADMIN") || hasAuthority(auth, "WRITE_" + modulo);
    }

    private boolean canReadVpn(Authentication auth) {
        return canRead(auth, "vpn") || canWrite(auth, "solicitar-vpn") || canWrite(auth, "aprobar-vpn");
    }

    private boolean hasAuthority(Authentication auth, String authority) {
        return auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> authority.equals(a.getAuthority()));
    }
}
