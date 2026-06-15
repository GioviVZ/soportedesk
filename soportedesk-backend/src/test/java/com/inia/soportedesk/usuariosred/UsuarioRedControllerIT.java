package com.inia.soportedesk.usuariosred;

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
import java.time.LocalDateTime;
import java.util.List;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class UsuarioRedControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UsuarioRedService service;

    private final Sede sede = new Sede(1L, "Lima");
    private final Dependencia dependencia = new Dependencia(1L, "TI", sede);
    private final Subdependencia subdependencia = new Subdependencia(1L, "Soporte", dependencia);
    private final TipoContrato tipoContrato = new TipoContrato(1L, "CAS");

    private UsuarioRedRequest sampleRequest() {
        UsuarioRedRequest request = new UsuarioRedRequest();
        request.setUsuario("jperez");
        request.setNombre("Juan Pérez");
        request.setGrupo("IT-Admins");
        request.setUltimoLogin(LocalDateTime.of(2025, 6, 13, 8, 42));
        request.setEstado("Activo");
        request.setSedeId(1L);
        request.setDependenciaId(1L);
        request.setSubdependenciaId(1L);
        request.setTipoContratoId(1L);
        request.setFechaFinContrato(LocalDate.of(2026, 12, 31));
        return request;
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void findAll_allowsAuthenticatedUser() throws Exception {
        UsuarioRed usuario = new UsuarioRed(1L, "jperez", "Juan Pérez", "IT-Admins", LocalDateTime.of(2025, 6, 13, 8, 42), "Activo", sede, dependencia, subdependencia, tipoContrato, LocalDate.of(2026, 12, 31));
        when(service.findAll(null)).thenReturn(List.of(usuario));

        mockMvc.perform(get("/api/usuarios-red"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].usuario", is("jperez")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void create_withAdminRole_returnsCreated() throws Exception {
        UsuarioRed usuario = new UsuarioRed(1L, "jperez", "Juan Pérez", "IT-Admins", LocalDateTime.of(2025, 6, 13, 8, 42), "Activo", sede, dependencia, subdependencia, tipoContrato, LocalDate.of(2026, 12, 31));
        when(service.create(any())).thenReturn(usuario);

        mockMvc.perform(post("/api/usuarios-red")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.usuario", is("jperez")));
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void create_withSoporteRole_returnsForbidden() throws Exception {
        mockMvc.perform(post("/api/usuarios-red")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isForbidden());
    }
}
