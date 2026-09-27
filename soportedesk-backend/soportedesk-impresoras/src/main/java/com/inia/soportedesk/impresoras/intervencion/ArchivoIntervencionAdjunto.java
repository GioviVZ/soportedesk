package com.inia.soportedesk.impresoras.intervencion;

import java.nio.file.Path;

public record ArchivoIntervencionAdjunto(Path path, String mimeType, String nombreOriginal) {
}
