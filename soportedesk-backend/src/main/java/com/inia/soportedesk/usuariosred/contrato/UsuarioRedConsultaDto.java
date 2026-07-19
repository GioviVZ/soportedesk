package com.inia.soportedesk.usuariosred.contrato;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class UsuarioRedConsultaDto {

    private String usuario;
    private String displayName;
    private String mail;
    private String office;
    private String organizationalUnit;
    private Boolean enabled;
    private Boolean locked;
    private LocalDate vencimientoUsuarioRed;
    private String estadoVencimientoUsuarioRed;
    private List<String> hosts = new ArrayList<>();
    private List<UsuarioRedContratoDto> contratos = new ArrayList<>();
}
