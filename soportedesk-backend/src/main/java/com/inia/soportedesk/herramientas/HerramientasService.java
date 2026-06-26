package com.inia.soportedesk.herramientas;

import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.lang.management.ManagementFactory;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.nio.charset.Charset;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Enumeration;
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

    public SystemInventoryResponse inventory() {
        Runtime runtime = Runtime.getRuntime();
        File root = new File(System.getProperty("user.dir", "."));

        return SystemInventoryResponse.builder()
                .computerName(resolveComputerName())
                .userName(System.getProperty("user.name"))
                .operatingSystem(System.getProperty("os.name"))
                .osVersion(System.getProperty("os.version"))
                .architecture(System.getProperty("os.arch"))
                .javaVersion(System.getProperty("java.version"))
                .processor(System.getenv("PROCESSOR_IDENTIFIER"))
                .availableProcessors(runtime.availableProcessors())
                .totalMemoryBytes(runtime.maxMemory())
                .freeMemoryBytes(runtime.freeMemory())
                .totalDiskBytes(root.getTotalSpace())
                .freeDiskBytes(root.getFreeSpace())
                .uptimeSeconds(Duration.ofMillis(ManagementFactory.getRuntimeMXBean().getUptime()).toSeconds())
                .networkInterfaces(networkInterfaces())
                .installedPrograms(installedPrograms())
                .build();
    }

    private List<SystemInventoryResponse.NetworkInterfaceInfo> networkInterfaces() {
        List<SystemInventoryResponse.NetworkInterfaceInfo> interfaces = new ArrayList<>();
        try {
            Enumeration<NetworkInterface> nets = NetworkInterface.getNetworkInterfaces();
            while (nets.hasMoreElements()) {
                NetworkInterface net = nets.nextElement();
                if (!net.isUp() || net.isLoopback() || net.isVirtual()) {
                    continue;
                }
                List<String> addresses = new ArrayList<>();
                Enumeration<InetAddress> inetAddresses = net.getInetAddresses();
                while (inetAddresses.hasMoreElements()) {
                    addresses.add(inetAddresses.nextElement().getHostAddress());
                }
                interfaces.add(SystemInventoryResponse.NetworkInterfaceInfo.builder()
                        .name(net.getName())
                        .displayName(net.getDisplayName())
                        .macAddress(formatMac(net.getHardwareAddress()))
                        .addresses(addresses)
                        .build());
            }
        } catch (IOException ignored) {
            return List.of();
        }
        return interfaces;
    }

    private List<SystemInventoryResponse.InstalledProgramInfo> installedPrograms() {
        if (!isWindows()) {
            return List.of();
        }

        String script = """
                $paths = @(
                  'HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*',
                  'HKLM:\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*',
                  'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*'
                );
                Get-ItemProperty $paths -ErrorAction SilentlyContinue |
                  Where-Object { $_.DisplayName } |
                  Sort-Object DisplayName |
                  Select-Object DisplayName, DisplayVersion, Publisher, InstallDate |
                  ConvertTo-Csv -NoTypeInformation
                """;

        List<String> lines = runPowerShell(script, 10);
        return parseCsv(lines).stream()
                .limit(250)
                .sorted(Comparator.comparing(SystemInventoryResponse.InstalledProgramInfo::getName, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    private List<String> runPowerShell(String script, int timeoutSeconds) {
        List<String> lines = new ArrayList<>();
        try {
            Process process = new ProcessBuilder(
                    "powershell.exe",
                    "-NoProfile",
                    "-ExecutionPolicy",
                    "Bypass",
                    "-Command",
                    script
            ).redirectErrorStream(true).start();

            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream(), Charset.defaultCharset()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    if (!line.isBlank()) {
                        lines.add(line);
                    }
                }
            }
            if (!process.waitFor(timeoutSeconds, TimeUnit.SECONDS)) {
                process.destroyForcibly();
            }
        } catch (IOException | InterruptedException e) {
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            return List.of();
        }
        return lines;
    }

    private List<SystemInventoryResponse.InstalledProgramInfo> parseCsv(List<String> lines) {
        if (lines.size() <= 1) {
            return List.of();
        }

        List<SystemInventoryResponse.InstalledProgramInfo> programs = new ArrayList<>();
        for (int i = 1; i < lines.size(); i++) {
            List<String> columns = splitCsvLine(lines.get(i));
            if (columns.isEmpty() || columns.get(0).isBlank()) {
                continue;
            }
            programs.add(SystemInventoryResponse.InstalledProgramInfo.builder()
                    .name(columns.get(0))
                    .version(column(columns, 1))
                    .publisher(column(columns, 2))
                    .installDate(column(columns, 3))
                    .build());
        }
        return programs;
    }

    private List<String> splitCsvLine(String line) {
        List<String> values = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean inQuotes = false;

        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '"') {
                if (inQuotes && i + 1 < line.length() && line.charAt(i + 1) == '"') {
                    current.append('"');
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (c == ',' && !inQuotes) {
                values.add(current.toString());
                current.setLength(0);
            } else {
                current.append(c);
            }
        }
        values.add(current.toString());
        return values;
    }

    private String column(List<String> columns, int index) {
        if (index >= columns.size()) {
            return "";
        }
        return columns.get(index);
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

    private String formatMac(byte[] mac) {
        if (mac == null || mac.length == 0) {
            return "";
        }
        List<String> parts = new ArrayList<>();
        for (byte b : mac) {
            parts.add(String.format("%02X", b));
        }
        return String.join(":", parts);
    }

    private String resolveComputerName() {
        String name = System.getenv("COMPUTERNAME");
        if (name == null || name.isBlank()) {
            name = System.getenv("HOSTNAME");
        }
        return name;
    }

    private boolean isWindows() {
        return System.getProperty("os.name", "").toLowerCase(Locale.ROOT).contains("win");
    }

    private record PacketStats(Optional<Integer> sent, Optional<Integer> received, Optional<Integer> lost) {
    }
}
