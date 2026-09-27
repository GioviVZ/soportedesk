package com.inia.soportedesk.glpi;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GlpiComputerRepository extends JpaRepository<GlpiComputer, Long> {
}
