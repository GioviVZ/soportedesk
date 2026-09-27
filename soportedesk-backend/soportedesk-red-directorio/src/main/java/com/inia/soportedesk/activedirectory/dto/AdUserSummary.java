package com.inia.soportedesk.activedirectory.dto;

public record AdUserSummary(
        String samAccountName,
        String displayName,
        String mail,
        String office,
        String organizationalUnit,
        String department,
        String company,
        boolean enabled,
        boolean locked
) {
}
