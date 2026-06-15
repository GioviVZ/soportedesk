package com.inia.soportedesk.wifi;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "wifi")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Wifi {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String ssid;

    @Column(nullable = false)
    private String clave;

    @Column(nullable = false)
    private String ubicacion;

    @Column(nullable = false)
    private String tipo;

    @Column(nullable = false)
    private String estado;
}
