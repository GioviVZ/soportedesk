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
        request.setApellidos("Pérez García");
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

    private Correo sampleCorreo() {
        Correo correo = new Correo();
        correo.setId(1L);
        correo.setUsuario("jperez");
        correo.setNombre("Juan Pérez");
        correo.setApellidos("Pérez García");
        correo.setCorreo("j.perez@inia.gob.pe");
        correo.setEstado("Activo");
        correo.setSede(sede);
        correo.setDependencia(dependencia);
        correo.setSubdependencia(subdependencia);
        correo.setTipoContrato(tipoContrato);
        correo.setFechaFinContrato(LocalDate.of(2026, 12, 31));
        correo.setCreado(LocalDate.of(2023, 1, 10));
        return correo;
    }

    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "READ_correos"})
    void findAll_withReadAuthority_allowsUser() throws Exception {
        Correo correo = sampleCorreo();
        when(service.findAll(null)).thenReturn(List.of(correo));

        mockMvc.perform(get("/api/correos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].usuario", is("jperez")))
                .andExpect(jsonPath("$[0].sede.nombre", is("Lima")));
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void findAll_withoutReadAuthority_returnsForbidden() throws Exception {
        mockMvc.perform(get("/api/correos"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void create_withAdminRole_returnsCreated() throws Exception {
        Correo correo = sampleCorreo();
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
