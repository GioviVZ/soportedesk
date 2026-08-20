package com.inia.soportedesk.glpi;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface GlpiMonitorRepository extends JpaRepository<GlpiMonitor, Long> {

    @Query(value = """
        SELECT aap.items_id_asset AS computerId, m.id AS monitorId, m.name AS nombre, m.serial AS serie,
               mf.name AS fabricante, mm.name AS modelo
        FROM glpi_assets_assets_peripheralassets aap
        JOIN glpi_monitors m ON m.id = aap.items_id_peripheral AND m.is_deleted = 0
        LEFT JOIN glpi_manufacturers mf ON mf.id = m.manufacturers_id
        LEFT JOIN glpi_monitormodels mm ON mm.id = m.monitormodels_id
        WHERE aap.itemtype_asset = 'Computer' AND aap.itemtype_peripheral = 'Monitor'
          AND aap.is_deleted = 0 AND aap.items_id_asset IN (:computerIds)
        ORDER BY aap.items_id_asset, m.id
    """, nativeQuery = true)
    List<GlpiMonitorRow> findByComputerIds(@Param("computerIds") Collection<Long> computerIds);
}
