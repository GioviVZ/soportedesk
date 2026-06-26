export interface PingResult {
  host: string;
  reachable: boolean;
  packetsSent?: number | null;
  packetsReceived?: number | null;
  packetsLost?: number | null;
  averageLatencyMs?: number | null;
  status: string;
  output: string[];
}

export interface NetworkInterfaceInfo {
  name: string;
  displayName: string;
  macAddress: string;
  addresses: string[];
}

export interface InstalledProgramInfo {
  name: string;
  version: string;
  publisher: string;
  installDate: string;
}

export interface SystemInventoryResponse {
  computerName: string;
  userName: string;
  operatingSystem: string;
  osVersion: string;
  architecture: string;
  javaVersion: string;
  processor: string;
  availableProcessors: number;
  totalMemoryBytes: number;
  freeMemoryBytes: number;
  totalDiskBytes: number;
  freeDiskBytes: number;
  uptimeSeconds: number;
  networkInterfaces: NetworkInterfaceInfo[];
  installedPrograms: InstalledProgramInfo[];
}
