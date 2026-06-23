package com.inia.soportedesk.impresoras;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class ImpresoraRepositoryTest {

    @Autowired
    private ImpresoraRepository repository;

    @Test
    void search_bySerie_returnsMatchingImpresora() {
        Impresora impresora = new Impresora();
        impresora.setMarca("HP");
        impresora.setModelo("M404dn");
        impresora.setTipoConexion("USB");
        impresora.setEstado("Activa");
        impresora.setSerie("SN-99887");
        repository.save(impresora);

        List<Impresora> result = repository.search("SN-99887");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getSerie()).isEqualTo("SN-99887");
    }

    @Test
    void search_byCodigoInventario_returnsMatchingImpresora() {
        Impresora impresora = new Impresora();
        impresora.setMarca("Canon");
        impresora.setModelo("LBP6230");
        impresora.setTipoConexion("USB");
        impresora.setEstado("Activa");
        impresora.setCodigoInventario("INV-7766");
        repository.save(impresora);

        List<Impresora> result = repository.search("INV-7766");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getCodigoInventario()).isEqualTo("INV-7766");
    }
}
