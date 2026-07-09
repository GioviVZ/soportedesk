package com.inia.soportedesk.impresoras;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.inia.soportedesk.catalogo.MarcaImpresora;
import com.inia.soportedesk.catalogo.ModeloImpresora;
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
        request.setModeloImpresoraId(1L);
        request.setTipoConexion("IP");
        request.setIp("10.0.0.50");
        request.setSerie("SN-12345");
        request.setCodigoInventario("INV-001");
        request.setCodigoPatrimonial("PAT-001");
        request.setEstado("Activa");
        return request;
    }

    private Impresora sampleImpresora() {
        MarcaImpresora marca = new MarcaImpresora();
        marca.setId(1L);
        marca.setNombre("HP");

        ModeloImpresora modelo = new ModeloImpresora();
        modelo.setId(1L);
        modelo.setMarca(marca);
        modelo.setNombre("M404dn");

        Impresora imp = new Impresora();
        imp.setId(1L);
        imp.setModeloImpresora(modelo);
        imp.setTipoConexion("IP");
        imp.setIp("10.0.0.50");
        imp.setSerie("SN-12345");
        imp.setCodigoInventario("INV-001");
        imp.setCodigoPatrimonial("PAT-001");
        imp.setEstado("Activa");
        return imp;
    }

    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "READ_impresoras"})
    void findAll_withReadAuthority_allowsUser() throws Exception {
        when(service.findAll(null)).thenReturn(List.of(sampleImpresora()));

        mockMvc.perform(get("/api/impresoras"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].modeloImpresora.marca.nombre", is("HP")))
                .andExpect(jsonPath("$[0].modeloImpresora.nombre", is("M404dn")));
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void findAll_withoutReadAuthority_returnsForbidden() throws Exception {
        mockMvc.perform(get("/api/impresoras"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void create_withAdminRole_returnsCreated() throws Exception {
        when(service.create(any())).thenReturn(sampleImpresora());

        mockMvc.perform(post("/api/impresoras")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.modeloImpresora.marca.nombre", is("HP")))
                .andExpect(jsonPath("$.modeloImpresora.nombre", is("M404dn")));
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void create_withSoporteRole_returnsForbidden() throws Exception {
        mockMvc.perform(post("/api/impresoras")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "WRITE_impresoras"})
    void dashboardCompleto_withWriteAuthority_returnsOk() throws Exception {
        when(service.getDashboardCompleto()).thenReturn(new ImpresoraDashboardCompleto(
                10, 8, 1, 1, List.of(), List.of(), List.of(), 0));

        mockMvc.perform(get("/api/impresoras/dashboard/completo"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total", is(10)));
    }

    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "READ_impresoras"})
    void dashboardCompleto_withOnlyReadAuthority_returnsForbidden() throws Exception {
        mockMvc.perform(get("/api/impresoras/dashboard/completo"))
                .andExpect(status().isForbidden());
    }
}
