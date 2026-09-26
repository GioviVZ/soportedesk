package com.inia.soportedesk.activedirectory.dto;

import java.util.List;

public record AdUserSearchResult(
        List<AdUserSummary> items,
        boolean truncated
) {
}
