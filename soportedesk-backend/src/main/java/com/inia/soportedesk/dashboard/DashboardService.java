package com.inia.soportedesk.dashboard;

import com.inia.soportedesk.equipos.EquipoRepository;
import com.inia.soportedesk.correos.CorreoRepository;
import com.inia.soportedesk.impresoras.ImpresoraRepository;
import com.inia.soportedesk.licencias.LicenciaRepository;
import com.inia.soportedesk.usuariosred.UsuarioRedRepository;
import com.inia.soportedesk.vpn.VpnRepository;
import com.inia.soportedesk.wifi.WifiRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final LicenciaRepository licenciaRepository;
    private final CorreoRepository correoRepository;
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
}
