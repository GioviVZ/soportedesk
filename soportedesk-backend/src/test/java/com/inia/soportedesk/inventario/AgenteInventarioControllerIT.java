package com.inia.soportedesk.inventario;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.inia.soportedesk.catalogo.Dependencia;
import com.inia.soportedesk.catalogo.DependenciaRepository;
import com.inia.soportedesk.catalogo.Sede;
import com.inia.soportedesk.catalogo.SedeRepository;
import com.inia.soportedesk.catalogo.Subdependencia;
import com.inia.soportedesk.catalogo.SubdependenciaRepository;
import com.inia.soportedesk.catalogo.TipoContrato;
import com.inia.soportedesk.catalogo.TipoContratoRepository;
import com.inia.soportedesk.equipos.Equipo;
import com.inia.soportedesk.equipos.EquipoRepository;
import com.inia.soportedesk.usuariosred.UsuarioRed;
import com.inia.soportedesk.usuariosred.UsuarioRedRepository;
import com.inia.soportedesk.vpn.Vpn;
import com.inia.soportedesk.vpn.VpnRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AgenteInventarioControllerIT {

    private static final String TOKEN_HEADER = "X-SoporteDesk-Agent-Token";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private SedeRepository sedeRepository;

    @Autowired
    private DependenciaRepository dependenciaRepository;

    @Autowired
    private SubdependenciaRepository subdependenciaRepository;

    @Autowired
    private TipoContratoRepository tipoContratoRepository;

    @Autowired
    private UsuarioRedRepository usuarioRedRepository;

    @Autowired
    private EquipoRepository equipoRepository;

    @Autowired
    private VpnRepository vpnRepository;

    @Test
    void receiveInventory_withValidToken_createsInventory() throws Exception {
        InventarioAgenteRequest request = sampleRequest("agent-001", "PC-SOPORTE-01", "PF4ABC123");

        mockMvc.perform(post("/api/agente/inventario")
                        .header(TOKEN_HEADER, "test-agent-token")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hostname", is("PC-SOPORTE-01")))
                .andExpect(jsonPath("$.serialEquipo", is("PF4ABC123")))
                .andExpect(jsonPath("$.matchEstado", is("SIN_MATCH")))
                .andExpect(jsonPath("$.programas", hasSize(1)))
                .andExpect(jsonPath("$.discos", hasSize(1)))
                .andExpect(jsonPath("$.redes", hasSize(1)));
    }

    @Test
    void receiveInventory_withInvalidToken_returns401() throws Exception {
        mockMvc.perform(post("/api/agente/inventario")
                        .header(TOKEN_HEADER, "bad-token")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(sampleRequest("agent-002", "PC-02", "SER-02"))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void receiveInventory_reusesExistingBySerial() throws Exception {
        InventarioAgenteRequest first = sampleRequest("agent-old", "PC-OLD", "SERIAL-REUSE");
        InventarioAgenteRequest second = sampleRequest("agent-new", "PC-NEW", "SERIAL-REUSE");
        second.setUsuarioActual("INIA\\nuevo.usuario");

        String response = mockMvc.perform(post("/api/agente/inventario")
                        .header(TOKEN_HEADER, "test-agent-token")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(first)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        Long id = objectMapper.readTree(response).get("id").asLong();

        mockMvc.perform(post("/api/agente/inventario")
                        .header(TOKEN_HEADER, "test-agent-token")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(second)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(id.intValue())))
                .andExpect(jsonPath("$.hostname", is("PC-NEW")))
                .andExpect(jsonPath("$.usuarioActual", is("INIA\\nuevo.usuario")));
    }

    @Test
    void receiveInventory_ignoresGenericSerial() throws Exception {
        InventarioAgenteRequest request = sampleRequest("agent-generic", "PC-GENERIC", "To be filled by O.E.M.");

        mockMvc.perform(post("/api/agente/inventario")
                        .header(TOKEN_HEADER, "test-agent-token")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.serialEquipo", nullValue()));
    }

    @Test
    void receiveInventory_autoMatchesEquipoUsuarioAndVpn() throws Exception {
        UsuarioRed usuario = saveUsuarioRed("match.user");
        Equipo equipo = saveEquipo("SERIAL-AUTO-MATCH-" + UUID.randomUUID(), "PC-AUTO-MATCH", usuario);
        Vpn vpn = saveVpn(usuario, equipo);

        InventarioAgenteRequest request = sampleRequest("agent-auto-match", "pc-auto-match", equipo.getNumeroSerie());
        request.setUsuarioActual("INIA\\match.user");

        mockMvc.perform(post("/api/agente/inventario")
                        .header(TOKEN_HEADER, "test-agent-token")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.matchEstado", is("MATCH_CONFIRMADO")))
                .andExpect(jsonPath("$.equipoRelacionadoId", is(equipo.getId().intValue())))
                .andExpect(jsonPath("$.usuarioRedRelacionadoId", is(usuario.getId().intValue())))
                .andExpect(jsonPath("$.vpnRelacionadoId", is(vpn.getId().intValue())));
    }

    @Test
    void receiveInventory_marksConflictWhenCurrentUserDiffersFromAssignedEquipoUser() throws Exception {
        UsuarioRed asignado = saveUsuarioRed("assigned.user");
        UsuarioRed actual = saveUsuarioRed("current.user");
        Equipo equipo = saveEquipo("SERIAL-CONFLICT-" + UUID.randomUUID(), "PC-CONFLICT", asignado);

        InventarioAgenteRequest request = sampleRequest("agent-conflict", "PC-CONFLICT", equipo.getNumeroSerie());
        request.setUsuarioActual("current.user@inia.local");

        mockMvc.perform(post("/api/agente/inventario")
                        .header(TOKEN_HEADER, "test-agent-token")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.matchEstado", is("CONFLICTO")))
                .andExpect(jsonPath("$.equipoRelacionadoId", is(equipo.getId().intValue())))
                .andExpect(jsonPath("$.usuarioRedRelacionadoId", is(actual.getId().intValue())));
    }

    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "READ_inventario-equipos"})
    void manualMatch_confirmsSelectedLinks() throws Exception {
        UsuarioRed usuario = saveUsuarioRed("manual.user");
        Equipo equipo = saveEquipo("SERIAL-MANUAL-" + UUID.randomUUID(), "PC-MANUAL", usuario);
        Vpn vpn = saveVpn(usuario, equipo);

        String response = mockMvc.perform(post("/api/agente/inventario")
                        .header(TOKEN_HEADER, "test-agent-token")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(sampleRequest("agent-manual", "PC-MANUAL", null))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        Long inventarioId = objectMapper.readTree(response).get("id").asLong();

        InventarioMatchManualRequest request = new InventarioMatchManualRequest();
        request.setEquipoId(equipo.getId());
        request.setUsuarioRedId(usuario.getId());
        request.setVpnId(vpn.getId());
        request.setConfirmar(true);
        request.setNotas("Confirmado por soporte");

        mockMvc.perform(post("/api/inventario-equipos/{id}/match/manual", inventarioId)
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.matchEstado", is("MATCH_CONFIRMADO")))
                .andExpect(jsonPath("$.matchScore", is(100)))
                .andExpect(jsonPath("$.equipoRelacionadoLabel", is("PC-MANUAL - " + equipo.getNumeroSerie() + " - Lenovo ThinkPad")))
                .andExpect(jsonPath("$.usuarioRedRelacionadoLabel", is("manual.user - Nombre manual.user Apellido manual.user")))
                .andExpect(jsonPath("$.vpnRelacionadoId", is(vpn.getId().intValue())));
    }

    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "READ_inventario-equipos"})
    void getAll_requiresAuthenticatedUser() throws Exception {
        mockMvc.perform(get("/api/inventario-equipos"))
                .andExpect(status().isOk());
    }

    @Test
    void getAll_withoutAuth_returns401() throws Exception {
        mockMvc.perform(get("/api/inventario-equipos"))
                .andExpect(status().isUnauthorized());
    }

    private InventarioAgenteRequest sampleRequest(String agentId, String hostname, String serial) {
        InventarioAgenteRequest request = new InventarioAgenteRequest();
        request.setAgentId(agentId);
        request.setHostname(hostname);
        request.setSerialEquipo(serial);
        request.setFabricante("Lenovo");
        request.setModelo("ThinkPad E14");
        request.setDominio("INIA.LOCAL");
        request.setOu("OU=Soporte,OU=Lima,DC=inia,DC=local");
        request.setUsuarioActual("INIA\\gvivanco");
        request.setSistemaOperativo("Microsoft Windows 11 Pro");
        request.setVersionSistema("10.0.22631");
        request.setArquitectura("64-bit");
        request.setProcesador("Intel Core i5");
        request.setRamTotalBytes(17179869184L);

        InventarioAgenteRequest.ProgramaRequest programa = new InventarioAgenteRequest.ProgramaRequest();
        programa.setNombre("Microsoft 365 Apps");
        programa.setVersion("16.0");
        programa.setFabricante("Microsoft");
        request.setProgramas(List.of(programa));

        InventarioAgenteRequest.DiscoRequest disco = new InventarioAgenteRequest.DiscoRequest();
        disco.setLetra("C:");
        disco.setNombre("Windows");
        disco.setTipo("Local");
        disco.setTotalBytes(512000000000L);
        disco.setLibreBytes(256000000000L);
        request.setDiscos(List.of(disco));

        InventarioAgenteRequest.RedRequest red = new InventarioAgenteRequest.RedRequest();
        red.setDescripcion("Intel Ethernet");
        red.setMacAddress("AA-BB-CC-11-22-33");
        red.setIpAddresses(List.of("192.168.1.20"));
        request.setRedes(List.of(red));

        return request;
    }

    private UsuarioRed saveUsuarioRed(String username) {
        Sede sede = sedeRepository.save(new Sede(null, "Sede " + username));
        Dependencia dependencia = dependenciaRepository.save(new Dependencia(null, "Dependencia " + username, sede));
        Subdependencia subdependencia = subdependenciaRepository.save(new Subdependencia(null, "Sub " + username, dependencia));
        TipoContrato tipoContrato = tipoContratoRepository.save(new TipoContrato(null, "CAS " + username));

        UsuarioRed usuario = new UsuarioRed();
        usuario.setUsuario(username);
        usuario.setNombre("Nombre " + username);
        usuario.setApellidos("Apellido " + username);
        usuario.setGrupo("Usuarios");
        usuario.setUnidadOrganizativa("OU=Usuarios,DC=inia,DC=local");
        usuario.setEstado("Activo");
        usuario.setSede(sede);
        usuario.setDependencia(dependencia);
        usuario.setSubdependencia(subdependencia);
        usuario.setTipoContrato(tipoContrato);
        return usuarioRedRepository.save(usuario);
    }

    private Equipo saveEquipo(String serial, String host, UsuarioRed usuario) {
        Equipo equipo = new Equipo();
        equipo.setNumeroSerie(serial);
        equipo.setTipo("Laptop");
        equipo.setMarca("Lenovo");
        equipo.setModelo("ThinkPad");
        equipo.setHost(host);
        equipo.setEstado("Activo");
        equipo.setUsuarioRed(usuario);
        return equipoRepository.save(equipo);
    }

    private Vpn saveVpn(UsuarioRed usuario, Equipo equipo) {
        Vpn vpn = new Vpn();
        vpn.setUsuarioRed(usuario);
        vpn.setEquipo(equipo);
        vpn.setEstado("Activo");
        vpn.setUsuarioVpn(usuario.getUsuario());
        return vpnRepository.save(vpn);
    }
}
