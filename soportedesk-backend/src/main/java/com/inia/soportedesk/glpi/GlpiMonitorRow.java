package com.inia.soportedesk.glpi;

public interface GlpiMonitorRow {
    Long getComputerId();
    Long getMonitorId();
    String getNombre();
    String getSerie();
    String getFabricante();
    String getModelo();
}
