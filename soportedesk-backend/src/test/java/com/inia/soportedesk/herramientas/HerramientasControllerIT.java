package com.inia.soportedesk.herramientas;

import com.fasterxml.jackson.databind.ObjectMapper;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class HerramientasControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private HerramientasService service;

    @Test
    @WithMockUser(roles = "SOPORTE")
    void ping_allowsAuthenticatedUser() throws Exception {
        PingRequest request = new PingRequest();
        request.setHost("127.0.0.1");
        when(service.ping("127.0.0.1")).thenReturn(PingResult.builder()
                .host("127.0.0.1")
                .reachable(true)
                .status("Responde")
                .output(List.of("ok"))
                .build());

        mockMvc.perform(post("/api/herramientas/ping")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.host", is("127.0.0.1")))
                .andExpect(jsonPath("$.reachable", is(true)));
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void ping_rejectsUnsafeHost() throws Exception {
        mockMvc.perform(post("/api/herramientas/ping")
                        .contentType("application/json")
                        .content("{\"host\":\"127.0.0.1 & whoami\"}"))
                .andExpect(status().isBadRequest());
    }
}
