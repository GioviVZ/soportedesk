package com.inia.soportedesk.impresoras.intervencion;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.startsWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ImpresoraIntervencionControllerIT {

    @TempDir
    Path tempDir;

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ImpresoraIntervencionService service;

    private ImpresoraIntervencionDto dto(Long id, String observacion) {
        ImpresoraIntervencionDto d = new ImpresoraIntervencionDto();
        d.setId(id);
        d.setFecha(LocalDate.parse("2026-07-17"));
        d.setObservacion(observacion);
        d.setRegistradoPor("admin");
        d.setFechaRegistro(LocalDateTime.now());
        d.setAdjuntos(List.of());
        return d;
    }

    @Test
    @WithMockUser(authorities = "READ_impresoras")
    void listar_withReadPermission_returnsList() throws Exception {
        when(service.listar(7L)).thenReturn(List.of(dto(1L, "Cambio de fusor")));

        mockMvc.perform(get("/api/impresoras/7/intervenciones"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].observacion", is("Cambio de fusor")));
    }

    @Test
    @WithMockUser(username = "tecnico1", authorities = "WRITE_impresoras")
    void crear_withWritePermission_returnsCreated() throws Exception {
        when(service.crear(eq(7L), any(), eq("tecnico1"))).thenReturn(dto(1L, "Cambio de fusor"));

        mockMvc.perform(post("/api/impresoras/7/intervenciones")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fecha\":\"2026-07-17\",\"observacion\":\"Cambio de fusor\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.observacion", is("Cambio de fusor")));
    }

    @Test
    @WithMockUser(authorities = "READ_impresoras")
    void crear_withoutWritePermission_returnsForbidden() throws Exception {
        mockMvc.perform(post("/api/impresoras/7/intervenciones")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fecha\":\"2026-07-17\",\"observacion\":\"obs\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "WRITE_impresoras")
    void actualizar_withWritePermission_returnsUpdatedDto() throws Exception {
        when(service.actualizar(eq(7L), eq(1L), any())).thenReturn(dto(1L, "Corregida"));

        mockMvc.perform(put("/api/impresoras/7/intervenciones/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fecha\":\"2026-07-17\",\"observacion\":\"Corregida\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.observacion", is("Corregida")));
    }

    @Test
    @WithMockUser(authorities = "WRITE_impresoras")
    void eliminar_withWritePermission_returnsNoContent() throws Exception {
        mockMvc.perform(delete("/api/impresoras/7/intervenciones/1"))
                .andExpect(status().isNoContent());

        verify(service).eliminar(7L, 1L);
    }

    @Test
    @WithMockUser(username = "tecnico1", authorities = "WRITE_impresoras")
    void subirAdjuntos_withWritePermission_returnsCreatedList() throws Exception {
        ImpresoraIntervencionAdjuntoDto adjDto = new ImpresoraIntervencionAdjuntoDto();
        adjDto.setId(10L);
        adjDto.setNombreOriginal("foto.jpg");
        adjDto.setMimeType("image/jpeg");
        adjDto.setSubidoPor("tecnico1");
        adjDto.setFechaSubida(LocalDateTime.now());
        when(service.subirAdjuntos(eq(7L), eq(1L), any(), eq("tecnico1"))).thenReturn(List.of(adjDto));

        MockMultipartFile file = new MockMultipartFile("files", "foto.jpg", "image/jpeg", "contenido".getBytes());

        mockMvc.perform(multipart("/api/impresoras/7/intervenciones/1/adjuntos").file(file))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$[0].nombreOriginal", is("foto.jpg")));
    }

    @Test
    @WithMockUser(authorities = "WRITE_impresoras")
    void eliminarAdjunto_withWritePermission_returnsNoContent() throws Exception {
        mockMvc.perform(delete("/api/impresoras/7/intervenciones/1/adjuntos/10"))
                .andExpect(status().isNoContent());

        verify(service).eliminarAdjunto(7L, 1L, 10L);
    }

    @Test
    @WithMockUser(authorities = "READ_impresoras")
    void eliminarAdjunto_withoutWritePermission_returnsForbidden() throws Exception {
        mockMvc.perform(delete("/api/impresoras/7/intervenciones/1/adjuntos/10"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "READ_impresoras")
    void descargar_imagenAdjunto_returnsInlineDisposition() throws Exception {
        Path archivo = tempDir.resolve("foto.jpg");
        Files.writeString(archivo, "contenido-imagen");
        ArchivoIntervencionAdjunto adjunto = new ArchivoIntervencionAdjunto(archivo, "image/jpeg", "foto.jpg");
        when(service.cargarArchivo(eq(7L), eq(1L), eq(10L))).thenReturn(adjunto);

        mockMvc.perform(get("/api/impresoras/7/intervenciones/1/adjuntos/10/archivo"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", startsWith("inline")));
    }

    @Test
    @WithMockUser(authorities = "READ_impresoras")
    void descargar_documentoOffice_returnsAttachmentDisposition() throws Exception {
        Path archivo = tempDir.resolve("informe.docx");
        Files.writeString(archivo, "contenido-documento");
        ArchivoIntervencionAdjunto adjunto = new ArchivoIntervencionAdjunto(archivo,
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "informe.docx");
        when(service.cargarArchivo(eq(7L), eq(1L), eq(11L))).thenReturn(adjunto);

        mockMvc.perform(get("/api/impresoras/7/intervenciones/1/adjuntos/11/archivo"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", startsWith("attachment")));
    }
}
