package com.inia.soportedesk.equipos;

import com.inia.soportedesk.glpi.VwInvComputerFull;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.hamcrest.Matchers.is;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class EquipoControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private EquipoService service;

    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "READ_equipos"})
    void findAll_withReadAuthority_allowsUser() throws Exception {
        VwInvComputerFull equipo = new VwInvComputerFull();
        equipo.setComputerID(1L);
        equipo.setNombreEquipo("PC-GLPI-01");
        when(service.findAll(null, null, null, null, null, null)).thenReturn(List.of(equipo));

        mockMvc.perform(get("/api/equipos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].nombreEquipo", is("PC-GLPI-01")));
    }

    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "READ_equipos"})
    void getKpis_withReadAuthority_allowsUser() throws Exception {
        when(service.getKpis()).thenReturn(new EquipoKpisDto(3, 1, 1, 1, 1, 2));

        mockMvc.perform(get("/api/equipos/kpis"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalActivos", is(3)));
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void findAll_withoutReadAuthority_returnsForbidden() throws Exception {
        mockMvc.perform(get("/api/equipos"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "WRITE_equipos"})
    void dashboardCompleto_withWriteAuthority_returnsOk() throws Exception {
        when(service.getDashboardCompleto()).thenReturn(new EquipoDashboardCompleto(
                10, 5, 3, 2, 6, 4, 1, 2, List.of(), List.of(), new EquipoSaludResumen(0, 0, 10, 0, 0, 0)));

        mockMvc.perform(get("/api/equipos/dashboard/completo"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total", is(10)));
    }

    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "READ_equipos"})
    void dashboardCompleto_withOnlyReadAuthority_returnsForbidden() throws Exception {
        mockMvc.perform(get("/api/equipos/dashboard/completo"))
                .andExpect(status().isForbidden());
    }
}
