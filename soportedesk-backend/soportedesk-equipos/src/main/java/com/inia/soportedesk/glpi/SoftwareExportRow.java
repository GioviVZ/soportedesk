package com.inia.soportedesk.glpi;

import java.time.LocalDate;

public interface SoftwareExportRow {
    Long getComputerId();
    String getSoftware();
    String getVersion();
    LocalDate getFechaInstalacion();
}
