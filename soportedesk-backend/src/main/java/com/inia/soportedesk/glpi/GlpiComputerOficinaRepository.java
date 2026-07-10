package com.inia.soportedesk.glpi;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GlpiComputerOficinaRepository extends JpaRepository<GlpiComputerOficina, Long> {
    Optional<GlpiComputerOficina> findByItemsId(Long computerId);
}
