package com.inia.soportedesk.vpn;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class VpnConfigInstitucionalRequest {

    @NotNull
    private LocalDate vencimientoAntivirus;
}
