package com.inia.soportedesk.correos;

import com.inia.soportedesk.gestiontiinia.VwGwDashboard;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.hamcrest.Matchers.is;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class CorreoControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CorreoService service;

    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "READ_correos"})
    void findAll_withReadAuthority_allowsUser() throws Exception {
        VwGwDashboard correo = dashboard("jperez@inia.gob.pe", "Juan Perez");
        when(service.findAll("juan", "Lima", "OTI", "Soporte", "Activo", "CAS", true)).thenReturn(List.of(correo));

        mockMvc.perform(get("/api/correos")
                        .param("search", "juan")
                        .param("sede", "Lima")
                        .param("dependencia", "OTI")
                        .param("subdependencia", "Soporte")
                        .param("estado", "Activo")
                        .param("modalidad", "CAS")
                        .param("sinUso30Dias", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].email", is("jperez@inia.gob.pe")))
                .andExpect(jsonPath("$[0].nombreCompleto", is("Juan Perez")));
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void findAll_withoutReadAuthority_returnsForbidden() throws Exception {
        mockMvc.perform(get("/api/correos"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "READ_correos"})
    void kpis_withReadAuthority_returnsSummary() throws Exception {
        when(service.getKpis()).thenReturn(new CorreoKpisDto(1200, 1069, 131, 1069, 131, 500, 700));

        mockMvc.perform(get("/api/correos/kpis"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.licenciasTotales", is(1200)))
                .andExpect(jsonPath("$.activasCount", is(1069)));
    }

    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "READ_correos"})
    void sedes_withReadAuthority_returnsList() throws Exception {
        when(service.getSedes()).thenReturn(List.of("Lima", "Cusco"));

        mockMvc.perform(get("/api/correos/sedes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0]", is("Lima")));
    }

    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "READ_correos"})
    void dependencias_withReadAuthority_returnsList() throws Exception {
        when(service.getDependencias()).thenReturn(List.of("DGA", "OTI"));

        mockMvc.perform(get("/api/correos/dependencias"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[1]", is("OTI")));
    }

    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "READ_correos"})
    void subdependencias_withReadAuthority_returnsList() throws Exception {
        when(service.getSubdependencias("OTI")).thenReturn(List.of("Soporte"));

        mockMvc.perform(get("/api/correos/subdependencias").param("dependencia", "OTI"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0]", is("Soporte")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void create_isNotExposed() throws Exception {
        mockMvc.perform(post("/api/correos")
                        .contentType("application/json")
                        .content("{}"))
                .andExpect(status().isMethodNotAllowed());
    }

    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "READ_correos"})
    void dashboardCompleto_withReadAuthority_returnsOk() throws Exception {
        when(service.getDashboardCompleto()).thenReturn(new CorreoDashboardCompleto(
                new CorreoKpisDto(1200, 1069, 131, 1069, 131, 500, 700),
                List.of(), List.of(), 800, 1200, 66.6, List.of(), 0));

        mockMvc.perform(get("/api/correos/dashboard/completo"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalCuentas", is(1200)));
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void dashboardCompleto_withoutReadAuthority_returnsForbidden() throws Exception {
        mockMvc.perform(get("/api/correos/dashboard/completo"))
                .andExpect(status().isForbidden());
    }

    private VwGwDashboard dashboard(String email, String nombreCompleto) {
        VwGwDashboard value = new VwGwDashboard();
        ReflectionTestUtils.setField(value, "email", email);
        ReflectionTestUtils.setField(value, "nombreCompleto", nombreCompleto);
        return value;
    }
}
