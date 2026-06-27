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

    private Impresora impresoraConDriver(Long id, String path) {
        Impresora imp = new Impresora();
        imp.setId(id);
        imp.setMarca("HP");
        imp.setModelo("M404dn");
        imp.setEstado("Activa");
        imp.setDriverNombre("driver-hp.zip");
        imp.setDriverVersion("1.2");
        imp.setDriverSo("Windows 10");
        imp.setDriverArchivoPath(path);
        return imp;
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void uploadDriver_withAdminRole_storesFileAndReturnsImpresora() throws Exception {
        when(service.updateDriver(eq(1L), any(), any(), any(), any()))
                .thenReturn(impresoraConDriver(1L, "1/driver-hp.zip"));

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
    @WithMockUser(authorities = {"ROLE_SOPORTE", "READ_impresoras"})
    void downloadDriver_withReadAuthority_returnsFileBytes() throws Exception {
        Path stored = fileStorageService.load(
                fileStorageService.store(2L, new MockMultipartFile("file", "driver-canon.zip", "application/zip", "contenido".getBytes())));

        when(service.findById(2L)).thenReturn(impresoraConDriver(2L, "2/driver-canon.zip"));

        mockMvc.perform(get("/api/impresoras/2/driver"))
                .andExpect(status().isOk())
                .andExpect(content().bytes(Files.readAllBytes(stored)));
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void downloadDriver_withoutReadAuthority_returnsForbidden() throws Exception {
        mockMvc.perform(get("/api/impresoras/2/driver"))
                .andExpect(status().isForbidden());
    }
}
