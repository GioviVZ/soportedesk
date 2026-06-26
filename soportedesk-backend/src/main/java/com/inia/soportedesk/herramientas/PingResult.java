package com.inia.soportedesk.herramientas;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class PingResult {
    private final String host;
    private final boolean reachable;
    private final Integer packetsSent;
    private final Integer packetsReceived;
    private final Integer packetsLost;
    private final Double averageLatencyMs;
    private final String status;
    private final List<String> output;
}
