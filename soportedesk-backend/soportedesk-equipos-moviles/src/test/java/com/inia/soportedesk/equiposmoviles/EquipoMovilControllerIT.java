package com.inia.soportedesk.equiposmoviles;

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

@SpringBootTest
@AutoConfigureMockMvc
class EquipoMovilControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private EquipoMovilService service;

    @Test
    @WithMockUser(roles = "SOPORTE")
    void findAll_withoutAuthority_returnsForbidden() throws Exception {
        mockMvc.perform(get("/api/equipos-moviles"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "READ_equipos-moviles")
    void findAll_withReadAuthority_returnsOk() throws Exception {
        when(service.findAll(null, null)).thenReturn(List.of(sampleEquipo()));

        mockMvc.perform(get("/api/equipos-moviles"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].tipo", is("SMARTPHONE")));
    }

    @Test
    @WithMockUser(authorities = "WRITE_equipos-moviles")
    void create_withWriteAuthority_returnsCreated() throws Exception {
        when(service.create(any(EquipoMovilRequest.class))).thenReturn(sampleEquipo());

        mockMvc.perform(post("/api/equipos-moviles")
                        .with(csrf())
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.marca", is("Samsung")));
    }

    @Test
    @WithMockUser(authorities = "WRITE_equipos-moviles")
    void create_withInvalidBody_returnsBadRequest() throws Exception {
        EquipoMovilRequest request = sampleRequest();
        request.setMarca(" ");

        mockMvc.perform(post("/api/equipos-moviles")
                        .with(csrf())
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    private EquipoMovilRequest sampleRequest() {
        EquipoMovilRequest request = new EquipoMovilRequest();
        request.setTipo(TipoEquipoMovil.SMARTPHONE);
        request.setMarca("Samsung");
        request.setModelo("Galaxy S24");
        request.setEstado("Operativo");
        return request;
    }

    private EquipoMovil sampleEquipo() {
        EquipoMovil equipo = new EquipoMovil();
        equipo.setId(1L);
        equipo.setTipo(TipoEquipoMovil.SMARTPHONE);
        equipo.setMarca("Samsung");
        equipo.setModelo("Galaxy S24");
        equipo.setEstado("Operativo");
        return equipo;
    }
}
