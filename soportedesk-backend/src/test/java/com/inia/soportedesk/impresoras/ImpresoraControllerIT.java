package com.inia.soportedesk.impresoras;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class ImpresoraControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ImpresoraService service;

    private ImpresoraRequest sampleRequest() {
        ImpresoraRequest request = new ImpresoraRequest();
        request.setNombre("HP LaserJet 4ta planta");
        request.setMarca("HP");
        request.setModelo("M404dn");
        request.setIp("10.0.0.50");
        request.setPiso("4");
        request.setArea("Administración");
        request.setEstado("Activa");
        request.setTonerNegro(80);
        request.setTonerC(60);
        request.setTonerM(60);
        request.setTonerY(60);
        request.setCartucho(90);
        request.setDrum(70);
        request.setFusor(85);
        return request;
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void findAll_allowsAuthenticatedUser() throws Exception {
        Impresora impresora = new Impresora(1L, "HP LaserJet 4ta planta", "HP", "M404dn", "10.0.0.50", "4", "Administración", "Activa", 80, 60, 60, 60, 90, 70, 85, null, null, null, null);
        when(service.findAll(null)).thenReturn(List.of(impresora));

        mockMvc.perform(get("/api/impresoras"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].nombre", is("HP LaserJet 4ta planta")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void create_withAdminRole_returnsCreated() throws Exception {
        Impresora impresora = new Impresora(1L, "HP LaserJet 4ta planta", "HP", "M404dn", "10.0.0.50", "4", "Administración", "Activa", 80, 60, 60, 60, 90, 70, 85, null, null, null, null);
        when(service.create(any())).thenReturn(impresora);

        mockMvc.perform(post("/api/impresoras")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nombre", is("HP LaserJet 4ta planta")));
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void create_withSoporteRole_returnsForbidden() throws Exception {
        mockMvc.perform(post("/api/impresoras")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isForbidden());
    }
}
