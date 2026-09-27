package com.inia.soportedesk.correos;

import com.inia.soportedesk.gestiontiinia.VwGwDashboard;
import com.inia.soportedesk.gestiontiinia.VwGwDashboardRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CorreoServiceTest {

    @Mock
    private VwGwDashboardRepository repository;

    @InjectMocks
    private CorreoService service;

    @Test
    void findAll_normalizesBlankFiltersAndDelegatesToRepository() {
        VwGwDashboard correo = dashboard("a@inia.gob.pe", "Activo", "Sede Central", 1);
        when(repository.findFiltered("ana", null, null, null, "Activo", null, null)).thenReturn(List.of(correo));

        List<VwGwDashboard> result = service.findAll("ana", " ", "", " ", "Activo", "", false);

        assertThat(result).containsExactly(correo);
        verify(repository).findFiltered("ana", null, null, null, "Activo", null, null);
    }

    @Test
    void getKpis_calculatesCountsFromDashboardRows() {
        VwGwDashboard activoCentral = dashboard("a@inia.gob.pe", "Activo", "Sede Central", 10);
        VwGwDashboard suspendidoEea = dashboard("b@inia.gob.pe", "Suspendido", "EEAs", 20);
        ReflectionTestUtils.setField(activoCentral, "licenciasTotales", 1200);
        ReflectionTestUtils.setField(activoCentral, "licenciasAsignadas", 1100);
        ReflectionTestUtils.setField(activoCentral, "licenciasDisponibles", 100);
        when(repository.findAll()).thenReturn(List.of(activoCentral, suspendidoEea));

        CorreoKpisDto result = service.getKpis();

        assertThat(result.licenciasTotales()).isEqualTo(1200);
        assertThat(result.licenciasAsignadas()).isEqualTo(1100);
        assertThat(result.licenciasDisponibles()).isEqualTo(100);
        assertThat(result.activasCount()).isEqualTo(1);
        assertThat(result.suspendidasCount()).isEqualTo(1);
        assertThat(result.sedeCentralCount()).isEqualTo(10);
        assertThat(result.eeasCount()).isEqualTo(20);
    }

    @Test
    void getKpis_withoutRows_returnsZeroes() {
        when(repository.findAll()).thenReturn(List.of());

        CorreoKpisDto result = service.getKpis();

        assertThat(result).isEqualTo(new CorreoKpisDto(0, 0, 0, 0, 0, 0, 0));
    }

    @Test
    void getSedes_returnsDistinctSedes() {
        when(repository.findDistinctSedes()).thenReturn(List.of("Lima", "Cusco"));

        assertThat(service.getSedes()).containsExactly("Lima", "Cusco");
    }

    @Test
    void getDependencias_returnsDistinctDependencias() {
        when(repository.findDistinctDependencias()).thenReturn(List.of("DGA", "OTI"));

        assertThat(service.getDependencias()).containsExactly("DGA", "OTI");
    }

    @Test
    void getSubdependencias_normalizesDependencia() {
        when(repository.findDistinctSubdependencias("OTI")).thenReturn(List.of("Soporte"));

        assertThat(service.getSubdependencias("OTI")).containsExactly("Soporte");
    }

    @Test
    void getDashboardCompleto_aggregatesDistribution2FAAndInactivity() {
        VwGwDashboard activoOti = dashboard("a@inia.gob.pe", "Activo", "Sede Central", 10);
        ReflectionTestUtils.setField(activoOti, "oficinaPadre", "OTI");
        ReflectionTestUtils.setField(activoOti, "oficina", "Soporte");
        ReflectionTestUtils.setField(activoOti, "verificacion2Pasos", "Enrolado");
        ReflectionTestUtils.setField(activoOti, "ultimoInicioSesion", java.time.LocalDateTime.now());

        VwGwDashboard inactivoDga = dashboard("b@inia.gob.pe", "Activo", "EEAs", 20);
        ReflectionTestUtils.setField(inactivoDga, "oficinaPadre", "DGA");
        ReflectionTestUtils.setField(inactivoDga, "oficina", "Logística");
        ReflectionTestUtils.setField(inactivoDga, "verificacion2Pasos", "No Enrolado");
        ReflectionTestUtils.setField(inactivoDga, "nombreCompleto", "Beto Gomez");
        ReflectionTestUtils.setField(inactivoDga, "ultimoInicioSesion", java.time.LocalDateTime.now().minusDays(90));

        VwGwDashboard sinAcceso = dashboard("c@inia.gob.pe", "Activo", "EEAs", 20);
        ReflectionTestUtils.setField(sinAcceso, "oficinaPadre", "DGA");
        ReflectionTestUtils.setField(sinAcceso, "oficina", "Logística");
        ReflectionTestUtils.setField(sinAcceso, "verificacion2Pasos", "No Enrolado");
        ReflectionTestUtils.setField(sinAcceso, "nombreCompleto", "Cami Ruiz");
        ReflectionTestUtils.setField(sinAcceso, "ultimoInicioSesion", null);

        when(repository.findAll()).thenReturn(List.of(activoOti, inactivoDga, sinAcceso));

        CorreoDashboardCompleto result = service.getDashboardCompleto();

        assertThat(result.distribucionPorDependencia())
                .extracting(CorreoDependenciaCount::dependencia, CorreoDependenciaCount::total)
                .containsExactlyInAnyOrder(
                        org.assertj.core.groups.Tuple.tuple("OTI", 1L),
                        org.assertj.core.groups.Tuple.tuple("DGA", 2L)
                );
        assertThat(result.distribucionPorSubdependencia())
                .extracting(CorreoSubdependenciaCount::subdependencia, CorreoSubdependenciaCount::total)
                .containsExactly(
                        org.assertj.core.groups.Tuple.tuple("Logística", 2L),
                        org.assertj.core.groups.Tuple.tuple("Soporte", 1L)
                );

        assertThat(result.totalCuentas()).isEqualTo(3);
        assertThat(result.cuentasCon2FA()).isEqualTo(1);
        assertThat(result.porcentaje2FA()).isCloseTo(33.33, org.assertj.core.data.Offset.offset(0.1));

        assertThat(result.totalSinUso()).isEqualTo(2);
        assertThat(result.sinUso()).extracting(CorreoInactividadAlerta::email).containsExactly("c@inia.gob.pe", "b@inia.gob.pe");
    }

    @Test
    void getDashboardCompleto_onException_returnsEmptyDashboard() {
        when(repository.findAll()).thenThrow(new RuntimeException("db down"));

        CorreoDashboardCompleto result = service.getDashboardCompleto();

        assertThat(result.totalCuentas()).isEqualTo(0);
        assertThat(result.distribucionPorDependencia()).isEmpty();
        assertThat(result.distribucionPorSubdependencia()).isEmpty();
        assertThat(result.sinUso()).isEmpty();
    }

    private VwGwDashboard dashboard(String email, String estado, String categoria, int totalUsuariosCategoria) {
        VwGwDashboard value = new VwGwDashboard();
        ReflectionTestUtils.setField(value, "email", email);
        ReflectionTestUtils.setField(value, "estado", estado);
        ReflectionTestUtils.setField(value, "categoria", categoria);
        ReflectionTestUtils.setField(value, "totalUsuariosCategoria", totalUsuariosCategoria);
        return value;
    }
}
