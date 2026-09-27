package com.inia.soportedesk.activedirectory;

import com.inia.soportedesk.activedirectory.dto.CorreoDisponible;
import com.inia.soportedesk.gestiontiinia.VwGwDashboard;
import com.inia.soportedesk.gestiontiinia.VwGwDashboardRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CorreoVinculacionServiceTest {

    @Mock
    private VwGwDashboardRepository correoRepository;

    @Mock
    private AdUsuarioCacheRepository adUsuarioCacheRepository;

    @InjectMocks
    private CorreoVinculacionService service;

    @Test
    void listarDisponibles_excluyeCorreosYaVinculados() {
        VwGwDashboard disponible = correo("nuevo@inia.gob.pe", "Nuevo Usuario", "Activo");
        VwGwDashboard vinculado = mock(VwGwDashboard.class);
        when(vinculado.getEmail()).thenReturn("usado@inia.gob.pe");
        when(adUsuarioCacheRepository.findAllMailAddresses()).thenReturn(List.of("usado@inia.gob.pe"));
        when(correoRepository.findAll()).thenReturn(List.of(vinculado, disponible));

        List<CorreoDisponible> result = service.listarDisponibles(null);

        assertThat(result).containsExactly(new CorreoDisponible("nuevo@inia.gob.pe", "Nuevo Usuario", "Activo"));
    }

    @Test
    void validarParaNuevoUsuario_rechazaCorreoFueraDelModuloCorreos() {
        when(correoRepository.existsByEmailIgnoreCase("externo@example.com")).thenReturn(false);

        assertThatThrownBy(() -> service.validarParaNuevoUsuario("externo@example.com"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("modulo de Correos");
    }

    @Test
    void validarParaNuevoUsuario_rechazaCorreoYaVinculado() {
        when(correoRepository.existsByEmailIgnoreCase("usado@inia.gob.pe")).thenReturn(true);
        when(adUsuarioCacheRepository.existsByMailIgnoreCase("usado@inia.gob.pe")).thenReturn(true);

        assertThatThrownBy(() -> service.validarParaNuevoUsuario("usado@inia.gob.pe"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("ya esta vinculado");
    }

    @Test
    void validarParaNuevoUsuario_permiteCorreoVacio() {
        service.validarParaNuevoUsuario("  ");
    }

    @Test
    void listarDisponiblesParaUsuario_incluyeSuCorreoActualYExcluyeElAjeno() {
        VwGwDashboard propio = correo("propio@inia.gob.pe", "Usuario Actual", "Activo");
        VwGwDashboard ajeno = mock(VwGwDashboard.class);
        when(ajeno.getEmail()).thenReturn("ajeno@inia.gob.pe");
        AdUsuarioCache actual = mock(AdUsuarioCache.class);
        when(actual.getMail()).thenReturn("propio@inia.gob.pe");
        when(adUsuarioCacheRepository.findAllMailAddresses())
                .thenReturn(List.of("propio@inia.gob.pe", "ajeno@inia.gob.pe"));
        when(adUsuarioCacheRepository.findFirstBySamAccountNameIgnoreCase("jperez"))
                .thenReturn(java.util.Optional.of(actual));
        when(correoRepository.findAll()).thenReturn(List.of(ajeno, propio));

        assertThat(service.listarDisponibles("jperez"))
                .containsExactly(new CorreoDisponible("propio@inia.gob.pe", "Usuario Actual", "Activo"));
    }

    @Test
    void validarParaActualizacion_permiteQuitarCorreo() {
        service.validarParaActualizacion("jperez", null);
    }

    @Test
    void validarParaActualizacion_permiteConservarCorreoPropio() {
        AdUsuarioCache actual = mock(AdUsuarioCache.class);
        when(actual.getMail()).thenReturn("propio@inia.gob.pe");
        when(adUsuarioCacheRepository.findFirstBySamAccountNameIgnoreCase("jperez"))
                .thenReturn(java.util.Optional.of(actual));

        service.validarParaActualizacion("jperez", "propio@inia.gob.pe");
    }

    @Test
    void validarParaActualizacion_rechazaCorreoDeOtroUsuario() {
        AdUsuarioCache propietario = mock(AdUsuarioCache.class);
        when(propietario.getSamAccountName()).thenReturn("mlopez");
        when(adUsuarioCacheRepository.findFirstBySamAccountNameIgnoreCase("jperez"))
                .thenReturn(java.util.Optional.empty());
        when(correoRepository.existsByEmailIgnoreCase("ajeno@inia.gob.pe")).thenReturn(true);
        when(adUsuarioCacheRepository.findFirstByMailIgnoreCase("ajeno@inia.gob.pe"))
                .thenReturn(java.util.Optional.of(propietario));

        assertThatThrownBy(() -> service.validarParaActualizacion("jperez", "ajeno@inia.gob.pe"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("otro usuario");
    }

    private VwGwDashboard correo(String email, String nombre, String estado) {
        VwGwDashboard correo = mock(VwGwDashboard.class);
        when(correo.getEmail()).thenReturn(email);
        when(correo.getNombreCompleto()).thenReturn(nombre);
        when(correo.getEstado()).thenReturn(estado);
        return correo;
    }
}
