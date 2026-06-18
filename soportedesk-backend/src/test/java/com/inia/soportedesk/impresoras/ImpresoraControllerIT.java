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
        request.setEstado("Activa");
        request.setModeloTonerNegro("TN-2380");
        request.setModeloDrum("DR-2365");
        return request;
    }

    private Impresora sampleImpresora() {
        Impresora imp = new Impresora();
        imp.setId(1L);
        imp.setNombre("HP LaserJet 4ta planta");
        imp.setMarca("HP");
        imp.setModelo("M404dn");
        imp.setEstado("Activa");
        imp.setModeloTonerNegro("TN-2380");
        imp.setModeloDrum("DR-2365");
        return imp;
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void findAll_allowsAuthenticatedUser() throws Exception {
        when(service.findAll(null)).thenReturn(List.of(sampleImpresora()));

        mockMvc.perform(get("/api/impresoras"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].nombre", is("HP LaserJet 4ta planta")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void create_withAdminRole_returnsCreated() throws Exception {
        when(service.create(any())).thenReturn(sampleImpresora());

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
