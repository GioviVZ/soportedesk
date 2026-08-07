package com.inia.soportedesk.usuariosred.contrato;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class UsuarioRedContratoControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private UsuarioRedContratoService service;

    private UsuarioRedContratoRequest sampleRequest() {
        UsuarioRedContratoRequest request = new UsuarioRedContratoRequest();
        request.setUsuario("jperez");
        request.setTipoContratoId(1L);
        request.setFechaInicio(LocalDate.of(2026, 1, 1));
        request.setFechaFin(LocalDate.of(2026, 12, 31));
        request.setNumeroContrato("OS-001-2026");
        request.setPersonalNombre("Juan");
        request.setPersonalApellidos("Pérez");
        return request;
    }

    private UsuarioRedConsultaDto sampleConsultaDto() {
        UsuarioRedConsultaDto dto = new UsuarioRedConsultaDto();
        dto.setUsuario("jperez");
        dto.setDisplayName("Juan Perez");
        dto.setEnabled(true);
        dto.setLocked(false);
        return dto;
    }

    private UsuarioRedContratoDto sampleDto() {
        UsuarioRedContratoDto dto = new UsuarioRedContratoDto();
        dto.setId(1L);
        dto.setUsuario("jperez");
        dto.setTipoContratoId(1L);
        dto.setTipoContratoNombre("OS");
        dto.setFechaInicio(LocalDate.of(2026, 1, 1));
        dto.setFechaFin(LocalDate.of(2026, 12, 31));
        dto.setNumeroContrato("OS-001-2026");
        dto.setPersonalNombre("Juan");
        dto.setPersonalApellidos("Pérez");
        return dto;
    }

    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "READ_usuarios-red"})
    void findByUsuario_withReadAuthority_allowsUser() throws Exception {
        when(service.findByUsuario("jperez")).thenReturn(List.of(sampleDto()));

        mockMvc.perform(get("/api/usuarios-red/contratos").param("usuario", "jperez"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].usuario", is("jperez")));
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void findByUsuario_withoutReadAuthority_returnsForbidden() throws Exception {
        mockMvc.perform(get("/api/usuarios-red/contratos").param("usuario", "jperez"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "READ_usuarios-red"})
    void buscarPorPersonal_withReadAuthority_allowsUser() throws Exception {
        when(service.searchByPersonal("Juan")).thenReturn(List.of(sampleDto()));

        mockMvc.perform(get("/api/usuarios-red/contratos/buscar").param("termino", "Juan"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].personalNombre", is("Juan")));
    }

    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "READ_usuarios-red"})
    void buscarConsultas_withoutTermino_allowsUserAndReturnsDirectory() throws Exception {
        when(service.searchConsultas(null)).thenReturn(List.of(sampleConsultaDto()));

        mockMvc.perform(get("/api/usuarios-red/contratos/consultas"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].usuario", is("jperez")));
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void buscarConsultas_withoutReadAuthority_returnsForbidden() throws Exception {
        mockMvc.perform(get("/api/usuarios-red/contratos/consultas"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void create_withAdminRole_returnsCreated() throws Exception {
        when(service.create(any(), anyString())).thenReturn(sampleDto());

        mockMvc.perform(post("/api/usuarios-red/contratos")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.usuario", is("jperez")));
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void create_withoutWriteAuthority_returnsForbidden() throws Exception {
        mockMvc.perform(post("/api/usuarios-red/contratos")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "WRITE_usuarios-red"})
    void update_withWriteAuthority_returnsOk() throws Exception {
        when(service.update(anyLong(), any(), anyString())).thenReturn(sampleDto());

        mockMvc.perform(put("/api/usuarios-red/contratos/1")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.usuario", is("jperez")));
    }

    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "WRITE_usuarios-red"})
    void delete_withWriteAuthority_returnsNoContent() throws Exception {
        mockMvc.perform(delete("/api/usuarios-red/contratos/1"))
                .andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void delete_withoutWriteAuthority_returnsForbidden() throws Exception {
        mockMvc.perform(delete("/api/usuarios-red/contratos/1"))
                .andExpect(status().isForbidden());
    }
}
