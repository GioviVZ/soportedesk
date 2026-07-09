package com.inia.soportedesk.vpn;

import java.time.LocalDate;

public record VpnVencimientoAlerta(Long vpnId, String titular, String tipoEquipo, LocalDate vence, String detalle) {
}
