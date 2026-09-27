package com.inia.soportedesk.activedirectory.dto;

import jakarta.validation.constraints.NotBlank;

public record MoveUserRequest(@NotBlank String ouDestinoDn) {
}
