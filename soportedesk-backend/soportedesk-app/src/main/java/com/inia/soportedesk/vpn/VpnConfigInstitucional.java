package com.inia.soportedesk.vpn;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "vpn_config_institucional")
@Getter
@Setter
@NoArgsConstructor
public class VpnConfigInstitucional {

    @Id
    private Long id;

    @Column(name = "vencimiento_antivirus", nullable = false)
    private LocalDate vencimientoAntivirus;
}
