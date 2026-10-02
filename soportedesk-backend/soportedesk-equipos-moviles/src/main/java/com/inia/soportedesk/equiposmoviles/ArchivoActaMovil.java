package com.inia.soportedesk.equiposmoviles;

import java.nio.file.Path;

public record ArchivoActaMovil(Path path, String contentType, String nombreOriginal) {
}
