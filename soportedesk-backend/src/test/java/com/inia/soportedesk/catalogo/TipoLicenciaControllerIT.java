package com.inia.soportedesk.catalogo;

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
class TipoLicenciaControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private TipoLicenciaService service;

    private TipoLicencia sample() {
        TipoLicencia tipo = new TipoLicencia();
        tipo.setId(1L);
        tipo.setNombre("Ofimática");
        return tipo;
    }

    @Test
    @WithMockUser(authorities = "READ_catalogos")
    void findAll_allowsAuthenticatedUser() throws Exception {
        when(service.findAll(null)).thenReturn(List.of(sample()));

        mockMvc.perform(get("/api/catalogos/tipos-licencia"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].nombre", is("Ofimática")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void create_withAdminRole_returnsCreated() throws Exception {
        TipoLicenciaRequest request = new TipoLicenciaRequest();
        request.setNombre("Ofimática");
        when(service.create(any())).thenReturn(sample());

        mockMvc.perform(post("/api/catalogos/tipos-licencia")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nombre", is("Ofimática")));
    }

    @Test
    @WithMockUser(authorities = "READ_catalogos")
    void create_withSoporteRole_returnsForbidden() throws Exception {
        TipoLicenciaRequest request = new TipoLicenciaRequest();
        request.setNombre("Ofimática");

        mockMvc.perform(post("/api/catalogos/tipos-licencia")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }
}
