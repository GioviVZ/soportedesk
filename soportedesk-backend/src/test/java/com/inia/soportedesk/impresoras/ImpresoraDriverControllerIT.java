package com.inia.soportedesk.impresoras;

import com.inia.soportedesk.common.FileStorageService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class ImpresoraDriverControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ImpresoraService service;

    @Autowired
    private FileStorageService fileStorageService;

    @Test
    @WithMockUser(roles = "ADMIN")
    void uploadDriver_withAdminRole_storesFileAndReturnsImpresora() throws Exception {
        Impresora impresora = new Impresora(1L, "HP LaserJet 4ta planta", "HP", "M404dn", "10.0.0.50", "4", "Administración", "Activa", 80, 60, 60, 60, 90, 70, 85, "driver-hp.zip", "1.2", "Windows 10", "1/driver-hp.zip");
        when(service.updateDriver(eq(1L), any(), any(), any(), any())).thenReturn(impresora);

        MockMultipartFile file = new MockMultipartFile("file", "driver-hp.zip", "application/zip", "contenido".getBytes());

        mockMvc.perform(multipart("/api/impresoras/1/driver")
                        .file(file)
                        .param("version", "1.2")
                        .param("so", "Windows 10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.driverArchivoPath", is("1/driver-hp.zip")));
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void uploadDriver_withSoporteRole_returnsForbidden() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "driver-hp.zip", "application/zip", "contenido".getBytes());

        mockMvc.perform(multipart("/api/impresoras/1/driver")
                        .file(file)
                        .param("version", "1.2")
                        .param("so", "Windows 10"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void downloadDriver_returnsFileBytes() throws Exception {
        Path stored = fileStorageService.load(fileStorageService.store(2L, new MockMultipartFile("file", "driver-canon.zip", "application/zip", "contenido".getBytes())));

        Impresora impresora = new Impresora(2L, "Canon 2da planta", "Canon", "LBP226dw", "10.0.0.60", "2", "Mesa de Partes", "Activa", 70, 50, 50, 50, 80, 60, 75, "driver-canon.zip", "2.0", "Windows 11", "2/driver-canon.zip");
        when(service.findById(2L)).thenReturn(impresora);

        mockMvc.perform(get("/api/impresoras/2/driver"))
                .andExpect(status().isOk())
                .andExpect(content().bytes(Files.readAllBytes(stored)));
    }
}
