package com.inia.soportedesk.equipos;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class EquipoControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private EquipoService service;

    private EquipoRequest sampleRequest() {
        EquipoRequest request = new EquipoRequest();
        request.setCodigo("EQ-2024-001");
        request.setTipo("Laptop");
        request.setMarca("Dell");
        request.setModelo("Latitude 5540");
        request.setUsuario("jperez");
        request.setArea("TI");
        request.setAsignado(LocalDate.of(2024, 1, 10));
        request.setEstado("En uso");
        return request;
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void findAll_allowsAuthenticatedUser() throws Exception {
        when(service.findAll(null)).thenReturn(List.of(new Equipo(1L, "EQ-2024-001", "Laptop", "Dell", "Latitude 5540", "jperez", "TI", LocalDate.of(2024, 1, 10), "En uso")));

        mockMvc.perform(get("/api/equipos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].codigo", is("EQ-2024-001")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void create_withAdminRole_returnsCreated() throws Exception {
        when(service.create(any())).thenReturn(new Equipo(1L, "EQ-2024-001", "Laptop", "Dell", "Latitude 5540", "jperez", "TI", LocalDate.of(2024, 1, 10), "En uso"));

        mockMvc.perform(post("/api/equipos")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.codigo", is("EQ-2024-001")));
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void create_withSoporteRole_returnsForbidden() throws Exception {
        mockMvc.perform(post("/api/equipos")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isForbidden());
    }
}
