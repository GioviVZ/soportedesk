package com.inia.soportedesk.licencias;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.inia.soportedesk.catalogo.TipoBien;
import com.inia.soportedesk.catalogo.TipoLicencia;
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
class LicenciaControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private LicenciaService service;

    private TipoLicencia tipoLicencia() {
        TipoLicencia tipo = new TipoLicencia();
        tipo.setId(1L);
        tipo.setNombre("Ofimática");
        return tipo;
    }

    private TipoBien tipoBien() {
        TipoBien tipo = new TipoBien();
        tipo.setId(1L);
        tipo.setNombre("Intangible");
        return tipo;
    }

    private Licencia sampleLicencia() {
        Licencia licencia = new Licencia();
        licencia.setId(1L);
        licencia.setTipoLicencia(tipoLicencia());
        licencia.setTipoBien(tipoBien());
        licencia.setDescripcion("Office 2024 Profesional Home and Business");
        licencia.setCuentaActivacion("j.perez@inia.gob.pe");
        licencia.setClaveActivacion("NKJFR-XXXXX-XXXXX-MNBVC");
        licencia.setOrdenCompra("OC-2024-00123");
        licencia.setAnio("2024");
        licencia.setCantidad(5);
        return licencia;
    }

    private LicenciaRequest sampleRequest() {
        LicenciaRequest request = new LicenciaRequest();
        request.setTipoLicenciaId(1L);
        request.setTipoBienId(1L);
        request.setDescripcion("Office 2024 Profesional Home and Business");
        request.setCuentaActivacion("j.perez@inia.gob.pe");
        request.setClaveActivacion("NKJFR-XXXXX-XXXXX-MNBVC");
        request.setOrdenCompra("OC-2024-00123");
        request.setAnio("2024");
        request.setCantidad(5);
        return request;
    }

    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "READ_licencias"})
    void findAll_withReadAuthority_allowsUser() throws Exception {
        when(service.findAll(null)).thenReturn(List.of(sampleLicencia()));

        mockMvc.perform(get("/api/licencias"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].descripcion", is("Office 2024 Profesional Home and Business")))
                .andExpect(jsonPath("$[0].tipoLicencia.nombre", is("Ofimática")))
                .andExpect(jsonPath("$[0].tipoBien.nombre", is("Intangible")));
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void findAll_withoutReadAuthority_returnsForbidden() throws Exception {
        mockMvc.perform(get("/api/licencias"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void create_withAdminRole_returnsCreated() throws Exception {
        when(service.create(any())).thenReturn(sampleLicencia());

        mockMvc.perform(post("/api/licencias")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.descripcion", is("Office 2024 Profesional Home and Business")));
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
        request.setDescripcion("");

        mockMvc.perform(post("/api/licencias")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void create_withClaveActivacionButNoCuentaActivacion_returns409() throws Exception {
        when(service.create(any())).thenThrow(new IllegalArgumentException(
                "No se puede registrar una clave de activación sin una cuenta de activación asociada."));

        LicenciaRequest request = sampleRequest();
        request.setCuentaActivacion(null);

        mockMvc.perform(post("/api/licencias")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void delete_withAdminRole_returnsNoContent() throws Exception {
        mockMvc.perform(delete("/api/licencias/1"))
                .andExpect(status().isNoContent());
    }
}
