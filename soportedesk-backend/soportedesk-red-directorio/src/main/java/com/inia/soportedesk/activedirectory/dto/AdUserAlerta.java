package com.inia.soportedesk.activedirectory.dto;

public record AdUserAlerta(
        String samAccountName,
        String displayName,
        String detalle
) {
}
