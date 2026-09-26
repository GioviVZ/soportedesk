package com.inia.soportedesk.glpi;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface GlpiTecladoRepository extends JpaRepository<GlpiTeclado, Long> {
    Optional<GlpiTeclado> findByItemsId(Long computerId);
    List<GlpiTeclado> findByItemsIdIn(Collection<Long> computerIds);
}
