package com.inia.soportedesk.vpn;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class VpnAntivirusRequest {

    private Boolean tieneAntivirus;

    private LocalDate vencimientoAntivirus;
}
