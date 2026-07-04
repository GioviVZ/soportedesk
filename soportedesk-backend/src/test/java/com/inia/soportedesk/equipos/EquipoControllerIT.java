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
}
