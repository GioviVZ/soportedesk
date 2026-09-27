package com.inia.soportedesk.activedirectory.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public record UpdateUserInfoRequest(
        @Size(max = 200) String displayName,
        @Size(max = 200) String title,
        @Size(max = 200) String department,
        @Size(max = 200) String office,
        @Size(max = 80) String telephoneNumber,
        @Size(max = 80) String mobile,
        @Email @Size(max = 200) String mail,
        boolean clearMail,
        @Size(max = 500) String description
) {
}
