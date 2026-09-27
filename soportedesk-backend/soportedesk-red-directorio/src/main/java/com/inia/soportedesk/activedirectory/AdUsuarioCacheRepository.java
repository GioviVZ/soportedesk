package com.inia.soportedesk.activedirectory;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface AdUsuarioCacheRepository extends JpaRepository<AdUsuarioCache, String> {
    Optional<AdUsuarioCache> findFirstBySamAccountNameIgnoreCase(String samAccountName);

    Optional<AdUsuarioCache> findFirstByMailIgnoreCase(String mail);

    boolean existsByMailIgnoreCase(String mail);

    @Query("SELECT LOWER(u.mail) FROM AdUsuarioCache u WHERE u.mail IS NOT NULL AND TRIM(u.mail) <> ''")
    List<String> findAllMailAddresses();

    @Query("""
            SELECT u FROM AdUsuarioCache u
            WHERE u.displayName IS NULL OR TRIM(u.displayName) = ''
            ORDER BY u.samAccountName
            """)
    List<AdUsuarioCache> findNameless(Pageable pageable);

    @Query("""
            SELECT u FROM AdUsuarioCache u
            WHERE (:q IS NULL OR
                   LOWER(u.samAccountName) LIKE LOWER(CONCAT('%', :q, '%')) OR
                   LOWER(COALESCE(u.displayName, '')) LIKE LOWER(CONCAT('%', :q, '%')) OR
                   LOWER(COALESCE(u.givenName, '')) LIKE LOWER(CONCAT('%', :q, '%')) OR
                   LOWER(COALESCE(u.surname, '')) LIKE LOWER(CONCAT('%', :q, '%')) OR
                   LOWER(COALESCE(u.mail, '')) LIKE LOWER(CONCAT('%', :q, '%')) OR
                   LOWER(COALESCE(u.userPrincipalName, '')) LIKE LOWER(CONCAT('%', :q, '%')) OR
                   LOWER(COALESCE(u.office, '')) LIKE LOWER(CONCAT('%', :q, '%')) OR
                   LOWER(COALESCE(u.department, '')) LIKE LOWER(CONCAT('%', :q, '%')) OR
                   LOWER(COALESCE(u.title, '')) LIKE LOWER(CONCAT('%', :q, '%')) OR
                   LOWER(COALESCE(u.organizationalUnit, '')) LIKE LOWER(CONCAT('%', :q, '%')))
              AND (:usuario IS NULL OR
                   LOWER(u.samAccountName) LIKE LOWER(CONCAT('%', :usuario, '%')) OR
                   LOWER(COALESCE(u.userPrincipalName, '')) LIKE LOWER(CONCAT('%', :usuario, '%')) OR
                   LOWER(COALESCE(u.mail, '')) LIKE LOWER(CONCAT('%', :usuario, '%')))
              AND (:nombre IS NULL OR
                   LOWER(COALESCE(u.displayName, '')) LIKE LOWER(CONCAT('%', :nombre, '%')) OR
                   LOWER(COALESCE(u.givenName, '')) LIKE LOWER(CONCAT('%', :nombre, '%')) OR
                   LOWER(COALESCE(u.surname, '')) LIKE LOWER(CONCAT('%', :nombre, '%')) OR
                   LOWER(COALESCE(u.mail, '')) LIKE LOWER(CONCAT('%', :nombre, '%')))
              AND (:oficina IS NULL OR LOWER(CASE WHEN u.office IS NULL OR TRIM(u.office) = '' THEN 'Sin oficina' ELSE u.office END) LIKE LOWER(CONCAT('%', :oficina, '%')))
              AND (:ou IS NULL OR LOWER(CASE WHEN u.organizationalUnit IS NULL OR TRIM(u.organizationalUnit) = '' THEN 'Sin OU' ELSE u.organizationalUnit END) LIKE LOWER(CONCAT('%', :ou, '%')))
              AND (:enabled IS NULL OR u.enabled = :enabled)
              AND (:locked IS NULL OR u.locked = :locked)
            ORDER BY u.samAccountName
            """)
    List<AdUsuarioCache> search(@Param("q") String q,
                                @Param("usuario") String usuario,
                                @Param("nombre") String nombre,
                                @Param("oficina") String oficina,
                                @Param("ou") String ou,
                                @Param("enabled") Boolean enabled,
                                @Param("locked") Boolean locked,
                                Pageable pageable);

    @Query("""
            SELECT u FROM AdUsuarioCache u
            WHERE LOWER(u.samAccountName) LIKE LOWER(CONCAT('%', :accountTerm, '%')) OR
                  LOWER(COALESCE(u.userPrincipalName, '')) LIKE LOWER(CONCAT('%', :term, '%')) OR
                  LOWER(COALESCE(u.userPrincipalName, '')) LIKE LOWER(CONCAT('%', :accountTerm, '%')) OR
                  LOWER(COALESCE(u.displayName, '')) LIKE LOWER(CONCAT('%', :term, '%')) OR
                  LOWER(COALESCE(u.givenName, '')) LIKE LOWER(CONCAT('%', :term, '%')) OR
                  LOWER(COALESCE(u.surname, '')) LIKE LOWER(CONCAT('%', :term, '%')) OR
                  LOWER(COALESCE(u.mail, '')) LIKE LOWER(CONCAT('%', :term, '%')) OR
                  LOWER(COALESCE(u.department, '')) LIKE LOWER(CONCAT('%', :term, '%')) OR
                  LOWER(COALESCE(u.company, '')) LIKE LOWER(CONCAT('%', :term, '%')) OR
                  LOWER(COALESCE(u.title, '')) LIKE LOWER(CONCAT('%', :term, '%')) OR
                  LOWER(COALESCE(u.telephoneNumber, '')) LIKE LOWER(CONCAT('%', :term, '%')) OR
                  LOWER(COALESCE(u.mobile, '')) LIKE LOWER(CONCAT('%', :term, '%')) OR
                  LOWER(COALESCE(u.office, '')) LIKE LOWER(CONCAT('%', :term, '%')) OR
                  LOWER(COALESCE(u.description, '')) LIKE LOWER(CONCAT('%', :term, '%')) OR
                  LOWER(COALESCE(u.distinguishedName, '')) LIKE LOWER(CONCAT('%', :term, '%')) OR
                  LOWER(COALESCE(u.organizationalUnit, '')) LIKE LOWER(CONCAT('%', :term, '%')) OR
                  LOWER(COALESCE(u.whenCreated, '')) LIKE LOWER(CONCAT('%', :term, '%')) OR
                  LOWER(COALESCE(u.whenChanged, '')) LIKE LOWER(CONCAT('%', :term, '%')) OR
                  LOWER(COALESCE(u.pwdLastSet, '')) LIKE LOWER(CONCAT('%', :term, '%')) OR
                  LOWER(COALESCE(u.lastLogonTimestamp, '')) LIKE LOWER(CONCAT('%', :term, '%')) OR
                  LOWER(COALESCE(u.accountExpires, '')) LIKE LOWER(CONCAT('%', :term, '%')) OR
                  LOWER(COALESCE(u.badPwdCount, '')) LIKE LOWER(CONCAT('%', :term, '%'))
            ORDER BY u.samAccountName
            """)
    List<AdUsuarioCache> consultaSearch(@Param("term") String term,
                                        @Param("accountTerm") String accountTerm,
                                        Pageable pageable);

    @Query("""
            SELECT u FROM AdUsuarioCache u
            WHERE u.enabled = true
              AND (:term IS NULL OR :term = '' OR
                   LOWER(u.samAccountName) LIKE LOWER(CONCAT('%', :accountTerm, '%')) OR
                   LOWER(COALESCE(u.userPrincipalName, '')) LIKE LOWER(CONCAT('%', :term, '%')) OR
                   LOWER(COALESCE(u.userPrincipalName, '')) LIKE LOWER(CONCAT('%', :accountTerm, '%')) OR
                   LOWER(COALESCE(u.displayName, '')) LIKE LOWER(CONCAT('%', :term, '%')) OR
                   LOWER(COALESCE(u.givenName, '')) LIKE LOWER(CONCAT('%', :term, '%')) OR
                   LOWER(COALESCE(u.surname, '')) LIKE LOWER(CONCAT('%', :term, '%')) OR
                   LOWER(COALESCE(u.mail, '')) LIKE LOWER(CONCAT('%', :term, '%')) OR
                   LOWER(COALESCE(u.office, '')) LIKE LOWER(CONCAT('%', :term, '%')) OR
                   LOWER(COALESCE(u.organizationalUnit, '')) LIKE LOWER(CONCAT('%', :term, '%')))
            ORDER BY u.samAccountName
            """)
    List<AdUsuarioCache> autocompleteEnabled(@Param("term") String term,
                                             @Param("accountTerm") String accountTerm,
                                             Pageable pageable);

    long countByEnabledTrue();

    long countByEnabledFalse();

    long countByLockedTrue();

    @Query("SELECT COALESCE(u.organizationalUnit, 'Sin OU'), COUNT(u) FROM AdUsuarioCache u WHERE u.enabled = true GROUP BY u.organizationalUnit")
    List<Object[]> countEnabledByOu();

    @Query("""
            SELECT CASE WHEN u.organizationalUnit IS NULL OR TRIM(u.organizationalUnit) = '' THEN 'Sin OU' ELSE u.organizationalUnit END,
                   CASE WHEN u.enabled = true THEN 'Activo' ELSE 'Inactivo' END,
                   COUNT(u)
            FROM AdUsuarioCache u
            GROUP BY CASE WHEN u.organizationalUnit IS NULL OR TRIM(u.organizationalUnit) = '' THEN 'Sin OU' ELSE u.organizationalUnit END,
                     CASE WHEN u.enabled = true THEN 'Activo' ELSE 'Inactivo' END
            """)
    List<Object[]> countGroupedByOuAndEnabled();

    @Query("""
            SELECT CASE WHEN u.office IS NULL OR TRIM(u.office) = '' THEN 'Sin oficina' ELSE u.office END,
                   CASE WHEN u.enabled = true THEN 'Activo' ELSE 'Inactivo' END,
                   COUNT(u)
            FROM AdUsuarioCache u
            GROUP BY CASE WHEN u.office IS NULL OR TRIM(u.office) = '' THEN 'Sin oficina' ELSE u.office END,
                     CASE WHEN u.enabled = true THEN 'Activo' ELSE 'Inactivo' END
            """)
    List<Object[]> countGroupedByOfficeAndEnabled();

    @Query("""
            SELECT CASE WHEN u.organizationalUnit IS NULL OR TRIM(u.organizationalUnit) = '' THEN 'Sin OU' ELSE u.organizationalUnit END, COUNT(u)
            FROM AdUsuarioCache u
            GROUP BY CASE WHEN u.organizationalUnit IS NULL OR TRIM(u.organizationalUnit) = '' THEN 'Sin OU' ELSE u.organizationalUnit END
            ORDER BY CASE WHEN u.organizationalUnit IS NULL OR TRIM(u.organizationalUnit) = '' THEN 'Sin OU' ELSE u.organizationalUnit END
            """)
    List<Object[]> listOrganizationalUnits();

    @Query("""
            SELECT CASE WHEN u.office IS NULL OR TRIM(u.office) = '' THEN 'Sin oficina' ELSE u.office END, COUNT(u)
            FROM AdUsuarioCache u
            GROUP BY CASE WHEN u.office IS NULL OR TRIM(u.office) = '' THEN 'Sin oficina' ELSE u.office END
            ORDER BY CASE WHEN u.office IS NULL OR TRIM(u.office) = '' THEN 'Sin oficina' ELSE u.office END
            """)
    List<Object[]> listOffices();

    long countByDaysSincePasswordChangeGreaterThan(Long days);

    long countByDaysSinceLastLogonGreaterThan(Long days);

    List<AdUsuarioCache> findTop10ByDaysSincePasswordChangeGreaterThanOrderByDaysSincePasswordChangeDesc(Long days);

    List<AdUsuarioCache> findTop10ByDaysSinceLastLogonGreaterThanOrderByDaysSinceLastLogonDesc(Long days);

    List<AdUsuarioCache> findTop10ByLockedTrueOrderByLockoutTimeDesc();

    @Modifying
    @Query("DELETE FROM AdUsuarioCache")
    void deleteAllCached();

    @Modifying
    @Query("DELETE FROM AdUsuarioCache u WHERE u.syncedAt < :cutoff")
    int deleteBySyncedAtBefore(@Param("cutoff") LocalDateTime cutoff);
}
