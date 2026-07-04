package com.inia.soportedesk.catalogo;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TipoEquipoCatalogoRepository extends JpaRepository<TipoEquipoCatalogo, Long> {
    List<TipoEquipoCatalogo> findByActivoTrue();
    Optional<TipoEquipoCatalogo> findByGlpiValorAndActivoTrue(String glpiValor);
}
