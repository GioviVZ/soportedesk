package com.inia.soportedesk.equipos.evidencia;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class EquipoEvidenciaControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private EquipoEvidenciaService service;

    private EquipoEvidenciaDto dto(Long id, String nombre) {
        EquipoEvidenciaDto d = new EquipoEvidenciaDto();
        d.setId(id);
        d.setNombreOriginal(nombre);
        d.setSubidoPor("admin");
        d.setFechaSubida(LocalDateTime.now());
        return d;
    }

    @Test
    @WithMockUser(authorities = "READ_equipos")
    void listar_withReadPermission_returnsList() throws Exception {
        when(service.listar(291L)).thenReturn(List.of(dto(1L, "foto.jpg")));

        mockMvc.perform(get("/api/equipos/291/evidencias"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].nombreOriginal", is("foto.jpg")));
    }

    @Test
    @WithMockUser(username = "tecnico1", authorities = "WRITE_equipos")
    void subir_withWritePermission_storesAndReturnsCreated() throws Exception {
        when(service.subir(eq(291L), any(), eq("Etiqueta"), eq("tecnico1"))).thenReturn(dto(1L, "foto.jpg"));

        MockMultipartFile file = new MockMultipartFile("file", "foto.jpg", "image/jpeg", "contenido".getBytes());

        mockMvc.perform(multipart("/api/equipos/291/evidencias")
                        .file(file)
                        .param("descripcion", "Etiqueta"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nombreOriginal", is("foto.jpg")));
    }

    @Test
    @WithMockUser(authorities = "READ_equipos")
    void subir_withoutWritePermission_returnsForbidden() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "foto.jpg", "image/jpeg", "contenido".getBytes());

        mockMvc.perform(multipart("/api/equipos/291/evidencias").file(file))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "WRITE_equipos")
    void eliminar_withWritePermission_returnsNoContent() throws Exception {
        mockMvc.perform(delete("/api/equipos/291/evidencias/1"))
                .andExpect(status().isNoContent());

        verify(service).eliminar(291L, 1L);
    }

    @Test
    @WithMockUser(authorities = "READ_equipos")
    void eliminar_withoutWritePermission_returnsForbidden() throws Exception {
        mockMvc.perform(delete("/api/equipos/291/evidencias/1"))
                .andExpect(status().isForbidden());
    }
}
