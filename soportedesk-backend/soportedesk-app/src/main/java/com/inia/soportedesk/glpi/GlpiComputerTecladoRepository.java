package com.inia.soportedesk.glpi;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GlpiComputerTecladoRepository extends JpaRepository<GlpiComputerTeclado, Long> {
    boolean existsByItemsIdAndItemtype(Long itemsId, String itemtype);

    Optional<GlpiComputerTeclado> findFirstByItemsIdAndItemtype(Long itemsId, String itemtype);
}
