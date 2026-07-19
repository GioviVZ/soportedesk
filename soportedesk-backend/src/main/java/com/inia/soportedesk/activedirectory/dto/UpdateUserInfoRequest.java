package com.inia.soportedesk.activedirectory.dto;

public record UpdateUserInfoRequest(
        String displayName,
        String title,
        String department,
        String office,
        String telephoneNumber,
        String mobile,
        String mail,
        boolean clearMail,
        String description
) {
}
