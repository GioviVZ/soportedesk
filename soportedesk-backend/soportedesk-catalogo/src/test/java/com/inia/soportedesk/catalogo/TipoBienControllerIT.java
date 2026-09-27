package com.inia.soportedesk.catalogo;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
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
class TipoBienControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private TipoBienService service;

    private TipoBien sample() {
        TipoBien tipo = new TipoBien();
        tipo.setId(1L);
        tipo.setNombre("Intangible");
        return tipo;
    }

    @Test
    @WithMockUser(authorities = "READ_catalogos")
    void findAll_allowsAuthenticatedUser() throws Exception {
        when(service.findAll(null)).thenReturn(List.of(sample()));

        mockMvc.perform(get("/api/catalogos/tipos-bien"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].nombre", is("Intangible")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void create_withAdminRole_returnsCreated() throws Exception {
        TipoBienRequest request = new TipoBienRequest();
        request.setNombre("Intangible");
        when(service.create(any())).thenReturn(sample());

        mockMvc.perform(post("/api/catalogos/tipos-bien")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nombre", is("Intangible")));
    }

    @Test
    @WithMockUser(authorities = "READ_catalogos")
    void create_withSoporteRole_returnsForbidden() throws Exception {
        TipoBienRequest request = new TipoBienRequest();
        request.setNombre("Intangible");

        mockMvc.perform(post("/api/catalogos/tipos-bien")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }
}
