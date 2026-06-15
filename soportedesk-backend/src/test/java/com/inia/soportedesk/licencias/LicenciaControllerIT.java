package com.inia.soportedesk.licencias;

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
class LicenciaControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private LicenciaService service;

    private LicenciaRequest sampleRequest() {
        LicenciaRequest request = new LicenciaRequest();
        request.setCantidad(5);
        request.setLicencia("Office 365 E3");
        request.setCorreo("j.perez@inia.gob.pe");
        request.setClave("NKJFR-XXXXX-XXXXX-MNBVC");
        request.setOrdenCompra("OC-2024-00123");
        request.setAnio("2024");
        return request;
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void findAll_allowsAuthenticatedUser() throws Exception {
        when(service.findAll(null)).thenReturn(List.of(new Licencia(1L, 5, "Office 365 E3", "j.perez@inia.gob.pe", "NKJFR-XXXXX-XXXXX-MNBVC", "OC-2024-00123", "2024")));

        mockMvc.perform(get("/api/licencias"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].licencia", is("Office 365 E3")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void create_withAdminRole_returnsCreated() throws Exception {
        when(service.create(any())).thenReturn(new Licencia(1L, 5, "Office 365 E3", "j.perez@inia.gob.pe", "NKJFR-XXXXX-XXXXX-MNBVC", "OC-2024-00123", "2024"));

        mockMvc.perform(post("/api/licencias")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.licencia", is("Office 365 E3")));
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void create_withSoporteRole_returnsForbidden() throws Exception {
        mockMvc.perform(post("/api/licencias")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void create_withInvalidRequest_returns400() throws Exception {
        LicenciaRequest request = sampleRequest();
        request.setCorreo("not-an-email");

        mockMvc.perform(post("/api/licencias")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void delete_withAdminRole_returnsNoContent() throws Exception {
        mockMvc.perform(delete("/api/licencias/1"))
                .andExpect(status().isNoContent());
    }
}
