package com.inia.soportedesk.realtime;

import java.time.Instant;

public record RealtimeEvent(
        String modulo,
        String accion,
        String entidadId,
        String usuario,
        Instant fecha
) {
}
