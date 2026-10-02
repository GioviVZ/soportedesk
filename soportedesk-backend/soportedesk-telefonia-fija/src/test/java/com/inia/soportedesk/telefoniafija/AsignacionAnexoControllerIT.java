package com.inia.soportedesk.telefoniafija;

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
class AsignacionAnexoControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private AsignacionAnexoService service;

    @Test
    @WithMockUser(roles = "SOPORTE")
    void findAll_withoutAuthority_returnsForbidden() throws Exception {
        mockMvc.perform(get("/api/telefonia-fija/asignaciones"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "READ_telefonia-fija")
    void findAll_withReadAuthority_returnsOk() throws Exception {
        when(service.findAll(null, null, null)).thenReturn(List.of(sampleAsignacion()));

        mockMvc.perform(get("/api/telefonia-fija/asignaciones"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].anexo", is("1234")));
    }

    @Test
    @WithMockUser(authorities = "WRITE_telefonia-fija")
    void create_withWriteAuthority_returnsCreated() throws Exception {
        when(service.create(any(AsignacionAnexoRequest.class))).thenReturn(sampleAsignacion());

        mockMvc.perform(post("/api/telefonia-fija/asignaciones")
                        .with(csrf())
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.estado", is("Activa")));
    }

    @Test
    @WithMockUser(authorities = "WRITE_telefonia-fija")
    void create_withInvalidBody_returnsBadRequest() throws Exception {
        AsignacionAnexoRequest request = sampleRequest();
        request.setAnexo("12");

        mockMvc.perform(post("/api/telefonia-fija/asignaciones")
                        .with(csrf())
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    private AsignacionAnexoRequest sampleRequest() {
        AsignacionAnexoRequest request = new AsignacionAnexoRequest();
        request.setTelefonoFijoId(1L);
        request.setAnexo("1234");
        request.setPersonaNombre("María Pérez");
        request.setFechaInicio(LocalDate.of(2026, 2, 1));
        request.setEstado("Activa");
        return request;
    }

    private AsignacionAnexo sampleAsignacion() {
        AsignacionAnexo asignacion = new AsignacionAnexo();
        asignacion.setId(1L);
        asignacion.setAnexo("1234");
        asignacion.setPersonaNombre("María Pérez");
        asignacion.setFechaInicio(LocalDate.of(2026, 2, 1));
        asignacion.setEstado("Activa");
        return asignacion;
    }
}
