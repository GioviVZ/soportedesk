package com.inia.soportedesk.vpn;

import com.inia.soportedesk.activedirectory.AdUsuarioCache;
import com.inia.soportedesk.usuariosred.contrato.UsuarioRedContrato;

import java.time.LocalDate;

public record VpnUsuarioRedOption(
        String samAccountName,
        String displayName,
        String mail,
        String office,
        String organizationalUnit,
        boolean enabled,
        boolean terceroOrdenServicio,
        String terceroNombre,
        String numeroOrdenServicio,
        LocalDate vencimientoOrdenServicio,
        String ultimoContratoTipo,
        String ultimoContratoNumero,
        LocalDate ultimoContratoFechaFin
) {
    public static VpnUsuarioRedOption from(AdUsuarioCache usuario) {
        return new VpnUsuarioRedOption(
                usuario.getSamAccountName(),
                usuario.getDisplayName(),
                usuario.getMail(),
                usuario.getOffice(),
                usuario.getOrganizationalUnit(),
                usuario.isEnabled(),
                false,
                null,
                null,
                null,
                null,
                null,
                null
        );
    }

    public static VpnUsuarioRedOption from(AdUsuarioCache usuario, UsuarioRedContrato contrato, boolean ordenServicio) {
        if (contrato == null) return from(usuario);
        String nombre = nombreCompleto(contrato);
        return new VpnUsuarioRedOption(
                usuario.getSamAccountName(),
                nombre == null ? usuario.getDisplayName() : nombre,
                usuario.getMail(),
                usuario.getOffice(),
                usuario.getOrganizationalUnit(),
                usuario.isEnabled(),
                ordenServicio,
                nombre,
                ordenServicio ? contrato.getNumeroContrato() : null,
                ordenServicio ? contrato.getFechaFin() : null,
                contrato.getTipoContrato() == null ? null : contrato.getTipoContrato().getNombre(),
                contrato.getNumeroContrato(),
                contrato.getFechaFin()
        );
    }

    private static String nombreCompleto(UsuarioRedContrato orden) {
        String nombre = orden.getPersonalNombre() == null ? "" : orden.getPersonalNombre().trim();
        String apellidos = orden.getPersonalApellidos() == null ? "" : orden.getPersonalApellidos().trim();
        String completo = (nombre + " " + apellidos).trim();
        return completo.isBlank() ? null : completo;
    }
}
