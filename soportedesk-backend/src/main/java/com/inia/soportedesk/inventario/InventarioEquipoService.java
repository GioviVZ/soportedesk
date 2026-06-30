package com.inia.soportedesk.inventario;

import com.inia.soportedesk.exception.ResourceNotFoundException;
import com.inia.soportedesk.equipos.Equipo;
import com.inia.soportedesk.equipos.EquipoRepository;
import com.inia.soportedesk.usuariosred.UsuarioRed;
import com.inia.soportedesk.usuariosred.UsuarioRedRepository;
import com.inia.soportedesk.vpn.Vpn;
import com.inia.soportedesk.vpn.VpnRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.ArrayList;

@Service
@RequiredArgsConstructor
public class InventarioEquipoService {

    private static final Set<String> INVALID_SERIALS = Set.of(
            "TO BE FILLED BY O.E.M.",
            "TO BE FILLED BY OEM",
            "SYSTEM SERIAL NUMBER",
            "DEFAULT STRING",
            "NONE",
            "N/A",
            "NA",
            "0",
            "UNKNOWN"
    );

    private final InventarioEquipoRepository repository;
    private final EquipoRepository equipoRepository;
    private final UsuarioRedRepository usuarioRedRepository;
    private final VpnRepository vpnRepository;

    @Value("${agente.inventario-token:change-me-agent-token}")
    private String inventarioToken;

    @Transactional
    public InventarioEquipoResponse receiveFromAgent(InventarioAgenteRequest request, String token, String remoteIp) {
        validateAgentToken(token);

        String normalizedSerial = normalizeSerial(request.getSerialEquipo());
        InventarioEquipo equipo = findExisting(request, normalizedSerial).orElseGet(InventarioEquipo::new);

        equipo.setAgentId(clean(request.getAgentId()));
        equipo.setHostname(cleanUpper(request.getHostname()));
        equipo.setSerialEquipo(normalizedSerial);
        equipo.setFabricante(clean(request.getFabricante()));
        equipo.setModelo(clean(request.getModelo()));
        equipo.setDominio(cleanUpper(request.getDominio()));
        equipo.setOu(clean(request.getOu()));
        equipo.setUsuarioActual(clean(request.getUsuarioActual()));
        equipo.setSistemaOperativo(clean(request.getSistemaOperativo()));
        equipo.setVersionSistema(clean(request.getVersionSistema()));
        equipo.setArquitectura(clean(request.getArquitectura()));
        equipo.setProcesador(clean(request.getProcesador()));
        equipo.setRamTotalBytes(request.getRamTotalBytes());
        equipo.setIpPrincipal(firstNonBlank(request.getIpPrincipal(), firstIp(request.getRedes())));
        equipo.setMacPrincipal(firstNonBlank(normalizeMac(request.getMacPrincipal()), firstMac(request.getRedes())));
        equipo.setUltimoReporte(LocalDateTime.now());
        equipo.setIpReporte(clean(remoteIp));
        equipo.setEstadoAgente("ACTUALIZADO");
        equipo.setOrigen("AGENTE_AD");

        replacePrograms(equipo, request.getProgramas());
        replaceDisks(equipo, request.getDiscos());
        replaceNetworks(equipo, request.getRedes());
        aplicarMatch(equipo);

        return toResponse(repository.save(equipo));
    }

