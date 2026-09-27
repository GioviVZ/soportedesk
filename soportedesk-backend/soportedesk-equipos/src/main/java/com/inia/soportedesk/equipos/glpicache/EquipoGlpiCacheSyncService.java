package com.inia.soportedesk.equipos.glpicache;

import com.inia.soportedesk.equipos.glpicache.dto.GlpiSyncResponse;
import com.inia.soportedesk.glpi.GlpiMonitorRepository;
import com.inia.soportedesk.glpi.GlpiMonitorRow;
import com.inia.soportedesk.glpi.GlpiRemoteManagement;
import com.inia.soportedesk.glpi.GlpiRemoteManagementRepository;
import com.inia.soportedesk.glpi.GlpiTeclado;
import com.inia.soportedesk.glpi.GlpiTecladoRepository;
import com.inia.soportedesk.glpi.VwInvComputerFull;
import com.inia.soportedesk.glpi.VwInvComputerFullRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EquipoGlpiCacheSyncService {

    private final VwInvComputerFullRepository vwRepository;
    private final GlpiTecladoRepository tecladoRepository;
    private final GlpiMonitorRepository monitorRepository;
    private final GlpiRemoteManagementRepository remoteManagementRepository;
    private final EquipoGlpiCacheRepository cacheRepository;
    private final EquipoGlpiCacheWriter cacheWriter;
    private final GlpiSyncJobStatus jobStatus;

    public GlpiSyncResponse resincronizarTodo() {
        List<VwInvComputerFull> base = vwRepository.findAll();
        jobStatus.setTotal(base.size());
        applyRemoteIds(base);
        applyTeclados(base);
        applyMonitores(base);

        LocalDateTime syncedAt = LocalDateTime.now();
        List<EquipoGlpiCache> rows = base.stream()
                .map(item -> {
                    EquipoGlpiCache row = mapToCache(item, syncedAt);
                    jobStatus.incrementarProcesados(1);
                    return row;
                })
                .toList();
        int eliminados = upsertBatch(syncedAt, rows);
        return new GlpiSyncResponse(rows.size(), eliminados, syncedAt);
    }

    public Optional<EquipoGlpiCache> resincronizarUno(Long computerId) {
        Optional<VwInvComputerFull> baseOpt = vwRepository.findById(computerId)
                .filter(e -> e.getEliminado() == null || e.getEliminado() == 0);
        if (baseOpt.isEmpty()) {
            if (cacheRepository.existsById(computerId)) {
                cacheWriter.deleteById(computerId);
            }
            return Optional.empty();
        }

        VwInvComputerFull base = baseOpt.get();
        List<VwInvComputerFull> singleton = List.of(base);
        applyRemoteIds(singleton);
        applyTeclados(singleton);
        applyMonitores(singleton);

        EquipoGlpiCache row = mapToCache(base, LocalDateTime.now());
        cacheWriter.save(row);
        return Optional.of(row);
    }

    @Transactional
    public int upsertBatch(LocalDateTime syncedAt, List<EquipoGlpiCache> rows) {
        return cacheWriter.upsertBatch(syncedAt, rows);
    }

    private EquipoGlpiCache mapToCache(VwInvComputerFull source, LocalDateTime syncedAt) {
        EquipoGlpiCache target = new EquipoGlpiCache();
        target.setComputerId(source.getComputerID());
        target.setNombreEquipo(source.getNombreEquipo());
        target.setNumeroserie(source.getNumeroserie());
        target.setCodigoInterno(source.getCodigoInterno());
        target.setUsuarioContacto(source.getUsuarioContacto());
        target.setUsuarioTelefono(source.getUsuarioTelefono());
        target.setIpEquipo(source.getIpEquipo());
        target.setSedeNombre(source.getSedeNombre());
        target.setSedeNombreCompleto(source.getSedeNombreCompleto());
        target.setOficinaId(source.getOficinaId());
        target.setUnidadId(source.getUnidadId());
        target.setFabricanteEquipo(source.getFabricanteEquipo());
        target.setModeloEquipo(source.getModeloEquipo());
        target.setTipoEquipo(source.getTipoEquipo());
        target.setCpuModelos(source.getCpuModelos());
        target.setCpuFabricantes(source.getCpuFabricantes());
        target.setCpuConteo(source.getCpuConteo());
        target.setCpuNucleos(source.getCpuNucleos());
        target.setCpuHilos(source.getCpuHilos());
        target.setCpuFrecuenciaMax(source.getCpuFrecuenciaMax());
        target.setRamModulos(source.getRamModulos());
        target.setRamTotalGb(source.getRamTotalGb());
        target.setRamFrecuenciaMax(source.getRamFrecuenciaMax());
        target.setRamTipos(source.getRamTipos());
        target.setRamModelos(source.getRamModelos());
        target.setRamFabricantes(source.getRamFabricantes());
        target.setDiskCantidad(source.getDiskCantidad());
        target.setDiskTotalGb(source.getDiskTotalGb());
        target.setDiskTipos(source.getDiskTipos());
        target.setDiskInterfaces(source.getDiskInterfaces());
        target.setDiskModelos(source.getDiskModelos());
        target.setMonCantidad(source.getMonCantidad());
        target.setMonNombres(source.getMonNombres());
        target.setMonModelos(source.getMonModelos());
        target.setMonFabricantes(source.getMonFabricantes());
        target.setMonSeriales(source.getMonSeriales());
        target.setFechaCreacion(source.getFechaCreacion());
        target.setUltimaActualizacion(source.getUltimaActualizacion());
        target.setUltimoEncendido(source.getUltimoEncendido());
        target.setEliminado(source.getEliminado());
        target.setUuidEquipo(source.getUuidEquipo());
        target.setAnydeskId(source.getAnydeskId());
        target.setRustdeskId(source.getRustdeskId());
        target.setTecladoMarca(source.getTecladoMarca());
        target.setTecladoModelo(source.getTecladoModelo());
        target.setTecladoNumeroSerie(source.getTecladoNumeroSerie());
        target.setTecladoCodigoInventario(source.getTecladoCodigoInventario());
        target.setTecladoCodigoPatrimonial(source.getTecladoCodigoPatrimonial());
        target.setMonitor1Nombre(source.getMonitor1Nombre());
        target.setMonitor1Marca(source.getMonitor1Marca());
        target.setMonitor1Modelo(source.getMonitor1Modelo());
        target.setMonitor1Serie(source.getMonitor1Serie());
        target.setMonitor2Nombre(source.getMonitor2Nombre());
        target.setMonitor2Marca(source.getMonitor2Marca());
        target.setMonitor2Modelo(source.getMonitor2Modelo());
        target.setMonitor2Serie(source.getMonitor2Serie());
        target.setSyncedAt(syncedAt);
        return target;
    }

    private void applyRemoteIds(List<VwInvComputerFull> items) {
        List<Long> ids = items.stream().map(VwInvComputerFull::getComputerID).toList();
        if (ids.isEmpty()) return;
        Map<Long, List<GlpiRemoteManagement>> byComputer = remoteManagementRepository
                .findByItemsIdInAndItemtypeAndIsDeleted(ids, "Computer", 0)
                .stream()
                .collect(Collectors.groupingBy(GlpiRemoteManagement::getItemsId));
        items.forEach(item -> {
            List<GlpiRemoteManagement> remotos = byComputer.getOrDefault(item.getComputerID(), List.of());
            item.setAnydeskId(findRemoteId(remotos, "anydesk"));
            item.setRustdeskId(findRemoteId(remotos, "rustdesk"));
        });
    }

    private String findRemoteId(List<GlpiRemoteManagement> remotos, String tipo) {
        return remotos.stream()
                .filter(r -> tipo.equalsIgnoreCase(r.getType()))
                .map(GlpiRemoteManagement::getRemoteId)
                .filter(id -> id != null && !id.isBlank())
                .findFirst()
                .orElse(null);
    }

    private void applyTeclados(List<VwInvComputerFull> items) {
        List<Long> ids = items.stream().map(VwInvComputerFull::getComputerID).toList();
        if (ids.isEmpty()) return;
        Map<Long, GlpiTeclado> byComputer = tecladoRepository.findByItemsIdIn(ids).stream()
                .collect(Collectors.toMap(GlpiTeclado::getItemsId, t -> t, (a, b) -> a));
        items.forEach(item -> {
            GlpiTeclado teclado = byComputer.get(item.getComputerID());
            if (teclado == null) return;
            item.setTecladoMarca(teclado.getMarcafield());
            item.setTecladoModelo(teclado.getModelofield());
            item.setTecladoNumeroSerie(teclado.getNmerodeseriefield());
            item.setTecladoCodigoInventario(teclado.getCdigodeinventariofield());
            item.setTecladoCodigoPatrimonial(teclado.getCdigopatrimonialfield());
        });
    }

    private void applyMonitores(List<VwInvComputerFull> items) {
        List<Long> ids = items.stream().map(VwInvComputerFull::getComputerID).toList();
        if (ids.isEmpty()) return;
        Map<Long, List<GlpiMonitorRow>> byComputer = monitorRepository.findByComputerIds(ids).stream()
                .collect(Collectors.groupingBy(GlpiMonitorRow::getComputerId,
                        LinkedHashMap::new, Collectors.toList()));
        items.forEach(item -> {
            List<GlpiMonitorRow> monitores = byComputer.getOrDefault(item.getComputerID(), List.of());
            if (!monitores.isEmpty()) {
                GlpiMonitorRow m1 = monitores.get(0);
                item.setMonitor1Nombre(m1.getNombre());
                item.setMonitor1Marca(m1.getFabricante());
                item.setMonitor1Modelo(m1.getModelo());
                item.setMonitor1Serie(m1.getSerie());
            }
            if (monitores.size() > 1) {
                GlpiMonitorRow m2 = monitores.get(1);
                item.setMonitor2Nombre(m2.getNombre());
                item.setMonitor2Marca(m2.getFabricante());
                item.setMonitor2Modelo(m2.getModelo());
                item.setMonitor2Serie(m2.getSerie());
            }
        });
    }
}
