package com.inia.soportedesk.correos;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.inia.soportedesk.catalogo.*;
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
class CorreoControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CorreoService service;

    private final Sede sede = new Sede(1L, "Lima");
    private final Dependencia dependencia = new Dependencia(1L, "TI", sede);
    private final Subdependencia subdependencia = new Subdependencia(1L, "Soporte", dependencia);
    private final TipoContrato tipoContrato = new TipoContrato(1L, "CAS");

    private CorreoRequest sampleRequest() {
        CorreoRequest request = new CorreoRequest();
        request.setUsuario("jperez");
        request.setNombre("Juan Pérez");
        request.setCorreo("j.perez@inia.gob.pe");
        request.setEstado("Activo");
        request.setSedeId(1L);
        request.setDependenciaId(1L);
        request.setSubdependenciaId(1L);
        request.setTipoContratoId(1L);
        request.setFechaFinContrato(LocalDate.of(2026, 12, 31));
        request.setCreado(LocalDate.of(2023, 1, 10));
        return request;
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void findAll_allowsAuthenticatedUser() throws Exception {
        Correo correo = new Correo(1L, "jperez", "Juan Pérez", "j.perez@inia.gob.pe", "Activo", sede, dependencia, subdependencia, tipoContrato, LocalDate.of(2026, 12, 31), LocalDate.of(2023, 1, 10));
        when(service.findAll(null)).thenReturn(List.of(correo));

        mockMvc.perform(get("/api/correos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].usuario", is("jperez")))
                .andExpect(jsonPath("$[0].sede.nombre", is("Lima")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void create_withAdminRole_returnsCreated() throws Exception {
        Correo correo = new Correo(1L, "jperez", "Juan Pérez", "j.perez@inia.gob.pe", "Activo", sede, dependencia, subdependencia, tipoContrato, LocalDate.of(2026, 12, 31), LocalDate.of(2023, 1, 10));
        when(service.create(any())).thenReturn(correo);

        mockMvc.perform(post("/api/correos")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.usuario", is("jperez")));
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void create_withSoporteRole_returnsForbidden() throws Exception {
        mockMvc.perform(post("/api/correos")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isForbidden());
    }
}
