package com.inia.soportedesk.activedirectory.dto;

public record ActiveDirectoryResponse<T>(boolean success, String message, T data) {
    public static <T> ActiveDirectoryResponse<T> ok(String message, T data) {
        return new ActiveDirectoryResponse<>(true, message, data);
    }

    public static <T> ActiveDirectoryResponse<T> error(String message) {
        return new ActiveDirectoryResponse<>(false, message, null);
    }
}
