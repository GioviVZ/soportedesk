package com.inia.soportedesk.catalogo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ModeloImpresoraRepository extends JpaRepository<ModeloImpresora, Long> {

    List<ModeloImpresora> findByMarcaId(Long marcaId);

    @Query("SELECT m FROM ModeloImpresora m WHERE " +
           "LOWER(m.nombre) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(m.marca.nombre) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<ModeloImpresora> search(@Param("search") String search);

    @Query("SELECT m FROM ModeloImpresora m WHERE m.marca.id = :marcaId AND (" +
           "LOWER(m.nombre) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(m.marca.nombre) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<ModeloImpresora> searchByMarcaId(@Param("marcaId") Long marcaId, @Param("search") String search);
}