    @Transactional(readOnly = true)
    public List<InventarioEquipoResponse> getAll(String search) {
        return repository.search(search).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public InventarioEquipoResponse getById(Long id) {
        return repository.findById(id)
                .map(this::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Inventario no encontrado"));
    }

    @Transactional
    public InventarioEquipoResponse rematch(Long id) {
        InventarioEquipo equipo = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inventario no encontrado"));
        aplicarMatch(equipo);
        return toResponse(repository.save(equipo));
    }

    @Transactional
    public List<InventarioEquipoResponse> rematchAll(String search) {
        return repository.search(search).stream()
                .map(equipo -> {
                    aplicarMatch(equipo);
                    return repository.save(equipo);
                })
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public InventarioEquipoResponse manualMatch(Long id, InventarioMatchManualRequest request) {
        InventarioEquipo inventario = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inventario no encontrado"));

        Equipo equipo = request.getEquipoId() != null
                ? equipoRepository.findById(request.getEquipoId())
                .orElseThrow(() -> new ResourceNotFoundException("Equipo no encontrado"))
                : null;
        UsuarioRed usuarioRed = request.getUsuarioRedId() != null
                ? usuarioRedRepository.findById(request.getUsuarioRedId())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario de red no encontrado"))
                : null;
        Vpn vpn = request.getVpnId() != null
                ? vpnRepository.findById(request.getVpnId())
                .orElseThrow(() -> new ResourceNotFoundException("VPN no encontrada"))
                : null;

        inventario.setEquipoRelacionado(equipo);
        inventario.setUsuarioRedRelacionado(usuarioRed);
        inventario.setVpnRelacionado(vpn);
        inventario.setMatchFecha(LocalDateTime.now());
        inventario.setMatchNotas(limit(firstNonBlank(request.getNotas(), "Ajuste manual de match"), 500));

        if (Boolean.TRUE.equals(request.getIgnorar())) {
            inventario.setMatchEstado(InventarioMatchEstado.IGNORADO);
            inventario.setMatchScore(0);
        } else if (Boolean.TRUE.equals(request.getConfirmar())) {
            inventario.setMatchEstado(InventarioMatchEstado.MATCH_CONFIRMADO);
            inventario.setMatchScore(100);
        } else if (equipo == null && usuarioRed == null && vpn == null) {
            inventario.setMatchEstado(InventarioMatchEstado.SIN_MATCH);
            inventario.setMatchScore(0);
        } else {
            inventario.setMatchEstado(InventarioMatchEstado.CANDIDATO);
            inventario.setMatchScore(70);
        }

        return toResponse(repository.save(inventario));
    }

    private void validateAgentToken(String token) {
        if (inventarioToken == null || inventarioToken.isBlank() || "change-me-agent-token".equals(inventarioToken)) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Token de agente no configurado");
        }
        if (token == null || !Objects.equals(token, inventarioToken)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token de agente invalido");
        }
    }

    private Optional<InventarioEquipo> findExisting(InventarioAgenteRequest request, String normalizedSerial) {
        if (normalizedSerial != null) {
            Optional<InventarioEquipo> bySerial = repository.findFirstBySerialEquipoIgnoreCase(normalizedSerial);
            if (bySerial.isPresent()) {
                return bySerial;
            }
        }

        String agentId = clean(request.getAgentId());
        if (agentId != null) {
            Optional<InventarioEquipo> byAgent = repository.findFirstByAgentId(agentId);
            if (byAgent.isPresent()) {
                return byAgent;
            }
        }

        String hostname = cleanUpper(request.getHostname());
        String dominio = cleanUpper(request.getDominio());
        if (hostname != null && dominio != null) {
            return repository.findFirstByHostnameIgnoreCaseAndDominioIgnoreCase(hostname, dominio);
        }

        return Optional.empty();
    }

    private void replacePrograms(InventarioEquipo equipo, List<InventarioAgenteRequest.ProgramaRequest> programas) {
        equipo.getProgramas().clear();
        if (programas == null) {
            return;
        }
        programas.stream()
                .filter(p -> clean(p.getNombre()) != null)
                .limit(500)
                .forEach(p -> {
                    InventarioPrograma programa = new InventarioPrograma();
                    programa.setEquipo(equipo);
                    programa.setNombre(clean(p.getNombre()));
                    programa.setVersion(clean(p.getVersion()));
                    programa.setFabricante(clean(p.getFabricante()));
                    programa.setFechaInstalacion(clean(p.getFechaInstalacion()));
                    equipo.getProgramas().add(programa);
                });
    }

    private void replaceDisks(InventarioEquipo equipo, List<InventarioAgenteRequest.DiscoRequest> discos) {
        equipo.getDiscos().clear();
        if (discos == null) {
            return;
        }
        discos.forEach(d -> {
            InventarioDisco disco = new InventarioDisco();
            disco.setEquipo(equipo);
            disco.setLetra(cleanUpper(d.getLetra()));
            disco.setNombre(clean(d.getNombre()));
            disco.setTipo(clean(d.getTipo()));
            disco.setTotalBytes(d.getTotalBytes());
            disco.setLibreBytes(d.getLibreBytes());
            equipo.getDiscos().add(disco);
        });
    }

    private void replaceNetworks(InventarioEquipo equipo, List<InventarioAgenteRequest.RedRequest> redes) {
        equipo.getRedes().clear();
        if (redes == null) {
            return;
        }
        redes.forEach(r -> {
            InventarioRed red = new InventarioRed();
            red.setEquipo(equipo);
            red.setDescripcion(clean(r.getDescripcion()));
            red.setMacAddress(normalizeMac(r.getMacAddress()));
            red.setIpAddresses(r.getIpAddresses() == null
                    ? new ArrayList<>()
                    : new ArrayList<>(r.getIpAddresses().stream().map(this::clean).filter(Objects::nonNull).toList()));
            equipo.getRedes().add(red);
        });
    }

    private void aplicarMatch(InventarioEquipo inventario) {
        MatchResult result = calcularMatch(inventario);

        inventario.setEquipoRelacionado(result.equipo());
        inventario.setUsuarioRedRelacionado(result.usuarioRed());
        inventario.setVpnRelacionado(result.vpn());
        inventario.setMatchScore(result.score());
        inventario.setMatchEstado(result.estado());
        inventario.setMatchNotas(limit(String.join(" | ", result.notas()), 500));
        inventario.setMatchFecha(LocalDateTime.now());
    }

    private MatchResult calcularMatch(InventarioEquipo inventario) {
        List<String> notas = new ArrayList<>();
        int score = 0;

        Equipo equipo = null;
        UsuarioRed usuarioRed = null;
        Vpn vpn = null;

        if (inventario.getSerialEquipo() != null) {
            Optional<Equipo> bySerial = equipoRepository.findFirstByNumeroSerieIgnoreCase(inventario.getSerialEquipo());
            if (bySerial.isPresent()) {
                equipo = bySerial.get();
                score += 60;
                notas.add("Equipo encontrado por serial");
            }
        }

        if (equipo == null && inventario.getHostname() != null) {
            Optional<Equipo> byHost = equipoRepository.findFirstByHostIgnoreCase(inventario.getHostname());
            if (byHost.isPresent()) {
                equipo = byHost.get();
                score += 35;
                notas.add("Equipo encontrado por hostname");
            }
        }

        String usuarioActual = extractUsername(inventario.getUsuarioActual());
        if (usuarioActual != null) {
            Optional<UsuarioRed> byUsuario = usuarioRedRepository.findFirstByUsuarioIgnoreCase(usuarioActual);
            if (byUsuario.isPresent()) {
                usuarioRed = byUsuario.get();
                score += 25;
                notas.add("Usuario de red encontrado por usuario actual");
            }
        }

        if (equipo != null && equipo.getUsuarioRed() != null) {
            if (usuarioRed == null) {
                usuarioRed = equipo.getUsuarioRed();
                score += 10;
                notas.add("Usuario tomado desde el equipo asignado");
            } else if (!Objects.equals(usuarioRed.getId(), equipo.getUsuarioRed().getId())) {
                notas.add("Conflicto: usuario actual distinto al usuario asignado al equipo");
                return new MatchResult(equipo, usuarioRed, null, InventarioMatchEstado.CONFLICTO, Math.min(score, 95), notas);
            }
        }

        if (equipo != null) {
            vpn = vpnRepository.findFirstByEquipoId(equipo.getId()).orElse(null);
            if (vpn != null) {
                score += 10;
                notas.add("VPN encontrada por equipo");
            }
        }

        if (vpn == null && usuarioRed != null) {
            vpn = vpnRepository.findFirstByUsuarioRedId(usuarioRed.getId()).orElse(null);
            if (vpn != null) {
                score += 8;
                notas.add("VPN encontrada por usuario de red");
            }
        }

        if (notas.isEmpty()) {
            notas.add("Sin coincidencias automaticas");
            return new MatchResult(null, null, null, InventarioMatchEstado.SIN_MATCH, 0, notas);
        }

        InventarioMatchEstado estado = score >= 70
                ? InventarioMatchEstado.MATCH_CONFIRMADO
                : InventarioMatchEstado.CANDIDATO;
        return new MatchResult(equipo, usuarioRed, vpn, estado, Math.min(score, 100), notas);
    }

    private InventarioEquipoResponse toResponse(InventarioEquipo e) {
        return InventarioEquipoResponse.builder()
                .id(e.getId())
                .agentId(e.getAgentId())
                .hostname(e.getHostname())
                .serialEquipo(e.getSerialEquipo())
                .fabricante(e.getFabricante())
                .modelo(e.getModelo())
                .dominio(e.getDominio())
                .ou(e.getOu())
                .usuarioActual(e.getUsuarioActual())
                .sistemaOperativo(e.getSistemaOperativo())
                .versionSistema(e.getVersionSistema())
                .arquitectura(e.getArquitectura())
                .procesador(e.getProcesador())
                .ramTotalBytes(e.getRamTotalBytes())
                .ipPrincipal(e.getIpPrincipal())
                .macPrincipal(e.getMacPrincipal())
                .ultimoReporte(e.getUltimoReporte())
                .ipReporte(e.getIpReporte())
                .estadoAgente(e.getEstadoAgente())
                .origen(e.getOrigen())
                .equipoRelacionadoId(e.getEquipoRelacionado() != null ? e.getEquipoRelacionado().getId() : null)
                .equipoRelacionadoLabel(e.getEquipoRelacionado() != null ? equipoLabel(e.getEquipoRelacionado()) : null)
                .usuarioRedRelacionadoId(e.getUsuarioRedRelacionado() != null ? e.getUsuarioRedRelacionado().getId() : null)
                .usuarioRedRelacionadoLabel(e.getUsuarioRedRelacionado() != null ? usuarioRedLabel(e.getUsuarioRedRelacionado()) : null)
                .vpnRelacionadoId(e.getVpnRelacionado() != null ? e.getVpnRelacionado().getId() : null)
                .vpnRelacionadoLabel(e.getVpnRelacionado() != null ? vpnLabel(e.getVpnRelacionado()) : null)
                .matchEstado(e.getMatchEstado())
                .matchScore(e.getMatchScore())
                .matchNotas(e.getMatchNotas())
                .matchFecha(e.getMatchFecha())
                .programas(e.getProgramas().stream().map(p -> InventarioEquipoResponse.ProgramaResponse.builder()
                        .id(p.getId())
                        .nombre(p.getNombre())
                        .version(p.getVersion())
                        .fabricante(p.getFabricante())
                        .fechaInstalacion(p.getFechaInstalacion())
                        .build()).toList())
                .discos(e.getDiscos().stream().map(d -> InventarioEquipoResponse.DiscoResponse.builder()
                        .id(d.getId())
                        .letra(d.getLetra())
                        .nombre(d.getNombre())
                        .tipo(d.getTipo())
                        .totalBytes(d.getTotalBytes())
                        .libreBytes(d.getLibreBytes())
                        .build()).toList())
                .redes(e.getRedes().stream().map(r -> InventarioEquipoResponse.RedResponse.builder()
                        .id(r.getId())
                        .descripcion(r.getDescripcion())
                        .macAddress(r.getMacAddress())
                        .ipAddresses(new ArrayList<>(r.getIpAddresses()))
                        .build()).toList())
                .build();
    }

    private String normalizeSerial(String value) {
        String serial = cleanUpper(value);
        if (serial == null || INVALID_SERIALS.contains(serial)) {
            return null;
        }
        return serial;
    }

    private String normalizeMac(String value) {
        String mac = cleanUpper(value);
        return mac != null ? mac.replace("-", ":") : null;
    }

    private String cleanUpper(String value) {
        String cleaned = clean(value);
        return cleaned != null ? cleaned.toUpperCase(Locale.ROOT) : null;
    }

    private String clean(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed;
    }

    private String extractUsername(String value) {
        String cleaned = clean(value);
        if (cleaned == null) {
            return null;
        }
        int slashIndex = cleaned.lastIndexOf('\\');
        if (slashIndex >= 0 && slashIndex < cleaned.length() - 1) {
            cleaned = cleaned.substring(slashIndex + 1);
        }
        int atIndex = cleaned.indexOf('@');
        if (atIndex > 0) {
            cleaned = cleaned.substring(0, atIndex);
        }
        return clean(cleaned);
    }

    private String equipoLabel(Equipo equipo) {
        return String.join(" - ", java.util.stream.Stream.of(
                        equipo.getHost(),
                        equipo.getNumeroSerie(),
                        firstNonBlank(equipo.getMarca(), "") + " " + firstNonBlank(equipo.getModelo(), "")
                )
                .map(this::clean)
                .filter(Objects::nonNull)
                .toList());
    }

    private String usuarioRedLabel(UsuarioRed usuario) {
        return String.join(" - ", java.util.stream.Stream.of(
                        usuario.getUsuario(),
                        clean((firstNonBlank(usuario.getNombre(), "") + " " + firstNonBlank(usuario.getApellidos(), "")).trim())
                )
                .map(this::clean)
                .filter(Objects::nonNull)
                .toList());
    }

    private String vpnLabel(Vpn vpn) {
        String usuario = vpn.getUsuarioRed() != null ? vpn.getUsuarioRed().getUsuario() : vpn.getUsuarioVpn();
        return String.join(" - ", java.util.stream.Stream.of(
                        usuario,
                        vpn.getIpAsignada(),
                        vpn.getEstado()
                )
                .map(this::clean)
                .filter(Objects::nonNull)
                .toList());
    }

    private String limit(String value, int max) {
        if (value == null || value.length() <= max) {
            return value;
        }
        return value.substring(0, max);
    }

    private String firstIp(List<InventarioAgenteRequest.RedRequest> redes) {
        if (redes == null) {
            return null;
        }
        return redes.stream()
                .filter(r -> r.getIpAddresses() != null)
                .flatMap(r -> r.getIpAddresses().stream())
                .map(this::clean)
                .filter(Objects::nonNull)
                .findFirst()
                .orElse(null);
    }

    private String firstMac(List<InventarioAgenteRequest.RedRequest> redes) {
        if (redes == null) {
            return null;
        }
        return redes.stream()
                .map(r -> normalizeMac(r.getMacAddress()))
                .filter(Objects::nonNull)
                .findFirst()
                .orElse(null);
    }

    private String firstNonBlank(String first, String second) {
        String cleanedFirst = clean(first);
        return cleanedFirst != null ? cleanedFirst : clean(second);
    }

    private record MatchResult(
            Equipo equipo,
            UsuarioRed usuarioRed,
            Vpn vpn,
            InventarioMatchEstado estado,
            int score,
            List<String> notas
    ) {
    }
}
