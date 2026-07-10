package com.inia.soportedesk.activedirectory.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateAdUserRequest(
        @NotBlank @Size(min = 2, max = 120)
        @Pattern(regexp = "^[A-Za-z0-9._-]+$", message = "El usuario solo puede usar letras, numeros, punto, guion y guion bajo")
        String samAccountName,
        @NotBlank @Size(max = 120) String givenName,
        @NotBlank @Size(max = 120) String surname,
        @Size(max = 200) String displayName,
        @Email @Size(max = 200) String mail,
        @Size(max = 200) String userPrincipalName,
        @NotBlank @Size(min = 8) String temporaryPassword,
        @NotBlank String ouDestinoDn,
        @Size(max = 200) String title,
        @Size(max = 200) String department,
        @Size(max = 200) String office,
        @Size(max = 80) String telephoneNumber,
        @Size(max = 80) String mobile,
        @Size(max = 500) String description,
        boolean enabled,
        boolean forceChange
) {
}
