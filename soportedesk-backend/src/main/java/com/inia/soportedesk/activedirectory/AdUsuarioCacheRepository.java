package com.inia.soportedesk.activedirectory;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AdUsuarioCacheRepository extends JpaRepository<AdUsuarioCache, String> {
    Optional<AdUsuarioCache> findFirstBySamAccountNameIgnoreCase(String samAccountName);

    @Query("""
            SELECT u FROM AdUsuarioCache u
            WHERE (:usuario IS NULL OR LOWER(u.samAccountName) LIKE LOWER(CONCAT('%', :usuario, '%')))
              AND (:nombre IS NULL OR
                   LOWER(COALESCE(u.displayName, '')) LIKE LOWER(CONCAT('%', :nombre, '%')) OR
                   LOWER(COALESCE(u.givenName, '')) LIKE LOWER(CONCAT('%', :nombre, '%')) OR
                   LOWER(COALESCE(u.surname, '')) LIKE LOWER(CONCAT('%', :nombre, '%')) OR
                   LOWER(COALESCE(u.mail, '')) LIKE LOWER(CONCAT('%', :nombre, '%')))
              AND (:oficina IS NULL OR
                   LOWER(COALESCE(u.office, '')) LIKE LOWER(CONCAT('%', :oficina, '%')) OR
                   LOWER(COALESCE(u.organizationalUnit, '')) LIKE LOWER(CONCAT('%', :oficina, '%')))
            ORDER BY u.samAccountName
            """)
    List<AdUsuarioCache> search(@Param("usuario") String usuario,
                                @Param("nombre") String nombre,
                                @Param("oficina") String oficina,
                                Pageable pageable);

    @Query("""
            SELECT u FROM AdUsuarioCache u
            WHERE u.enabled = true
              AND (:term IS NULL OR :term = '' OR
                   LOWER(u.samAccountName) LIKE LOWER(CONCAT('%', :term, '%')) OR
                   LOWER(COALESCE(u.displayName, '')) LIKE LOWER(CONCAT('%', :term, '%')) OR
                   LOWER(COALESCE(u.givenName, '')) LIKE LOWER(CONCAT('%', :term, '%')) OR
                   LOWER(COALESCE(u.surname, '')) LIKE LOWER(CONCAT('%', :term, '%')) OR
                   LOWER(COALESCE(u.mail, '')) LIKE LOWER(CONCAT('%', :term, '%')) OR
                   LOWER(COALESCE(u.office, '')) LIKE LOWER(CONCAT('%', :term, '%')) OR
                   LOWER(COALESCE(u.organizationalUnit, '')) LIKE LOWER(CONCAT('%', :term, '%')))
            ORDER BY u.samAccountName
            """)
    List<AdUsuarioCache> autocompleteEnabled(@Param("term") String term, Pageable pageable);

    long countByEnabledTrue();

    long countByEnabledFalse();

    long countByLockedTrue();

    @Query("SELECT COALESCE(u.organizationalUnit, 'Sin OU'), COUNT(u) FROM AdUsuarioCache u WHERE u.enabled = true GROUP BY u.organizationalUnit")
    List<Object[]> countEnabledByOu();

    long countByDaysSincePasswordChangeGreaterThan(Long days);

    long countByDaysSinceLastLogonGreaterThan(Long days);

    List<AdUsuarioCache> findTop10ByDaysSincePasswordChangeGreaterThanOrderByDaysSincePasswordChangeDesc(Long days);

    List<AdUsuarioCache> findTop10ByDaysSinceLastLogonGreaterThanOrderByDaysSinceLastLogonDesc(Long days);

    List<AdUsuarioCache> findTop10ByLockedTrueOrderByLockoutTimeDesc();

    @Modifying
    @Query("DELETE FROM AdUsuarioCache")
    void deleteAllCached();
}
