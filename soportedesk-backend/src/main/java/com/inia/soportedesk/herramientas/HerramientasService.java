package com.inia.soportedesk.herramientas;

import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.Charset;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class HerramientasService {

    private static final Pattern WINDOWS_AVERAGE = Pattern.compile("(?:Media|Average)\\s*=\\s*(\\d+)ms", Pattern.CASE_INSENSITIVE);
    private static final Pattern UNIX_AVERAGE = Pattern.compile("=\\s*[\\d.]+/([\\d.]+)/[\\d.]+/[\\d.]+\\s*ms");
    private static final Pattern RECEIVED_ENGLISH = Pattern.compile("Sent\\s*=\\s*(\\d+),\\s*Received\\s*=\\s*(\\d+),\\s*Lost\\s*=\\s*(\\d+)", Pattern.CASE_INSENSITIVE);
    private static final Pattern RECEIVED_SPANISH = Pattern.compile("enviados\\s*=\\s*(\\d+),\\s*recibidos\\s*=\\s*(\\d+),\\s*perdidos\\s*=\\s*(\\d+)", Pattern.CASE_INSENSITIVE);

    public PingResult ping(String rawHost) {
        String host = rawHost.trim();
        boolean windows = isWindows();
        List<String> command = windows
                ? List.of("ping", "-n", "4", "-w", "1200", host)
                : List.of("ping", "-c", "4", "-W", "2", host);

        List<String> output = new ArrayList<>();
        int exitCode = -1;

        try {
            Process process = new ProcessBuilder(command).redirectErrorStream(true).start();
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream(), Charset.defaultCharset()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    if (!line.isBlank()) {
                        output.add(line.trim());
                    }
                }
            }
            boolean completed = process.waitFor(8, TimeUnit.SECONDS);
            if (!completed) {
                process.destroyForcibly();
                return PingResult.builder()
                        .host(host)
                        .reachable(false)
                        .status("Tiempo de espera agotado")
                        .output(output)
                        .build();
            }
            exitCode = process.exitValue();
        } catch (IOException e) {
            output.add("No se pudo ejecutar ping: " + e.getMessage());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            output.add("La prueba fue interrumpida.");
        }

        PacketStats stats = parsePacketStats(output);
        Double average = parseAverageLatency(output);
        boolean reachable = exitCode == 0 || stats.received().orElse(0) > 0;

        return PingResult.builder()
                .host(host)
                .reachable(reachable)
                .packetsSent(stats.sent().orElse(null))
                .packetsReceived(stats.received().orElse(null))
                .packetsLost(stats.lost().orElse(null))
                .averageLatencyMs(average)
                .status(reachable ? "Responde" : "No responde")
                .output(output)
                .build();
    }

    private PacketStats parsePacketStats(List<String> output) {
        for (String line : output) {
            Matcher english = RECEIVED_ENGLISH.matcher(line);
            if (english.find()) {
                return new PacketStats(
                        Optional.of(Integer.parseInt(english.group(1))),
                        Optional.of(Integer.parseInt(english.group(2))),
                        Optional.of(Integer.parseInt(english.group(3)))
                );
            }
            Matcher spanish = RECEIVED_SPANISH.matcher(line);
            if (spanish.find()) {
                return new PacketStats(
                        Optional.of(Integer.parseInt(spanish.group(1))),
                        Optional.of(Integer.parseInt(spanish.group(2))),
                        Optional.of(Integer.parseInt(spanish.group(3)))
                );
            }
        }
        return new PacketStats(Optional.empty(), Optional.empty(), Optional.empty());
    }

    private Double parseAverageLatency(List<String> output) {
        for (String line : output) {
            Matcher windows = WINDOWS_AVERAGE.matcher(line);
            if (windows.find()) {
                return Double.valueOf(windows.group(1));
            }
            Matcher unix = UNIX_AVERAGE.matcher(line);
            if (unix.find()) {
                return Double.valueOf(unix.group(1));
            }
        }
        return null;
    }

    private boolean isWindows() {
        return System.getProperty("os.name", "").toLowerCase(Locale.ROOT).contains("win");
    }

    private record PacketStats(Optional<Integer> sent, Optional<Integer> received, Optional<Integer> lost) {
    }
}
