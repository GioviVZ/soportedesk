package com.inia.soportedesk.herramientas;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class SystemInventoryResponse {
    private final String computerName;
    private final String userName;
    private final String operatingSystem;
    private final String osVersion;
    private final String architecture;
    private final String javaVersion;
    private final String processor;
    private final Integer availableProcessors;
    private final Long totalMemoryBytes;
    private final Long freeMemoryBytes;
    private final Long totalDiskBytes;
    private final Long freeDiskBytes;
    private final Long uptimeSeconds;
    private final List<NetworkInterfaceInfo> networkInterfaces;
    private final List<InstalledProgramInfo> installedPrograms;

    @Getter
    @Builder
    public static class NetworkInterfaceInfo {
        private final String name;
        private final String displayName;
        private final String macAddress;
        private final List<String> addresses;
    }

    @Getter
    @Builder
    public static class InstalledProgramInfo {
        private final String name;
        private final String version;
        private final String publisher;
        private final String installDate;
    }
}
