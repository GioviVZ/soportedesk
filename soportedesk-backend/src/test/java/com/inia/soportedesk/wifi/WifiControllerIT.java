package com.inia.soportedesk.wifi;

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
class WifiControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private WifiService service;

    private WifiRequest sampleRequest() {
        WifiRequest request = new WifiRequest();
        request.setSsid("INIA-CORP");
        request.setClave("clave-secreta");
        request.setUbicacion("Edificio Principal - Todos los pisos");
        request.setTipo("WPA2-Enterprise");
        request.setEstado("Activo");
        return request;
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void findAll_allowsAuthenticatedUser() throws Exception {
        when(service.findAll(null)).thenReturn(List.of(new Wifi(1L, "INIA-CORP", "clave-secreta", "Edificio Principal", "WPA2-Enterprise", "Activo")));

        mockMvc.perform(get("/api/wifi"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].ssid", is("INIA-CORP")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void create_withAdminRole_returnsCreated() throws Exception {
        when(service.create(any())).thenReturn(new Wifi(1L, "INIA-CORP", "clave-secreta", "Edificio Principal", "WPA2-Enterprise", "Activo"));

        mockMvc.perform(post("/api/wifi")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.ssid", is("INIA-CORP")));
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void create_withSoporteRole_returnsForbidden() throws Exception {
        mockMvc.perform(post("/api/wifi")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isForbidden());
    }
}
