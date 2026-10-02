package com.inia.soportedesk.equiposmoviles;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
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
class AsignacionNumeroMovilControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private AsignacionNumeroMovilService service;

    @Test
    @WithMockUser(roles = "SOPORTE")
    void findAll_withoutAuthority_returnsForbidden() throws Exception {
        mockMvc.perform(get("/api/equipos-moviles/asignaciones"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "READ_equipos-moviles")
    void findAll_withReadAuthority_returnsOk() throws Exception {
        when(service.findAll(null, null, null)).thenReturn(List.of(sampleAsignacion()));

        mockMvc.perform(get("/api/equipos-moviles/asignaciones"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].numero", is("987654321")));
    }

    @Test
    @WithMockUser(authorities = "WRITE_equipos-moviles")
    void create_withWriteAuthority_returnsCreated() throws Exception {
        when(service.create(any(AsignacionNumeroMovilRequest.class))).thenReturn(sampleAsignacion());

        mockMvc.perform(post("/api/equipos-moviles/asignaciones")
                        .with(csrf())
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.estado", is("Activa")));
    }

    @Test
    @WithMockUser(authorities = "WRITE_equipos-moviles")
    void create_withInvalidBody_returnsBadRequest() throws Exception {
        AsignacionNumeroMovilRequest request = sampleRequest();
        request.setPersonaNombre(" ");

        mockMvc.perform(post("/api/equipos-moviles/asignaciones")
                        .with(csrf())
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    private AsignacionNumeroMovilRequest sampleRequest() {
        AsignacionNumeroMovilRequest request = new AsignacionNumeroMovilRequest();
        request.setEquipoMovilId(1L);
        request.setNumero("987654321");
        request.setOperador("Claro");
        request.setPersonaNombre("María Pérez");
        request.setFechaInicio(LocalDate.of(2026, 2, 1));
        request.setEstado("Activa");
        return request;
    }

    private AsignacionNumeroMovil sampleAsignacion() {
        AsignacionNumeroMovil asignacion = new AsignacionNumeroMovil();
        asignacion.setId(1L);
        asignacion.setNumero("987654321");
        asignacion.setOperador("Claro");
        asignacion.setPersonaNombre("María Pérez");
        asignacion.setFechaInicio(LocalDate.of(2026, 2, 1));
        asignacion.setEstado("Activa");
        return asignacion;
    }
}
