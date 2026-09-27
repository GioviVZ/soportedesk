package com.inia.soportedesk.auth;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
    name = "permisos",
    uniqueConstraints = @UniqueConstraint(columnNames = {"usuario_id", "modulo"})
)
@Getter
@Setter
@NoArgsConstructor
public class Permiso {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(nullable = false, length = 50)
    private String modulo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private NivelPermiso nivel = NivelPermiso.EDIT;
}
