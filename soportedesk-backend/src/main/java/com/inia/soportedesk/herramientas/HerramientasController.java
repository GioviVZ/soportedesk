package com.inia.soportedesk.herramientas;

import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.util.Map;

@RestController
@RequestMapping("/api/herramientas")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_herramientas')")
public class HerramientasController {

    private static final int MAX_SPEED_TEST_BYTES = 25 * 1024 * 1024;
    private final HerramientasService service;

    @PostMapping("/ping")
    public PingResult ping(@Valid @RequestBody PingRequest request) {
        return service.ping(request.getHost());
    }

    @GetMapping("/datos-equipo")
    public EquipoDatosResponse datosEquipo(@RequestParam(required = false) String referencia,
                                           HttpServletRequest request) {
        return service.datosEquipo(referencia, request);
    }

    @GetMapping("/speed-test/ping")
    public ResponseEntity<Void> speedTestPing() {
        return ResponseEntity.noContent()
                .cacheControl(CacheControl.noStore())
                .build();
    }

    @GetMapping(value = "/speed-test/download", produces = MediaType.APPLICATION_OCTET_STREAM_VALUE)
    public ResponseEntity<byte[]> speedTestDownload(
            @RequestParam(defaultValue = "10485760") int bytes) {
        int safeBytes = Math.max(1024, Math.min(bytes, MAX_SPEED_TEST_BYTES));
        byte[] payload = new byte[safeBytes];
        int state = 0x13579BDF;
        for (int i = 0; i < payload.length; i++) {
            state ^= state << 13;
            state ^= state >>> 17;
            state ^= state << 5;
            payload[i] = (byte) state;
        }
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .header("X-Speed-Test-Bytes", String.valueOf(safeBytes))
                .body(payload);
    }

    @PostMapping(value = "/speed-test/upload", consumes = MediaType.APPLICATION_OCTET_STREAM_VALUE)
    public ResponseEntity<Map<String, Integer>> speedTestUpload(@RequestBody byte[] payload) {
        if (payload.length > MAX_SPEED_TEST_BYTES) {
            return ResponseEntity.status(413).body(Map.of("bytesReceived", 0));
        }
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(Map.of("bytesReceived", payload.length));
    }
}
