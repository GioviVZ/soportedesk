package com.inia.soportedesk.equiposred;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "uploads.drivers-dir=target/test-uploads/drivers")
@AutoConfigureMockMvc
class EquipoRedControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private EquipoRedService service;

    @Test
    @WithMockUser(authorities = "READ_equipos-red")
    void findAll_withReadAuthority_returnsOk() throws Exception {
        when(service.findAll(TipoEquipoRed.SWITCH, null)).thenReturn(List.of(sampleEquipo()));

        mockMvc.perform(get("/api/equipos-red").param("tipo", "SWITCH"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].tipo", is("SWITCH")))
                .andExpect(jsonPath("$[0].marca", is("Cisco")));
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void findAll_withoutReadAuthority_returnsForbidden() throws Exception {
        mockMvc.perform(get("/api/equipos-red").param("tipo", "SWITCH"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "WRITE_equipos-red")
    void create_withWriteAuthority_returnsCreated() throws Exception {
        when(service.create(any(EquipoRedRequest.class))).thenReturn(sampleEquipo());

        mockMvc.perform(post("/api/equipos-red")
                        .with(csrf())
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.tipo", is("SWITCH")));
    }

    @Test
    @WithMockUser(authorities = "READ_equipos-red")
    void create_withOnlyReadAuthority_returnsForbidden() throws Exception {
        mockMvc.perform(post("/api/equipos-red")
                        .with(csrf())
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "WRITE_equipos-red")
    void create_withBlankMarca_returnsBadRequest() throws Exception {
        EquipoRedRequest request = sampleRequest();
        request.setMarca(" ");

        mockMvc.perform(post("/api/equipos-red")
                        .with(csrf())
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(authorities = "WRITE_equipos-red")
    void create_withInvalidEstado_returnsBadRequest() throws Exception {
        EquipoRedRequest request = sampleRequest();
        request.setEstado("Dañado");

        mockMvc.perform(post("/api/equipos-red")
                        .with(csrf())
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    private EquipoRedRequest sampleRequest() {
        EquipoRedRequest request = new EquipoRedRequest();
        request.setTipo(TipoEquipoRed.SWITCH);
        request.setMarca("Cisco");
        request.setModelo("Catalyst 9200");
        request.setEstado("Operativo");
        return request;
    }

    private EquipoRed sampleEquipo() {
        EquipoRed equipo = new EquipoRed();
        equipo.setId(1L);
        equipo.setTipo(TipoEquipoRed.SWITCH);
        equipo.setMarca("Cisco");
        equipo.setModelo("Catalyst 9200");
        equipo.setEstado("Operativo");
        return equipo;
    }
}
