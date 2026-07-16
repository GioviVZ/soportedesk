package com.inia.soportedesk.equipos.evidencia;

import java.nio.file.Path;

public record ArchivoEvidencia(Path path, String mimeType, String nombreOriginal) {
}
