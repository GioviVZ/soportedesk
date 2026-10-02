package com.inia.soportedesk.telefoniafija;

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
class TelefonoFijoControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private TelefonoFijoService service;

    @Test
    @WithMockUser(roles = "SOPORTE")
    void findAll_withoutAuthority_returnsForbidden() throws Exception {
        mockMvc.perform(get("/api/telefonia-fija/telefonos"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "READ_telefonia-fija")
    void findAll_withReadAuthority_returnsOk() throws Exception {
        when(service.findAll(null, null)).thenReturn(List.of(sampleTelefono()));

        mockMvc.perform(get("/api/telefonia-fija/telefonos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].tipo", is("IP")));
    }

    @Test
    @WithMockUser(authorities = "WRITE_telefonia-fija")
    void create_withWriteAuthority_returnsCreated() throws Exception {
        when(service.create(any(TelefonoFijoRequest.class))).thenReturn(sampleTelefono());

        mockMvc.perform(post("/api/telefonia-fija/telefonos")
                        .with(csrf())
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.marca", is("Cisco")));
    }

    @Test
    @WithMockUser(authorities = "WRITE_telefonia-fija")
    void create_withInvalidBody_returnsBadRequest() throws Exception {
        TelefonoFijoRequest request = sampleRequest();
        request.setMarca(" ");

        mockMvc.perform(post("/api/telefonia-fija/telefonos")
                        .with(csrf())
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    private TelefonoFijoRequest sampleRequest() {
        TelefonoFijoRequest request = new TelefonoFijoRequest();
        request.setTipo(TipoTelefonoFijo.IP);
        request.setMarca("Cisco");
        request.setModelo("CP-8841");
        request.setEstado("Operativo");
        return request;
    }

    private TelefonoFijo sampleTelefono() {
        TelefonoFijo telefono = new TelefonoFijo();
        telefono.setId(1L);
        telefono.setTipo(TipoTelefonoFijo.IP);
        telefono.setMarca("Cisco");
        telefono.setModelo("CP-8841");
        telefono.setEstado("Operativo");
        return telefono;
    }
}
