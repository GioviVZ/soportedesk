package com.inia.soportedesk.herramientas.monitoreo;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class MonitorPingControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private MonitorPingService service;

    @MockitoBean
    private MonitorPingHistorialService historialService;

    @MockitoBean
    private MonitorPingEventService eventService;

    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "READ_herramientas"})
    void listar_conPermisoLectura_devuelveMonitores() throws Exception {
        when(service.listar()).thenReturn(List.of(response(1L, "Gateway")));

        mockMvc.perform(get("/api/herramientas/monitores-ping"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].nombre", is("Gateway")));
    }

    @Test
    @WithMockUser(username = "maria", authorities = {"ROLE_SOPORTE", "WRITE_herramientas"})
    void crear_conPermisoEscritura_registraUsuario() throws Exception {
        MonitorPingRequest request = new MonitorPingRequest();
        request.setNombre("Servidor AD");
        request.setHost("10.10.1.20");
        request.setIntervaloSegundos(10);
        when(service.crear(any(MonitorPingRequest.class), eq("maria"))).thenReturn(response(2L, "Servidor AD"));

        mockMvc.perform(post("/api/herramientas/monitores-ping")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", is(2)))
                .andExpect(jsonPath("$.nombre", is("Servidor AD")));

        verify(service).crear(any(MonitorPingRequest.class), eq("maria"));
    }

    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "READ_herramientas"})
    void crear_sinPermisoEscritura_devuelveForbidden() throws Exception {
        mockMvc.perform(post("/api/herramientas/monitores-ping")
                        .contentType("application/json")
                        .content("{\"nombre\":\"Gateway\",\"host\":\"10.0.0.1\",\"intervaloSegundos\":10}"))
                .andExpect(status().isForbidden());
    }

    private MonitorPingResponse response(Long id, String nombre) {
        Instant now = Instant.parse("2026-08-28T15:00:00Z");
        return new MonitorPingResponse(
                id, nombre, "10.0.0.1", 10, MonitorPingEstado.ACTIVO, "PENDIENTE",
                "admin", null, now, null, null, 0L, 0L, 0.0
        );
    }
}
