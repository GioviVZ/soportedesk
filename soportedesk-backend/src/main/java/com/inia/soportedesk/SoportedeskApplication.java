package com.inia.soportedesk;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@EntityScan(basePackages = {
        "com.inia.soportedesk.auth",
        "com.inia.soportedesk.catalogo",
        "com.inia.soportedesk.usuariosred",
        "com.inia.soportedesk.equipos",
        "com.inia.soportedesk.vpn",
        "com.inia.soportedesk.correos",
        "com.inia.soportedesk.impresoras",
        "com.inia.soportedesk.auditoria",
        "com.inia.soportedesk.activedirectory",
        "com.inia.soportedesk.wifi",
        "com.inia.soportedesk.licencias",
        "com.inia.soportedesk.herramientas",
        "com.inia.soportedesk.gestiontiinia"
})
@EnableJpaRepositories(basePackages = {
        "com.inia.soportedesk.auth",
        "com.inia.soportedesk.catalogo",
        "com.inia.soportedesk.usuariosred",
        "com.inia.soportedesk.equipos",
        "com.inia.soportedesk.vpn",
        "com.inia.soportedesk.correos",
        "com.inia.soportedesk.impresoras",
        "com.inia.soportedesk.auditoria",
        "com.inia.soportedesk.activedirectory",
        "com.inia.soportedesk.wifi",
        "com.inia.soportedesk.licencias",
        "com.inia.soportedesk.herramientas",
        "com.inia.soportedesk.gestiontiinia"
}, entityManagerFactoryRef = "entityManagerFactory", transactionManagerRef = "transactionManager")
public class SoportedeskApplication {
    public static void main(String[] args) {
        SpringApplication.run(SoportedeskApplication.class, args);
    }
}
