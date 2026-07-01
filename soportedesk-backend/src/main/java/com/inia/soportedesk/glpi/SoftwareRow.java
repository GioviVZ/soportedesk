package com.inia.soportedesk.glpi;

import java.time.LocalDate;

public interface SoftwareRow {
    String getSoftware();

    String getVersion();

    LocalDate getFechaInstalacion();
}
