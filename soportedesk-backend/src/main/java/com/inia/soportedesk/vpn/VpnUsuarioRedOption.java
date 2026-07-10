package com.inia.soportedesk.vpn;

import com.inia.soportedesk.activedirectory.AdUsuarioCache;

public record VpnUsuarioRedOption(
        String samAccountName,
        String displayName,
        String mail,
        String office,
        String organizationalUnit,
        boolean enabled
) {
    public static VpnUsuarioRedOption from(AdUsuarioCache usuario) {
        return new VpnUsuarioRedOption(
                usuario.getSamAccountName(),
                usuario.getDisplayName(),
                usuario.getMail(),
                usuario.getOffice(),
                usuario.getOrganizationalUnit(),
                usuario.isEnabled()
        );
    }
}
