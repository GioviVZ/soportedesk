package com.inia.soportedesk.dashboard;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.is;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class DashboardControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DashboardService service;

    @Test
    @WithMockUser(roles = "SOPORTE")
    void getCounts_allowsAuthenticatedUser() throws Exception {
        when(service.getCounts()).thenReturn(new DashboardCounts(5, 12, 20, 3, 4, 7, 15));

        mockMvc.perform(get("/api/dashboard/counts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.licencias", is(5)))
                .andExpect(jsonPath("$.usuariosRed", is(20)));
    }

    @Test
    void getCounts_withoutAuth_returns401() throws Exception {
        mockMvc.perform(get("/api/dashboard/counts"))
                .andExpect(status().isUnauthorized());
    }
}
