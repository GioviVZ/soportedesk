package com.inia.soportedesk.activedirectory.dto;

public record AdUserSummary(
        String samAccountName,
        String displayName,
        String mail,
        String office,
        String organizationalUnit,
        boolean enabled,
        boolean locked
) {
}
