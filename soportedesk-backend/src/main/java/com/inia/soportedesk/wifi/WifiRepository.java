package com.inia.soportedesk.wifi;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface WifiRepository extends JpaRepository<Wifi, Long> {

    @Query("SELECT w FROM Wifi w WHERE " +
           "LOWER(w.ssid) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(w.ubicacion) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(w.tipo) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<Wifi> search(@Param("search") String search);
}
