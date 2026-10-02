package com.inia.soportedesk.equiposmoviles;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.List;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ActaMovilControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private ActaMovilService service;

    @TempDir
    Path tempDir;

    @Test
    @WithMockUser(roles = "SOPORTE")
    void findAll_withoutAuthority_returnsForbidden() throws Exception {
        mockMvc.perform(get("/api/equipos-moviles/actas"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "READ_equipos-moviles")
    void findAll_withReadAuthority_returnsOk() throws Exception {
        when(service.findAll(null, null, null, null)).thenReturn(List.of(sampleActa()));

        mockMvc.perform(get("/api/equipos-moviles/actas"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].numeroActa", is("AM-001")));
    }

    @Test
    @WithMockUser(authorities = "WRITE_equipos-moviles")
    void create_withWriteAuthority_returnsCreated() throws Exception {
        when(service.create(any(ActaMovilRequest.class))).thenReturn(sampleActa());

        mockMvc.perform(post("/api/equipos-moviles/actas")
                        .with(csrf())
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.tipo", is("Entrega")));
    }

    @Test
    @WithMockUser(authorities = "WRITE_equipos-moviles")
    void create_withInvalidBody_returnsBadRequest() throws Exception {
        ActaMovilRequest request = sampleRequest();
        request.setEquipoMovilIds(List.of());

        mockMvc.perform(post("/api/equipos-moviles/actas")
                        .with(csrf())
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(authorities = "WRITE_equipos-moviles")
    void uploadFile_returnsUpdatedActa() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "acta.pdf", "application/pdf", "contenido".getBytes());
        ActaMovil acta = sampleActa();
        acta.setArchivoNombre("acta.pdf");
        acta.setArchivoRuta("1/file.pdf");
        when(service.uploadFile(eq(1L), any())).thenReturn(acta);

        mockMvc.perform(multipart("/api/equipos-moviles/actas/1/archivo")
                        .file(file)
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tieneArchivo", is(true)));
    }

    @Test
    @WithMockUser(authorities = "READ_equipos-moviles")
    void downloadFile_returnsBytesAndAttachmentDisposition() throws Exception {
        byte[] bytes = "contenido del acta".getBytes();
        Path file = tempDir.resolve("acta.pdf");
        Files.write(file, bytes);
        when(service.loadFile(1L)).thenReturn(new ArchivoActaMovil(file, "application/pdf", "acta.pdf"));

        mockMvc.perform(get("/api/equipos-moviles/actas/1/archivo"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andExpect(content().bytes(bytes))
                .andExpect(header().string("Content-Disposition", containsString("attachment")))
                .andExpect(header().string("Content-Disposition", containsString("acta.pdf")));
    }

    private ActaMovilRequest sampleRequest() {
        ActaMovilRequest request = new ActaMovilRequest();
        request.setNumeroActa("AM-001");
        request.setTipo("Entrega");
        request.setFecha(LocalDate.of(2026, 2, 1));
        request.setPersonaNombre("María Pérez");
        request.setEquipoMovilIds(List.of(1L));
        return request;
    }

    private ActaMovil sampleActa() {
        ActaMovil acta = new ActaMovil();
        acta.setId(1L);
        acta.setNumeroActa("AM-001");
        acta.setTipo("Entrega");
        acta.setFecha(LocalDate.of(2026, 2, 1));
        acta.setPersonaNombre("María Pérez");
        return acta;
    }
}
