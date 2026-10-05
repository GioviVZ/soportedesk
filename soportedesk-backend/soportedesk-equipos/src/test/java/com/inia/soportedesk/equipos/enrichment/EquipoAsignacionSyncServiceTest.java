package com.inia.soportedesk.equipos.enrichment;

import com.inia.soportedesk.catalogo.Dependencia;
import com.inia.soportedesk.catalogo.Sede;
import com.inia.soportedesk.catalogo.Subdependencia;
import com.inia.soportedesk.glpi.VwInvComputerFullRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EquipoAsignacionSyncServiceTest {

    @Mock private JdbcTemplate jdbc;
    @Mock private VwInvComputerFullRepository glpiRepository;
    @InjectMocks private EquipoAsignacionSyncService service;

    @Test
    void sync_updatesWithoutPersonaIdAndWithExpectedArguments() {
        EquipoEnrichment enrichment = enrichment();
        when(jdbc.update(anyString(), any(Object[].class))).thenReturn(1);

        service.sync(enrichment);

        ArgumentCaptor<String> sqlCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<Object[]> argsCaptor = ArgumentCaptor.forClass(Object[].class);
        verify(jdbc).update(sqlCaptor.capture(), argsCaptor.capture());
        assertThat(sqlCaptor.getValue()).doesNotContain("persona_id");
        assertThat(argsCaptor.getValue()).containsExactly(
                1L, 2L, 3L, "PAT-007", "INT-007", "PENDIENTE", 7L);
    }

    @Test
    void sync_whenUpdateReturnsZero_insertsWithoutPersonaIdAndAlignsPlaceholders() {
        EquipoEnrichment enrichment = enrichment();
        when(jdbc.update(anyString(), any(Object[].class))).thenReturn(0, 1);

        service.sync(enrichment);

        ArgumentCaptor<String> sqlCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<Object[]> argsCaptor = ArgumentCaptor.forClass(Object[].class);
        verify(jdbc, org.mockito.Mockito.times(2))
                .update(sqlCaptor.capture(), argsCaptor.capture());

        String insertSql = sqlCaptor.getAllValues().get(1);
        Object[] insertArgs = argsCaptor.getAllValues().get(1);
        assertThat(insertSql).contains("INSERT INTO").doesNotContain("persona_id");
        assertThat(insertSql.chars().filter(character -> character == '?').count())
                .isEqualTo(insertArgs.length);
    }

    @Test
    void sincronizarCatalogoCompleto_insertsMissingGlpiIdWithoutPersonaId() {
        when(glpiRepository.findActiveComputerIds()).thenReturn(List.of(7L));
        when(jdbc.query(anyString(), org.mockito.ArgumentMatchers.<RowMapper<Long>>any()))
                .thenReturn(List.of());

        service.sincronizarCatalogoCompleto();

        ArgumentCaptor<String> sqlCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<Object[]> argsCaptor = ArgumentCaptor.forClass(Object[].class);
        verify(jdbc).update(sqlCaptor.capture(), argsCaptor.capture());
        assertThat(sqlCaptor.getValue()).contains("INSERT INTO").doesNotContain("persona_id");
        assertThat(argsCaptor.getValue()).containsExactly(7L);
    }

    private EquipoEnrichment enrichment() {
        Sede sede = new Sede();
        sede.setId(1L);
        Dependencia dependencia = new Dependencia();
        dependencia.setId(2L);
        Subdependencia subdependencia = new Subdependencia();
        subdependencia.setId(3L);

        EquipoEnrichment enrichment = new EquipoEnrichment();
        enrichment.setComputerId(7L);
        enrichment.setSede(sede);
        enrichment.setDependencia(dependencia);
        enrichment.setSubdependencia(subdependencia);
        enrichment.setCodigoPatrimonial("PAT-007");
        enrichment.setCodigoInternoOverride("INT-007");
        enrichment.setEstadoDepuracion(null);
        return enrichment;
    }
}
