package com.inia.soportedesk.herramientas;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.hamcrest.Matchers.is;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class HerramientasControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private HerramientasService service;

    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "READ_herramientas"})
    void ping_withReadAuthority_allowsUser() throws Exception {
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
    @WithMockUser(authorities = {"ROLE_SOPORTE", "READ_herramientas"})
    void ping_rejectsUnsafeHost() throws Exception {
        mockMvc.perform(post("/api/herramientas/ping")
                        .contentType("application/json")
                        .content("{\"host\":\"127.0.0.1 & whoami\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void ping_withoutReadAuthority_returnsForbidden() throws Exception {
        PingRequest request = new PingRequest();
        request.setHost("127.0.0.1");

        mockMvc.perform(post("/api/herramientas/ping")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "READ_herramientas"})
    void speedTestDownload_withReadAuthority_returnsRequestedPayload() throws Exception {
        mockMvc.perform(get("/api/herramientas/speed-test/download")
                        .param("bytes", "4096"))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(header().string("X-Speed-Test-Bytes", "4096"))
                .andExpect(header().longValue("Content-Length", 4096));
    }

    @Test
    @WithMockUser(authorities = {"ROLE_SOPORTE", "READ_herramientas"})
    void speedTestUpload_returnsReceivedByteCount() throws Exception {
        mockMvc.perform(post("/api/herramientas/speed-test/upload")
                        .contentType("application/octet-stream")
                        .content(new byte[2048]))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bytesReceived", is(2048)));
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void speedTest_withoutReadAuthority_returnsForbidden() throws Exception {
        mockMvc.perform(get("/api/herramientas/speed-test/ping"))
                .andExpect(status().isForbidden());
    }
}
